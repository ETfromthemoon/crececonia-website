# Consulta administrativa de entregas

`/admin/ebook/entregas` requiere sesión administrativa antes de consultar Neon.
Es de solo lectura: no tiene acciones de reenvío, cambio de estado ni resolución.
No aplica migraciones, habilita flags ni configura schedules.

Muestra 25 trabajos por página ordenados por fecha e ID, con cursor keyset que
conserva los seis decimales de PostgreSQL. La consulta usa proyección explícita:
no carga payload, tokens de lease/descarga, email, grants, manifiesto ni commerceOrder.
Los errores de base se muestran como consulta no disponible; nunca como cero filas.
Sin 003 indica infraestructura no instalada. Con instalación parcial de 003/004
advierte límites y evita consultar relaciones ausentes; si existe la cola sigue
mostrando correo, sin inventar resultados contables.

“Aceptado por el proveedor” sólo confirma aceptación de Resend, no entrega en
bandeja ni descarga. Resultado desconocido, historia y recuperación pueden ser
ambiguos; no justifican reenvío. Reserva vencida, cinco intentos y ventana de 23 h
se derivan con el reloj consultado de la base aunque el worker aún no actualice
el estado. Una reserva activa conserva su semántica hasta vencer.

Los efectos contables incluyen exclusivamente cupo/descuento, separados de las
incidencias de entrega. Se proyectan kind/resource/reason de needs_review mediante
lista permitida de tipos y razones; los recursos se muestran con títulos del catálogo,
sin reflejar valores desconocidos. Así se distingue agotamiento de contabilidad
histórica y correo histórico de recuperación pendiente. Una incidencia contable no revoca acceso ni demuestra
fallo del correo. Las fechas de elegibilidad no prometen ejecución: depende de
flags, programación y disponibilidad del worker. Instalar schema tampoco prueba
que el worker esté activado.

La resolución de incidencias requiere una fase posterior con autorizaciones,
evidencia de aceptación e identidad/payload originales; esta pantalla no ofrece
atajos para reintentar ni altera la ventana de idempotencia.
