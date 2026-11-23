# Finalización de pagos: E05-B1/B2 (desactivada por defecto)

E05-B1 aportó el contrato transaccional. B2 conecta webhook, CLI y worker detrás
de flags, sin habilitarlas ni agregar un schedule. No aplicar 003/004 a producción
ni configurar variables durante esta etapa.
La flag `EBOOK_PAYMENT_FINALIZATION_ENABLED` sólo acepta `true`; ausente falla
cerrada en el repositorio. El webhook conserva su camino legacy mientras esté
desactivada; la CLI nueva rechaza `--aplicar` sin flag, conservando su dry-run.
`EBOOK_DELIVERY_WORKER_ENABLED=true` también es necesaria para reclamar/enviar.

## Contrato para B2

El consumidor verifica `status=2`, payer, total y orden contra Flow. Nunca usa
campos entregados por el navegador como prueba de pago. Flow orders se pasan como
strings canónicos para no perder precisión bigint. Recuperación genera un token
criptográfico para grants faltantes; los tokens existentes nunca se reemplazan.

`read_ebook_finalization` devuelve un snapshot consistente: receipt, manifiesto
persistido y grants previos (sin contadores de descargas mutables). El repositorio
comprueba receipt antes de reconstruir copy: un deploy del catálogo no cambia un
job ya finalizado. Si no existe receipt, construye el payload completo con los
tokens persistidos y llama `finalize_ebook_payment` una sola vez por intento.

La función SQL toma advisory lock por Flow order y row lock del manifiesto;
comprueba otra vez receipt antes de comparar snapshot. Un cambio devuelve
`snapshot_changed` sin escrituras; el repositorio relee como máximo tres veces.
Valida recursos únicos, tier, montos enteros positivos y suma pagada, y rechaza
grants extras, duplicados o contradictorios. En una única transacción inserta todos
los grants faltantes, efectos, job y receipt y elimina el pendiente. Errores SQL
inesperados revierten todo. No se inventa un manifiesto para históricos sin él.
Antes de mutar items se bloquean los cupos en orden canónico resource/tier para
evitar deadlocks entre bundles A,B y B,A. Grants y payload conservan su orden.

Los cupos nuevos se consumen sólo si quedan disponibles. Cupo agotado/faltante o
descuento no canjeable dejan `needs_review` durable en efectos, manteniendo acceso
al producto pagado. Para grants históricos no se vuelven a consumir efectos:
se registra `historical_accounting_unknown`. Un descuento de bundle es incidencia,
porque no hay contrato de canje de descuentos para combos en el checkout actual.

Historia previa o fuente recovery produce job `needs_review` sin envío automático,
incluso cuando se completan grants faltantes. No podemos probar si un correo viejo
fue aceptado. B2 debe mostrar esta distinción; `--enviar-email` no puede saltarse la
cuarentena. Un job previo sin receipt es inconsistente y requiere revisión.

El resultado `finalized` significa transacción registrada, no email entregado.
`existing` reconoce el receipt sin duplicar efectos. Owner notice y PostHog en B2
deben ser sólo para `finalized`, con su naturaleza best effort explícita (o tener
outboxes propios). No incluir tokens, payloads ni destinatarios en logs/respuestas.

## Activación y rollback pendientes

Antes de activar: SQL real en Neon aislado y revisión DB/código. TODOS
los escritores, webhook y recuperación CLI, deben usar este protocolo y la misma flag.
No puede coexistir un CLI legado escribiendo mientras el webhook usa el finalizador.
Cerrar recuperación y dejar terminar callbacks viejos durante el cambio de versión;
verificar versión/capacidad de todos los procesos antes de habilitar la flag.

El worker usa exclusivamente payload/key congelados de 003, claim de dos jobs
procesados concurrentemente, timeout HTTP de 20 s y margen de 25 s tanto contra
reloj DB como local antes de cada envío.
Ventana 23 h, cinco intentos; `concurrent_idempotent_requests` se reintenta, conflicto
de payload requiere revisión. ACK incierto requiere readback privado; no crear key
nueva ni reenviar sólo por ACK false. Cron autenticado por CRON_SECRET devuelve
contadores sin PII en `/api/cron/ebook-delivery`; no agregar schedule hasta validar
schema/integración. Hace un solo POST REST por claim, sin reintentos internos SDK.
El guard de servidor permanece en el wrapper web. La CLI inyecta su cliente Neon
al mismo core sin importar `server-only`; ambas rutas serializan el mismo snapshot
y payload como JSON explícito antes de SQL. La CLI ya no tiene sender ni INSERT
legacy; `--enviar-email` sólo explica que el outbox permanece en revisión.

El corte requiere detener/retirar también scripts CLI antiguos y dejar terminar
callbacks del deploy anterior. Primero validar schema003/004 y deploy de TODOS
los consumidores con flags desactivadas. Después habilitar finalización en web y
CLI coordinadamente; nunca habilitar local mientras web siga legacy. Errores con
flag habilitada devuelven retry, nunca fallback. Habilitar worker sólo tras comprobar
receipt/grants/job y permisos en el entorno aprobado. Un schedule es una acción
posterior explícita. Ningún paso de este runbook fue ejecutado en producción.

Owner notice y analytics conservan recursos/atribución del snapshot finalizado y
se intentan sólo en `finalized`, no replay. Son best effort: una caída justo después
del commit puede perder ese aviso/evento, sin perder acceso ni job del comprador.

Contrato REST verificado con documentación oficial de Resend:
[Send Email](https://resend.com/docs/api-reference/emails/send-email) y
[Errors](https://resend.com/docs/api-reference/errors). POST `/emails` devuelve
`{id}`; `Idempotency-Key` conserva la identidad por 24 horas. Un 409
`concurrent_idempotent_requests` es transitorio; otros 409 quedan en revisión.
Timeout/red inciertos se registran como `provider_unknown`; futuros claims conservan
la key y payload. Un ACK falso/error tras aceptación hace readback privado del mismo
provider ID, sin marcar fallo de envío ni realizar otro POST en ese claim.

Rollback: detener workers/consumidores antes de cambiar flag o esquema; exportar y
reconciliar receipts, efectos y jobs aceptados/ambiguos. Desactivar flag y volver al
sender legado sin reconciliación puede duplicar correos. Down004 conserva grants y
jobs003: no revoca acceso ni supone que borrar receipt habilita un nuevo envío.

## Matriz SQL real requerida (los mocks no la reemplazan)

- Dos finalizaciones concurrentes misma orden: un receipt/job y un efecto por item.
- Bundles A,B y B,A concurrentes: ambos finalizan sin deadlock, conservan orden
  de grants y cada cupo aumenta exactamente dos veces si hay disponibilidad.
- Dos órdenes para el mismo commerceOrder: sólo una puede consumir el manifiesto.
- Snapshot de grants/manifiesto modificado: cero escrituras, retry con estado actual.
- Bundle nuevo: todos grants, cupos, descuento, job y receipt o ninguno ante fallo.
- Cupo agotado/descuento vencido: grants completos e incidencia durable.
- Parcial histórico: conserva token previo, agrega faltantes, no reconsume viejo cupo,
  job needs_review; histórico completo no reenvía ni reconsume.
- Replay con copy distinta o pendiente borrado: mismo job, sin efectos adicionales.
- Payer/importe/grants contradictorios, duplicados y manifiesto inválido rechazados.
- Error forzado después de grants: rollback total, incluido cupos/descuento.
