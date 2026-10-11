import { Article, ArticleCategory } from '../types/article';
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
 * Resizes an image file to max ~1600px width and converts it to WebP before uploading.
 */
export async function optimizeImageToWebP(
  file: File,
  maxWidth = 1600,
  quality = 0.85
): Promise<{ dataUrl: string; filename: string }> {
  return new Promise((resolve, reject) => {
    // If it's already an SVG, keep it as SVG without rasterizing
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result as string, filename: file.name });
      reader.onerror = () => reject(new Error('Failed to read SVG file.'));
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        // Fallback to direct file read if canvas context unavailable
        const reader = new FileReader();
        reader.onload = () => resolve({ dataUrl: reader.result as string, filename: file.name });
        reader.onerror = () => reject(new Error('Failed to process image.'));
        reader.readAsDataURL(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9_-]/gi, '-').toLowerCase() || 'image';
      const webpFilename = `${baseName}.webp`;

      try {
        const webpDataUrl = canvas.toDataURL('image/webp', quality);
        if (webpDataUrl && webpDataUrl.startsWith('data:image/webp')) {
          return resolve({ dataUrl: webpDataUrl, filename: webpFilename });
        }
      } catch {
        // ignore and fallback
      }

      // Fallback to jpeg if webp export is unsupported
      const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({ dataUrl: jpegDataUrl, filename: `${baseName}.jpg` });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image for optimization.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Reads a File object, optimizes it to WebP (<1600px), and uploads it to Supabase Storage / backend.
 */
export async function uploadArticleImage(
  file: File,
  slug: string = 'article'
): Promise<{ url: string; filename: string }> {
  try {
    const { dataUrl, filename } = await optimizeImageToWebP(file, 1600, 0.85);

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({
        image: dataUrl,
        filename,
        slug,
      }),
    });

    if (res.ok) {
      const text = await res.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (data && data.url) {
            return { url: data.url, filename: data.filename || filename };
          }
        } catch {
          // ignore
        }
      }
    }

    // Fallback to optimized data URI if server upload fails or is offline
    return { url: dataUrl, filename };
  } catch (err: any) {
    console.warn('Image optimization/upload notice, using fallback:', err?.message || err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ url: reader.result as string, filename: file.name });
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Checks if a slug is already taken by another article.
 */
export async function checkSlugExists(slug: string, currentSlug?: string): Promise<boolean> {
  const normSlug = slug.toLowerCase().trim();
  if (!normSlug) return false;
  if (currentSlug && normSlug === currentSlug.toLowerCase().trim()) return false;

  const stored = getStoredCustomArticles();
  const existsLocally = stored.some(a => a.slug.toLowerCase() === normSlug);
  if (existsLocally) return true;

  try {
    const res = await fetch(`/api/articles/${encodeURIComponent(normSlug)}`);
    if (res.ok) {
      const data = await res.json();
      return Boolean(data && data.slug);
    }
  } catch {
    // offline or static mode
  }
  return false;
}

const VALID_CATEGORIES: ArticleCategory[] = [
  'concrete',
  'structural',
  'bbs',
  'geotech',
  'survey',
  'utility',
  'general',
];

/**
 * Normalizes any raw article object into a strictly-typed, guaranteed-safe Article.
 * Prevents runtime crashes when fields (like category, seo, tags) are missing or null.
 */
export function normalizeArticleData(raw: any, fallbackSlug?: string): Article {
  if (!raw || typeof raw !== 'object') {
    const slug = fallbackSlug || 'unknown-article';
    return {
      slug,
      title: 'Untitled Article',
      h1: 'Untitled Article',
      excerpt: '',
      category: 'general',
      author: 'CivilMath Engineering Editorial Team',
      publishedAt: new Date().toISOString(),
      readTimeMinutes: 5,
      status: 'published',
      tags: ['general'],
      content: '',
      introduction: '',
      theory: '',
      realWorldApplications: [],
      formulas: [],
      commonErrors: [],
      bestPractices: [],
      designCodes: [],
      faqs: [],
      relatedCalculators: [],
      references: [],
      blocks: [],
      seo: {
        seoTitle: 'Untitled Article | CivilMath',
        metaDescription: '',
        primaryKeyword: 'general',
        secondaryKeywords: [],
        lsiKeywords: [],
        canonicalUrl: `https://civilmath.com/articles/${slug}`,
      },
      isBuiltin: false,
    };
  }

  const title = String(raw.title || raw.h1 || raw.seoTitle || 'Untitled Article').trim();
  const slug = String(raw.slug || fallbackSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'article').trim();
  const h1 = String(raw.h1 || title).trim();
  const rawCat = typeof raw.category === 'string' ? raw.category.toLowerCase().trim() : '';
  const category: ArticleCategory = VALID_CATEGORIES.includes(rawCat as ArticleCategory)
    ? (rawCat as ArticleCategory)
    : 'general';

  const content = typeof raw.content === 'string' ? raw.content : '';
  const intro = typeof raw.introduction === 'string' ? raw.introduction : '';
  const excerpt = String(
    raw.excerpt ||
    raw.metaDescription ||
    raw.summary ||
    (intro.length > 20 ? intro.slice(0, 160) : '') ||
    (content.length > 20 ? content.slice(0, 160) : '') ||
    title
  ).trim();

  const author = String(raw.author || 'CivilMath Engineering Editorial Team').trim();
  const publishedAt = raw.publishedAt || raw.published_at || new Date().toISOString();
  const updatedAt = raw.updatedAt || raw.updated_at || undefined;

  const wordCount = (content + ' ' + intro).split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Number(raw.readTimeMinutes) || Math.max(2, Math.ceil((wordCount || 500) / 200));

  const status: 'published' | 'draft' | 'scheduled' | 'archived' =
    raw.status === 'draft' ? 'draft'
    : raw.status === 'scheduled' ? 'scheduled'
    : raw.status === 'archived' ? 'archived'
    : raw.published === false ? 'draft'
    : 'published';

  const tags: string[] = Array.isArray(raw.tags) && raw.tags.length > 0
    ? raw.tags.map((t: any) => String(t).trim()).filter(Boolean)
    : [category];

  const primaryKeyword = raw.seo?.primaryKeyword || raw.primaryKeyword || tags[0] || category;
  const autoSeo = autoGenerateSeo({ title, category, content: content || intro, slug });

  const seoTitle = raw.seo?.seoTitle || raw.seoTitle || autoSeo.seoTitle || `${title} | CivilMath`;
  const metaDescription = raw.seo?.metaDescription || raw.metaDescription || excerpt || autoSeo.metaDescription;

  const seo = {
    seoTitle,
    metaDescription,
    primaryKeyword: String(primaryKeyword),
    secondaryKeywords: Array.isArray(raw.seo?.secondaryKeywords)
      ? raw.seo.secondaryKeywords
      : (Array.isArray(raw.secondaryKeywords) ? raw.secondaryKeywords : autoSeo.secondaryKeywords),
    lsiKeywords: Array.isArray(raw.seo?.lsiKeywords)
      ? raw.seo.lsiKeywords
      : (Array.isArray(raw.lsiKeywords) ? raw.lsiKeywords : autoSeo.lsiKeywords),
    canonicalUrl: raw.seo?.canonicalUrl || raw.canonicalUrl || `https://civilmath.com/articles/${slug}`,
    ogImage: raw.seo?.ogImage || raw.coverImage || raw.image_url || undefined,
    noindex: Boolean(raw.seo?.noindex ?? raw.noindex),
  };

  const contentFormat: 'legacy' | 'html' =
    raw.contentFormat === 'html' || raw.content_format === 'html'
      ? 'html'
      : (raw.contentFormat === 'legacy' || raw.content_format === 'legacy'
          ? 'legacy'
          : (content && (content.includes('<p') || content.includes('<h2')) ? 'html' : 'legacy'));

  const coverImage = raw.coverImage || raw.coverImageUrl || raw.cover_image_url || raw.image_url || raw.imageUrl || undefined;
  const createdAt = raw.createdAt || raw.created_at || publishedAt;

  return {
    id: raw.id,
    slug,
    title,
    h1,
    excerpt,
    category,
    author,
    publishedAt,
    createdAt,
    updatedAt,
    readTimeMinutes,
    status,
    coverImage,
    coverImageUrl: coverImage,
    tags,
    content,
    contentFormat,
    introduction: intro,
    theory: typeof raw.theory === 'string' ? raw.theory : '',
    realWorldApplications: Array.isArray(raw.realWorldApplications) ? raw.realWorldApplications : [],
    formulas: Array.isArray(raw.formulas) ? raw.formulas : [],
    stepByStepExample: raw.stepByStepExample && typeof raw.stepByStepExample === 'object' ? raw.stepByStepExample : undefined,
    commonErrors: Array.isArray(raw.commonErrors) ? raw.commonErrors : [],
    bestPractices: Array.isArray(raw.bestPractices) ? raw.bestPractices : [],
    designCodes: Array.isArray(raw.designCodes) ? raw.designCodes : [],
    faqs: Array.isArray(raw.faqs) ? raw.faqs : [],
    relatedCalculators: Array.isArray(raw.relatedCalculators) ? raw.relatedCalculators : [],
    references: Array.isArray(raw.references) ? raw.references : [],
    blocks: Array.isArray(raw.blocks) ? raw.blocks : [],
    seo,
    isBuiltin: Boolean(raw.isBuiltin),
  };
}

// Helper to strip heavy content before saving to localStorage to prevent QuotaExceededError
export function toArticleSummary(art: Article): Article {
  return {
    id: art.id,
    slug: art.slug,
    title: art.title,
    h1: art.h1,
    excerpt: art.excerpt,
    category: art.category,
    author: art.author,
    publishedAt: art.publishedAt,
    createdAt: art.createdAt,
    updatedAt: art.updatedAt,
    readTimeMinutes: art.readTimeMinutes,
    status: art.status,
    coverImage: art.coverImage,
    coverImageUrl: art.coverImageUrl,
    tags: art.tags,
    seo: art.seo ? {
      seoTitle: art.seo.seoTitle,
      metaDescription: art.seo.metaDescription,
      primaryKeyword: art.seo.primaryKeyword,
      secondaryKeywords: art.seo.secondaryKeywords || [],
      lsiKeywords: art.seo.lsiKeywords || [],
      canonicalUrl: art.seo.canonicalUrl,
      noindex: art.seo.noindex,
    } : undefined,
    isBuiltin: art.isBuiltin,
  };
}

// Helper to get custom articles stored in localStorage
export function getStoredCustomArticles(): Article[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(item => normalizeArticleData(item));
    }
    return [];
  } catch (err) {
    console.error('Failed to parse custom articles from localStorage:', err);
    return [];
  }
}

// Helper to persist custom articles into localStorage (summaries only to strictly avoid quota limits)
export function setStoredCustomArticles(articles: Article[]) {
  if (typeof window === 'undefined') return;
  try {
    const summaries = articles.map(toArticleSummary);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(summaries));
  } catch (err) {
    console.warn('LocalStorage save quota warning, attempting compact save:', err);
    try {
      const minimal = articles.map(a => ({
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt ? a.excerpt.slice(0, 120) : '',
        category: a.category,
        publishedAt: a.publishedAt,
        readTimeMinutes: a.readTimeMinutes,
        status: a.status,
      }));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(minimal));
    } catch (fallbackErr) {
      console.error('Failed to save even minimal articles to localStorage:', fallbackErr);
    }
  }
}

/**
 * Returns list of all article summaries (Built-in + Custom), sorted by date or title.
/**
 * Wipes local article storage and in-memory cache completely.
 */
export function clearLocalArticleCache(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  articleCache.clear();
}

/**
 * Returns list of all article summaries, sorted by date or title.
 * Exclusively loads articles synchronized from Supabase.
 */
export function getAllArticleSummaries(): Article[] {
  return getStoredCustomArticles();
}

/**
 * Fetches all custom articles from backend API / Supabase, normalizes them,
 * strictly overwrites localStorage with Supabase articles, updates in-memory cache,
 * and returns all summaries.
 */
export async function fetchAndSyncAllArticles(): Promise<Article[]> {
  try {
    const res = await fetch('/api/articles');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const normalizedRemote = data.map((item: any) => normalizeArticleData(item));

        // Supabase is the sole source of truth:
        // Overwrite local storage strictly with Supabase articles
        setStoredCustomArticles(normalizedRemote);
        articleCache.clear();
        for (const art of normalizedRemote) {
          if (art && art.slug) {
            articleCache.set(art.slug.toLowerCase(), art);
          }
        }
        return normalizedRemote;
      }
    }
  } catch (err) {
    console.warn('Could not sync articles with remote API:', err);
  }

  return getAllArticleSummaries();
}

/**
 * Build-time embedded article data (scripts/prerender-articles.ts writes it as
 * <script id="ssr-article-data" type="application/json"> into each
 * /articles/<slug>/index.html). Lets the article page render instantly from the
 * HTML itself — no API wait, no loading spinner — with a background refresh
 * still fetching the latest version.
 */
function getEmbeddedArticleSync(slug: string): Article | undefined {
  try {
    if (typeof document === 'undefined') return undefined;
    const el = document.getElementById('ssr-article-data');
    if (!el || !el.textContent) return undefined;
    const data = JSON.parse(el.textContent);
    if (
      data &&
      typeof data.slug === 'string' &&
      data.slug.toLowerCase().trim() === slug.toLowerCase().trim() &&
      (data.content || data.blocks?.length)
    ) {
      return normalizeArticleData(data, slug);
    }
  } catch {
    /* malformed embed — fall through to other caches */
  }
  return undefined;
}

/**
 * Synchronously retrieves an article from in-memory cache or localStorage.
 * Enables zero-millisecond instantaneous page rendering.
 */
export function getCachedArticleSync(slug?: string): Article | undefined {
  if (!slug) return undefined;
  const normalizedSlug = slug.toLowerCase().trim();

  // 1. In-memory cache
  if (articleCache.has(normalizedSlug)) {
    const cached = articleCache.get(normalizedSlug)!;
    if (cached.content || cached.blocks?.length) {
      return normalizeArticleData(cached, normalizedSlug);
    }
  }

  // 2. Build-time embedded article data (instant, no fetch)
  const embedded = getEmbeddedArticleSync(normalizedSlug);
  if (embedded) {
    articleCache.set(normalizedSlug, embedded);
    return embedded;
  }

  // 3. Custom storage (localStorage)
  const customList = getStoredCustomArticles();
  const foundCustom = customList.find(a => a.slug.toLowerCase() === normalizedSlug);
  if (foundCustom && (foundCustom.content || foundCustom.blocks?.length)) {
    const normalized = normalizeArticleData(foundCustom, normalizedSlug);
    articleCache.set(normalizedSlug, normalized);
    return normalized;
  }

  return undefined;
}

/**
 * Prefetches an article into the in-memory cache for instant navigation.
 */
export async function prefetchArticle(slug: string): Promise<void> {
  if (!slug) return;
  const normalizedSlug = slug.toLowerCase().trim();
  if (articleCache.has(normalizedSlug)) return;
  try {
    const res = await fetch(`/api/articles/${encodeURIComponent(normalizedSlug)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.slug || data.title)) {
        const normalized = normalizeArticleData(data, normalizedSlug);
        articleCache.set(normalizedSlug, normalized);
      }
    }
  } catch {
    // ignore background prefetch errors
  }
}

/**
 * Loads a single article by slug (from in-memory cache, custom storage, or remote Supabase API).
 */
export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  if (!slug) return undefined;
  const normalizedSlug = slug.toLowerCase().trim();

  // 1. Check in-memory cache
  if (articleCache.has(normalizedSlug)) {
    return normalizeArticleData(articleCache.get(normalizedSlug)!, normalizedSlug);
  }

  // 2. Check custom storage
  const customList = getStoredCustomArticles();
  const foundCustom = customList.find(a => a.slug.toLowerCase() === normalizedSlug);
  if (foundCustom) {
    const normalized = normalizeArticleData(foundCustom, normalizedSlug);
    articleCache.set(normalizedSlug, normalized);
    return normalized;
  }

  // 3. Try backend API / Supabase
  try {
    const res = await fetch(`/api/articles/${encodeURIComponent(normalizedSlug)}`);
    if (res.status === 404) {
      // Definitive "does not exist" — callers use this to decide noindex.
      // A distinct error (not undefined) so transient failures aren't
      // mistaken for a missing article.
      const notFound: any = new Error(`Article not found: ${normalizedSlug}`);
      notFound.code = 'ARTICLE_NOT_FOUND';
      throw notFound;
    }
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        try {
          const data = JSON.parse(text);
          if (data && (data.slug || data.title)) {
            const normalized = normalizeArticleData(data, normalizedSlug);
            articleCache.set(normalizedSlug, normalized);

            // Also store in custom articles so directory / prev-next works immediately
            const current = getStoredCustomArticles();
            const idx = current.findIndex(c => c.slug.toLowerCase() === normalizedSlug);
            if (idx >= 0) {
              current[idx] = normalized;
            } else {
              current.unshift(normalized);
            }
            setStoredCustomArticles(current);

            return normalized;
          }
        } catch {
          // ignore non-json response
        }
      }
    }
  } catch (e: any) {
    if (e?.code === 'ARTICLE_NOT_FOUND') throw e;
    // server API not available or offline, fine to ignore
  }

  return undefined;
}

/**
 * Saves or updates an article in custom storage and server API (Supabase).
 */
export async function saveArticle(article: Article): Promise<void> {
  const normalized = normalizeArticleData(article);
  const custom = getStoredCustomArticles();
  const index = custom.findIndex(a => a.slug.toLowerCase() === normalized.slug.toLowerCase());

  const updatedArticle: Article = {
    ...normalized,
    updatedAt: new Date().toISOString(),
    isBuiltin: false,
  };

  // Sync to server API (Supabase)
  const res = await fetch('/api/articles', {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    body: JSON.stringify(updatedArticle),
  });

  if (!res.ok) {
    let errMsg = `Server returned status ${res.status}`;
    try {
      const json = await res.json();
      if (json?.error) errMsg = json.error;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  const json = await res.json();
  const saved = json?.article || json;
  const synced = saved && (saved.slug || saved.title)
    ? normalizeArticleData(saved, updatedArticle.slug)
    : updatedArticle;

  if (index >= 0) {
    custom[index] = synced;
  } else {
    custom.unshift(synced);
  }

  setStoredCustomArticles(custom);
  articleCache.set(synced.slug.toLowerCase(), synced);
}

/**
 * Bulk uploads / imports an array of articles.
 */
export async function bulkUploadArticles(articles: Article[]): Promise<{ added: number; updated: number }> {
  const custom = getStoredCustomArticles();
  let added = 0;
  let updated = 0;
  const normalizedList: Article[] = [];

  for (const raw of articles) {
    if (!raw.slug && !raw.title) continue;
    const art = normalizeArticleData(raw);

    const idx = custom.findIndex(c => c.slug.toLowerCase() === art.slug.toLowerCase());
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
    articleCache.set(art.slug.toLowerCase(), art);
    normalizedList.push(art);
  }

  setStoredCustomArticles(custom);

  // Sync to backend API if available
  try {
    await fetch('/api/articles/bulk', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(normalizedList),
    });
  } catch {
    // Static mode or server offline
  }

  return { added, updated };
}

/**
 * Deletes an article by slug (both from Supabase server and local storage).
 */
export async function deleteArticle(slug: string): Promise<boolean> {
  if (!slug) return false;
  const normSlug = slug.toLowerCase().trim();

  // 1. Send DELETE request to backend API (Supabase)
  try {
    const res = await fetch(`/api/articles/${encodeURIComponent(normSlug)}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });

    if (!res.ok) {
      let errMsg = `Server returned status ${res.status}`;
      try {
        const json = await res.json();
        if (json?.error) errMsg = json.error;
      } catch {
        // ignore
      }
      throw new Error(errMsg);
    }
  } catch (err: any) {
    console.error('Remote delete failed:', err);
    throw err;
  }

  // 2. Clean up from localStorage
  const custom = getStoredCustomArticles();
  const filtered = custom.filter(a => a.slug.toLowerCase() !== normSlug);
  setStoredCustomArticles(filtered);

  // 3. Clean up from in-memory cache
  articleCache.delete(normSlug);

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
