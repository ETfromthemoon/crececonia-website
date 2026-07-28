# Motor de Bundles/Combo entre Ebooks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generalizar el checkout de ebooks (hoy hardcodeado a un solo libro) para soportar
combos de N libros con descuento por cantidad (10% por 2, 20% por 3), extensible a futuros
ebooks sin tocar el motor.

**Architecture:** Un catálogo en código (`lib/ebook-catalog.ts`) lista cada ebook con su
`resource` id y si está `active` (comprable). `ebook_purchases`/`ebook_cupos` ganan una columna
`resource` (migración aditiva, backfill automático). Un motor puro de descuento
(`lib/ebook-bundles.ts`) calcula el total de un combo. `/api/flow/create` acepta un array de
`resources` y hace un solo cargo en Flow; `/api/flow/confirm` inserta una fila de compra por
libro del combo (mismo `flow_token`), decrementa cupos de cada uno, y manda un solo correo con
todos los links de descarga.

**Tech Stack:** Next.js 16 App Router (TypeScript), Supabase (Postgres vía `@supabase/supabase-js`),
Flow (pasarela de pago chilena), Resend (email), Vitest.

## Global Constraints

- No hay migraciones versionadas en este repo — los cambios de schema de Supabase se entregan
  como SQL para correr a mano en el dashboard (ver Task 9).
- El camino de compra de 1 solo libro debe seguir funcionando exactamente igual que hoy — es la
  prueba de que nada se rompió.
- El combo (2+ libros) y los códigos de descuento nunca se combinan — si `resources.length > 1`,
  cualquier `discountCode` se rechaza con 400.
- Ningún libro nuevo queda `active` en el catálogo como parte de este trabajo — el motor queda
  listo pero inactivo hasta que se decida lanzar el libro 2.
- `npm test` y `npm run build` deben pasar limpios al final de cada task que toque código.

---

### Task 1: Catálogo de ebooks

**Files:**
- Create: `lib/ebook-catalog.ts`
- Test: `tests/ebook-catalog.test.ts`

**Interfaces:**
- Produces: `EBOOK_CATALOG: EbookCatalogEntry[]`, `DEFAULT_EBOOK_RESOURCE: string`,
  `getCatalogEntry(resource: string): EbookCatalogEntry | undefined`,
  `getActiveCatalogEntries(): EbookCatalogEntry[]`.
  `EbookCatalogEntry` es un discriminated union sobre `active`: cuando `active: true` exige
  `tierPrices: { superEarly: number; early: number; regular: number }`; cuando `active: false` no
  lo tiene (los libros "Próximamente" no tienen precio definido todavía).

- [ ] **Step 1: Escribir el test primero**

```typescript
// tests/ebook-catalog.test.ts
import { describe, it, expect } from "vitest";
import {
  EBOOK_CATALOG,
  DEFAULT_EBOOK_RESOURCE,
  getCatalogEntry,
  getActiveCatalogEntries,
} from "@/lib/ebook-catalog";

describe("ebook-catalog", () => {
  it("DEFAULT_EBOOK_RESOURCE apunta al libro 1", () => {
    expect(DEFAULT_EBOOK_RESOURCE).toBe("ebook:de-cero-a-claude-en-una-semana");
  });

  it("getCatalogEntry encuentra una entrada existente", () => {
    const entry = getCatalogEntry(DEFAULT_EBOOK_RESOURCE);
    expect(entry?.resource).toBe(DEFAULT_EBOOK_RESOURCE);
    expect(entry?.active).toBe(true);
  });

  it("getCatalogEntry devuelve undefined para un resource desconocido", () => {
    expect(getCatalogEntry("ebook:no-existe")).toBeUndefined();
  });

  it("getActiveCatalogEntries hoy devuelve solo el libro 1", () => {
    const active = getActiveCatalogEntries();
    expect(active).toHaveLength(1);
    expect(active[0].resource).toBe(DEFAULT_EBOOK_RESOURCE);
  });

  it("el libro activo trae tierPrices, los coming-soon no", () => {
    const active = EBOOK_CATALOG.find((e) => e.active)!;
    expect(active.active && active.tierPrices.regular).toBe(27000);

    const comingSoon = EBOOK_CATALOG.filter((e) => !e.active);
    expect(comingSoon.length).toBeGreaterThan(0);
    comingSoon.forEach((e) => expect("tierPrices" in e).toBe(false));
  });
});
```

- [ ] **Step 2: Correr el test, verificar que falla**

Run: `npx vitest run tests/ebook-catalog.test.ts`
Expected: FAIL — `Cannot find module '@/lib/ebook-catalog'`

- [ ] **Step 3: Implementar**

```typescript
// lib/ebook-catalog.ts

export type EbookTierPrices = {
  superEarly: number;
  early: number;
  regular: number;
};

export type EbookCatalogEntry =
  | {
      resource: string;
      title: string;
      subject: string;
      href: string;
      active: true;
      tierPrices: EbookTierPrices;
    }
  | {
      resource: string;
      title: string;
      subject: string;
      href: string;
      active: false;
    };

export const DEFAULT_EBOOK_RESOURCE = "ebook:de-cero-a-claude-en-una-semana";

export const EBOOK_CATALOG: EbookCatalogEntry[] = [
  {
    resource: DEFAULT_EBOOK_RESOURCE,
    title: "De cero a Claude en una semana",
    subject: "De cero a Claude en una semana",
    href: "/ebook/de-cero-a-claude-en-una-semana",
    active: true,
    tierPrices: { superEarly: 10800, early: 17900, regular: 27000 },
  },
  {
    resource: "ebook:agentes-de-ia",
    title: "Agentes de IA",
    subject: "Agentes de IA",
    href: "/ebooks/agentes-de-ia",
    active: false,
  },
  {
    resource: "ebook:sitios-web-ia",
    title: "Sitios web con IA",
    subject: "Sitios web con IA",
    href: "/ebooks/sitios-web-ia",
    active: false,
  },
];

export function getCatalogEntry(resource: string): EbookCatalogEntry | undefined {
  return EBOOK_CATALOG.find((entry) => entry.resource === resource);
}

export function getActiveCatalogEntries(): EbookCatalogEntry[] {
  return EBOOK_CATALOG.filter((entry): entry is Extract<EbookCatalogEntry, { active: true }> => entry.active);
}
```

- [ ] **Step 4: Correr el test, verificar que pasa**

Run: `npx vitest run tests/ebook-catalog.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/ebook-catalog.ts tests/ebook-catalog.test.ts
git commit -m "feat: catálogo de ebooks como config extensible"
```

---

### Task 2: Motor de descuento por combo

**Files:**
- Create: `lib/ebook-bundles.ts`
- Test: `tests/ebook-bundles.test.ts`

**Interfaces:**
- Consumes: nada (función pura, sin dependencias de Supabase/Flow).
- Produces: `BUNDLE_DISCOUNT_RULES`, `getComboDiscountPercent(itemCount: number): number`,
  `computeBundleTotal(items: BundleItemInput[]): BundleTotal` donde
  `BundleItemInput = { resource: string; price: number }` y
  `BundleTotal = { subtotal: number; discountPercent: number; discountAmount: number; total: number; items: BundleItemResult[] }`
  con `BundleItemResult = BundleItemInput & { amount: number }` (el monto ya prorrateado que se
  inserta por fila en `ebook_purchases` — Task 6 depende de este campo).

- [ ] **Step 1: Escribir el test primero**

```typescript
// tests/ebook-bundles.test.ts
import { describe, it, expect } from "vitest";
import { getComboDiscountPercent, computeBundleTotal } from "@/lib/ebook-bundles";

describe("getComboDiscountPercent", () => {
  it("0% para 1 item", () => expect(getComboDiscountPercent(1)).toBe(0));
  it("10% para 2 items", () => expect(getComboDiscountPercent(2)).toBe(10));
  it("20% para 3 items", () => expect(getComboDiscountPercent(3)).toBe(20));
  it("20% para más de 3 (usa el tramo más alto que aplica)", () => {
    expect(getComboDiscountPercent(5)).toBe(20);
  });
});

describe("computeBundleTotal", () => {
  it("lanza si la lista está vacía", () => {
    expect(() => computeBundleTotal([])).toThrow();
  });

  it("1 item: sin descuento, el monto completo va a ese item", () => {
    const result = computeBundleTotal([{ resource: "a", price: 27000 }]);
    expect(result.subtotal).toBe(27000);
    expect(result.discountPercent).toBe(0);
    expect(result.total).toBe(27000);
    expect(result.items).toEqual([{ resource: "a", price: 27000, amount: 27000 }]);
  });

  it("2 items: 10% de descuento sobre la suma", () => {
    const result = computeBundleTotal([
      { resource: "a", price: 27000 },
      { resource: "b", price: 27000 },
    ]);
    expect(result.subtotal).toBe(54000);
    expect(result.discountPercent).toBe(10);
    expect(result.total).toBe(48600);
    expect(result.discountAmount).toBe(5400);
  });

  it("3 items: 20% de descuento sobre la suma", () => {
    const result = computeBundleTotal([
      { resource: "a", price: 27000 },
      { resource: "b", price: 27000 },
      { resource: "c", price: 27000 },
    ]);
    expect(result.total).toBe(64800); // 81000 * 0.8
  });

  it("el reparto proporcional de items suma exacto al total, incluso con precios distintos", () => {
    const result = computeBundleTotal([
      { resource: "a", price: 10800 },
      { resource: "b", price: 17900 },
    ]);
    const sumOfAmounts = result.items.reduce((s, i) => s + i.amount, 0);
    expect(sumOfAmounts).toBe(result.total);
  });

  it("el redondeo se ajusta en el último item, no en el primero", () => {
    // subtotal 100, 2 items de precios distintos -> forzar un caso con resto
    const result = computeBundleTotal([
      { resource: "a", price: 33333 },
      { resource: "b", price: 33334 },
    ]);
    const sumOfAmounts = result.items.reduce((s, i) => s + i.amount, 0);
    expect(sumOfAmounts).toBe(result.total);
  });
});
```

- [ ] **Step 2: Correr el test, verificar que falla**

Run: `npx vitest run tests/ebook-bundles.test.ts`
Expected: FAIL — `Cannot find module '@/lib/ebook-bundles'`

- [ ] **Step 3: Implementar**

```typescript
// lib/ebook-bundles.ts

export interface BundleRule {
  minItems: number;
  discountPercent: number;
}

/**
 * Reglas de descuento por cantidad de libros en el combo. Extensible: agregar
 * un ebook #4 no requiere tocar esto — solo agregar la entrada al catálogo
 * (lib/ebook-catalog.ts) y decidir si el tramo de 4+ necesita su propia regla.
 */
export const BUNDLE_DISCOUNT_RULES: BundleRule[] = [
  { minItems: 1, discountPercent: 0 },
  { minItems: 2, discountPercent: 10 },
  { minItems: 3, discountPercent: 20 },
];

export function getComboDiscountPercent(itemCount: number): number {
  const applicable = BUNDLE_DISCOUNT_RULES.filter((rule) => rule.minItems <= itemCount);
  if (applicable.length === 0) return 0;
  return Math.max(...applicable.map((rule) => rule.discountPercent));
}

export interface BundleItemInput {
  resource: string;
  price: number;
}

export interface BundleItemResult extends BundleItemInput {
  amount: number;
}

export interface BundleTotal {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  items: BundleItemResult[];
}

/**
 * Reparte `total` (ya con el descuento de combo aplicado) proporcionalmente
 * entre los items según su peso en `subtotal`, para que la suma de montos
 * insertados por fila en ebook_purchases cuadre exacto con lo cobrado. El
 * resto del redondeo se absorbe en el último item, no en el primero — así el
 * ajuste cae siempre en el mismo lugar y es predecible en los reportes.
 */
export function computeBundleTotal(items: BundleItemInput[]): BundleTotal {
  if (items.length === 0) {
    throw new Error("computeBundleTotal requiere al menos 1 item.");
  }

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discountPercent = getComboDiscountPercent(items.length);
  const total = Math.round(subtotal * (1 - discountPercent / 100));
  const discountAmount = subtotal - total;

  let allocated = 0;
  const resultItems: BundleItemResult[] = items.map((item, index) => {
    if (index === items.length - 1) {
      return { ...item, amount: total - allocated };
    }
    const share = Math.round((item.price / subtotal) * total);
    allocated += share;
    return { ...item, amount: share };
  });

  return { subtotal, discountPercent, discountAmount, total, items: resultItems };
}
```

- [ ] **Step 4: Correr el test, verificar que pasa**

Run: `npx vitest run tests/ebook-bundles.test.ts`
Expected: PASS (12 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/ebook-bundles.ts tests/ebook-bundles.test.ts
git commit -m "feat: motor puro de descuento por combo (10%/20%)"
```

---

### Task 3: Generalizar `lib/ebook-pricing.ts` a multi-libro

**Files:**
- Modify: `lib/ebook-pricing.ts` (todo el archivo — ver Contexto)
- Modify: `tests/pricing.test.ts:28-146` (agregar `resource` a cada llamada)

**Contexto (estado actual, para quien no tiene el archivo abierto):**

```typescript
// lib/ebook-pricing.ts (ANTES)
export async function getCurrentPrice(): Promise<PriceInfo> { /* usa constantes 10800/17900/27000 */ }
export function determineTier(amount: number): Tier { /* compara contra 10800/17900 hardcoded */ }
export async function decrementCupo(tier: Tier): Promise<void> { /* rpc("increment_cupo_used", { p_tier }) */ }
export async function getEbookSoldCount(): Promise<number> { /* sin cambios en este task */ }
```

**Interfaces:**
- Consumes: `getCatalogEntry` de `lib/ebook-catalog.ts` (Task 1).
- Produces: `getCurrentPrice(resource: string): Promise<PriceInfo>`,
  `determineTier(amount: number, resource: string): Tier`,
  `decrementCupo(resource: string, tier: Tier): Promise<void>` — firmas nuevas, con `resource`
  como parámetro obligatorio. `getEbookSoldCount()` NO cambia (sigue sin filtrar por resource,
  decisión documentada en el spec).

- [ ] **Step 1: Actualizar el test primero (agregar resource a cada llamada)**

```typescript
// tests/pricing.test.ts — reemplazar el archivo completo
import { describe, it, expect, vi, beforeEach } from "vitest";
import { determineTier, getCurrentPrice, decrementCupo } from "@/lib/ebook-pricing";
import { DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";

const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({ from: mockFrom, rpc: mockRpc }),
}));

function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "update", "single", "maybeSingle"];
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  Object.defineProperty(chain, Symbol.toStringTag, { value: "Promise" });
  const promise = Promise.resolve(result);
  (chain as unknown as Promise<unknown>).then = promise.then.bind(promise);
  return chain;
}

describe("determineTier", () => {
  it("devuelve super-early para monto ≤ 10800", () => {
    expect(determineTier(10800, DEFAULT_EBOOK_RESOURCE)).toBe("super-early");
    expect(determineTier(100, DEFAULT_EBOOK_RESOURCE)).toBe("super-early");
  });

  it("devuelve early para monto entre 10801 y 17900", () => {
    expect(determineTier(17900, DEFAULT_EBOOK_RESOURCE)).toBe("early");
    expect(determineTier(10801, DEFAULT_EBOOK_RESOURCE)).toBe("early");
  });

  it("devuelve regular para monto > 17900", () => {
    expect(determineTier(27000, DEFAULT_EBOOK_RESOURCE)).toBe("regular");
    expect(determineTier(17901, DEFAULT_EBOOK_RESOURCE)).toBe("regular");
  });

  it("lanza para un resource que no está activo en el catálogo", () => {
    expect(() => determineTier(10000, "ebook:agentes-de-ia")).toThrow(/no comprable/i);
  });
});

describe("getCurrentPrice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna tier super-early cuando hay cupos disponibles", async () => {
    const chain = makeChain({
      data: [
        { tier: "super-early", total: 10, used: 3 },
        { tier: "early", total: 40, used: 0 },
      ],
    });
    mockFrom.mockReturnValue(chain);

    const result = await getCurrentPrice(DEFAULT_EBOOK_RESOURCE);
    expect(result.tier).toBe("super-early");
    expect(result.price).toBe(10800);
    expect(result.remaining).toBe(7);
    expect(result.originalPrice).toBe(27000);
  });

  it("retorna tier early cuando super-early está agotado", async () => {
    const chain = makeChain({
      data: [
        { tier: "super-early", total: 10, used: 10 },
        { tier: "early", total: 40, used: 15 },
      ],
    });
    mockFrom.mockReturnValue(chain);

    const result = await getCurrentPrice(DEFAULT_EBOOK_RESOURCE);
    expect(result.tier).toBe("early");
    expect(result.price).toBe(17900);
    expect(result.remaining).toBe(25);
  });

  it("retorna tier regular cuando todos los cupos están agotados", async () => {
    const chain = makeChain({
      data: [
        { tier: "super-early", total: 10, used: 10 },
        { tier: "early", total: 40, used: 40 },
      ],
    });
    mockFrom.mockReturnValue(chain);

    const result = await getCurrentPrice(DEFAULT_EBOOK_RESOURCE);
    expect(result.tier).toBe("regular");
    expect(result.price).toBe(27000);
    expect(result.remaining).toBeNull();
  });

  it("retorna regular cuando Supabase devuelve array vacío", async () => {
    mockFrom.mockReturnValue(makeChain({ data: [] }));
    const result = await getCurrentPrice(DEFAULT_EBOOK_RESOURCE);
    expect(result.tier).toBe("regular");
    expect(result.price).toBe(27000);
  });

  it("retorna regular cuando Supabase devuelve null", async () => {
    mockFrom.mockReturnValue(makeChain({ data: null }));
    const result = await getCurrentPrice(DEFAULT_EBOOK_RESOURCE);
    expect(result.tier).toBe("regular");
  });

  it("filtra la consulta de cupos por resource", async () => {
    const chain = makeChain({ data: [] });
    mockFrom.mockReturnValue(chain);
    await getCurrentPrice(DEFAULT_EBOOK_RESOURCE);
    expect(chain.eq).toHaveBeenCalledWith("resource", DEFAULT_EBOOK_RESOURCE);
  });

  it("lanza para un resource inactivo o inexistente", async () => {
    await expect(getCurrentPrice("ebook:no-existe")).rejects.toThrow(/no comprable/i);
  });
});

describe("decrementCupo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ error: null });
  });

  it("no hace nada para tier regular", async () => {
    await decrementCupo(DEFAULT_EBOOK_RESOURCE, "regular");
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("incrementa el cupo con una sola sentencia atómica (RPC), incluyendo el resource", async () => {
    await decrementCupo(DEFAULT_EBOOK_RESOURCE, "super-early");
    expect(mockRpc).toHaveBeenCalledWith("increment_cupo_used", {
      p_resource: DEFAULT_EBOOK_RESOURCE,
      p_tier: "super-early",
    });
  });

  it("lanza cuando la RPC falla, en vez de corromper el contador", async () => {
    mockRpc.mockResolvedValue({ error: { message: "statement timeout" } });
    await expect(decrementCupo(DEFAULT_EBOOK_RESOURCE, "super-early")).rejects.toThrow(
      /no se pudo incrementar el cupo/i
    );
  });
});
```

- [ ] **Step 2: Correr el test, verificar que falla**

Run: `npx vitest run tests/pricing.test.ts`
Expected: FAIL — firmas actuales no aceptan `resource`, TypeScript se queja o los asserts de
`.eq("resource", ...)` fallan.

- [ ] **Step 3: Implementar**

```typescript
// lib/ebook-pricing.ts
import { getSupabaseAdmin } from "./supabase";
import { getCatalogEntry } from "./ebook-catalog";

export type Tier = "super-early" | "early" | "regular";

export interface PriceInfo {
  price: number;
  tier: Tier;
  remaining: number | null;
  originalPrice: number;
}

function getActiveEntryOrThrow(resource: string) {
  const entry = getCatalogEntry(resource);
  if (!entry || !entry.active) {
    throw new Error(`Recurso no comprable: ${resource}`);
  }
  return entry;
}

export async function getCurrentPrice(resource: string): Promise<PriceInfo> {
  const entry = getActiveEntryOrThrow(resource);
  const db = getSupabaseAdmin();
  const { data } = await db.from("ebook_cupos").select("*").eq("resource", resource);
  const cupos: Record<string, { total: number; used: number }> =
    Object.fromEntries((data ?? []).map((r) => [r.tier, r]));

  const superEarlyLeft = (cupos["super-early"]?.total ?? 0) - (cupos["super-early"]?.used ?? 0);
  if (superEarlyLeft > 0) {
    return {
      price: entry.tierPrices.superEarly,
      tier: "super-early",
      remaining: superEarlyLeft,
      originalPrice: entry.tierPrices.regular,
    };
  }

  const earlyLeft = (cupos["early"]?.total ?? 0) - (cupos["early"]?.used ?? 0);
  if (earlyLeft > 0) {
    return {
      price: entry.tierPrices.early,
      tier: "early",
      remaining: earlyLeft,
      originalPrice: entry.tierPrices.regular,
    };
  }

  return { price: entry.tierPrices.regular, tier: "regular", remaining: null, originalPrice: entry.tierPrices.regular };
}

export function determineTier(amount: number, resource: string): Tier {
  const entry = getActiveEntryOrThrow(resource);
  if (amount <= entry.tierPrices.superEarly) return "super-early";
  if (amount <= entry.tierPrices.early) return "early";
  return "regular";
}

export async function decrementCupo(resource: string, tier: Tier): Promise<void> {
  if (tier === "regular") return;
  const db = getSupabaseAdmin();
  const { error } = await db.rpc("increment_cupo_used", { p_resource: resource, p_tier: tier });
  if (error) {
    throw new Error(`No se pudo incrementar el cupo de ${resource}/${tier}: ${error.message}`);
  }
}

const UNRECORDED_SOLD_OFFSET = 59;

export async function getEbookSoldCount(): Promise<number> {
  const db = getSupabaseAdmin();
  const { count } = await db
    .from("ebook_purchases")
    .select("id", { count: "exact", head: true });
  return UNRECORDED_SOLD_OFFSET + (count ?? 0);
}
```

- [ ] **Step 4: Correr el test, verificar que pasa**

Run: `npx vitest run tests/pricing.test.ts`
Expected: PASS (todos los casos, incluidos los 2 nuevos de resource inválido)

- [ ] **Step 5: Commit**

```bash
git add lib/ebook-pricing.ts tests/pricing.test.ts
git commit -m "feat: generaliza pricing/cupos a multi-libro (resource)"
```

---

### Task 4: `/api/ebook/cupos` acepta `?resource=`

**Files:**
- Modify: `app/api/ebook/cupos/route.ts`
- Test: `tests/cupos.test.ts` (nuevo — hoy esta ruta no tiene test)

**Interfaces:**
- Consumes: `getCurrentPrice(resource)` (Task 3), `DEFAULT_EBOOK_RESOURCE` (Task 1).
- Produces: `GET` sigue devolviendo `PriceInfo`, ahora respetando `?resource=`.

- [ ] **Step 1: Escribir el test primero**

```typescript
// tests/cupos.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetCurrentPrice } = vi.hoisted(() => ({ mockGetCurrentPrice: vi.fn() }));
vi.mock("@/lib/ebook-pricing", () => ({ getCurrentPrice: mockGetCurrentPrice }));

import { GET } from "@/app/api/ebook/cupos/route";
import { DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";

function reqWith(resource?: string) {
  const url = resource
    ? `https://test.com/api/ebook/cupos?resource=${resource}`
    : "https://test.com/api/ebook/cupos";
  return new Request(url);
}

describe("GET /api/ebook/cupos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("usa el libro por defecto cuando no viene ?resource=", async () => {
    mockGetCurrentPrice.mockResolvedValue({ price: 27000, tier: "regular", remaining: null, originalPrice: 27000 });
    await GET(reqWith());
    expect(mockGetCurrentPrice).toHaveBeenCalledWith(DEFAULT_EBOOK_RESOURCE);
  });

  it("pasa el resource de la query string", async () => {
    mockGetCurrentPrice.mockResolvedValue({ price: 27000, tier: "regular", remaining: null, originalPrice: 27000 });
    await GET(reqWith("ebook:agentes-de-ia"));
    expect(mockGetCurrentPrice).toHaveBeenCalledWith("ebook:agentes-de-ia");
  });

  it("devuelve el fallback 200 si getCurrentPrice falla", async () => {
    mockGetCurrentPrice.mockRejectedValue(new Error("DB down"));
    const res = await GET(reqWith());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe("regular");
  });
});
```

- [ ] **Step 2: Correr el test, verificar que falla**

Run: `npx vitest run tests/cupos.test.ts`
Expected: FAIL — la ruta actual llama `getCurrentPrice()` sin args, no lee `?resource=`.

- [ ] **Step 3: Implementar**

```typescript
// app/api/ebook/cupos/route.ts
import { NextResponse } from "next/server";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const resource = new URL(request.url).searchParams.get("resource") ?? DEFAULT_EBOOK_RESOURCE;
  const priceInfo = await getCurrentPrice(resource).catch(() => null);

  if (!priceInfo) {
    return NextResponse.json(
      { price: 27000, tier: "regular", remaining: null, originalPrice: 27000 },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
      }
    );
  }
  return NextResponse.json(priceInfo, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
```

- [ ] **Step 4: Correr el test, verificar que pasa**

Run: `npx vitest run tests/cupos.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add app/api/ebook/cupos/route.ts tests/cupos.test.ts
git commit -m "feat: /api/ebook/cupos acepta ?resource= para multi-libro"
```

---

### Task 5: `/api/flow/create` acepta combos

**Files:**
- Modify: `app/api/flow/create/route.ts`
- Modify: `tests/create.test.ts` (agregar casos de combo; los existentes de 1 libro deben seguir
  pasando con un ajuste mínimo: el body ahora manda `resources: [DEFAULT_EBOOK_RESOURCE]` en vez
  de nada — ver Step 1)

**Interfaces:**
- Consumes: `getCurrentPrice(resource)` (Task 3), `computeBundleTotal(items)` (Task 2),
  `getCatalogEntry`/`getActiveCatalogEntries` (Task 1), `validateDiscountCode` (ya existe, sin
  cambios).
- Produces: body de request pasa a `{ email, resources: string[], discountCode? }`. Si no viene
  `resources` (cliente viejo), usa `[DEFAULT_EBOOK_RESOURCE]` por compatibilidad — así el único
  caller real (EbookPricing.tsx, Task 7) puede migrarse sin coordinar el deploy exacto.

- [ ] **Step 1: Actualizar el test primero**

Reemplazar `tests/create.test.ts` completo — mismos casos que hoy (email inválido, Flow caído,
descuento, etc., todos con `resources: [DEFAULT_EBOOK_RESOURCE]` explícito en el body para dejar
claro qué se está probando) más los casos nuevos de combo al final:

```typescript
// tests/create.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";

const { mockGetCurrentPrice } = vi.hoisted(() => ({
  mockGetCurrentPrice: vi.fn().mockResolvedValue({
    price: 10800,
    tier: "super-early",
    remaining: 7,
    originalPrice: 27000,
  }),
}));
vi.mock("@/lib/ebook-pricing", () => ({ getCurrentPrice: mockGetCurrentPrice }));

const { mockPendingInsert, mockValidateDiscount } = vi.hoisted(() => ({
  mockPendingInsert: vi.fn().mockResolvedValue({ error: null }),
  mockValidateDiscount: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({ from: () => ({ insert: mockPendingInsert }) }),
}));

vi.mock("@/lib/discount-codes", () => ({
  validateDiscountCode: mockValidateDiscount,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function flowOk() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ url: "https://sandbox.flow.cl/pay", token: "tok_ok" }),
  });
}

import { POST } from "@/app/api/flow/create/route";

function postJson(body: unknown) {
  return new Request("https://test.com/api/flow/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function flowBody() {
  return new URLSearchParams(mockFetch.mock.calls[0][1].body as string);
}

describe("POST /api/flow/create — 1 solo libro (comportamiento existente)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("400 cuando no se pasa email", async () => {
    const res = await POST(postJson({ resources: [DEFAULT_EBOOK_RESOURCE] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/email/i);
  });

  it("400 para email sin formato válido", async () => {
    const res = await POST(postJson({ email: "no-es-un-email", resources: [DEFAULT_EBOOK_RESOURCE] }));
    expect(res.status).toBe(400);
  });

  it("400 para body no-JSON", async () => {
    const res = await POST(
      new Request("https://test.com/api/flow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "esto no es json",
      })
    );
    expect(res.status).toBe(400);
  });

  it("usa el libro por defecto si no se manda `resources` (cliente viejo)", async () => {
    flowOk();
    const res = await POST(postJson({ email: "user@test.com" }));
    expect(res.status).toBe(200);
    expect(mockGetCurrentPrice).toHaveBeenCalledWith(DEFAULT_EBOOK_RESOURCE);
  });

  it("502 cuando Flow API devuelve !ok", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const res = await POST(postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE] }));
    expect(res.status).toBe(502);
  });

  it("200 con redirectUrl cuando Flow responde correctamente", async () => {
    flowOk();
    const res = await POST(postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE] }));
    expect(res.status).toBe(200);
    expect((await res.json()).redirectUrl).toContain("tok_ok");
  });

  it("500 cuando getCurrentPrice falla (Supabase caído)", async () => {
    mockGetCurrentPrice.mockRejectedValueOnce(new Error("DB down"));
    const res = await POST(postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE] }));
    expect(res.status).toBe(500);
  });

  it("cobra el monto con descuento cuando el código es válido", async () => {
    flowOk();
    mockValidateDiscount.mockResolvedValue({
      valid: true,
      code: "PROMO-ABC",
      type: "percent",
      amount: 50,
      finalPrice: 5400,
    });
    const res = await POST(
      postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE], discountCode: "promo-abc" })
    );
    expect(res.status).toBe(200);
    expect(flowBody().get("amount")).toBe("5400");
  });

  it("400 y no llama a Flow cuando el código es inválido", async () => {
    flowOk();
    mockValidateDiscount.mockResolvedValue({ valid: false, reason: "Este código venció." });
    const res = await POST(
      postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE], discountCode: "VENCIDO" })
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("la venta sigue si falla el registro de la orden pendiente", async () => {
    flowOk();
    mockPendingInsert.mockResolvedValueOnce({ error: { message: "DB down" } });
    const res = await POST(postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE] }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/flow/create — combos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentPrice.mockImplementation(async (resource: string) => {
      if (resource === "ebook:agentes-de-ia") {
        return { price: 15000, tier: "regular", remaining: null, originalPrice: 15000 };
      }
      return { price: 10800, tier: "super-early", remaining: 7, originalPrice: 27000 };
    });
  });

  it("400 si algún resource no existe en el catálogo", async () => {
    const res = await POST(
      postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE, "ebook:no-existe"] })
    );
    expect(res.status).toBe(400);
  });

  it("400 si algún resource está coming-soon (no active)", async () => {
    const res = await POST(
      postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE, "ebook:sitios-web-ia"] })
    );
    expect(res.status).toBe(400);
  });

  it("400 si se manda discountCode junto con 2+ resources", async () => {
    flowOk();
    const res = await POST(
      postJson({
        email: "user@test.com",
        resources: [DEFAULT_EBOOK_RESOURCE, "ebook:agentes-de-ia"],
        discountCode: "PROMO",
      })
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("400 si se repite el mismo libro dos veces en el combo", async () => {
    flowOk();
    const res = await POST(
      postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE, DEFAULT_EBOOK_RESOURCE] })
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// La matemática del descuento por combo (10%/20% sobre 2-3 libros DISTINTOS)
// ya está cubierta de forma exhaustiva y aislada en tests/ebook-bundles.test.ts
// (computeBundleTotal es una función pura, no necesita mocks de Supabase/Flow).
// Este archivo no repite esa matemática con 2 libros activos reales porque hoy
// el catálogo real (lib/ebook-catalog.ts) solo tiene 1 libro `active` — no hay
// forma de ejercitar ese camino sin mockear el catálogo, y hacerlo probaría un
// escenario que no puede ocurrir en producción todavía (ver spec, sección
// "Fuera de alcance"). Cuando se active el libro 2, agregar acá un test de
// combo real de 2 resources distintos con el descuento del 10% verificado
// end-to-end es la primera prueba de regresión a escribir.
```

- [ ] **Step 2: Correr el test, verificar que falla**

Run: `npx vitest run tests/create.test.ts`
Expected: FAIL — la ruta actual no lee `resources`, no valida catálogo, no rechaza duplicados.

- [ ] **Step 3: Implementar**

```typescript
// app/api/flow/create/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { validateDiscountCode } from "@/lib/discount-codes";
import { flowSign, getFlowBase } from "@/lib/flow";
import { getCatalogEntry, DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";
import { computeBundleTotal } from "@/lib/ebook-bundles";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email: string = body?.email ?? "";
  const discountCode: string | undefined = body?.discountCode || undefined;
  const resources: string[] =
    Array.isArray(body?.resources) && body.resources.length > 0
      ? body.resources
      : [DEFAULT_EBOOK_RESOURCE];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  const uniqueResources = new Set(resources);
  if (uniqueResources.size !== resources.length) {
    return NextResponse.json({ error: "No se puede repetir el mismo libro en el combo." }, { status: 400 });
  }

  for (const resource of resources) {
    const entry = getCatalogEntry(resource);
    if (!entry || !entry.active) {
      return NextResponse.json({ error: `Recurso no disponible: ${resource}` }, { status: 400 });
    }
  }

  if (resources.length > 1 && discountCode) {
    return NextResponse.json(
      { error: "Los códigos de descuento no aplican en combos." },
      { status: 400 }
    );
  }

  const priceInfos = await Promise.all(resources.map((r) => getCurrentPrice(r))).catch(() => null);
  if (!priceInfos) {
    return NextResponse.json(
      { error: "No se pudo obtener el precio. Intenta nuevamente." },
      { status: 500 }
    );
  }

  const bundle = computeBundleTotal(
    resources.map((resource, i) => ({ resource, price: priceInfos[i].price }))
  );

  let finalAmount = bundle.total;
  let appliedCode: string | undefined;

  if (discountCode) {
    // Solo llega acá si resources.length === 1 (ver validación arriba).
    const result = await validateDiscountCode(discountCode, priceInfos[0].price);
    if (!result.valid) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    finalAmount = result.finalPrice;
    appliedCode = result.code;
  }

  const apiKey = process.env.FLOW_API_KEY!;
  const secretKey = process.env.FLOW_SECRET_KEY!;
  const commerceOrder = `ebook-${Date.now()}-${randomId()}`;

  const pendingResources = resources.map((resource, i) => ({
    resource,
    tier: priceInfos[i].tier,
    amount: discountCode ? finalAmount : bundle.items[i].amount,
  }));

  try {
    const { error: pendingError } = await getSupabaseAdmin()
      .from("ebook_pending_orders")
      .insert({
        commerce_order: commerceOrder,
        resources: pendingResources,
        discount_code: appliedCode ?? null,
      });
    if (pendingError) throw new Error(pendingError.message);
  } catch (err) {
    console.error(
      `[flow/create] no se registró la orden pendiente ${commerceOrder} (resources=${resources.join(",")}):`,
      err
    );
  }

  const catalogEntries = resources.map((r) => getCatalogEntry(r)!);
  const subject =
    catalogEntries.length === 1
      ? catalogEntries[0].title
      : `Combo CrececonIA: ${catalogEntries.map((e) => e.title).join(" + ")}`;

  const params: Record<string, string | number> = {
    apiKey,
    commerceOrder,
    subject,
    currency: "CLP",
    amount: finalAmount,
    email,
    urlConfirmation: `${SITE_URL}/api/flow/confirm`,
    urlReturn: `${SITE_URL}/ebook/de-cero-a-claude-en-una-semana/success`,
  };

  const s = flowSign(params, secretKey);
  const formBody = new URLSearchParams(
    Object.entries({ ...params, s }).map(([k, v]) => [k, String(v)])
  ).toString();

  const flowRes = await fetch(`${getFlowBase()}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody,
  });

  if (!flowRes.ok) {
    return NextResponse.json({ error: "Error al conectar con el proveedor de pago." }, { status: 502 });
  }

  const data = await flowRes.json();
  if (!data.url || !data.token) {
    return NextResponse.json({ error: "Respuesta inesperada del proveedor de pago." }, { status: 502 });
  }

  return NextResponse.json({ redirectUrl: `${data.url}?token=${data.token}` });
}
```

**Nota sobre el test de combo real (2 libros distintos):** el caso `computeBundleTotal` con
descuento del 10%/20% ya está cubierto de forma aislada y exhaustiva en `tests/ebook-bundles.test.ts`
(Task 2) — no hace falta repetir esa matemática acá contra Supabase mockeado. El test de este
archivo se enfoca en la validación de catálogo/duplicados/código-vs-combo, que es la lógica nueva
específica de esta ruta.

- [ ] **Step 4: Correr el test, verificar que pasa**

Run: `npx vitest run tests/create.test.ts`
Expected: PASS (todos los casos)

- [ ] **Step 5: Commit**

```bash
git add app/api/flow/create/route.ts tests/create.test.ts
git commit -m "feat: /api/flow/create acepta combos de N libros"
```

---

### Task 6: `/api/flow/confirm` cumple combos

**Files:**
- Modify: `app/api/flow/confirm/route.ts`
- Modify: `tests/confirm.test.ts`

**Interfaces:**
- Consumes: `decrementCupo(resource, tier)` (Task 3), `getCatalogEntry` (Task 1),
  `redeemDiscountCode` (sin cambios).
- Produces: comportamiento sin cambios visibles para 1 libro; para combos, inserta N filas en
  `ebook_purchases` (mismo `flow_token`), decrementa N cupos, manda 1 email con N links.

- [ ] **Step 1: Actualizar el test primero**

```typescript
// tests/confirm.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";

const { mockInsert, mockResendSend, mockFrom, mockDelete } = vi.hoisted(() => ({
  mockInsert: vi.fn().mockResolvedValue({ error: null }),
  mockResendSend: vi.fn().mockResolvedValue({ id: "email-id" }),
  mockFrom: vi.fn(),
  mockDelete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function (this: Record<string, unknown>) {
    this.emails = { send: mockResendSend };
  }),
}));

vi.mock("@/lib/ebook-pricing", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/ebook-pricing")>();
  return { ...real, decrementCupo: vi.fn().mockResolvedValue(undefined) };
});

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { POST } from "@/app/api/flow/confirm/route";
import { decrementCupo } from "@/lib/ebook-pricing";

function flowWebhook(token: string | null) {
  const body = token ? `token=${token}` : "";
  return new Request("https://test.com/api/flow/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

function mockFlowStatus(status: number, amount = 10800) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ status, email: "comprador@test.com", amount, flowOrder: 12345 }),
  });
}

// existingByResource: mapa resource -> ¿ya existe una fila para este flow_token+resource?
function setupDb(options: {
  pendingResources: { resource: string; tier: string; amount: number }[] | null;
  existingByResource?: Record<string, boolean>;
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "ebook_pending_orders") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: options.pendingResources ? { resources: options.pendingResources, discount_code: null } : null,
        }),
        delete: mockDelete,
      };
    }

    // ebook_purchases: cada llamada a db.from("ebook_purchases") crea un
    // builder nuevo para UNA sola query encadenada (.select().eq().eq()
    // .maybeSingle()), así que un closure local alcanza para recordar qué
    // resource se filtró — sin necesidad de jugar con `this`.
    let queriedResource = "";
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn((field: string, value: string) => {
        if (field === "resource") queriedResource = value;
        return builder;
      }),
      maybeSingle: vi.fn(() =>
        Promise.resolve({
          data: options.existingByResource?.[queriedResource] ? { id: "existing" } : null,
        })
      ),
      insert: mockInsert,
    };
    return builder;
  });
}

describe("POST /api/flow/confirm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("responde 200 cuando no hay token en el body", async () => {
    const res = await POST(flowWebhook(null));
    expect(res.status).toBe(200);
  });

  it("responde 200 sin insertar cuando Flow retorna status != 2", async () => {
    mockFlowStatus(1);
    setupDb({ pendingResources: null });
    const res = await POST(flowWebhook("tok_pendiente"));
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("1 libro (sin pending row): reconstruye tier desde el monto — comportamiento legado", async () => {
    mockFlowStatus(2);
    setupDb({ pendingResources: null });
    const res = await POST(flowWebhook("tok_legado"));
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ resource: DEFAULT_EBOOK_RESOURCE, tier: "super-early", amount: 10800 })
    );
    expect(mockResendSend).toHaveBeenCalledOnce();
  });

  it("combo de 2 libros: inserta 2 filas, decrementa 2 cupos, manda 1 solo email", async () => {
    mockFlowStatus(2, 19440); // 2 * 10800 * 0.9
    setupDb({
      pendingResources: [
        { resource: DEFAULT_EBOOK_RESOURCE, tier: "super-early", amount: 9720 },
        { resource: "ebook:agentes-de-ia", tier: "regular", amount: 9720 },
      ],
    });

    const res = await POST(flowWebhook("tok_combo"));
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledTimes(2);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ resource: DEFAULT_EBOOK_RESOURCE, amount: 9720 })
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ resource: "ebook:agentes-de-ia", amount: 9720 })
    );
    expect(decrementCupo).toHaveBeenCalledTimes(2);
    expect(mockResendSend).toHaveBeenCalledOnce();
  });

  it("combo con 1 libro ya confirmado (retry parcial): solo inserta el que falta", async () => {
    mockFlowStatus(2, 19440);
    setupDb({
      pendingResources: [
        { resource: DEFAULT_EBOOK_RESOURCE, tier: "super-early", amount: 9720 },
        { resource: "ebook:agentes-de-ia", tier: "regular", amount: 9720 },
      ],
      existingByResource: { [DEFAULT_EBOOK_RESOURCE]: true },
    });

    const res = await POST(flowWebhook("tok_retry"));
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ resource: "ebook:agentes-de-ia" })
    );
  });

  it("no reinserta ni reenvía email si TODO el combo ya está confirmado (idempotencia total)", async () => {
    mockFlowStatus(2, 19440);
    setupDb({
      pendingResources: [{ resource: DEFAULT_EBOOK_RESOURCE, tier: "super-early", amount: 9720 }],
      existingByResource: { [DEFAULT_EBOOK_RESOURCE]: true },
    });

    const res = await POST(flowWebhook("tok_duplicado"));
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("retorna 200 aunque el envío de email falle", async () => {
    mockFlowStatus(2);
    setupDb({ pendingResources: null });
    mockResendSend.mockRejectedValueOnce(new Error("Resend timeout"));
    const res = await POST(flowWebhook("tok_email_fail"));
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("retorna 200 cuando Flow API falla", async () => {
    mockFetch.mockRejectedValue(new Error("Flow timeout"));
    const res = await POST(flowWebhook("tok_flow_down"));
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr el test, verificar que falla**

Run: `npx vitest run tests/confirm.test.ts`
Expected: FAIL — la ruta actual asume una sola fila/un solo `resource`.

- [ ] **Step 3: Implementar**

```typescript
// app/api/flow/confirm/route.ts
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { flowSign, getFlowBase } from "@/lib/flow";
import { determineTier, decrementCupo, type Tier } from "@/lib/ebook-pricing";
import { redeemDiscountCode } from "@/lib/discount-codes";
import { getCatalogEntry, DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface FlowPayment {
  status: number;
  email: string;
  amount: number;
  flowOrder: number;
  commerceOrder: string;
}

interface PendingResource {
  resource: string;
  tier: Tier;
  amount: number;
}

async function getPaymentStatus(token: string): Promise<FlowPayment | null> {
  const apiKey = process.env.FLOW_API_KEY!;
  const secretKey = process.env.FLOW_SECRET_KEY!;
  const params = { apiKey, token };
  const s = flowSign(params, secretKey);
  const url = `${getFlowBase()}/payment/getStatus?apiKey=${apiKey}&token=${token}&s=${s}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function downloadLinkHtml(resource: string, email: string, token: string): string {
  const entry = getCatalogEntry(resource);
  const title = entry?.title ?? resource;
  const downloadUrl = `${SITE_URL}/api/ebook/download?email=${encodeURIComponent(email)}&token=${token}&resource=${encodeURIComponent(resource)}`;
  return `<p style="margin:0 0 16px;"><strong style="color:#F5F5F4;">${title}</strong><br/><a href="${downloadUrl}" style="color:#D9B36A;">Descargar →</a></p>`;
}

async function sendConfirmationEmail(email: string, token: string, resources: PendingResource[]): Promise<void> {
  const redownloadUrl = `${SITE_URL}/ebook/de-cero-a-claude-en-una-semana/descargar`;
  const isBundle = resources.length > 1;
  const linksHtml = resources.map((r) => downloadLinkHtml(r.resource, email, token)).join("");

  await getResend().emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: email,
    subject: isBundle ? "Tus ebooks de CrececonIA" : "Tu ebook: De cero a Claude en una semana",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0A0A0B;color:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <p style="color:#D9B36A;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;margin:0 0 40px;">CrececonIA · Ebook</p>
    <h1 style="font-size:22px;font-weight:300;margin:0 0 16px;line-height:1.4;">¡Gracias por tu compra!</h1>
    <p style="color:#A8A29E;font-size:15px;line-height:1.7;margin:0 0 32px;">
      ${isBundle ? "Tus ebooks están listos. Hacé clic en cada uno para descargarlo." : "Tu ebook está listo. Hacé clic abajo para descargarlo."}
    </p>
    ${linksHtml}
    <p style="color:#8C8C8C;font-size:13px;line-height:1.7;margin:24px 0 40px;">Guardá este email. Si perdés el link, podés recuperarlo en <a href="${redownloadUrl}" style="color:#D9B36A;text-decoration:none;">${redownloadUrl}</a> ingresando tu email.</p>
    <hr style="border:none;border-top:1px solid #1E1E1F;margin:0 0 24px;">
    <p style="color:#8C8C8C;font-size:12px;margin:0;">CrececonIA · Strimo SPA · Santiago, Chile</p>
  </div>
</body>
</html>`,
  });
}

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);
    const token = params.get("token");

    if (!token) return new Response("OK", { status: 200 });

    const payment = await getPaymentStatus(token);
    if (!payment || payment.status !== 2) return new Response("OK", { status: 200 });

    const db = getSupabaseAdmin();
    const commerceOrder = payment.commerceOrder ?? "";

    const { data: pending } = await db
      .from("ebook_pending_orders")
      .select("resources, discount_code")
      .eq("commerce_order", commerceOrder)
      .maybeSingle();

    // Sin fila pendiente (orden previa a este cambio, o insert falló al
    // crear la orden): fallback al comportamiento legado de 1 solo libro,
    // reconstruyendo el tier desde el monto pagado.
    const resources: PendingResource[] =
      pending?.resources ?? [
        { resource: DEFAULT_EBOOK_RESOURCE, tier: determineTier(payment.amount, DEFAULT_EBOOK_RESOURCE), amount: payment.amount },
      ];
    const discountCode: string | null = pending?.discount_code ?? null;

    const fulfilled: PendingResource[] = [];

    for (const item of resources) {
      // Atajo de idempotencia (no atómico) — el índice único (flow_token,
      // resource) en el insert de abajo es la protección real.
      const { data: existing } = await db
        .from("ebook_purchases")
        .select("id")
        .eq("flow_token", token)
        .eq("resource", item.resource)
        .maybeSingle();
      if (existing) continue;

      const { error: insertError } = await db.from("ebook_purchases").insert({
        email: payment.email,
        resource: item.resource,
        amount: item.amount,
        flow_token: token,
        flow_order: payment.flowOrder,
        tier: item.tier,
        discount_code: resources.length === 1 ? discountCode : null,
      });

      if (insertError) {
        console.error(
          `[flow/confirm] no se registró la compra de ${item.resource} para el token ${token}:`,
          insertError.message
        );
        continue;
      }

      fulfilled.push(item);
    }

    if (fulfilled.length === 0) {
      // O bien todo el combo ya estaba confirmado (replay), o falló cada
      // insert — en ambos casos no hay nada nuevo que entregar.
      if (pending) await db.from("ebook_pending_orders").delete().eq("commerce_order", commerceOrder);
      return new Response("OK", { status: 200 });
    }

    try {
      await sendConfirmationEmail(payment.email, token, fulfilled);
    } catch (err) {
      console.error(`[flow/confirm] falló el email de ${payment.email}:`, err);
    }

    for (const item of fulfilled) {
      try {
        await decrementCupo(item.resource, item.tier);
      } catch (err) {
        console.error(`[flow/confirm] falló el conteo de cupo (${item.resource}/${item.tier}):`, err);
      }
    }

    if (discountCode && resources.length === 1 && fulfilled.length === 1) {
      try {
        const redeemed = await redeemDiscountCode(discountCode);
        if (!redeemed) {
          console.error(
            `[flow/confirm] el código ${discountCode} ya no era canjeable al confirmar el pago del token ${token} — se cobró con descuento de todas formas`
          );
        }
      } catch (err) {
        console.error(`[flow/confirm] falló el canje de ${discountCode}:`, err);
      }
    }

    if (pending) {
      await db.from("ebook_pending_orders").delete().eq("commerce_order", commerceOrder);
    }
  } catch (err) {
    console.error("[flow/confirm] error inesperado:", err);
  }

  return new Response("OK", { status: 200 });
}
```

**Nota:** `app/api/ebook/download/route.ts` también necesita leer `?resource=` para saber qué PDF
entregar cuando el email tiene más de un libro comprado — queda fuera de este task porque hoy
solo hay un PDF real; se deja marcado como deuda a resolver quien active el libro 2 (agregar el
`?resource=` a esa ruta es mecánico una vez exista un segundo PDF).

- [ ] **Step 4: Correr el test, verificar que pasa**

Run: `npx vitest run tests/confirm.test.ts`
Expected: PASS (todos los casos)

- [ ] **Step 5: Commit**

```bash
git add app/api/flow/confirm/route.ts tests/confirm.test.ts
git commit -m "feat: /api/flow/confirm cumple combos (N filas, 1 email)"
```

---

### Task 7: Selector de combo en `EbookPricing.tsx`

**Files:**
- Modify: `components/EbookPricing.tsx`

**Interfaces:**
- Consumes: `getActiveCatalogEntries()`, `DEFAULT_EBOOK_RESOURCE` (Task 1), `computeBundleTotal`
  (Task 2, usado client-side solo para mostrar el total en vivo — el servidor recalcula todo en
  `/api/flow/create`, nunca confía en este cálculo del cliente).
- Produces: el submit manda `resources: string[]` en vez de nada; sin cambios visibles hoy
  porque `getActiveCatalogEntries()` solo devuelve 1 libro.

- [ ] **Step 1: Cambios de estado y datos (sin test de componente — este repo no tiene tests de
  React, solo de rutas API; la cobertura de la lógica de combo ya está en
  `tests/ebook-bundles.test.ts` y `tests/create.test.ts`)**

Agregar al principio del componente:

```typescript
import { getActiveCatalogEntries, DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";
import { computeBundleTotal } from "@/lib/ebook-bundles";

// Los demás libros activos del catálogo, excluyendo el que ya se está
// vendiendo en esta página. Hoy siempre es un array vacío — no hay
// checkboxes hasta que se active un segundo libro.
const OTHER_ACTIVE_EBOOKS = getActiveCatalogEntries().filter((e) => e.resource !== DEFAULT_EBOOK_RESOURCE);
```

Agregar estado:

```typescript
const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
```

Reemplazar el cálculo de `displayPrice`/`hasDiscount` por uno que arme el bundle en vivo:

```typescript
const selectedResources = [DEFAULT_EBOOK_RESOURCE, ...selectedExtras];
const isCombo = selectedExtras.length > 0;

const bundlePreview = isCombo
  ? computeBundleTotal(
      selectedResources.map((r) => ({
        resource: r,
        price: r === DEFAULT_EBOOK_RESOURCE ? basePrice : OTHER_ACTIVE_EBOOKS.find((e) => e.resource === r)!.tierPrices.regular,
      }))
    )
  : null;

const displayPrice = isCombo ? bundlePreview!.total : appliedDiscount?.finalPrice ?? basePrice;
```

- [ ] **Step 2: Checkboxes de combo (solo si hay otros libros activos)**

Insertar antes del bloque de código de descuento, dentro del `<form>`:

```tsx
{OTHER_ACTIVE_EBOOKS.length > 0 && (
  <div style={{ marginBottom: 18 }}>
    <p
      style={{
        color: "#4e4d4d",
        fontSize: "0.75rem",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.08em",
        marginBottom: 8,
      }}
    >
      Sumá otros ebooks y ahorrá más
    </p>
    {OTHER_ACTIVE_EBOOKS.map((entry) => (
      <label
        key={entry.resource}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "0.85rem",
          fontFamily: "var(--font-mono)",
          color: "#242424",
          marginBottom: 6,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={selectedExtras.includes(entry.resource)}
          onChange={(e) => {
            setSelectedExtras((prev) =>
              e.target.checked ? [...prev, entry.resource] : prev.filter((r) => r !== entry.resource)
            );
            setAppliedDiscount(null); // combo y código no se combinan
          }}
        />
        {entry.title} — {selectedExtras.length + 1 >= 2 ? `${selectedExtras.includes(entry.resource) ? "10-20" : ""}` : ""}
      </label>
    ))}
    {isCombo && (
      <p style={{ color: "#2e7d32", fontSize: "0.75rem", fontFamily: "var(--font-mono)", marginTop: 6 }}>
        {bundlePreview!.discountPercent}% de descuento por combo aplicado ✓
      </p>
    )}
  </div>
)}
```

- [ ] **Step 3: Ocultar el campo de código de descuento cuando hay combo, y mandar `resources` en
  el submit**

```typescript
// donde hoy dice {!appliedDiscount && ( ... campo de código ... )}
{!appliedDiscount && !isCombo && (
  /* ...bloque existente sin cambios... */
)}
```

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!email) return;
  setStatus("loading");
  setErrorMsg("");

  const res = await fetch("/api/flow/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      resources: selectedResources,
      discountCode: isCombo ? undefined : appliedDiscount?.code,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    setErrorMsg(data.error ?? "Error al procesar el pago. Intentá nuevamente.");
    setStatus("error");
    return;
  }
  window.location.href = data.redirectUrl;
}
```

Y actualizar el fetch de `/api/ebook/cupos` para pasar el resource explícito:

```typescript
fetch(`/api/ebook/cupos?resource=${DEFAULT_EBOOK_RESOURCE}`)
```

- [ ] **Step 4: Verificar manualmente (no hay test de componente en este repo)**

Run: `npm run build` — confirma que compila. Con `OTHER_ACTIVE_EBOOKS` vacío hoy, el bloque de
checkboxes ni se renderiza — visualmente la página queda idéntica a como está hoy. Verificar esto
en el preview del PR (Task 10) igual que se hizo con la feature de waitlist.

- [ ] **Step 5: Commit**

```bash
git add components/EbookPricing.tsx
git commit -m "feat: selector de combo en EbookPricing (inactivo hasta activar libro 2)"
```

---

### Task 8: Admin dashboard desglosado por libro

**Files:**
- Modify: `app/admin/ebook/page.tsx:19-37` (query + cálculo de KPIs)

**Interfaces:**
- Consumes: `EBOOK_CATALOG` (Task 1) para mostrar el título del libro en vez del `resource` crudo.
- Produces: la tabla de compras gana una columna "Libro"; las KPIs de tramos (`porTier`) se
  calculan igual que hoy (suman across todos los libros) — no hace falta desglosarlas por libro
  todavía porque solo hay 1 libro activo, pero la columna nueva deja la data visible ebook a ebook
  para cuando haya más.

- [ ] **Step 1: Modificar el query y el cálculo**

```typescript
const [{ data: purchases }, { data: cupos }] = await Promise.all([
  db
    .from("ebook_purchases")
    .select("id, email, amount, tier, resource, purchased_at, download_count")
    .order("purchased_at", { ascending: false }),
  db.from("ebook_cupos").select("*"),
]);
```

Agregar helper de título:

```typescript
import { getCatalogEntry } from "@/lib/ebook-catalog";
// ...
const titleFor = (resource: string) => getCatalogEntry(resource)?.title ?? resource;
```

- [ ] **Step 2: Agregar la columna "Libro" a la tabla**

```tsx
{["Email", "Libro", "Monto", "Tier", "Descargas", "Fecha"].map((h) => (
  /* ...igual que hoy... */
))}
```

```tsx
<td style={{ padding: "10px 12px", color: "var(--bone)" }}>{p.email}</td>
<td style={{ padding: "10px 12px", color: "var(--smoke)", fontSize: 12 }}>{titleFor(p.resource)}</td>
```

- [ ] **Step 3: Verificar manualmente**

Run: `npm run build`. Con datos reales (todas las filas existentes migradas a
`resource = DEFAULT_EBOOK_RESOURCE`), la columna nueva muestra "De cero a Claude en una semana"
en todas las filas — sin cambios en el resto del dashboard.

- [ ] **Step 4: Commit**

```bash
git add app/admin/ebook/page.tsx
git commit -m "feat: dashboard admin desglosa compras por libro"
```

---

### Task 9: SQL de migración (entrega, no se aplica desde el repo)

**Files:**
- Create: `docs/superpowers/plans/2026-07-28-ebook-bundles-sql-migration.sql` (documentación del
  SQL a correr a mano en el dashboard de Supabase — este repo no versiona migraciones, ver
  AGENTS.md)

- [ ] **Step 1: Escribir el SQL completo**

```sql
-- 1. Columna resource en las 2 tablas existentes (instantáneo, backfill automático).
alter table ebook_purchases
  add column if not exists resource text not null default 'ebook:de-cero-a-claude-en-una-semana';

alter table ebook_cupos
  add column if not exists resource text not null default 'ebook:de-cero-a-claude-en-una-semana';

-- 2. Reemplazar el único sobre flow_token por uno compuesto (flow_token, resource),
--    para permitir varias filas por orden combo. AJUSTAR el nombre del constraint
--    si no es el default de Postgres/Supabase (<tabla>_<columna>_key) — confirmar
--    en el dashboard antes de correr este DROP.
alter table ebook_purchases drop constraint if exists ebook_purchases_flow_token_key;
create unique index if not exists ebook_purchases_flow_token_resource_key
  on ebook_purchases (flow_token, resource);

-- 3. Cupos ahora se identifican por (resource, tier), no solo por tier.
alter table ebook_cupos drop constraint if exists ebook_cupos_tier_key;
create unique index if not exists ebook_cupos_resource_tier_key
  on ebook_cupos (resource, tier);

-- 4. Función RPC de incremento de cupo, actualizada para recibir resource.
create or replace function increment_cupo_used(p_resource text, p_tier text)
returns void as $$
  update ebook_cupos
  set used = used + 1
  where resource = p_resource and tier = p_tier;
$$ language sql;

-- 5. ebook_pending_orders: nueva columna para el detalle del combo.
alter table ebook_pending_orders
  add column if not exists resources jsonb;
```

- [ ] **Step 2: Confirmar en el dashboard de Supabase los nombres reales de los constraints
  únicos existentes antes de correr los DROP** (paso manual del usuario, no de este repo — el
  código de la Task 6 funciona igual sin importar el nombre exacto, solo importa que el índice
  compuesto termine existiendo).

- [ ] **Step 3: Commit del archivo SQL (documentación, no ejecuta nada)**

```bash
git add docs/superpowers/plans/2026-07-28-ebook-bundles-sql-migration.sql
git commit -m "docs: SQL de migración para el motor de bundles (correr a mano en Supabase)"
```

---

### Task 10: Verificación final y PR

- [ ] **Step 1: Suite completa**

Run: `npm test`
Expected: todos los tests pasan — los de antes de este trabajo (pricing, create, confirm,
download, discount-codes) sin modificar su comportamiento, más los nuevos (ebook-catalog,
ebook-bundles, cupos) y los extendidos (pricing, create, confirm).

- [ ] **Step 2: Build de producción**

Run: `npm run build`
Expected: compila sin errores de TypeScript.

- [ ] **Step 3: Revisión de código (inline si los agentes de background fallan por límite de
  gasto, como pasó en el trabajo anterior de esta rama — no reintentar indefinidamente)**

- [ ] **Step 4: Verificar en preview que el camino de 1 solo libro sigue funcionando de punta a
  punta** (abrir `/ebook/de-cero-a-claude-en-una-semana`, confirmar que el bloque de precio se ve
  igual que en producción hoy, sin checkboxes de combo visibles).

- [ ] **Step 5: Push + PR**

```bash
git push -u origin feat/ebook-bundles-engine
gh pr create --title "feat: motor de bundles/combo entre ebooks (10%/20% descuento)" --body "..."
```

Incluir en el body del PR: resumen del cambio, el SQL de la Task 9 completo para que el usuario lo
corra en Supabase antes de que el combo real pueda activarse, y una nota explícita de que ningún
libro nuevo queda `active` — este PR no cambia nada visible en producción hasta que se decida
lanzar el libro 2.
