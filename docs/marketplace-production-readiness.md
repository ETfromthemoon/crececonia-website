# Estado de producción del marketplace de ebooks

Actualizado: 15 de noviembre de 2026. Alcance inicial: Chile, CLP, IA, tecnología y negocios. CrececonIA recauda en su cuenta Flow, cobra 5 % del precio bruto y asume la emisión o registro tributario que corresponda; el costo real de Flow se atribuye al vendedor.

## Verificado

- Respaldo de Neon anterior al cambio: snapshot `snap-noisy-poetry-ack3ftal` (`pre-marketplace-activation-2026-11-15`) de la rama principal.
- Migraciones `20261112_001`, `20261113_001` a `003` y `20261115_001` a `006` aplicadas en Neon producción tras probarlas en una rama aislada. La consulta posterior mostró 20 tablas `marketplace_*`, diez triggers habilitados y cero funciones de borrador ejecutables por `PUBLIC`. No había pedidos ni comprobaciones de publicación que migrar.
- Publicación de terceros exige aprobación editorial, vendedor y perfil tributario activos, más comprobación final humana con nota y los IDs exactos del PDF y portada. El trigger PostgreSQL rechaza una publicación directa sin esa comprobación y protege la atribución de vendedor. Se ensayaron ambas prohibiciones en una transacción revertida.
- Cada ítem de pedido conserva el ID del PDF aprobado y queda inmutable; la identidad del archivo aprobado también está protegida. La descarga lee ese archivo exacto. La cuenta Flow existente se usa sin `merchantId` ni reparto automático.
- El checkout en vivo requiere `MARKETPLACE_LIVE_ENABLED=true`, `MARKETPLACE_PUBLIC_ENABLED=true`, entorno Vercel de producción, `FLOW_SANDBOX=false` y URL canónica. Ambos flags están apagados actualmente. Un callback ya pagado puede terminar su entrega aunque se apague la venta.
- Existe registro inmutable de evidencia de voucher o boleta emitida fuera de la aplicación. El registro no emite DTE.

## Antes de activar ventas reales

1. Fijar con contador el modelo de emisor, IVA de ebook y comisión, y probar la emisión o aceptación del voucher de Flow por cada transacción. Evitar duplicar boletas cuando el voucher cumple esa función. Documentar notas de crédito, anulaciones y reembolsos. Ver [operación IVA del SII](https://www.sii.cl/destacados/operacion_iva/).
2. Implementar conciliación de la tarifa real de Flow, saldo exigible al vendedor, liquidación y reversos. El 5 % se registra hoy, pero la comisión de pasarela todavía no reduce el saldo del vendedor en el libro contable.
3. Implementar límite distribuido para intentos de checkout y probar pago real de extremo a extremo: creación, callback, evidencia tributaria, correo, descarga, reembolso y conciliación. El checkout continúa apagado mientras falte esto.
4. Conservar evidencia de inicio de actividades y cumplimiento tributario del vendedor al alta y en revisión periódica. Ver [obligaciones SII para plataformas](https://www.sii.cl/destacados/ley_cumplimiento_obligaciones_tributarias/incumplimiento_inicio.html).
5. Resolver escaneo antimalware, cuotas y política de archivos de terceros; probar preferencias y baja antes de automatizar marketing de posventa.
6. Configurar y comprobar las variables `MARKETPLACE_SITE_URL` y `MARKETPLACE_DOWNLOAD_SECRET` en Vercel. Hacer un solo despliegue de preview mediante PR cuando el límite de despliegues permita continuar, conforme a la instrucción vigente de no saturar commits.

## Despliegue

El código y esquema pueden desplegarse con las ventas desactivadas. `MARKETPLACE_PUBLIC_ENABLED` controla la tienda pública; `MARKETPLACE_LIVE_ENABLED` habilita cobros reales solo junto con el resto de requisitos. El merge a `main` despliega automáticamente por integración de Git. No activar el cobro hasta cerrar los puntos anteriores.
