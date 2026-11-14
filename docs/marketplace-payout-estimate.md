# Estimación de pago a vendedores

`lib/marketplace/payout-estimate.ts` implementa una función pura para estimar en CLP el desglose de una transacción. La política se recibe como argumento, tiene versión y debe venir de configuración aprobada por el negocio y validada para el caso tributario concreto.

La función no clasifica un ebook como afecto, exento o no gravado. El caller debe entregar una tasa autorizada. `1900` puntos base permite reproducir el ejemplo general de 19%, pero no es una decisión tributaria predeterminada. Tampoco configura una tarifa de pagos.

El simulador visible al autor toma provisionalmente el 5% sobre el precio final bruto, igual que el snapshot del checkout de sandbox. Muestra por separado el IVA hipotético de esa comisión y una tarifa ficticia de pasarela; no promete ese depósito ni fija la política comercial definitiva.

## Validación tributaria pendiente antes de cobrar a terceros

El [artículo 3° bis de la LIVS, explicado por el SII en la Circular 39/2025](https://www.sii.cl/normativa_legislacion/circulares/2025/circu39.pdf), contempla que el operador de una plataforma de intermediación sea contribuyente del IVA de la operación subyacente en ciertos casos; la norma prevé una excepción cuando el vendedor o comprador es contribuyente de IVA. Esa circular trata principalmente ventas remotas de bienes físicos y no resuelve por sí sola la clasificación de ebooks de autores chilenos. El [Oficio SII 1850/2021](https://www4.sii.cl/gabineteAdmInternet/descargaArchivo?acc=download&extension=pdf&id=3fa727c0-543f-4cc8-83c8-4a42b45fb873&mediaType=application%2Fpdf&nombreDocumento=1850-21%2F07%2F2021.pdf) describe comisión y venta por separado, pero es anterior al artículo 3° bis. Por ello, **no se puede asumir que el vendedor siempre emite la boleta ni que la plataforma solo declara el IVA de su comisión**. La clasificación concreta de ebooks, condición tributaria de cada vendedor/comprador, emisor del documento y liquidación deben validarse con un contador tributario chileno antes de habilitar cobro real.

El SII indica que [cada venta requiere un documento tributario según el modelo de emisión y medio de pago](https://www.sii.cl/destacados/operacion_iva/). Este estimador no genera boletas, vouchers, facturas, liquidaciones ni registros para F29. Su reserva de IVA es un escenario informativo y puede no coincidir con el obligado legal a declarar o enterar el impuesto.

La fórmula de precio final con impuesto incluido es `neto = redondear(final × 10.000 / (10.000 + tasa))`; el impuesto es el saldo, garantizando que neto + impuesto = final. Para precio neto, se suma el impuesto redondeado. Todas las cantidades son enteros CLP, tasas en puntos base y redondeo half-up usando `bigint`.

Los costos de pasarela y el IVA de la comisión se reciben explícitamente. Si el IVA de uno es desconocido, el estimador devuelve `null` para el total y para el pago al vendedor en lugar de inventar un importe. La reserva tributaria es informativa; solo `saleVatWithheldClp` reduce el depósito y requiere respaldo de una retención efectiva.

Supuestos comerciales que siguen sin definirse:

- Si el 5% se calcula sobre el precio neto o bruto.
- Si el IVA de la comisión es adicional o está incluido en el 5%.
- Clasificación y emisor del documento por transacción.
- Tarifas reales del medio de pago y su tratamiento tributario.
- Cualquier retención que altere el depósito.

El ejemplo de $11.900 → $10.000 netos + $1.900 de IVA está cubierto por test, usando 5% sobre venta neta, IVA hipotético de 19% en la comisión y una tarifa fija hipotética de pasarela de $300 netos. No representa una cotización de proveedor ni una liquidación definitiva de IVA/F29. Este módulo no emite DTE, no verifica SII y no declara ni paga impuestos.
