# Objetivo: ecosistema comercial verificable

Fecha de inicio: 2026-11-12. Repositorio: ETfromthemoon/crececonia-website.

## Resultado buscado

Conectar captación, seguimiento, compra, entrega y recompra con datos fiables, sin perder postulaciones ni depender de intervenciones manuales invisibles. Conservar Next.js, Neon, Flow, Resend, PostHog y los canales existentes. No crear un CRM alternativo sin evaluar primero el disponible.

## Autorización y coordinación

Sergio autorizó planificación, ejecución por subagentes, worktrees separados, commits, push, PR y merge a main bajo revisión del coordinador. Main despliega automáticamente. Cada PR recibe una revisión crítica independiente del implementador; el coordinador valida el SHA exacto y los checks antes de autorizar al agente integrador a fusionarlo. No se hace push directo a main ni se omiten protecciones.

Esta autorización no se interpreta como envío de campañas, publicación social, activación de DM, gasto publicitario, cambio de precios o inventar testimonios. Las integraciones se preparan desactivadas hasta verificar destino y autorización aplicable. Las migraciones siguen database/README.md: prueba aislada, evidencia y autorización antes de producción. No modificar el workshop congelado para generalizar componentes.

Los procesos usan terminal no interactiva, ventanas ocultas y logs. No se inicia servidor local para revisión visual: se usa el Preview de Vercel del PR.

## Backlog y criterios de aceptación

Cada fila es una capacidad; puede dividirse en varios PR pequeños. Las dependencias evitan implementar en paralelo contratos todavía inestables.

| ID | Capacidad / entrega | Dependencias | Aceptación observable |
| --- | --- | --- | --- |
| E01 | Postulación persistente y handoff honesto | Ninguna | El servidor valida y guarda una sola vez; reintentar no duplica; WhatsApp no se presenta como mensaje enviado; fallos preservan respuestas; analítica no expone PII. |
| E02 | Medición comercial fiable | Ninguna; integrar eventos de E01 después | Separar eventos, personas y órdenes; no llamar conversión a cocientes sin recorrido verificable; deduplicar con identidad válida; distinguir ebooks, clases y workshop; pruebas de datos históricos y vacíos. |
| E03 | Seguimiento conectado al CRM existente | E01 + verificar cuenta/pipeline | Sincronización idempotente con historial de fallos; etapas y próxima acción; alertas de leads desatendidos; no enviar mensajes comerciales automáticamente. |
| E04 | Continuidad de evaluación y agenda | E01/E03 + verificar calendario | Confirmación al interesado y disponibilidad real cuando se autorice; reserva sin colisiones, cancelación y zona horaria; preservar filtrado comercial. |
| E05 | Entrega durable general | Contratos actuales de compras | Trabajo persistente, reintentos limitados, idempotencia y visibilidad de fallos; compra y acceso no dependen de disponibilidad momentánea del correo; sin alterar workshop congelado. |
| E06 | Recuperación de ebooks y preferencias | E05 + identidad/consentimiento | Cancelar al comprar; no duplicar envíos; límites y baja; modo prueba sin envíos reales; no conceder descuentos no aprobados. |
| E07 | Ofertas de servicios verificables | E02 + material real del negocio | Explicar alcance, entregables, límites y dinámica existentes; casos y resultados sólo con evidencia; instrumentar interés y contacto real. |
| E08 | Bienvenida y seguimiento segmentado | E03/E06 + contenido aprobado | Selección por interés y comportamiento, exclusión de compradores cuando proceda, bajas centralizadas; borradores y simulación antes de activar. |
| E09 | Biblioteca personal | E05 + autorización por compra | Acceso personal seguro a todos los recursos adquiridos, recuperación, enlaces expirables, sin revelar compras por enumeración de correo. |
| E10 | Lanzamientos y oferta consistente | E02/E05 | Precio mostrado coincide con checkout; checklist por tipo de campaña; activos verificados antes de publicar; conservar borradores y aprobación de DM/anuncios. |
| E11 | Sesiones administrativas | Inventario de páginas/APIs y plan de transición | Cookie segura, expiración y cierre de sesión; protección CSRF según operación; ninguna clave en enlaces nuevos; migración sin dejar al administrador fuera. |
| E12 | Operación, CI y recuperación | Progresiva, transversal | Checks obligatorios, pruebas de integración aisladas, alertas útiles, verificación de PDFs, inventario de jobs, restauración de DB/objetos comprobada sin tocar producción. |
| E13 | Documentación de arquitectura vigente | Cada etapa | Rutas, fuentes de verdad, configuración y runbooks corresponden al código integrado; diferenciar preparado, desplegado y activado. |

## Orden de ejecución

1. Primera ola: E01 y E02 en paralelo; revisión de arquitectura y dependencias E03-E13. Primer corte independiente de E05: comprobar error e ID de Resend en class-delivery-email.ts para no completar entregas rechazadas; sin migración ni cambios del workshop.
2. Segunda ola: E11 antes de ampliar superficies administrativas; después, visibilidad mínima de postulaciones con estado y próxima acción, independiente de disponer de CRM externo. E03 y E05 continúan con E12 incremental; verificar infraestructura real antes de añadir servicios.
3. Tercera ola: E04, E06 y E07; medir recorridos antes de optimizar adquisición.
4. Cuarta ola: E08, E09, E10 y E11; E13 se actualiza en cada integración.

## Contrato de revisión y despliegue

1. Confirmar base remota y cambios ajenos; asignar propiedad de archivos/worktree.
2. Implementar una unidad con pruebas de fallos y consumidores afectados.
3. Ejecutar npm test y npm run build para cambios de aplicación; documentación sola requiere diff y enlaces válidos.
4. Publicar PR con SHA, resultado de pruebas, migraciones y límites conocidos.
5. Un agente distinto intenta encontrar regresiones, pérdida de datos, abuso, PII, duplicación, contradicciones comerciales y despliegues incompletos. Un review sin hallazgos no sustituye pruebas.
6. Resolver hallazgos; volver a revisar cuando cambie el SHA. Validar CI y Preview sobre el commit actual.
7. Coordinador autoriza por número de PR y SHA. Agente integrador fusiona con expected_head_sha y verifica estado remoto. No integra trabajo ajeno incidentalmente.
8. Verificar despliegue y recorrido seguro en producción; conservar estrategia de reversión. No declarar activo lo que sólo está implementado.

## Seguimiento persistente

El objetivo activo del chat coordina estos PR hasta completarlos. Las automatizaciones son auditorías recurrentes del ecosistema (comercial, medición y confiabilidad), no vigilantes de un PR particular. Revisan primero trabajo existente para no duplicarlo. Hallazgos repetidos se actualizan, no generan ramas nuevas sin necesidad.

## Estado verificado al 12 de noviembre de 2026

Última base comprobada: `aca338cc9f7f765446205bd93be939ae6f7a3f69`. El seguimiento posterior vive en [issue #83](https://github.com/ETfromthemoon/crececonia-website/issues/83). Una capacidad puede tener código integrado sin estar activada; esta tabla no declara completo el objetivo integral.

| Capacidad | Evidencia integrada | Pendiente para completar |
| --- | --- | --- |
| E01 Captación | PR #79: persistencia idempotente, migración productiva aprobada y aplicada; pruebas SQL aisladas de concurrencia y límites. | Mantener verificación del recorrido al conectar CRM. |
| E02 Medición | PR #78: separación de métricas agregadas y órdenes únicas. PR #96: saneamiento de URLs/propiedades, bloqueo de superficies privadas y recuperación de eventos al volver a públicas; Meta browser suspendido. Véase [privacidad](analytics-privacy.md). | Recorrido secuencial, atribución de ingresos y futura integración segura de Meta browser. |
| E03 CRM | Nítido local confirmado por Sergio. PR #81: adaptador local integrado. PR #87: bandeja web desplegada, lectura protegida por sesión. | PR #82 y migración de cola pendientes; sincronización sin activar. Etapas, próxima acción y alertas comerciales siguen pendientes. La bandeja no sustituye el seguimiento en Nítido. |
| E04 Continuidad | PR #94: BPI/Test de Fit retirados; rutas antiguas explican el cambio y enlazan a `/ia`. Historial y APIs conservados. | Sergio eligió preparar reservas automáticas con configuración pendiente. PR #101 está en borrador, no integrado en esta base. Calendario, duración, disponibilidad, políticas y adaptador real siguen pendientes; continúa la coordinación manual. |
| E05 Entrega | PR #80: errores de correo de clases comprobados. PR #84: recuperación de ebooks con tokens aleatorios e inserción atómica. PR #86/#91/#97: outbox, finalizador compartido webhook/CLI y worker integrados, inactivos. PR #99: [bandeja readonly](ebook-delivery-operations.md) desplegada. | Activación coordinada de [finalización y worker](ebook-payment-finalization.md), cron y resolución/reconciliación operativa. Migraciones 003/004 probadas sólo en Neon aislado; no aplicadas en producción. Sin flags, cron ni envíos nuevos activados. |
| E06 Recuperación y preferencias | Recuperación técnica inicial en #84. | Registro de preferencias y simulación en implementación separada; no hay migración productiva ni baja pública nueva disponible. Pendientes cancelación al comprar, límites y baja. No confundir recuperación de acceso con campaña comercial. |
| E07 Ofertas | PR #94 retira oferta obsoleta. PR #98 centraliza condiciones, precios y criterios compatibles en `lib/service-offers.ts`; [runbook de ofertas](service-offers.md). | Evidencia de casos/resultados y seguimiento del contacto real; no cambiar precios ni inventar resultados sin autorización/evidencia. |
| E08 Seguimiento segmentado | Sin secuencia nueva activada. | Depende del registro de preferencias en preparación; faltan segmentación, contenido aprobado, exclusiones, bajas y simulación verificada antes de activar. |
| E09 Biblioteca personal | Descargas existentes conservadas. | Identidad personal, acceso conjunto seguro y recuperación sin enumeración de compradores. |
| E10 Lanzamientos | Centro existente conservado. | Consistencia de oferta/checkout y checklist verificable por tipo; mantener aprobación de publicación, DM y gasto. |
| E11 Administración | PR #85/#93: sesiones y login/logout nativos comprobados. PR #96: chat administrativo aislado y barrera analítica de superficies privadas integrados y desplegados. | Mantener estas barreras al añadir nuevas superficies administrativas y privadas. |
| E12 Operación | CI, revisiones independientes, pruebas SQL aisladas y auditorías recurrentes. PR #100: Next 16.4.6 y dependencias parcheadas; instalación reproducible, 646 pruebas/build y audits completo/producción sin vulnerabilidades reportadas en esa verificación. | Inventario operativo completo, alertas, restauración comprobada y limpieza autorizada de ramas temporales. Mantener verificación de dependencias; un audit sin hallazgos no certifica ausencia de vulnerabilidades. |
| E13 Documentación | Runbooks específicos acompañan las integraciones y este estado distingue preparación de activación. | Actualizar arquitectura y operación conforme se cierren las capacidades restantes. |

Los PR se encuentran en el [repositorio de GitHub](https://github.com/ETfromthemoon/crececonia-website/pulls). Las aprobaciones productivas son específicas: la autorización de E01 no autoriza por extensión las migraciones de Nítido ni de entrega. No se han activado campañas, DM ni gasto como parte de este objetivo.

## Estado inicial y conflictos conocidos (histórico)

- Base origin/main: dcd468c (PR #75).
- E01: worktree ecosystem-leads; implementación iniciada.
- E02: worktree ecosystem-metrics; implementación iniciada.
- Coordinación y plan: worktree ecosystem-control.
- PR #70 contiene una corrección previa del texto de WhatsApp: revisar compatibilidad y supersesión antes de integrar E01.
- PR #74 (catálogo/skills) y #47 (workshop) no forman parte de estas primeras modificaciones; conservarlos.
- El checkout original tiene archivos nuevos del usuario, incluido plans/2026-11-12-marketplace-ebooks.md; no incorporarlos ni alterarlos.
- La revisión del conector HighLevel confirmó que pertenece a Acción Fútbol, no a CrececonIA. No debe recibir contactos de CrececonIA. Posteriormente Sergio confirmó Nítido local como CRM correcto; la conexión productiva sigue pendiente según la tabla anterior.
- No se ha certificado aún la configuración productiva de calendario, respaldos ni todas las credenciales necesarias. No equivale a que esas capacidades no existan.

## Métricas de éxito

Captación guardada vs handoff; tiempo hasta primer contacto; oportunidades con próxima acción; órdenes pagadas únicas vs accesos disponibles; fallos de entrega pendientes; ingresos por origen comprobado; recompra; incidencias y tiempo de recuperación. Obtener línea base antes de fijar metas numéricas o prometer aumento de ventas.
