# Checkout del marketplace con cuenta Flow de CrececonIA

El checkout usa la cuenta de comercio Flow de CrececonIA, sin `merchantId` ni
reparto automático. El camino productivo está **apagado por defecto**.

La prueba en sandbox requiere la migración `20261112_001_marketplace_core.up.sql`, `FLOW_SANDBOX=true`,
`MARKETPLACE_FLOW_SANDBOX_ENABLED=true`, `DATABASE_URL`, credenciales Flow,
`RESEND_API_KEY`, Storage privado y un secreto largo y aleatorio en
`MARKETPLACE_DOWNLOAD_SECRET`. `MARKETPLACE_SITE_URL` debe ser una URL HTTPS
pública, accesible por el callback de Flow; un preview protegido por login de
Vercel no sirve para verificar la notificación.

Para abrir nuevos pagos reales se requieren `VERCEL_ENV=production`,
`FLOW_SANDBOX=false`, `MARKETPLACE_PUBLIC_ENABLED=true`,
`MARKETPLACE_LIVE_ENABLED=true` y
`MARKETPLACE_SITE_URL=https://www.crececonia.cl`, además de los secretos,
base y correo anteriores. El redirect de Flow se acepta solo desde
`www.flow.cl` en vivo y `sandbox.flow.cl` en prueba. Apagar la bandera live
detiene órdenes nuevas, pero permite completar pagos ya iniciados.

`POST /api/marketplace/checkout` acepta un libro aprobado y publicado, vendedor
activo, verificación final vigente, PDF y portada exactos aprobados y un precio
tributario revisado (`tax_inclusive` o `exempt`). Requiere las migraciones de
verificación de publicación y de referencia al PDF en el ítem de orden.
Vuelve a leer el precio y el archivo en el servidor antes de crear la orden.
Antes de consultar el libro o descargar el PDF, un contador atómico en Neon
aplica un máximo de 20 intentos por IP y 4 por correo/libro en 15 minutos.
Solo se guardan hashes HMAC; no se guarda la IP ni el correo en claro en esa
tabla. En producción se exige la IP provista por Vercel y, si falta, no se
inicia un cobro. Requiere `20261116_001_marketplace_checkout_limits.up.sql`.
`expectedAmount` es el precio entero en CLP y la discordancia devuelve 409.
La orden conserva el ID del PDF verificado; la entrega debe usar ese mismo
archivo aunque se publique otra revisión después. El ítem, comisión estimada
del 5% sobre precio bruto y desglose
tributario se congelan antes de llamar a Flow. La respuesta entrega el destino
de pago de Flow; no representa una compra confirmada.

Flow notifica a `/api/marketplace/flow/confirm`. El servidor consulta
`payment/getStatus`, comprueba estado pagado, orden, monto, moneda CLP, correo y
la referencia de cuenta Flow fijada en la preparación. Rechaza respuestas con
`merchantId` de un comercio asociado porque esta integración usa solo la cuenta
Flow propia de CrececonIA. Si Flow notifica antes de que se registre la
referencia de pago, devuelve un error reintentable sin marcar la orden para
revisión manual. El costo efectivo de pasarela se guarda solo si `fee`,
`taxes` y `balance` de Flow forman una deducción entera y conciliada en CLP;
si faltan o discrepan, permanece nulo hasta la conciliación con el estado de
cuenta del proveedor. Cuando Flow entrega una tarifa verificable, un asiento
balanceado y repetible reduce el saldo exigible al vendedor y la cuenta de
liquidación de Flow. Si no la entrega, no se debe pagar al vendedor hasta
registrar la tarifa real contra el estado de cuenta del proveedor.
El operador puede registrar una cifra cotejada con el estado de Flow en
`POST /api/admin/marketplace/fees` (`20261116_005`), con referencia del estado
de cuenta y nota de evidencia. Una referencia puede cubrir varios pagos; la
evidencia se identifica por pago. La función transaccional acepta el mismo valor si ya llegó
por el callback, rechaza una cifra contradictoria y garantiza que el débito de
la tarifa aparezca una sola vez en el ledger antes de liquidar al vendedor.
Después de estas comprobaciones se registra
el pago y el evento, concede el derecho de acceso y escribe asientos balanceados
e idempotentes en una sola transacción PostgreSQL
(`20261116_006_marketplace_atomic_payment`). Esa función bloquea primero al
vendedor, por lo que una liquidación o reverso no puede intercalarse a mitad
de la contabilización. El correo de entrega usa una clave de idempotencia y un enlace
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
las credenciales de callback no estén configuradas, responde `skipped` sin consultar Neon.
Si se apaga la venta pública después de cobrar, el cron sigue entregando compras pagadas.
El retorno de Flow muestra un estado de confirmación sin datos personales ni
afirmar que la compra ya se aprobó; pide no repetir el pago mientras llega el
correo. El enlace de siete días se calcula al enviar, también en reintentos.

El importe de comisión y el IVA desglosado siguen sujetos al modelo tributario
aprobado. El endpoint estándar `payment/create` de Flow cobra en una cuenta de
comercio y no reparte automáticamente al vendedor. Este código aún no liquida
dinero ni emite documentos tributarios. CrececonIA puede emitir o respaldar
manualmente la boleta/voucher al comienzo; el registro fiscal del panel debe
vincular la referencia única a cada pago. No pagar a un vendedor sin verificar
que cada venta tenga tarifa real Flow, documento tributario, ausencia de
reembolso/contracargo y un asiento de liquidación balanceado. La ruta
administrativa de reversos solo registra reembolsos completos o contracargos
ya confirmados fuera de esta aplicación; no inicia operaciones en Flow.

### Reversos externos

El operador primero confirma en Flow o con el adquirente que el reembolso total
o contracargo ya ocurrió. Luego registra el ID de pago, referencia externa única,
tipo y nota de evidencia en `POST /api/admin/marketplace/refunds` con sesión
administrativa. La función transaccional `marketplace_record_external_reversal`
(`20261116_004`) bloquea simultáneamente las liquidaciones del mismo vendedor,
inserta el reverso completo una sola vez, revoca el acceso y registra un asiento
inmutable: débito al saldo del vendedor y comisión de CrececonIA; crédito a la
cuenta de Flow. Un callback repetido del pago no restaura el acceso.
El costo de pasarela ya descontado **sigue a cargo del vendedor** después de un
reembolso, salvo que Flow lo devuelva y esa devolución se concilie con un asiento
separado. Si ya se pagó al vendedor, el reverso puede dejar saldo negativo que
requiere recuperación manual. Los reembolsos parciales no se registran por esta
ruta hasta definir prorrateo, derecho de acceso y política de comisiones.

Fuentes: [API de Flow](https://developers.flow.cl/api),
[SII Circular 38/2025](https://www.sii.cl/normativa_legislacion/circulares/2025/circu38.pdf)
y [Operación IVA del SII](https://www.sii.cl/destacados/operacion_iva/).
La determinación del emisor y tratamiento de IVA de cada venta de ebooks chilenos
requiere revisión contable del modelo concreto.
