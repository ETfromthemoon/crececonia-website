# Estimación de pago a vendedores

`lib/marketplace/payout-estimate.ts` implementa una función pura para estimar en CLP el desglose de una transacción. La política se recibe como argumento, tiene versión y debe venir de configuración aprobada por el negocio y validada para el caso tributario concreto.

La función no clasifica un ebook como afecto, exento o no gravado. El caller debe entregar una tasa autorizada. `1900` puntos base permite reproducir el ejemplo general de 19%, pero no es una decisión tributaria predeterminada. Tampoco configura una tarifa de pagos.

La fórmula de precio final con impuesto incluido es `neto = redondear(final × 10.000 / (10.000 + tasa))`; el impuesto es el saldo, garantizando que neto + impuesto = final. Para precio neto, se suma el impuesto redondeado. Todas las cantidades son enteros CLP, tasas en puntos base y redondeo half-up usando `bigint`.

Los costos de pasarela y el IVA de la comisión se reciben explícitamente. Si el IVA de uno es desconocido, el estimador devuelve `null` para el total y para el pago al vendedor en lugar de inventar un importe. La reserva tributaria es informativa; solo `saleVatWithheldClp` reduce el depósito y requiere respaldo de una retención efectiva.

Supuestos comerciales que siguen sin definirse:

- Si el 5% se calcula sobre el precio neto o bruto.
- Si el IVA de la comisión es adicional o está incluido en el 5%.
- Clasificación y emisor del documento por transacción.
- Tarifas reales del medio de pago y su tratamiento tributario.
- Cualquier retención que altere el depósito.

El ejemplo de $11.900 → $10.000 netos + $1.900 de IVA está cubierto por test, usando 5% sobre venta neta, IVA hipotético de 19% en la comisión y una tarifa fija hipotética de pasarela de $300 netos. No representa una cotización de proveedor ni una liquidación definitiva de IVA/F29. Este módulo no emite DTE, no verifica SII y no declara ni paga impuestos.
