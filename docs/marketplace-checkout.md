# Checkout de prueba del marketplace

El checkout de libros de terceros funciona **exclusivamente en Flow sandbox**.
Requiere la migración `20261112_001_marketplace_core.up.sql`, `FLOW_SANDBOX=true`,
`MARKETPLACE_FLOW_SANDBOX_ENABLED=true`, `DATABASE_URL`, credenciales Flow,
`RESEND_API_KEY`, Storage privado y un secreto largo y aleatorio en
`MARKETPLACE_DOWNLOAD_SECRET`. `MARKETPLACE_SITE_URL` debe ser una URL HTTPS
pública, accesible por el callback de Flow; un preview protegido por login de
Vercel no sirve para verificar la notificación.

`POST /api/marketplace/checkout` acepta un libro aprobado y publicado, vendedor
activo, PDF listo y un precio tributario revisado (`tax_inclusive` o `exempt`).
Vuelve a leer el precio y el archivo en el servidor antes de crear la orden.
`expectedAmount` es el precio entero en CLP y la discordancia devuelve 409.
La orden, el ítem, comisión estimada del 5% sobre precio bruto y desglose
tributario se congelan antes de llamar a Flow. La respuesta entrega el destino
de pago de Flow; no representa una compra confirmada.

Flow notifica a `/api/marketplace/flow/confirm`. El servidor consulta
`payment/getStatus`, comprueba estado pagado, orden, monto y correo, registra
el pago y el evento, concede el derecho de acceso y escribe asientos balanceados
e idempotentes. El correo de entrega usa una clave de idempotencia y un enlace
firmado de siete días. La descarga comprueba el derecho activo y lee el PDF
desde Storage privado. Un error de verificación o entrega devuelve 500 para
permitir reintento; los fallos persistentes requieren conciliación operativa.
El retorno de Flow muestra un estado de confirmación sin datos personales ni
afirmar que la compra ya se aprobó; pide no repetir el pago mientras llega el
correo. El enlace de siete días se calcula al enviar, también en reintentos.

El importe de comisión y el IVA desglosado son **supuestos de prueba**. El
endpoint estándar `payment/create` de Flow cobra en una cuenta de comercio y
no demuestra reparto automático al vendedor. Este código no liquida dinero,
emite documentos tributarios ni activa ventas reales. Antes de producción se
necesitan: determinación documentada del sujeto obligado a IVA y emisor de
boleta según cada operación, acuerdo de comisión y su base, tratamiento del
IVA de la comisión, contrato de pagos/liquidación con el proveedor, conciliación
de tarifas reales, prueba de migración en base aislada, cobro sandbox completo
con callback público y prueba de reembolso/contracargo. La sola presencia de
credenciales de Flow de producción no abre este checkout.

Fuentes: [Flow payment/create](https://developers.flow.cl/api),
[SII Resolución 84/2025](https://www.sii.cl/normativa_legislacion/resoluciones/2025/reso84.pdf).
