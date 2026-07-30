# Diseño: reporte periódico de PostHog + PRs sugeridos

Fecha: 2026-07-30

## Contexto

Ya existe instrumentación completa del funnel de venta de ebooks en PostHog
(`ebook_page_view`, `ebook_combo_toggle`, `ebook_checkout_started`,
`ebook_purchase_confirmed`, todos con `resource` y `pricing_variant`). Lo que
falta es un mecanismo para:

1. Consultar esas métricas de forma repetible (no solo mirando el dashboard
   a mano).
2. Recibir un resumen periódico de qué funciona y qué no.
3. Cuando haya una señal clara, convertir esa señal en una propuesta de
   cambio concreta — y solo generar el PR si el usuario la aprueba.

## Alcance

Este spec cubre: el query layer, el script de reporte, y el flujo de
sugerencia → aprobación → PR. No cubre: el feature flag `ebook-pricing-variant`
en sí (ya se creó, o el usuario lo administra desde el dashboard de PostHog),
ni cambiar el precio real cobrado (fuera de alcance, ver spec anterior).

## 1. Autenticación de lectura

La API de HogQL (`POST /api/projects/:id/query/`) requiere un **Personal API
Key** con scope de lectura (`query:read` como mínimo) — es distinta del
`phc_...` project token usado para capturar eventos, que es write-only.

- Env var nueva: `POSTHOG_PERSONAL_API_KEY` (server-only, nunca
  `NEXT_PUBLIC_`).
- Env var ya existente reutilizada: `NEXT_PUBLIC_POSTHOG_HOST` da el host;
  el project ID (`533562`) se hardcodea en `lib/posthog-analytics.ts` junto a
  un comentario de dónde volver a copiarlo si el proyecto cambia (Settings →
  General → Project ID).

## 2. Query layer (`lib/posthog-analytics.ts`)

Un helper que ejecuta HogQL contra `/api/projects/533562/query/` y devuelve
tres cosas:

```typescript
interface FunnelStepResult {
  step: "page_view" | "combo_toggle" | "checkout_started" | "purchase_confirmed";
  count: number;
}

interface VariantComparison {
  variant: string;
  pageViews: number;
  checkoutsStarted: number;
  purchasesConfirmed: number;
  conversionRate: number; // purchasesConfirmed / pageViews
}

interface AnalyticsReport {
  windowDays: number;
  funnel: FunnelStepResult[];
  byVariant: VariantComparison[];
  comboToggleRate: number; // % de sesiones con page_view que también tienen combo_toggle
  generatedAt: string; // ISO, pasado como parámetro — nunca Date.now() interno
}

export async function fetchAnalyticsReport(
  windowDays: number,
  now: Date
): Promise<AnalyticsReport>;
```

- Si `POSTHOG_PERSONAL_API_KEY` no está configurada, la función lanza un
  error explícito y claro (`"POSTHOG_PERSONAL_API_KEY no configurada"`) — a
  diferencia de `lib/analytics.ts`/`lib/posthog-server.ts` (que son no-op sin
  key porque corren en cada request de usuario), este es un script que un
  humano/agente ejecuta a propósito, así que fallar ruidosamente es lo
  correcto.
- HogQL query real (una sola consulta, agrupando por evento y por
  `pricing_variant` con `JSONExtractString(properties, 'pricing_variant')`
  cuando aplica).

## 3. Script de reporte (`scripts/posthog-report.ts`)

Un script ejecutable con `tsx` (agregar devDependency) que:

1. Llama a `fetchAnalyticsReport(7, new Date())` (ventana configurable por
   argumento CLI, default 7 días).
2. Formatea el resultado como texto legible en español (no JSON crudo):
   - Funnel con conteos y % de caída entre etapas.
   - Tasa de combo.
   - Comparación por variante, **solo si ambas variantes tienen n≥30
     page views** — si no, el reporte dice explícitamente "todavía no hay
     volumen suficiente para comparar variantes (X vs Y vistas)" en vez de
     sacar conclusiones con muestras chicas.
3. Imprime el resumen a stdout.

`npm run posthog:report` en `package.json` como atajo.

## 4. Cadencia y entrega (scheduling)

Fuera del código del repo: se usa la skill `schedule` de este harness para
crear un cron semanal (ej. lunes 9am hora de Chile) que:

1. Corre `npm run posthog:report` en el repo.
2. Lee el resumen.
3. Evalúa si hay una señal accionable (ver sección 5). Si no la hay, solo
   notifica el resumen al usuario (push notification) — sin generar nada
   más.
4. Si la hay, redacta una propuesta concreta de cambio (copy/orden/badge de
   descuento — nunca precio real) y se la manda al usuario para aprobación
   explícita, **sin tocar código todavía**.

Este paso 4 es prompt/proceso del agente programado, no código de este
repo — se documenta en este spec para que quede claro el contrato, pero no
hay un archivo `.ts` que lo implemente.

## 5. Qué cuenta como "señal accionable"

Para evitar propuestas basadas en ruido:

- Mínimo n=30 por variante en la ventana evaluada.
- Diferencia de conversión ≥ 20 puntos porcentuales relativos (ej. 5% vs
  6.5%+) — umbral conservador dado el volumen bajo esperado al inicio.
- Si no se cumplen ambas condiciones, el reporte lo declara explícitamente
  como "sin señal suficiente todavía" en vez de forzar una recomendación.

## 6. Sugerencia → aprobación → PR

Cuando SÍ hay señal accionable, el flujo (ejecutado por el agente
programado, no por código nuevo del repo) es:

1. Notificación al usuario con la señal + una propuesta de cambio concreta
   en texto (ej. "variant-b muestra 8.2% vs 5.1% de conversión en combo,
   n=45/n=41 — propongo hacer default el copy de variant-b y retirar el
   flag").
2. El usuario responde aprobando o no.
3. Si aprueba: se repite el mismo flujo ya usado en el spec anterior
   (brainstorming corto si el cambio no es trivial → edit → `npm test` →
   `npm run build` → commit → PR). Nunca merge automático.

## Testing

- `tests/posthog-analytics.test.ts`: mockea `fetch` global, verifica que
  `fetchAnalyticsReport`:
  - Lanza si `POSTHOG_PERSONAL_API_KEY` no está seteada.
  - Parsea correctamente una respuesta HogQL simulada en los 3 objetos de
    salida (`funnel`, `byVariant`, `comboToggleRate`).
  - No compara variantes (deja el campo vacío / marca "sin datos") cuando
    alguna tiene menos de 30 page views — la función de formato del script
    es la que decide el mensaje final, pero el dato crudo (conteos) siempre
    se expone para que el consumidor decida.
- El script `scripts/posthog-report.ts` no se testea end-to-end contra la
  API real (igual que el resto del repo mockea Supabase/Flow/PostHog) — se
  testea indirectamente vía el test de `lib/posthog-analytics.ts` más una
  prueba de la función de formato pura, extraída a
  `lib/posthog-report-format.ts` para poder testearla sin ejecutar el
  script.

## Riesgos / decisiones abiertas

- El umbral de n=30 y 20pp es un punto de partida razonable pero arbitrario
  — ajustar cuando haya datos reales de volumen de tráfico del sitio.
- Si en el futuro se quiere que el paso 4 (propuesta de PR) esté
  parcialmente en código (no solo en el prompt del cron), eso es una
  iteración posterior — hoy el bajo volumen de cambios esperado (semanal)
  no justifica esa inversión.
