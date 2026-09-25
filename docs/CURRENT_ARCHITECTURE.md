# Current Architecture Audit — 2026-08-19

## Stack and deployment

- React 19, TypeScript, React Router 7, Vite 6, Tailwind 4.
- npm is the package manager. `npm run lint` is TypeScript no-emit checking; Playwright supplies smoke tests; Vite produces the production client build.
- The public application is a client-rendered SPA. Netlify and Vercel both provide SPA fallbacks and serve the static `public/sitemap.xml` directly (Vercel rewrites exclude `sitemap.xml`; Netlify serves static files before the SPA fallback).
- Server-side API endpoints are present for chat, explain, and health only; there is no sitemap API handler. The repository includes environment files; they were not opened and must not be committed or copied.

## Route inventory

- Home: `/`
- Categories: `/concrete`, `/structural`, `/surveying`, `/geotechnical`, `/utilities`, `/bbs`
- Calculators: concrete volume/rebar/brick; beam/column/slab/steel weight; height of instrument/traverse; bearing capacity/retaining wall; unit converter.
- BBS: fourteen explicit structure routes plus `/bbs/:structureType` compatibility route.
- Other product routes: `/boq-builder`, `/construction`, `/dashboard`.
- Legal: `/about`, `/contact`, `/privacy`, `/terms`, `/disclaimer`.
- Existing client redirects cover several historical calculator slugs.

## Calculation inventory and preservation

- Formula implementations live in page components, `src/utils/calcEngine.ts`, and `src/UniversalBBSCalculator/engine` and `modules`.
- Detailed article datasets map to calculator and BBS ids in `src/data/articles` and are rendered by `ArticleSection`.
- No calculation formula or standard-coefficient implementation is changed by this SEO upgrade.

## Existing SEO and content

- `src/utils/seo.tsx` provides Helmet metadata, canonical URLs, Open Graph/Twitter tags, FAQ, breadcrumb, Organization, WebSite, and WebApplication schema helpers.
- Calculator/category/BBS/static pages already use the shared head component; calculator pages use shared breadcrumbs and long-form article sections.
- `public/robots.txt` uses the canonical host, excludes `/dashboard`, and points to `https://civilmath.com/sitemap.xml`. `public/sitemap.xml` is the single source of truth (47 indexable URLs); no client sitemap generator or sitemap API handler remains.
- Code splitting is already used for calculator routes.

## Risks and technical debt

- Generic FAQ/content, calculator PDF exports, and AI prompts previously made broad code-compliance claims that are not justified globally. The pre-production hardening pass reframed rendered/exported content and prompts as educational/preliminary references; standards appear only as named references. Review any future copy against the same rule.
- Crawlers that do not execute JavaScript receive only the SPA shell. This upgrade improves metadata/content architecture but does not migrate rendering; prerendering should be evaluated separately with deployment testing.
- Sitemap maintenance: keep `public/sitemap.xml` in sync with `src/utils/seo.tsx` route registries whenever indexable routes change.
- Guide, formula, reference-table, terms, disclaimer, and 404 routes are in place (see `src/App.tsx`, `src/components/StaticPage.tsx`).

## Implementation status

1. ✅ Typed public route/SEO registry and canonical/robots behavior (`src/utils/seo.tsx`, `public/robots.txt`).
2. ✅ Reusable breadcrumbs, related-content cards, conservative disclaimer, guide/formula/table templates and routes.
3. ✅ Single static sitemap source (`public/sitemap.xml`) served on both deployments; duplicate generators/handlers removed.
4. ✅ Accessible navigation, calculator supporting content, legal pages, and 404 recovery.
5. ✅ SEO route validation tests (Playwright smoke), TypeScript checks, and production builds.
