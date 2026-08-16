# PostHog y mejora continua — hoja de ruta futura

Estado: **documentación de futuro; no implementado**.

Este documento conserva la idea de que el sitio pueda mejorar con base en su
tráfico y en la interacción real de las personas. Por ahora, el análisis es
observacional y la decisión de cambiar el sitio sigue siendo manual.

## Lo que existe hoy

- El reporte normaliza `ebook_checkout_started` como fallback historico de
  `ebook_checkout_created`, para que cambios de instrumentacion no borren el
  funnel anterior.
- Los fallos tecnicos del checkout se registran como `ebook_checkout_failed`
  con una categoria tecnica, sin email, datos de pago ni texto libre.

- PostHog observa el ecosistema completo: navegación, secciones visibles,
  scroll, enlaces, CTA, evaluación, chat, newsletter, skills, ebooks,
  llamadas y formularios de calificación.
- El reporte semanal consulta los últimos siete días y muestra funnel,
  desglose por tipo de página, métricas de interacción y recomendaciones.
- El workflow semanal puede entregar el reporte por correo y abrir un issue de
  GitHub como respaldo.
- El correo y el issue son señales para revisión humana. No crean experimentos,
  no cambian feature flags y no abren PRs automáticamente.

## Análisis creativos que se pueden activar más adelante

1. **Mapa de atención:** combinar session replay, profundidad de scroll,
   visibilidad de secciones y CTA para detectar dónde se pierde la atención.
2. **Rutas de intención:** comparar las secuencias de navegación que terminan
   en evaluación, chat, newsletter, descarga, llamada o compra.
3. **Embudo por página y dispositivo:** localizar páginas que atraen tráfico
   pero no entregan un siguiente paso claro.
4. **Calidad de interacción:** separar clics accidentales de señales de
   intención usando permanencia, repetición de sesiones, avance de formulario
   y éxito de la acción.
5. **Análisis de fricción:** agrupar abandonos de formularios, fallos de chat,
   errores de checkout y fallbacks para priorizar trabajo técnico antes de
   cambiar copy o diseño.
6. **Cohortes de contenido:** comparar visitantes que llegan por distintas
   páginas, skills o ebooks y observar qué caminos producen valor posterior.
7. **Hipótesis de A/B testing:** transformar una señal repetida en una
   hipótesis explícita, con métrica primaria, guardrails, duración y criterio
   de decisión antes de implementarla.

## Flujo futuro de mejora, con control humano

```text
PostHog → reporte → hipótesis priorizada → revisión humana
        → PR pequeño → preview de Vercel → aprobación → producción
        → medición post hoc → decisión de conservar o revertir
```

Cuando exista suficiente tráfico, una etapa posterior podría proponer un
experimento con feature flags y preparar un PR para el agente de código. El
agente orquestador podría validar que la propuesta tenga evidencia, alcance
acotado, métrica primaria, plan de rollback y ausencia de datos personales.
La publicación, el merge y la activación del experimento deben seguir siendo
aprobaciones separadas hasta que haya evidencia suficiente para automatizar
alguna parte.

## Regla de decisión actual

No implementar cambios por una sola semana, por una sola sesión grabada o por
una muestra pequeña. El dueño del sitio revisa el correo, decide si la señal
es real y, cuando corresponda, solicita un PR manual. Las recomendaciones de
PostHog son puntos de partida, no conclusiones causales.

## Puntos de entrada técnicos

- Instrumentación: `components/PostHogProvider.tsx` y
  `components/PostHogEcosystemTracker.tsx`.
- Cálculo del reporte: `lib/posthog-analytics.ts` y
  `lib/posthog-report-format.ts`.
- Reporte para agentes: `app/api/analytics/report/route.ts`.
- Entrega por correo: `scripts/posthog-report-email.ts`.
- Scheduler y issue de respaldo: `.github/workflows/posthog-weekly-report.yml`.
