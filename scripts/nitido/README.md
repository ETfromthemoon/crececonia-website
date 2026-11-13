# Conector local de postulaciones a Nítido

Este adaptador es una pieza preparada, no una sincronización activada. No modifica el repositorio ni SQLite de Nítido. No inicia servicios ni instala tareas. No requiere paquetes Python externos ni crea subprocesos.

## Contrato web v1

Las rutas del sitio se implementan en un PR separado. Ambas requieren `Authorization: Bearer NITIDO_SYNC_KEY`, una credencial dedicada sin fallback a ADMIN_SECRET.

- `POST /api/integrations/nitido/claim`: `{workerId: UUID, limit: 1}`. Devuelve `{jobs: []}` o un trabajo `{id, leaseToken, leaseExpiresAt, qualification}`. Lease de cinco minutos; UUID canónicos; ISO con zona horaria. `qualification` incluye `id` y los campos persistidos que consume el adaptador: service, name, email, company, role, result, budget, availability, context y decision. No incluye `qualified`.
- `POST /api/integrations/nitido/ack`: `{jobId, leaseToken, outcome: "synced", operationId}` sólo después de releer un recibo committed del CRM; o `{jobId, leaseToken, outcome: "needs_review", reasonCode}` para cuarentena (`duplicate_candidate`, `revision_conflict`, `invalid_payload`). La cuarentena no significa sincronizado.
- ACK idempotente para mismo resultado/operación y mismo token; lease vencido o reasignado responde 409. Los trabajos sin ACK quedan disponibles al vencer el lease. Respuestas no cacheables y lotes acotados son responsabilidad del servidor.

## Garantías y límites

El worker reclama una postulación por ejecución. Prepara una operación inmutable en disco antes de aplicar. Su UUID es determinista por origen del sitio + trabajo, por lo que incluso perder el checkpoint no autoriza crear otra operación. Antes de cualquier escritura consulta el recibo; después de apply vuelve a consultarlo y compara fuente y campos creados. Un timeout conserva el mismo contrato y no se resuelve inventando otro UUID. Si el ACK falla, la siguiente reclamación usa el recibo sin volver a crear el prospecto.

Sólo crea un cliente Prospecto y una entrada con sus respuestas. No crea contratos, proyectos, cobros, fechas de contacto, pagos ni mensajes. Las coincidencias normalizadas con clientes, incluidos archivados, y los duplicados detectados por preview quedan en revisión. No sobrescribe clientes ni usa duplicate_reason para evadir el control. Un cambio de revisión también queda para revisión humana; no fuerza contadores.

El email aceptado por el sitio puede superar el límite de 200 caracteres de Nítido: se pone en revisión, nunca se trunca. Los checkpoints pendientes contienen datos personales y deben conservarse en almacenamiento local privado; al confirmar ACK se reemplazan por hash/ID/estado. No guardar el directorio de estado en Git ni carpetas sincronizadas públicas. No hay secretos en los checkpoints. Los logs sólo muestran estados sanitizados, no correos ni cuerpos HTTP. El bloqueo del proceso se libera al finalizar/crashear; mantener una única máquina importadora. Un equipo apagado deja trabajos pendientes en la web.

El recibo prueba una operación histórica. Si se restaura Nítido desde un backup, detener la sincronización y reconciliar sus datos y recibos antes de reanudar; no usar este importador como restaurador.

## Preparación y ejecución (no realizada por este PR)

Configurar `NITIDO_SYNC_KEY` en el entorno privado del usuario y la misma clave dedicada en servidor. El adaptador usa HTTPS saliente para la web y HTTP exclusivamente a localhost/127.0.0.1 para Nítido. No sigue redirecciones ni proxies. No exponer el puerto local ni crear túneles.

```powershell
python scripts/nitido/sync.py
# Sólo comprueba configuración y salud de Nítido; no reclama ni escribe.
python scripts/nitido/sync.py --apply
# Reclama como máximo una postulación y la aplica usando preview/recibo.
python -m unittest discover -s scripts/nitido -p "test_*.py" -v
```

Estado predeterminado: `%LOCALAPPDATA%/Nitido/crececonia-sync`; se puede indicar `--state-dir` privado. `--site` cambia el origen HTTPS y `--crm` admite únicamente origen HTTP loopback. Lanzadores futuros de Windows deben usar ventanas ocultas, logs y ejecución de una sola instancia; no se instala ninguna tarea aquí. Antes de activarlo: desplegar rutas y migración, probar con servidor/CRM aislados, verificar clave y revisar la autorización comercial del importador.
