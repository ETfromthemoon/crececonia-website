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
npm run dev      # local dev (Turbopack)
npm run build    # production build (also typechecks)
npm test         # vitest run — unit/integration tests
npm run test:watch
vercel --prod    # manual deploy; NOT normally needed (see Deploy below)
```

There is no `lint` or `typecheck` script — `npm run build` typechecks.

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
- **Supabase** (env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Tables used by the ebook system: `ebook_purchases`, `ebook_cupos`, `discount_codes` (no migration files in this repo — schema is managed directly in the Supabase dashboard; see PR descriptions for the SQL that created each table).
- **Resend** for transactional email (`RESEND_API_KEY`).
- **Flow** (Chilean payment gateway, `FLOW_API_KEY`/`FLOW_SECRET_KEY`/`FLOW_SANDBOX`) powers ebook checkout — `lib/flow.ts` + `app/api/flow/create` (creates the order) + `app/api/flow/confirm` (webhook, inserts into `ebook_purchases`, redeems discount codes, sends the download email).
- **Discount codes** (`lib/discount-codes.ts`): generated from `/admin/descuentos`, single-use by default, validated at `/api/ebook/discount/validate` before checkout and redeemed only after Flow confirms payment (never at checkout-creation, to avoid burning codes on abandoned carts). The applied code travels inside Flow's `commerceOrder` string (suffix after `_disc_`) rather than a separate pending-orders table.

### Admin auth pattern

Every `/admin/*` page follows the same gate: compare a `?key=` query param against `process.env.ADMIN_SECRET`, `notFound()` on mismatch (see `app/admin/ebook/page.tsx`, `app/admin/descuentos/page.tsx`). API routes under `/api/admin/*` accept the same secret via an `x-admin-key` header or `?key=` query param. There is no session/cookie auth — it's a single shared secret, intentionally simple for a single-admin site.

### Env setup

Copy `.env.local.example` → `.env.local`. Vars needed: Supabase (3), Resend (1), Admin secret (1), Flow (3: `FLOW_API_KEY`, `FLOW_SECRET_KEY`, `FLOW_SANDBOX`).

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
