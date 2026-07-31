# Upsell generalizado + A/B testing + PostHog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generalizar el componente de pricing/combo de ebooks a cualquier libro futuro, instrumentar el funnel de venta con PostHog (analytics + feature flags), y habilitar A/B testing de copy/precio sobre ese funnel.

**Architecture:** `EbookPricing` deja de asumir `DEFAULT_EBOOK_RESOURCE` y recibe un prop `resource`. Un `PostHogProvider` cliente se monta en el layout raíz e inicializa `posthog-js` solo si hay API key configurada. Un helper cliente (`lib/analytics.ts`) y uno server (`lib/posthog-server.ts`) envuelven captura de eventos de forma segura (no-op sin config). Los route handlers de Flow (`create`, `confirm`) capturan eventos server-side. `EbookPricing` lee una variante de feature flag vía `posthog-js/react` y la adjunta a cada evento.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, vitest, `posthog-js`, `posthog-node`.

## Global Constraints

- Copy en español (Chile). Nunca hardcodear secretos — todo vía env vars (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `POSTHOG_SERVER_KEY`).
- Sin las env vars de PostHog configuradas, nada debe romper el build ni el dev server — todo el tracking es no-op.
- No cambiar el precio mostrado por variante de A/B en esta iteración (ver spec, sección 3) — solo copy/orden visual.
- `npm test` debe seguir en verde; el spec exige mockear `posthog-js`/`posthog-node` en tests, nunca pegarle a la red real.
- `npm run build` (typecheck) debe pasar.
- Seguir el patrón de comentarios del repo: solo cuando el porqué no es obvio (ver ejemplos existentes en `lib/ebook-bundles.ts`, `app/api/flow/create/route.ts`).

---

### Task 1: Generalizar `EbookPricing` para recibir `resource` como prop

**Files:**
- Modify: `components/EbookPricing.tsx:1-95` (imports, constante `OTHER_ACTIVE_EBOOKS`, firma del componente, referencias a `DEFAULT_EBOOK_RESOURCE`)
- Modify: `app/ebook/de-cero-a-claude-en-una-semana/page.tsx` (pasar el prop explícito, aunque el default lo cubra — deja la intención clara para cuando exista una segunda página)
- Test: `tests/ebook-pricing-resource.test.ts` (nuevo)

**Interfaces:**
- Consumes: `getActiveCatalogEntries()`, `DEFAULT_EBOOK_RESOURCE` de `lib/ebook-catalog.ts` (sin cambios de firma).
- Produces: `EbookPricing({ resource = DEFAULT_EBOOK_RESOURCE }: { resource?: string })` — cualquier página de venta futura importa este componente pasando su propio `resource`.

Antes de tocar el componente, `OTHER_ACTIVE_EBOOKS` es una constante de módulo calculada una sola vez contra `DEFAULT_EBOOK_RESOURCE` (línea 14 del archivo actual). Esta task la convierte en un valor derivado dentro del componente, dependiente del prop.

- [ ] **Step 1: Escribir el test que fija el contrato del prop `resource`**

Como `EbookPricing` es un componente `"use client"` con fetch y efectos, el test unitario más simple y honesto no monta el componente completo (evitar herramientas de testing de UI no usadas en el repo) — en cambio, extrae y testea la función pura que decide "otros libros activos" dado un `resource`. Esta task primero extrae esa función a `lib/ebook-catalog.ts` (nombre `getOtherActiveEntries`) para que sea testeable sin React, y el componente la consume.

```typescript
// tests/ebook-pricing-resource.test.ts
import { describe, it, expect } from "vitest";
import { getOtherActiveEntries } from "@/lib/ebook-catalog";

describe("getOtherActiveEntries", () => {
  it("excluye el resource dado y devuelve el resto de libros activos", () => {
    const others = getOtherActiveEntries("ebook:de-cero-a-claude-en-una-semana");
    expect(others.every((entry) => entry.resource !== "ebook:de-cero-a-claude-en-una-semana")).toBe(true);
  });

  it("cuando solo hay un libro activo, no hay otros que mostrar", () => {
    // Hoy solo "ebook:de-cero-a-claude-en-una-semana" está active:true en el catálogo.
    const others = getOtherActiveEntries("ebook:de-cero-a-claude-en-una-semana");
    expect(others).toEqual([]);
  });

  it("un resource inactivo o inexistente no excluye nada, devuelve todos los activos", () => {
    const others = getOtherActiveEntries("ebook:no-existe");
    const allActive = getOtherActiveEntries("");
    expect(others).toEqual(allActive);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm test -- tests/ebook-pricing-resource.test.ts`
Expected: FAIL con `getOtherActiveEntries is not a function` (no existe todavía en `lib/ebook-catalog.ts`).

- [ ] **Step 3: Agregar `getOtherActiveEntries` a `lib/ebook-catalog.ts`**

Agregar al final del archivo, junto a `getActiveCatalogEntries`:

```typescript
export function getOtherActiveEntries(
  resource: string
): Extract<EbookCatalogEntry, { active: true }>[] {
  return getActiveCatalogEntries().filter((entry) => entry.resource !== resource);
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npm test -- tests/ebook-pricing-resource.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Actualizar `EbookPricing.tsx` para usar el prop `resource`**

Reemplazar (líneas 1-16 del archivo actual):

```tsx
"use client";

import { useEffect, useState } from "react";
import type { PriceInfo } from "@/lib/ebook-pricing";
import { getActiveCatalogEntries, DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";
import { computeBundleTotal } from "@/lib/ebook-bundles";
import EbookSectionHeading from "./EbookSectionHeading";
import EbookSoldCounter from "./EbookSoldCounter";
import styles from "./EbookCinematic.module.css";

// Los demás libros activos del catálogo, excluyendo el que ya se vende en
// esta página. Hoy siempre es un array vacío — no hay checkboxes de combo
// hasta que se active un segundo libro.
const OTHER_ACTIVE_EBOOKS = getActiveCatalogEntries().filter(
  (entry) => entry.resource !== DEFAULT_EBOOK_RESOURCE
);
```

Por:

```tsx
"use client";

import { useEffect, useState } from "react";
import type { PriceInfo } from "@/lib/ebook-pricing";
import { DEFAULT_EBOOK_RESOURCE, getOtherActiveEntries } from "@/lib/ebook-catalog";
import { computeBundleTotal } from "@/lib/ebook-bundles";
import EbookSectionHeading from "./EbookSectionHeading";
import EbookSoldCounter from "./EbookSoldCounter";
import styles from "./EbookCinematic.module.css";

type EbookPricingProps = {
  resource?: string;
};
```

Cambiar la firma del componente (línea `export default function EbookPricing() {`) por:

```tsx
export default function EbookPricing({ resource = DEFAULT_EBOOK_RESOURCE }: EbookPricingProps) {
  const otherActiveEbooks = getOtherActiveEntries(resource);
```

Y reemplazar TODAS las referencias restantes en el archivo:
- `DEFAULT_EBOOK_RESOURCE` (en `fetch(\`/api/ebook/cupos?resource=${DEFAULT_EBOOK_RESOURCE}\`)`, en `selectedResources`, en el `find` de `OTHER_ACTIVE_EBOOKS`) → `resource`
- `OTHER_ACTIVE_EBOOKS` (constante de módulo) → `otherActiveEbooks` (variable local del componente, ya declarada en el Step de arriba)

El `useEffect` que hace fetch de cupos pasa a depender de `resource`:

```tsx
useEffect(() => {
  const load = () =>
    fetch(`/api/ebook/cupos?resource=${resource}`)
      .then((r) => r.json())
      .then(setPriceInfo)
      .catch(() => {});

  load();
  const id = setInterval(load, 30000);
  return () => clearInterval(id);
}, [resource]);
```

- [ ] **Step 6: Pasar el prop explícito desde la página actual**

En `app/ebook/de-cero-a-claude-en-una-semana/page.tsx`, buscar el uso de `<EbookPricing />` y cambiarlo por:

```tsx
<EbookPricing resource="ebook:de-cero-a-claude-en-una-semana" />
```

- [ ] **Step 7: Typecheck y test suite completos**

Run: `npm run build`
Expected: build/typecheck sin errores.

Run: `npm test`
Expected: todos los tests pasan, incluyendo `tests/ebook-pricing-resource.test.ts`.

- [ ] **Step 8: Commit**

```bash
git add lib/ebook-catalog.ts components/EbookPricing.tsx app/ebook/de-cero-a-claude-en-una-semana/page.tsx tests/ebook-pricing-resource.test.ts
git commit -m "feat: generaliza EbookPricing para aceptar cualquier resource"
```

---

### Task 2: Instalar y configurar PostHog (cliente + servidor, no-op sin credenciales)

**Files:**
- Modify: `package.json` (agregar `posthog-js`, `posthog-node`)
- Create: `components/PostHogProvider.tsx`
- Create: `lib/analytics.ts`
- Create: `lib/posthog-server.ts`
- Modify: `app/layout.tsx` (montar el provider)
- Modify: `.env.local.example` (documentar las 3 env vars nuevas)
- Test: `tests/analytics.test.ts` (nuevo)
- Test: `tests/posthog-server.test.ts` (nuevo)

**Interfaces:**
- Produces: `trackEbookEvent(name: string, properties: Record<string, unknown>): void` (client, `lib/analytics.ts`) — usado por Task 3.
- Produces: `captureServerEvent(name: string, distinctId: string, properties: Record<string, unknown>): Promise<void>` (server, `lib/posthog-server.ts`) — usado por Task 4.

- [ ] **Step 1: Instalar dependencias**

Run: `npm install posthog-js posthog-node`
Expected: `package.json` y `package-lock.json` actualizados, sin errores de instalación.

- [ ] **Step 2: Escribir el test de `lib/analytics.ts` (falla primero)**

```typescript
// tests/analytics.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("trackEbookEvent", () => {
  const originalEnv = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = originalEnv;
  });

  it("no lanza si posthog-js no está inicializado (sin key configurada)", async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const { trackEbookEvent } = await import("@/lib/analytics");
    expect(() => trackEbookEvent("ebook_page_view", { resource: "ebook:test" })).not.toThrow();
  });

  it("llama a posthog.capture cuando el cliente está inicializado", async () => {
    const captureMock = vi.fn();
    vi.doMock("posthog-js", () => ({
      default: { __loaded: true, capture: captureMock },
    }));
    const { trackEbookEvent } = await import("@/lib/analytics");
    trackEbookEvent("ebook_page_view", { resource: "ebook:test" });
    expect(captureMock).toHaveBeenCalledWith("ebook_page_view", { resource: "ebook:test" });
  });
});
```

- [ ] **Step 3: Correr el test y verificar que falla**

Run: `npm test -- tests/analytics.test.ts`
Expected: FAIL, `lib/analytics.ts` no existe.

- [ ] **Step 4: Crear `lib/analytics.ts`**

```typescript
import posthog from "posthog-js";

/**
 * Captura un evento del funnel de venta de ebooks solo si el cliente de
 * PostHog está inicializado (ver components/PostHogProvider.tsx). Sin
 * NEXT_PUBLIC_POSTHOG_KEY configurada, posthog-js nunca llega a
 * inicializarse y esta función es un no-op seguro.
 */
export function trackEbookEvent(name: string, properties: Record<string, unknown>): void {
  if (!posthog.__loaded) return;
  posthog.capture(name, properties);
}
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npm test -- tests/analytics.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Escribir el test de `lib/posthog-server.ts` (falla primero)**

```typescript
// tests/posthog-server.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("captureServerEvent", () => {
  const originalKey = process.env.POSTHOG_SERVER_KEY;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.POSTHOG_SERVER_KEY = originalKey;
  });

  it("no lanza si POSTHOG_SERVER_KEY no está configurada", async () => {
    delete process.env.POSTHOG_SERVER_KEY;
    const { captureServerEvent } = await import("@/lib/posthog-server");
    await expect(
      captureServerEvent("ebook_checkout_started", "test@example.com", { resource: "ebook:test" })
    ).resolves.toBeUndefined();
  });

  it("llama a capture y shutdown cuando la key está configurada", async () => {
    process.env.POSTHOG_SERVER_KEY = "phc_test_key";
    const captureMock = vi.fn();
    const shutdownMock = vi.fn().mockResolvedValue(undefined);
    vi.doMock("posthog-node", () => ({
      PostHog: vi.fn().mockImplementation(() => ({
        capture: captureMock,
        shutdown: shutdownMock,
      })),
    }));
    const { captureServerEvent } = await import("@/lib/posthog-server");
    await captureServerEvent("ebook_checkout_started", "test@example.com", { resource: "ebook:test" });
    expect(captureMock).toHaveBeenCalledWith({
      distinctId: "test@example.com",
      event: "ebook_checkout_started",
      properties: { resource: "ebook:test" },
    });
    expect(shutdownMock).toHaveBeenCalled();
  });
});
```

- [ ] **Step 7: Correr el test y verificar que falla**

Run: `npm test -- tests/posthog-server.test.ts`
Expected: FAIL, `lib/posthog-server.ts` no existe.

- [ ] **Step 8: Crear `lib/posthog-server.ts`**

```typescript
import { PostHog } from "posthog-node";

/**
 * Eventos server-side (route handlers de Flow) donde no hay browser/cliente
 * de PostHog disponible. posthog-node requiere shutdown() explícito por
 * request en entornos serverless — sin esto el evento puede perderse si la
 * función termina antes de flushearlo.
 */
export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties: Record<string, unknown>
): Promise<void> {
  const key = process.env.POSTHOG_SERVER_KEY;
  if (!key) return;

  const client = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
  });

  try {
    client.capture({ distinctId, event, properties });
  } finally {
    await client.shutdown();
  }
}
```

- [ ] **Step 9: Correr el test y verificar que pasa**

Run: `npm test -- tests/posthog-server.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 10: Crear `components/PostHogProvider.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * Inicializa posthog-js una sola vez, al montar. Si no hay
 * NEXT_PUBLIC_POSTHOG_KEY configurada, no inicializa nada — el resto del
 * código (lib/analytics.ts) trata eso como "cliente no cargado" y no
 * captura eventos, sin romper build/dev.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthog.__loaded) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      person_profiles: "identified_only",
    });
  }, []);

  return children;
}
```

- [ ] **Step 11: Montar el provider en `app/layout.tsx`**

Agregar el import junto a los demás:

```tsx
import PostHogProvider from "@/components/PostHogProvider";
```

Envolver el contenido del `<body>` (reemplazar el bloque actual):

```tsx
<body className="flex flex-col min-h-screen">
  <PostHogProvider>
    <EvaluacionProvider>
      <SmoothScroll />
      {children}
      <EvaluacionModal />
      <ChatWidget />
      <SuscriptorPopup />
      <EbookPopup />
    </EvaluacionProvider>
  </PostHogProvider>
</body>
```

- [ ] **Step 12: Documentar las env vars en `.env.local.example`**

Agregar al final del archivo:

```
# PostHog — https://app.posthog.com/project/_/settings/project (o el host EU si tu proyecto es EU)
NEXT_PUBLIC_POSTHOG_KEY=phc_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_SERVER_KEY=phc_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

- [ ] **Step 13: Typecheck y test suite completos**

Run: `npm run build`
Expected: build/typecheck sin errores (build sin las env vars de PostHog seteadas en local — debe pasar igual).

Run: `npm test`
Expected: todos los tests pasan.

- [ ] **Step 14: Commit**

```bash
git add package.json package-lock.json components/PostHogProvider.tsx lib/analytics.ts lib/posthog-server.ts app/layout.tsx .env.local.example tests/analytics.test.ts tests/posthog-server.test.ts
git commit -m "feat: instrumenta PostHog (cliente + servidor), no-op sin credenciales"
```

---

### Task 3: Eventos del funnel client-side en `EbookPricing`

**Files:**
- Modify: `components/EbookPricing.tsx` (agregar `trackEbookEvent` en mount, en `toggleExtra`, en `handleSubmit`)
- Test: `tests/ebook-pricing-resource.test.ts` (extender, o nuevo test enfocado en el efecto — ver Step 1)

**Interfaces:**
- Consumes: `trackEbookEvent(name, properties)` de `lib/analytics.ts` (Task 2).
- Consumes: `resource` (prop del componente, Task 1).

Como el componente ya no tiene test de render (Task 1 solo testea la función pura extraída), esta task no agrega un test de render tampoco — sería el único en el repo y requeriría instalar Testing Library, fuera de alcance del spec. Se valida manualmente en el navegador (Task 5) y con el test manual de PostHog Live Events del dashboard.

- [ ] **Step 1: Agregar el import y el evento de page view**

En `components/EbookPricing.tsx`, agregar el import junto a los demás:

```tsx
import { trackEbookEvent } from "@/lib/analytics";
```

Agregar un `useEffect` nuevo (junto al `useEffect` existente de cupos), que dispara una sola vez por `resource`:

```tsx
useEffect(() => {
  trackEbookEvent("ebook_page_view", { resource });
}, [resource]);
```

- [ ] **Step 2: Trackear el toggle de combo en `toggleExtra`**

Reemplazar la función actual:

```tsx
function toggleExtra(extraResource: string, checked: boolean) {
  setSelectedExtras((prev) => (checked ? [...prev, extraResource] : prev.filter((r) => r !== extraResource)));
  setAppliedDiscount(null);
  trackEbookEvent("ebook_combo_toggle", {
    resource,
    extra_resource: extraResource,
    action: checked ? "add" : "remove",
  });
}
```

(Nota: el parámetro se renombra de `resource` a `extraResource` para no chocar con el prop `resource` del componente, ya en scope.)

- [ ] **Step 3: Trackear el checkout iniciado en `handleSubmit`, antes del fetch**

En `handleSubmit`, justo antes de la línea `const res = await fetch("/api/flow/create", ...)`, agregar:

```tsx
trackEbookEvent("ebook_checkout_started", {
  resource,
  tier,
  item_count: selectedResources.length,
  has_discount_code: Boolean(appliedDiscount),
});
```

- [ ] **Step 4: Typecheck y test suite completos**

Run: `npm run build`
Expected: sin errores.

Run: `npm test`
Expected: todos los tests pasan.

- [ ] **Step 5: Commit**

```bash
git add components/EbookPricing.tsx
git commit -m "feat: trackea eventos de PostHog en el funnel client-side de EbookPricing"
```

---

### Task 4: Eventos del funnel server-side (`/api/flow/create` y `/api/flow/confirm`)

**Files:**
- Modify: `app/api/flow/create/route.ts`
- Modify: `app/api/flow/confirm/route.ts`
- Test: `tests/create.test.ts` (extender)
- Test: `tests/confirm.test.ts` (extender)

**Interfaces:**
- Consumes: `captureServerEvent(event, distinctId, properties)` de `lib/posthog-server.ts` (Task 2).

- [ ] **Step 1: Revisar cómo `tests/create.test.ts` mockea módulos hoy**

Antes de escribir el mock nuevo, leer `tests/create.test.ts` completo para replicar el patrón exacto de mocking usado para Supabase/Flow (probablemente `vi.mock("@/lib/supabase", ...)`). Esto evita introducir un estilo de mock distinto al resto del archivo.

- [ ] **Step 2: Agregar el mock de `lib/posthog-server` al test existente (falla primero)**

En `tests/create.test.ts`, agregar junto a los demás `vi.mock(...)` del archivo:

```typescript
vi.mock("@/lib/posthog-server", () => ({
  captureServerEvent: vi.fn().mockResolvedValue(undefined),
}));
```

Y agregar un test nuevo al final del `describe` existente:

```typescript
it("captura ebook_checkout_started con el resource, tier y cantidad de items", async () => {
  const { captureServerEvent } = await import("@/lib/posthog-server");
  const request = new Request("http://localhost/api/flow/create", {
    method: "POST",
    body: JSON.stringify({ email: "test@example.com" }),
  });

  await POST(request);

  expect(captureServerEvent).toHaveBeenCalledWith(
    "ebook_checkout_started",
    "test@example.com",
    expect.objectContaining({
      resource: "ebook:de-cero-a-claude-en-una-semana",
      item_count: 1,
      has_discount_code: false,
    })
  );
});
```

Ajustar el nombre exacto de la variable importada (`POST`) y el shape del mock de Supabase/Flow al patrón real que se lea en el Step 1 — el test debe correr en el mismo entorno mockeado que los tests vecinos del archivo.

- [ ] **Step 3: Correr el test y verificar que falla**

Run: `npm test -- tests/create.test.ts`
Expected: FAIL, `captureServerEvent` no se llama todavía dentro de `route.ts`.

- [ ] **Step 4: Instrumentar `app/api/flow/create/route.ts`**

Agregar el import junto a los demás:

```typescript
import { captureServerEvent } from "@/lib/posthog-server";
```

Justo antes del `return NextResponse.json({ redirectUrl: ... })` final (después de confirmar que Flow devolvió `data.url` y `data.token`), agregar (no bloqueante — no usar `await` para no demorar la respuesta al usuario, pero sí capturar la promesa para no dejarla "flotando" sin manejo de error):

```typescript
captureServerEvent("ebook_checkout_started", email, {
  resource: resources[0],
  tier: priceInfos[0].tier,
  item_count: resources.length,
  has_discount_code: Boolean(discountCode),
}).catch((err) => console.error("[flow/create] falló el evento de PostHog:", err));
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npm test -- tests/create.test.ts`
Expected: PASS.

- [ ] **Step 6: Repetir el mismo patrón para `tests/confirm.test.ts`**

Leer `tests/confirm.test.ts` completo primero para replicar su patrón de mocking exacto (Supabase, Resend, Flow).

Agregar el mock:

```typescript
vi.mock("@/lib/posthog-server", () => ({
  captureServerEvent: vi.fn().mockResolvedValue(undefined),
}));
```

Agregar un test que confirme que, tras un pago exitoso (`payment.status === 2`), se captura `ebook_purchase_confirmed` con `resource`, `amount` y `discount_code` del/los item(s) `fulfilled`. El body exacto del mock de Flow (`getPaymentStatus`) y de Supabase debe copiarse de un test existente en el mismo archivo que ya simula un pago confirmado (buscar el test que verifica el insert en `ebook_purchases`).

- [ ] **Step 7: Correr el test y verificar que falla**

Run: `npm test -- tests/confirm.test.ts`
Expected: FAIL.

- [ ] **Step 8: Instrumentar `app/api/flow/confirm/route.ts`**

Agregar el import:

```typescript
import { captureServerEvent } from "@/lib/posthog-server";
```

Dentro del bloque `if (fulfilled.length > 0) { ... }`, después del loop de `decrementCupo` (antes del bloque de `discountCode`), agregar un evento por cada item entregado:

```typescript
for (const item of fulfilled) {
  captureServerEvent("ebook_purchase_confirmed", payment.email, {
    resource: item.resource,
    amount: item.amount,
    item_count: fulfilled.length,
    discount_code: discountCode,
  }).catch((err) =>
    console.error(`[flow/confirm] falló el evento de PostHog para ${item.resource}:`, err)
  );
}
```

- [ ] **Step 9: Correr el test y verificar que pasa**

Run: `npm test -- tests/confirm.test.ts`
Expected: PASS.

- [ ] **Step 10: Test suite completa**

Run: `npm test`
Expected: todos los tests pasan (incluye los de las Tasks 1-3).

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 11: Commit**

```bash
git add app/api/flow/create/route.ts app/api/flow/confirm/route.ts tests/create.test.ts tests/confirm.test.ts
git commit -m "feat: trackea checkout iniciado y compra confirmada en PostHog (server-side)"
```

---

### Task 5: Feature flag de A/B testing en `EbookPricing`

**Files:**
- Modify: `package.json` (no requiere dependencia nueva — `posthog-js/react` viene incluido en `posthog-js`)
- Modify: `components/EbookPricing.tsx`
- Modify: `app/layout.tsx` (envolver con `PostHogProviderReact` de `posthog-js/react` para habilitar el hook)
- Test: `tests/analytics.test.ts` (extender con el helper de variante, si se extrae uno)

**Interfaces:**
- Consumes: `usePostHog` / `useFeatureFlagVariantKey` de `posthog-js/react`.
- Produces: la propiedad `pricing_variant` se agrega a los 3 eventos client-side ya emitidos en Task 3 (`ebook_page_view`, `ebook_combo_toggle`, `ebook_checkout_started`).

`posthog-js/react` exige que el árbol esté envuelto en su propio `<PostHogProvider>` (de la librería) para que los hooks funcionen — es un componente distinto al `components/PostHogProvider.tsx` custom creado en Task 2 (ese solo hace `posthog.init`). Esta task reconcilia ambos: el provider custom sigue haciendo `init` (para que funcione aunque no se usen los hooks en el futuro), y se agrega el provider de la librería alrededor, pasándole la misma instancia.

- [ ] **Step 1: Ajustar `components/PostHogProvider.tsx` para exponer la instancia vía el provider de la librería**

Reemplazar el archivo completo:

```tsx
"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PostHogReactProvider } from "posthog-js/react";

/**
 * Inicializa posthog-js una sola vez, al montar, y expone la instancia vía
 * el provider oficial de posthog-js/react para que useFeatureFlagVariantKey
 * y demás hooks funcionen en los componentes hijos. Si no hay
 * NEXT_PUBLIC_POSTHOG_KEY configurada, no inicializa nada — lib/analytics.ts
 * y los hooks tratan eso como "cliente no cargado" y no capturan/resuelven
 * nada, sin romper build/dev.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthog.__loaded) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      person_profiles: "identified_only",
    });
  }, []);

  return <PostHogReactProvider client={posthog}>{children}</PostHogReactProvider>;
}
```

- [ ] **Step 2: Typecheck tras el cambio del provider**

Run: `npm run build`
Expected: sin errores (si `posthog-js/react` no exporta `PostHogProvider` con ese nombre exacto, revisar el export real en `node_modules/posthog-js/react/dist/index.d.ts` y ajustar el import).

- [ ] **Step 3: Leer el flag en `EbookPricing` con fallback seguro a `"control"`**

Agregar el import junto a los demás en `components/EbookPricing.tsx`:

```tsx
import { useFeatureFlagVariantKey } from "posthog-js/react";
```

Dentro del componente, junto a los demás hooks (antes del primer `useEffect`):

```tsx
const pricingVariant = useFeatureFlagVariantKey("ebook-pricing-variant") ?? "control";
```

- [ ] **Step 4: Adjuntar `pricing_variant` a los 3 eventos ya emitidos**

En el `useEffect` de `ebook_page_view` (Task 3, Step 1):

```tsx
useEffect(() => {
  trackEbookEvent("ebook_page_view", { resource, pricing_variant: pricingVariant });
}, [resource, pricingVariant]);
```

En `toggleExtra` (Task 3, Step 2), agregar la propiedad al objeto ya existente:

```tsx
trackEbookEvent("ebook_combo_toggle", {
  resource,
  extra_resource: extraResource,
  action: checked ? "add" : "remove",
  pricing_variant: pricingVariant,
});
```

En `handleSubmit` (Task 3, Step 3), agregar la propiedad al objeto ya existente:

```tsx
trackEbookEvent("ebook_checkout_started", {
  resource,
  tier,
  item_count: selectedResources.length,
  has_discount_code: Boolean(appliedDiscount),
  pricing_variant: pricingVariant,
});
```

- [ ] **Step 5: Typecheck y test suite completos**

Run: `npm run build`
Expected: sin errores.

Run: `npm test`
Expected: todos los tests pasan (el hook de PostHog no se ejecuta en el entorno de test de vitest porque los tests de Task 1-4 no montan el componente completo — ver nota en Task 3).

- [ ] **Step 6: Commit**

```bash
git add components/PostHogProvider.tsx components/EbookPricing.tsx
git commit -m "feat: agrega A/B testing de pricing via PostHog feature flags"
```

---

### Task 6: Verificación manual en navegador + PR

**Files:** ninguno (task de verificación y entrega, sin cambios de código)

- [ ] **Step 1: Levantar el dev server y verificar que la página del ebook sigue funcionando**

Iniciar `npm run dev`, navegar a `/ebook/de-cero-a-claude-en-una-semana`, confirmar en la consola del navegador que no hay errores nuevos y que el bloque de precio se renderiza igual que antes (sin `NEXT_PUBLIC_POSTHOG_KEY` configurada en `.env.local`, PostHog debe quedar inactivo silenciosamente).

- [ ] **Step 2: Si el usuario ya cargó las credenciales de PostHog en `.env.local`, verificar el evento en el dashboard**

Reiniciar el dev server (las env vars de Next.js se leen al boot), recargar la página, y en el dashboard de PostHog → Activity → Live events confirmar que llegó `ebook_page_view` con `resource: "ebook:de-cero-a-claude-en-una-semana"`.

- [ ] **Step 3: Abrir un PR con el diff completo de las 5 tasks anteriores**

```bash
git push -u origin docs/runbook-activar-ebook
gh pr create --title "feat: upsell generalizado + PostHog + A/B testing para ebooks" --body "$(cat <<'EOF'
## Summary
- Generaliza `EbookPricing` para aceptar cualquier `resource`, no solo el libro 1 — cualquier página de venta futura lo reutiliza sin cambios.
- Instrumenta PostHog (cliente + servidor) en todo el funnel de venta de ebooks: page view, toggle de combo, checkout iniciado, compra confirmada. No-op si no hay credenciales configuradas.
- Habilita A/B testing de copy/orden vía feature flag de PostHog (`ebook-pricing-variant`), propagado a los eventos del funnel.

Ver spec completo en `docs/superpowers/specs/2026-07-29-ebook-upsell-ab-posthog-design.md` y plan en `docs/superpowers/plans/2026-07-29-ebook-upsell-ab-posthog.md`.

## Test plan
- [x] `npm test` — suite completa en verde, incluye mocks nuevos de `posthog-js`/`posthog-node`
- [x] `npm run build` — typecheck sin errores
- [ ] Verificación manual en navegador (página del ebook renderiza igual, sin errores de consola)
- [ ] Confirmar en el dashboard de PostHog que `ebook_page_view` llega en Live Events tras cargar las credenciales reales
- [ ] Activar la integración Vercel↔PostHog desde el dashboard de PostHog (Data pipelines → Vercel) para deploy tracking — paso de configuración manual, no requiere código
EOF
)"
```

- [ ] **Step 4: Reportar la URL del PR al usuario**

No mergear — el runbook del proyecto (`AGENTS.md`) exige que el merge a `main` sea decisión explícita del usuario.
