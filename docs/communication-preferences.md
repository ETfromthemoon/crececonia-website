# Preferencias y simulación de comunicaciones

E06A prepara un registro de permisos y bajas y `/admin/comunicaciones`. La vista
requiere sesión antes de consultar Neon. Sólo ejecuta SELECT y muestra conteos;
no crea contactos, exporta destinatarios, encola trabajos ni importa transporte de correo.
La migración 005 está preparada, **no aplicada en producción**. El `up` es atómico;
el `down` se niega a destruir registros de consentimiento y requiere que las tres tablas
estén vacías. Su prueba aislada y aprobación específica son requisitos de `database/README.md`.

## Fuentes y límites de la simulación

Los candidatos provienen de `commerce.public_subscribers` (un correo normalizado)
y `commerce.ebook_waitlist` (correo y recurso distintos). Son universos históricos,
no pruebas de consentimiento. No se copian ni conceden permisos por tener una fila.
Una persona en dos listas de espera cuenta dos veces; los motivos también pueden
coincidir. Los permisos se unen por contacto, propósito y recurso exactos.

El permiso efectivo proviene exclusivamente del registro nuevo. Sin esquema o
con esquema parcial, se muestra esa condición y se excluye por falta de evidencia.
Si una fuente falta, no se presenta como cero; errores de consulta muestran
indisponibilidad sin errores privados. Los correos se procesan dentro de SQL, pero
sólo llegan al servidor de la página grupos de estados y conteos. No hay exportación.

No hay campaña, frecuencia, historial de mensajes ni deduplicación comercial
configurados: ninguna fila autoriza un envío (`canSend:false`). El evaluador puro
puede modelar candidatos sintéticos con evidencia completa, como
`eligible_for_simulation`; no es una API de despacho. El panel siempre agrega
`campaign_not_configured`, `frequency_unknown` y `deduplication_unknown`.
No excluye compradores de una newsletter indiscriminadamente. Los avisos quedan
además con compra pendiente de comprobar: sólo una política de campaña y producto
explícita permitirá interpretar ese estado. No usa la ausencia de compra como
prueba de impago ni `ebook_pending_orders` como fuente de carritos abandonados.

## Escritura privilegiada futura

`commerce.record_communication_preference` calcula SHA256 sobre un comando JSON
canónico en la base. Serializa primero el UUID de petición mediante advisory lock,
después el contacto normalizado mediante bloqueo de fila. El mismo UUID con otro
contenido falla antes de tocar contactos; un replay devuelve su revisión original,
**no el permiso actual**, y nunca vuelve a ejecutar una concesión antigua.

`grant` y `allow_global` exigen la revisión actual. Las bajas aceptan revisiones
antiguas no negativas; así una retirada concurrente prevalece. Sólo el reloj del
servidor registra fechas. `suppress_all` actualiza la barrera de revisión global:
levantarla no reactiva los permisos anteriores. Hace falta otra concesión por
finalidad, con evidencia nueva y revisión actual, después de levantarla. No se
concede permiso mientras la baja global está activa. Una baja específica conserva
los eventos anteriores. Newsletter usa recurso vacío; launch_notice exige un ebook.
No se modela todavía permiso de carrito ni se modifica la recuperación transaccional.

`source`, `text_version` y `evidence_id` son referencias exigidas a un futuro
llamador privilegiado: sus etiquetas no prueban que el usuario haya consentido.
Todavía no hay endpoint ni captura que los genere, ni backfill histórico.
No publicar la función a roles de navegador. La migración revoca acceso a
PUBLIC/anon/authenticated. **El propietario de la base mantiene privilegios DML**;
el historial es append-only por el protocolo de aplicación, no una garantía contra
el propietario. Separar un rol servidor con SELECT/EXECUTE y sin DML directo es
un requisito antes de habilitar captura real; no se cambian roles productivos aquí.

## Verificación y siguiente corte

`database/tests/communication_preferences.sql` contiene assertions transaccionales
con identidades sintéticas y rollback para una rama aislada con 005 instalada.
Revisar también en dos sesiones: grant y baja global concurrentes para un contacto
(ambos órdenes de bloqueo); replay de grant tras baja; UUID igual para emails
distintos. Comprobar los privilegios reales, FK y planes del agregado. Los tests
unitarios no sustituyen esas pruebas de PostgreSQL.

Antes de producción: revisión SQL independiente, pruebas aisladas, aprobación de
migración y definición del rol servidor. Antes de secuencias: textos/versiones de
consentimiento, canal de verificación y reingreso, política de frecuencia y campaña,
historial/deduplicación y conciliación de compras. Revalidar todo al seleccionar y
justo antes del futuro envío; cancelar trabajos ante baja o compra relevante.

La baja pública sigue pendiente: token aleatorio de 32 bytes, sólo hash almacenado,
alcance y caducidad explícitos, sin email en URL, respuesta genérica e idempotencia.
GET no debe mutar (escáneres); confirmación POST, con one-click del proveedor como
contrato separado. Distribuir enlaces junto con captura y transporte verificados.
Esta preparación **no resuelve aún** la promesa de baja de la newsletter existente.
La recuperación de acceso solicitada es transaccional y conserva sus controles.
