# Arquitectura operativa de Crece con IA

Este documento es el mapa estable del proyecto. Describe dónde vive cada responsabilidad, qué sistema es la fuente de verdad y qué no debe mezclarse.

Actualizado el 2026-11-12 sobre `aca338cc9f7f765446205bd93be939ae6f7a3f69`.

## Vista general

| Capa | Responsabilidad | Fuente de verdad |
| --- | --- | --- |
| Next.js 16.4.6 App Router | Sitio público, tienda, checkout, aulas y administración | `app/` |
| Componentes | Experiencias visuales y formularios | `components/` |
| Dominio | Catálogo, precios, pagos, entregas y lanzamientos | `lib/` |
| PostgreSQL | Compras, cupos, configuración y operación | Neon, vía `DATABASE_URL` |
| Archivos privados | PDFs y recursos pagados | Neon Object Storage, vía `STORAGE_S3_*` |
| Pagos | Cobro y confirmación | Flow |
| Email | Entrega y notificaciones | Resend |
| Medición | Eventos y reportes del funnel | PostHog; Meta browser suspendido, eventos Meta servidor existentes conservados |
| Coordinación social | Perfiles, borradores, DM y seguimiento | Zernio API |
| Despliegue | Producción y previews | Vercel, desde GitHub |

## Límites funcionales

- El catálogo de ebooks vive en `lib/ebook-catalog.ts`. Es la lista canónica de productos seleccionables en el centro de lanzamientos.
- El checkout y la entrega de ebooks siguen usando el motor existente bajo `app/api/flow/` y `app/api/ebook/`.
- El workshop del 6 de septiembre de 2026 es una implementación productiva congelada en sus rutas actuales. Sirvió como referencia de experiencia, pero sus tablas, funciones, precio y administración no dependen del nuevo centro.
- El centro de lanzamientos vive en `/admin/lanzamientos`, sus datos en siete tablas `launch_*` y su plantilla pública en `/lanzamientos/[slug]`.
- Zernio es el canal operativo para perfiles sociales, borradores y automatizaciones de comentarios/DM. El panel usa la API desde el servidor con una clave restringida al perfil de CrececonIA.
- Crear un lanzamiento no publica nada. Los posts se crean como borradores y una automatización de DM sólo se activa mediante su botón explícito. Los anuncios nunca generan gasto automáticamente.

## Seguridad

Las páginas `/admin/*` validan una sesión administrativa firmada en el servidor. El login usa `ADMIN_SECRET` mediante POST y entrega una cookie HttpOnly de ocho horas; los clientes de máquina conservan el encabezado `x-admin-key`. Las APIs exigen Origin exacto para mutaciones mediante cookie y no aceptan claves por query. `DATABASE_URL`, credenciales S3, Flow, Resend y `ZERNIO_API_KEY` son sólo de servidor. Ningún secreto debe comenzar con `NEXT_PUBLIC_`. Límites y transición: `admin-sessions.md`.

La barrera de analítica bloquea superficies privadas y sanea URLs y propiedades de los eventos públicos. El chat comercial no aparece en administración. El SDK browser de Meta está suspendido; esto no modifica campañas ni eventos de servidor. Alcance y límites: [privacidad de analítica](analytics-privacy.md).

## Captación, servicios y entrega

- Las postulaciones calificadas se guardan de forma idempotente y se consultan en `/admin/postulaciones`, protegido por sesión. El CRM confirmado es Nítido local; PR #82 integra la outbox transaccional, API autenticada y worker local, pero la sincronización sigue desactivada (sin `NITIDO_SYNC_KEY`) y la migración 002 no está aplicada en producción. El repositorio Nítido actualmente identificado se declara maqueta sin backend, autenticación ni persistencia; verificar la topología y el contrato operativo antes de conectar. HighLevel no es el destino de estos contactos. Véase [operación de postulaciones](service-qualification-operations.md).
- `lib/service-offers.ts` centraliza las condiciones, precios y criterios compartidos de mentoría e implementación. No establece por sí mismo una reserva ni un contrato individual. Véase [ofertas de servicios](service-offers.md).
- El finalizador de pagos compartido conecta webhook y CLI; el worker vive en `/api/cron/ebook-delivery`. La ruta durable requiere `EBOOK_PAYMENT_FINALIZATION_ENABLED` y `EBOOK_DELIVERY_WORKER_ENABLED`, migraciones 003/004 y programación del worker. Estos elementos siguen pendientes de activación coordinada; integrar código no los habilita. El webhook conserva el camino legacy con la flag apagada. Véase [finalización de pagos](ebook-payment-finalization.md).
- `/admin/ebook/entregas` es una bandeja de solo lectura. Distingue esquema ausente, instalación parcial y fallo de consulta; separa efectos contables de aceptación del correo. Aceptado por Resend no acredita entrega en bandeja ni descarga. Véase [operación de entregas](ebook-delivery-operations.md).
- La configuración administrativa de reservas automáticas (PR #101) está integrada, pero mantiene `canBook: false`: no hay proveedor/calendario conectado, horarios configurados ni reservas activas. Las preferencias de comunicación siguen en preparación y no hay nueva secuencia comercial activada. Su estado se sigue en el [roadmap](ecosystem-roadmap.md).

## Flujo de datos de un lanzamiento

1. El administrador crea un lanzamiento y elige ebooks del catálogo.
2. El servidor valida los datos e inserta configuración, productos, tres tramos opcionales y siete requisitos operativos en una sola operación atómica.
3. El panel sincroniza el perfil y las cuentas de CrececonIA desde Zernio.
4. Desde la ficha se crean borradores en Zernio y, con confirmación explícita, automatizaciones de captación por DM. La publicidad queda pausada hasta aprobación y conexión de una cuenta publicitaria.
5. El panel bloquea el estado “Listo” y “Publicado” hasta que todas las tareas obligatorias estén aprobadas y exista un destino de CTA o un ebook principal.
6. La página pública sólo responde para un lanzamiento publicado. Antes de publicarlo, admite sesión administrativa o la excepción legacy `isAdminPreviewKey`; para nuevas revisiones se usa la sesión, sin promover enlaces con claves. Las vistas previas privadas quedan excluidas de analítica.
7. Cada cambio relevante queda registrado en `launch_activity`.

## Cambios futuros

- Esquema: agregar una migración reversible en `database/migrations/` y probarla primero en una rama temporal de Neon.
- Nuevo ebook: seguir el runbook de `AGENTS.md`; después aparecerá automáticamente en el selector del panel.
- Nueva capacidad de Zernio: documentar primero el endpoint, permisos y efecto reversible; nunca asumir publicación ni gasto.
- Nunca editar datos productivos del workshop para probar el centro de lanzamientos.
