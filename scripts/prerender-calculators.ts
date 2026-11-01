import fs from 'fs';
import path from 'path';

import { ALL_ROUTES_SEO, type RouteSEOConfig } from '../src/utils/seoRoutes';
import { FORMULA_REFERENCES } from '../src/data/calculatorsData';
import { CALCULATOR_FAQS } from '../src/data/calculatorFaqs';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

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
.calc-wrap{
  max-width:48rem;
  margin:0 auto;
  padding:1.5rem 1.25rem 4rem;
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  color:#20231F;
  line-height:1.75;
}
.calc-topbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:.75rem 0;
  margin-bottom:1.5rem;
  border-bottom:1px solid #e7e5e0;
}
.calc-topbar a.brand{
  font-weight:800;
  font-size:1.05rem;
  color:#20231F;
  text-decoration:none;
  letter-spacing:-.02em;
}
.calc-topbar a.home{
  font-size:.8rem;
  color:#657565;
  text-decoration:none;
}
.calc-crumb{
  font-size:.75rem;
  color:#7B8978;
  margin-bottom:1rem;
}
.calc-crumb a{
  color:#657565;
  text-decoration:none;
}
.calc-wrap h1{
  font-size:1.9rem;
  line-height:1.25;
  font-weight:800;
  letter-spacing:-.02em;
  margin:0 0 .75rem;
}
.calc-wrap h2{
  font-size:1.4rem;
  font-weight:700;
  margin:2.25rem 0 .9rem;
  letter-spacing:-.01em;
}
.calc-wrap p{
  margin:0 0 1.1rem;
}
.calc-wrap ol,.calc-wrap ul{
  margin:0 0 1.1rem;
  padding-left:1.5rem;
}
.calc-wrap li{
  margin-bottom:.45rem;
}
.calc-wrap code{
  font-family:ui-monospace,Menlo,Consolas,monospace;
  font-size:.9rem;
  background:#f4f3f0;
  border-radius:.375rem;
  padding:.15rem .45rem;
}
.calc-wrap a{
  color:#2E6B56;
}
.calc-list{
  list-style:none;
  padding-left:0;
}
.calc-list li{
  margin-bottom:.9rem;
}
.calc-list a{
  font-weight:700;
  text-decoration:none;
}
.calc-list span{
  display:block;
  font-weight:400;
  color:#3d443c;
  font-size:.9rem;
}
.calc-faq{
  margin-bottom:1.5rem;
}
.calc-faq h2{
  margin-bottom:.5rem;
}
.calc-faq p{
  margin-left:0;
}
.calc-note{
  margin-top:3rem;
  padding-top:1.25rem;
  border-top:1px solid #e7e5e0;
  font-size:.8rem;
  color:#7B8978;
}
`;

function escHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(value: string): string {
  return escHtml(value).replace(/'/g, '&#39;');
}

function h1FromTitle(title: string): string {
  return (title || 'CivilMath').split('|')[0].trim();
}

function topbar(): string {
  return `
    <header class="calc-topbar">
      <a class="brand" href="/">CivilMath</a>
      <a class="home" href="/calculators">All calculators</a>
    </header>
  `;
}

function faqContentFor(route: RouteSEOConfig): { question: string; answer: string }[] {
  return CALCULATOR_FAQS[route.path] ?? route.faqs ?? [];
}

function relatedLinks(route: RouteSEOConfig, family: RouteSEOConfig[]): string {
  const pool = family.filter((r) => r.isCalculator && r.path !== route.path);
  if (pool.length === 0) return '';

  const items = pool.slice(0, 4)
    .map(
      (r) =>
        `<li><a href="${escAttr(r.path)}">${escHtml(h1FromTitle(r.title))}</a><span>${escHtml(r.description)}</span></li>`
    )
    .join('');

  return `<h2>You may also need</h2><ul class="calc-list">${items}</ul>`;
}

function renderFaqBlock(route: RouteSEOConfig): string {
  const faqs = faqContentFor(route);
  if (!faqs || faqs.length === 0) return '';

  const faqHtml = faqs
    .map(
      (faq) =>
        `<div class="calc-faq"><h2>${escHtml(faq.question)}</h2><p>${escHtml(faq.answer)}</p></div>`
    )
    .join('');

  return `<h2>Frequently asked questions</h2>${faqHtml}`;
}

function renderCalculator(route: RouteSEOConfig, family: RouteSEOConfig[]): string {
  const h1 = h1FromTitle(route.title);
  const formulaKey = FORMULA_BY_ROUTE[route.path];
  const formula = formulaKey ? FORMULA_REFERENCES[formulaKey] : undefined;

  let method = '';

  if (formula) {
    const steps = formula.steps.map((step) => `<li>${escHtml(step)}</li>`).join('');
    method =
      `<h2>Formula and method</h2><p>${escHtml(formula.explanation)}</p>` +
      `<p><code>${escHtml(formula.latex)}</code></p>` +
      `<ol>${steps}</ol>`;
  } else {
    const fallbackFaq = faqContentFor(route)[0];
    if (fallbackFaq) {
      method = `<h2>How it is calculated</h2><p>${escHtml(fallbackFaq.answer)}</p>`;
    }
  }

  return `
    <div class="calc-wrap">
      ${topbar()}
      <nav class="calc-crumb"><a href="/">Home</a> / <a href="/calculators">Calculators</a> / ${escHtml(h1)}</nav>
      <h1>${escHtml(h1)}</h1>
      <p>${escHtml(route.description)}</p>
      ${method}
      ${renderFaqBlock(route)}
      ${relatedLinks(route, family)}
      <p class="calc-note">
        Calculations are preliminary estimates for planning and education.
        Verify results against project documents and applicable codes with a licensed Professional Engineer.
        The interactive calculator loads automatically when JavaScript is available.
      </p>
    </div>
  `;
}

function renderListPage(route: RouteSEOConfig, items: RouteSEOConfig[]): string {
  const h1 = h1FromTitle(route.title);
  const list = items
    .map(
      (r) =>
        `<li><a href="${escAttr(r.path)}">${escHtml(h1FromTitle(r.title))}</a><span>${escHtml(r.description)}</span></li>`
    )
    .join('');

  return `
    <div class="calc-wrap">
      ${topbar()}
      <nav class="calc-crumb"><a href="/">Home</a> / ${escHtml(h1)}</nav>
      <h1>${escHtml(h1)}</h1>
      <p>${escHtml(route.description)}</p>
      <ul class="calc-list">${list}</ul>
      <p class="calc-note">The interactive calculators load automatically when JavaScript is available.</p>
    </div>
  `;
}

function targetFor(routePath: string): string {
  return routePath === '/'
    ? path.join(DIST_DIR, 'index.html')
    : path.join(DIST_DIR, routePath.replace(/^\//, ''), 'index.html');
}

function injectStaticRoot(html: string, markup: string): string {
  let out = html.replace(/<div id="cm-splash"[\s\S]*?(?=<div id="root">)/i, '');

  if (!/<div\s+id=["']root["'][^>]*>\s*<\/div>/i.test(out)) {
    return out;
  }

  if (!out.includes('calc-wrap{')) {
    out = out.replace('</head>', `<style>${CRITICAL_CSS}</style></head>`);
  }

  return out.replace(
    /<div\s+id=["']root["'][^>]*>\s*<\/div>/i,
    `<div id="root">${markup}</div>`
  );
}

function main() {
  const shellPath = path.join(DIST_DIR, 'index.html');

  if (!fs.existsSync(shellPath)) {
    throw new Error(`Missing build shell: ${shellPath}. Run "vite build" first.`);
  }

  const shellHtml = fs.readFileSync(shellPath, 'utf8');
  const calculators = ALL_ROUTES_SEO.filter((r) => r.isCalculator);
  let written = 0;
  let skipped = 0;

  for (const route of ALL_ROUTES_SEO) {
    try {
      let staticHtml: string | null = null;

      if (route.isCalculator) {
        staticHtml = renderCalculator(route, calculators);
      } else if (route.path === '/' || route.path === '/calculators') {
        staticHtml = renderListPage(route, calculators);
      } else if (route.category) {
        const inCategory = calculators.filter((r) => r.category === route.category);
        if (inCategory.length > 0) {
          staticHtml = renderListPage(route, inCategory);
        }
      }

      if (!staticHtml) continue;

      const targetFile = targetFor(route.path);

      if (route.path !== '/') {
        fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      }

      const baseHtml = fs.existsSync(targetFile)
        ? fs.readFileSync(targetFile, 'utf8')
        : shellHtml;

      const updatedHtml = injectStaticRoot(baseHtml, staticHtml);

      if (updatedHtml === baseHtml) {
        skipped++;
        continue;
      }

      fs.writeFileSync(targetFile, updatedHtml, 'utf8');
      written++;
    } catch (error: any) {
      console.warn(`[prerender-calculators] Failed for ${route.path}:`, error?.message ?? error);
      skipped++;
    }
  }

  console.log(`[prerender-calculators] Injected static content into ${written} pages (${skipped} skipped).`);
}

try {
  main();
} catch (error: any) {
  console.error('[prerender-calculators] Fatal:', error?.message ?? error);
  process.exit(0);
}
