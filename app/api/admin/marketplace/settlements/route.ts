import { isAdminRequest } from "@/lib/admin-session";
import { queryDatabase } from "@/lib/database";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Balance = {
  seller_id: string; display_name: string; ledger_net_minor: string;
  settled_minor: string; available_minor: string; blocked: boolean;
};
type Recorded = { settlement_id: string; inserted: boolean };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const balances = await queryDatabase<Balance>(`
      select seller_id, display_name, ledger_net_minor::text, settled_minor::text,
        available_minor::text, blocked
      from public.marketplace_seller_payout_balances
      order by display_name, seller_id limit 100`);
    return NextResponse.json({ balances }, { headers: { "cache-control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo consultar el saldo de autores." }, { status: 503 });
  }
}

/** Records an external bank payment. This endpoint never transfers money. */
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const sellerId = body?.sellerId;
  const amount = body?.amountMinor;
  const reference = typeof body?.reference === "string" ? body.reference.trim() : null;
  const occurredAt = body?.occurredAt;
  if (typeof sellerId !== "string" || !uuid.test(sellerId) || typeof amount !== "number"
    || !Number.isSafeInteger(amount) || amount <= 0 || amount > 100_000_000 || !reference
    || reference.length < 3 || reference.length > 120 || /[\x00-\x1f<>]/.test(reference)
    || typeof occurredAt !== "string" || !timestamp.test(occurredAt)
    || !Number.isFinite(Date.parse(occurredAt))) {
    return NextResponse.json({ error: "Datos del pago inválidos." }, { status: 400 });
  }
  try {
    const [recorded] = await queryDatabase<Recorded>(`
      select settlement_id, inserted from public.marketplace_record_manual_settlement
        ($1::uuid, $2::bigint, $3::text, $4::timestamptz)`,
      [sellerId, amount, reference, occurredAt]);
    if (!recorded) return NextResponse.json({ error: "No se registró el pago." }, { status: 409 });
    return NextResponse.json({ id: recorded.settlement_id, status: "recorded" }, {
      status: recorded.inserted ? 201 : 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("marketplace settlement")) {
      return NextResponse.json({ error: "Saldo no disponible, referencia duplicada o pago pendiente de conciliación." }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo registrar el pago al autor." }, { status: 503 });
  }
}
