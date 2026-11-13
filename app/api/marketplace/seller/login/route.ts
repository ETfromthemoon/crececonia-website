import { NextResponse } from "next/server";
import { Resend } from "resend";
import { normalizeSellerEmail, requestSellerLogin } from "@/lib/marketplace-seller-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response("Origen inválido", { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return new Response("Solicitud inválida", { status: 400 }); }
  const email = normalizeSellerEmail((body as { email?: unknown } | null)?.email);
  if (!email) return new Response("Correo inválido", { status: 400 });
  if (!process.env.RESEND_API_KEY) return new Response("Servicio temporalmente no disponible", { status: 503 });
  try {
    const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const token = await requestSellerLogin(email, ip);
    if (token) {
      const site = (process.env.SITE_URL ?? "https://www.crececonia.cl").replace(/\/$/, "");
      const link = `${site}/api/marketplace/seller/verify-link#token=${encodeURIComponent(token)}`;
      const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: "CrececonIA <sergio@crececonia.cl>", to: email,
        subject: "Accede a tu espacio de autor en CrececonIA",
        text: `Usa este enlace dentro de 15 minutos para entrar a tu espacio de autor: ${link}\n\nSi no pediste acceso, ignora este mensaje.`,
      });
      if (error) throw new Error("No se pudo enviar el enlace de acceso.");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("marketplace_seller_login_error", error instanceof Error ? error.message : "unknown");
    return new Response("Servicio temporalmente no disponible", { status: 503 });
  }
}
