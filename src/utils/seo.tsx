import { Helmet } from 'react-helmet-async';
import { ReactNode } from 'react';

import { CalculatorCategory } from '../types';
import { CALCULATORS_LIST } from '../data/calculatorsData';

import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_IMAGE,
  TWITTER_HANDLE,
  RouteSEOConfig,
  ALL_ROUTES_SEO,
  getRouteSEO
} from './seoRoutes';
export * from './seoRoutes';

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

