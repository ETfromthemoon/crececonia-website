import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/database";
import { flowSign, getFlowBase } from "@/lib/flow";
import { downloadPrivateObject } from "@/lib/private-storage";
import { marketplacePriceSnapshot, marketplaceSandboxEnabled, normalizeBuyerEmail, MAX_MARKETPLACE_PDF_BYTES } from "@/lib/marketplace-checkout";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 2048;

type BookForSale = {
  book_id: string;
  revision_id: string;
  seller_id: string;
  title: string;
  price_minor: string | number;
  price_tax_mode: string;
  storage_key: string;
  sha256: string;
  byte_size: string | number;
};

function siteUrl(): URL | null {
  try {
    const url = new URL(process.env.MARKETPLACE_SITE_URL!);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

async function readCheckoutBody(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); return null; }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}

export async function POST(request: Request) {
  if (!marketplaceSandboxEnabled()) return NextResponse.json({ error: "El pago de libros de terceros aún no está disponible." }, { status: 503 });
  const origin = siteUrl();
  if (!origin) return NextResponse.json({ error: "Configuración de pagos incompleta." }, { status: 503 });

  const body = await readCheckoutBody(request);
  const email = normalizeBuyerEmail(body?.email);
  const bookId = typeof body?.bookId === "string" && /^[0-9a-f-]{36}$/.test(body.bookId) ? body.bookId : null;
  const expectedAmount = body?.expectedAmount;
  const requestId = typeof body?.requestId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId) ? body.requestId.toLowerCase() : null;
  if (!email || !bookId || !requestId || !Number.isSafeInteger(expectedAmount) || Number(expectedAmount) <= 0) {
    return NextResponse.json({ error: "Datos de compra inválidos." }, { status: 400 });
  }
  const digest = createHash("sha256").update(JSON.stringify([email, bookId, expectedAmount])).digest("hex");

  try {
    const [book] = await queryDatabase<BookForSale>(`
      select b.id as book_id, r.id as revision_id, s.id as seller_id,
             r.title, r.price_minor, r.price_tax_mode, a.storage_key,a.sha256,a.byte_size
      from public.marketplace_books b
      join public.marketplace_sellers s on s.id=b.seller_id and s.status='active'
      join public.marketplace_seller_tax_profiles t on t.seller_id=s.id and t.review_status='verified'
      join public.marketplace_book_revisions r on r.id=b.published_revision_id
        and r.book_id=b.id and r.moderation_status='approved' and r.rights_declared_at is not null
      join public.marketplace_assets a on a.revision_id=r.id and a.book_id=b.id
        and a.asset_kind='ebook_pdf' and a.scan_status='ready'
      where b.id=$1 and b.status='published' and b.published_at is not null
      order by a.created_at desc limit 1`, [bookId]);
    if (!book) return NextResponse.json({ error: "Libro no disponible." }, { status: 404 });
    const price = marketplacePriceSnapshot(Number(book.price_minor), book.price_tax_mode);
    if (!price) return NextResponse.json({ error: "La configuración tributaria de este libro requiere revisión." }, { status: 409 });
    if (expectedAmount !== price.price) return NextResponse.json({ error: "El precio cambió. Revisa el total antes de pagar." }, { status: 409 });
    if (!Number.isSafeInteger(Number(book.byte_size)) || Number(book.byte_size) > MAX_MARKETPLACE_PDF_BYTES) {
      return NextResponse.json({ error: "Este archivo supera el tamaño permitido para su entrega." }, { status: 409 });
    }

    // A paid order must never point at a PDF that is absent from private storage.
    const file = await downloadPrivateObject("ebooks", book.storage_key);
    const fileBytes = file.data ? Buffer.from(await file.data.arrayBuffer()) : null;
    if (file.error || !fileBytes || fileBytes.length !== Number(book.byte_size) ||
      fileBytes.subarray(0, 5).toString("ascii") !== "%PDF-" ||
      createHash("sha256").update(fileBytes).digest("hex") !== book.sha256) {
      return NextResponse.json({ error: "Este libro aún no está listo para su entrega." }, { status: 503 });
    }

    const [claim] = await queryDatabase<{ outcome: string; claimed_order_id: string | null }>(
      `select * from public.claim_marketplace_checkout($1::uuid,$2::uuid,$3::char(64),$4,$5::uuid,$6::uuid,$7::uuid,$8,$9::bigint,$10,$11::integer,$12::bigint,$13::integer)`,
      [randomUUID(), requestId, digest, email, book.book_id, book.revision_id, book.seller_id,
        book.storage_key, price.price, price.taxMode, price.taxRateBps, price.tax, price.commission]);
    if (!claim || claim.outcome === "unavailable") return NextResponse.json({ error: "El libro dejó de estar disponible." }, { status: 409 });
    if (claim.outcome === "rate_limited") return NextResponse.json({ error: "Hay demasiados intentos recientes. Inténtalo más tarde." }, { status: 429, headers: { "Retry-After": "3600" } });
    if (claim.outcome === "conflict") return NextResponse.json({ error: "El identificador ya se usó para otra compra." }, { status: 409 });
    const orderId = claim.claimed_order_id;
    if (!orderId) throw new Error("Missing claimed order ID");
    if (claim.outcome === "replay") {
      const [existing] = await queryDatabase<{ flow_checkout_url: string | null; status: string; expires_at: string }>(
        `select flow_checkout_url,status,expires_at from public.marketplace_orders where id=$1`, [orderId]);
      if (existing?.status === "pending" && new Date(existing.expires_at).getTime() > Date.now() && existing.flow_checkout_url) {
        const savedUrl = new URL(existing.flow_checkout_url);
        if (savedUrl.protocol === "https:" && savedUrl.hostname === "sandbox.flow.cl") {
          return NextResponse.json({ redirectUrl: savedUrl.toString(), orderId });
        }
      }
      return NextResponse.json({ error: "Este intento ya fue registrado. Consulta su estado antes de comenzar otro." }, { status: 409, headers: { "Retry-After": "2" } });
    }

    const apiKey = process.env.FLOW_API_KEY!;
    const params = {
      apiKey, commerceOrder: `mkt-${orderId}`, subject: book.title.slice(0, 120),
      currency: "CLP", amount: price.price, email,
      urlConfirmation: new URL("/api/marketplace/flow/confirm", origin).toString(),
      urlReturn: new URL("/ebooks/mercado/resultado", origin).toString(),
      timeout: 1800,
    };
    const form = new URLSearchParams(Object.entries({ ...params, s: flowSign(params, process.env.FLOW_SECRET_KEY!) }).map(([key, value]) => [key, String(value)]));
    let response: Response;
    try {
      response = await fetch(`${getFlowBase()}/payment/create`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form });
    } catch {
      // Flow may have created the order even if the network failed on our side.
      // Keep the manifest pending so a late paid callback can still be reconciled.
      return NextResponse.json({ error: "No se pudo conectar con Flow." }, { status: 502 });
    }
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok || !result || typeof result !== "object" || !("url" in result) || !("token" in result) || typeof result.url !== "string" || typeof result.token !== "string") {
      return NextResponse.json({ error: "Flow no pudo preparar el pago." }, { status: 502 });
    }
    const redirect = new URL(result.url);
    if (redirect.protocol !== "https:" || redirect.hostname !== "sandbox.flow.cl" || !result.token) {
      return NextResponse.json({ error: "Flow respondió con un destino inválido." }, { status: 502 });
    }
    await queryDatabase(`insert into public.marketplace_payments
      (order_id,provider,provider_account_ref,provider_payment_ref,attempt_number,amount_minor)
      values($1,'flow','crececonia',$2,1,$3)
      on conflict (provider,provider_payment_ref) do update
        set provider_payment_ref=excluded.provider_payment_ref
        where marketplace_payments.order_id=excluded.order_id`, [orderId, result.token, price.price]);
    redirect.searchParams.set("token", result.token);
    await queryDatabase(`update public.marketplace_orders set flow_checkout_url=$2
      where id=$1 and status='pending' and flow_checkout_url is null`, [orderId, redirect.toString()]);
    return NextResponse.json({ redirectUrl: redirect.toString(), orderId });
  } catch (error) {
    console.error("[marketplace/checkout] no se pudo crear la orden", error);
    return NextResponse.json({ error: "No pudimos preparar la compra." }, { status: 503 });
  }
}
