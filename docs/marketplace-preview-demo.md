# Recorrido de la demo del marketplace

La demo visual está disponible en despliegues de Vercel Preview (`VERCEL_ENV=preview`). Usa datos de ejemplo y acciones locales para que se puedan evaluar las pantallas sin acceso por correo, sin escribir en Neon y sin iniciar cobros.

1. `/ebooks` presenta el marketplace como una sección de la biblioteca de CrececonIA.
2. `/ebooks/mercado` permite explorar libros de ejemplo por categoría y abrir su ficha. El recorrido de compra es una vista previa; no solicita tarjeta ni inicia Flow.
3. `/ebooks/vender` permite entrar al panel de autor, recorrer inventario, ingresos y publicación simulada, y usar el calculador en CLP.
4. `/admin/marketplace` permite recorrer la revisión editorial con decisiones simuladas. Las acciones del preview no modifican libros ni vendedores reales.

En producción, las páginas públicas del marketplace se mantienen cerradas hasta configurar `MARKETPLACE_PUBLIC_ENABLED=true` tras completar la puesta en marcha. Esta variable controla la visibilidad de páginas y enlaces; no desactiva las API por sí sola. Las pantallas reales usan sus autorizaciones y datos propios. La demo no prueba conciliación de pagos, documentos tributarios, dispersión a vendedores ni entrega posventa. Para operar transacciones reales faltan la migración del marketplace aplicada tras probarse en una rama temporal de Neon, configuración de Flow y validación tributaria/contable del modelo; ver `database/README.md`, `docs/marketplace-checkout.md` y `docs/marketplace-payout-estimate.md`.
