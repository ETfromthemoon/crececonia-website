# Contrato del reporte de analytics

## Interpretación vigente

El reporte es descriptivo, no un embudo secuencial. `funnel`, `byVariant[].conversionRate` y `offerSelectionRate` se conservan por compatibilidad, pero contienen conteos o cocientes de eventos agregados. No representan personas únicas, abandono, causalidad ni significancia estadística. `measurement` lo declara también en JSON. No se emite la antigua alerta «señal accionable» por diferencias de cocientes; el workflow semanal conserva su título normal.

La ventana es UTC, desde `now - días × 24 horas` inclusive hasta `now` exclusivo. Se acotan ambas consultas con los mismos instantes.

## Compras y cobertura

`purchasesByProduct` cubre ebooks, clase y workshop. Cada producto informa:

- `eventCount`: eventos de confirmación, incluidos reintentos.
- `uniqueOrders`: `order_id` distintos no vacíos, normalizados con trim, dentro de la ventana y producto.
- `eventsWithoutOrderId`: eventos sin identificador utilizable, separados porque no pueden deduplicarse de manera fiable.

Los conteos únicos se consultan sin desglose por variante o página para no sumar la misma orden más de una vez. No se exportan IDs de órdenes ni datos personales. Los eventos sin ID no se convierten en ventas supuestas. Las órdenes observadas no son una conciliación con Flow/Neon, compradores únicos ni ingresos; eventos repetidos en ventanas distintas pueden aparecer en ambas.

`ecosystem.purchases` sigue siendo el conteo histórico de eventos de ebooks; la cobertura transversal se consulta en `purchasesByProduct`. Un fallo de la consulta de cobertura falla el reporte completo, en vez de mostrar ceros ficticios.

`ebookOrderConversion` enlaza los eventos `ebook_checkout_created` y `ebook_purchase_confirmed` por `order_id` sin devolver identificadores. Su cohorte contiene órdenes de checkout con ID creadas dentro de la ventana y con al menos 14 días completos antes del fin de ventana. El numerador cuenta sólo órdenes confirmadas después del checkout y antes de cumplirse 14 días; checkouts sin ID quedan fuera del cociente y se informan aparte. Cuando no hay órdenes elegibles, `conversionRate` es `null`, no cero. Es una tasa descriptiva de eventos enlazados observados en PostHog, no una métrica gobernada, atribución por persona ni conciliación contable con Flow/Neon. Las ventanas menores a 14 días no producen una cohorte madura.

El evento histórico `qualification_submitted` mide la apertura del enlace WhatsApp, no el envío del mensaje. Los eventos nuevos `qualification_saved` y `qualification_whatsapp_clicked` se cuentan por separado: registro confirmado y clic de WhatsApp, respectivamente; ninguno confirma envío del mensaje. Las solicitudes de llamada registradas tampoco equivalen a llamadas realizadas.

## Validación

Pruebas locales de compatibilidad, cobertura, errores y formato: `npm test -- tests/posthog-analytics.test.ts tests/posthog-report-format.test.ts`.

El 12 de noviembre de 2026 se validó mediante el conector oficial de PostHog una consulta sintética HogQL con `count`, `uniqExact(nullif(trim(order_id), ''))` y `sum(if(empty(trim(order_id)), 1, 0))`: cuatro filas (dos IDs iguales, vacío y espacios) devolvieron 4 eventos, 1 orden única y 2 eventos sin ID. En esta iteración, la consulta de cohortes pasó primero con filas sintéticas (3 checkouts maduros, 1 confirmación dentro de 14 días y 2 eventos sin ID) y luego con la consulta exacta del reporte sobre una ventana UTC de 30 días; esta última devolvió 0/0 órdenes maduras y 0 eventos sin ID, por lo que no permite estimar conversión actual. Ambas consultas devolvieron agregados solamente; no se consultaron ni exportaron datos personales. Funciones verificadas con la skill oficial `posthog:querying-posthog-data`, referencia `available-functions.md`.

Pendiente de otra etapa: embudo con identidad de persona, pasos ordenados y ventana de conversión explícita; atribución de ingresos conciliados y validación estadística de experimentos. Este cambio no afirma resolverlos.
