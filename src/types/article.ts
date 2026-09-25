export type ArticleCategory =
  | 'concrete'
  | 'structural'
  | 'bbs'
  | 'geotech'
  | 'survey'
  | 'utility'
  | 'general';

export interface ArticleFormula {
  name: string;
  equation: string;
  variables?: { symbol: string; meaning: string; unit: string }[];
  reference?: string;
}

export interface ArticleApplication {
  title: string;
  description: string;
}

export interface ArticleStepExample {
  scenario: string;
  given: Record<string, string>;
  steps: { title: string; explanation: string }[];
  finalAnswer: string;
}

export interface ArticleCommonError {
  error: string;
  cause: string;
  solution: string;
}

export interface ArticleDesignCode {
  code: string;
  description: string;
}

export interface ArticleFaq {
  question: string;
  answer: string;
}

export interface ArticleRelatedCalc {
  name: string;
  url: string;
}

export interface ArticleSEO {
  seoTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  lsiKeywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
  noindex?: boolean;
}

export interface Article {
  id?: string;
  slug: string;
  title: string;
  h1?: string;
  excerpt: string;
  category: ArticleCategory;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  readTimeMinutes: number;
  status: 'published' | 'draft';
  coverImage?: string;
  tags: string[];

  // Main / Markdown content
  content?: string;

  // Structured engineering article sections
  introduction?: string;
  theory?: string;
  realWorldApplications?: ArticleApplication[];
  formulas?: ArticleFormula[];
  stepByStepExample?: ArticleStepExample;
  commonErrors?: ArticleCommonError[];
  bestPractices?: string[];
  designCodes?: ArticleDesignCode[];
  faqs?: ArticleFaq[];
  relatedCalculators?: ArticleRelatedCalc[];
  references?: string[];

  // SEO
  seo: ArticleSEO;

  // Metadata
  isBuiltin?: boolean;
}

export interface SeoAuditCheck {
  id: string;
  label: string;
  passed: boolean;
  score: number;
  weight: number;
  feedback: string;
  type: 'title' | 'description' | 'slug' | 'keyword' | 'content' | 'structure';
}

export interface SeoAuditResult {
  score: number; // 0 - 100
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  checks: SeoAuditCheck[];
  keywordDensity: number;
  wordCount: number;
  readingTimeMinutes: number;
}
