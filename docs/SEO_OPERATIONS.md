# SEO Operations

## Canonical and crawl policy

- Canonical public host: `https://civilmath.com`.
- Shared metadata is rendered through `SEOHead`. Give each public route a specific title, description, `path`, and matching breadcrumb data.
- Private workspace route `/dashboard` is excluded in `robots.txt` and is not in the sitemap.
- Sitemap endpoint: `/sitemap.xml`. `public/sitemap.xml` is the single source of truth and is served as a static asset by both Vercel and Netlify. Update it whenever an indexable public route is added or removed.

## Adding content

1. Add a focused guide to `src/data/knowledgeBase.ts`; it must link to an existing calculator and clearly state assumptions/limitations.
2. The guide appears automatically in `/guides`, the guide route, and the sitemap implementation must be updated with the same slug.
3. Add formulas/tables only when the value is mathematically exact or the source/assumption is stated. Do not add design values solely for keyword coverage.
4. For a calculator, keep formula code unchanged unless a verified engineering review requires a correction. Use the calculator article dataset for detailed explanation and sources.

## URL migrations

Preserve existing URLs. If migration is unavoidable, add a permanent platform redirect, update React links, canonical URLs and sitemap entries, then test the old and new paths. Avoid redirect chains.

## Release checks

Run `npm run lint`, `npm run test`, and `npm run build`. Confirm the production domain serves `/robots.txt`, `/sitemap.xml`, a calculator, a guide, and a missing route. Inspect title, description, canonical, one H1, breadcrumb schema and visible content.
