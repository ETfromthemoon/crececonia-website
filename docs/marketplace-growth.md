# Crecimiento medible del marketplace de ebooks

## Estado de implementación

El catálogo registra, con permiso de analytics y sin guardar la búsqueda escrita, tres eventos: `marketplace_catalog_search` (longitud y cantidad de resultados por tramos), `marketplace_catalog_filter` y `marketplace_book_selected` (identificador público del libro, estado, filtro y posición). El reporte existente de PostHog agrega los conteos. No son compradores únicos, ingresos ni prueba de incremento de ventas. Las ventas y entregas se confirman desde el servidor y se concilian con Flow y la base de datos.

La recomendación para varios autores está en la PR de venta cruzada; los mensajes de acceso, recuperación y reseña voluntaria están en la PR de posventa. Estas reglas aún requieren integración con catálogo, compra, preferencias y outbox antes de activar campañas. No enviar campañas de marketing con la credencial transaccional ni sin consentimiento.

## Secuencia de mejora

1. **Descubrimiento.** Medir búsquedas con cero resultados y selección de libro por categoría/nivel. Curar sinónimos y etiquetas de IA, tecnología y negocios cuando haya consultas recurrentes; el texto libre no se almacena en PostHog. Para SEO, cada ficha aprobada necesita título, descripción, autor y datos estructurados `Book` coherentes con el contenido visible.
2. **Ficha y confianza.** Mostrar muestra autorizada por el autor, índice, nivel, resultados concretos, formatos y política de acceso. Medir vista de ficha, muestra abierta y comienzo de checkout. No publicar reseñas no verificadas ni escasez no sustentada.
3. **Venta cruzada.** Presentar como máximo dos complementos relevantes en ficha y poscompra. Excluir libros ya comprados, no aprobados o de nivel inadecuado. Mantener diversidad de autores. Mostrar precio total y descuento real antes del pago; no añadir artículos por defecto.
4. **Posventa.** Entregar acceso inmediatamente después de confirmar pago. Ofrecer recuperación, luego una guía de primer uso y una solicitud voluntaria de reseña. Las sugerencias comerciales usan preferencias separadas, enlace de baja y límites de frecuencia. Registrar envío, rebote, queja y baja para detener secuencias.
5. **Autores.** Compartir en su panel vistas, clics y ventas conciliadas por libro, con definición de cada métrica. Los pagos netos y comisiones salen del ledger, nunca de eventos de analytics.

## Experimentos prioritarios

| Hipótesis | Variante | Métrica primaria | Condición de inicio |
| --- | --- | --- | --- |
| Una muestra autorizada ayuda a elegir | Ficha con muestra vs. ficha actual | Órdenes confirmadas por visitantes asignados | Descarga segura y consentimiento del autor |
| Dos complementos relevantes superan una lista genérica | Reglas de recomendación vs. orden editorial actual | Ingreso neto por orden confirmada, con devoluciones | Recomendaciones integradas y precio final visible |
| Un correo de primer uso aumenta el uso del ebook | Correo de ayuda vs. sólo entrega | Primera descarga dentro de 14 días | Outbox, entrega fiable y preferencia transaccional válida |
| Una reseña solicitada después de usar el libro ayuda al descubrimiento | Solicitud a los 14 días vs. ninguna | Reseñas verificadas publicables por compra elegible | Reseñas, moderación y baja operativas |

Predefinir población, asignación estable, duración, métrica primaria, guardrails de reembolsos/quejas y criterio de parada antes de cada experimento. Analizar órdenes confirmadas y cohortes comparables; los cocientes de eventos del reporte semanal son diagnóstico, no evidencia de causalidad. No llamar «ganadora» a una variante con sólo 30 vistas ni activar descuentos por un pico aislado. PostHog documenta [experimentos con variantes y exposición](https://posthog.com/docs/experiments) y [funnels secuenciales](https://posthog.com/docs/product-analytics/funnels); configurarlos cuando el checkout del marketplace registre órdenes reales.

## Dependencias para producción

- Identidad y verificación del vendedor, moderación, contrato de derechos y PDF privado.
- Integración de pago con ledger, política fiscal y liquidación revisadas para Chile. El simulador es una estimación; no emite documentos tributarios.
- Preferencias de comunicaciones, outbox y enlaces de baja probados antes de marketing automatizado.
- Dashboards por autor basados en ventas conciliadas, con acceso acotado al propietario.
