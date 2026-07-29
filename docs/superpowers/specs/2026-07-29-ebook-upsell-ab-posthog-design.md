# Diseño: upsell generalizado + A/B testing + PostHog para venta de ebooks

Fecha: 2026-07-29

## Contexto

El motor de combos (`lib/ebook-bundles.ts`) ya generaliza el descuento por
cantidad de libros activos (2 libros = 10% off, 3 = 20% off), no por pares
específicos — activar un libro nuevo en `lib/ebook-catalog.ts` ya suma combo
sin tocar el motor. Lo que falta:

1. `EbookPricing` está hardcodeado al libro 1 (`DEFAULT_EBOOK_RESOURCE`) — no
   se puede reusar tal cual en la página de venta de un libro futuro.
2. No hay analytics del funnel de venta (vistas, toggles de combo, checkout
   iniciado, compra confirmada).
3. No hay mecanismo de A/B testing para precio/copy de combo.

## Alcance

Este spec cubre exactamente estos 3 puntos. No incluye: página de venta del
libro 2 (no existe todavía, ver runbook en AGENTS.md), ni analítica del resto
del sitio (landing, /centro, guías) — solo el funnel de venta de ebooks.

## 1. Generalizar `EbookPricing`

- Prop nueva `resource: string` (default `DEFAULT_EBOOK_RESOURCE` para no
  romper el único caller actual en
  `app/ebook/de-cero-a-claude-en-una-semana/page.tsx`).
- `OTHER_ACTIVE_EBOOKS` deja de ser una constante a nivel de módulo (hoy
  calculada una sola vez contra `DEFAULT_EBOOK_RESOURCE`) y pasa a derivarse
  dentro del componente a partir del prop `resource`.
- El resto de la lógica (fetch de cupos, `computeBundleTotal`, discount
  codes) no cambia — ya recibía `DEFAULT_EBOOK_RESOURCE` como constante, pasa
  a recibir el prop.

## 2. PostHog

### Setup

- Dependencias: `posthog-js` (cliente) y `posthog-node` (server, para eventos
  desde route handlers donde no hay browser).
- Variables de entorno (agregadas a `.env.local.example`):
  - `NEXT_PUBLIC_POSTHOG_KEY` — project API key (`phc_...`)
  - `NEXT_PUBLIC_POSTHOG_HOST` — `https://us.i.posthog.com` o `eu.i.posthog.com`
  - `POSTHOG_SERVER_KEY` — mismo project key, usado server-side (route
    handlers) para no depender del cliente
- Si `NEXT_PUBLIC_POSTHOG_KEY` no está seteada, el provider no inicializa
  PostHog (no rompe build/dev sin credenciales).

### Cliente

- `components/PostHogProvider.tsx` (`"use client"`): inicializa `posthog-js`
  una vez, expone captura de pageview automática. Se monta en
  `app/layout.tsx` envolviendo `children`.
- `lib/analytics.ts`: helper `trackEbookEvent(name, properties)` que llama a
  `posthog.capture` solo si el cliente está inicializado — evita `if
  (window.posthog)` repetido en cada componente.

### Servidor

- `lib/posthog-server.ts`: instancia lazy de `PostHog` (posthog-node) para
  usar en route handlers. `capture()` + `shutdown()` por request (posthog-node
  requiere flush explícito en serverless).

### Eventos del funnel

| Evento | Dónde | Propiedades |
|---|---|---|
| `ebook_page_view` | `EbookPricing` (mount, client) | `resource` |
| `ebook_combo_toggle` | `EbookPricing`, al cambiar `selectedExtras` | `resource`, `extra_resource`, `action: "add"\|"remove"` |
| `ebook_checkout_started` | `POST /api/flow/create` (server) | `resource`, `tier`, `item_count`, `has_discount_code` |
| `ebook_purchase_confirmed` | `POST /api/flow/confirm` (server, tras insertar en `ebook_purchases`) | `resource`, `amount`, `item_count`, `discount_code` |

Todos los eventos llevan `resource` para poder cortar por libro cuando exista
un segundo libro con venta propia.

## 3. A/B testing (feature flags de PostHog)

- Flag `ebook-pricing-variant` en el dashboard de PostHog, 2 variantes:
  `control` (tiers/copy actuales) y `variant-b` (a definir por el usuario en
  el dashboard, ej. copy de urgencia distinto en el badge de descuento).
- `EbookPricing` lee la variante con `useFeatureFlagVariantKey` del SDK
  (`posthog-js/react`), default `"control"` si el flag no resuelve
  (offline, flag no configurado) — nunca bloquea el render.
- La variante viaja como propiedad `pricing_variant` en los 4 eventos del
  funnel de arriba, para poder segmentar conversión por variante en PostHog
  sin lógica adicional en el código.
- El componente no cambia precios en el cliente (los precios reales siguen
  viniendo de `/api/ebook/cupos` y `lib/ebook-pricing.ts`, que son server-side)
  — la variante solo puede afectar copy/orden visual en esta primera
  iteración. Cambiar el precio mostrado por variante queda fuera de este
  spec (requeriría que el flag payload viaje también al server que calcula
  el precio final, para que Flow cobre lo mismo que se mostró).

## Deploy tracking (PostHog ↔ GitHub/Vercel)

No es una GitHub App — se resuelve activando la integración nativa
Vercel ↔ PostHog (dashboard de PostHog → Data pipelines → Vercel), que anota
cada deploy de Vercel en los gráficos de PostHog automáticamente. Esto es un
paso de configuración en el dashboard, no requiere cambios de código; se deja
documentado en el runbook pero no bloquea el resto del spec.

## Testing

- `tests/ebook-pricing-resource.test.ts` (o extender el test existente que
  cubra `EbookPricing` si existe): verificar que con `resource` distinto de
  `DEFAULT_EBOOK_RESOURCE`, el libro por defecto se excluye correctamente de
  `OTHER_ACTIVE_EBOOKS` y no al revés.
- `lib/analytics.ts` y `lib/posthog-server.ts`: test unitario de que
  `trackEbookEvent`/`captureServerEvent` no lanzan si las env vars no están
  seteadas (no-op seguro).
- No se testea contra la API real de PostHog (se mockea `posthog-js` /
  `posthog-node` en los tests, igual que Supabase/Flow ya se mockean en
  `tests/`).

## Riesgos / decisiones abiertas

- El nombre exacto de `variant-b` y su copy los define el usuario en el
  dashboard de PostHog — el código solo necesita el nombre de flag y un
  fallback seguro.
- Si en el futuro se quiere variar precio (no solo copy) por A/B, hace falta
  un diseño aparte que sincronice el flag con el cálculo server-side de
  `lib/ebook-pricing.ts` — fuera de alcance acá.
