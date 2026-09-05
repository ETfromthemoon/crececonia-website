# Arquitectura operativa de Crece con IA

Este documento es el mapa estable del proyecto. Describe dónde vive cada responsabilidad, qué sistema es la fuente de verdad y qué no debe mezclarse.

## Vista general

| Capa | Responsabilidad | Fuente de verdad |
| --- | --- | --- |
| Next.js App Router | Sitio público, tienda, checkout, aulas y administración | `app/` |
| Componentes | Experiencias visuales y formularios | `components/` |
| Dominio | Catálogo, precios, pagos, entregas y lanzamientos | `lib/` |
| PostgreSQL | Compras, cupos, configuración y operación | Neon, vía `DATABASE_URL` |
| Archivos privados | PDFs y recursos pagados | Neon Object Storage, vía `STORAGE_S3_*` |
| Pagos | Cobro y confirmación | Flow |
| Email | Entrega y notificaciones | Resend |
| Medición | Funnel y atribución | PostHog y Meta |
| Coordinación | Publicaciones, DM, anuncios y automatizaciones | CERNEO |
| Despliegue | Producción y previews | Vercel, desde GitHub |

## Límites funcionales

- El catálogo de ebooks vive en `lib/ebook-catalog.ts`. Es la lista canónica de productos seleccionables en el centro de lanzamientos.
- El checkout y la entrega de ebooks siguen usando el motor existente bajo `app/api/flow/` y `app/api/ebook/`.
- El workshop del 6 de septiembre de 2026 es una implementación productiva congelada en sus rutas actuales. Sirvió como referencia de experiencia, pero sus tablas, funciones, precio y administración no dependen del nuevo centro.
- El centro de lanzamientos vive en `/admin/lanzamientos`, sus datos en las cinco tablas `launch_*` y su plantilla pública en `/lanzamientos/[slug]`.
- CERNEO no es reemplazado por este panel: el panel genera el encargo, exige que se coordine allí y guarda el enlace/estado. No inventa una integración remota sin contrato de API.

## Seguridad

Todas las páginas `/admin/*` validan `ADMIN_SECRET` en el servidor. Las APIs administrativas exigen el mismo secreto en `x-admin-key`. `DATABASE_URL`, credenciales S3, Flow y Resend son sólo de servidor. Ningún secreto debe comenzar con `NEXT_PUBLIC_`.

## Flujo de datos de un lanzamiento

1. El administrador crea un lanzamiento y elige ebooks del catálogo.
2. El servidor valida los datos e inserta configuración, productos, tres tramos opcionales y siete requisitos operativos en una sola operación atómica.
3. El panel genera el brief para CERNEO y permite registrar enlaces y estados.
4. CERNEO coordina publicaciones, captación por DM, anuncios, automatizaciones, entrega y medición.
5. El panel bloquea el estado “Listo” y “Publicado” hasta que todas las tareas obligatorias estén aprobadas y exista un destino de CTA o un ebook principal.
6. La página pública sólo responde para un lanzamiento publicado; el administrador puede verla antes con su clave.
7. Cada cambio relevante queda registrado en `launch_activity`.

## Cambios futuros

- Esquema: agregar una migración reversible en `database/migrations/` y probarla primero en una rama temporal de Neon.
- Nuevo ebook: seguir el runbook de `AGENTS.md`; después aparecerá automáticamente en el selector del panel.
- Nueva automatización CERNEO: documentar el contrato real antes de sumar un webhook. Hasta entonces, el brief y checklist son el contrato operativo.
- Nunca editar datos productivos del workshop para probar el centro de lanzamientos.
