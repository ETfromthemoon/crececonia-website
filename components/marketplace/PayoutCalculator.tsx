"use client";

import { useId, useMemo, useState } from "react";
import {
  estimateMarketplacePayout,
  type PayoutEstimatePolicy,
} from "@/lib/marketplace/payout-estimate";

// The checkout charges 5% of the final price. The 19% sale VAT is an
// illustrative classification until each book's tax mode is reviewed.
const CURRENT_POLICY: PayoutEstimatePolicy = {
  version: "marketplace-5pct-bruto-v1",
  saleVatBps: 1_900,
  commissionBps: 500,
  commissionBasis: "sale_gross",
  commissionVatBps: 0,
  gatewayFeeBps: 0,
  gatewayFixedFeeNetClp: 0,
  gatewayFeeVatBps: 0,
  saleVatWithheldClp: 0,
};

const clp = (amount: number) => `$${amount.toLocaleString("es-CL")} CLP`;
export default function PayoutCalculator({ priceValue, initialPrice = "11900" }: { priceValue?: string; initialPrice?: string }) {
  const titleId = useId();
  const inputId = useId();
  const helpId = useId();
  const [internalPrice, setInternalPrice] = useState(initialPrice);
  const price = priceValue ?? internalPrice;
  const estimate = useMemo(() => {
    const amountClp = Number(price);
    if (!Number.isSafeInteger(amountClp) || amountClp < 1) return null;
    try {
      return estimateMarketplacePayout(
        { amountClp, includesSaleVat: true },
        CURRENT_POLICY,
      );
    } catch {
      return null;
    }
  }, [price]);

  return (
    <section className="marketplace-calculator" aria-labelledby={titleId}>
      <div className="marketplace-calculator-intro">
        <span>Simulador para autores</span>
        <h2 id={titleId}>Calcula tu venta</h2>
        <p>Ingresa el precio final que pagaría el comprador. El 5 % de CrececonIA se calcula sobre ese precio; el costo real de Flow se conoce después del pago.</p>
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
        <p id={helpId}>Precio final en pesos chilenos. El desglose de IVA supone una venta afecta al 19 % y requiere revisión antes de publicar.</p>

        {estimate ? (
          <dl className="marketplace-estimate-lines">
            <div><dt>Venta neta si corresponde IVA (19 %)</dt><dd>{clp(estimate.saleNetClp)}</dd></div>
            <div><dt>IVA incluido en ese escenario</dt><dd>{clp(estimate.saleVatClp)}</dd></div>
            <div><dt>Comisión CrececonIA (5 % del precio final)</dt><dd>−{clp(estimate.commissionNetClp)}</dd></div>
            <div className="marketplace-estimate-total"><dt>Saldo antes del costo de Flow</dt><dd aria-live="polite">{clp(estimate.saleGrossClp - estimate.commissionNetClp)}</dd></div>
            <div><dt>Costo real de Flow, a cargo del vendedor</dt><dd>Pendiente del pago</dd></div>
            <div><dt>Referencia tras apartar el IVA supuesto</dt><dd>{clp(estimate.saleGrossClp - estimate.commissionNetClp - estimate.saleVatClp)} antes de Flow</dd></div>
            <div className="marketplace-estimate-total"><dt>Liquidación final al vendedor</dt><dd aria-live="polite">Pendiente de Flow y revisión tributaria</dd></div>
          </dl>
        ) : (
          <p className="marketplace-calculator-error" role="status">Ingresa un precio entero positivo en pesos chilenos.</p>
        )}
      </div>

      <aside className="marketplace-calculator-notice">
        <strong>El saldo final se confirma después de la venta.</strong>
        <p>La plataforma cobra 5 % del precio final, sin sumar otro cargo en este cálculo. Flow descuenta su tarifa real al vendedor y esa cifra se concilia tras el pago. El IVA del 19 % es solo una referencia para libros afectos: CrececonIA revisa cada libro y registra el comprobante manualmente. La cifra «tras apartar IVA» no es una retención automática ni una promesa de depósito.</p>
      </aside>
    </section>
  );
}
