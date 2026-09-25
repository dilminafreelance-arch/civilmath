import { Helmet } from 'react-helmet-async';
import { ReactNode } from 'react';

import { CalculatorCategory } from '../types';
import { CALCULATORS_LIST } from '../data/calculatorsData';

export const SITE_URL = 'https://civilmath.com';
export const SITE_NAME = 'CivilMath';
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
export const TWITTER_HANDLE = '@civilmath';

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string | string[];
  canonicalUrl?: string;
  ogImage?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  schema?: Record<string, any> | Record<string, any>[];
  faqs?: { question: string; answer: string }[];
  breadcrumbs?: { name: string; url: string }[];
  children?: ReactNode;
}

export interface SEOMeta {
  title: string;
  description: string;
  path: string;
  canonical?: string;
  image?: string;
  noindex?: boolean;
  type?: 'website' | 'article';
  published?: string;
  schema?: Record<string, any> | Record<string, any>[];
  faqs?: { question: string; answer: string }[];
  breadcrumbs?: { name: string; url: string }[];
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => {
      const fullUrl = item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url.startsWith('/') ? item.url : `/${item.url}`}`;
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: fullUrl,
      };
    }),
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CivilMath',
    url: SITE_URL,
    logo: DEFAULT_IMAGE,
    description: 'Free online civil engineering calculators for structural analysis, concrete design, rebar BBS, geotechnical engineering, surveying, and unit conversion.',
    sameAs: [
      'https://twitter.com/civilmath',
    ],
  };
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CivilMath — Civil Engineering Calculator Suite',
    url: SITE_URL,
    description: 'Professional-grade free online civil engineering calculators for structural, concrete, geotechnical, and surveying computations.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateCalculatorSchema(calc: {
  name: string;
  description: string;
  url: string;
  category?: string;
}) {
  const fullUrl = calc.url.startsWith('http') ? calc.url : `${SITE_URL}${calc.url.startsWith('/') ? calc.url : `/${calc.url}`}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: calc.name,
    description: calc.description,
    url: fullUrl,
    applicationCategory: 'EngineeringApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    ...(calc.category ? { keywords: calc.category } : {}),
  };
}

export function getCalculatorSlug(calc: typeof CALCULATORS_LIST[0]): string {
  if (calc.slug) return calc.slug;
  if (calc.id.startsWith(calc.category + '-')) return calc.id.substring(calc.category.length + 1);
  return calc.id;
}

/**
 * Reusable SEO Component - sets per-route metadata inside react-helmet-async
 */
export function SEO({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  type = 'website',
  noindex = false,
  schema,
  faqs,
  breadcrumbs,
  children,
}: SEOProps) {
  const url = canonicalUrl ? (canonicalUrl.startsWith('http') ? canonicalUrl : `${SITE_URL}${canonicalUrl.startsWith('/') ? canonicalUrl : `/${canonicalUrl}`}`) : SITE_URL;
  const image = ogImage ? (ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`) : DEFAULT_IMAGE;

  const schemas: Record<string, any>[] = [];
  if (schema) {
    if (Array.isArray(schema)) {
      schemas.push(...schema);
    } else {
      schemas.push(schema);
    }
  }
  if (breadcrumbs && breadcrumbs.length > 0) {
    schemas.push(generateBreadcrumbSchema(breadcrumbs));
  }
  if (faqs && faqs.length > 0) {
    schemas.push(generateFAQSchema(faqs));
  }

  const keywordStr = Array.isArray(keywords) ? keywords.join(', ') : keywords;

  return (
    <Helmet>
      {/* Primary Page Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywordStr && <meta name="keywords" content={keywordStr} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Schemas */}
      {schemas.map((s, idx) => (
        <script key={`schema-${idx}`} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}

      {children}
    </Helmet>
  );
}

/**
 * Backward compatible SEOHead adapter wrapping SEO
 */
export function SEOHead({ meta, children }: { meta: SEOMeta; children?: ReactNode }) {
  const canonical = meta.canonical || `${SITE_URL}${meta.path.startsWith('/') ? meta.path : `/${meta.path}`}`;
  return (
    <SEO
      title={meta.title}
      description={meta.description}
      canonicalUrl={canonical}
      ogImage={meta.image}
      type={meta.type}
      noindex={meta.noindex}
      schema={meta.schema}
      faqs={meta.faqs}
      breadcrumbs={meta.breadcrumbs}
    >
      {children}
    </SEO>
  );
}

export const CATEGORY_META: Record<CalculatorCategory, { name: string; description: string; heroTitle: string; heroSubtitle: string }> = {
  bbs: {
    name: 'Bar Bending Schedule',
    description: 'Free bar bending schedule calculators for footings, beams, columns, slabs, stairs, retaining walls, raft foundations and pedestals. Generate rebar cutting-length and weight estimates.',
    heroTitle: 'Rebar Bending Schedule Calculators',
    heroSubtitle: 'Generate rebar schedules for preliminary planning, with multi-member management and PDF/Excel export.',
  },
  structural: {
    name: 'Structural Engineering',
    description: 'Free structural engineering calculators for beam analysis, column planning, slab deflection estimates, steel properties and rebar estimation in metric and imperial units.',
    heroTitle: 'Structural Engineering Design Tools',
    heroSubtitle: 'Analyze beams, estimate column and slab values, compute steel properties and estimate rebar quantities.',
  },
  concrete: {
    name: 'Concrete & Materials',
    description: 'Free concrete volume calculator, concrete mix design tool, brick quantity calculator, mortar and plaster estimator, and rebar weight calculator. Estimate materials, costs, and quantities for slabs, columns, walls, and footings.',
    heroTitle: 'Concrete & Construction Materials Calculators',
    heroSubtitle: 'Estimate concrete volumes, mix ratios, brick quantities, mortar, plaster, and rebar requirements for any construction project.',
  },
  geotech: {
    name: 'Geotechnical Engineering',
    description: 'Free geotechnical engineering calculators for soil bearing capacity using Terzaghi and Meyerhof methods, retaining wall lateral earth pressure (Rankine and Coulomb), and slope stability analysis.',
    heroTitle: 'Geotechnical Engineering Tools',
    heroSubtitle: 'Evaluate bearing capacity, lateral earth pressures, and soil stability using classical and modern geotechnical theories.',
  },
  survey: {
    name: 'Surveying',
    description: 'Free surveying calculators for height of instrument (HI), coordinate traverse adjustments, differential leveling networks, cut and fill volume computations, and bearing angle calculations for land surveying.',
    heroTitle: 'Surveying & Leveling Calculators',
    heroSubtitle: 'Solve leveling networks, traverse coordinates, bearing angles, and elevation differences with precision surveying tools.',
  },
  utility: {
    name: 'Engineering Utilities',
    description: 'Free engineering unit converter for civil and structural engineering units, steel weight calculator for beams, channels, angles, and rebars, and general civil engineering reference tools.',
    heroTitle: 'Engineering Utilities & Converters',
    heroSubtitle: 'Convert engineering units, estimate steel section weights, and access quick-reference tools for daily civil engineering work.',
  },
};

export const CATEGORY_PATH_MAP: Record<CalculatorCategory, string> = {
  bbs: 'bbs',
  structural: 'structural',
  concrete: 'concrete',
  geotech: 'geotechnical',
  survey: 'surveying',
  utility: 'utilities',
};

export function calcIdToPath(id: string): string {
  return id.replace(/-/g, '/').replace(/_/g, '-');
}

export function pathToCalcId(path: string): string {
  return path.replace(/\//g, '-');
}

export interface RouteSEOConfig {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  category?: CalculatorCategory;
  isCalculator?: boolean;
}

/**
 * 47 Indexable Public Routes with calibrated 50-60 char titles & 150-160 char descriptions
 */
export const ALL_ROUTES_SEO: RouteSEOConfig[] = [
  {
    path: '/',
    title: 'Civil Engineering Calculators & Design Tools | CivilMath',
    description: 'Free professional civil engineering calculators for concrete volume, beam analysis, rebar BBS, column design, and surveying. Fast, accurate, and code-aligned.',
    keywords: ['civil engineering calculators', 'concrete calculator', 'beam analysis', 'bar bending schedule', 'civil math'],
    priority: 1.0,
    changefreq: 'weekly',
  },
  {
    path: '/calculators',
    title: 'Civil Engineering Calculators Directory | CivilMath',
    description: 'Free directory of civil engineering calculators for concrete volume, beam analysis, rebar BBS schedules, bearing capacity, and surveying with CivilMath.',
    keywords: ['civil engineering calculators directory', 'concrete calculators list', 'rebar bbs tools', 'civil math calculators'],
    priority: 0.9,
    changefreq: 'weekly',
  },
  {
    path: '/concrete',
    title: 'Concrete & Materials Calculators | Mix Design | CivilMath',
    description: 'Free concrete calculators for volume estimation, mix design ratios, brick wall mortar, and rebar requirements. Calculate materials and costs accurately online.',
    keywords: ['concrete calculators', 'mix design calculator', 'concrete materials', 'construction estimating'],
    priority: 0.7,
    changefreq: 'weekly',
    category: 'concrete',
  },
  {
    path: '/concrete/volume',
    title: 'Concrete Volume Calculator | ACI 318 Compliant | CivilMath',
    description: 'Calculate concrete volume and required cement bags, sand weight, and aggregate for slabs, footings, and columns with custom mix ratios and waste factors.',
    keywords: ['concrete volume calculator', 'concrete mix ratio calculator', 'cement bags calculator', 'slab concrete volume', 'concrete mix design', 'mix ratio calculation', 'ACI 318 concrete'],
    priority: 0.9,
    changefreq: 'weekly',
    category: 'concrete',
    isCalculator: true,
  },
  {
    path: '/concrete/rebar',
    title: 'Rebar Quantity & Weight Calculator | Detailing | CivilMath',
    description: 'Calculate total rebar segment lengths, weight per bar size, overlap lap splices, and spacing counts for concrete slabs, beams, and columns with CivilMath.',
    keywords: ['rebar quantity calculator', 'rebar weight estimator', 'lap splice calculation', 'rebar spacing'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'concrete',
    isCalculator: true,
  },
  {
    path: '/concrete/brick',
    title: 'Brick Wall & Mortar Quantity Calculator | CivilMath Tools',
    description: 'Estimate the number of standard bricks, mortar volume, and dry cement-sand quantities for single or double-wythe brick masonry walls with waste margins.',
    keywords: ['brick calculator', 'mortar quantity estimator', 'brickwork calculator', 'masonry estimator'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'concrete',
    isCalculator: true,
  },
  {
    path: '/structural',
    title: 'Structural Engineering Design & Analysis Tools | CivilMath',
    description: 'Free structural analysis calculators for simply supported beams, short column axial capacity, slab deflection limits, and steel section weights on CivilMath.',
    keywords: ['structural engineering calculators', 'beam analysis tool', 'column design calculator', 'structural steel'],
    priority: 0.7,
    changefreq: 'weekly',
    category: 'structural',
  },
  {
    path: '/structural/beam',
    title: 'Beam Analysis Calculator | Bending & Shear Check | CivilMath',
    description: 'Compute beam maximum bending moment, shear forces, support reactions, and elastic deflection under point and uniform distributed loads with CivilMath.',
    keywords: ['beam analysis calculator', 'bending moment calculator', 'shear force diagram', 'beam deflection'],
    priority: 0.9,
    changefreq: 'weekly',
    category: 'structural',
    isCalculator: true,
  },
  {
    path: '/structural/column',
    title: 'Column Design Calculator | ACI 318 Axial Load | CivilMath',
    description: 'Determine nominal and factored axial load capacity for tied and spiral reinforced concrete short columns according to ACI 318 design code provisions online.',
    keywords: ['column design calculator', 'axial capacity concrete column', 'ACI 318 column design', 'short column'],
    priority: 0.9,
    changefreq: 'weekly',
    category: 'structural',
    isCalculator: true,
  },
  {
    path: '/structural/slab',
    title: 'Slab Deflection & Minimum Thickness Calculator | CivilMath',
    description: 'Check one-way and two-way reinforced concrete slab deflection and minimum thickness requirements for various boundary conditions under ACI 318 standards.',
    keywords: ['slab deflection calculator', 'minimum slab thickness', 'ACI 318 slab design', 'two way slab'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'structural',
    isCalculator: true,
  },
  {
    path: '/structural/steel-weight',
    title: 'Steel Weight Calculator | Beams, Plates & Rebar | CivilMath',
    description: 'Quickly compute unit and total weight of structural steel sections including I-beams, angles, channels, flat plates, round bars, and hollow structural tubes.',
    keywords: ['steel weight calculator', 'structural steel weight', 'I beam weight', 'steel section calculator'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'structural',
    isCalculator: true,
  },
  {
    path: '/surveying',
    title: 'Land Surveying & Leveling Calculators Online | CivilMath',
    description: 'Perform height of instrument leveling computations, coordinate traverse balancing, and elevation differential adjustments with professional surveying tools.',
    keywords: ['surveying calculators', 'leveling calculations', 'traverse adjustment', 'height of instrument'],
    priority: 0.7,
    changefreq: 'weekly',
    category: 'survey',
  },
  {
    path: '/surveying/hi',
    title: 'Height of Instrument Calculator | Leveling Sheet | CivilMath',
    description: 'Calculate reduced levels (RL) and instrument height (HI) from backsight, intermediate, and foresight readings with automatic arithmetic leveling checks.',
    keywords: ['height of instrument calculator', 'differential leveling sheet', 'reduced level calculation', 'HI method'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'survey',
    isCalculator: true,
  },
  {
    path: '/surveying/traverse',
    title: 'Coordinate Traverse Calculator | Bowditch Rule | CivilMath',
    description: 'Compute and adjust closed and link traverse coordinates using Bowditch Compass Rule. Calculate latitudes, departures, closing errors, and relative precision.',
    keywords: ['traverse calculator', 'bowditch rule calculator', 'traverse balancing', 'latitude departure survey'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'survey',
    isCalculator: true,
  },
  {
    path: '/geotechnical',
    title: 'Geotechnical Engineering Calculators & Solvers | CivilMath',
    description: 'Evaluate shallow foundation bearing capacity and lateral earth pressure on retaining walls using classical Terzaghi, Meyerhof, and Rankine earth methods.',
    keywords: ['geotechnical calculators', 'soil bearing capacity', 'retaining wall pressure', 'foundation engineering'],
    priority: 0.7,
    changefreq: 'weekly',
    category: 'geotech',
  },
  {
    path: '/geotechnical/bearing-capacity',
    title: 'Soil Bearing Capacity Calculator | Terzaghi | CivilMath',
    description: 'Calculate ultimate and allowable bearing capacity of strip, square, and circular shallow foundations using Terzaghi, Meyerhof, and Hansen geotechnical theories.',
    keywords: ['soil bearing capacity calculator', 'terzaghi bearing capacity', 'shallow foundation capacity', 'meyerhof method'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'geotech',
    isCalculator: true,
  },
  {
    path: '/geotechnical/retaining-wall',
    title: 'Retaining Wall Earth Pressure Calculator | CivilMath Tools',
    description: 'Calculate active and passive lateral earth pressure distributions and overturning moments on retaining walls using Rankine and Coulomb geotechnical equations.',
    keywords: ['retaining wall calculator', 'lateral earth pressure', 'rankine earth pressure', 'coulomb theory'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'geotech',
    isCalculator: true,
  },
  {
    path: '/utilities',
    title: 'Civil Engineering Utilities & Unit Converters | CivilMath',
    description: 'Comprehensive engineering unit conversion utilities for length, area, volume, force, stress, pressure, and density tailored for civil and structural engineers.',
    keywords: ['civil engineering utilities', 'engineering unit converter', 'unit conversions', 'civil math tools'],
    priority: 0.7,
    changefreq: 'weekly',
    category: 'utility',
  },
  {
    path: '/utilities/unit-converter',
    title: 'Civil Engineering Unit Converter | Online Tool | CivilMath',
    description: 'Instantly convert civil engineering units between SI metric and US imperial systems for pressure, force, stress, moment, length, area, volume, and density.',
    keywords: ['unit converter engineering', 'pressure converter', 'stress conversion ksi mpa', 'civil unit calculator'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'utility',
    isCalculator: true,
  },
  {
    path: '/bbs',
    title: 'Bar Bending Schedule Calculators | BBS Generator | CivilMath',
    description: 'Generate accurate bar bending schedules for footings, beams, columns, slabs, stairs, and retaining walls with cutting lengths, weights, and export options.',
    keywords: ['bar bending schedule', 'bbs calculator', 'rebar schedule generator', 'rebar cutting length'],
    priority: 0.7,
    changefreq: 'weekly',
    category: 'bbs',
  },
  {
    path: '/bbs/footing',
    title: 'Footing BBS Calculator | Isolated Pad Detailing | CivilMath',
    description: 'Generate isolated pad footing bar bending schedules with main and distribution bar cutting lengths, hook deductions, total rebar weights, and shape codes.',
    keywords: ['footing bbs calculator', 'isolated footing rebar schedule', 'pad footing reinforcement', 'cutting length footing'],
    priority: 0.9,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/bbs/combined-footing',
    title: 'Combined Footing BBS Calculator | Rebar Schedule | CivilMath',
    description: 'Calculate rebar cutting lengths, top and bottom mesh schedules, and weight estimates for multi-column combined reinforced concrete foundations on CivilMath.',
    keywords: ['combined footing bbs', 'combined foundation rebar', 'multi column footing bbs', 'rebar schedule'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/bbs/strip-footing',
    title: 'Strip Footing BBS Calculator | Wall Foundation | CivilMath',
    description: 'Compute longitudinal and transverse reinforcement schedules, lap splices, and total steel weight for continuous wall and strip foundations with CivilMath.',
    keywords: ['strip footing bbs', 'wall footing rebar schedule', 'continuous footing reinforcement', 'strip foundation bbs'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/bbs/raft-foundation',
    title: 'Raft Foundation BBS Calculator | Mat Detailing | CivilMath',
    description: 'Generate complete raft and mat foundation rebar cutting schedules including top/bottom dual-layer reinforcement, spacing, chair supports, and total tonnage.',
    keywords: ['raft foundation bbs', 'mat foundation rebar schedule', 'raft slab steel calculation', 'chair bar calculator'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/bbs/beam',
    title: 'Beam BBS Calculator | Top, Bottom & Stirrups | CivilMath',
    description: 'Calculate RC beam rebar cutting lengths, top and bottom main bars, shear stirrup spacing, and bend deductions with ACI and BS code detailing standards.',
    keywords: ['beam bbs calculator', 'rc beam rebar schedule', 'stirrup cutting length', 'beam reinforcement detailing'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/bbs/plinth-beam',
    title: 'Plinth Beam BBS Calculator | Grade Beam Rebar | CivilMath',
    description: 'Generate reinforcement bar bending schedules for ground and plinth level grade beams including longitudinal tension steel, stirrup ties, and lap splices.',
    keywords: ['plinth beam bbs', 'grade beam rebar schedule', 'ground beam reinforcement', 'plinth beam cutting length'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/bbs/tie-beam',
    title: 'Tie Beam BBS Calculator | Column Connection Ties | CivilMath',
    description: 'Calculate tie beam bar bending schedules for connecting column pedestals and foundation footings. Computes straight bars, development hooks, and ties.',
    keywords: ['tie beam bbs', 'tie beam rebar schedule', 'connecting beam reinforcement', 'tie beam cutting length'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/bbs/lintel-beam',
    title: 'Lintel Beam BBS Calculator | Opening Rebar | CivilMath',
    description: 'Determine reinforcement requirements, clear span bearings, top and bottom bar cutting lengths, and shear stirrups for masonry door and window lintel beams.',
    keywords: ['lintel beam bbs', 'lintel rebar schedule', 'window lintel reinforcement', 'door lintel beam'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/bbs/column',
    title: 'Column BBS Calculator | Vertical Bars & Ties | CivilMath',
    description: 'Generate column rebar bending schedules for longitudinal starter bars, main verticals, lap splices, and lateral tie configurations per structural codes.',
    keywords: ['column bbs calculator', 'column rebar schedule', 'column lateral ties', 'vertical bar cutting length'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/bbs/pedestal',
    title: 'Pedestal BBS Calculator | Concrete Footing Stubs | CivilMath',
    description: 'Compute starter dowels, main vertical reinforcement, and perimeter ties for concrete footing pedestals supporting steel baseplates or precast columns.',
    keywords: ['pedestal bbs calculator', 'column stub rebar', 'footing pedestal reinforcement', 'starter bar schedule'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/bbs/slab',
    title: 'Slab BBS Calculator | One-Way & Two-Way Mesh | CivilMath',
    description: 'Calculate main bars, distribution steel, cranked bent-up bars, and chair supports for one-way and two-way reinforced concrete floor slabs on CivilMath.',
    keywords: ['slab bbs calculator', 'two way slab rebar schedule', 'one way slab bbs', 'cranked bar cutting length'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/bbs/staircase',
    title: 'Staircase BBS Calculator | Waist Slab Rebar | CivilMath',
    description: 'Calculate waist slab main flight rebar, landing reinforcement, riser-tread step bars, and anchorage hooks for dog-legged and straight RC flight stairs.',
    keywords: ['staircase bbs calculator', 'stair waist slab reinforcement', 'dog legged stair rebar', 'stair flight cutting length'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/bbs/retaining-wall',
    title: 'Retaining Wall BBS Calculator | Stem & Base | CivilMath',
    description: 'Generate bar bending schedules for cantilever retaining walls including vertical stem reinforcement, temperature distribution bars, and footing base steel.',
    keywords: ['retaining wall bbs', 'cantilever wall rebar schedule', 'stem reinforcement detailing', 'base slab rebar'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/bbs/foundation-mesh',
    title: 'Foundation Mesh BBS Calculator | Mat Rebar Grid | CivilMath',
    description: 'Compute welded wire and tied rebar mesh reinforcement schedules for ground-supported slabs, mud slabs, and mat foundation blinding layers with CivilMath.',
    keywords: ['foundation mesh bbs', 'rebar mesh calculator', 'ground slab reinforcement', 'welded wire mesh schedule'],
    priority: 0.8,
    changefreq: 'weekly',
    category: 'bbs',
    isCalculator: true,
  },
  {
    path: '/articles',
    title: 'Civil Engineering Calculation Articles & Guides | CivilMath',
    description: 'Explore step-by-step engineering articles, formulas, and practical calculation guides for concrete, rebar BBS schedules, beam design, and surveying.',
    keywords: ['civil engineering articles', 'calculation guides', 'concrete formulas', 'rebar bbs tutorial', 'structural guides'],
    priority: 0.8,
    changefreq: 'weekly',
  },
  {
    path: '/guides',
    title: 'Civil Engineering Calculation Guides & How-Tos | CivilMath',
    description: 'Practical step-by-step calculation guides and reference tutorials for concrete volume, rebar weight formulas, brickwork estimating, and traverse surveying.',
    keywords: ['civil engineering guides', 'concrete volume guide', 'rebar formula tutorial', 'engineering how to'],
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/guides/concrete-volume-calculation',
    title: 'Concrete Volume Calculation Guide & Formula | CivilMath',
    description: 'Step-by-step engineering guide for calculating concrete volume in slabs, footings, and columns with wet-to-dry conversion ratios and material shrinkage.',
    keywords: ['how to calculate concrete volume', 'concrete volume formula', 'slab concrete calculation', 'dry mix ratio'],
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/guides/rebar-weight-formula',
    title: 'Rebar Weight Calculation Formula (D²/162) | CivilMath Guide',
    description: 'Learn how to calculate unit and total rebar weight using the standard D²/162 metric formula and imperial equivalents for reinforced concrete construction.',
    keywords: ['d2 162 formula', 'rebar weight formula', 'calculate steel bar weight', 'rebar weight per meter'],
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/guides/brickwork-quantity',
    title: 'Brickwork & Mortar Quantity Calculation Guide | CivilMath',
    description: 'Comprehensive guide to calculating the exact number of bricks, mortar volume, and cement bags required for standard 9-inch and 4.5-inch masonry walls.',
    keywords: ['how to calculate bricks in wall', 'brickwork mortar quantity', 'cement bags brick wall', 'masonry calculation'],
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/guides/coordinate-traverse-basics',
    title: 'Coordinate Traverse Surveying & Balancing Guide | CivilMath',
    description: 'Understand closed traverse surveying computations, latitude and departure balancing with Bowditch rule, and coordinate calculation steps on CivilMath.',
    keywords: ['coordinate traverse guide', 'bowditch rule explanation', 'latitude departure survey', 'closed traverse balancing'],
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/formulas',
    title: 'Civil Engineering Formulas & Calculation Library | CivilMath',
    description: 'Quick reference library of civil, structural, geotechnical, and surveying engineering equations and mathematical formulas with interactive tools on CivilMath.',
    keywords: ['civil engineering formulas', 'structural formulas', 'geotechnical equations', 'surveying formulas library'],
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/tables',
    title: 'Civil Engineering Reference Tables & Converters | CivilMath',
    description: 'Comprehensive engineering reference tables for unit conversion factors, rebar cross-sectional areas, standard hook lengths, and concrete density ratings.',
    keywords: ['engineering reference tables', 'rebar area table', 'unit conversion tables', 'concrete density chart'],
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/about',
    title: 'About CivilMath',
    description: 'Learn about CivilMath — a practical civil engineering calculation and knowledge platform designed to make technical construction knowledge easier to understand, calculate and apply.',
    keywords: ['about civilmath', 'civil engineering tools mission', 'free civil calculators team'],
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/contact',
    title: 'Contact CivilMath',
    description: 'Have a question, found an issue, or want to suggest an improvement? Get in touch with the CivilMath engineering team.',
    keywords: ['contact civilmath', 'civil engineering support', 'calculator feedback'],
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | CivilMath',
    description: 'CivilMath privacy policy. Clear disclosures regarding locally stored project data, technical information, Google AdSense cookies, and user privacy rights.',
    keywords: ['civilmath privacy policy', 'data security', 'user privacy'],
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/terms',
    title: 'Terms & Conditions | CivilMath',
    description: 'Terms and conditions for accessing and using CivilMath educational civil engineering calculators, formulas, technical guides, and planning utilities.',
    keywords: ['terms of use', 'service agreement', 'civilmath terms'],
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/disclaimer',
    title: 'Disclaimer | CivilMath',
    description: 'Engineering disclaimer and limitation of liability for CivilMath. All calculations are preliminary estimates requiring licensed Professional Engineer verification.',
    keywords: ['engineering disclaimer', 'calculation assumptions', 'professional verification'],
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/cookie-policy',
    title: 'Cookie Policy | CivilMath',
    description: 'Learn how CivilMath uses essential cookies, local storage, analytics, and Google advertising technologies, with controls to manage your preferences.',
    keywords: ['cookie policy', 'browser cookies', 'advertising cookies', 'opt out'],
    priority: 0.5,
    changefreq: 'monthly',
  },
  {
    path: '/faq',
    title: 'Frequently Asked Questions (FAQ) | CivilMath Help',
    description: 'Find answers to common questions about CivilMath engineering calculators, formulas, design codes (ACI 318, BS 8666), unit conversions, and report exports.',
    keywords: ['civilmath faq', 'engineering calculator questions', 'concrete formula questions', 'aci 318 calculator faq'],
    priority: 0.5,
    changefreq: 'monthly',
  },
];

export function getRouteSEO(path: string): RouteSEOConfig | undefined {
  const normalized = path.replace(/\/+$/, '') || '/';
  return ALL_ROUTES_SEO.find(r => r.path === normalized);
}
