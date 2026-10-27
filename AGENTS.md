# CivilMath Project Rules

- Preserve existing calculator formulas and public routes unless a verified change and migration are explicitly required.
- Do not present an estimate, nominal method, or material assumption as universal code compliance.
- Keep calculator pages useful first: labelled inputs and units, accessible errors, visible results, method/assumptions, related content and an engineering disclaimer.
- Use the shared `SEOHead` and canonical `https://civilmath.com` URLs for public routes. Add sitemap entries for indexable routes and exclude private/noindex routes.
- Run `npm run lint`, local Playwright smoke tests, and `npm run build` after meaningful changes. Do not expose or commit secret values from environment files.

## New calculator checklist
When adding a calculator, update ALL of these (missed spots cause invisible pages):
- `src/data/calculatorsData.ts` (CALCULATORS_LIST entry)
- `src/utils/seoRoutes.ts` (route SEO entry; add `faqs` from `src/data/calculatorFaqs.ts` for FAQ schema)
- `src/App.tsx` (route + lazy import; add `/calculators/<slug>` redirect)
- `src/pages/CalculatorsDirectoryPage.tsx` (ALL_DIRECTORY_CALCULATORS entry)
- `src/pages/calculators/CalculatorPageShell.tsx` (TOPICAL_RELATED_MAP cross-links)
- `src/components/LeftSidebar.tsx` (discipline count if applicable)
- Sitemap is served live by `api/sitemap.js` from `api/_lib/staticRoutes.js` (plus dynamic article URLs) — add the route there too. `scripts/generate-sitemap.ts` only rebuilds the build-time static copy; verify the route appears in both.
- Calculator prerender (2026-10-27): `scripts/prerender.ts` (Playwright) is a no-op on Vercel (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`), so production calculator/homepage HTML was just the SPA shell + SEO meta. `scripts/prerender-calculators.ts` (browser-free, runs last in `npm run build`) injects static H1/description/formula-or-method/FAQ/related-links content into empty-shell `#root` for every calculator route, the homepage, `/calculators` and discipline pages. It skips pages Playwright already prerendered locally, and never invents worked-example numbers — those need a shared data source first.
