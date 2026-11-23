# Entrega durable de ebooks: base desactivada (E05-A)

Esta etapa sólo agrega el contrato SQL y el repositorio de acceso. No conecta el webhook, no cambia el envío actual, no crea cron, no migra compras históricas y no envía correos. Una migración aplicada tampoco activa el flujo.

## Inventario comprobado

El 12-11-2026 se consultó exclusivamente el catálogo de PostgreSQL de `crececonia` en el proyecto Neon `dawn-wildflower-77042370`, rama `main`:

- `commerce.ebook_purchases`, `ebook_pending_orders`, `ebook_cupos` y `discount_codes` son tablas; sus equivalentes `public.*` son vistas de compatibilidad.
- Compras: unicidad `(flow_token, resource)`; `flow_order` tiene índice no único. Un bundle genera varias compras.
- Órdenes pendientes: PK `commerce_order`; manifiesto `resources jsonb`.
- Cupos: PK `(resource, tier)`. Descuentos: `code` único.
- La conexión administrativa usa `crececonia_owner`; existen roles legacy `anon`, `authenticated` y `service_role`.

No se leyeron compras, emails ni tokens reales. No se altera ninguna de esas tablas en E05-A.

## Contrato

`commerce.ebook_delivery_jobs` representa un correo de comprador por `(flow_order, buyer_delivery)`, independiente del número de libros. `enqueue_ebook_delivery` devuelve `enqueued` o `existing`; repetir la identidad con otro `commerce_order` o contenido falla y nunca sustituye el original.

El payload congela exactamente `from`, `to`, `subject` y `html` del proveedor, incluidos títulos y enlaces. No se reconstruye desde el catálogo durante un reintento. Un trigger impide cambiar identidad o payload. La key es `ebook-buyer-delivery/<job UUID>`: no incluye email, token de descarga ni datos comerciales.

Las funciones usan privilegios del invocador, sin `SECURITY DEFINER` ni vista pública. Se revocan accesos de `PUBLIC`, `anon` y `authenticated`; sólo el servidor autorizado debe acceder. Payload y filas de claim son privados: no imprimirlos, enviarlos a analytics ni exponerlos en endpoints públicos.

## Estados y concurrencia

- `pending`: registrado, ningún intento.
- `processing`: claim exclusivo mediante `FOR UPDATE SKIP LOCKED`, token UUID nuevo y lease de hasta dos minutos.
- `provider_accepted`: el propietario vigente confirmó un ID del proveedor. No significa recepción en la bandeja ni lectura.
- `retry`: error recuperable/ambiguo, con espera exponencial (30 segundos desde primer fallo).
- `needs_review`: rechazo permanente, cinco intentos agotados o ventana de idempotencia vencida; no vuelve automáticamente a la cola.

Un claim toma hasta 50 trabajos, incrementa intentos y conserva el instante del primer intento. ACK y fallo requieren el token **y** lease vigente; un trabajador antiguo no puede modificar el claim nuevo. Un `false` de ACK significa pérdida de propiedad, no que el proveedor haya rechazado el correo. Un ACK repetido tras completarse también devuelve `false`; el integrador debe consultar/reconciliar el estado antes de interpretar un fallo de red como motivo de envío.

Los errores persistidos son códigos de una lista cerrada. No se guardan respuestas crudas de Resend ni excepciones SQL con emails o links.

El futuro ejecutor debe distinguir el código `concurrent_idempotent_requests` (409 transitorio) del conflicto de payload (409 permanente); el status HTTP por sí solo no basta. Debe reclamar sólo lo que pueda procesar concurrentemente dentro del lease, no tomar 50 correos para enviarlos en serie durante más de dos minutos.

## Idempotencia y resultado incierto

Resend conserva las claves durante **24 horas**, requiere repetir la misma petición y rechaza reutilizar una clave con otro payload. Contrato oficial comprobado: [Idempotency Keys](https://resend.com/docs/dashboard/emails/idempotency-keys).

Esta cola usa un límite conservador de **23 horas desde el primer claim**, incluso si éste falla antes de llamar al proveedor. No se inicia un nuevo claim después de ese límite; un lease próximo al límite se acorta. El futuro ejecutor deberá comprobar que sigue dentro del lease inmediatamente antes de enviar, usar el payload guardado y pasar la key como `idempotencyKey` al SDK. No debe generar claves nuevas para reintentar.

Si Resend aceptó y se perdió la respuesta o el ACK, repetir dentro de la ventana con la misma key permite recuperar la respuesta. Pasada la ventana se exige conciliación manual; no se garantiza exactly-once ni se reenvía automáticamente. Una pausa arbitraria del proceso después de comprobar el lease no puede prevenirse sólo con fencing en PostgreSQL: el ejecutor necesita timeout de red acotado, y el proveedor es la última barrera contra duplicados dentro de su ventana.

## Próxima etapa antes de activación

1. Construir un finalizador de pago que valide Flow y manifiesto, inserte todas las compras y llame **en la misma transacción SQL** a `enqueue_ebook_delivery`, con cupos y canje idempotentes. El helper TypeScript no convierte llamadas independientes en una transacción.
2. Comprobar primero si ya existe un job para la orden y reutilizarlo, antes de regenerar cualquier copy o snapshot. Un callback repetido tras un deploy no debe cambiar el payload ni la key. Para una orden nueva, generar el snapshot con recursos realmente concedidos y sus tokens persistidos, incluidos combos; no inventar tokens desde el catálogo.
3. Mantener historial de aceptación del webhook y conciliación de efectos parciales. No usar sólo logs para cupos/descuentos fallidos.
4. Agregar ejecutor y observabilidad, pruebas de caída después de aceptación y antes de ACK, reconciliación y prueba aislada completa. Aprobar activación separadamente.
5. No backfill ni reenvío masivo de pedidos históricos; el sistema anterior no acredita si cada mensaje fue recibido.

## Verificación SQL obligatoria en Neon aislado

Los tests Vitest sólo verifican validación, parámetros, contratos y no filtración de errores. **No demuestran locks ni semántica SQL.** Antes de producción, aplicar la migración en rama temporal y comprobar:

| Caso | Resultado exigido |
| --- | --- |
| Enqueue concurrente de la misma orden/payload | Una fila, mismo job UUID; ningún payload reemplazado |
| Misma orden con payload distinto | Error de conflicto; fila original intacta |
| Claims paralelos | Ningún trabajo con lease vigente aparece en dos resultados |
| Lease expirado y nuevo claim | Token nuevo; ACK/fallo con token antiguo devuelve false |
| Respuesta aceptada | Guarda provider ID; no vuelve a ser reclamable |
| Fallo transitorio | Retry diferido; antes del vencimiento no se reclama |
| Quinto fallo / quinto lease perdido | needs_review, sin sexto intento |
| Primer intento hace 23h o más | needs_review y ningún reenvío automático |
| Payload/identidad mutados | Trigger rechaza el cambio |
| Rollback de transacción que encola | No queda trabajo parcial |

Los timestamps pueden ajustarse únicamente en la rama de prueba, con datos sintéticos, para evitar esperar horas. Registrar rama, hash del SQL y resultados; no presentar mocks como pruebas de concurrencia.

## Despliegue y reversión

Aplicar `20261112_003_ebook_delivery.up.sql` sólo después de revisión, pruebas aisladas y autorización según `database/README.md`. Las funciones PL/pgSQL contienen puntos y coma internos: no usar un ejecutor que divida indiscriminadamente por `;`.

El down elimina exclusivamente las funciones y tabla nuevas. Antes de usarlo, detener futuros productores/ejecutores y exportar los trabajos; nunca descartar entregas pagadas pendientes. Revertir código no revierte los datos. Como E05-A está desactivado, puede integrarse sin aplicar la migración, siempre que ningún consumidor nuevo lo invoque.
