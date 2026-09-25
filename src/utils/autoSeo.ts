import { Article, ArticleSEO, SeoAuditCheck, SeoAuditResult } from '../types/article';
import { SITE_URL, SITE_NAME, DEFAULT_IMAGE } from './seo';

// Common English stopwords to strip when extracting keywords and slugs
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'her', 'here',
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'should', 'shouldn\'t', 'so',
  'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s',
  'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until',
  'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'your', 'yours', 'yourself'
]);

// Domain-specific civil engineering keywords and their semantic LSI terms
const CIVIL_LSI_MAP: Record<string, string[]> = {
  concrete: ['mix design', 'compressive strength', 'water cement ratio', 'curing time', 'slump test', 'IS 456', 'ACI 318', 'cement bags', 'aggregates'],
  rebar: ['bar bending schedule', 'cutting length', 'hook length', 'lap splice', 'steel weight', 'diameter mm', 'yield strength', 'ASTM A615'],
  bbs: ['bar bending schedule', 'cutting length', 'bend deduction', 'crank bar', 'stirrups', 'rebar weight kg', 'steel detailing'],
  slab: ['two way slab', 'one way slab', 'slab thickness', 'deflection limit', 'top mesh', 'bottom reinforcement', 'clear cover'],
  beam: ['bending moment', 'shear force', 'singly reinforced', 'doubly reinforced', 'stirrup spacing', 'effective depth', 'neutral axis'],
  column: ['axial load', 'short column', 'slender column', 'lateral ties', 'buckling', 'eccentricity', 'column rebar'],
  footing: ['bearing capacity', 'safe bearing capacity', 'isolated footing', 'punching shear', 'depth of footing', 'settlement'],
  brick: ['brickwork quantity', 'mortar ratio 1:4', 'cement bags for brickwork', 'wall volume', 'deductions for doors', 'plaster volume'],
  bearing: ['Terzaghi equation', 'Meyerhof capacity', 'cohesion', 'angle of internal friction', 'factor of safety', 'soil density'],
  retaining: ['Rankine earth pressure', 'Coulomb theory', 'active earth pressure', 'passive resistance', 'cantilever wall', 'sliding factor of safety'],
  survey: ['height of instrument', 'backsight foresight', 'bench mark', 'traverse closure', 'bearing coordinates', 'reduced level RL'],
  steel: ['unit weight of steel', 'D squared over 162', 'mild steel Fe250', 'Fe500 rebar', 'structural steel section', 'density 7850 kg/m3']
};

/**
 * Converts a text title into an SEO-friendly URL slug.
 * Strips special chars and stopwords for high crawlability.
 */
export function slugify(text: string): string {
  if (!text) return '';
  const cleaned = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim();

  const words = cleaned.split(/\s+/).filter(w => w.length > 0 && !STOP_WORDS.has(w));
  const finalSlug = (words.length > 0 ? words : cleaned.split(/\s+/)).slice(0, 7).join('-');
  return finalSlug || 'article';
}

/**
 * Extracts candidate primary, secondary, and LSI keywords from text and title.
 */
export function extractKeywords(content: string, title: string = '', category: string = ''): {
  primary: string;
  secondary: string[];
  lsi: string[];
} {
  const combined = `${title} ${title} ${content}`.toLowerCase();
  // Tokenize words
  const words = combined.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));

  // Count word frequencies
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  // Count 2-word ngrams
  const bigramFreq: Record<string, number> = {};
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    bigramFreq[bigram] = (bigramFreq[bigram] || 0) + 1;
  }

  // Sort bigrams first as primary keywords are typically 2-3 words
  const sortedBigrams = Object.entries(bigramFreq)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  const sortedWords = Object.entries(freq).sort((a, b) => b[1] - a[1]);

  // Determine primary keyword
  let primary = '';
  if (sortedBigrams.length > 0) {
    primary = sortedBigrams[0][0];
  } else if (sortedWords.length > 0) {
    primary = `${sortedWords[0][0]} calculation`;
  } else {
    primary = title.toLowerCase().slice(0, 30);
  }

  // Secondary keywords
  const secondary: string[] = [];
  for (const [bg] of sortedBigrams.slice(1, 6)) {
    if (!secondary.includes(bg) && bg !== primary) {
      secondary.push(bg);
    }
  }
  for (const [w] of sortedWords.slice(0, 6)) {
    const term = `${w} guide`;
    if (!secondary.includes(w) && !secondary.includes(term) && w !== primary) {
      secondary.push(w);
    }
  }

  // LSI keywords from knowledge map
  const lsiSet = new Set<string>();
  const fullText = `${combined} ${category}`.toLowerCase();
  for (const [key, terms] of Object.entries(CIVIL_LSI_MAP)) {
    if (fullText.includes(key)) {
      terms.forEach(t => lsiSet.add(t));
    }
  }

  // Ensure default LSI if none matched
  if (lsiSet.size === 0) {
    ['civil engineering formula', 'construction estimation', 'step by step calculation', 'design codes', 'safety factor'].forEach(t => lsiSet.add(t));
  }

  return {
    primary,
    secondary: secondary.slice(0, 6),
    lsi: Array.from(lsiSet).slice(0, 8),
  };
}

/**
 * Generates an SEO title calibrated between 50 and 60 characters.
 */
export function generateSeoTitle(rawTitle: string, primaryKeyword: string): string {
  const brandSuffix = ' | CivilMath';
  const cleanTitle = rawTitle.replace(/\|.*$/i, '').trim();

  // If already optimal length with brand
  const withBrand = `${cleanTitle}${brandSuffix}`;
  if (withBrand.length >= 45 && withBrand.length <= 65) {
    return withBrand;
  }

  if (withBrand.length > 65) {
    // Truncate cleanly before word boundary
    const maxLen = 65 - brandSuffix.length;
    const truncated = cleanTitle.substring(0, maxLen).replace(/\s+\S*$/, '');
    return `${truncated}${brandSuffix}`;
  }

  // Title is short: enrich with primary keyword or descriptor
  let enriched = cleanTitle;
  if (primaryKeyword && !cleanTitle.toLowerCase().includes(primaryKeyword.toLowerCase())) {
    enriched = `${cleanTitle}: Complete ${primaryKeyword.replace(/\b\w/g, l => l.toUpperCase())} Guide`;
  } else {
    enriched = `${cleanTitle}: Formulas, Steps & Practical Guide`;
  }

  const finalStr = `${enriched}${brandSuffix}`;
  if (finalStr.length <= 65) {
    return finalStr;
  }
  return `${enriched.substring(0, 65 - brandSuffix.length).replace(/\s+\S*$/, '')}${brandSuffix}`;
}

/**
 * Generates an SEO meta description calibrated between 145 and 160 characters.
 */
export function generateMetaDescription(title: string, contentOrIntro: string, primaryKeyword: string): string {
  // Clean text from markdown / symbols
  const cleanText = (contentOrIntro || '')
    .replace(/[#*`_~\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const cta = 'Learn step-by-step methods, formulas, and verified examples on CivilMath.';
  
  if (cleanText.length > 80) {
    // Take first 100-110 characters
    const snippet = cleanText.substring(0, 100).replace(/\s+\S*$/, '').trim();
    const candidate = `${snippet}. ${cta}`;
    if (candidate.length >= 140 && candidate.length <= 160) {
      return candidate;
    }
  }

  // Construct from keyword and title
  const kw = primaryKeyword ? primaryKeyword.toLowerCase() : 'civil engineering';
  const desc = `Comprehensive guide to ${title.toLowerCase().replace(/\|.*$/, '').trim()}. Master ${kw} with accurate formulas, numerical examples, and site best practices.`;
  
  if (desc.length > 160) {
    return desc.substring(0, 157).replace(/\s+\S*$/, '') + '...';
  }
  if (desc.length < 135) {
    return `${desc} Check details on CivilMath now.`;
  }
  return desc;
}

/**
 * Auto-Generates all SEO fields from article title, category, and content.
 */
export function autoGenerateSeo(article: {
  title?: string;
  category?: string;
  content?: string;
  introduction?: string;
  theory?: string;
  slug?: string;
}): ArticleSEO & { slug: string; excerpt: string } {
  const title = article.title || 'Civil Engineering Guide';
  const fullContent = [
    article.introduction || '',
    article.content || '',
    article.theory || '',
  ].join(' ').trim();

  // 1. Slug
  const slug = article.slug ? slugify(article.slug) : slugify(title);

  // 2. Extract Keywords
  const { primary, secondary, lsi } = extractKeywords(fullContent, title, article.category || '');

  // 3. Generate SEO Title
  const seoTitle = generateSeoTitle(title, primary);

  // 4. Generate Meta Description
  const metaDescription = generateMetaDescription(title, fullContent, primary);

  // 5. Excerpt for cards
  const cleanContent = fullContent.replace(/[#*`_~\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  const excerpt = cleanContent.length > 20
    ? cleanContent.substring(0, 160).replace(/\s+\S*$/, '') + '...'
    : metaDescription;

  return {
    slug,
    seoTitle,
    metaDescription,
    primaryKeyword: primary,
    secondaryKeywords: secondary,
    lsiKeywords: lsi,
    canonicalUrl: `${SITE_URL}/articles/${slug}`,
    ogImage: DEFAULT_IMAGE,
    noindex: false,
    excerpt,
  };
}

/**
 * Real-time SEO Health Auditor for articles.
 * Evaluates 10 core search engine criteria and gives an overall score out of 100.
 */
export function auditArticleSeo(article: Partial<Article>): SeoAuditResult {
  const title = (article.seo?.seoTitle || article.title || '').trim();
  const description = (article.seo?.metaDescription || article.excerpt || '').trim();
  const slug = (article.slug || '').trim();
  const primaryKw = (article.seo?.primaryKeyword || '').toLowerCase().trim();
  const h1 = (article.h1 || article.title || '').trim();
  
  const allContent = [
    article.introduction || '',
    article.content || '',
    article.theory || '',
    article.stepByStepExample ? JSON.stringify(article.stepByStepExample) : '',
  ].join(' ');

  const words = allContent.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Keyword density
  let keywordDensity = 0;
  if (primaryKw && wordCount > 0) {
    const kwMatches = allContent.toLowerCase().split(primaryKw).length - 1;
    keywordDensity = Number(((kwMatches / Math.max(1, wordCount)) * 100).toFixed(2));
  }

  const checks: SeoAuditCheck[] = [];

  // 1. Title Length
  const titleLen = title.length;
  const titlePassed = titleLen >= 45 && titleLen <= 65;
  checks.push({
    id: 'title-length',
    label: 'SEO Title Length (45-65 chars)',
    passed: titlePassed,
    score: titlePassed ? 15 : (titleLen >= 30 && titleLen <= 75 ? 8 : 0),
    weight: 15,
    feedback: titleLen === 0
      ? 'Missing SEO title.'
      : titleLen < 45
      ? `Title is too short (${titleLen} chars). Expand to at least 45 chars for higher CTR.`
      : titleLen > 65
      ? `Title is too long (${titleLen} chars) and will be truncated in Google SERPs.`
      : `Optimal title length (${titleLen} chars).`,
    type: 'title',
  });

  // 2. Meta Description Length
  const descLen = description.length;
  const descPassed = descLen >= 140 && descLen <= 165;
  checks.push({
    id: 'meta-length',
    label: 'Meta Description Length (140-165 chars)',
    passed: descPassed,
    score: descPassed ? 15 : (descLen >= 100 && descLen <= 180 ? 8 : 0),
    weight: 15,
    feedback: descLen === 0
      ? 'Missing meta description.'
      : descLen < 140
      ? `Description is too short (${descLen} chars). Add more details up to 150-160 chars.`
      : descLen > 165
      ? `Description is too long (${descLen} chars). It may be cut off in search snippets.`
      : `Perfect description length (${descLen} chars).`,
    type: 'description',
  });

  // 3. Primary Keyword in Title
  const kwInTitle = Boolean(primaryKw && title.toLowerCase().includes(primaryKw));
  checks.push({
    id: 'keyword-in-title',
    label: 'Primary Keyword in SEO Title',
    passed: kwInTitle,
    score: kwInTitle ? 15 : 0,
    weight: 15,
    feedback: kwInTitle
      ? `Primary keyword "${primaryKw}" found in title.`
      : `Target keyword "${primaryKw || '(none)'}" should appear in your SEO title.`,
    type: 'title',
  });

  // 4. Primary Keyword in Meta Description
  const kwInDesc = Boolean(primaryKw && description.toLowerCase().includes(primaryKw));
  checks.push({
    id: 'keyword-in-desc',
    label: 'Primary Keyword in Meta Description',
    passed: kwInDesc,
    score: kwInDesc ? 10 : 0,
    weight: 10,
    feedback: kwInDesc
      ? `Primary keyword appears in meta description.`
      : `Include the primary keyword "${primaryKw || '(none)'}" in the description for bold highlighting in search.`,
    type: 'description',
  });

  // 5. Clean URL Slug
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const isCleanSlug = slug.length > 2 && slugRegex.test(slug);
  checks.push({
    id: 'clean-slug',
    label: 'SEO-Friendly Clean URL Slug',
    passed: isCleanSlug,
    score: isCleanSlug ? 10 : 0,
    weight: 10,
    feedback: isCleanSlug
      ? `Clean, hyphen-separated slug: /articles/${slug}`
      : 'Slug must contain only lowercase alphanumeric characters and hyphens without trailing hyphens.',
    type: 'slug',
  });

  // 6. Keyword in Slug
  const kwSlugFormatted = primaryKw.replace(/\s+/g, '-');
  const kwInSlug = Boolean(primaryKw && (slug.includes(kwSlugFormatted) || primaryKw.split(' ').some(w => slug.includes(w))));
  checks.push({
    id: 'keyword-in-slug',
    label: 'Target Keyword in Slug',
    passed: kwInSlug,
    score: kwInSlug ? 5 : 0,
    weight: 5,
    feedback: kwInSlug
      ? 'Target keyword or stem is present in the URL slug.'
      : 'Include your focus keyword in the URL slug for better rankings.',
    type: 'slug',
  });

  // 7. Word Count & Depth
  const wordCountPassed = wordCount >= 300;
  checks.push({
    id: 'word-count',
    label: 'Content Depth (300+ words)',
    passed: wordCountPassed,
    score: wordCount >= 600 ? 15 : (wordCount >= 300 ? 10 : 0),
    weight: 15,
    feedback: wordCount >= 600
      ? `Comprehensive article (${wordCount} words, ~${readingTimeMinutes} min read).`
      : wordCount >= 300
      ? `Sufficient content (${wordCount} words), but 600+ words will rank even better.`
      : `Content is too thin (${wordCount} words). Add theory, steps, formulas or examples.`,
    type: 'content',
  });

  // 8. Keyword in H1 / Introduction
  const first100Words = words.slice(0, 100).join(' ').toLowerCase();
  const kwInIntro = Boolean(primaryKw && (first100Words.includes(primaryKw) || h1.toLowerCase().includes(primaryKw)));
  checks.push({
    id: 'keyword-in-intro',
    label: 'Focus Keyword in H1 or First Paragraph',
    passed: kwInIntro,
    score: kwInIntro ? 5 : 0,
    weight: 5,
    feedback: kwInIntro
      ? 'Keyword introduced early in H1 / introduction.'
      : 'Mention your target keyword in the first 100 words to signal search intent.',
    type: 'content',
  });

  // 9. Structured Elements (Formulas, Steps, Codes, FAQs)
  const hasStructured = Boolean(
    (article.formulas && article.formulas.length > 0) ||
    article.stepByStepExample ||
    (article.faqs && article.faqs.length > 0)
  );
  checks.push({
    id: 'structured-elements',
    label: 'Technical Rich Elements (Formulas, Steps, FAQs)',
    passed: hasStructured,
    score: hasStructured ? 5 : 0,
    weight: 5,
    feedback: hasStructured
      ? 'Rich engineering elements present (formulas, step-by-step example, or FAQs).'
      : 'Add formulas, numerical examples, or FAQs to qualify for Google Rich Snippets.',
    type: 'structure',
  });

  // 10. Secondary & LSI Keywords
  const hasSecondary = Boolean(article.seo?.secondaryKeywords && article.seo.secondaryKeywords.length >= 2);
  checks.push({
    id: 'secondary-keywords',
    label: 'Secondary & LSI Keywords Configured',
    passed: hasSecondary,
    score: hasSecondary ? 5 : 0,
    weight: 5,
    feedback: hasSecondary
      ? `${article.seo?.secondaryKeywords?.length} secondary keywords configured.`
      : 'Add at least 2 secondary or LSI keywords to target long-tail searches.',
    type: 'keyword',
  });

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);

  let status: SeoAuditResult['status'] = 'poor';
  if (totalScore >= 85) status = 'excellent';
  else if (totalScore >= 70) status = 'good';
  else if (totalScore >= 50) status = 'needs-improvement';

  return {
    score: totalScore,
    status,
    checks,
    keywordDensity,
    wordCount,
    readingTimeMinutes,
  };
}

/**
 * Prepares JSON-LD Schema structured data for the article.
 */
export function generateArticleJsonLd(article: Article): Record<string, any> {
  const url = `${SITE_URL}/articles/${article.slug}`;
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: article.seo.seoTitle || article.title,
    description: article.seo.metaDescription || article.excerpt,
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    image: article.coverImage || article.seo.ogImage || DEFAULT_IMAGE,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Organization',
      name: article.author || SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/og-image.png`,
      },
    },
    inLanguage: 'en-US',
  };

  if (article.seo.primaryKeyword) {
    schema.keywords = [article.seo.primaryKeyword, ...(article.seo.secondaryKeywords || [])].join(', ');
  }

  return schema;
}
