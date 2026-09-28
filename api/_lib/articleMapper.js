export function rowToArticle(row) {
  if (!row) return null;
  let meta = {};
  if (row.summary && typeof row.summary === 'string') {
    const trimmed = row.summary.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        meta = JSON.parse(trimmed);
      } catch {
        meta = { excerpt: row.summary };
      }
    } else {
      meta = { excerpt: row.summary };
    }
  }

  const title = row.title || 'Untitled Article';
  const slug = row.slug || 'untitled';
  const content = row.content || '';
  const category = row.category || meta.category || 'general';
  const excerpt = row.excerpt || meta.excerpt || row.summary || (content.length > 20 ? content.slice(0, 160) : title);
  const status = row.status || (row.published === false ? 'draft' : (meta.status || 'published'));
  const contentFormat = row.content_format || meta.content_format || (content.includes('<p') || content.includes('<h2') ? 'html' : 'legacy');
  const coverImage = row.cover_image_url || row.image_url || meta.coverImage || '';
  const tags = Array.isArray(row.tags) && row.tags.length ? row.tags : (Array.isArray(meta.tags) && meta.tags.length ? meta.tags : [category]);
  const publishedAt = row.published_at || row.created_at || new Date().toISOString();
  const createdAt = row.created_at || row.published_at || publishedAt;
  const updatedAt = row.updated_at || undefined;

  return {
    id: row.id,
    slug,
    title,
    h1: meta.h1 || title,
    excerpt,
    category,
    author: meta.author || 'CivilMath Engineering Editorial Team',
    publishedAt,
    createdAt,
    updatedAt,
    readTimeMinutes: meta.readTimeMinutes || Math.max(2, Math.ceil((content.split(/\s+/).length || 500) / 200)),
    status,
    tags,
    coverImage,
    coverImageUrl: coverImage,
    content,
    contentFormat,
    introduction: meta.introduction || '',
    theory: meta.theory || '',
    realWorldApplications: meta.realWorldApplications || [],
    formulas: meta.formulas || [],
    stepByStepExample: meta.stepByStepExample || undefined,
    commonErrors: meta.commonErrors || [],
    bestPractices: meta.bestPractices || [],
    designCodes: meta.designCodes || [],
    faqs: meta.faqs || [],
    relatedCalculators: meta.relatedCalculators || [],
    references: meta.references || [],
    blocks: Array.isArray(meta.blocks) ? meta.blocks : [],
    seo: {
      seoTitle: meta.seo?.seoTitle || (title + ' | CivilMath'),
      metaDescription: meta.seo?.metaDescription || excerpt,
      primaryKeyword: meta.seo?.primaryKeyword || (tags[0] || category),
      secondaryKeywords: meta.seo?.secondaryKeywords || [],
      lsiKeywords: meta.seo?.lsiKeywords || [],
      canonicalUrl: meta.seo?.canonicalUrl || ('https://civilmath.com/articles/' + slug),
      ogImage: coverImage || meta.seo?.ogImage,
      noindex: Boolean(meta.seo?.noindex),
    },
    isBuiltin: false,
  };
}

export function articleToRow(article, extraColumns = {}) {
  const now = new Date().toISOString();
  const status = article.status === 'draft' ? 'draft' : 'published';
  const contentFormat = article.contentFormat || article.content_format || 'html';
  const coverImageUrl = article.coverImageUrl || article.cover_image_url || article.coverImage || article.imageUrl || article.image_url || '';
  const excerpt = article.excerpt || article.summary || '';
  const category = article.category || 'general';
  const tags = Array.isArray(article.tags) ? article.tags : [category];
  const createdAt = article.createdAt || article.publishedAt || article.created_at || now;

  const meta = {
    excerpt,
    category,
    author: article.author || 'CivilMath Engineering Editorial Team',
    readTimeMinutes: article.readTimeMinutes || 5,
    h1: article.h1 || article.title,
    status,
    content_format: contentFormat,
    coverImage: coverImageUrl,
    introduction: article.introduction || '',
    theory: article.theory || '',
    realWorldApplications: article.realWorldApplications || [],
    formulas: article.formulas || [],
    stepByStepExample: article.stepByStepExample || undefined,
    commonErrors: article.commonErrors || [],
    bestPractices: article.bestPractices || [],
    designCodes: article.designCodes || [],
    faqs: article.faqs || [],
    relatedCalculators: article.relatedCalculators || [],
    references: article.references || [],
    blocks: Array.isArray(article.blocks) ? article.blocks : [],
    seo: article.seo || {
      seoTitle: (article.title || 'Untitled Article') + ' | CivilMath',
      metaDescription: excerpt,
      primaryKeyword: tags[0] || 'general',
      secondaryKeywords: [],
      lsiKeywords: [],
    },
  };

  const row = {
    slug: article.slug,
    title: article.title,
    content: article.content || '',
    summary: JSON.stringify(meta),
    tags,
    image_url: coverImageUrl,
    published: status !== 'draft',
    published_at: article.publishedAt || article.published_at || createdAt,
    updated_at: now,
  };

  // If caller specifically requests/knows extra columns exist in Supabase:
  if (extraColumns && typeof extraColumns === 'object') {
    if (extraColumns.status) row.status = status;
    if (extraColumns.excerpt) row.excerpt = excerpt;
    if (extraColumns.cover_image_url) row.cover_image_url = coverImageUrl;
    if (extraColumns.category) row.category = category;
    if (extraColumns.content_format) row.content_format = contentFormat;
    if (extraColumns.created_at) row.created_at = createdAt;
  }

  return row;
}

