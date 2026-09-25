# CivilMath Project Rules

- Preserve existing calculator formulas and public routes unless a verified change and migration are explicitly required.
- Do not present an estimate, nominal method, or material assumption as universal code compliance.
- Keep calculator pages useful first: labelled inputs and units, accessible errors, visible results, method/assumptions, related content and an engineering disclaimer.
- Use the shared `SEOHead` and canonical `https://civilmath.com` URLs for public routes. Add sitemap entries for indexable routes and exclude private/noindex routes.
- Run `npm run lint`, local Playwright smoke tests, and `npm run build` after meaningful changes. Do not expose or commit secret values from environment files.
