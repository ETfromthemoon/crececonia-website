# Auditoría de tienda y flujos de ebooks — 2026-08-12

## Resultado

La tienda mantiene operativos sus cuatro ebooks, bundles, checkout Flow, confirmación, entrega por correo, recuperación y descargas privadas. El rediseño no cambia recursos, precios, URLs de producto ni contratos de pago.

## Canales conservados

| Canal | Entrada | Destino | Estado |
| --- | --- | --- | --- |
| Tienda directa | `/ebooks` | Catálogo y rutas | Verificado |
| Producto directo | `/ebook/<slug>` | Landing y checkout | Verificado |
| URLs heredadas | `/ebooks/agentes-de-ia`, `/ebooks/sitios-web-ia` | Redirección canónica | Conservado |
| Home | Popup global | `/ebooks` | Actualizado al catálogo completo |
| Hub educativo | `/aprender` | Recursos y productos | Conservado |
| Hub Instagram | `/ia` | Recursos enlazados desde redes | Conservado |
| Bundles | Tarjetas en `/ebooks` | Landing del libro ancla con `?bundle=<slug>#comprar` | Verificado |
| Recuperación | `/ebook/descargar` | Acceso por email | Verificado |
| Email | Resend | Entrega y enlaces firmados | Verificado por tests y recuperación |
| WhatsApp | Enlaces de contacto existentes | Soporte comercial | Conservado |

## Evidencia operativa

- Suite: 183/183 pruebas aprobadas antes del rediseño.
- Build de producción: aprobado antes del rediseño.
- Storage: los cuatro ebooks activos tienen PDF móvil y A4.
- Flow producción: contrato verificado para `payer`, `status`, `amount`, `flowOrder` y `commerceOrder`.
- Conciliación: 20 pagos confirmados; 17 compras de ebook presentes; 3 movimientos correctamente ignorados; 0 entregas pendientes de recuperar.
- PostHog, últimos 30 días: 152 vistas, 58 interacciones con combo, 39 checkouts iniciados y 7 compras confirmadas. Conversión observada: 4,6 %; uso de combo: 38,2 %.

## Lógica de negocio revisada

- El catálogo es la fuente para disponibilidad, metadata y precios de respaldo.
- El precio efectivo sigue resolviéndose por la capa de precios existente; el rediseño no duplica autoridad comercial.
- Los bundles aplican 10 % con dos libros, 15 % con tres y 20 % con cuatro o más.
- El cross-sell evita recomendar un contenido avanzado como única continuación a alguien sin experiencia declarada.
- Una futura alta de ebook requiere catálogo, PDFs, landing, cross-sell y revisión explícita de bundles. Los bundles nombrados no incorporan automáticamente productos nuevos.
- El popup de home ahora conduce al catálogo completo y no depende del precio o vigencia de un único libro.
- La vista previa de un combo usa los precios vigentes de todos sus libros, igual que el servidor de Flow; esto evita anunciar un total distinto en catálogo y checkout.

## Preparación para anuncios

PostHog ya permite observar el embudo interno, pero no se encontró configuración local de Meta Pixel. Antes de escalar inversión hay que definir la plataforma publicitaria, instalar su medición con consentimiento y validar al menos `ViewContent`, `InitiateCheckout` y `Purchase` sin duplicar conversiones.

No se agregó un identificador ni token ficticio. La integración publicitaria queda bloqueada hasta disponer de las credenciales y decidir si se usará navegador, API de conversiones o ambas con deduplicación.

## Riesgos y siguiente fase

1. La recuperación por email conserva el modelo de confianza actual. Conviene evaluar enlaces de acceso autenticados antes de aumentar mucho el volumen.
2. Los nombres y composición de bundles son manuales; cada nuevo ebook necesita una revisión editorial y comercial.
3. La atribución de campañas debe probarse de extremo a extremo con UTMs y una compra de prueba antes de activar anuncios.
4. No desplegar el rediseño hasta revisar visualmente escritorio y móvil y repetir suite, build y contratos.
