export interface ArticleData {
  seoTitle: string;
  metaDescription: string;
  slug: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  lsiKeywords: string[];
  breadcrumb: { label: string; url: string }[];
  h1: string;
  introduction: string;
  theory: string;
  realWorldApplications: { title: string; description: string }[];
  inputParameters: { name: string; purpose: string; unit: string; meaning: string; range: string; mistakes: string }[];
  calculationLogic: string;
  formulas: { name: string; equation: string; variables: { symbol: string; meaning: string; unit: string }[]; reference: string }[];
  stepByStepExample: { scenario: string; given: Record<string, string>; steps: { title: string; explanation: string }[]; finalAnswer: string };
  resultExplanation: string;
  commonErrors: { error: string; cause: string; solution: string }[];
  bestPractices: string[];
  designCodes: { code: string; description: string }[];
  faqs: { question: string; answer: string }[];
  relatedCalculators: { name: string; url: string }[];
  references: string[];
}

type ArticleLoader = () => Promise<ArticleData>;

const articleLoaders: Record<string, ArticleLoader> = {};

export function getArticleLoader(calculatorId: string): ArticleLoader | undefined {
  return articleLoaders[calculatorId];
}

export function registerArticle(calculatorId: string, loader: ArticleLoader) {
  articleLoaders[calculatorId] = loader;
}

// Register all calculator articles with dynamic imports
export function registerAllArticles() {
  registerArticle('concrete-volume', async () => (await import('./concreteVolume')).getArticle());
  registerArticle('rebar-calculator', async () => (await import('./rebar')).getArticle());
  registerArticle('brick-calculator', async () => (await import('./brick')).getArticle());
  registerArticle('structural-beam', async () => (await import('./beam')).getArticle());
  registerArticle('structural-column', async () => (await import('./column')).getArticle());
  registerArticle('structural-slab', async () => (await import('./slabDeflection')).getArticle());
  registerArticle('steel-calculator', async () => (await import('./steelWeight')).getArticle());
  registerArticle('survey-hi', async () => (await import('./hi')).getArticle());
  registerArticle('survey-coordinate', async () => (await import('./traverse')).getArticle());
  registerArticle('geotech-bearing', async () => (await import('./bearingCapacity')).getArticle());
  registerArticle('geotech-retaining', async () => (await import('./retainingWall')).getArticle());
  registerArticle('utility-convert', async () => (await import('./unitConverter')).getArticle());
  registerArticle('bbs-footing', async () => (await import('./bbsFooting')).getArticle());
  registerArticle('bbs-combined-footing', async () => (await import('./bbsCombinedFooting')).getArticle());
  registerArticle('bbs-strip-footing', async () => (await import('./bbsStripFooting')).getArticle());
  registerArticle('bbs-raft-foundation', async () => (await import('./bbsRaftFoundation')).getArticle());
  registerArticle('bbs-beam', async () => (await import('./bbsBeam')).getArticle());
  registerArticle('bbs-plinth-beam', async () => (await import('./bbsPlinthBeam')).getArticle());
  registerArticle('bbs-tie-beam', async () => (await import('./bbsTieBeam')).getArticle());
  registerArticle('bbs-lintel-beam', async () => (await import('./bbsLintelBeam')).getArticle());
  registerArticle('bbs-column', async () => (await import('./bbsColumn')).getArticle());
  registerArticle('bbs-pedestal', async () => (await import('./bbsPedestal')).getArticle());
  registerArticle('bbs-slab', async () => (await import('./bbsSlab')).getArticle());
  registerArticle('bbs-staircase', async () => (await import('./bbsStaircase')).getArticle());
  registerArticle('bbs-retaining-wall', async () => (await import('./bbsRetainingWall')).getArticle());
  registerArticle('bbs-foundation-mesh', async () => (await import('./bbsFoundationMesh')).getArticle());
}

registerAllArticles();
