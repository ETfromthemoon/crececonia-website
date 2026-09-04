export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ host: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host });
  } catch {
    return Response.json({ host: null }, { status: 503 });
  }
}
