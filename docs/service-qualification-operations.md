# Operación de postulaciones

`/admin/postulaciones` exige la sesión administrativa vigente antes de consultar datos. Es una bandeja de observabilidad de solo lectura; no modifica contactos, etapas, trabajos ni registros.

- La lista muestra nombre, empresa, servicio, fecha y situación técnica. El correo y las respuestas se consultan solo al abrir el detalle autenticado.
- Nítido es la fuente de seguimiento comercial. El estado web `new` no permite saber si alguien ya contactó al interesado. Un trabajo `synced` solo confirma la sincronización, no una conversación o venta.
- “Sin trabajo de sincronización” conserva visible la postulación: revisar su incorporación a la cola.
- Una reserva vencida se informa incluso si todavía no corrió el siguiente proceso de sincronización. Si ya consumió ocho intentos, requiere revisión aunque el estado persistido siga siendo `leased`.
- Duplicados, conflictos y datos incompatibles requieren reconciliación en Nítido o revisión de la integración; esta bandeja no ofrece reintentos ni ediciones comerciales.

## Compatibilidad de despliegue

La migración de captación `20261112_001` debe existir. La cola `commerce.nitido_sync_jobs` del PR #82 es opcional al desplegar la bandeja: su ausencia se detecta con `to_regclass`, se avisa “Integración no instalada” y se consultan igualmente las postulaciones. Errores de permisos, conexión, columnas incompatibles u otros fallos de base de datos no se convierten en una lista vacía: se muestra “Consulta no disponible”. No hay migraciones en este cambio.

## Paginación y privacidad

Se leen hasta 26 filas para mostrar 25 y decidir si existe página siguiente. La paginación por `(created_at, id)` conserva los microsegundos de PostgreSQL y usa el UUID para desempatar. Un nuevo registro no desplaza las páginas anteriores. No hay búsqueda por correo, exportación ni información personal en los parámetros: solo cursor temporal/UUID e identificador de detalle. No se seleccionan tokens de reserva, credenciales, identificadores de trabajadores ni payload completo. Los valores se renderizan como texto escapado y el área administrativa conserva no-store/no-referrer y bloqueo de analítica del layout/proxy.

Las fechas se muestran en America/Santiago. La vista es una fotografía de cada carga y no inventa un SLA ni acredita que el proceso de sincronización esté habilitado. Para actualizar, recarga la página. Las pruebas automatizadas mockean la base de datos; verificar consultas reales en una rama aislada de Neon antes de liberar.
