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
`payment/getStatus`, comprueba estado pagado, orden, monto, moneda CLP, correo y
la referencia de cuenta Flow fijada en la preparación. Rechaza respuestas con
`merchantId` de un comercio asociado porque esta integración aún no configura
ni acredita cuentas integradoras. Si Flow notifica antes de que se registre la
referencia de pago, devuelve un error reintentable sin marcar la orden para
revisión manual. El costo efectivo de pasarela se guarda solo si `fee`,
`taxes` y `balance` de Flow forman una deducción entera y conciliada en CLP;
si faltan o discrepan, permanece nulo hasta la conciliación con el estado de
cuenta del proveedor. No se deduce automáticamente del saldo del vendedor.
Después de estas comprobaciones se registra
el pago y el evento, concede el derecho de acceso y escribe asientos balanceados
e idempotentes. El correo de entrega usa una clave de idempotencia y un enlace
firmado de siete días. La descarga comprueba el derecho activo y lee el PDF
desde Storage privado. Un error de verificación o entrega devuelve 500 para
permitir reintento. La misma entrega se procesa desde
`GET /api/cron/marketplace-delivery` con `Authorization: Bearer $CRON_SECRET`:
reclama hasta cinco eventos vencidos por ejecución, con reserva de dos minutos,
reintento tras cinco minutos y máximo cinco intentos. Los eventos agotados pasan
a `dead_letter` para revisión manual. El endpoint responde 503 si algún envío
del lote falló, sin exponer datos de compradores. La clave de idempotencia de
Resend es estable entre webhook y cron. Programar este endpoint en el cron de
Vercel o invocarlo con un programador autorizado antes de operar; crear la ruta
por sí sola no garantiza ejecución periódica. Hasta configurar
`MARKETPLACE_PUBLIC_ENABLED=true`, responde `skipped` sin consultar Neon.
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

Fuentes: [API de Flow](https://developers.flow.cl/api),
[SII Circular 38/2025](https://www.sii.cl/normativa_legislacion/circulares/2025/circu38.pdf)
y [Operación IVA del SII](https://www.sii.cl/destacados/operacion_iva/).
La determinación del emisor y tratamiento de IVA de cada venta de ebooks chilenos
requiere revisión contable del modelo concreto.
