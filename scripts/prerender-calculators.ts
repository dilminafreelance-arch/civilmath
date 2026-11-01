import fs from 'fs';
import path from 'path';

import { ALL_ROUTES_SEO, type RouteSEOConfig } from '../src/utils/seoRoutes';
import { FORMULA_REFERENCES, type FormulaReference } from '../src/data/calculatorsData';
import { CALCULATOR_FAQS } from '../src/data/calculatorFaqs';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

const ADDITIONAL_FORMULAS: Record<string, FormulaReference> = {
  'concrete-cost': {
    id: 'concrete-cost',
    latex: '\\text{Total Cost} = V_{\\text{concrete}} \\times \\text{Unit Price} \\times \\left(1 + \\frac{\\text{Waste}\\%}{100}\\right)',
    explanation: 'Estimates total ready-mix concrete material cost based on slab volume, waste allowance, and local supplier unit pricing per cubic yard or meter.',
    steps: [
      'Compute raw slab volume: Length × Width × Thickness (depth).',
      'Convert volume to cubic yards (yd³) or cubic meters (m³).',
      'Apply waste allowance factor (typically 5%–10% for over-excavation and spillage).',
      'Multiply by local ready-mix concrete price to obtain total material expense.',
    ],
  },
  'concrete-steps': {
    id: 'concrete-steps',
    latex: 'V_{\\text{total}} = \\left[N \\times (R \\times T \\times W)\\right] + V_{\\text{waist}} + V_{\\text{landing}}',
    explanation: 'Calculates the total concrete volume required for straight-flight stairs including step blocks, waist slab, and optional landings.',
    steps: [
      'Calculate individual step volume: Riser height (R) × Tread depth (T) × Stair width (W) × Number of steps (N).',
      'Calculate inclined waist slab volume: Waist thickness × Incline slope length × Stair width.',
      'Calculate landing slab volume: Landing length × Width × Thickness.',
      'Sum all component volumes and apply waste margin for ready-mix order sizing.',
    ],
  },
  'rebar-weight-cost': {
    id: 'rebar-weight-cost',
    latex: 'W_{\\text{total}} = N \\times L \\times w_{\\text{unit}} \\quad , \\quad \\text{Cost} = W_{\\text{total}} \\times \\text{Price}',
    explanation: 'Determines reinforcing steel total weight and estimated material cost using standard ASTM bar sizes (#3–#11) or metric diameters (8mm–32mm).',
    steps: [
      'Determine unit weight: Imperial (ASTM A615 lb/ft) or Metric (d² / 162.2 kg/m).',
      'Multiply unit weight by bar length and total bar count.',
      'Add cutting allowance and lap splice waste percentage.',
      'Multiply total reinforcement weight by supplier price per unit weight.',
    ],
  },
  'utility-convert': {
    id: 'utility-convert',
    latex: 'V_{\\text{target}} = V_{\\text{source}} \\times \\text{Conversion Factor}',
    explanation: 'Performs precise engineering unit conversions across length, area, volume, force, pressure, stress, and structural material density.',
    steps: [
      'Select source measurement unit and desired destination unit.',
      'Apply verified standard SI and Imperial dimensional conversion constants.',
      'Output normalized values with standard engineering decimal precision.',
    ],
  },
  'bbs-footing': {
    id: 'bbs-footing',
    latex: 'L_{\\text{cut}} = L_{\\text{footing}} - 2C_c + 2L_{\\text{hook}} \\quad , \\quad W = L_{\\text{cut}} \\times N \\times \\frac{d^2}{162.2}',
    explanation: 'Generates isolated pad footing bar bending schedules with clear cover deductions, standard 90° hook developments, and total steel weight.',
    steps: [
      'Deduct clear concrete cover (typically 75mm / 3 in) from footing dimensions.',
      'Add vertical hook or bend-up development lengths at both ends.',
      'Calculate bar counts across both directions: (Span / Spacing) + 1.',
      'Calculate steel weight using unit weight formula d² / 162.2 kg/m.',
    ],
  },
  'bbs-combined-footing': {
    id: 'bbs-combined-footing',
    latex: 'L_{\\text{cut}} = L_{\\text{span}} - 2C_c + 2L_d \\quad , \\quad W = \\sum (L_i \\times N_i \\times w_i)',
    explanation: 'Computes bar bending schedules for multi-column combined footings including bottom distribution mesh and top tension reinforcement.',
    steps: [
      'Establish overall footing dimensions and column centerline distances.',
      'Calculate bottom longitudinal and transverse rebar lengths minus clear cover.',
      'Determine top tension reinforcement between column supports for negative moment.',
      'Calculate spacer chair bars to maintain dual-layer reinforcement elevation.',
    ],
  },
  'bbs-strip-footing': {
    id: 'bbs-strip-footing',
    latex: 'L_{\\text{transverse}} = W_{\\text{footing}} - 2C_c + 2L_{\\text{hook}} \\quad , \\quad N = \\frac{L_{\\text{wall}}}{\\text{Spacing}} + 1',
    explanation: 'Generates reinforcement schedules for continuous wall and strip foundations including transverse main cantilever bars and longitudinal distribution steel.',
    steps: [
      'Calculate transverse rebar cutting length across footing width minus side cover.',
      'Add standard end hooks or 90° bends.',
      'Calculate longitudinal distribution steel along the total wall run including lap splices.',
      'Compute cutting schedule and total steel tonnage.',
    ],
  },
  'bbs-raft-foundation': {
    id: 'bbs-raft-foundation',
    latex: 'W_{\\text{raft}} = \\sum (L_{\\text{top}} + L_{\\text{bottom}} + L_{\\text{chair}}) \\times \\frac{d^2}{162.2}',
    explanation: 'Calculates dual-layer reinforcement grids for mat and raft foundations including top and bottom rebar meshes and spacing chair supports.',
    steps: [
      'Calculate cutting lengths for top and bottom mats in both X and Y directions.',
      'Incorporate column punch-shear zone reinforcement if specified.',
      'Calculate chair rebar count and height to hold top mesh at specified elevation.',
      'Sum total cutting lengths and steel tonnage by rebar diameter.',
    ],
  },
  'bbs-beam': {
    id: 'bbs-beam',
    latex: 'L_{\\text{stirrup}} = 2(B - 2C_c) + 2(D - 2C_c) + 2(10d_b) - 5(2d_b)',
    explanation: 'Calculates RC beam reinforcement cutting lengths: top bars, bottom tension bars, side face reinforcement, and closed shear stirrup ties.',
    steps: [
      'Calculate bottom main bar cutting length: Clear Span + Development length - Bend deductions.',
      'Calculate top hanger/support bar cutting lengths.',
      'Calculate shear stirrup tie perimeter cutting length including 135° seismic hooks minus bend deductions.',
      'Determine stirrup count based on support zone and midspan zone spacings.',
    ],
  },
  'bbs-plinth-beam': {
    id: 'bbs-plinth-beam',
    latex: 'L_{\\text{main}} = L_{\\text{beam}} + 2L_d - 2(\\text{Bends}) \\quad , \\quad N_{\\text{ties}} = \\frac{L_{\\text{clear}}}{\\text{Spacing}} + 1',
    explanation: 'Computes reinforcement detailing for ground-level plinth/grade beams supporting masonry walls above differential settlement soil.',
    steps: [
      'Compute longitudinal top and bottom bar lengths with development length Ld into column joints.',
      'Calculate stirrup perimeter and hook lengths.',
      'Deduct 90° and 135° bend elongations.',
      'Summarize cutting schedule and total weight by bar size.',
    ],
  },
  'bbs-tie-beam': {
    id: 'bbs-tie-beam',
    latex: 'L_{\\text{cut}} = L_{\\text{clear}} + 2L_{\\text{dev}} - \\text{Bend Deductions}',
    explanation: 'Calculates tie beam bar bending schedules for column pedestal connections under lateral seismic and wind base shears.',
    steps: [
      'Determine clear span between column stubs/pedestals.',
      'Add anchorage development lengths into connecting pedestals.',
      'Calculate closed lateral tie dimensions and distribution spacing.',
      'Generate cutting list and total steel weight.',
    ],
  },
  'bbs-lintel-beam': {
    id: 'bbs-lintel-beam',
    latex: 'L_{\\text{bar}} = L_{\\text{opening}} + 2(\\text{Bearing}) - 2C_c + 2L_{\\text{hook}}',
    explanation: 'Determines reinforcement cutting schedule for masonry opening lintel beams spanning over doors and windows.',
    steps: [
      'Measure clear wall opening width and add specified end bearing lengths (min 150mm–200mm).',
      'Calculate bottom tension bar cutting length minus cover plus end hooks.',
      'Calculate stirrups and top distribution rebar.',
      'Compute total weight and cutting schedule.',
    ],
  },
  'bbs-column': {
    id: 'bbs-column',
    latex: 'L_{\\text{vert}} = H_{\\text{floor}} + L_{\\text{lap}} + L_{\\text{bend}} - C_c',
    explanation: 'Calculates reinforced concrete column longitudinal starter and vertical bars, splice overlap offsets, and lateral tie sets.',
    steps: [
      'Determine floor clear height plus beam depth.',
      'Add lap splice length (typically 40d to 50d) for multi-story continuity.',
      'Calculate lateral tie / hoop cutting length: 2(Width + Depth) + Hook extension - Bend deductions.',
      'Calculate tie count based on confinement zone and general zone spacings.',
    ],
  },
  'bbs-pedestal': {
    id: 'bbs-pedestal',
    latex: 'L_{\\text{dowel}} = H_{\\text{ped}} + L_{\\text{embed}} + L_{\\text{proj}} + L_{\\text{hook}}',
    explanation: 'Computes starter dowels, vertical main rebar, and lateral confinement ties for short footing pedestals supporting baseplates.',
    steps: [
      'Calculate dowel bar development embedment into the foundation footing.',
      'Add pedestal vertical height and projection length into superstructure.',
      'Calculate perimeter tie and intermediate diamond tie cutting lengths.',
      'Summarize bar cut schedule and steel weight.',
    ],
  },
  'bbs-slab': {
    id: 'bbs-slab',
    latex: 'L_{\\text{crank}} = L - 2C_c + (2 \\times 0.42H) + 2L_{\\text{hook}}',
    explanation: 'Generates one-way and two-way RC slab reinforcement schedules including straight bars, bent-up cranked bars, and distribution rebar.',
    steps: [
      'Calculate clear span plus wall/beam bearing lengths.',
      'Apply 0.42H extra crank length for 45° bent-up bars at support negative moment zones.',
      'Calculate distribution rebar in perpendicular direction.',
      'Calculate spacing counts and total weight per diameter.',
    ],
  },
  'bbs-staircase': {
    id: 'bbs-staircase',
    latex: 'L_{\\text{waist}} = \\sqrt{R^2 + G^2} + L_{\\text{landing}} + 2L_d',
    explanation: 'Computes waist slab inclined main bars, landing reinforcement, riser-tread step rebar, and cross distribution steel.',
    steps: [
      'Calculate inclined slope flight length from total rise and total going.',
      'Add upper and lower landing slab span projections.',
      'Add development/anchorage lengths Ld into landing beams/supports.',
      'Calculate distribution bars and step nosing/riser rebar.',
    ],
  },
  'bbs-retaining-wall': {
    id: 'bbs-retaining-wall',
    latex: 'L_{\\text{stem}} = H_{\\text{wall}} + L_{\\text{embed}} + L_{\\text{hook}} - C_c',
    explanation: 'Calculates vertical stem cantilever tension steel, temperature/shrinkage horizontal distribution bars, and base footing key reinforcement.',
    steps: [
      'Determine vertical stem bar length from top of wall to footing bottom minus cover.',
      'Add base footing bend/dowel anchorage length.',
      'Calculate horizontal distribution bars along the retaining wall length.',
      'Compute stem shear key and heel/toe reinforcement schedules.',
    ],
  },
  'bbs-foundation-mesh': {
    id: 'bbs-foundation-mesh',
    latex: 'N_{\\text{bars}} = \\left(\\frac{L}{\\text{Spacing}} + 1\\right) + \\left(\\frac{W}{\\text{Spacing}} + 1\\right)',
    explanation: 'Computes grid rebar cutting lengths and welded wire mesh sheet requirements for ground-bearing foundation slabs and mud mats.',
    steps: [
      'Calculate longitudinal and transverse grid bar lengths subtracting edge cover.',
      'Determine bar counts along each direction from specified grid spacing.',
      'Calculate lap splice overlaps for long runs exceeding standard stock bar lengths.',
      'Determine total steel weight and bundle counts.',
    ],
  },
};

const FORMULA_BY_ROUTE: Record<string, string> = {
  '/concrete/volume': 'concrete-volume',
  '/concrete/rebar': 'rebar-calculator',
  '/concrete/brick': 'brick-calculator',
  '/concrete/cost': 'concrete-cost',
  '/concrete/steps': 'concrete-steps',
  '/rebar/weight-cost': 'rebar-weight-cost',
  '/structural/beam': 'structural-beam',
  '/structural/column': 'structural-column',
  '/structural/slab': 'structural-slab',
  '/structural/steel-weight': 'steel-calculator',
  '/surveying/hi': 'survey-hi',
  '/surveying/traverse': 'survey-coordinate',
  '/geotechnical/bearing-capacity': 'geotech-bearing',
  '/geotechnical/retaining-wall': 'geotech-retaining',
  '/utilities/unit-converter': 'utility-convert',
  '/bbs/footing': 'bbs-footing',
  '/bbs/combined-footing': 'bbs-combined-footing',
  '/bbs/strip-footing': 'bbs-strip-footing',
  '/bbs/raft-foundation': 'bbs-raft-foundation',
  '/bbs/beam': 'bbs-beam',
  '/bbs/plinth-beam': 'bbs-plinth-beam',
  '/bbs/tie-beam': 'bbs-tie-beam',
  '/bbs/lintel-beam': 'bbs-lintel-beam',
  '/bbs/column': 'bbs-column',
  '/bbs/pedestal': 'bbs-pedestal',
  '/bbs/slab': 'bbs-slab',
  '/bbs/staircase': 'bbs-staircase',
  '/bbs/retaining-wall': 'bbs-retaining-wall',
  '/bbs/foundation-mesh': 'bbs-foundation-mesh',
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
  display:inline-block;
  word-break:break-word;
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
.calc-faq h3{
  margin-bottom:.4rem;
  font-size:1.1rem;
  font-weight:600;
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
  const direct = CALCULATOR_FAQS[route.path] ?? route.faqs;
  if (direct && direct.length > 0) return direct;

  // Fallback FAQs generated from route metadata if not explicitly configured
  if (route.isCalculator) {
    const h1 = h1FromTitle(route.title);
    return [
      {
        question: `How does the ${h1} work?`,
        answer: `${route.description} Enter your project parameters in either Metric or US Imperial units to calculate immediate results.`,
      },
      {
        question: 'Are calculations compliant with building codes?',
        answer: 'Calculations reference standard design methodologies (e.g. ACI 318, ASTM, BS 8666, and Terzaghi). Calculations provide preliminary planning values and must be verified by a licensed engineer for final construction drawings.',
      },
      {
        question: 'Can I use both Metric and US Imperial units?',
        answer: 'Yes, CivilMath calculators provide full dual-unit capability. Select your preferred measurement standard at the top of the calculator input interface.',
      },
    ];
  }

  return [];
}

function relatedLinks(route: RouteSEOConfig, allCalculators: RouteSEOConfig[]): string {
  const sameCategory = allCalculators.filter(
    (r) => r.isCalculator && r.path !== route.path && r.category === route.category,
  );
  const otherCategory = allCalculators.filter(
    (r) => r.isCalculator && r.path !== route.path && r.category !== route.category,
  );
  const pool = [...sameCategory, ...otherCategory].slice(0, 5);
  if (pool.length === 0) return '';

  const items = pool
    .map(
      (r) =>
        `<li><a href="${escAttr(r.path)}">${escHtml(h1FromTitle(r.title))}</a><span>${escHtml(r.description)}</span></li>`,
    )
    .join('');

  return `<h2>Related Calculators & Tools</h2><ul class="calc-list">${items}</ul>`;
}

function renderFaqBlock(route: RouteSEOConfig): string {
  const faqs = faqContentFor(route);
  if (!faqs || faqs.length === 0) return '';

  const faqHtml = faqs
    .map(
      (faq) =>
        `<div class="calc-faq"><h3>${escHtml(faq.question)}</h3><p>${escHtml(faq.answer)}</p></div>`,
    )
    .join('');

  return `<h2>Frequently asked questions</h2>${faqHtml}`;
}

function renderCalculator(route: RouteSEOConfig, family: RouteSEOConfig[]): string {
  const h1 = h1FromTitle(route.title);
  const formulaKey = FORMULA_BY_ROUTE[route.path];
  const formula = formulaKey
    ? FORMULA_REFERENCES[formulaKey] || ADDITIONAL_FORMULAS[formulaKey]
    : undefined;

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
    } else {
      method = `<h2>Calculation methodology</h2><p>${escHtml(route.description)}</p>`;
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
        `<li><a href="${escAttr(r.path)}">${escHtml(h1FromTitle(r.title))}</a><span>${escHtml(r.description)}</span></li>`,
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

function renderGeneralPage(route: RouteSEOConfig, calculators: RouteSEOConfig[]): string {
  const h1 = h1FromTitle(route.title);
  return `
    <div class="calc-wrap">
      ${topbar()}
      <nav class="calc-crumb"><a href="/">Home</a> / ${escHtml(h1)}</nav>
      <h1>${escHtml(h1)}</h1>
      <p>${escHtml(route.description)}</p>
      ${renderFaqBlock(route)}
      ${relatedLinks(route, calculators)}
      <p class="calc-note">CivilMath — Engineering Calculators and Design Tools.</p>
    </div>
  `;
}

function targetFor(routePath: string): string {
  return routePath === '/'
    ? path.join(DIST_DIR, 'index.html')
    : path.join(DIST_DIR, routePath.replace(/^\//, ''), 'index.html');
}

function injectStaticRoot(html: string, markup: string, route?: RouteSEOConfig): string {
  let out = html.replace(/<div id="cm-splash"[\s\S]*?(?=<div id="root">)/i, '');

  if (route && !out.includes('data-rh="true"')) {
    out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escHtml(route.title)}</title>`);
  }

  if (!out.includes('calc-wrap{')) {
    out = out.replace('</head>', `<style>${CRITICAL_CSS}</style></head>`);
  }

  return out.replace(
    /<div\s+id=["']root["'][^>]*>[\s\S]*?<\/div>/i,
    `<div id="root">${markup}</div>`,
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
        staticHtml = renderListPage(route, inCategory.length > 0 ? inCategory : calculators);
      } else {
        staticHtml = renderGeneralPage(route, calculators);
      }

      if (!staticHtml) {
        skipped++;
        continue;
      }

      const targetFile = targetFor(route.path);

      if (route.path !== '/') {
        fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      }

      const baseHtml = fs.existsSync(targetFile)
        ? fs.readFileSync(targetFile, 'utf8')
        : shellHtml;

      const updatedHtml = injectStaticRoot(baseHtml, staticHtml, route);

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
