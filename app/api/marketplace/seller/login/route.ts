import { NextResponse } from "next/server";
import { Resend } from "resend";
import { normalizeSellerEmail, requestSellerLogin, SELLER_CHALLENGE_TTL_MINUTES } from "@/lib/marketplace-seller-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV === "preview") return new Response("El envío está deshabilitado en el preview", { status: 404 });
  if (process.env.MARKETPLACE_PUBLIC_ENABLED === "false") return new Response("El registro de autores está en pausa", { status: 503 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response("Origen inválido", { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return new Response("Solicitud inválida", { status: 400 }); }
  const email = normalizeSellerEmail((body as { email?: unknown } | null)?.email);
  if (!email) return new Response("Correo inválido", { status: 400 });
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return new Response("Servicio temporalmente no disponible", { status: 503 });
  let stage = "challenge";
  try {
    const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const token = await requestSellerLogin(email, ip);
    if (!token) return NextResponse.json({ ok: false }, { status: 429 });

    stage = "resend";
    const site = process.env.MARKETPLACE_SITE_URL?.trim() || "https://www.crececonia.cl";
    const link = new URL("/api/marketplace/seller/verify-link", site);
    link.hash = new URLSearchParams({ token }).toString();
    const intro = `Confirma tu correo para entrar a tu espacio de autor. El enlace vence en ${SELLER_CHALLENGE_TTL_MINUTES} minutos.`;
    const { data, error } = await new Resend(apiKey).emails.send({
      from: "CrececonIA <sergio@crececonia.cl>",
      to: email,
      subject: "Accede a tu espacio de autor en CrececonIA",
      text: `${intro}\n\n${link.href}\n\nSi no pediste acceso, ignora este mensaje.`,
      html: `<p>${intro}</p><p><a href="${link.href}" clicktracking="off">Confirmar correo y entrar</a></p><p>Si no pediste acceso, ignora este mensaje.</p>`,
      tags: [{ name: "category", value: "marketplace_seller_access" }],
    });
    if (error || !data?.id) {
      console.error("marketplace_seller_login_rejected", { status: error?.statusCode ?? null });
      return new Response("Servicio temporalmente no disponible", { status: 503 });
    }
    console.info("marketplace_seller_login_accepted", { messageId: data.id });
    return NextResponse.json({ ok: true });
  } catch {
    console.error("marketplace_seller_login_error", { stage });
    return new Response("Servicio temporalmente no disponible", { status: 503 });
  }
}
