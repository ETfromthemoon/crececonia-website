import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/database";
import { flowSign, getFlowBase } from "@/lib/flow";
import { downloadPrivateObject } from "@/lib/private-storage";
import { marketplacePriceSnapshot, marketplaceSandboxEnabled, normalizeBuyerEmail, MARKETPLACE_COMMISSION_BPS, MARKETPLACE_FLOW_ACCOUNT_REF, MAX_MARKETPLACE_PDF_BYTES } from "@/lib/marketplace-checkout";

export const runtime = "nodejs";

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

export async function POST(request: Request) {
  if (!marketplaceSandboxEnabled()) return NextResponse.json({ error: "El pago de libros de terceros aún no está disponible." }, { status: 503 });
  const origin = siteUrl();
  if (!origin) return NextResponse.json({ error: "Configuración de pagos incompleta." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const email = normalizeBuyerEmail(body?.email);
  const bookId = typeof body?.bookId === "string" && /^[0-9a-f-]{36}$/.test(body.bookId) ? body.bookId : null;
  const expectedAmount = body?.expectedAmount;
  if (!email || !bookId || !Number.isSafeInteger(expectedAmount) || expectedAmount <= 0) {
    return NextResponse.json({ error: "Datos de compra inválidos." }, { status: 400 });
  }

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

    const orderId = randomUUID();
    const [prepared] = await queryDatabase<{ item_id: string }>(`
      with eligible as (
        select b.id as book_id, r.id as revision_id, s.id as seller_id
        from public.marketplace_books b
        join public.marketplace_sellers s on s.id=b.seller_id and s.status='active'
        join public.marketplace_seller_tax_profiles t on t.seller_id=s.id and t.review_status='verified'
        join public.marketplace_book_revisions r on r.id=b.published_revision_id
          and r.book_id=b.id and r.moderation_status='approved' and r.rights_declared_at is not null
        join public.marketplace_assets a on a.revision_id=r.id and a.book_id=b.id
          and a.asset_kind='ebook_pdf' and a.scan_status='ready' and a.storage_key=$3
        where b.id=$2 and b.status='published' and b.published_at is not null
          and r.price_minor=$4 and r.price_tax_mode=$5
        limit 1
      ), new_order as (
        insert into public.marketplace_orders
          (id,buyer_email,status,idempotency_key,subtotal_minor,total_minor,expires_at)
        select $1,$6,'pending',$1,$4,$4,now()+interval '30 minutes' from eligible
        returning id
      ), new_item as (
        insert into public.marketplace_order_items
          (order_id,book_id,revision_id,seller_id,price_minor,tax_mode,tax_rate_bps,
           tax_minor,commission_rate_bps,commission_basis_minor,commission_minor)
        select o.id,e.book_id,e.revision_id,e.seller_id,$4,$5,$7,$8,$9,$4,$10
        from new_order o cross join eligible e
        returning id
      ) select id as item_id from new_item`,
      [orderId, book.book_id, book.storage_key, price.price, price.taxMode, email,
        price.taxRateBps, price.tax, MARKETPLACE_COMMISSION_BPS, price.commission]);
    if (!prepared) return NextResponse.json({ error: "El libro dejó de estar disponible." }, { status: 409 });

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
      values($1,'flow',$4,$2,1,$3)
      on conflict (provider,provider_payment_ref) do update
        set provider_payment_ref=excluded.provider_payment_ref
        where marketplace_payments.order_id=excluded.order_id`, [orderId, result.token, price.price, MARKETPLACE_FLOW_ACCOUNT_REF]);
    redirect.searchParams.set("token", result.token);
    return NextResponse.json({ redirectUrl: redirect.toString(), orderId });
  } catch (error) {
    console.error("[marketplace/checkout] no se pudo crear la orden", error);
    return NextResponse.json({ error: "No pudimos preparar la compra." }, { status: 503 });
  }
}
