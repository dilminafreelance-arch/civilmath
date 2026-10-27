/**
 * prerender-calculators.ts — browser-free static HTML for calculator pages.
 *
 * Root cause it fixes (2026-10-27):
 *   scripts/prerender.ts snapshots routes with Playwright, but the Vercel
 *   build sets PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1, so no browser is
 *   available and prerender.ts exits 0 having done nothing. inject-seo-meta
 *   then writes only title/meta/canonical/FAQ-JSON-LD over the empty SPA
 *   shell, so crawlers that do not run JS see "Loading workspace…" and no
 *   calculator content. (Local builds looked fine because Playwright exists
 *   locally — which is why this was missed.)
 *
 * Fix: after inject-seo-meta.ts, this script injects a static, crawlable
 * content block into #root for every calculator route, the homepage, the
 * /calculators directory and the discipline pages — with no browser:
 *   - Calculator pages: H1, description, formula/method (from the shared
 *     FORMULA_REFERENCES or, where there is no formula entry, the method
 *     described in the first shared FAQ), full FAQ Q&A where available,
 *     crawlable <a href> links to related calculators, and the disclaimer.
 *   - Homepage / directory / discipline pages: crawlable <a href> links to
 *     every calculator, so discovery does not depend on JS navigation.
 *
 * It never invents worked-example numbers: no per-calculator worked example
 * exists in a shared data source, so none is fabricated here. If one is
 * added to src/data later, render it from that source, not from literals.
 *
 * Safety:
 *   - Only touches files whose #root is the empty SPA shell. Pages already
 *     prerendered by Playwright (local builds) are left untouched.
 *   - React uses createRoot (not hydrateRoot), so on JS boot it replaces
 *     this static block with the interactive calculator — same pattern as
 *     prerender-articles.ts. No hydration mismatch.
 *   - The cm-splash "Loading workspace…" overlay is removed from injected
 *     pages so it cannot cover the static content in a no-JS render.
 *   - Never fails the build.
 *
 * Build order: vite build && ... && tsx scripts/inject-seo-meta.ts
 *   && tsx scripts/prerender-articles.ts && tsx scripts/prerender-calculators.ts
 */
import fs from 'fs';
import path from 'path';
import { ALL_ROUTES_SEO, type RouteSEOConfig } from '../src/utils/seoRoutes';
import { FORMULA_REFERENCES } from '../src/data/calculatorsData';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

/** Route path -> FORMULA_REFERENCES key (slugs alone do not map 1:1). */
const FORMULA_BY_ROUTE: Record<string, string> = {
  '/concrete/volume': 'concrete-volume',
  '/concrete/rebar': 'rebar-calculator',
  '/concrete/brick': 'brick-calculator',
  '/structural/beam': 'structural-beam',
  '/structural/column': 'structural-column',
  '/structural/slab': 'structural-slab',
  '/structural/steel-weight': 'steel-calculator',
  '/surveying/hi': 'survey-hi',
  '/surveying/traverse': 'survey-coordinate',
  '/geotechnical/bearing-capacity': 'geotech-bearing',
  '/geotechnical/retaining-wall': 'geotech-retaining',
};

const CRITICAL_CSS = `
.calc-wrap{max-width:48rem;margin:0 auto;padding:1.5rem 1.25rem 4rem;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#20231F;line-height:1.75}
.calc-topbar{display:flex;align-items:center;justify-content:space-between;padding:.75rem 0;margin-bottom:1.5rem;border-bottom:1px solid #e7e5e0}
.calc-topbar a.brand{font-weight:800;font-size:1.05rem;color:#20231F;text-decoration:none;letter-spacing:-.02em}
.calc-topbar a.home{font-size:.8rem;color:#657565;text-decoration:none}
.calc-crumb{font-size:.75rem;color:#7B8978;margin-bottom:1rem}
.calc-crumb a{color:#657565;text-decoration:none}
.calc-wrap h1{font-size:1.9rem;line-height:1.25;font-weight:800;letter-spacing:-.02em;margin:0 0 .75rem}
.calc-wrap h2{font-size:1.4rem;font-weight:700;margin:2.25rem 0 .9rem;letter-spacing:-.01em}
.calc-wrap p{margin:0 0 1.1rem}
.calc-wrap ol,.calc-wrap ul{margin:0 0 1.1rem;padding-left:1.5rem}
.calc-wrap li{margin-bottom:.45rem}
.calc-wrap code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.9rem;background:#f4f3f0;border-radius:.375rem;padding:.15rem .45rem}
.calc-wrap a{color:#2E6B56}
.calc-list{list-style:none;padding-left:0}
.calc-list li{margin-bottom:.9rem}
.calc-list a{font-weight:700;text-decoration:none}
.calc-list span{display:block;font-weight:400;color:#3d443c;font-size:.9rem}
.calc-faq{margin-bottom:1.5rem}
.calc-faq p{margin-left:0}
.calc-note{margin-top:3rem;padding-top:1.25rem;border-top:1px solid #e7e5e0;font-size:.8rem;color:#7B8978}
`;

function escHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s: string): string {
  return escHtml(s).replace(/'/g, '&#39;');
}

/** "Concrete Volume Calculator | ACI 318 Compliant | CivilMath" -> first segment. */
function h1FromTitle(title: string): string {
  return (title || 'CivilMath').split('|')[0].trim();
}

function topbar(): string {
  return `<header class="calc-topbar"><a class="brand" href="/">CivilMath</a><a class="home" href="/calculators">All calculators</a></header>`;
}

function relatedLinks(route: RouteSEOConfig): string {
  const related = ALL_ROUTES_SEO.filter(
    (r) => r.isCalculator && r.path !== route.path && r.category === route.category,
  );
  if (related.length === 0) return '';
  const items = related
    .map(
      (r) =>
        `<li><a href="${escAttr(r.path)}">${escHtml(h1FromTitle(r.title))}</a>`
        + `<span>${escHtml(r.description)}</span></li>`,
    )
    .join('');
  return `<h2>You may also need</h2><ul class="calc-list">${items}</ul>`;
}

function faqBlock(route: RouteSEOConfig): string {
  if (!route.faqs || route.faqs.length === 0) return '';
  const items = route.faqs
    .map(
      (f) =>
        `<div class="calc-faq"><h2>${escHtml(f.question)}</h2><p>${escHtml(f.answer)}</p></div>`,
    )
    .join('');
  return `<h2>Frequently asked questions</h2>${items}`;
}

function renderCalculator(route: RouteSEOConfig): string {
  const h1 = h1FromTitle(route.title);
  const formula = FORMULA_BY_ROUTE[route.path]
    ? FORMULA_REFERENCES[FORMULA_BY_ROUTE[route.path]]
    : undefined;
  let method = '';
  if (formula) {
    const steps = formula.steps.map((s) => `<li>${escHtml(s)}</li>`).join('');
    method =
      `<h2>Formula and method</h2><p>${escHtml(formula.explanation)}</p>`
      + `<p><code>${escHtml(formula.latex)}</code></p>`
      + `<ol>${steps}</ol>`;
  } else if (route.faqs && route.faqs.length > 0) {
    // The first shared FAQ answer describes the method for the three
    // calculators without a FORMULA_REFERENCES entry (cost, steps, rebar).
    method = `<h2>How it is calculated</h2><p>${escHtml(route.faqs[0].answer)}</p>`;
  }
  return `<div class="calc-wrap">${topbar()}`
    + `<nav class="calc-crumb"><a href="/">Home</a> / <a href="/calculators">Calculators</a> / ${escHtml(h1)}</nav>`
    + `<h1>${escHtml(h1)}</h1>`
    + `<p>${escHtml(route.description)}</p>`
    + method
    + faqBlock(route)
    + relatedLinks(route)
    + `<p class="calc-note">Calculations are preliminary estimates for planning and education. `
    + `Verify results against project documents and applicable codes with a licensed Professional Engineer. `
    + `The interactive calculator loads automatically when JavaScript is available.</p>`
    + `</div>`;
}

function renderListPage(route: RouteSEOConfig, items: RouteSEOConfig[]): string {
  const h1 = h1FromTitle(route.title);
  const list = items
    .map(
      (r) =>
        `<li><a href="${escAttr(r.path)}">${escHtml(h1FromTitle(r.title))}</a>`
        + `<span>${escHtml(r.description)}</span></li>`,
    )
    .join('');
  return `<div class="calc-wrap">${topbar()}`
    + `<nav class="calc-crumb"><a href="/">Home</a> / ${escHtml(h1)}</nav>`
    + `<h1>${escHtml(h1)}</h1>`
    + `<p>${escHtml(route.description)}</p>`
    + `<ul class="calc-list">${list}</ul>`
    + `<p class="calc-note">The interactive calculators load automatically when JavaScript is available.</p>`
    + `</div>`;
}

function targetFor(routePath: string): string {
  return routePath === '/'
    ? path.join(DIST_DIR, 'index.html')
    : path.join(DIST_DIR, routePath.replace(/^\//, ''), 'index.html');
}

function main() {
  const calculators = ALL_ROUTES_SEO.filter((r) => r.isCalculator);
  let written = 0;
  let skipped = 0;

  for (const route of ALL_ROUTES_SEO) {
    let staticHtml: string | null = null;
    if (route.isCalculator) {
      staticHtml = renderCalculator(route);
    } else if (route.path === '/' || route.path === '/calculators') {
      staticHtml = renderListPage(route, calculators);
    } else if (route.category) {
      const inCategory = calculators.filter((r) => r.category === route.category);
      if (inCategory.length > 0) staticHtml = renderListPage(route, inCategory);
    }
    if (!staticHtml) continue;

    const targetFile = targetFor(route.path);
    if (!fs.existsSync(targetFile)) {
      console.warn(`[prerender-calculators] No HTML for ${route.path}; skipping.`);
      skipped++;
      continue;
    }
    let html = fs.readFileSync(targetFile, 'utf8');
    // Only inject into the empty SPA shell; leave Playwright snapshots alone.
    if (!/<div id="root">\s*<\/div>/.test(html)) {
      skipped++;
      continue;
    }
    // Remove the fixed splash overlay so it cannot cover static content.
    html = html.replace(/<div id="cm-splash"[\s\S]*?(?=<div id="root">)/, '');
    if (!html.includes('calc-wrap{')) {
      html = html.replace('</head>', `<style>${CRITICAL_CSS}</style></head>`);
    }
    html = html.replace(
      /<div id="root">\s*<\/div>/,
      `<div id="root">${staticHtml}</div>`,
    );
    fs.writeFileSync(targetFile, html, 'utf8');
    written++;
  }
  console.log(
    `[prerender-calculators] Injected static content into ${written} pages (${skipped} skipped: already prerendered or no HTML).`,
  );
}

try {
  main();
} catch (e: any) {
  // Never fail the deployment over prerendering.
  console.error('[prerender-calculators] Fatal:', e?.message);
  process.exit(0);
}
