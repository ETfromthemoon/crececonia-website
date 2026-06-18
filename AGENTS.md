<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project at a glance

- **Next.js 16.2.3** App Router + Turbopack. TypeScript strict. Tailwind CSS v4 via `@tailwindcss/postcss`.
- **Site**: crececonia.cl — consulting landing page for mid-sized companies. Chilean Spanish copy.
- **Deploy**: Vercel via CLI (`vercel --prod`). Region `gru1` (São Paulo). Aliased to `www.crececonia.cl`.
- **No tests, no linter, no formatter config.** TypeScript is the only gate.

## Commands

```bash
npm run dev      # local dev (Turbopack)
npm run build    # production build
vercel --prod    # deploy to production (aliases to www.crececonia.cl)
```

There is no `lint`, `typecheck`, or `test` script. Run `npm run build` to typecheck + verify.

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
- **Supabase** (env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Resend** for transactional email (`RESEND_API_KEY`).

### Env setup

Copy `.env.local.example` → `.env.local`. Four vars needed: Supabase (3) + Resend (1) + Admin secret.

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
