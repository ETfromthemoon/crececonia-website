# Auditoría nocturna — 22 de octubre de 2026

Ejecución del 22 de octubre, aproximadamente 22:00–22:20 America/Santiago
(23 de octubre, 01:00–01:20 UTC). Las horas de evidencia siguientes son UTC.

## Base, alcance y comparación

- `origin/main` y producción siguen en `452c90e1c6fee0bfa6804960f959a72943eb792f`.
  Vercel `dpl_4wDHE91CfsooACjAvy3LyvX74DHF` permanece READY.
- Los PR [#66](https://github.com/ETfromthemoon/crececonia-website/pull/66) y
  [#67](https://github.com/ETfromthemoon/crececonia-website/pull/67) siguen OPEN,
  sin merge. A1–A7 y B1–B5 permanecen pendientes; esta entrega no los duplica.
- Esta rama parte de main y reúne tres defectos adicionales. No se demostró
  ningún defecto anterior resuelto en producción ni un incidente nuevo de pago.
- El checkout compartido permanece en `feat/ui-resource-experience`, `80809e5`,
  conservando sus archivos nuevos ajenos. Se trabajó en un worktree independiente,
  rama `codex/auditoria-nocturna-20261022`, sin incorporar `.agents/`, skills o PDFs.

## Defectos confirmados y reparación

| ID | Severidad | Causa, evidencia e impacto | Cambio |
| --- | --- | --- | --- |
| C1 | P2 · datos | `/api/ebook/download` ejecutaba SELECT de `download_count` y UPDATE separado sin esperar las promesas ni registrarlas con Next. Dos peticiones pueden sobrescribir el mismo incremento; el trabajo posterior a la respuesta tampoco tiene su vida útil asegurada. No se midió una pérdida histórica concreta. Las regresiones de ciclo de vida fallaron antes del cambio. | `after` de Next mantiene la tarea después de preparar el PDF. Un UPDATE parametrizado incrementa el contador en la base y registra la hora. El fallo se registra sin impedir la entrega. La vista `public.ebook_purchases` está confirmada como actualizable por SELECT a las 01:13:07. No se ejecutó un UPDATE productivo. |
| C2 | P3 · observabilidad de email | La waitlist ignoraba el `{ error }` que devuelve `Resend.emails.send`; el catch sólo observaba excepciones. Un rechazo de proveedor/red quedaba sin registro pese a conservar correctamente el alta. La regresión de rechazo explícito falló antes del cambio. | Se propaga el error devuelto hasta el catch existente. Se conserva la inscripción y HTTP 200, registrando el fallo. Una prueba adicional usa el SDK real instalado, con fetch y persistencia simulados, y verifica un fallo de red normalizado. No se envía correo ni se añade reintento automático. |
| C3 | P2 · accesibilidad | Los tres horarios y el mensaje de llamada tenían labels separados sin `htmlFor`/`id`. A las 01:12 UTC el navegador productivo confirmó cuatro controles con cero etiquetas y sin aria-label; el árbol accesible los mostró sin nombre. | Se vinculan los cuatro labels mediante IDs únicos en `app/solicitar-llamada/page.tsx`. El botón sigue deshabilitado sin token. |

Archivos funcionales: `app/api/ebook/download/route.ts`,
`lib/ebook-waitlist.ts` y `app/solicitar-llamada/page.tsx`.
Pruebas: `tests/download.test.ts`, `tests/waitlist.test.ts` y
`tests/waitlist-resend-contract.test.ts`.

La inspección del SDK descartó una hipótesis inicial sobre excepciones de red
en las notificaciones generales: el SDK las devuelve como `{ error }`, que ese
helper ya registra. No se incluye esa hipótesis ni su cambio en la reparación.

## Mapa verificable de entradas, salidas y dependencias

| Entrada → salida | Componentes/dependencia real | Evidencia de esta ejecución y límite |
| --- | --- | --- |
| HTTP/apex → HTTPS www | DNS/TLS → Vercel → App Router | Ambos HTTP 308; apex HTTPS 307 a www. TLS 1.3 validado en ambos dominios, certificados hasta 25 dic 2026. |
| Inicio/rutas de servicio → menús/CTA | Navbar, portada editorial, Footer, EvaluacionProvider, ChatWidget | GET, enlaces/assets/hash del HTML y navegación de llamada en Chrome. Sin hashes locales rotos ni img sin alt detectados. No equivale a WCAG completo ni a todas las interacciones. |
| Centro → guías/skills/enlaces | `content/public-catalog.json`, `lib/public-catalog.ts`, `lib/hub.ts` → fichas dinámicas | 9 guías y 5 skills comprobadas; archivos públicos incluidos en HEAD. `/guias` y `/skills` redirigen 308. Sin nuevas roturas internas. |
| Skill → archivo público | SkillDownloadButton → `/api/public/skills/[slug]/request-download` → `/downloads/skills/*` + PostHog | Código/consumidores, pruebas de catálogo/descarga y HEAD de archivos. No se genera una solicitud válida de descarga ni su evento artificial. |
| Newsletter → suscriptor | Popups → `/api/public/subscribe` → Neon `commerce.public_subscribers` | POST vacío 400; SELECT confirma 2 filas; pruebas de rutas aprobadas. Sin alta real. |
| Evaluación → token → solicitud de llamada | EvaluacionModal → `/api/public/evaluacion` → Neon + notificación Resend; `/solicitar-llamada` → `/api/public/solicitar-llamada` | POSTs vacíos 400; SELECT 0 evaluaciones y 0 llamadas. Navegador sin token: aviso de enlace inválido y envío deshabilitado. C3 confirmado. No se agenda ni se envía email. |
| Chat → orientación/CTA | ChatWidget → rutas locales + eventos | Consumidores de las superficies globales y tests vigentes. No se da por demostrada una conexión LLM por su copy o variables. |
| Ebook → waitlist | EbookComingSoon → `/api/ebook/waitlist` → Neon + Resend | POST vacío 400; 2 filas, sin cambios. C2 confirmado contra contrato de SDK; pruebas aprobadas con red simulada. Sin inscripción/envío reales. |
| Catálogo → precio/combo/descuento → orden | `lib/ebook-*`, `/api/ebook/cupos`, `/api/ebook/discount/validate`, `/api/flow/create` → Neon y Flow | 7 libros activos, GET de cupos disponible y pruebas de pricing/bundles/creación/descuentos aprobadas. Creación vacía 400, descuento vacío 400. No se crea orden/cobro ni se canjea código. |
| Callback → compra/cupo/canje → email/PDF | `/api/flow/confirm` → adapter Neon + Resend; `/api/ebook/download` → S3 privado | Fixture y pruebas de confirmación/descarga aprobadas. Callback sin token 200 sin trabajo; descarga sin token 401. C1 afecta contador posterior, conservando autorización/PDF. Flow real y 14 PDFs privados siguen sin verificar por credenciales ausentes. |
| Retorno/recuperación → enlaces autorizados | `/success`, resolvedor por token; `/ebook/descargar` → `/api/ebook/recover` → Resend | Tests de recursos/recuperación aprobados; recovery vacío 400; antiguo purchases 410. B2/B5 siguen pendientes en #67. Sin usar un token de comprador ni enviar recuperación. |
| Admin → lanzamiento/checklist → borrador social | Gates ADMIN_SECRET, `/api/admin/launches`, siete tablas `public.launch_*`, Zernio | Páginas sin key 404, GET de API de creación 405, lanzamiento inexistente 404; SELECT 0 launches. Pruebas de modelo/Zernio aprobadas. Sin creación, sincronización mutante, publicación, DM ni gasto. |
| Workshop/clase → acceso/entrega | Rutas `workshop-*`/`class-*`, Flow, Neon, Resend | Pruebas existentes aprobadas; workshop congelado sin cambios. Recovery Actions 39879557844 terminó a las 00:41:02 con 0 envíos/0 fallos. No se dispararon jobs. |
| Email → eventos de proveedor almacenados | Resend → webhook firmado → Neon | SELECT: 10 recoveries sent y 1 redeemed con `email.delivered`, 1 suppressed. Sin cambio. Es evidencia almacenada de esos envíos, no consulta actual a Resend ni verificación de recepción del ebook. |
| Eventos → reporte | PostHog proyecto 533562, trackers y `/api/analytics/report` → Actions semanal | Proyecto, taxonomía y columnas confirmados por conector; SQL relativo 7 días: 137 `ecosystem_page_view`; sin filas de los otros 4 eventos consultados en esa ventana. Incluye tráfico de auditoría. Sin inferir personas/ventas ni comparar variantes sin volumen. API sin secreto 401. |
| Rama/PR → CI/Preview → producción tras merge | GitHub Actions Tests + integración Vercel | Main/SHA productivos confirmados, sin merge. Pruebas y build locales aprobados. El estado final de CI y Preview de esta entrega se registra en el PR y en la memoria. |
| Horarios → automatizaciones | Actions recovery/semanal, `vercel.json`, automatización local nocturna | Configuración e historial consultados sin cambios. Recovery configurado cada 5 min pero sigue espaciado horas en la ejecución real; estado ya documentado. Semanal del 19 oct exitoso; B4 pendiente en #67. |

## Cobertura, datos y límites

- Evidencia HTTP de las 01:02–01:08 UTC: **53 GET, 153 HEAD internos/assets,
  16 externos y 40 URLs de sitemap 200**. Los gates 401/404 y la ruta inexistente
  son esperados. Un enlace externo de OpenAI pasó de 200 a 403 en HEAD; otra
  lectura llegó al límite de tamaño de la herramienta. Se clasifica como acceso
  externo no verificable, no como enlace roto confirmado. No se modifica su sitio.
- Canonicals, títulos, robots, sitemap y OG contrastados con HTML y mapa previo;
  la metadata de llamada sigue como A6 pendiente de #66. No se repara dos veces.
- Chrome, llamada productiva: cuatro controles sin nombre accesible y cero
  warnings/errors de consola en esa visita. El navegador integrado no logró
  abrir la página; se usó una pestaña nueva de Chrome.
- Vercel: sin grupos de errores en la consulta inicial de 30 min y sin logs
  error/fatal productivos en la segunda consulta. La retención limitada ya
  documentada no permite afirmar ausencia de incidentes durante 24 horas.
- Neon SELECT a las 01:06:20: **55 compras, 23 pendientes, 2 waitlist,
  2 suscriptores, 0 evaluaciones/llamadas/lanzamientos**. Sin duplicados
  flow_order+resource, cupos fuera de rango o compras con código sin uso.
  Persisten 3 manifiestos históricos no-array. No hubo escrituras ni conciliación
  con Flow; eso no prueba cero pagos pendientes de entrega.
- Zernio: Instagram/TikTok healthy, última sincronización 22 oct 23:43/22:59 UTC;
  persisten los cuatro posts fallidos históricos. No se reintenta el timeout
  cuya publicación externa es incierta ni se repite como alerta nueva.
- Los comandos `ebook:verificar`, `flow:contract`, `ebook:recuperar` dry-run y
  `posthog:report -- 7 --json` se intentaron y quedaron bloqueados por credenciales
  locales ausentes. El recuperador de main todavía usa la integración retirada
  corregida en #66. No se extrajeron secretos desde Vercel. Storage/Flow/Resend
  actuales conservan los límites de verificación anteriores.
- PostHog: lectura mediante [SQL](https://posthog.com/docs/data-warehouse/sql),
  limitada a eventos agregados y sin datos personales. La conexión no habilita
  búsqueda de conocimiento empresarial ni lectura de skills de proyecto;
  se usaron catálogo, taxonomía y SQL disponibles. La ausencia de filas es de
  esa ventana y consulta, no una conclusión sobre el negocio.

La evidencia privada vive fuera del repositorio público en la carpeta de esta
automatización: `production-baseline.json`, `production-20261021.json`,
`supplement-20261022.json` y `critical-probes-20261022.json`.

## Validación, riesgos y revisión de Sergio

- Se leyeron las guías instaladas de Route Handlers y `after` antes de editar;
  la versión instalada y del lockfile es **Next 16.3.4**.
- Regresiones de C1 y C2 fallaron antes del cambio. Validación final:
  **`npm test`: 47 archivos, 374 pruebas aprobadas**; **`npm run build` aprobado**,
  incluyendo TypeScript. El total difiere de los PR anteriores porque todos
  parten de main y agregan regresiones distintas.
- La comprobación de SDK real sólo simula fetch/persistencia; no llama a Resend.
  Las pruebas de contador simulan base/`after`; no se verificó concurrencia con
  escrituras productivas. C1 usa una sentencia atómica sin cambiar esquema.
- El contador mide respuestas PDF autorizadas preparadas, no que la persona
  haya leído o guardado el libro. Sigue siendo auxiliar: un fallo se registra
  y no bloquea el PDF. `after` queda sujeto al tiempo máximo de la plataforma.
- C2 añade visibilidad del fallo; no recupera emails históricos ni incorpora
  una cola durable o reintentos. La inscripción continúa guardada.
- Sin nuevas dependencias, migraciones, cambio de precios/productos, envíos,
  publicaciones sociales, gasto, credenciales, merge ni despliegue productivo.
- [ ] Revisar C1–C3 y el diff completo, incluidos tests nuevos.
- [ ] Revisar CI y Vercel Preview en el SHA final del PR; comprobar labels y
  bloqueo sin token sin enviar una solicitud real.
- [ ] Considerar #66/#67 por separado; las reparaciones de esta noche no los sustituyen.
- [ ] Completar Flow/PDFs/entregas desde un entorno autorizado con credenciales.
- [ ] Decidir el merge: producción conserva C1–C3 hasta integrar el código.
