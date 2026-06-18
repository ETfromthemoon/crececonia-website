import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase";

const PDF_PATH = path.join(
  process.cwd(),
  "private",
  "de-cero-a-claude-en-una-semana.pdf"
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  if (!email && !token) {
    return NextResponse.json({ error: "Parámetros requeridos." }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const filterKey = token ? "flow_token" : "email";
  const filterValue = (token ?? email)!;

  const { data } = await db
    .from("ebook_purchases")
    .select("id, email")
    .eq(filterKey, filterValue)
    .maybeSingle();

  if (!data) {
    return NextResponse.json(
      { error: "No encontramos una compra con esos datos." },
      { status: 404 }
    );
  }

  if (!fs.existsSync(PDF_PATH)) {
    return NextResponse.json(
      { error: "El archivo está siendo preparado. Intenta en unos minutos." },
      { status: 503 }
    );
  }

  // Update download stats (fire and forget)
  db.from("ebook_purchases")
    .select("download_count")
    .eq("id", data.id)
    .single()
    .then(({ data: row }) => {
      db.from("ebook_purchases")
        .update({
          download_count: (row?.download_count ?? 0) + 1,
          last_download_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .then(() => {});
    });

  const buffer = fs.readFileSync(PDF_PATH);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="De-cero-a-Claude-en-una-semana.pdf"',
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, no-store",
    },
  });
}
