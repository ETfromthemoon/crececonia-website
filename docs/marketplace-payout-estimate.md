# Estimación de pago a vendedores

`lib/marketplace/payout-estimate.ts` implementa una función pura para estimar en CLP el desglose de una transacción. La política se recibe como argumento, tiene versión y debe venir de configuración aprobada por el negocio y validada para el caso tributario concreto.

La función no clasifica un ebook como afecto, exento o no gravado. El caller debe entregar una tasa autorizada. `1900` puntos base permite reproducir el ejemplo general de 19%, pero no es una decisión tributaria predeterminada. Tampoco configura una tarifa de pagos.

El simulador y el checkout comparten la regla de las condiciones marketplace-v2. La comisión es el 9 % del precio sin el IVA propio del ebook. Si la venta no lleva IVA, la base es el precio pagado completo. El 19 % de IVA de la comisión se calcula sobre la comisión neta. La orden guarda esa base, la tasa, la comisión total y el IVA incluido en ella. La liquidación descuenta el total de la comisión al confirmar el pago y el costo efectivo de Flow al confirmarlo o conciliarlo. Los pagos de órdenes ya creadas utilizan el cálculo guardado al iniciar su checkout.

## Registro tributario y liquidación

El [artículo 3° bis de la LIVS, explicado por el SII en la Circular 39/2025](https://www.sii.cl/normativa_legislacion/circulares/2025/circu39.pdf), contempla que el operador de una plataforma de intermediación sea contribuyente del IVA de la operación subyacente en ciertos casos; la norma prevé una excepción cuando el vendedor o comprador es contribuyente de IVA. Esa circular trata principalmente ventas remotas de bienes físicos y no resuelve por sí sola la clasificación de ebooks de autores chilenos. El [Oficio SII 1850/2021](https://www4.sii.cl/gabineteAdmInternet/descargaArchivo?acc=download&extension=pdf&id=3fa727c0-543f-4cc8-83c8-4a42b45fb873&mediaType=application%2Fpdf&nombreDocumento=1850-21%2F07%2F2021.pdf) describe comisión y venta por separado, pero es anterior al artículo 3° bis. Por ello, **no se puede asumir que el vendedor siempre emite la boleta ni que la plataforma solo declara el IVA de su comisión**. La clasificación concreta de ebooks, condición tributaria de cada vendedor/comprador, emisor del documento y liquidación deben validarse con un contador tributario chileno antes de habilitar cobro real.

El SII indica que [cada venta requiere un documento tributario según el modelo de emisión y medio de pago](https://www.sii.cl/destacados/operacion_iva/). CrececonIA registrará manualmente la boleta o voucher según corresponda al inicio. Este estimador no emite DTE ni genera F29. La cifra tras apartar IVA es informativa: la aplicación no retiene ese monto automáticamente y puede no coincidir con quien legalmente debe declarar el impuesto.

Para una venta afecta, el documento al comprador respalda el precio completo. Verificar que el RUT del voucher informado por Flow corresponda al emisor definido para la venta y que el documento quede en el Registro de Compras y Ventas correcto, especialmente cuando paga el comprador en la cuenta Flow de CrececonIA. Usar el modelo de emisión declarado para evitar duplicidad. CrececonIA documenta por separado su servicio al autor con factura afecta o liquidación-factura, según el mandato y el procedimiento contable validado. La referencia manual en el panel corresponde al documento de la venta al comprador. El DTE de la comisión se emite y conserva en el sistema contable. [Modelo de emisión del SII](https://www.sii.cl/servicios_online/3532-.html?PC=esb005) · [Liquidación-factura del SII](https://www.sii.cl/destacados/liquidacion_factura/) · [Condiciones de Flow](https://www.flow.cl/terminos.php)

El SII ha tratado la descarga de libros protegidos por derecho de autor como una licencia de uso afecta en el supuesto analizado en su Oficio 300/2012. Revisar el caso concreto antes de aprobar una clasificación sin IVA. [Oficio SII 300/2012](https://www.sii.cl/normativa_legislacion/jurisprudencia_administrativa/ley_impuesto_ventas/2012/ja300.htm)

La fórmula de precio final con impuesto incluido es `neto = redondear(final × 10.000 / (10.000 + tasa))`; el impuesto es el saldo, garantizando que neto + impuesto = final. Para precio neto, se suma el impuesto redondeado. Todas las cantidades son enteros CLP, tasas en puntos base y redondeo half-up usando `bigint`.

Los costos de pasarela y el IVA de la comisión se reciben explícitamente. Si el IVA de uno es desconocido, el estimador devuelve `null` para el total y para el pago al vendedor en lugar de inventar un importe. La reserva tributaria es informativa; solo `saleVatWithheldClp` reduce el depósito y requiere respaldo de una retención efectiva.

Puntos que se revisan por libro o al liquidar:

- Clasificación y emisor del documento por transacción.
- Tarifas reales del medio de pago y su tratamiento tributario.
- Cualquier retención que altere el depósito.

Para $11.900 con IVA incluido, la base es $10.000 y el IVA de la venta es $1.900. La comisión neta es $900, su IVA es $171 y se descuentan $1.071 en total. Quedan $10.829 antes de Flow, o $8.929 como referencia antes de Flow y después de apartar el IVA de la venta. Esta última cifra no incorpora posibles créditos fiscales.
