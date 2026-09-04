import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const key = request.headers.get("x-admin-key") ?? new URL(request.url).searchParams.get("key");
  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return NextResponse.json({ projectRef: url.hostname.split(".")[0], host: url.hostname });
  } catch {
    return NextResponse.json({ error: "La URL de Supabase no está configurada." }, { status: 503 });
  }
}
