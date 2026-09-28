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
  status: 'published' | 'draft' | 'scheduled' | 'archived';
  coverImage?: string;
  coverImageAlt?: string;
  tags: string[];

  // Analytics & Scheduling
  viewCount?: number;
  scheduledAt?: string;

  // Display control flags
  featured?: boolean;
  allowComments?: boolean;
  seoIndex?: boolean;
  showAuthor?: boolean;
  showRelatedArticles?: boolean;
  showRelatedCalculators?: boolean;
  showFaq?: boolean;

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

  // Structured Content Blocks (v2 Architecture)
  blocks?: ArticleBlock[];

  // SEO
  seo: ArticleSEO;

  // Metadata
  isBuiltin?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Structured Block Types & Models
// ─────────────────────────────────────────────────────────────

export type ArticleBlockType =
  // Basic Content
  | 'paragraph'
  | 'heading_2'
  | 'heading_3'
  | 'bullet_list'
  | 'numbered_list'
  | 'quote'
  | 'divider'
  // Engineering Content
  | 'formula'
  | 'calculation_example'
  | 'engineering_note'
  | 'warning'
  | 'key_takeaway'
  | 'definition'
  | 'step_by_step'
  | 'table'
  // Visual Content
  | 'image'
  | 'image_text'
  | 'two_column'
  // Conversion Content
  | 'calculator_cta'
  | 'calculator_embed'
  | 'related_calculator'
  | 'related_article'
  | 'tool_recommendation'
  // FAQ
  | 'faq';

export interface FormulaVariable {
  symbol: string;
  meaning: string;
  unit?: string;
}

export interface FormulaBlockData {
  title?: string;
  equation: string;
  variables?: FormulaVariable[];
  unit?: string;
  explanation?: string;
  reference?: string;
}

export interface CalculationInput {
  label: string;
  value: string;
  unit?: string;
}

export interface CalculationExampleBlockData {
  title: string;
  scenario?: string;
  inputs: CalculationInput[];
  formula?: string;
  calculation?: string;
  result: string;
  unit?: string;
  note?: string;
}

export interface EngineeringNoteBlockData {
  title?: string;
  note: string;
  icon?: 'info' | 'shield' | 'check' | 'lightbulb' | 'wrench';
  reference?: string;
}

export interface WarningBlockData {
  title?: string;
  message: string;
  severity?: 'warning' | 'danger' | 'caution';
}

export interface KeyTakeawayBlockData {
  title?: string;
  items: string[];
}

export interface DefinitionBlockData {
  term: string;
  definition: string;
  context?: string;
  formula?: string;
}

export interface StepItem {
  stepNumber?: number;
  title: string;
  description: string;
  detail?: string;
}

export interface StepByStepBlockData {
  title?: string;
  steps: StepItem[];
}

export interface TableBlockData {
  title?: string;
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface ImageBlockData {
  url: string;
  alt?: string;
  caption?: string;
  figureNumber?: string;
  layout?: 'full' | 'standard' | 'small' | 'two-column';
  link?: string;
}

export interface ImageTextBlockData {
  url: string;
  alt?: string;
  caption?: string;
  text: string;
  imagePosition?: 'left' | 'right';
}

export interface TwoColumnBlockData {
  leftTitle?: string;
  leftContent: string;
  rightTitle?: string;
  rightContent: string;
}

export interface CalculatorCtaBlockData {
  calculatorId?: string;
  calculatorUrl: string;
  title: string;
  description: string;
  buttonText?: string;
}

export interface CalculatorEmbedBlockData {
  calculatorId: string;
  calculatorName?: string;
  description?: string;
  title?: string;
  initialInputs?: Record<string, any>;
  showFullWorkspace?: boolean;
}

export interface RelatedArticlesBlockData {
  title?: string;
  articleSlugs: string[];
}

export interface FaqBlockData {
  title?: string;
  faqs: { question: string; answer: string }[];
}

export interface ListBlockData {
  items: string[];
}

export interface QuoteBlockData {
  quote: string;
  author?: string;
  source?: string;
}

export interface ArticleBlockStyling {
  alignment?: 'left' | 'center' | 'right';
  variant?: 'default' | 'blueprint' | 'subtle' | 'accent' | 'warning' | 'danger';
}

export interface ArticleBlock {
  id: string;
  type: ArticleBlockType;
  order: number;
  visibility?: boolean;
  title?: string;
  description?: string;
  content?: string;
  styling?: ArticleBlockStyling;
  data?: any;
  metadata?: Record<string, any>;
}

/**
 * Converts a legacy article structure (introduction, theory, formulas, step-by-step example,
 * real-world applications, common errors, faqs, etc.) into modern ArticleBlocks.
 * Ensures 100% backward compatibility for existing articles.
 */
export function legacyArticleToBlocks(article: Partial<Article>): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  let order = 0;

  const nextId = (prefix: string) => `${prefix}_${order}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Engineering Disclaimer / Warning
  blocks.push({
    id: nextId('warning'),
    type: 'warning',
    order: order++,
    title: 'Engineering Verification Disclaimer',
    visibility: true,
    data: {
      title: 'Engineering Verification Disclaimer',
      message: 'Educational and planning reference only. All engineering formulas, coefficients, and nominal assumptions must be independently verified against project drawings, site conditions, and approved by a licensed professional engineer.',
      severity: 'warning',
    } as WarningBlockData,
  });

  // 2. Calculator CTA if related calculator exists
  if (article.relatedCalculators && article.relatedCalculators.length > 0) {
    const calc = article.relatedCalculators[0];
    blocks.push({
      id: nextId('calc_cta'),
      type: 'calculator_cta',
      order: order++,
      visibility: true,
      data: {
        calculatorUrl: calc.url,
        title: `Interactive ${calc.name || 'Engineering Calculator'} Available`,
        description: 'Execute instant numerical calculations, material conversions, and dimension checks using our dedicated civil calculator.',
        buttonText: 'Open Calculator →',
      } as CalculatorCtaBlockData,
    });
  }

  // 3. Introduction
  if (article.introduction && article.introduction.trim()) {
    blocks.push({
      id: nextId('heading_intro'),
      type: 'heading_2',
      order: order++,
      visibility: true,
      content: 'Introduction & Engineering Overview',
    });

    const paras = article.introduction.split('\n\n').map(p => p.trim()).filter(Boolean);
    for (const para of paras) {
      blocks.push({
        id: nextId('para'),
        type: 'paragraph',
        order: order++,
        visibility: true,
        content: para,
      });
    }
  }

  // 4. Engineering Theory
  if (article.theory && article.theory.trim()) {
    blocks.push({
      id: nextId('heading_theory'),
      type: 'heading_2',
      order: order++,
      visibility: true,
      content: 'Engineering Theory & Governing Laws',
    });

    const paras = article.theory.split('\n\n').map(p => p.trim()).filter(Boolean);
    for (const para of paras) {
      blocks.push({
        id: nextId('para'),
        type: 'paragraph',
        order: order++,
        visibility: true,
        content: para,
      });
    }

    blocks.push({
      id: nextId('note'),
      type: 'engineering_note',
      order: order++,
      visibility: true,
      data: {
        title: 'Engineering Insight',
        note: 'In structural and civil design, serviceability limits (such as deflection, crack width, and settlement) frequently govern over ultimate load-carrying strength. Always verify both limit states independently.',
        icon: 'info',
      } as EngineeringNoteBlockData,
    });
  }

  // 5. Formulas
  if (article.formulas && article.formulas.length > 0) {
    blocks.push({
      id: nextId('heading_formulas'),
      type: 'heading_2',
      order: order++,
      visibility: true,
      content: 'Governing Formulas & Equations',
    });

    for (const f of article.formulas) {
      blocks.push({
        id: nextId('formula'),
        type: 'formula',
        order: order++,
        visibility: true,
        title: f.name,
        data: {
          title: f.name,
          equation: f.equation,
          variables: f.variables?.map(v => ({
            symbol: v.symbol,
            meaning: v.meaning,
            unit: v.unit,
          })),
          reference: f.reference,
        } as FormulaBlockData,
      });
    }
  }

  // 6. Step-by-Step Example
  if (article.stepByStepExample) {
    const ex = article.stepByStepExample;
    blocks.push({
      id: nextId('heading_example'),
      type: 'heading_2',
      order: order++,
      visibility: true,
      content: 'Worked Calculation Example',
    });

    const inputs: CalculationInput[] = ex.given
      ? Object.entries(ex.given).map(([label, value]) => ({ label, value }))
      : [];

    let stepsCalc = '';
    if (ex.steps && ex.steps.length > 0) {
      stepsCalc = ex.steps.map(s => `${s.title}: ${s.explanation}`).join('\n\n');
    }

    blocks.push({
      id: nextId('calc_example'),
      type: 'calculation_example',
      order: order++,
      visibility: true,
      data: {
        title: 'Worked Numerical Problem',
        scenario: ex.scenario,
        inputs,
        calculation: stepsCalc,
        result: ex.finalAnswer,
        note: 'Result verified according to standard structural detailing and code tolerances.',
      } as CalculationExampleBlockData,
    });
  }

  // 7. Markdown / Freeform Content
  if (article.content && article.content.trim()) {
    blocks.push({
      id: nextId('heading_guide'),
      type: 'heading_2',
      order: order++,
      visibility: true,
      content: 'Comprehensive Technical Guide',
    });

    const paras = article.content.split('\n\n').map(p => p.trim()).filter(Boolean);
    for (const para of paras) {
      blocks.push({
        id: nextId('para'),
        type: 'paragraph',
        order: order++,
        visibility: true,
        content: para,
      });
    }
  }

  // 8. Real World Applications
  if (article.realWorldApplications && article.realWorldApplications.length > 0) {
    blocks.push({
      id: nextId('heading_apps'),
      type: 'heading_2',
      order: order++,
      visibility: true,
      content: 'Practical Construction Applications',
    });

    for (const app of article.realWorldApplications) {
      blocks.push({
        id: nextId('note_app'),
        type: 'engineering_note',
        order: order++,
        visibility: true,
        data: {
          title: app.title,
          note: app.description,
          icon: 'wrench',
        } as EngineeringNoteBlockData,
      });
    }
  }

  // 9. Common Errors & Solutions
  if (article.commonErrors && article.commonErrors.length > 0) {
    blocks.push({
      id: nextId('heading_errors'),
      type: 'heading_2',
      order: order++,
      visibility: true,
      content: 'Common Pitfalls & Quality Control',
    });

    for (const err of article.commonErrors) {
      blocks.push({
        id: nextId('warn_err'),
        type: 'warning',
        order: order++,
        visibility: true,
        data: {
          title: `Pitfall: ${err.error}`,
          message: `Root Cause: ${err.cause}\nEngineering Solution: ${err.solution}`,
          severity: 'caution',
        } as WarningBlockData,
      });
    }
  }

  // 10. Best Practices
  if (article.bestPractices && article.bestPractices.length > 0) {
    blocks.push({
      id: nextId('takeaway_bp'),
      type: 'key_takeaway',
      order: order++,
      visibility: true,
      data: {
        title: 'Key Takeaways & Best Practices',
        items: article.bestPractices,
      } as KeyTakeawayBlockData,
    });
  }

  // 11. Design Codes
  if (article.designCodes && article.designCodes.length > 0) {
    blocks.push({
      id: nextId('heading_codes'),
      type: 'heading_2',
      order: order++,
      visibility: true,
      content: 'Applicable Design Codes & Standards',
    });

    blocks.push({
      id: nextId('table_codes'),
      type: 'table',
      order: order++,
      visibility: true,
      data: {
        title: 'Governing Standards',
        headers: ['Standard / Code', 'Application & Scope'],
        rows: article.designCodes.map(c => [c.code, c.description]),
      } as TableBlockData,
    });
  }

  // 12. FAQs
  if (article.faqs && article.faqs.length > 0) {
    blocks.push({
      id: nextId('faq_section'),
      type: 'faq',
      order: order++,
      visibility: true,
      title: 'Frequently Asked Questions',
      data: {
        title: 'Frequently Asked Questions',
        faqs: article.faqs,
      } as FaqBlockData,
    });
  }

  return blocks;
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
