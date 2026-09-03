/**
 * Detecta compras que Flow cobró pero que nunca se entregaron, y las repara.
 *
 * Existe porque /api/flow/confirm leía `payment.email` cuando Flow entrega el
 * correo en `payment.payer`: el insert en ebook_purchases fallaba en silencio y
 * el comprador nunca recibía el libro. El bug está corregido, pero las compras
 * que ya cayeron en ese agujero hay que repararlas a mano.
 *
 * Cómo detecta el problema: cruza los pagos con status=2 (pagados) de Flow
 * contra las filas de ebook_purchases usando `flow_order`. Lo que está en Flow
 * y no en la tabla, no se entregó.
 *
 * Uso:
 *   npm run ebook:recuperar                 → solo reporta (no toca nada)
 *   npm run ebook:recuperar -- --aplicar    → inserta las compras faltantes
 *   npm run ebook:recuperar -- --aplicar --enviar-email
 *                                          → además le manda el link al comprador
 *
 * Por defecto NO escribe ni envía nada: hay que pedirlo explícitamente.
 *
 * Nota sobre el token: Flow no expone el token del pago en sus consultas
 * (ni getStatusByCommerceId ni getPayments lo devuelven), así que la fila se
 * inserta con un token sintético `recuperado-{flowOrder}`. Por eso la
 * idempotencia de /api/flow/confirm filtra por `flow_order` y no por token: si
 * Flow reintenta el webhook después de esta recuperación, no duplica la compra.
 * El comprador descarga por email en /ebook/.../descargar, vía que no valida
 * el token.
 */
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { determineTier } from "../lib/ebook-pricing";
import { DEFAULT_EBOOK_RESOURCE, getCatalogEntry } from "../lib/ebook-catalog";
import { sendPurchaseNotification } from "../lib/purchase-notification-email";

const PRIMERA_VENTA = "2026-06-18";

interface PagoFlow {
  flowOrder: number;
  commerceOrder: string;
  requestDate: string;
  status: number;
  amount: string;
  payer?: string;
}

function flowSign(params: Record<string, string | number>, secretKey: string): string {
  const toSign = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join("");
  return crypto.createHmac("sha256", secretKey).update(toSign).digest("hex");
}

function diasDesde(desde: string, hasta: Date): string[] {
  const dias: string[] = [];
  for (const d = new Date(desde); d <= hasta; d.setDate(d.getDate() + 1)) {
    dias.push(d.toISOString().slice(0, 10));
  }
  return dias;
}

async function pagosPagadosDelDia(
  base: string,
  apiKey: string,
  secretKey: string,
  date: string
): Promise<PagoFlow[]> {
  const p = { apiKey, date, status: 2, start: 0, limit: 100 };
  const qs = Object.keys(p).sort().map((k) => `${k}=${p[k as keyof typeof p]}`).join("&");
  try {
    const res = await fetch(`${base}/payment/getPayments?${qs}&s=${flowSign(p, secretKey)}`);
    if (!res.ok) return [];
    const j = await res.json();
    return j?.data ?? [];
  } catch {
    return [];
  }
}

/**
 * Un pago de Flow es una compra de ebook reparable solo si su commerceOrder
 * tiene el formato que genera /api/flow/create. Los pagos hechos por otros
 * medios (links manuales de Flow para consultoría, por ejemplo) usan otro
 * formato y no corresponden a un ebook — repararlos insertaría una compra
 * falsa.
 */
function esCompraDeEbook(pago: PagoFlow): boolean {
  return /^ebook-\d+-[a-z0-9]+$/.test(pago.commerceOrder ?? "");
}

/**
 * Piso de monto para descartar pagos de prueba.
 *
 * En producción hay dos pagos de $350 hechos por el dueño para probar el
 * checkout. Pasan el filtro de commerceOrder (salieron del checkout real),
 * pero no son ventas: insertarlos inflaría las ventas registradas y
 * consumiría cupos de un tier con descuento.
 *
 * El piso es un cuarto del tier más barato. Deja pasar compras con código de
 * descuento agresivo, pero no montos simbólicos de prueba. Los pagos que
 * queden por debajo se reportan para revisión manual en vez de descartarse
 * en silencio.
 */
function montoMinimoPlausible(resource: string): number {
  const entry = getCatalogEntry(resource);
  const superEarly = entry && entry.active ? entry.tierPrices.superEarly : 0;
  return Math.round(superEarly / 4);
}

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  const enviarEmail = process.argv.includes("--enviar-email");

  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !secretKey || !supabaseUrl || !supabaseKey) {
    console.error("Faltan FLOW_API_KEY, FLOW_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  const base = process.env.FLOW_SANDBOX === "true" ? "https://sandbox.flow.cl/api" : "https://www.flow.cl/api";
  const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  const { data: compras, error } = await db.from("ebook_purchases").select("flow_order, email");
  if (error) {
    console.error("No se pudo leer ebook_purchases:", error.message);
    process.exit(1);
  }
  const yaEntregadas = new Set((compras ?? []).map((c) => c.flow_order));

  const dias = diasDesde(PRIMERA_VENTA, new Date());
  const pagos: PagoFlow[] = [];
  for (let i = 0; i < dias.length; i += 8) {
    const lote = await Promise.all(
      dias.slice(i, i + 8).map((d) => pagosPagadosDelDia(base, apiKey, secretKey, d))
    );
    pagos.push(...lote.flat());
  }

  const minimo = montoMinimoPlausible(DEFAULT_EBOOK_RESOURCE);
  const sinEntregar = pagos.filter((p) => !yaEntregadas.has(p.flowOrder));
  const reparables = sinEntregar.filter((p) => esCompraDeEbook(p) && Number(p.amount) >= minimo);
  const ignorados = sinEntregar.filter((p) => !esCompraDeEbook(p));
  const montoSospechoso = sinEntregar.filter(
    (p) => esCompraDeEbook(p) && Number(p.amount) < minimo
  );

  console.log(`Pagos confirmados en Flow desde ${PRIMERA_VENTA}: ${pagos.length}`);
  console.log(`Compras ya registradas en la base            : ${compras?.length ?? 0}`);
  console.log(`Pagados sin entregar                         : ${sinEntregar.length}\n`);

  if (ignorados.length) {
    console.log(`Ignorados (commerceOrder no es de este checkout — revisar a mano):`);
    for (const p of ignorados) {
      console.log(`  ${p.requestDate} | ${p.payer ?? "?"} | $${p.amount} | ${p.commerceOrder}`);
    }
    console.log("");
  }

  if (montoSospechoso.length) {
    console.log(`Ignorados por monto menor a $${minimo} (parecen pagos de prueba — revisar a mano):`);
    for (const p of montoSospechoso) {
      console.log(`  ${p.requestDate} | ${p.payer ?? "?"} | $${p.amount} | flowOrder ${p.flowOrder}`);
    }
    console.log("");
  }

  if (!reparables.length) {
    console.log("No hay compras de ebook para recuperar.");
    return;
  }

  console.log(`A recuperar (${reparables.length}):`);
  for (const p of reparables) {
    const monto = Number(p.amount);
    const tier = determineTier(monto, DEFAULT_EBOOK_RESOURCE);
    console.log(`  ${p.requestDate} | ${p.payer ?? "SIN EMAIL"} | $${monto} | tier ${tier} | flowOrder ${p.flowOrder}`);
  }

  if (!aplicar) {
    console.log("\n(dry-run) Nada se escribió. Para aplicar: npm run ebook:recuperar -- --aplicar");
    return;
  }

  console.log("\nAplicando...");
  for (const p of reparables) {
    if (!p.payer) {
      console.log(`  OMITIDO flowOrder ${p.flowOrder}: Flow no devolvió el email del comprador.`);
      continue;
    }
    const monto = Number(p.amount);
    const tier = determineTier(monto, DEFAULT_EBOOK_RESOURCE);
    const { error: insertError } = await db.from("ebook_purchases").insert({
      email: p.payer,
      resource: DEFAULT_EBOOK_RESOURCE,
      amount: monto,
      flow_token: `recuperado-${p.flowOrder}`,
      flow_order: p.flowOrder,
      tier,
      discount_code: null,
    });
    if (insertError) {
      console.log(`  FALLÓ ${p.payer} (flowOrder ${p.flowOrder}): ${insertError.message}`);
      continue;
    }
    console.log(`  OK ${p.payer} — ya puede descargar con su email en /ebook/de-cero-a-claude-en-una-semana/descargar`);

    if (enviarEmail) {
      // Import perezoso: solo se carga si de verdad se va a enviar.
      const { enviarEmailDeRecuperacion } = await import("./enviar-email-recuperacion");
      try {
        await enviarEmailDeRecuperacion(p.payer);
        console.log(`     email enviado a ${p.payer}`);
      } catch (err) {
        console.log(`     NO se pudo enviar el email: ${err instanceof Error ? err.message : err}`);
      }
      try {
        await sendPurchaseNotification({
          kind: "Ebook",
          buyerEmail: p.payer,
          amount: monto,
          orderId: p.commerceOrder,
          items: [DEFAULT_EBOOK_RESOURCE],
        });
        console.log(`     notificación interna enviada para ${p.payer}`);
      } catch (err) {
        console.log(
          `     NO se pudo enviar la notificación interna a ${p.payer}: ${err instanceof Error ? err.message : err}`
        );
      }
    }
  }

  if (!enviarEmail) {
    console.log(
      "\nLas compras quedaron registradas pero NO se avisó a los compradores.\n" +
        "Para enviarles el link: npm run ebook:recuperar -- --aplicar --enviar-email"
    );
  }
}

main().catch((err) => {
  console.error("Falló la recuperación:", err instanceof Error ? err.message : err);
  process.exit(1);
});
