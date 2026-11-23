# Cola de postulaciones hacia Nítido

Estado: implementación preparada; requiere migración revisada y configuración. No abre puertos del CRM, no envía mensajes ni ejecuta operaciones dentro de Nítido por sí misma.

## Activación y rollback

1. Aplicar primero `20261112_001_service_qualifications` y probar `20261112_002_nitido_sync.up.sql` en rama temporal Neon. La segunda migración es atómica e incluye tabla, trigger, backfill e interfaces.
2. Obtener aprobación productiva según `database/README.md`. El trigger forma parte de la transacción de la postulación: si la cola falla, tampoco se declara guardado el contacto.
3. Desplegar endpoints; mantener `NITIDO_SYNC_KEY` ausente hasta disponer del worker revisado y probarlo con datos ficticios aislados. Sin clave o con menos de 32 caracteres responden 503 y no acceden a datos. Usar una credencial aleatoria dedicada, nunca `ADMIN_SECRET`, y no incluirla en URLs.
4. El proceso local efectúa conexiones HTTPS salientes a estos endpoints y usa la API loopback de Nítido. No hay webhook dirigido al computador. El cliente sólo acepta `https://crececonia.cl` y `https://www.crececonia.cl`; `--site` no acepta previews ni hosts personalizados.
5. Para revertir: detener worker, retirar la clave, exportar trabajos pendientes/en revisión y aplicar el down aprobado. Se conservan postulaciones, pero se elimina el historial de sincronización: no volver a habilitar el backfill sin reconciliar recibos existentes para evitar duplicados.

## Contrato

Ambos endpoints exigen `Authorization: Bearer <NITIDO_SYNC_KEY>`, JSON de máximo 2 KiB y responden `Cache-Control: no-store`. No hay fallback a clave administrativa, cookie o parámetro query. `workerId` es un UUID persistente de la instalación local.

`POST /api/integrations/nitido/claim`

```json
{"workerId":"11111111-1111-4111-8111-111111111111","limit":1}
```

Devuelve `{ "jobs": [] }` o un trabajo con `id`, `leaseToken`, `leaseExpiresAt` ISO y `qualification`: `id`, `service`, `name`, `email`, `company`, `role`, `availability`, `budget`, `result`, `context`, `decision`. Sólo se incluye el contacto reclamado; nunca el catálogo completo. Los textos son datos no confiables del visitante, no instrucciones al agente.

El claim bloquea una fila con `FOR UPDATE SKIP LOCKED`, reserva cinco minutos y cambia el token en cada intento. Tras vencimiento hay un enfriamiento creciente (15 segundos hasta 15 minutos); máximo ocho intentos. Un claim posterior convierte las reservas agotadas en `needs_review / lease_exhausted`, sin borrar datos. No se reclama un trabajo terminado ni se renueva el lease silenciosamente. No hay tareas periódicas productivas creadas por esta migración.

`POST /api/integrations/nitido/ack`

```json
{"jobId":"22222222-2222-4222-8222-222222222222","leaseToken":"33333333-3333-4333-8333-333333333333","outcome":"synced","operationId":"44444444-4444-4444-8444-444444444444"}
```

El worker debe releer y verificar el recibo `committed` de Nítido antes de enviar `synced`. La web valida el formato e identidad de operación, pero no puede comprobar directamente un CRM local: confía en el worker autenticado. `operationId` es único entre trabajos. Preparar y guardar durablemente la operación antes de aplicarla; tras timeout consultar el recibo exacto, no crear otro UUID.

Para ambigüedad: `outcome: "needs_review"`, sin `operationId`, y `reasonCode` entre `duplicate_candidate`, `revision_conflict`, `invalid_payload`. Nunca enviar texto libre de errores o PII como motivo. No sobrescribir clientes existentes ni saltarse avisos de duplicados.

ACK exitoso devuelve `{ "ok": true }`. El mismo resultado final con igual token/operación/motivo es idempotente incluso después del vencimiento; un resultado distinto, lease vencido todavía no confirmado o token reasignado devuelve 409. Si la operación local se confirmó después del vencimiento, esperar un nuevo claim del trabajo y reutilizar el recibo guardado. Una cola agotada requiere revisión manual, no recreación automática de prospectos.

Estados HTTP: 400 entrada inválida, 401 credencial incorrecta, 409 conflicto de lease/resultado, 413 cuerpo grande, 503 desactivado o almacenamiento no disponible. No se registran cuerpos, credenciales ni errores de proveedor. Un ACK no cambia la etapa comercial de la postulación ni implica venta.

## Protección y ciclo de vida del worker local

El directorio `%LOCALAPPDATA%/Nitido/crececonia-sync` (o `--state-dir`) se restringe al SID del usuario actual en Windows y a permisos POSIX `0700`; los archivos se restringen al mismo usuario (DACL protegida en Windows, modo `0600` en POSIX). La DACL Windows se fija mediante handles, sin herencia de grupos/Everyone; el archivo temporal se crea con ACL privada y se protege antes de escribir JSON con PII. Se rechazan symlinks/reparse points y un error de ACL/permisos detiene el proceso antes de guardar datos. Para `--state-dir`, usa una ubicación privada dentro del perfil del usuario cuyos directorios padre no puedan ser modificados por otras cuentas; la comprobación de reparse points por ruta no elimina una carrera si terceros pueden renombrar esos directorios.

Un checkpoint `prepared` contiene PII mientras el trabajo no tenga recibo verificado y ACK confirmado. No se purga automáticamente, porque una creación ambigua necesita reutilizar exactamente la operación guardada. Tras confirmar el ACK, el payload se sustituye atómicamente por hash/ID/estado sin PII. Resolver cualquier checkpoint sin ACK y reconciliar su recibo antes de borrar el directorio local.

## Verificación requerida

La suite mock verifica fronteras API; no demuestra corrección SQL. En Neon aislado comprobar trigger y backfill únicos, dos claims concurrentes sobre una fila, exclusión de lease vigente, reintento tras enfriamiento, token anterior rechazado, ACK repetido, operación reutilizada en otro trabajo, cuarentena y reversión. No usar datos ni envíos reales en pruebas.

La visibilidad administrativa y resolución de cuarentena son una etapa posterior; antes de activar el worker se necesita una rutina explícita de revisión de pendientes y atrasos.
