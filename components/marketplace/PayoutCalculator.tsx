"use client";

import { useId, useState } from "react";
import { MARKETPLACE_COMMISSION_BPS, marketplaceSaleBreakdown } from "@/lib/marketplace/commission";

const clp = (amount: number) => `$${amount.toLocaleString("es-CL")} CLP`;
export default function PayoutCalculator({ priceValue, initialPrice = "11900" }: { priceValue?: string; initialPrice?: string }) {
  const titleId = useId();
  const inputId = useId();
  const helpId = useId();
  const [internalPrice, setInternalPrice] = useState(initialPrice);
  const [taxMode, setTaxMode] = useState("tax_inclusive");
  const price = priceValue ?? internalPrice;
  const estimate = marketplaceSaleBreakdown(Number(price), taxMode);
  const commissionPercent = MARKETPLACE_COMMISSION_BPS / 100;

  return (
    <section className="marketplace-calculator" aria-labelledby={titleId}>
      <div className="marketplace-calculator-intro">
        <span>Simulador para autores</span>
        <h2 id={titleId}>Calcula tu venta</h2>
        <p>Ingresa el precio final que pagaría el comprador. CrececonIA cobra el {commissionPercent} % sobre el precio sin el IVA del ebook y aplica IVA a su comisión.</p>
      </div>

      <div className="marketplace-calculator-panel">
        {priceValue === undefined && <><label htmlFor={inputId}>Precio final del ebook</label>
        <div className="marketplace-price-input">
          <span aria-hidden="true">$</span>
          <input
            id={inputId}
            type="number"
            min="1"
            max="10000000"
            step="1"
            inputMode="numeric"
            value={price}
            onChange={(event) => setInternalPrice(event.target.value)}
            aria-describedby={helpId}
          />
          <span>CLP</span>
        </div></>}
        <label>
          Escenario tributario del ebook
          <select value={taxMode} onChange={(event) => setTaxMode(event.target.value)}>
            <option value="tax_inclusive">Precio con IVA del 19 % incluido</option>
            <option value="exempt">Precio sin IVA de venta</option>
          </select>
        </label>
        <p id={helpId}>Simulación en pesos chilenos. El tratamiento del ebook se confirma durante la revisión.</p>

        {estimate ? (
          <dl className="marketplace-estimate-lines">
            <div><dt>Precio sin IVA de venta</dt><dd>{clp(estimate.commissionBasis)}</dd></div>
            <div><dt>IVA de la venta del ebook</dt><dd>{clp(estimate.tax)}</dd></div>
            <div><dt>Comisión CrececonIA ({commissionPercent} % de la base)</dt><dd>{clp(estimate.commissionNet)}</dd></div>
            <div><dt>IVA de la comisión (19 %)</dt><dd>{clp(estimate.commissionTax)}</dd></div>
            <div><dt>Descuento total por comisión</dt><dd>−{clp(estimate.commission)}</dd></div>
            <div className="marketplace-estimate-total"><dt>Saldo antes del costo de Flow</dt><dd aria-live="polite">{clp(estimate.price - estimate.commission)}</dd></div>
            <div><dt>Costo real de Flow, a cargo del vendedor</dt><dd>Pendiente del pago</dd></div>
            {estimate.tax > 0 && <div><dt>Referencia tras apartar el IVA de la venta</dt><dd>{clp(estimate.commissionBasis - estimate.commission)} antes de Flow</dd></div>}
            <div className="marketplace-estimate-total"><dt>Liquidación final al vendedor</dt><dd aria-live="polite">Pendiente de Flow y revisión tributaria</dd></div>
          </dl>
        ) : (
          <p className="marketplace-calculator-error" role="status">Ingresa un precio entero entre $1 y $10.000.000 CLP.</p>
        )}
      </div>

      <aside className="marketplace-calculator-notice">
        <strong>El saldo final se confirma después de la venta.</strong>
        <p>La comisión y su IVA se descuentan al confirmar la venta. El vendedor asume el costo efectivo de Flow, que se concilia tras el pago. El IVA de la venta se muestra por separado y su tratamiento se confirma en la revisión tributaria.</p>
      </aside>
    </section>
  );
}
