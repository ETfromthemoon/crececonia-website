import { createHash } from "node:crypto";
import { queryDatabase } from "@/lib/database";
import { flowSign, getFlowBase } from "@/lib/flow";
import { marketplaceSandboxConfigured, normalizeBuyerEmail } from "@/lib/marketplace-checkout";

export const runtime = "nodejs";
type FlowStatus = { status: number; payer: string; amount: string | number; flowOrder: number; commerceOrder: string };

async function readSmallBody(request: Request): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); return null; }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function getFlowStatus(token: string): Promise<FlowStatus> {
  const params = { apiKey: process.env.FLOW_API_KEY!, token };
  const url = new URL(`${getFlowBase()}/payment/getStatus`);
  for (const [key, value] of Object.entries({ ...params, s: flowSign(params, process.env.FLOW_SECRET_KEY!) })) url.searchParams.set(key, value);
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("Flow no confirmó el estado de pago.");
  const payment: unknown = await response.json();
  if (!payment || typeof payment !== "object" || !("status" in payment) || typeof payment.status !== "number" || ![1, 2, 3, 4].includes(payment.status)) throw new Error("Estado de Flow inválido.");
  return payment as FlowStatus;
}

export async function POST(request: Request): Promise<Response> {
  if (!marketplaceSandboxConfigured()) return new Response("UNAVAILABLE", { status: 503 });
  try {
    const length = Number(request.headers.get("content-length"));
    if (Number.isFinite(length) && length > 2048) return new Response("BAD REQUEST", { status: 413 });
    const body = await readSmallBody(request);
    if (body === null) return new Response("BAD REQUEST", { status: 413 });
    const token = new URLSearchParams(body).get("token");
    if (!token || token.length > 500) return new Response("BAD REQUEST", { status: 400 });
    const payment = await getFlowStatus(token);
    if (payment.status !== 2) return new Response("OK");
    const match = /^mkt-([0-9a-f-]{36})$/.exec(payment.commerceOrder ?? "");
    const buyer = normalizeBuyerEmail(payment.payer);
    const amount = Number(payment.amount);
    if (!match || !buyer || !Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(payment.flowOrder)) throw new Error("Flow devolvió un pago sin identidad o monto válido.");
    const digest = createHash("sha256").update(`${match[1]}:${token}:${amount}:2`).digest("hex");
    const [record] = await queryDatabase<{ result: string }>("select public.marketplace_confirm_sandbox_payment($1,$2,$3,$4,$5,$6) as result", [match[1], token, payment.flowOrder, amount, buyer, digest]);
    if (record?.result !== "recorded") throw new Error("No se registró el pago.");
    return new Response("OK");
  } catch (error) {
    console.error("[marketplace/flow/confirm] la confirmación requiere reintento", error);
    return new Response("RETRY", { status: 500 });
  }
}
