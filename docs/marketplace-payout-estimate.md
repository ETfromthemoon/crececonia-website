# Estimación de pago a vendedores

`lib/marketplace/payout-estimate.ts` implementa una función pura para estimar en CLP el desglose de una transacción. La política se recibe como argumento, tiene versión y debe venir de configuración aprobada por el negocio y validada para el caso tributario concreto.

La función no clasifica un ebook como afecto, exento o no gravado. El caller debe entregar una tasa autorizada. `1900` puntos base permite reproducir el ejemplo general de 19%, pero no es una decisión tributaria predeterminada. Tampoco configura una tarifa de pagos.

El simulador visible al autor aplica la regla vigente del checkout: CrececonIA recibe el 5 % del precio final bruto. No suma un 19 % adicional a ese descuento ni inventa una tarifa de Flow. Muestra el saldo antes del costo real de la pasarela y deja la liquidación final pendiente de la conciliación del pago. También muestra, por separado, la descomposición de IVA del 19 % como escenario informativo para un libro afecto; cada libro requiere clasificación tributaria antes de publicarse.

## Registro tributario y liquidación

El [artículo 3° bis de la LIVS, explicado por el SII en la Circular 39/2025](https://www.sii.cl/normativa_legislacion/circulares/2025/circu39.pdf), contempla que el operador de una plataforma de intermediación sea contribuyente del IVA de la operación subyacente en ciertos casos; la norma prevé una excepción cuando el vendedor o comprador es contribuyente de IVA. Esa circular trata principalmente ventas remotas de bienes físicos y no resuelve por sí sola la clasificación de ebooks de autores chilenos. El [Oficio SII 1850/2021](https://www4.sii.cl/gabineteAdmInternet/descargaArchivo?acc=download&extension=pdf&id=3fa727c0-543f-4cc8-83c8-4a42b45fb873&mediaType=application%2Fpdf&nombreDocumento=1850-21%2F07%2F2021.pdf) describe comisión y venta por separado, pero es anterior al artículo 3° bis. Por ello, **no se puede asumir que el vendedor siempre emite la boleta ni que la plataforma solo declara el IVA de su comisión**. La clasificación concreta de ebooks, condición tributaria de cada vendedor/comprador, emisor del documento y liquidación deben validarse con un contador tributario chileno antes de habilitar cobro real.

El SII indica que [cada venta requiere un documento tributario según el modelo de emisión y medio de pago](https://www.sii.cl/destacados/operacion_iva/). CrececonIA registrará manualmente la boleta o voucher según corresponda al inicio. Este estimador no emite DTE ni genera F29. La cifra tras apartar IVA es informativa: la aplicación no retiene ese monto automáticamente y puede no coincidir con quien legalmente debe declarar el impuesto.

La fórmula de precio final con impuesto incluido es `neto = redondear(final × 10.000 / (10.000 + tasa))`; el impuesto es el saldo, garantizando que neto + impuesto = final. Para precio neto, se suma el impuesto redondeado. Todas las cantidades son enteros CLP, tasas en puntos base y redondeo half-up usando `bigint`.

Los costos de pasarela y el IVA de la comisión se reciben explícitamente. Si el IVA de uno es desconocido, el estimador devuelve `null` para el total y para el pago al vendedor en lugar de inventar un importe. La reserva tributaria es informativa; solo `saleVatWithheldClp` reduce el depósito y requiere respaldo de una retención efectiva.

Puntos que se revisan por libro o al liquidar:

- Clasificación y emisor del documento por transacción.
- Tarifas reales del medio de pago y su tratamiento tributario.
- Cualquier retención que altere el depósito.

El ejemplo de $11.900 → $10.000 netos + $1.900 de IVA incluido se mantiene como prueba de la función parametrizable. El componente visible prueba la regla comercial actual: $595 de comisión (5 % de $11.900), $11.305 antes de Flow y $9.405 después de apartar hipotéticamente $1.900 de IVA, todavía antes de Flow. Ninguna de esas dos cifras es una promesa de depósito final. Este módulo no emite DTE, no verifica SII y no declara ni paga impuestos.
