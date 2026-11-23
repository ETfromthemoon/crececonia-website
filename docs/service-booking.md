# Preparación de reservas por servicio

Sergio eligió preparar reservas automáticas con configuración pendiente. `/admin/reservas`
es una vista de solo lectura protegida por sesión. No crea reservas ni consulta calendarios.
La calificación, su hash/RPC y el contacto opcional por WhatsApp siguen intactos.

`SERVICE_BOOKING_CONFIG` es un JSON server-only opcional. No se ha configurado en ningún
entorno. Su ausencia muestra decisiones pendientes, sin asignar horarios o duración.
No incluir credenciales en este documento ni en el JSON: la autenticación del futuro
proveedor tendrá un contrato separado. La pantalla muestra únicamente validez de campos,
nunca el identificador de calendario o los valores introducidos.

Contrato: `enabled` booleano explícito; `provider` y `calendarId` textos no vacíos;
`timeZone` zona IANA con región o `UTC`; `services` contiene `mentoria` e `implementacion`.
Cada servicio declara `durationMinutes`, `bufferMinutes` (separación posterior),
`minimumNoticeMinutes`, `horizonDays`, `cancellationPolicy` y `windows`. El modelo de
separación posterior también deberá confirmarse comercialmente antes de activar;
si se necesita separación previa, se ampliará el contrato y sus pruebas.
Cada ventana declara `day` (0 domingo a 6 sábado), `start` y `end` HH:mm en la zona
comercial. No se admiten cruces de medianoche ni ventanas superpuestas en un día.
Cada ventana debe contener duración más separación. La antelación debe ser menor
al horizonte. No son slots disponibles: no consultan ocupación ni cambios de horario
estacional. El adaptador futuro deberá resolver ambos antes de ofrecer una hora.

Se rechazan campos desconocidos. Límites técnicos del validador, no recomendaciones
comerciales: JSON 32000 caracteres; textos 1000; duración 1–1440 minutos;
separación 0–1440; antelación 0–525600; horizonte 1–366 días; máximo 100 ventanas.
Los valores definitivos requieren decisión comercial; los números de tests son sintéticos.

Estados: `disabled` con `enabled:false`; `configuration_pending` si faltan datos o
son inválidos; `integration_pending` si el documento es válido. **Ninguno permite
reservar** (`canBook:false`). Incluso `enabled:true` no activa nada en esta fase.
No hay endpoint público, flags de activación, migración ni envío nuevo.

Siguientes fases: identificar proveedor/calendario autorizado; implementar adaptador
con acceso comprobado, disponibilidad real y reconciliación; persistencia idempotente
independiente de la postulación, concurrencia y cancelación; token de acceso aleatorio
y expiración (el UUID de postulación no es credencial); coordinación mediante API de
Nítido. Migraciones productivas requieren aprobación específica tras pruebas aisladas.
Las notificaciones y activación requieren su propia verificación, sin efectos incidentales.
