/**
 * Verifica que la API real de Flow siga devolviendo los campos que
 * /api/flow/confirm necesita para entregar el libro.
 *
 * Existe porque un cambio silencioso en esos nombres de campo (o una
 * suposición equivocada sobre ellos) ya causó que un comprador pagara $17.900
 * y no recibiera nada: el código leía `payment.email`, pero Flow entrega el
 * correo en `payment.payer`.
 *
 * Uso:  npm run flow:contract
 *
 * Consulta el pago de una compra real ya confirmada (solo lectura, no cobra
 * ni modifica nada) y compara el shape contra lo que el webhook espera.
 * Requiere FLOW_API_KEY y FLOW_SECRET_KEY en el entorno.
 */
import crypto from "crypto";

// Token de una compra confirmada en producción. Solo se usa para leer el
// estado; si algún día se borra de Flow, cambiar por otro token pagado.
const TOKEN_DE_REFERENCIA = "5C691261C6BB81BB46FF990065FEAE93CF897B3Z";

const CAMPOS_REQUERIDOS = [
  { campo: "payer", motivo: "email del comprador — sin esto no hay a quién entregar" },
  { campo: "status", motivo: "2 = pagada, es lo que gatilla la entrega" },
  { campo: "amount", motivo: "monto pagado (llega como string)" },
  { campo: "flowOrder", motivo: "se guarda en ebook_purchases" },
  { campo: "commerceOrder", motivo: "cruza con ebook_pending_orders" },
] as const;

function flowSign(params: Record<string, string>, secretKey: string): string {
  const toSign = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join("");
  return crypto.createHmac("sha256", secretKey).update(toSign).digest("hex");
}

async function main() {
  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  if (!apiKey || !secretKey) {
    console.error("Faltan FLOW_API_KEY y/o FLOW_SECRET_KEY en el entorno.");
    process.exit(1);
  }

  const base =
    process.env.FLOW_SANDBOX === "true" ? "https://sandbox.flow.cl/api" : "https://www.flow.cl/api";
  const params = { apiKey, token: TOKEN_DE_REFERENCIA };
  const url = `${base}/payment/getStatus?apiKey=${apiKey}&token=${TOKEN_DE_REFERENCIA}&s=${flowSign(params, secretKey)}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Flow respondió HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const payment = await res.json();

  console.log(`Contrato de getStatus de Flow (${base})\n`);
  console.log(`Campos que devuelve: ${Object.keys(payment).join(", ")}\n`);

  let fallos = 0;
  for (const { campo, motivo } of CAMPOS_REQUERIDOS) {
    const presente = payment[campo] !== undefined && payment[campo] !== null;
    console.log(`  ${presente ? "OK  " : "FALTA"}  ${campo.padEnd(14)} ${motivo}`);
    if (!presente) fallos++;
  }

  // El error histórico: asumir que el email viene en `email`.
  if (payment.email !== undefined) {
    console.log(
      "\n  AVISO: Flow ahora devuelve un campo 'email'. Revisar si conviene preferirlo sobre 'payer'."
    );
  }
  if (typeof payment.amount !== "string") {
    console.log(`\n  AVISO: 'amount' ya no es string (ahora ${typeof payment.amount}).`);
  }

  if (fallos > 0) {
    console.error(
      `\nFALLO: ${fallos} campo(s) que /api/flow/confirm necesita ya no vienen. La entrega del ebook está en riesgo.`
    );
    process.exit(1);
  }
  console.log("\nContrato OK — /api/flow/confirm tiene todo lo que necesita para entregar.");
}

main().catch((err) => {
  console.error("Falló el chequeo:", err instanceof Error ? err.message : err);
  process.exit(1);
});
