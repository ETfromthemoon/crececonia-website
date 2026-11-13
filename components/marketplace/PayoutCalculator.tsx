"use client";

import { useId, useMemo, useState } from "react";
import {
  estimateMarketplacePayout,
  type PayoutEstimatePolicy,
} from "@/lib/marketplace/payout-estimate";

// Explicitly illustrative values from the estimator example. Replace only when
// commercial, tax and provider policies have been approved and versioned.
const EXAMPLE_POLICY: PayoutEstimatePolicy = {
  version: "ejemplo-no-comercial-v1",
  saleVatBps: 1_900,
  commissionBps: 500,
  commissionBasis: "sale_net",
  commissionVatBps: 1_900,
  gatewayFeeBps: 0,
  gatewayFixedFeeNetClp: 300,
  gatewayFeeVatBps: 1_900,
  saleVatWithheldClp: 0,
};

const clp = (amount: number) => `$${amount.toLocaleString("es-CL")} CLP`;

export default function PayoutCalculator({ priceValue }: { priceValue?: string }) {
  const titleId = useId();
  const inputId = useId();
  const helpId = useId();
  const [internalPrice, setInternalPrice] = useState("11900");
  const price = priceValue ?? internalPrice;
  const estimate = useMemo(() => {
    const amountClp = Number(price);
    if (!Number.isSafeInteger(amountClp) || amountClp < 1) return null;
    try {
      return estimateMarketplacePayout(
        { amountClp, includesSaleVat: true },
        EXAMPLE_POLICY,
      );
    } catch {
      return null;
    }
  }, [price]);

  return (
    <section className="marketplace-calculator" aria-labelledby={titleId}>
      <div className="marketplace-calculator-intro">
        <span>Simulador para autores</span>
        <h2 id={titleId}>Calcula un escenario de venta</h2>
        <p>Ingresa el precio final que pagaría el comprador. Los resultados son una demostración con supuestos visibles.</p>
      </div>

      <div className="marketplace-calculator-panel">
        {priceValue === undefined && <><label htmlFor={inputId}>Precio final del ebook</label>
        <div className="marketplace-price-input">
          <span aria-hidden="true">$</span>
          <input
            id={inputId}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={price}
            onChange={(event) => setInternalPrice(event.target.value)}
            aria-describedby={helpId}
          />
          <span>CLP</span>
        </div></>}
        <p id={helpId}>Precio bruto en pesos chilenos, con el IVA de venta supuesto incluido en este ejemplo.</p>

        {estimate ? (
          <dl className="marketplace-estimate-lines">
            <div><dt>Venta neta estimada</dt><dd>{clp(estimate.saleNetClp)}</dd></div>
            <div><dt>IVA de venta supuesto (19%)</dt><dd>{clp(estimate.saleVatClp)}</dd></div>
            <div><dt>Comisión ilustrativa (5% de la venta neta)</dt><dd>−{clp(estimate.commissionTotalEstimateClp ?? 0)}</dd></div>
            <div><dt>Pasarela hipotética (fija $300 + IVA)</dt><dd>−{clp(estimate.gatewayFeeTotalEstimateClp ?? 0)}</dd></div>
            <div className="marketplace-estimate-total"><dt>Depósito ilustrativo al vendedor</dt><dd aria-live="polite">{estimate.sellerPayoutEstimateClp === null ? "Pendiente" : clp(estimate.sellerPayoutEstimateClp)}</dd></div>
            <div><dt>Reserva informativa del IVA de venta</dt><dd>{clp(estimate.sellerSaleVatReserveClp)}</dd></div>
            <div className="marketplace-estimate-total"><dt>Disponible tras esa reserva</dt><dd aria-live="polite">{estimate.sellerAfterVatReserveEstimateClp === null ? "Pendiente" : clp(estimate.sellerAfterVatReserveEstimateClp)}</dd></div>
          </dl>
        ) : (
          <p className="marketplace-calculator-error" role="status">Ingresa un precio entero positivo en pesos chilenos.</p>
        )}
      </div>

      <aside className="marketplace-calculator-notice">
        <strong>Escenario hipotético, no cotización de pago.</strong>
        <p>Usa IVA supuesto de 19%, una comisión de 5% calculada sobre el neto y una tarifa fija de pasarela de $300 más IVA. La tarifa real, la clasificación tributaria y la base de comisión requieren aprobación. La reserva de IVA no es una retención ni el impuesto definitivo del vendedor.</p>
      </aside>
    </section>
  );
}
