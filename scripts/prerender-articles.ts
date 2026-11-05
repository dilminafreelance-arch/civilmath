/**
 * prerender-articles.ts — full SEO + instant-loading article & directory pages.
 *
 * Runs at the end of `npm run build`:
 *   1. Saves the clean Vite HTML shell into `dist/_shell.html` and `api/_lib/htmlShell.js`
 *      so dynamic serverless rendering (`/api/articles?slug=...&render=html`) always has
 *      the exact Vite asset bundles for newly published Supabase articles.
 *   2. Fetches all published articles (with full content) from Supabase or live API
 *      (hydrating any content-less summaries via `/api/articles?slug=<slug>`).
 *   3. Writes `dist/articles/<slug>/index.html` for every published article with:
 *      - Full <head> SEO metadata (title, description, canonical, OG, Twitter)
 *      - TechArticle + BreadcrumbList + FAQPage JSON-LD structured data
 *      - Full semantic HTML (<article>, <h1>, body, FAQs, related links) inside #root
 *      - Embedded <script id="ssr-article-data" type="application/json"> for 0ms hydration
 *   4. Writes `dist/articles/index.html` with all published article links (<a href="/articles/<slug>">)
 *      and CollectionPage + ItemList JSON-LD so crawlers discover every article immediately.
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { rowToArticle } from '../api/_lib/articleMapper.js';
import {
  renderArticlePageHtml,
  renderArticlesDirectoryHtml,
} from '../api/_lib/articleSsr.js';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const SITE_URL = 'https://civilmath.com';

function extractCleanViteShell(distIndexHtml: string): string {
  let shell = distIndexHtml;
  shell = shell.replace(/<div id="cm-splash"[\s\S]*?(?=<div id="root">)/i, '');
  shell = shell.replace(/<div\s+id=["']root["'][^>]*>[\s\S]*?<\/div>/i, '<div id="root"></div>');
  return shell;
}

function persistHtmlShell(shellHtml: string) {
  try {
    fs.writeFileSync(path.join(DIST_DIR, '_shell.html'), shellHtml, 'utf8');
  } catch (e: any) {
    console.warn('[prerender-articles] Could not write dist/_shell.html:', e?.message);
  }
  try {
    const jsModulePath = path.resolve(process.cwd(), 'api', '_lib', 'htmlShell.js');
    const jsContent =
      `// Auto-updated during \`npm run build\` by scripts/prerender-articles.ts\n` +
      `export const SHELL_HTML = ${JSON.stringify(shellHtml)};\n` +
      `export default SHELL_HTML;\n`;
    fs.writeFileSync(jsModulePath, jsContent, 'utf8');
  } catch (e: any) {
    console.warn('[prerender-articles] Could not update api/_lib/htmlShell.js:', e?.message);
  }
}

async function hydrateMissingContent(articles: any[]): Promise<any[]> {
  const needsContent = articles.filter(
    (a) =>
      a &&
      a.slug &&
      (!a.content ||
        !(a.blocks && a.blocks.length) && !a.content ||
        !String(a.coverImage || '').startsWith('data:'))
  );
  if (needsContent.length === 0) return articles;

  console.log(`[prerender-articles] Hydrating full content for ${needsContent.length} articles via ?slug=...`);
  const concurrency = 8;
  const bySlug = new Map<string, any>();

  for (let i = 0; i < needsContent.length; i += concurrency) {
    const batch = needsContent.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (item) => {
        try {
          const res = await fetch(`${SITE_URL}/api/articles?slug=${encodeURIComponent(item.slug)}&rawCover=true`);
          if (res.ok) {
            const full = await res.json();
            if (full && full.slug) {
              bySlug.set(String(item.slug).toLowerCase(), rowToArticle(full));
            }
          }
        } catch {
          // ignore individual failure
        }
      })
    );
  }

  return articles.map((a) => {
    const key = String(a?.slug || '').toLowerCase();
    return bySlug.get(key) || a;
  });
}

function writeArticleCoverFiles(articles: any[]): number {
  const coversDir = path.join(DIST_DIR, 'article-covers');
  fs.mkdirSync(coversDir, { recursive: true });
  let count = 0;
  for (const article of articles) {
    if (!article || !article.slug) continue;
    const rawCover = String(article.coverImage || article.coverImageUrl || '').trim();
    const m = rawCover.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,([\s\S]+)$/);
    if (!m) continue;
    try {
      const buf = Buffer.from(m[1], 'base64');
      const target = path.join(coversDir, `${article.slug}.webp`);
      fs.writeFileSync(target, buf);
      count++;
    } catch (e: any) {
      console.warn(`[prerender-articles] Failed writing cover for ${article.slug}:`, e?.message);
    }
  }
  return count;
}

async function fetchFullArticles(): Promise<any[]> {
  // 1) Direct Supabase read when credentials are available (fastest & complete)
  const supaUrl = process.env.SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supaUrl && supaKey) {
    try {
      const supabase = createClient(supaUrl, supaKey);
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .or('published.eq.true,published.is.null')
        .order('published_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        console.log(`[prerender-articles] Fetched ${data.length} full articles from Supabase.`);
        return data.map((r) => rowToArticle(r)).filter(Boolean);
      }
      console.warn('[prerender-articles] Supabase query returned 0 or error:', error?.message ?? 'empty');
    } catch (e: any) {
      console.warn('[prerender-articles] Supabase fetch failed:', e?.message);
    }
  }

  // 2) Live API fallback (hydrating full content per slug if bulk returns summaries)
  try {
    const res = await fetch(`${SITE_URL}/api/articles?bulk=true`);
    if (res.ok) {
      const json: any = await res.json();
      const list: any[] = Array.isArray(json) ? json : json.articles ?? json.data ?? [];
      if (list.length > 0) {
        console.log(`[prerender-articles] Fetched ${list.length} articles from live API.`);
        const mapped = list.map((r) => rowToArticle(r)).filter(Boolean);
        return await hydrateMissingContent(mapped);
      }
    }
  } catch (e: any) {
    console.warn('[prerender-articles] Live API fetch failed:', e?.message);
  }

  return [];
}

async function main() {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('[prerender-articles] dist/index.html not found. Run `vite build` first.');
    process.exit(1);
  }

  const rawIndex = fs.readFileSync(indexPath, 'utf8');
  const shellHtml = extractCleanViteShell(rawIndex);
  persistHtmlShell(shellHtml);

  const allArticles = await fetchFullArticles();
  const publishedArticles = allArticles.filter(
    (a) => a && a.slug && a.status !== 'draft' && !a.seo?.noindex
  );

  const coversWritten = writeArticleCoverFiles(publishedArticles);
  console.log(`[prerender-articles] Extracted ${coversWritten} static article cover images into dist/article-covers/.`);

  // 1. Prerender /articles directory page with all internal article links + embedded list JSON
  try {
    const dirTarget = path.join(DIST_DIR, 'articles', 'index.html');
    fs.mkdirSync(path.dirname(dirTarget), { recursive: true });
    const dirHtml = renderArticlesDirectoryHtml(shellHtml, publishedArticles);
    fs.writeFileSync(dirTarget, dirHtml, 'utf8');
    console.log(`[prerender-articles] Prerendered /articles directory with ${publishedArticles.length} article links.`);
  } catch (e: any) {
    console.warn('[prerender-articles] Failed to prerender /articles directory:', e?.message);
  }

  // 2. Prerender each /articles/<slug>/index.html with full SEO head, JSON-LD, body & embedded JSON
  let written = 0;
  let skipped = 0;
  for (const article of publishedArticles) {
    try {
      const targetFile = path.join(DIST_DIR, 'articles', article.slug, 'index.html');
      fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      const out = renderArticlePageHtml(shellHtml, article, publishedArticles);
      fs.writeFileSync(targetFile, out, 'utf8');
      written++;
    } catch (e: any) {
      console.warn(`[prerender-articles] Failed for ${article.slug}:`, e?.message);
      skipped++;
    }
  }
  console.log(`[prerender-articles] Prerendered ${written} full article pages (${skipped} skipped).`);
}

main().catch((e) => {
  console.error('[prerender-articles] Fatal:', e?.message);
  process.exit(0);
});
