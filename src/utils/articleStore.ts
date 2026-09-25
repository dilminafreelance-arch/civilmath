import { Article, ArticleCategory } from '../types/article';
import { BUILTIN_ARTICLES_MANIFEST, convertArticleDataToArticle } from '../data/articlesManifest';
import { autoGenerateSeo } from './autoSeo';

const LOCAL_STORAGE_KEY = 'civilmath_custom_articles_v1';

// In-memory cache for full loaded articles
const articleCache: Map<string, Article> = new Map();

// Helper to retrieve admin auth token from storage
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('civilmath_admin_token') || sessionStorage.getItem('civilmath_admin_token');
  } catch {
    return null;
  }
}

// Helper to construct authorization headers for admin endpoints
export function getAdminAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAdminToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Reads a File object and uploads it to the server (or returns data URI fallback).
 */
export async function uploadArticleImage(file: File): Promise<{ url: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      const dataUri = reader.result as string;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: getAdminAuthHeaders(),
          body: JSON.stringify({
            image: dataUri,
            filename: file.name,
          }),
        });

        if (res.ok) {
          const text = await res.text();
          if (text) {
            try {
              const data = JSON.parse(text);
              if (data && data.url) {
                return resolve({ url: data.url, filename: data.filename || file.name });
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // server endpoint offline, use dataUri
      }

      // Fallback to data URI if server endpoint unavailable
      resolve({ url: dataUri, filename: file.name });
    };

    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

// Helper to get custom articles stored in localStorage
export function getStoredCustomArticles(): Article[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse custom articles from localStorage:', err);
    return [];
  }
}

// Helper to persist custom articles into localStorage
export function setStoredCustomArticles(articles: Article[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(articles));
  } catch (err) {
    console.error('Failed to save custom articles to localStorage:', err);
  }
}

/**
 * Returns list of all article summaries (Built-in + Custom), sorted by date or title.
 */
export function getAllArticleSummaries(): Article[] {
  const custom = getStoredCustomArticles();
  const customSlugs = new Set(custom.map(a => a.slug));

  // Built-in manifest entries converted to lightweight Article records
  const builtinSummaries: Article[] = BUILTIN_ARTICLES_MANIFEST
    .filter(entry => !customSlugs.has(entry.slug)) // Custom overrides built-in if same slug
    .map(entry => ({
      slug: entry.slug,
      title: entry.title,
      excerpt: entry.excerpt,
      category: entry.category,
      author: 'CivilMath Engineering Editorial Team',
      publishedAt: '2025-01-15T00:00:00.000Z',
      readTimeMinutes: entry.readTimeMinutes,
      status: 'published',
      tags: [entry.category, entry.primaryKeyword],
      seo: {
        seoTitle: `${entry.title} | CivilMath`,
        metaDescription: entry.excerpt,
        primaryKeyword: entry.primaryKeyword,
        secondaryKeywords: [],
        lsiKeywords: [],
        canonicalUrl: `https://civilmath.com/articles/${entry.slug}`,
      },
      relatedCalculators: [{ name: entry.title, url: entry.calculatorUrl }],
      isBuiltin: true,
    }));

  return [...custom, ...builtinSummaries];
}

/**
 * Loads a single article by slug (either from custom storage, cache, or dynamic builtin import).
 */
export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  if (!slug) return undefined;
  const normalizedSlug = slug.toLowerCase().trim();

  // 1. Check in-memory cache
  if (articleCache.has(normalizedSlug)) {
    return articleCache.get(normalizedSlug);
  }

  // 2. Check custom storage
  const customList = getStoredCustomArticles();
  const foundCustom = customList.find(a => a.slug.toLowerCase() === normalizedSlug);
  if (foundCustom) {
    articleCache.set(normalizedSlug, foundCustom);
    return foundCustom;
  }

  // 3. Check built-in manifest
  const builtinEntry = BUILTIN_ARTICLES_MANIFEST.find(b => b.slug.toLowerCase() === normalizedSlug);
  if (builtinEntry) {
    try {
      const fullData = await builtinEntry.loadFullArticle();
      const article = convertArticleDataToArticle(fullData, builtinEntry);
      articleCache.set(normalizedSlug, article);
      return article;
    } catch (err) {
      console.error(`Failed to load built-in article ${slug}:`, err);
    }
  }

  // 4. Try backend API if running with server
  try {
    const res = await fetch(`/api/articles/${encodeURIComponent(normalizedSlug)}`);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        try {
          const data = JSON.parse(text);
          if (data && data.slug) {
            articleCache.set(normalizedSlug, data);
            return data;
          }
        } catch {
          // ignore non-json response
        }
      }
    }
  } catch {
    // server API not available or offline, fine to ignore
  }

  return undefined;
}

/**
 * Saves or updates an article in custom storage and server API.
 */
export async function saveArticle(article: Article): Promise<void> {
  const custom = getStoredCustomArticles();
  const index = custom.findIndex(a => a.slug === article.slug);

  const updatedArticle: Article = {
    ...article,
    updatedAt: new Date().toISOString(),
    isBuiltin: false,
  };

  if (index >= 0) {
    custom[index] = updatedArticle;
  } else {
    custom.unshift(updatedArticle);
  }

  setStoredCustomArticles(custom);
  articleCache.set(article.slug, updatedArticle);

  // Sync to server API if available
  try {
    await fetch('/api/articles', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(updatedArticle),
    });
  } catch {
    // Offline or static mode
  }
}

/**
 * Bulk uploads / imports an array of articles.
 */
export async function bulkUploadArticles(articles: Article[]): Promise<{ added: number; updated: number }> {
  const custom = getStoredCustomArticles();
  let added = 0;
  let updated = 0;

  for (const art of articles) {
    if (!art.slug || !art.title) continue;
    
    // Ensure SEO fields are present
    if (!art.seo || !art.seo.seoTitle) {
      const autoSeo = autoGenerateSeo(art);
      art.seo = {
        seoTitle: autoSeo.seoTitle,
        metaDescription: autoSeo.metaDescription,
        primaryKeyword: autoSeo.primaryKeyword,
        secondaryKeywords: autoSeo.secondaryKeywords,
        lsiKeywords: autoSeo.lsiKeywords,
      };
    }

    const idx = custom.findIndex(c => c.slug === art.slug);
    if (idx >= 0) {
      custom[idx] = { ...art, updatedAt: new Date().toISOString(), isBuiltin: false };
      updated++;
    } else {
      custom.unshift({
        ...art,
        publishedAt: art.publishedAt || new Date().toISOString(),
        isBuiltin: false,
      });
      added++;
    }
    articleCache.set(art.slug, art);
  }

  setStoredCustomArticles(custom);

  // Sync to backend API if available
  try {
    await fetch('/api/articles/bulk', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(articles),
    });
  } catch {
    // Static mode or server offline
  }

  return { added, updated };
}

/**
 * Deletes an article by slug (custom only).
 */
export async function deleteArticle(slug: string): Promise<boolean> {
  const custom = getStoredCustomArticles();
  const filtered = custom.filter(a => a.slug !== slug);
  if (filtered.length === custom.length) {
    return false; // nothing was deleted
  }

  setStoredCustomArticles(filtered);
  articleCache.delete(slug);

  try {
    await fetch(`/api/articles/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });
  } catch {
    // Ignore server error
  }

  return true;
}

/**
 * Exports all articles (built-in summaries + custom) into a clean downloadable JSON file.
 */
export async function exportAllArticlesAsJson(): Promise<string> {
  // Load full data for all articles to ensure complete export
  const summaries = getAllArticleSummaries();
  const fullArticles: Article[] = [];

  for (const s of summaries) {
    const full = await getArticleBySlug(s.slug);
    if (full) {
      fullArticles.push(full);
    } else {
      fullArticles.push(s);
    }
  }

  return JSON.stringify(fullArticles, null, 2);
}

/**
 * Parses uploaded JSON content (handles single article or array of articles).
 */
export function parseUploadedJson(jsonString: string): Article[] {
  const parsed = JSON.parse(jsonString);
  const items = Array.isArray(parsed) ? parsed : [parsed];
  
  return items.map((raw: any, index: number) => {
    const title = raw.title || raw.h1 || raw.seoTitle || `Imported Article ${index + 1}`;
    const slug = raw.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category: ArticleCategory = raw.category || 'general';

    const fullContent = raw.content || raw.introduction || raw.theory || '';
    const autoSeo = autoGenerateSeo({ title, category, content: fullContent, slug });

    return {
      slug,
      title,
      h1: raw.h1 || title,
      excerpt: raw.excerpt || raw.metaDescription || autoSeo.excerpt,
      category,
      author: raw.author || 'CivilMath Contributor',
      publishedAt: raw.publishedAt || new Date().toISOString(),
      readTimeMinutes: raw.readTimeMinutes || Math.max(2, Math.ceil((fullContent.split(/\s+/).length || 500) / 200)),
      status: raw.status === 'draft' ? 'draft' : 'published',
      tags: Array.isArray(raw.tags) ? raw.tags : [category],
      content: raw.content || '',
      introduction: raw.introduction || '',
      theory: raw.theory || '',
      realWorldApplications: raw.realWorldApplications || [],
      formulas: raw.formulas || [],
      stepByStepExample: raw.stepByStepExample,
      commonErrors: raw.commonErrors || [],
      bestPractices: raw.bestPractices || [],
      designCodes: raw.designCodes || [],
      faqs: raw.faqs || [],
      relatedCalculators: raw.relatedCalculators || [],
      references: raw.references || [],
      seo: {
        seoTitle: raw.seo?.seoTitle || raw.seoTitle || autoSeo.seoTitle,
        metaDescription: raw.seo?.metaDescription || raw.metaDescription || autoSeo.metaDescription,
        primaryKeyword: raw.seo?.primaryKeyword || raw.primaryKeyword || autoSeo.primaryKeyword,
        secondaryKeywords: raw.seo?.secondaryKeywords || raw.secondaryKeywords || autoSeo.secondaryKeywords,
        lsiKeywords: raw.seo?.lsiKeywords || raw.lsiKeywords || autoSeo.lsiKeywords,
        canonicalUrl: raw.seo?.canonicalUrl || `https://civilmath.com/articles/${slug}`,
        ogImage: raw.seo?.ogImage,
        noindex: Boolean(raw.seo?.noindex),
      },
    };
  });
}

/**
 * Parses uploaded Markdown text file into a structured Article.
 * Extracts title from # H1, frontmatter if present, and sections.
 */
export function parseUploadedMarkdown(mdString: string, filename: string = 'article.md'): Article {
  let cleanMd = mdString.trim();
  let title = '';
  let category: ArticleCategory = 'general';
  let author = 'CivilMath Editorial';
  let tags: string[] = [];

  // Parse YAML Frontmatter if present
  if (cleanMd.startsWith('---')) {
    const endIdx = cleanMd.indexOf('---', 3);
    if (endIdx > 0) {
      const frontmatter = cleanMd.substring(3, endIdx).trim();
      cleanMd = cleanMd.substring(endIdx + 3).trim();

      frontmatter.split('\n').forEach(line => {
        const [k, ...v] = line.split(':');
        if (!k || !v.length) return;
        const key = k.trim().toLowerCase();
        const val = v.join(':').trim().replace(/^['"]|['"]$/g, '');

        if (key === 'title') title = val;
        else if (key === 'category' && ['concrete', 'structural', 'bbs', 'geotech', 'survey', 'utility', 'general'].includes(val)) {
          category = val as ArticleCategory;
        } else if (key === 'author') author = val;
        else if (key === 'tags') tags = val.split(',').map(t => t.trim());
      });
    }
  }

  // Extract first # H1 heading as title if not set
  if (!title) {
    const h1Match = cleanMd.match(/^#\s+(.+)$/m);
    if (h1Match) {
      title = h1Match[1].trim();
    } else {
      title = filename.replace(/\.(md|txt|markdown)$/i, '').replace(/[-_]/g, ' ');
    }
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const autoSeo = autoGenerateSeo({ title, category, content: cleanMd, slug });

  // Extract first paragraph for excerpt
  const paragraphs = cleanMd.split(/\n\s*\n/).map(p => p.trim()).filter(p => !p.startsWith('#') && p.length > 20);
  const intro = paragraphs[0] || '';
  const excerpt = intro.length > 20 ? intro.substring(0, 160).replace(/\s+\S*$/, '') + '...' : autoSeo.metaDescription;

  const wordCount = cleanMd.split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(2, Math.ceil(wordCount / 200));

  return {
    slug,
    title,
    h1: title,
    excerpt,
    category,
    author,
    publishedAt: new Date().toISOString(),
    readTimeMinutes,
    status: 'published',
    tags: tags.length ? tags : [category, autoSeo.primaryKeyword],
    content: cleanMd,
    introduction: intro,
    seo: {
      seoTitle: autoSeo.seoTitle,
      metaDescription: autoSeo.metaDescription,
      primaryKeyword: autoSeo.primaryKeyword,
      secondaryKeywords: autoSeo.secondaryKeywords,
      lsiKeywords: autoSeo.lsiKeywords,
      canonicalUrl: `https://civilmath.com/articles/${slug}`,
    },
  };
}
