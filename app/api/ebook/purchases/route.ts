export const dynamic = "force-dynamic";

/** La enumeración por email fue reemplazada por POST /api/ebook/recover. */
export async function GET() {
  return new Response(null, { status: 410 });
}
