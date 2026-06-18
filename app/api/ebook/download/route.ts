import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase";
import { flowSign, getFlowBase } from "@/lib/flow";

const VALID_FORMATS = ["movil", "a4"] as const;
type Format = (typeof VALID_FORMATS)[number];

function getPdfPath(format: Format): string {
  return path.join(process.cwd(), "private", `libro-${format}.pdf`);
}

function getDownloadFilename(format: Format): string {
  return format === "a4"
    ? "De-cero-a-Claude-en-una-semana-A4.pdf"
    : "De-cero-a-Claude-en-una-semana.pdf";
}

async function verifyTokenWithFlow(token: string): Promise<boolean> {
  try {
    const apiKey = process.env.FLOW_API_KEY;
    const secretKey = process.env.FLOW_SECRET_KEY;
    if (!apiKey || !secretKey) return false;
    const params = { apiKey, token };
    const s = flowSign(params, secretKey);
    const url = `${getFlowBase()}/payment/getStatus?apiKey=${apiKey}&token=${token}&s=${s}`;
    const res = await fetch(url);
    if (!res.ok) return false;
    const payment = await res.json();
    return payment?.status === 2;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const rawFormat = searchParams.get("format") ?? "movil";
  const format: Format = VALID_FORMATS.includes(rawFormat as Format)
    ? (rawFormat as Format)
    : "movil";

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
    if (token) {
      const paid = await verifyTokenWithFlow(token);
      if (!paid) {
        return NextResponse.json(
          { error: "No encontramos una compra con esos datos." },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "No encontramos una compra con esos datos." },
        { status: 404 }
      );
    }
  }

  const pdfPath = getPdfPath(format);

  if (!fs.existsSync(pdfPath)) {
    return NextResponse.json(
      { error: "El archivo está siendo preparado. Intenta en unos minutos." },
      { status: 503 }
    );
  }

  if (data) {
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
  }

  const buffer = fs.readFileSync(pdfPath);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${getDownloadFilename(format)}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, no-store",
    },
  });
}
