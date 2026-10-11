/**
 * prerender-articles.ts — instant-loading article pages (no browser needed).
 *
 * Problem: /articles/<slug> shipped the empty SPA shell (<div id="root"></div>).
 * The article body only appeared after JS boot + an /api round-trip, so direct
 * visits (and crawlers) saw a spinner instead of content.
 *
 * Fix: at build time (after inject-seo-meta.ts has written per-article HTML
 * files with SEO meta), this script embeds for every published article:
 *   1. The full article JSON in <script id="ssr-article-data" type="application/json">
 *      -> ArticleDetailPageV2 renders instantly from it via getCachedArticleSync,
 *         no API wait, no loading spinner. Background refresh still fetches fresh data.
 *   2. Server-rendered article HTML inside #root with critical inline CSS
 *      -> content is visible even before JS executes; crawlers see full text.
 *
 * Data source mirrors inject-seo-meta.ts: live API bulk first, Supabase direct
 * as fallback. Never fails the build.
 *
 * Build order: vite build && ... && tsx scripts/inject-seo-meta.ts && tsx scripts/prerender-articles.ts
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { rowToArticle } from '../api/_lib/articleMapper.js';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const SITE_URL = 'https://civilmath.com';
const JSON_ID = 'ssr-article-data';

const CRITICAL_CSS = `
.ssr-wrap{max-width:48rem;margin:0 auto;padding:1.5rem 1.25rem 4rem;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#20231F;line-height:1.75}
.ssr-topbar{display:flex;align-items:center;justify-content:space-between;padding:.75rem 0;margin-bottom:1.5rem;border-bottom:1px solid #e7e5e0}
.ssr-topbar a.brand{font-weight:800;font-size:1.05rem;color:#20231F;text-decoration:none;letter-spacing:-.02em}
.ssr-topbar a.home{font-size:.8rem;color:#657565;text-decoration:none}
.ssr-crumb{font-size:.75rem;color:#7B8978;margin-bottom:1rem}
.ssr-crumb a{color:#657565;text-decoration:none}
.ssr-wrap h1{font-size:1.9rem;line-height:1.25;font-weight:800;letter-spacing:-.02em;margin:0 0 .75rem}
.ssr-meta{font-size:.8rem;color:#7B8978;margin-bottom:1.25rem}
.ssr-cover{width:100%;border-radius:1rem;margin:0 0 1.75rem;display:block}
.ssr-excerpt{font-size:1.05rem;color:#3d443c;border-left:3px solid #657565;padding-left:1rem;margin:0 0 1.75rem}
.ssr-body{font-size:1rem}
.ssr-body h2{font-size:1.4rem;font-weight:700;margin:2.25rem 0 .9rem;letter-spacing:-.01em}
.ssr-body h3{font-size:1.15rem;font-weight:700;margin:1.75rem 0 .7rem}
.ssr-body p{margin:0 0 1.1rem}
.ssr-body ul,.ssr-body ol{margin:0 0 1.1rem;padding-left:1.5rem}
.ssr-body li{margin-bottom:.45rem}
.ssr-body strong{font-weight:700}
.ssr-body table{width:100%;border-collapse:collapse;font-size:.9rem;margin:0}
.ssr-body th,.ssr-body td{border:1px solid #e7e5e0;padding:.55rem .75rem;text-align:left}
.ssr-body th{background:#f4f3f0;font-weight:700}
.ssr-table-wrap{margin:1.5rem 0;overflow-x:auto;border:1px solid #e7e5e0;border-radius:.75rem}
.ssr-body img{max-width:100%;border-radius:.75rem}
.ssr-body blockquote{border-left:3px solid #657565;padding-left:1rem;color:#3d443c;margin:0 0 1.1rem}
.ssr-tags{margin-top:2.5rem;display:flex;flex-wrap:wrap;gap:.5rem}
.ssr-tags span{font-size:.75rem;background:#f4f3f0;border-radius:9999px;padding:.3rem .8rem;color:#536153}
.ssr-note{margin-top:3rem;padding-top:1.25rem;border-top:1px solid #e7e5e0;font-size:.8rem;color:#7B8978}
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

/** Mirror of HtmlArticleRenderer's table handling so static HTML matches. */
function prepareStaticHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  let html = rawHtml;
  html = html.replace(/(<table[\s\S]*?<\/table>)/gi, (m) => {
    if (/ssr-table-wrap/.test(m)) return m;
    return `<div class="ssr-table-wrap">${m}</div>`;
  });
  return html;
}

function renderStaticArticle(a: any): string {
  const title = escHtml(a.title || 'Untitled Article');
  const excerpt = escHtml(a.excerpt || '');
  const author = escHtml(a.author || 'CivilMath Engineering Editorial Team');
  const date = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const readTime = a.readTimeMinutes ? `${a.readTimeMinutes} min read` : '';
  const cover = a.coverImage || a.coverImageUrl || '';
  const tags: string[] = Array.isArray(a.tags) ? a.tags : [];
  const body = prepareStaticHtml(a.content || '');

  return `<div class="ssr-wrap">`
    + `<header class="ssr-topbar"><a class="brand" href="/">CivilMath</a><a class="home" href="/articles">All articles</a></header>`
    + `<nav class="ssr-crumb"><a href="/">Home</a> / <a href="/articles">Articles</a> / ${title}</nav>`
    + `<h1>${title}</h1>`
    + `<p class="ssr-meta">By ${author}${date ? ` &middot; ${escHtml(date)}` : ''}${readTime ? ` &middot; ${escHtml(readTime)}` : ''}</p>`
    + (cover ? `<img class="ssr-cover" src="${escAttr(cover)}" alt="${escAttr(a.title || 'Article cover')}" loading="eager" />` : '')
    + (excerpt ? `<p class="ssr-excerpt">${excerpt}</p>` : '')
    + `<div class="ssr-body">${body}</div>`
    + (tags.length ? `<div class="ssr-tags">${tags.map((t) => `<span>#${escHtml(t)}</span>`).join('')}</div>` : '')
    + `<p class="ssr-note">This is a static preview. The interactive version with calculators loads automatically.</p>`
    + `</div>`;
}

function injectIntoHtml(html: string, article: any): string {
  // 1. Embed article JSON for instant client render (escape </script>).
  const json = JSON.stringify(article).replace(/<\//g, '<\\/');
  const jsonTag = `<script id="${JSON_ID}" type="application/json">${json}</script>`;

  // 2. Static article HTML inside #root + critical CSS in head.
  const staticHtml = renderStaticArticle(article);
  const styleTag = `<style>${CRITICAL_CSS}</style>`;

  let out = html;
  if (out.includes('</head>')) {
    out = out.replace('</head>', `${styleTag}</head>`);
  }
  const rootRe = /<div id="root"><\/div>/;
  if (rootRe.test(out)) {
    out = out.replace(rootRe, `<div id="root">${staticHtml}</div>`);
  } else {
    // Fallback: prepend static content before scripts if root isn't empty-shell shaped.
    out = out.replace('<div id="root">', `<div id="root">${staticHtml}`);
  }
  if (out.includes('</body>')) {
    out = out.replace('</body>', `${jsonTag}</body>`);
  } else {
    out += jsonTag;
  }
  return out;
}

async function fetchArticleRows(): Promise<any[]> {
  // 1) Live API (previous production deployment) — most reliable at build time.
  try {
    const res = await fetch(`${SITE_URL}/api/articles?bulk=true`);
    if (res.ok) {
      const json: any = await res.json();
      const list: any[] = Array.isArray(json) ? json : json.articles ?? json.data ?? [];
      if (list.length > 0) {
        console.log(`[prerender-articles] Fetched ${list.length} rows from live API.`);
        return list;
      }
    }
  } catch (e: any) {
    console.warn('[prerender-articles] Live API fetch failed:', e?.message);
  }
  // 2) Direct Supabase.
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supaUrl && supaKey) {
    try {
      const supabase = createClient(supaUrl, supaKey);
      const { data, error } = await supabase.from('articles').select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        console.log(`[prerender-articles] Fetched ${data.length} rows from Supabase.`);
        return data;
      }
      console.warn('[prerender-articles] Supabase query failed or empty:', error?.message ?? 'empty');
    } catch (e: any) {
      console.warn('[prerender-articles] Supabase fetch failed:', e?.message);
    }
  }
  return [];
}

async function main() {
  let written = 0;
  let skipped = 0;
  const rows = await fetchArticleRows();
  for (const row of rows) {
    let article: any;
    try {
      article = rowToArticle(row);
    } catch {
      continue;
    }
    if (!article || !article.slug) continue;
    if (article.status === 'draft' || article.seo?.noindex) {
      skipped++;
      continue;
    }
    const targetFile = path.join(DIST_DIR, 'articles', article.slug, 'index.html');
    if (!fs.existsSync(targetFile)) {
      console.warn(`[prerender-articles] No HTML for slug ${article.slug}; skipping.`);
      skipped++;
      continue;
    }
    try {
      const html = fs.readFileSync(targetFile, 'utf8');
      const out = injectIntoHtml(html, article);
      fs.writeFileSync(targetFile, out, 'utf8');
      written++;
    } catch (e: any) {
      console.warn(`[prerender-articles] Failed for ${article.slug}:`, e?.message);
      skipped++;
    }
  }
  console.log(`[prerender-articles] Embedded instant-load content for ${written} articles (${skipped} skipped).`);
}

main().catch((e) => {
  // Never fail the deployment over prerendering.
  console.error('[prerender-articles] Fatal:', e?.message);
  process.exit(0);
});
