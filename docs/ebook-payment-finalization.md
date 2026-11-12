# Finalización de pagos: E05-B1 (inactiva)

Esta etapa aporta el contrato transaccional; no conecta webhook, CLI ni worker.
No aplicar 003/004 a producción ni configurar variables durante esta etapa.
La flag `EBOOK_PAYMENT_FINALIZATION_ENABLED` sólo acepta `true`; ausente falla
cerrada en el repositorio. No habilita consumidores ni envíos por sí sola.

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

Antes de B2: SQL real en Neon aislado y revisión DB/código. B2 debe conectar TODOS
los escritores, webhook y recuperación CLI, a este protocolo con la misma flag.
No puede coexistir un CLI legado escribiendo mientras el webhook usa el finalizador.
Cerrar recuperación y dejar terminar callbacks viejos durante el cambio de versión;
verificar versión/capacidad de todos los procesos antes de habilitar la flag.

El worker futuro usa exclusivamente payload/key congelados de 003, claim acorde a
concurrencia, timeout menor al lease y comprobación temporal antes de cada envío.
Ventana 23 h, cinco intentos; `concurrent_idempotent_requests` se reintenta, conflicto
de payload requiere revisión. ACK incierto requiere readback privado; no crear key
nueva ni reenviar sólo por ACK false. Cron autenticado por CRON_SECRET devuelve
contadores sin PII; no agregar schedule hasta validar schema/integración.

Rollback: detener workers/consumidores antes de cambiar flag o esquema; exportar y
reconciliar receipts, efectos y jobs aceptados/ambiguos. Desactivar flag y volver al
sender legado sin reconciliación puede duplicar correos. Down004 conserva grants y
jobs003: no revoca acceso ni supone que borrar receipt habilita un nuevo envío.

## Matriz SQL real requerida (los mocks no la reemplazan)

- Dos finalizaciones concurrentes misma orden: un receipt/job y un efecto por item.
- Dos órdenes para el mismo commerceOrder: sólo una puede consumir el manifiesto.
- Snapshot de grants/manifiesto modificado: cero escrituras, retry con estado actual.
- Bundle nuevo: todos grants, cupos, descuento, job y receipt o ninguno ante fallo.
- Cupo agotado/descuento vencido: grants completos e incidencia durable.
- Parcial histórico: conserva token previo, agrega faltantes, no reconsume viejo cupo,
  job needs_review; histórico completo no reenvía ni reconsume.
- Replay con copy distinta o pendiente borrado: mismo job, sin efectos adicionales.
- Payer/importe/grants contradictorios, duplicados y manifiesto inválido rechazados.
- Error forzado después de grants: rollback total, incluido cupos/descuento.
