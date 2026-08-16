# CrececonIA

Sitio web de CrececonIA, construido con Next.js y desplegado mediante la
integracion GitHub -> Vercel.

## Flujo de revision

La revision visual se realiza unicamente desde el Pull Request en GitHub,
usando el enlace `Preview` del deployment generado por Vercel. No se usan
servidores locales ni URLs de localhost como entregable visual.

## Validacion

```bash
npm test
npm run build
```

## Analytics de todo el ecosistema

PostHog se inicializa en el layout global y mide pageviews de navegacion,
secciones visibles, profundidad de scroll, CTA, evaluacion, chat, newsletter,
skills, ebooks, solicitudes de llamada y formularios de calificacion. Los
eventos semanticos no incluyen emails, nombres ni texto libre del usuario; las
entradas de autocapture y session replay se mantienen enmascaradas.

El reporte local se genera con:

```bash
npm run posthog:report -- 7
npm run posthog:report -- 7 --json
```

El endpoint protegido `GET /api/analytics/report?days=7` devuelve el mismo
reporte en JSON para un agente. Acepta `Authorization: Bearer ...` o el header
`x-analytics-key`. Configura `POSTHOG_PERSONAL_API_KEY` para lectura en
PostHog y `ANALYTICS_REPORT_SECRET` para el agente; como compatibilidad, el
endpoint tambien acepta `ADMIN_SECRET`, y para el cron `CRON_SECRET`.

Cada lunes el workflow `.github/workflows/posthog-weekly-report.yml` consulta
la ventana de siete dias y abre un issue con metricas y sugerencias. Las
sugerencias no modifican la pagina automaticamente.

### Entrega por correo y revision manual

El mismo workflow puede enviar el reporte por Resend. Para habilitarlo en
GitHub Actions, configura los secrets `POSTHOG_PERSONAL_API_KEY`,
`RESEND_API_KEY` y `POSTHOG_REPORT_EMAIL_TO`; `POSTHOG_REPORT_EMAIL_FROM` es
opcional y por defecto usa `CrececonIA <sergio@crececonia.cl>`. El remitente
debe pertenecer a un dominio verificado en Resend.

Tambien se puede probar localmente con `npm run posthog:email -- 7` o cambiar
la ventana a 14/30 dias. El correo es solo un informe para revision humana: no activa experimentos, no cambia
feature flags y no abre PRs.

La hoja de ruta para analisis creativos, mapas de atencion, cohortes y una
posible mejora asistida por agentes esta en
[`docs/posthog-self-improvement-roadmap.md`](docs/posthog-self-improvement-roadmap.md).

Los cambios que llegan a la rama principal siguen el flujo de produccion
configurado en Vercel.
