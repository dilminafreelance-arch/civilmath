# SEO Audit — 2026-08-19

## Implemented

- Shared Helmet metadata provides title, description, canonical, Open Graph, Twitter, breadcrumb and JSON-LD support; canonical overrides and noindex support were added.
- Indexable guides, formula and reference-table routes now have unique titles, descriptions, H1s, visible breadcrumbs and contextual links to calculators.
- Calculator pages keep shared FAQ/breadcrumb/WebApplication schema and now use a preliminary-calculation disclaimer instead of unverified blanket claims.
- `robots.txt` now uses the canonical host, excludes `/dashboard`, and points to the sitemap.
- One static sitemap source includes public canonical routes and excludes the dashboard; the duplicate client generator and Vercel sitemap handler were removed.
- Terms, engineering disclaimer and a recovery-oriented 404 route were added.

## Validation status

- TypeScript (`npm run lint`): passed.
- Production build (`npm run build`): passed after granting the build process access outside the managed filesystem sandbox; the initial sandboxed run was blocked before source compilation.
- TypeScript (`npm run lint`): passed again after the second-pass audit fixes.
- The smoke suite now verifies every indexable route has exactly one H1, a unique title, one meta description and a canonical `https://civilmath.com` URL; it also verifies dashboard `noindex`.
- Local Playwright execution has been successfully verified by running the tests using the locally installed Google Chrome browser (via `PLAYWRIGHT_CHANNEL=chrome` and booting the production server on port 3000). The full smoke test suite (51 tests) passed successfully, confirming correct HTML tag counts, title uniqueness, meta descriptions, canonical link tags, sitemap structure, robots exclusion policies, and 404 recovery page behavior.

## Known limitation

The site remains a client-rendered Vite SPA. Metadata and content are rendered by React after load. The project has no installed prerendering/SSR integration; adding one would require a new dependency and deployment validation. It was not added without a successful crawl/build proof.
