/**
 * inject-seo-meta.ts
 *
 * Build-time SEO meta injection — no browser required.
 *
 * Problem it solves:
 *   The Playwright prerender step (scripts/prerender.ts) is skipped on Vercel
 *   builds (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1, no browser available), so every
 *   route — including /articles/<slug> — was served the generic SPA shell with
 *   no <meta name="description">, no Open Graph tags and no canonical link.
 *   Audit tools and non-JS crawlers therefore scored the site poorly.
 *
 * What this script does (runs after `vite build`, after prerender):
 *   1. Takes dist/index.html (the SPA shell) as the base template.
 *   2. For every route in ALL_ROUTES_SEO, writes dist/<route>/index.html with
 *      that route's title / description / keywords / canonical / OG / Twitter
 *      tags injected into <head>.
 *   3. Fetches published articles (Supabase direct, falling back to the live
 *      /api/articles?bulk=true endpoint) and writes
 *      dist/articles/<slug>/index.html per article, mirroring the runtime
 *      SEOHead mapping (seoTitle/metaDescription/canonicalUrl/ogImage).
 *   4. All injected tags carry data-rh="true" so react-helmet-async recognises
 *      them as server-rendered on hydration and takes them over instead of
 *      duplicating them.
 *   5. Existing SEO tags are stripped before injection, so the script is
 *      idempotent and safe to run over prerendered pages too.
 *
 * The script never fails the build: article fetching degrades gracefully
 * (static routes are always injected).
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  ALL_ROUTES_SEO,
  SITE_URL,
  SITE_NAME,
  DEFAULT_IMAGE,
  TWITTER_HANDLE,
} from '../src/utils/seoRoutes';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

function esc(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(value: string): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  canonical: string;
  ogType: 'website' | 'article';
  ogImage: string;
  noindex?: boolean;
}

function headTags(m: PageMeta): string {
  const lines: string[] = [
    `<meta name="description" content="${esc(m.description)}" data-rh="true" />`,
  ];
  if (m.keywords) {
    lines.push(`<meta name="keywords" content="${esc(m.keywords)}" data-rh="true" />`);
  }
  if (m.noindex) {
    lines.push(`<meta name="robots" content="noindex, nofollow" data-rh="true" />`);
  } else {
    lines.push(`<link rel="canonical" href="${esc(m.canonical)}" data-rh="true" />`);
  }
  lines.push(
    `<meta property="og:title" content="${esc(m.title)}" data-rh="true" />`,
    `<meta property="og:description" content="${esc(m.description)}" data-rh="true" />`,
    `<meta property="og:url" content="${esc(m.canonical)}" data-rh="true" />`,
    `<meta property="og:image" content="${esc(m.ogImage)}" data-rh="true" />`,
    `<meta property="og:type" content="${m.ogType}" data-rh="true" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" data-rh="true" />`,
    `<meta name="twitter:card" content="summary_large_image" data-rh="true" />`,
    `<meta name="twitter:site" content="${esc(TWITTER_HANDLE)}" data-rh="true" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" data-rh="true" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" data-rh="true" />`,
    `<meta name="twitter:image" content="${esc(m.ogImage)}" data-rh="true" />`,
  );
  return lines.join('\n    ');
}

/** Remove existing SEO tags so injection is idempotent and duplicate-free. */
function stripSeoTags(html: string): string {
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/i, '<title></title>');
  out = out.replace(/<meta[^>]+name=["'](?:description|keywords|robots)["'][^>]*\/?>/gi, '');
  out = out.replace(
    /<meta[^>]+(?:property=["']og:[^"']+["']|name=["']twitter:[^"']+["'])[^>]*\/?>/gi,
    '',
  );
  out = out.replace(/<link[^>]+rel=["']canonical["'][^>]*\/?>/gi, '');
  return out;
}

function injectMeta(html: string, meta: PageMeta): string {
  let out = stripSeoTags(html);
  out = out.replace(/<title><\/title>/i, `<title>${esc(meta.title)}</title>`);
  out = out.replace(/<\/head>/i, `    ${headTags(meta)}\n  </head>`);
  return out;
}

function resolveOgImage(raw: unknown): string {
  const v = String(raw ?? '').trim();
  // data: URIs are not valid og:image values — fall back to the default image.
  if (!v || v.startsWith('data:') || v.length > 2000) return DEFAULT_IMAGE;
  return v;
}

function mapArticleRow(row: any): PageMeta & { slug: string } | null {
  const slug = row?.slug;
  if (!slug) return null;
  let meta: any = {};
  if (typeof row.summary === 'string' && row.summary.trim().startsWith('{')) {
    try {
      meta = JSON.parse(row.summary);
    } catch {
      meta = { excerpt: row.summary };
    }
  } else if (row.summary) {
    meta = { excerpt: row.summary };
  }
  const title = String(row.title || 'Untitled Article').trim();
  const excerpt = stripHtml(row.excerpt || meta.excerpt || '') || title;
  const seoTitle = String(meta.seo?.seoTitle || `${title} | CivilMath`).trim();
  const description = stripHtml(meta.seo?.metaDescription || excerpt).slice(0, 300) || seoTitle;
  const canonical = String(
    meta.seo?.canonicalUrl || `${SITE_URL}/articles/${slug}`,
  ).trim();
  const tags = Array.isArray(row.tags) && row.tags.length ? row.tags.join(', ') : undefined;
  return {
    slug,
    title: seoTitle,
    description,
    keywords: tags,
    canonical,
    ogType: 'article',
    ogImage: resolveOgImage(row.image_url || meta.seo?.ogImage),
    noindex: Boolean(meta.seo?.noindex),
  };
}

async function fetchArticles(): Promise<(PageMeta & { slug: string })[]> {
  // 1) Direct Supabase read (build env provides these on Vercel).
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supaUrl && supaKey) {
    try {
      const supabase = createClient(supaUrl, supaKey);
      const { data, error } = await supabase
        .from('articles')
        .select('slug,title,summary,image_url,tags,published')
        .eq('published', true);
      if (!error && Array.isArray(data)) {
        console.log(`[inject-seo-meta] Fetched ${data.length} articles from Supabase.`);
        return data
          .map(mapArticleRow)
          .filter((a): a is PageMeta & { slug: string } => a !== null);
      }
      console.warn('[inject-seo-meta] Supabase query failed:', error?.message);
    } catch (e: any) {
      console.warn('[inject-seo-meta] Supabase fetch failed:', e?.message);
    }
  } else {
    console.warn(
      '[inject-seo-meta] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set; trying live API.',
    );
  }

  // 2) Live API fallback (previous production deployment).
  try {
    const res = await fetch(`${SITE_URL}/api/articles?bulk=true`);
    if (res.ok) {
      const json: any = await res.json();
      const list: any[] = Array.isArray(json) ? json : json.articles ?? json.data ?? [];
      const mapped = list
        .map((a: any): (PageMeta & { slug: string }) | null => {
          if (!a?.slug) return null;
          const slug = String(a.slug);
          const title = String(a.seo?.seoTitle || (a.title ? `${a.title} | CivilMath` : 'Untitled | CivilMath'));
          const description =
            stripHtml(a.seo?.metaDescription || a.excerpt || a.title || '').slice(0, 300) || title;
          return {
            slug,
            title,
            description,
            keywords: Array.isArray(a.tags) ? a.tags.join(', ') : undefined,
            canonical: String(a.seo?.canonicalUrl || `${SITE_URL}/articles/${slug}`),
            ogType: 'article' as const,
            ogImage: resolveOgImage(a.seo?.ogImage || a.coverImage),
            noindex: Boolean(a.seo?.noindex),
          };
        })
        .filter((a): a is PageMeta & { slug: string } => a !== null);
      console.log(`[inject-seo-meta] Fetched ${mapped.length} articles from live API.`);
      return mapped;
    }
    console.warn('[inject-seo-meta] Live API returned status', res.status);
  } catch (e: any) {
    console.warn('[inject-seo-meta] Live API fetch failed:', e?.message);
  }

  console.warn('[inject-seo-meta] No article source available; article pages keep SPA shell meta.');
  return [];
}

async function main() {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('[inject-seo-meta] dist/index.html not found. Run `vite build` first.');
    process.exit(1);
  }
  const shell = fs.readFileSync(indexPath, 'utf8');

  const pages: { routePath: string; meta: PageMeta }[] = ALL_ROUTES_SEO.map((r) => ({
    routePath: r.path,
    meta: {
      title: r.title,
      description: r.description,
      keywords: r.keywords?.join(', '),
      canonical: r.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${r.path}`,
      ogType: 'website',
      ogImage: DEFAULT_IMAGE,
    },
  }));

  const articles = await fetchArticles();
  for (const a of articles) {
    pages.push({ routePath: `/articles/${a.slug}`, meta: a });
  }

  let written = 0;
  for (const { routePath, meta } of pages) {
    try {
      const targetFile =
        routePath === '/'
          ? indexPath
          : path.join(DIST_DIR, routePath.replace(/^\//, ''), 'index.html');
      // If a prerendered page already exists (browser builds), merge meta into it;
      // otherwise derive from the SPA shell.
      const base =
        routePath !== '/' && fs.existsSync(targetFile)
          ? fs.readFileSync(targetFile, 'utf8')
          : shell;
      const out = injectMeta(base, meta);
      if (routePath !== '/') fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      fs.writeFileSync(targetFile, out, 'utf8');
      written++;
    } catch (e: any) {
      console.warn(`[inject-seo-meta] Skipped ${routePath}:`, e?.message);
    }
  }
  console.log(`[inject-seo-meta] Wrote SEO meta for ${written} pages.`);
}

main().catch((e) => {
  // Never fail the deployment over SEO meta injection.
  console.error('[inject-seo-meta] Fatal:', e?.message);
  process.exit(0);
});
