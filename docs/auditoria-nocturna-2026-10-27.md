# Auditoría nocturna — 27 de octubre de 2026

Ventana de ejecución: noche del 27, desde 00:57 UTC del 28 aproximadamente (22:00 America/Santiago). Base comprobada: `origin/main` b4bb68b87f0ececeb6c9519010888e89f6a73108 y producción Vercel `dpl_4BE4z3czvaGuRyzRMkHcxi9GPWe6`, READY y mismo SHA. Se contrastaron memoria, mapa y evidencia de la noche anterior. Los PR #66–#68 están integrados; no son pendientes ni se duplican. El PR #47 queda fuera de este cambio.

## Defecto nuevo confirmado y reparación

**D1 · P3 · Confirmación prematura de postulación.** En mentoría e implementación, `QualificationForm.submit` únicamente construye un enlace con el mensaje, llama a `window.open`, cambia el estado local y registra un evento. No envía el mensaje ni confirma su recepción. Sin embargo, la pantalla siguiente decía «Postulación enviada» y mostraba un check de éxito. La lectura del flujo en el código productivo confirma la discrepancia; no se envió una postulación para reproducirla.

`components/QualificationForm.tsx` ahora dice «Postulación preparada», «Tu contexto está listo para enviar» y pide revisar el mensaje y pulsar Enviar en WhatsApp. El check pasa a una flecha. También explica cómo volver a intentarlo si WhatsApp no se abrió. Ambos servicios consumen este mismo componente mediante `ServiceLanding`. Cambio exclusivamente de texto e indicador; sin dependencias, persistencia, nueva integración ni cambio de validaciones. Riesgo bajo. Producción conserva el texto anterior hasta que Sergio apruebe y fusione el PR.

No se agregan tests que se limiten a comparar este texto reversible. Se revisó el flujo y se ejecutaron nuevamente las comprobaciones existentes. La transición final de WhatsApp y la recepción del mensaje requieren una acción humana; no se afirman comprobadas.

## Mapa verificable de entradas, dependencias y salidas

| Entrada → salida | Componentes y dependencia real | Comprobación y límites |
| --- | --- | --- |
| HTTP/apex → HTTPS www | DNS, TLS, Vercel | HTTP308 ambos hosts; apex HTTPS307; TLS1.3 válido hasta 25dic2026. |
| Páginas → menús/CTA/assets | App Router, Navbar/Footer y enlaces | 53 GET, 153 HEAD internos/assets y 16 externos; sin fallos inesperados. Sin fragmentos locales rotos ni imágenes sin atributo alt en HTML. No auditoría WCAG completa. |
| Rastreador → SEO | sitemap, robots, metadatos, OG y llms.txt | 40 URLs de sitemap200; OG/robots/llms200; canonicals y títulos disponibles en evidencia HTTP. No prueba de indexación. |
| Centro → guía/skill → archivo | catálogo JSON versionado, public-catalog y archivos públicos | Rutas/archivos comprobados; guias/skills308 hacia centro; desconocidos404; tests catálogo/descarga pasan. La API de descarga de skills registra analítica y devuelve URL pública, sin exigir una suscripción. |
| Suscripción → registro | SuscriptorPopup → /api/public/subscribe → Neon | POST vacío400; consulta agregada y tests públicos. Sin alta ni email real. |
| Evaluación modal → token → llamada | EvaluacionModal → APIs públicas → Neon/Resend | POST vacíos400; llamada sin token bloqueada, cuatro campos con nombre accesible en Chrome. No envío ni token real. |
| Mentoría/implementación → mensaje preparado → WhatsApp | QualificationForm y contact.whatsappUrl | Inspección productiva de implementación y del código compartido; entrega final manual, sin persistencia automática en Neon. D1 corrige la confirmación. El evento qualification_submitted registra la interacción local, no recepción de un mensaje. |
| Chat → orientación → enlace | ChatWidget, reglas locales y analítica | Código confirma respuestas locales; widget presente. No se presume un servicio LLM remoto ni se envió conversación. |
| Ebook → waitlist | ComingSoon → API waitlist → Neon/Resend | POST vacío400 y suite aprobada; no registro/envío. |
| Catálogo/precio/código → checkout | ebook-catalog/pricing/bundles → Neon y Flow | Precio productivo $17.900 CLP; cupos200; create vacío y descuentos inválidos400. No orden, compra o canje. |
| Callback → compra/cupo/código/email | Flow confirm → Neon/Resend/PostHog | Confirm sin token200 sin trabajo; suite con fixture real aprobada. No callback pagado, cambio de datos o email. |
| Retorno/recuperación → descarga | success/recover/purchased-resources → permisos y Storage | Chrome sin token muestra recuperación; recover vacío400, purchases410 y download401. Suite entrega aprobada; 14 PDFs privados sin verificar en Storage real por credenciales ausentes. |
| Admin → lanzamiento → borrador | admin/launches → Neon y Zernio | GatePOST401 y páginas404 sin clave; disponibilidad de lanzamiento desconocido404; suite launch aprobada. Sin crear borradores, publicar, activarDM ni anuncios. |
| Material histórico → acceso autorizado | Clase/workshop, tokens | Material clase sin token401, recurso workshop inválido404; admin histórico404 sin clave. No se invocó availability histórico: puede liberar reservas y excedería el alcance de solo lectura. |
| Cron → recuperación de workshop | GitHub Actions → API protegida → Neon/Resend | Último run40605599300 SUCCESS27oct23:57UTC: sent0/failed0/suppressed0. Gate sin credencial401. No se dispararon jobs. |
| Email → estado registrado | Webhook Resend → workshop_checkout_recoveries | SELECT28oct01:01:47UTC: mismos10sent+1redeemed con email.delivered y1suppressed. Evidencia indirecta; sin API/logsResend ni recepciónPDF actual. |
| Eventos → reporte | PostHog y Actions | Taxonomía/columnas actuales; misma SQL7d de auditorías anteriores:168ecosystem_page_view, sin filas para los otros cuatro eventos consultados. Incluye visitas de auditoría; no inferir ventas, ausencia de fallos ni conversión. Último semanal40383572071/issue69 sin volumen de variantes suficiente. |
| GitHub → despliegue | Actions/Vercel | Producción READY mismoSHA que main. Consulta de grupos runtime24h sin resultados; logs error/fatal00:30–01:00UTC sin filas. La retención limita cobertura; no equivale a logs íntegros24h. |
| Zernio → cuentas/posts | Perfil CrececonIA | Dos cuentas healthy; syncIG00:45/TikTok00:47UTC28oct. Mismos cuatro fallos históricos, sin retry/publicación. |

## Clasificación, verificación y límites

- **Nuevo reparado:** D1. **Resueltos ya integrados:** A/B/C de las tres auditorías anteriores. **Sin cambio:** límites operativos y fallos históricos, sin nuevo comprador afectado demostrado. El enlace externo OpenAI evals pasó de HEAD403 a200; recuperación observada sin cambio de código.
- Neon SELECT28oct01:00:40UTC: mismos55compras,23pendientes,2waitlist,2suscriptores,0evaluaciones/llamadas/lanzamientos;0duplicados por flow_order+resource y0cupos inválidos. Agregados únicamente, sin PII ni mutaciones.
- `npm test`: 53 archivos, 432 pruebas PASS antes y después del cambio. `npm run build`: PASS antes y después del cambio, incluyendo TypeScript, Next16.3.4 instalado. La guía local `use-client.md` se leyó antes de editar.
- 13 probes principales y 8 adicionales de gates/recursos: estados esperados. Chrome: llamada, producto, retorno, selector e implementación; sin warnings/errors en las visitas comprobadas. No servidor local ni transacciones reales.
- Cuatro comandos de solo lectura intentados: `ebook:verificar`, `flow:contract`, `ebook:recuperar` dry-run y `posthog:report -- 7 --json`. Exit1 por configuración local ausente; Flow real/conciliación,14PDF y APIResend continúan sin verificar. El texto SupabaseStorage del primer comando es fallback sin configuración; no identifica el backend productivo ni demuestra archivos faltantes.
- Conector PostHog: guía de consultas y esquema leídos; business-knowledge no disponible y skills de proyecto sin scope. No se modificó la conexión. Sin inferencias estadísticas ni recomendaciones de precio/copy por falta de volumen.
- Cron de recuperación sigue mostrando intervalos de horas frente a5min configurados, ya observado antes; no se cambió el scheduler. Concurrencia transaccional anterior sigue documentada y requeriría autorización para migraciones; sin incidencia nueva demostrada.

Evidencia completa en el directorio privado de esta automatización: production-baseline.json (actual), production-before-night-20261027.json (anterior), supplement-night-20261027.json, critical-probes-night-20261027.json, extended-gates-night-20261027.json, services-night-20261027.json y logs final-tests/build-20261027.log. El checkout compartido y sus archivos ajenos permanecen intactos. La revisión visual del cambio se realiza en el Preview del PR; sus checks y URL se registran en ese PR al estar disponibles.

Fuentes operativas: [recuperación Actions](https://github.com/ETfromthemoon/crececonia-website/actions/runs/40605599300), [último reporte semanal](https://github.com/ETfromthemoon/crececonia-website/issues/69).

Sin compras/reembolsos, envíos reales, escrituras productivas, migraciones, activación de ebooks, publicaciones sociales/DM, gasto, merge, pushmain, deployproducción ni cambios de seguridad/credenciales.

## Lista para Sergio

- [ ] Revisar que la confirmación exija el envío manual en WhatsApp en ambos servicios.
- [ ] Revisar el Preview y checks enlazados en el PR; aprobar/mergear si está conforme.
- [ ] Mantener separados los límites operativos de Flow/Storage/Resend de esta corrección de texto.
