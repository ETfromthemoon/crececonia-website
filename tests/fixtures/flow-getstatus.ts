/**
 * Respuesta REAL de `GET /payment/getStatus` de Flow, capturada de producción
 * el 2026-08-01 (solo se cambió el email del comprador por uno de prueba).
 *
 * Existe porque el bug más caro que tuvimos fue justamente que el mock de los
 * tests no coincidía con la realidad: el código leía `payment.email`, los
 * tests simulaban `email`, y Flow en realidad devuelve `payer`. Los 114 tests
 * pasaban en verde mientras un comprador real pagaba $17.900 y no recibía el
 * libro.
 *
 * Regla: los tests que simulen a Flow deben construir su respuesta a partir de
 * este fixture, no escribir un objeto a mano. Si Flow cambia su contrato, se
 * actualiza acá y falla en un solo lugar.
 */
export const FLOW_GETSTATUS_PAGADO = {
  flowOrder: 176845578,
  commerceOrder: "ebook-1785594628702-z79khz",
  requestDate: "2026-08-01 10:30:29",
  status: 2, // 1=pendiente 2=pagada 3=rechazada 4=anulada
  subject: "De cero a Claude en una semana",
  currency: "CLP",
  amount: "17900", // ← string, NO number
  payer: "comprador@test.com", // ← el email del comprador vive acá, NO en "email"
  optional: null,
  pending_info: { media: null, date: null },
  paymentData: {
    date: "2026-08-01 10:34:36",
    media: "Webpay",
    conversionDate: null,
    conversionRate: null,
    amount: "17900.00",
    currency: "CLP",
    fee: "571.00",
    balance: 17221,
    transferDate: "2026-08-03 00:00:00",
    taxes: 108,
  },
  merchantId: null,
} as const;

/** Construye una respuesta de Flow con el mismo shape real, variando lo justo. */
export function flowGetStatus(overrides: { status?: number; amount?: number; payer?: string | null } = {}) {
  const { status = 2, amount = 17900, payer = FLOW_GETSTATUS_PAGADO.payer } = overrides;
  const res: Record<string, unknown> = {
    ...FLOW_GETSTATUS_PAGADO,
    status,
    amount: String(amount),
    paymentData: { ...FLOW_GETSTATUS_PAGADO.paymentData, amount: `${amount}.00` },
  };
  // payer: null simula el escenario en que Flow no lo devuelve (no la clave en null,
  // sino ausente) — es lo que rompió la entrega en producción.
  if (payer === null) delete res.payer;
  else res.payer = payer;
  return res;
}
