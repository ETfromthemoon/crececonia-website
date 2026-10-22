# Auditoría nocturna — 21 de octubre de 2026

Inspección entre 2026-10-22 00:53 y 01:09 UTC, America/Santiago UTC−3. Base `origin/main` 452c90e1c6fee0bfa6804960f959a72943eb792f, idéntica a producción `dpl_4wDHE91CfsooACjAvy3LyvX74DHF` READY. Rama nueva `codex/auditoria-nocturna-20261021`. Checkout aislado en `C:/Users/sergio/.codex/worktrees/auditoria-nocturna-20261021/crececonia`. Se preservaron todos los archivos nuevos del checkout original `feat/ui-resource-experience`; no tenía cambios tracked ni staged. Next instalado 16.3.4; guías locales de Route Handlers y metadata leídas antes de editar.

## Comparación con la ejecución anterior

El PR #66 sigue abierto, sin merge. Sus siete reparaciones A1–A7 permanecen pendientes en producción; esta ejecución no las duplica. Sin cambios en estados HTTP del barrido anterior ni en los agregados de Neon. Ningún defecto anterior puede declararse resuelto en producción. La observación antigua de OG ausente sigue descartada: los assets responden 200. Los cuatro posts fallidos de Zernio son los mismos; no se reintentaron ni se genera una alerta nueva por ellos.

## Defectos nuevos confirmados y reparados

| ID | Severidad | Evidencia y causa | Cambio |
| --- | --- | --- | --- |
| B1 | P1 | Un HTTP 503 de `payment/getStatus`, un JSON sin estado o un estado desconocido terminaban en HTTP 200 OK del webhook, aunque el pago no se había verificado. Se reprodujo con seis regresiones fallidas antes del cambio. No se identifica un comprador histórico afectado. | `app/api/flow/confirm/route.ts` distingue errores de verificación de estados 1/3/4 válidos. Error HTTP/estado inválido termina en 500 RETRY sin insertar compras, borrar manifiestos ni enviar correo. La frecuencia de reintento de Flow no se prueba aquí. |
| B2 | P1 | El resolvedor retornaba apenas encontraba una fila de compra. Durante la inserción por libro de un combo podía omitir el resto, tanto en el retorno como al pedir su descarga. Una regresión de combo parcial falló antes del cambio. El fallback tampoco comparaba el monto del manifiesto con el pagado. | `lib/ebook-purchased-resources.ts` conserva compras registradas y completa sólo con la orden acreditada por Flow y un manifiesto válido cuyo total coincide. Excluye recursos desconocidos, duplicados y montos inválidos. Sin Flow conserva los permisos existentes; consulta acotada a 8 segundos. |
| B3 | P2 | POST de sólo lectura con `{"code":123}` a `/api/ebook/discount/validate` produjo 500 en producción a las 01:03:58 UTC; Vercel registró un error `trim` en esa ruta. El tipo TypeScript no validaba JSON en runtime. | Código, recurso y previewKey se validan antes de consultar precio/descuento. HTTP 400 para entradas malformadas y compatibilidad con clientes que omiten resource. No se crea/canjea ningún código. |
| B4 | P2 | El reporte semanal usa `npm ... | tee ...` bajo `/usr/bin/bash -e`, confirmado en el run 39308748478. Reproducción con `false | cat`: código 0 con ese shell y 1 con pipefail. Podía crear un issue con una salida fallida; no se afirma que haya ocurrido en ese run exitoso. | `.github/workflows/posthog-weekly-report.yml` usa `shell: bash` en la generación para propagar fallos del pipeline. No cambia horarios, envíos ni activa workflows manualmente. |
| B5 | P2 | El retorno `/success` anunciaba «Compra exitosa» y «Tu compra está confirmada» incluso sin token/libros autorizados. Reproducido al renderizar sin token y con token pendiente; comprobado también por GET productivo sin token. | `app/ebook/de-cero-a-claude-en-una-semana/success/page.tsx` muestra estado de verificación/recuperación e icono de espera hasta disponer de libros autorizados. Mantiene noindex y ofrece recuperación por email. |

Los defectos de B1/B2 son comportamientos reproducidos del código, no incidentes de compras demostrados. B3 y B5 también se observaron mediante peticiones seguras a producción. Todos los cambios permanecen pendientes de merge.

## Mapa verificable de flujos y dependencias

| Entrada → salida | Componentes y dependencia | Comprobación de esta ejecución y límite |
| --- | --- | --- |
| HTTP/apex → HTTPS www | DNS, TLS y Vercel → App Router | DNS resuelto; TLS 1.3 con validación de certificado en ambos dominios, vence 25 dic 2026. HTTP 308 y apex HTTPS 307 a www. |
| Inicio/servicios → navegación y CTA | `app/page.tsx`, Navbar, EditorialHero, ResourceNav, Footer, EvaluacionProvider | GET y enlaces/hash del HTML; sin alt ausentes ni hashes locales rotos detectados. Una carga de navegador sin errores/warnings de consola. No equivale a auditoría WCAG completa. |
| Centro → guías/skills/enlaces | `content/public-catalog.json`, `lib/public-catalog.ts`, `lib/hub.ts` → páginas dinámicas | 9 guías y 5 skills, todas sus fichas y archivos públicos disponibles. `/guias` y `/skills` redirigen 308. Pruebas del catálogo y UI aprobadas. |
| Skill → archivo | SkillDownloadButton → `/api/public/skills/[slug]/request-download` → `public/downloads/skills` + PostHog | Tests del endpoint/archivos y HEAD de descargas. No se pulsó una descarga para crear telemetría de usuario artificial. |
| Newsletter → suscriptor | Popups → `/api/public/subscribe` → `lib/public-leads.ts` → Neon `commerce.public_subscribers` | Pruebas y SELECT; 2 suscriptores. POST vacío devuelve 400 sin escribir. No alta real. |
| Evaluación → token → solicitud de llamada | EvaluacionModal → `/api/public/evaluacion` → Neon; aviso Resend con scheduling_token; página → `/api/public/solicitar-llamada` | Tablas verificadas; 0 evaluaciones y 0 llamadas. Pruebas y POSTs vacíos 400. Sin emails ni uso de token real; no se confirma agenda externa. |
| Chat → orientación/CTA | ChatWidget y enlaces locales → PostHog | Código/consumidores ya mapeados, sin integración LLM runtime demostrada. No se confunde copy del widget con una conexión externa. |
| Ebook → waitlist | EbookComingSoon → `/api/ebook/waitlist` → Neon + Resend | Tests y SELECT; 2 filas. POST vacío 400, sin inscripción/email. |
| Catálogo → precio/combo/descuento → checkout | Catálogo y pricing/bundles → `/api/ebook/cupos`, `/api/ebook/discount/validate`, `/api/flow/create` → manifiesto Neon + Flow | 7 libros activos; tienda/cupos disponibles. Tests de precios, creación, descuentos y validación aprobados. Ninguna orden ni cobro real. B3 reproducido sin escrituras. |
| Callback → compra/cupo/canje → email → PDF | `/api/flow/confirm`, adapter `lib/supabase.ts` sobre Neon, Resend; `/api/ebook/download` → S3 | Fixture Flow y tests de webhook/descarga aprobados; sin token 401. B1 reparado; canje/concurrencia del PR anterior siguen fuera del alcance sin solución transaccional autorizada. PDFs privados no verificados por falta de credenciales S3. |
| Retorno y recuperación → libros autorizados | `/success`, `getPurchasedBooksByToken`; `/ebook/descargar` → `/api/ebook/recover` → compras + Resend | B2/B5 y tests de recuperación aprobados; no se enviaron correos. La consulta adicional a Flow puede agregar hasta 8 s al retorno, conservando los permisos registrados al fallar. |
| Admin → lanzamiento → borrador/checklist | Gate ADMIN_SECRET → `/api/admin/launches` → siete tablas `public.launch_*` + Zernio | Gates 404/401 sin key; SELECT 0 lanzamientos. Modelo/tests aprobados. No crear borrador, DM, anuncio ni publicación. Las correcciones de selección/avance del PR #66 siguen pendientes. |
| Workshop/clase → pago/aula/entrega/salud | Rutas y módulos `workshop-*`/`class-*`, Flow, Neon, Resend | Pruebas existentes aprobadas. Recovery Actions 39699835936 finalizó 00:28:01 UTC con `{ok:true,sentCount:0,failedCount:0,suppressedCount:0}`. Sin intervención ni modificación del workshop congelado. |
| Emails → estado del proveedor | Resend → `/api/webhooks/resend` firmado → Neon | Agregado de recoveries: 10 sent + 1 redeemed con `email.delivered`, 1 suppressed. Son estados almacenados, no consulta actual a Resend ni prueba de lectura/recepción de cada ebook. |
| Eventos → reporte | EcosystemTracker/PostHogProvider, `lib/posthog-*`, proyecto 533562 → API protegida y Actions | Proyecto confirmado por conector. SQL relativo 7 días: 124 `ecosystem_page_view`, 1 `skill_download_succeeded`, 0 eventos checkout requested/failed/created. Incluye tráfico de auditoría; no son personas únicas ni evidencia de cero ventas. Sin volumen para comparar variantes. |
| Git/PR → tests/Preview → producción tras merge | `.github/workflows/test.yml` + integración Vercel | Base/SHA productivos y estado del PR anterior comprobados. Nueva entrega en rama independiente; Preview y checks se registran en el PR y en memoria al cerrar. No merge/deploy productivo. |
| Programación → jobs | `vercel.json`, Actions semanal y recovery, automatización local nocturna | Configuración e historial leídos. Recovery cada 5 min configurado pero runs reales separados por horas, igual que ayer. Semanal 19 oct 19:10 UTC exitoso. B4 reparado sin ejecutar jobs ni cambiar su frecuencia. |

## Cobertura, fuentes y límites

- Evidencia local fuera del repositorio público: `C:/Users/sergio/.codex/automations/auditor-a-nocturna-integral-crececonia/production-baseline.json` y `supplement-20261021.json`; la línea anterior se preservó en `production-20261020.json`. 53 GET principales, 153 HEAD internos/assets, 16 externos y 40 URLs de sitemap 200. Siete estados 401/404 esperados de gates/ruta inexistente. Sin cambios HTTP respecto a ayer. HEAD no demuestra integridad completa de binarios.
- Canonicals/metadatos/robots/OG revisados mediante HTML; el canonical de llamada continúa como A6 pendiente del PR #66. No se declara que esa reparación se haya integrado. El checkout original y sus archivos ajenos se conservaron.
- Vercel: ventana inicial de 30 min sin grupos error/fatal. Después, la petición de reproducción B3 produjo un error deliberado en descuentos; no debe atribuirse a tráfico espontáneo. La retención Hobby ya documentada impide inferir ausencia de incidentes durante toda la noche.
- Neon SELECT a 00:58:44 UTC: 55 compras, 23 pendientes, 2 waitlist, 2 suscriptores, 0 evaluaciones/llamadas/lanzamientos; 0 duplicados order+resource, cupos fuera de rango o compras con código cuyo contador sea 0. Persisten 3 manifiestos históricos no-array; sin Flow no se clasifican como pagos sin entregar. Cero escrituras.
- Zernio: ambas cuentas CrececonIA healthy, sin reconexión requerida; sync Instagram 23:38 UTC y TikTok 22:53 UTC del 21 oct. Mismos cuatro posts fallidos históricos que ayer; no se reintenta el timeout incierto.
- Los cuatro comandos `ebook:verificar`, `flow:contract`, `ebook:recuperar` (dry-run) y `posthog:report -- 7 --json` se intentaron: bloqueados por credenciales locales ausentes. No se copiaron secretos desde producción. Neon/PostHog se comprobaron por conectores. El conector de Storage del proyecto de datos devuelve `region_unavailable`; el proyecto antiguo llamado storage está archivado y no se activó. Eso no demuestra que falten objetos del S3 configurado en la aplicación.
- Sin acceso actual a API/logs Resend ni a credenciales Flow/S3: contrato Flow real, conciliación de pagos y 14 PDFs privados permanecen sin verificar. No se afirma entregabilidad total. No hubo compras, reembolsos, envíos, migraciones, cambios de cupos/códigos, activación de productos, publicaciones/DM, gasto ni push a main.
- Contratos contrastados con [Flow API](https://developers.flow.cl/api); comportamiento de shell con [GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idstepsshell); conteos SQL con [documentación PostHog](https://posthog.com/docs/data-warehouse/sql). El buscador de conocimiento empresarial de PostHog no está habilitado; no es evidencia de eventos ausentes.

## Verificación y revisión

- Regresiones reprodujeron B1/B2/B5 antes de modificar sus implementaciones; B3 también se reprodujo en producción sin datos válidos ni escrituras.
- `npm test`: **48 archivos, 396 pruebas aprobadas**. Son los tests de esta rama basada en main; el PR #66 tiene pruebas adicionales distintas, por eso no se compara el total como una regresión.
- `npm run build`: **aprobado**, incluyendo TypeScript. Segunda ejecución después del ajuste de retorno y timeout; no se inició servidor local.
- B4: reproducción de pipeline fallido: shell anterior exit 0, shell estricto exit 1. No se ejecuta el workflow semanal porque envía emails/crea issues.
- Diff tracked, archivos nuevos y consumidores de la función de autorización revisados. Sin dependencias, migraciones ni refactors ajenos. El PR nuevo comparte el archivo del webhook con el PR #66: revisar ambos y ejecutar checks sobre el resultado integrado antes del merge.

## Lista para Sergio

- [ ] Revisar B1–B5, resultados de CI y Preview del PR nuevo.
- [ ] Tener en cuenta que el PR #66 continúa pendiente; esta entrega no lo sustituye.
- [ ] Verificar contrato/pagos Flow y PDFs privados desde un entorno autorizado con credenciales; consultar Resend para entregas reales. No pegar secretos en el chat.
- [ ] Decidir el merge cuando corresponda. Producción conserva los defectos hasta integrar el código; la auditoría no hace merge ni despliegue de producción.
