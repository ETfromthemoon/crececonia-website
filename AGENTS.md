<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project at a glance

- **Next.js 16.2.3** App Router + Turbopack. TypeScript strict. Tailwind CSS v4 via `@tailwindcss/postcss`.
- **Site**: crececonia.cl — consulting landing page for mid-sized companies. Chilean Spanish copy.
- **Deploy**: Vercel git integration — pushing to `main` deploys to production automatically, and every PR gets a preview deployment (protected by Vercel Authentication, so preview URLs need a Vercel login). `vercel --prod` exists as a manual escape hatch but is not the normal path. Region `gru1` (São Paulo). Aliased to `www.crececonia.cl`.
- **No linter, no formatter config.** TypeScript + the vitest suite are the gates.

## Commands

```bash
npm run build    # production build (also typechecks)
npm test         # vitest run — unit/integration tests
```

There is no `lint` or `typecheck` script — `npm run build` typechecks.
Visual review is done exclusively through the GitHub pull request's Vercel
Preview Deployment. Do not start a local page server or use localhost URLs as
a visual deliverable.

**There IS a test suite** (`tests/`, vitest): `pricing`, `create`, `confirm`, `download`, `discount-codes`. It covers the ebook payment path — pricing tiers, Flow order creation, the Flow confirmation webhook, discount-code validation/redemption, and gated downloads. **Run `npm test` after touching anything under `lib/ebook-*`, `lib/discount-codes.ts`, `app/api/flow/*`, or `app/api/ebook/*`** — these mock Supabase and Flow, so a change to how those are called (e.g. swapping a `.from().update()` for an `.rpc()`) breaks the tests even when the build passes.

## Architecture

### Routing (App Router)

```
/                        → app/page.tsx (landing page — Hero → Sections → Footer)
/protocolo-bpi            → app/protocolo-bpi/page.tsx
/solicitar-llamada        → app/solicitar-llamada/page.tsx (token-gated calendar)
/centro                   → app/centro/page.tsx (knowledge hub)
/centro/[tema]            → app/centro/[tema]/page.tsx (dynamic: guias | skills)
/centro/guias, /centro/skills → sub-route pages
/guias/[slug]             → app/guias/[slug]/page.tsx
/skills/[slug]            → app/skills/[slug]/page.tsx
/guias, /skills           → 308 redirects to /centro/guias, /centro/skills
/ebooks                   → app/ebooks/page.tsx (catálogo — cards por ebook)
/ebooks/agentes-de-ia     → app/ebooks/agentes-de-ia/page.tsx ("Próximamente", sin checkout)
/ebook/de-cero-a-claude-en-una-semana → app/ebook/de-cero-a-claude-en-una-semana/page.tsx (venta real, Flow)
  .../success             → página de retorno post-pago (Flow urlReturn)
  .../descargar           → recuperar link de descarga por email
/admin/ebook?key=…        → app/admin/ebook/page.tsx (dashboard ventas, gated por ADMIN_SECRET)
/admin/descuentos?key=…   → app/admin/descuentos/page.tsx (generar códigos de descuento, gated por ADMIN_SECRET)
```

### Component map (landing page)

`app/page.tsx` assembles these in order:
`Navbar → Hero → ProblemBar → HowItWorks → AntiPositioning → SocialProof → UseCases → Services → FAQ → FinalCTA → Footer`

Key patterns:
- **Every component is `"use client"`** (framer-motion animations throughout).
- **WAButton** (`components/GradientButton.tsx`) is the universal CTA. It opens `EvaluacionModal` via React context (`EvaluacionProvider`). Takes a `source` prop for tracking (e.g., `"hero-primary"`).
- **EvaluacionProvider** wraps the root layout. Any component can call `useEvaluacion().abrir(source)` to open the CTA modal.
- **Hash-based sections**: Navbar links to `/#manifiesto`, `/#proceso`, etc. Components must set `id` attributes.

### Styling

- **Tailwind v4** with `@theme inline` in `globals.css`.
- **Obsidian palette**: CSS custom properties (`--obsidian`, `--champagne`, `--bone`, `--ash`, etc.) + semantic tokens (`--bg`, `--ink`, `--accent`, `--muted`, `--border`).
- **Fluid type**: `html { font-size: clamp(14px, calc(0.625rem + 0.42vw), 18px) }`.
- **Custom classes** used across components: `.eyebrow`, `.gradient-text`, `.btn-evaluacion`, `.btn-lg`, `.btn-ghost`, `.dot-pattern`, `.orb-animate`. These are defined in `globals.css`.
- **Mobile iOS fix**: inputs get `font-size: 16px` at `max-width: 640px` (prevents Safari zoom-on-focus).

### Fonts

Loaded via `next/font/google` in `app/layout.tsx`:
- `Inter` → `--font-sans`
- `Fraunces` → `--font-display`
- `JetBrains Mono` → `--font-mono`

### Backend

- **External API**: `https://autodrive.cl/api/public/...` (not in this repo). Handles: skill views, skill downloads, call scheduling, email sending.
- **Supabase** (env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — there is no anon key in this project, every access is server-side with the service role key). Tables used by the ebook system: `ebook_purchases`, `ebook_cupos`, `discount_codes`, `ebook_pending_orders`, `ebook_waitlist` (no migration files in this repo — schema is managed directly in the Supabase dashboard; SQL lives in `docs/superpowers/plans/*.sql` and PR descriptions). Both `ebook_purchases` and `ebook_cupos` carry a `resource` column (multi-book bundle engine, see `lib/ebook-catalog.ts`) — every book, including future ones, shares this schema. `ebook_waitlist` (email, resource, source, created_at) captures "notify me" signups from coming-soon book pages — see the runbook below for how to notify them when a book launches.
- **Resend** for transactional email (`RESEND_API_KEY`).
- **Flow** (Chilean payment gateway, `FLOW_API_KEY`/`FLOW_SECRET_KEY`/`FLOW_SANDBOX`) powers ebook checkout — `lib/flow.ts` + `app/api/flow/create` (creates the order) + `app/api/flow/confirm` (webhook, inserts into `ebook_purchases`, redeems discount codes, sends the download email).
- **Discount codes** (`lib/discount-codes.ts`): generated from `/admin/descuentos`, single-use by default, validated at `/api/ebook/discount/validate` before checkout and redeemed only after Flow confirms payment (never at checkout-creation, to avoid burning codes on abandoned carts). The applied code travels inside Flow's `commerceOrder` string (suffix after `_disc_`) rather than a separate pending-orders table.

### Admin auth pattern

Every `/admin/*` page follows the same gate: compare a `?key=` query param against `process.env.ADMIN_SECRET`, `notFound()` on mismatch (see `app/admin/ebook/page.tsx`, `app/admin/descuentos/page.tsx`). API routes under `/api/admin/*` accept the same secret via an `x-admin-key` header or `?key=` query param. There is no session/cookie auth — it's a single shared secret, intentionally simple for a single-admin site.

### Env setup

Copy `.env.local.example` → `.env.local`. Vars needed: Supabase (3), Resend (1), Admin secret (1), Flow (3: `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_SANDBOX`).

## Runbook: activar un ebook nuevo (agente)

Cuando el usuario pida "activar [nombre del libro]" / "lanzar el libro de X" / "poner a la venta [libro]",
seguir estos pasos en orden. No hace falta preguntar el enfoque — es mecánico.

1. **Confirmar con el usuario, antes de tocar nada**: precio de cada tramo (super-early/early/regular en
   CLP) y cuántos cupos super-early/early quiere ofrecer. Esto es una decisión de negocio, no técnica —
   no inventar números.
2. **`lib/ebook-catalog.ts`**: cambiar la entrada del libro de `active: false` a `active: true` y agregarle
   `tierPrices: { superEarly, early, regular }` con los valores confirmados, más `coverSrc` (portada en
   `public/ebooks/{slug}.jpg`, ratio 1:1.6). Es un discriminated union — TypeScript exige `tierPrices` y
   `coverSrc` apenas se pone `active: true`, así que el build falla si falta alguno.
   - Si el lanzamiento tiene que activarse solo a una hora exacta (ej. un evento en vivo), agregar
     `visibleFrom: "YYYY-MM-DDTHH:mm:ss±HH:mm"` (instante ISO con offset explícito — nunca una hora sin
     zona horaria). `isCatalogEntryLive()` lo resuelve en runtime contra el reloj real del servidor, así
     que la página, `/api/flow/create` y `/api/ebook/cupos` se abren solos sin necesidad de un deploy
     nuevo a esa hora. Cualquier página o endpoint que dependa de esto DEBE forzar
     `export const dynamic = "force-dynamic"` — si Next lo pre-renderiza en build time, la hora de
     activación queda congelada para siempre en el HTML generado.
3. **Supabase — cupos**: insertar las filas de `ebook_cupos` para ese `resource` (una fila por tier que
   se quiera ofrecer — no hace falta `super-early` si el libro arranca directo en `early`, ver el libro 3
   del lanzamiento de 2026-08-07 como ejemplo). `total` = cupos acordados, `used = 0`. El `resource` debe
   ser exactamente el string del catálogo (ej. `ebook:agentes-de-ia`).
   ⚠️ La primary key de `ebook_cupos` es `(resource, tier)` — si un insert falla con
   `duplicate key value violates unique constraint "ebook_cupos_pkey"` al usar un `resource` nuevo, la PK
   de la tabla se corrompió a solo `tier` (pasó una vez, en el lanzamiento de 2026-08-07). Arreglo:
   `alter table ebook_cupos drop constraint ebook_cupos_pkey; alter table ebook_cupos add primary key (resource, tier);`
   — no borra filas existentes, solo corrige la clave.
4. **El PDF del libro**: dejar los archivos en `private/{slug}-{format}.pdf` (`movil` y `a4`, donde `slug`
   es el resource sin el prefijo `ebook:`) y **subirlos a Supabase Storage con `npm run ebook:subir-pdfs`**.
   `/api/ebook/download` los sirve desde el bucket privado `ebooks`, NO desde el disco del servidor.
   El propio comando verifica al final que todo libro activo quede descargable y falla si falta algo.

   ⚠️ No alcanza con dejarlos en `private/`: esa carpeta está en `.gitignore` (este repo es **público** y el
   libro es un producto pago), así que los deploys por integración de Git —el camino normal— se construyen
   desde el repositorio y nunca incluyen los PDFs. Eso ya causó que compradores reales recibieran 503
   "se está preparando" pese a haber pagado. El `.vercelignore` que intentaba incluirlos solo aplica a
   subidas por CLI (`vercel --prod`), no a los deploys por git. Sin el archivo en Storage, nadie puede
   descargar.
5. **Página de venta real**: los libros "coming-soon" hoy renderizan `EbookComingSoon` (solo waitlist, sin
   precio). Activar el libro en el catálogo **no crea automáticamente una página de venta** — hay que
   construir `app/ebook/{slug}/page.tsx` siguiendo el patrón de los libros 2-4 (`claude-nivel-experto`,
   `agentes-de-ia`, `creacion-de-webs-con-ia`): un componente `EbookGenericHero` + `EbookGenericTOC` +
   `EbookGenericFAQ` (genéricos, parametrizables, en `components/`) más `EbookPricing` (que ya funciona
   para cualquier `resource`) y un bloque de copy "para quién / quién no" propio del libro. Si el libro
   tiene `visibleFrom`, la página debe chequear `isCatalogEntryLive(entry)` al principio y renderizar
   `EbookComingSoon` mientras no llegue esa hora — ver cualquiera de esos 3 archivos como plantilla exacta.
   Si por ahora alcanza con venderlo solo como parte de un combo desde la página del libro 1, este paso se
   puede saltar (el checkbox de combo en `EbookPricing` lo ofrece solo con tenerlo `active` y vivo).
6. **Cross-sell** (`lib/ebook-crossell.ts`): agregar el libro nuevo como key en `CROSS_SELL_GRAPH` con la
   lista de libros que tiene sentido sugerirle a quien lo compra, en orden de prioridad. Si el libro no
   se agrega ahí, cae al fallback genérico (`SIN_HISTORIAL` + el resto de libros vivos) — funciona, pero
   no respeta ninguna lógica de "quién debería ver qué". Cualquier libro que no deba ofrecerse a un
   visitante sin señales de experiencia previa (como pasa con "Claude a Nivel Experto") debe agregarse
   también a `REQUIERE_SENAL_DE_EXPERIENCIA` en ese mismo archivo — ese set se aplica incluso en el
   fallback, no solo en las listas explícitas.
7. **Bundles nombrados** (`lib/ebook-bundles.ts`, `EBOOK_BUNDLES`): si el libro nuevo debería ofrecerse en
   algún combo con nombre y pitch propios (a diferencia del combo libre por checkboxes), agregar una
   entrada con `slug`, `title`, `pitch` y `resources` (el primer resource de la lista es el "libro ancla":
   su página es donde se compra el bundle, vía `?bundle=slug` que preselecciona el resto). El precio del
   bundle no se fija a mano — se calcula solo con `computeBundleTotal` sobre el precio vigente de cada
   libro, aplicando `BUNDLE_DISCOUNT_RULES` (hoy: 2 libros=10%, 3=15%, 4=20%). Un bundle solo aparece en
   `/ebooks` cuando TODOS sus libros ya están vivos (respeta `visibleFrom` de cada uno).
8. **`npm test && npm run build`**: confirmar que el build sigue verde (el catálogo generaliza tipos, un
   error de `tierPrices` o `coverSrc` faltante se detecta acá).
9. **Avisar a la waitlist** (`ebook_waitlist`, ver tabla en el punto de Backend abajo) — esto es manual
   hoy, no hay automatización. Exportar los interesados en ESE libro:
   ```sql
   select email from ebook_waitlist where resource = 'ebook:agentes-de-ia' order by created_at;
   ```
   y mandarles el aviso de lanzamiento a mano desde Resend (Broadcasts) o el proveedor de email que se use
   en ese momento. No enviar el email de lanzamiento como parte de este runbook automáticamente — es una
   decisión de timing del usuario, no del agente.
10. **Deploy**: commit + push a una rama, PR, y el mismo flujo de siempre (ver "Deploy" arriba) — el merge
    a `main` es responsabilidad del usuario, confirmarlo explícitamente antes de mergear.

## Entregabilidad del ebook: cómo verificarla y repararla

Tres comandos, todos de solo lectura por defecto:

```bash
npm run ebook:verificar   # ¿todo libro a la venta tiene sus PDFs en Storage? (solo lectura)
npm run flow:contract     # ¿Flow sigue devolviendo los campos que necesita el webhook?
npm run ebook:recuperar   # ¿hay pagos cobrados que no se entregaron? (dry-run)
npm run ebook:subir-pdfs  # sube/actualiza los PDFs en Storage y después verifica
```

Los cuatro cargan `.env.local` solos (`--env-file-if-exists`), así que corren sin exportar nada a
mano; en CI, donde ese archivo no existe, las variables siguen viniendo de los secrets.

`ebook:verificar` es la barrera contra la falla más cara del sistema: poner un libro a la venta es
solo cambiar `active: true` en `lib/ebook-catalog.ts`, y nada obligaba a que sus PDFs estuvieran
subidos. **Corrélo después de activar un libro y antes de mandar tráfico**: si falta un formato,
falla con el nombre exacto del archivo que hay que subir. `ebook:subir-pdfs` termina corriendo esta
misma verificación, así que subir y verificar es un solo paso.

`npm run ebook:recuperar -- --aplicar` inserta las compras faltantes; agregando `--enviar-email` también le
manda el link de descarga y una disculpa al comprador. Sin esos flags no escribe ni envía nada.

Contexto: hubo dos fallas que dejaron compradores sin su libro pese a haber pagado, y **ninguna de las dos
la detectaron los tests** porque los mocks replicaban la suposición equivocada del código:

1. `/api/flow/confirm` leía `payment.email`, pero Flow entrega el correo en `payment.payer`. El mock de los
   tests simulaba `email`. Por eso ahora los tests construyen la respuesta de Flow desde un fixture
   capturado de producción (`tests/fixtures/flow-getstatus.ts`) y existe `npm run flow:contract` para
   detectar si Flow cambia su contrato.
2. El PDF se leía del disco (`/private`), que no llega a los deploys por git. El mock de `fs` devolvía
   siempre `true`. Ahora se sirve desde Supabase Storage y el test verifica que se baje del bucket.

## Reporte de analytics de PostHog

La implementación vigente amplía el reporte al ecosistema completo: pageviews,
secciones, scroll, CTA, evaluación, chat, newsletter, skills, ebooks,
llamadas y formularios. También expone `GET /api/analytics/report?days=7`
protegido por `ANALYTICS_REPORT_SECRET` (fallback `ADMIN_SECRET`) o
`CRON_SECRET`; `npm run posthog:report -- 7 --json` sirve como acceso local de
máquina.

`npm run posthog:report -- [dias]` (default 7) imprime un resumen del funnel de venta de ebooks
(`lib/posthog-analytics.ts` + `lib/posthog-report-format.ts`): conteos por etapa, tasa de combo, y
comparación de conversión por `pricing_variant` cuando hay volumen suficiente (mínimo 30 vistas por
variante y diferencia ≥20% relativo — si no se cumple, el reporte lo dice explícitamente en vez de
sacar conclusiones prematuras).

Requiere `POSTHOG_PERSONAL_API_KEY` (Personal API Key de PostHog con scope de lectura, generada en
Account → Personal API keys — distinta del project token `phc_...` usado para capturar eventos, que
es solo de escritura).

Corre solo cada semana vía `.github/workflows/posthog-weekly-report.yml` (GitHub Actions, cron nativo
de la plataforma — la key vive en el secret encriptado del repo `POSTHOG_PERSONAL_API_KEY`, nunca en
texto plano). El workflow abre un issue con el resumen; si el reporte marca "señal accionable" en la
comparación de variantes, el título del issue lo distingue. Convertir esa señal en un cambio real de
copy/precio sigue siendo una decisión manual del usuario — nunca se genera un PR automáticamente.

## Conventions

- **Language**: All copy in Spanish (Chilean). Title/meta in `app/layout.tsx` sets OG/Twitter/JSON-LD.
- **Import alias**: `@/` → project root (configured in `tsconfig.json` paths).
- **Component naming**: Components are imported with names that differ from filenames in `page.tsx` (e.g., `import Hero from "@/components/Hero"` but file is `Hero.tsx`). Aliases in page.tsx: `Beliefs = ProblemBar`, `BPIProtocol = HowItWorks`, `SergioStory = UseCases`, `Investment = Services`.
- **"use client"**: Needed for framer-motion, React hooks, browser APIs. Server components are rare in this project.
- **Favicon**: SVG at `app/icon.svg` (champagne gradient monogram). ICO fallback at `app/favicon.ico`. Both referenced in metadata `icons`.
- **Popups**: `SuscriptorPopup` (email capture), `ChatWidget` (floating CTA), `EvaluacionModal` (main CTA form). All client-side.

## Gotchas

- `WAButton` was originally WhatsApp but now opens the AI evaluation modal. The name is kept to avoid breaking imports across 15+ components.
- No `public/og-image.png` exists despite being referenced in metadata. OG image will 404.
- `.vercel/` is gitignored. Project ID lives in `.vercel/project.json` (local only).
- `skills-lock.json` and `.agents/` are from `npx skills` tooling. Do not commit them.
- Dynamic routes (`[tema]`, `[slug]`) fetch from autodrive.cl API at runtime; no static generation.
- Desktop-only navbar (no mobile hamburger visibility toggle for non-logged-in — `mobileMenuOpen` state exists but only activates on scroll detection).
