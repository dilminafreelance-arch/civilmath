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
  const category = meta.category || 'general';
  const excerpt = meta.excerpt || row.summary || (content.length > 20 ? content.slice(0, 160) : title);

  return {
    id: row.id,
    slug,
    title,
    h1: meta.h1 || title,
    excerpt,
    category,
    author: meta.author || 'CivilMath Engineering Editorial Team',
    publishedAt: row.published_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
    readTimeMinutes: meta.readTimeMinutes || Math.max(2, Math.ceil((content.split(/\s+/).length || 500) / 200)),
    status: row.published === false ? 'draft' : (meta.status || 'published'),
    tags: Array.isArray(row.tags) && row.tags.length ? row.tags : [category],
    coverImage: row.image_url || meta.coverImage || '',
    content: content,
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
    seo: {
      seoTitle: meta.seo?.seoTitle || (title + ' | CivilMath'),
      metaDescription: meta.seo?.metaDescription || excerpt,
      primaryKeyword: meta.seo?.primaryKeyword || (row.tags?.[0] || category),
      secondaryKeywords: meta.seo?.secondaryKeywords || [],
      lsiKeywords: meta.seo?.lsiKeywords || [],
      canonicalUrl: meta.seo?.canonicalUrl || ('https://civilmath.com/articles/' + slug),
      ogImage: row.image_url || meta.seo?.ogImage,
      noindex: Boolean(meta.seo?.noindex),
    },
    isBuiltin: false,
  };
}

export function articleToRow(article) {
  const now = new Date().toISOString();

  const meta = {
    excerpt: article.excerpt || article.summary || '',
    category: article.category || 'general',
    author: article.author || 'CivilMath Engineering Editorial Team',
    readTimeMinutes: article.readTimeMinutes || 5,
    h1: article.h1 || article.title,
    status: article.status || 'published',
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
    seo: article.seo || {
      seoTitle: (article.title || 'Untitled Article') + ' | CivilMath',
      metaDescription: article.excerpt || '',
      primaryKeyword: (article.tags && article.tags[0]) || 'general',
      secondaryKeywords: [],
      lsiKeywords: [],
    },
  };

  return {
    slug: article.slug,
    title: article.title,
    content: article.content || '',
    summary: JSON.stringify(meta),
    tags: Array.isArray(article.tags) ? article.tags : [],
    image_url: article.coverImage || article.imageUrl || article.image_url || '',
    published_at: article.publishedAt || article.published_at || now,
    updated_at: now,
    published: article.status === 'draft' ? false : (article.published ?? true),
  };
}
