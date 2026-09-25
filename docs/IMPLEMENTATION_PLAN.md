# CivilMath SEO Upgrade Plan

1. **Foundation:** centralize canonical public URLs and metadata, remove unsupported global compliance language, and correct robots/sitemap host consistency.
2. **Reusable page systems:** add semantic breadcrumbs, related calculators/guides, an engineering-use disclaimer, and typed content datasets.
3. **Knowledge platform:** add focused guide, formula, and reference-table landing/detail pages based only on existing calculator concepts and clearly labelled estimates/reference material.
4. **Navigation and trust:** expose Guides, Formulas, Reference, BOQ and legal/disclaimer destinations; add terms, disclaimer, and a useful 404 page.
5. **Crawlability and quality:** generate one static sitemap from canonical routes, preserve all existing calculator URLs, validate metadata/sitemap invariants, then run lint, tests, and production build.

No existing calculator calculation function or route will be changed. Rendering remains a Vite SPA in this scope; deployment-safe prerendering needs a separate environment-backed proof of direct HTML output.
