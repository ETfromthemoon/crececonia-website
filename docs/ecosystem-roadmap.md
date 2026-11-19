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

## Estado documental al 19 de noviembre de 2026 (America/Santiago)

Estado actualizado el 2026-11-19 (America/Santiago) sobre `ae15715a87bf7b8381909ead85cf1403e047e67b`, contrastando Git, los PR abiertos, sus descripciones y [issue #83](https://github.com/ETfromthemoon/crececonia-website/issues/83). Las pruebas anteriores se citan como evidencia registrada; esta actualización no repitió SQL, revisión visual ni comprobación de configuración productiva. Una capacidad puede tener código integrado sin estar activada; esta tabla no declara completo el objetivo integral.

| Capacidad | Evidencia integrada o preparada | Pendiente para completar |
| --- | --- | --- |
| E01 Captación | PR #79: persistencia idempotente, migración productiva aprobada y aplicada; pruebas SQL aisladas de concurrencia y límites. | Mantener verificación del recorrido al conectar CRM. |
| E02 Medición | PR #78: separación de métricas agregadas y órdenes únicas. PR #96: saneamiento de URLs/propiedades, bloqueo de superficies privadas y recuperación de eventos al volver a públicas; Meta browser suspendido. PR #118: medición de interacción del marketplace integrada; mide eventos, no ventas ni usuarios únicos. Véase [privacidad](analytics-privacy.md). | Recorrido secuencial, atribución de ingresos y futura integración segura de Meta browser. |
| E03 CRM | Nítido local confirmado por Sergio. PR #81: adaptador local integrado. PR #87: bandeja web desplegada, lectura protegida por sesión. PR #82: outbox transaccional, API autenticada y worker local integrados en `71103a7`; sin `NITIDO_SYNC_KEY`, el servidor mantiene claim/ACK desactivados. | Migración 002 no aplicada en producción; falta validar worker contra contrato CRM aislado y probar claim/ACK/replay/cuarentena. El repositorio Nítido identificado (`CRM WORKSHOP`) se declara maqueta sin backend, autenticación ni persistencia; confirmar su topología y construir/validar el contrato operativo antes de conectar. Etapas, próxima acción y alertas siguen pendientes. La bandeja no sustituye el seguimiento en Nítido. |
| E04 Continuidad | PR #94: BPI/Test de Fit retirados; rutas antiguas explican el cambio y enlazan a `/ia`. Historial y APIs conservados. PR #101: panel administrativo y esquema de configuración de reservas integrados, con `canBook: false` en todos los estados. | No hay proveedor ni calendario conectado, configuración de horarios ni reservas activas; duración, disponibilidad y políticas operativas siguen pendientes. Continúa la coordinación manual. |
| E05 Entrega | PR #80: errores de correo de clases comprobados. PR #84: recuperación de ebooks con tokens aleatorios e inserción atómica. PR #86/#91/#97: outbox, finalizador compartido webhook/CLI y worker de ebooks propios integrados, sin activación registrada. PR #99: [bandeja readonly](ebook-delivery-operations.md) desplegada. | PR #111 sigue en borrador: conciliación de sólo lectura, revisión crítica/CI/Preview favorables registrados, pero sin SQL real y con revisión visual pendiente. Activación coordinada de [finalización y worker](ebook-payment-finalization.md), cron y resolución operativa pendientes. Migraciones 003/004 de este flujo probadas sólo en Neon aislado; no extender a ellas el estado productivo del marketplace descrito abajo. |
| E06 Recuperación y preferencias | Recuperación técnica inicial en #84. PR #103 en borrador: registro interno de preferencias y simulación, sin transporte; migración 005 probada en temporal autorizada con contratos, ACL, concurrencia de dos sesiones y rollback. | Revisión visual de `/admin/comunicaciones` pendiente por instrucción de Sergio; no hay migración productiva ni baja pública nueva registrada. Pendientes cancelación al comprar, límites y baja. No confundir recuperación de acceso con campaña comercial. |
| E07 Ofertas | PR #94 retira oferta obsoleta. PR #98 centraliza condiciones, precios y criterios compatibles en `lib/service-offers.ts`; [runbook de ofertas](service-offers.md). | Evidencia de casos/resultados y seguimiento del contacto real; no cambiar precios ni inventar resultados sin autorización/evidencia. |
| E08 Seguimiento segmentado | PR #116: política de recomendaciones integrada. PR #117: política pura de posventa integrada, sin conectar emails. Sin secuencia nueva activada en este seguimiento. | Depende de preferencias, biblioteca y entrega durable; faltan segmentación, contenido aprobado, exclusiones, bajas y simulación verificada antes de activar. Véase [posventa](marketplace-post-sale.md). |
| E09 Biblioteca personal | Descargas existentes conservadas. PR #104 en borrador: acceso por enlace de un uso y sesión revocable; migración 006 con up, contratos/ACL y down probados en temporal autorizada, conservando compras. | Revisión visual pendiente por instrucción de Sergio; biblioteca y Resend no activados por este PR. Identidad y acceso conjunto siguen pendientes de integración; el acceso no representa reembolsos hasta expiración/revocación. |
| E10 Lanzamientos | Centro existente conservado. PR #109 integró el contrato de reservas Flow y la migración 007 en `770de15`; PR #112 integró en `2191d32` un harness aislado de concurrencia. SQL probado y revertido sólo en Neon temporal autorizado; producción intacta. | Antes de vender, integrar Flow y una finalización atómica con E05 que también cierre la reserva/cupo; resolver recuperación de creación ambigua y añadir reconciliador. La prueba manual de dos sesiones pasó en Neon; el harness del repositorio aún no se ha ejecutado allí por falta de `NEON_API_KEY` local. No aplicar 007 en producción ni activar checkout hasta cerrar estos gates; mantener checklist por tipo y aprobación explícita de publicación, DM y gasto. |
| E11 Administración | PR #85/#93: sesiones y login/logout nativos comprobados. PR #96: chat administrativo aislado y barrera analítica de superficies privadas integrados y desplegados. | Mantener estas barreras al añadir nuevas superficies administrativas y privadas. |
| E12 Operación | CI, revisiones independientes, pruebas SQL aisladas y auditorías recurrentes. PR #100: Next 16.4.6 y dependencias parcheadas; instalación reproducible, 646 pruebas/build y audits completo/producción sin vulnerabilidades reportadas en esa verificación. | Inventario operativo completo, alertas, restauración comprobada y limpieza autorizada de ramas temporales. Mantener verificación de dependencias; un audit sin hallazgos no certifica ausencia de vulnerabilidades. |
| E13 Documentación | Runbooks específicos acompañan las integraciones y este estado distingue preparación de activación. | Actualizar arquitectura y operación conforme se cierren las capacidades restantes. |

Los PR se encuentran en el [repositorio de GitHub](https://github.com/ETfromthemoon/crececonia-website/pulls). Las aprobaciones productivas son específicas: la autorización de E01 no autoriza por extensión las migraciones de Nítido ni de entrega. No se han activado campañas, DM ni gasto como parte de este objetivo.

### Marketplace: evolución posterior y alcance separado

El estado sandbox de los borradores #119/#120/#121/#123 corresponde a una cadena anterior. `main` ya integra #122/#125, #126/#128/#129 y #131–#136: demo y flujos preparados, verificación de publicación, catálogo real, registro de autores, paneles y checkout live protegido por configuración. #136 fija la comisión del 9 % sobre precio sin IVA de venta, con IVA de comisión separado. El coordinador comprobó Vercel producción `READY` para el SHA base `ae15715` (`dpl_KnZ4QUZGULLHgbz94aRqgE43fm2Q`). No reimplementar esas capacidades desde los borradores antiguos.

El [runbook productivo del marketplace](marketplace-production-readiness.md), actualizado el 19 de noviembre, registra migraciones marketplace aplicadas en producción, pruebas financieras aisladas y snapshot previo `snap-noisy-poetry-ack3ftal`. También registra configuración Flow/Storage/Resend y describe los gates separados de tienda y checkout. Esta revisión documental no consultó los valores actuales de los flags ni certificó apertura, primera venta real o ejecución periódica del worker. Ese estado no acredita la activación de la entrega de ebooks propios E05, la biblioteca #104 ni las preferencias #103.

Antes de la primera venta de terceros queda pendiente validar operativamente el RUT emisor y el modelo de emisión de Flow, según #136. Seguir además la verificación de apertura y conciliación del runbook: revisión humana del libro/autor, respaldo tributario, tarifa real Flow, entrega y saldo. Son pendientes operativos propios del marketplace; las autorizaciones para migrar o activar otros flujos siguen siendo específicas.

### Siguiente secuencia de coordinación

1. Cerrar las revisiones visuales pendientes de #103/#104/#111 cuando se retome la revisión indicada por Sergio; conservar los borradores y no tratar CI/Preview como evidencia visual. SHA registrados al corte: #103 `6336a9444952a8042acc24a08f6f842fba2fb745`, #104 `44ca8f642af2a065400fe6347b7fc6c3e035d102`, #111 `8109b3ac99773da57a8deecc4e93743e479043af`. Revalidar base, diff y checks del SHA final antes de integrar; #111 aún requiere evidencia PostgreSQL real.
2. Reconciliar #119/#120/#121/#123 con el marketplace integrado antes de rebasar o fusionar: identificar diferencias útiles, dependencias y trabajo ya sustituido; no cerrar ni integrar automáticamente. #121 (portal de autores) y #130 (presentación/navegación) presentan conflicto con `main`; sus revisiones finales requieren resolverlo. Las previews previas no validan estos cambios sobre la base actual.
3. Resolver la topología y contrato operativo de Nítido (E03) y el calendario/duraciones/disponibilidad de E04. No inventar esos valores ni conectar HighLevel de Acción Fútbol.
4. Preparar por separado las decisiones de migración/activación de E03, E05, preferencias y biblioteca, con evidencia aislada y aprobación específica. No activar cron, workers, cobros ni comunicaciones como consecuencia de actualizar el roadmap.

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
