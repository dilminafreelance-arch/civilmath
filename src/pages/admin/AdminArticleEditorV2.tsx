import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  ChangeEvent,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save, Sparkles, Eye, ArrowLeft, CheckCircle2,
  AlertTriangle, Globe, Share2, HelpCircle, Code,
  Smartphone, Monitor, Plus, Trash2, Check, RefreshCw,
  Image as ImageIcon, Upload, X, Link as LinkIcon, Loader2,
  FileImage, CheckCircle, ExternalLink, MoveUp, MoveDown,
  Copy, EyeOff, ChevronDown, ChevronUp, Layers, Table as TableIcon,
  Calculator, FileText, AlertOctagon, Lightbulb, BookmarkCheck,
  Columns, AlignLeft, Info, Calendar, Tag, ToggleLeft, ToggleRight,
  Users, Zap, Shield, Settings2, Clock, BarChart2, Star,
  MessageSquare, Search, BookOpen, Wrench
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import {
  Article,
  ArticleCategory,
  ArticleBlock,
  ArticleBlockType,
  FormulaBlockData,
  CalculationExampleBlockData,
  EngineeringNoteBlockData,
  WarningBlockData,
  KeyTakeawayBlockData,
  DefinitionBlockData,
  StepByStepBlockData,
  TableBlockData,
  ImageBlockData,
  ImageTextBlockData,
  TwoColumnBlockData,
  CalculatorCtaBlockData,
  CalculatorEmbedBlockData,
  RelatedArticlesBlockData,
  FaqBlockData,
  ListBlockData,
  QuoteBlockData,
  legacyArticleToBlocks,
} from '../../types/article';
import CalculatorEmbedCard, { EMBEDDABLE_CALCULATORS } from '../../components/article/CalculatorEmbedCard';
import {
  getArticleBySlug,
  saveArticle,
  uploadArticleImage,
  getAllArticleSummaries,
} from '../../utils/articleStore';
import { autoGenerateSeo, auditArticleSeo, slugify } from '../../utils/autoSeo';
import { CATEGORY_DEFAULT_IMAGES } from '../../data/articleVisuals';
import { SITE_URL } from '../../utils/seo';
import ArticleRenderer from '../../components/article/ArticleRenderer';
import MathFormula from '../../components/article/MathFormula';
import CalculationCard from '../../components/article/CalculationCard';

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES: { id: ArticleCategory; label: string }[] = [
  { id: 'concrete', label: 'Concrete & Materials' },
  { id: 'structural', label: 'Structural Engineering' },
  { id: 'bbs', label: 'Bar Bending Schedule (BBS)' },
  { id: 'geotech', label: 'Geotechnical Engineering' },
  { id: 'survey', label: 'Surveying & Leveling' },
  { id: 'utility', label: 'Engineering Utilities' },
  { id: 'general', label: 'General Civil Engineering' },
];

export const AVAILABLE_CALCULATORS = [
  { id: 'concrete-volume', name: 'Concrete Volume & Mix Ratio Estimator', url: '/concrete/volume', category: 'concrete' },
  { id: 'rebar-calculator', name: 'Reinforcing Rebar Quantity Calculator', url: '/concrete/rebar', category: 'concrete' },
  { id: 'brick-calculator', name: 'Brick & Wall Mortar Estimator', url: '/concrete/brick', category: 'concrete' },
  { id: 'structural-beam', name: 'Beam Analysis (Simply Supported & Cantilever)', url: '/structural/beam', category: 'structural' },
  { id: 'structural-column', name: 'RCC Column Axial Capacity (ACI 318)', url: '/structural/column', category: 'structural' },
  { id: 'structural-slab', name: 'Slab Deflection & Thickness Estimator', url: '/structural/slab', category: 'structural' },
  { id: 'steel-calculator', name: 'Structural Steel Section Weight Calculator', url: '/structural/steel-weight', category: 'structural' },
  { id: 'survey-hi', name: 'Height of Instrument (HI) Survey Calculator', url: '/surveying/hi', category: 'survey' },
  { id: 'survey-coordinate', name: 'Coordinate Traverse & Bowditch Adjustment', url: '/surveying/traverse', category: 'survey' },
  { id: 'geotech-bearing', name: 'Soil Bearing Capacity (Terzaghi & Meyerhof)', url: '/geotechnical/bearing-capacity', category: 'geotech' },
  { id: 'geotech-retaining', name: 'Retaining Wall Earth Pressure (Rankine & Coulomb)', url: '/geotechnical/retaining-wall', category: 'geotech' },
  { id: 'utility-convert', name: 'Civil Engineering Unit Converter', url: '/utilities/unit-converter', category: 'utility' },
  { id: 'bbs-footing', name: 'Isolated Footing Bar Bending Schedule (BBS)', url: '/bbs/footing', category: 'bbs' },
  { id: 'bbs-beam', name: 'Beam Bar Bending Schedule (BBS)', url: '/bbs/beam', category: 'bbs' },
  { id: 'bbs-column', name: 'Column Bar Bending Schedule (BBS)', url: '/bbs/column', category: 'bbs' },
  { id: 'bbs-slab', name: 'Floor Slab Bar Bending Schedule (BBS)', url: '/bbs/slab', category: 'bbs' },
  { id: 'bbs-staircase', name: 'Staircase Bar Bending Schedule (BBS)', url: '/bbs/staircase', category: 'bbs' },
  { id: 'bbs-raft', name: 'Raft Foundation Bar Bending Schedule (BBS)', url: '/bbs/raft-foundation', category: 'bbs' },
];

// ─── Default Block Factory ────────────────────────────────────────────────

function createDefaultBlock(type: ArticleBlockType, order: number): ArticleBlock {
  const id = `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  switch (type) {
    case 'paragraph':
      return { id, type, order, visibility: true, content: 'Enter detailed civil engineering explanation or site guidelines...' };
    case 'heading_2':
      return { id, type, order, visibility: true, content: 'New Section Heading' };
    case 'heading_3':
      return { id, type, order, visibility: true, content: 'Sub-section Heading' };
    case 'bullet_list':
      return { id, type, order, visibility: true, data: { items: ['Key point 1', 'Key point 2', 'Key point 3'] } as ListBlockData };
    case 'numbered_list':
      return { id, type, order, visibility: true, data: { items: ['First action or criterion', 'Second verification step', 'Third quality check'] } as ListBlockData };
    case 'quote':
      return { id, type, order, visibility: true, data: { quote: 'Safety and durability are the primary responsibilities of the engineer.', author: 'Civil Engineering Standard of Care' } as QuoteBlockData };
    case 'divider':
      return { id, type, order, visibility: true };
    case 'formula':
      return {
        id, type, order, visibility: true, title: 'Concrete Volume Formula',
        data: {
          title: 'Concrete Volume Formula',
          equation: 'V = L \\times W \\times T',
          variables: [
            { symbol: 'V', meaning: 'Concrete Volume', unit: 'm³' },
            { symbol: 'L', meaning: 'Length', unit: 'm' },
            { symbol: 'W', meaning: 'Width', unit: 'm' },
            { symbol: 'T', meaning: 'Thickness', unit: 'm' },
          ],
          unit: 'm³',
          explanation: 'The volume is calculated by multiplying length, width, and thickness.',
          reference: 'IS 456 / BS 8110',
        } as FormulaBlockData,
      };
    case 'calculation_example':
      return {
        id, type, order, visibility: true, title: 'Concrete Slab Calculation',
        data: {
          title: 'Concrete Slab Calculation',
          scenario: 'Calculate the total volume of ready-mix concrete required for a residential floor slab measuring 6.0 m by 4.0 m with a thickness of 150 mm.',
          inputs: [
            { label: 'Length', value: '6.00', unit: 'm' },
            { label: 'Width', value: '4.00', unit: 'm' },
            { label: 'Thickness', value: '0.15', unit: 'm' },
          ],
          formula: 'V = L \\times W \\times T',
          calculation: 'V = 6.00 \\times 4.00 \\times 0.15 = 3.60',
          result: '3.60',
          unit: 'm³',
          note: 'Theoretical geometric neat volume. Consider ordering 5% additional allowance for wastage and subgrade irregularities.',
        } as CalculationExampleBlockData,
      };
    case 'engineering_note':
      return {
        id, type, order, visibility: true, title: 'Important Engineering Practice',
        data: {
          title: 'Important Engineering Practice',
          note: 'Always convert all dimensions into consistent SI units before executing volumetric calculations.',
          icon: 'info',
        } as EngineeringNoteBlockData,
      };
    case 'warning':
      return {
        id, type, order, visibility: true, title: 'Engineering Verification Required',
        data: {
          title: 'Engineering Verification Required',
          message: 'The calculated quantity represents theoretical neat volume. Actual ordering must account for project site wastage, pumping losses, and approved construction drawings.',
          severity: 'warning',
        } as WarningBlockData,
      };
    case 'key_takeaway':
      return {
        id, type, order, visibility: true, title: 'Key Takeaways',
        data: {
          title: 'Key Takeaways',
          items: [
            'Convert all dimensions to the same unit before multiplying.',
            'Use the correct geometric formula matching element profile.',
            'Multiply by the number of identical structural elements.',
            'Verify dimensions against approved for construction (IFC) drawings.',
          ],
        } as KeyTakeawayBlockData,
      };
    case 'definition':
      return {
        id, type, order, visibility: true, title: 'Dry Volume Factor (1.54)',
        data: {
          term: 'Dry Volume Factor (1.54)',
          definition: 'The multiplier used in concrete estimation to account for the void ratio reduction when dry cement, sand, and aggregate are mixed with water.',
          context: 'Standard multiplier adopted in IS 456 and quantity estimation practice.',
          formula: 'V_{dry} = 1.54 \\times V_{wet}',
        } as DefinitionBlockData,
      };
    case 'step_by_step':
      return {
        id, type, order, visibility: true, title: 'Calculation Procedure',
        data: {
          title: 'Calculation Procedure',
          steps: [
            { stepNumber: 1, title: 'Measure the length', description: 'Determine the clear length along the centerline from approved plans.' },
            { stepNumber: 2, title: 'Measure the width', description: 'Measure the transverse dimension perpendicular to the length.' },
            { stepNumber: 3, title: 'Convert thickness to metres', description: 'Convert slab or wall thickness (e.g. 150 mm = 0.15 m).' },
            { stepNumber: 4, title: 'Apply the volumetric formula', description: 'Multiply Length × Width × Thickness to obtain wet volume.' },
            { stepNumber: 5, title: 'Check the final quantity', description: 'Add 5% waste factor for concrete ordering schedule.' },
          ],
        } as StepByStepBlockData,
      };
    case 'table':
      return {
        id, type, order, visibility: true, title: 'Material Quantities Table',
        data: {
          title: 'Material Quantities Table',
          headers: ['Element', 'Length', 'Width', 'Thickness', 'Volume'],
          rows: [
            ['Ground Slab', '6.00 m', '4.00 m', '0.15 m', '3.60 m³'],
            ['Isolated Footing F1', '1.80 m', '1.80 m', '0.45 m', '1.46 m³'],
            ['Main Column C1', '0.30 m', '0.45 m', '3.20 m', '0.43 m³'],
          ],
          caption: 'Table 1: Geometric summary and nominal neat volumes',
        } as TableBlockData,
      };
    case 'image':
      return {
        id, type, order, visibility: true, title: 'Structural Diagram',
        data: {
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=1200&q=80',
          alt: 'Concrete slab volume dimension diagram',
          caption: 'Figure 1: Measurement dimensions for rectangular concrete slab',
          figureNumber: 'Figure 1',
          layout: 'standard',
        } as ImageBlockData,
      };
    case 'image_text':
      return {
        id, type, order, visibility: true, title: 'Reinforcement Detailing & Placement',
        data: {
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80',
          alt: 'Rebar placement',
          caption: 'Clear cover spacing check',
          text: 'Proper placement of rebar chairs ensures the minimum concrete cover is maintained during the pour, preventing corrosion and ensuring fire rating compliance.',
          imagePosition: 'left',
        } as ImageTextBlockData,
      };
    case 'two_column':
      return {
        id, type, order, visibility: true, title: 'Comparison: Nominal Mix vs Design Mix',
        data: {
          leftTitle: 'Nominal Concrete Mix',
          leftContent: 'Proportions fixed by volume (e.g. 1:1.5:3 for M20).\nBest for small residential buildings up to M20 grade.\nHigher cement usage and variability in compressive strength.',
          rightTitle: 'Design Concrete Mix',
          rightContent: 'Proportions determined through laboratory testing and moisture correction.\nRequired for structural grades M25 and above.\nOptimized cement content and certified standard deviation.',
        } as TwoColumnBlockData,
      };
    case 'calculator_embed':
      return {
        id,
        type,
        order,
        visibility: true,
        title: 'Concrete Volume Calculator',
        data: {
          calculatorId: 'concrete-volume',
          calculatorName: 'Concrete Volume Calculator',
          description: 'Interactive calculator for concrete neat volume and dry ingredient estimation.',
          initialInputs: { length: 5, width: 3, thickness: 0.15 },
        } as CalculatorEmbedBlockData,
      };
    case 'calculator_cta':
      return {
        id, type, order, visibility: true, title: 'Calculate Concrete Volume',
        data: {
          calculatorUrl: '/concrete/volume',
          title: 'Calculate Concrete Volume',
          description: 'Calculate concrete quantities and dry materials (cement, sand, aggregate) for slabs, beams, columns, and footings.',
          buttonText: 'Open Concrete Calculator →',
        } as CalculatorCtaBlockData,
      };
    case 'related_calculator':
      return {
        id, type, order, visibility: true, title: 'Related Rebar Calculator',
        data: {
          calculatorUrl: '/concrete/rebar',
          title: 'Rebar Weight & Quantity Estimator',
          description: 'Estimate rebar cut lengths, standard bend deductions, and total tonnage by diameter.',
          buttonText: 'Open Rebar Calculator →',
        } as CalculatorCtaBlockData,
      };
    case 'related_article':
      return {
        id, type, order, visibility: true, title: 'Related Engineering Guides',
        data: { title: 'Related Engineering Guides', articleSlugs: [] } as RelatedArticlesBlockData,
      };
    case 'tool_recommendation':
      return {
        id, type, order, visibility: true, title: 'Recommended CivilMath Tool',
        data: {
          calculatorUrl: '/utilities/unit-converter',
          title: 'Civil Engineering Unit Converter',
          description: 'Instantly convert between SI metric, US imperial, and UK construction units.',
          buttonText: 'Launch Converter →',
        } as CalculatorCtaBlockData,
      };
    case 'faq':
      return {
        id, type, order, visibility: true, title: 'Frequently Asked Questions',
        data: {
          title: 'Frequently Asked Questions',
          faqs: [
            { question: 'How do I calculate concrete volume for a rectangular slab?', answer: 'Multiply length by width by thickness in consistent units (metres). For example, 6m × 4m × 0.15m = 3.60 m³.' },
            { question: 'Why is the dry volume factor 1.54 used in concrete estimation?', answer: 'When dry cement, sand, and aggregate are mixed with water, air voids collapse and hydration occurs, reducing volume by approximately 35%. Multiplying wet volume by 1.54 gives the dry ingredients volume required.' },
          ],
        } as FaqBlockData,
      };
    default:
      return { id, type: 'paragraph', order, visibility: true, content: '' };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
}

// ─── Toggle Component ────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group">
      <span className="text-xs text-[#20231F] dark:text-[#EAE7E0] group-hover:text-[#657565] transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors cursor-pointer ${checked ? 'bg-[#657565] border-[#536153]' : 'bg-[#D8D0C2] dark:bg-[#384238] border-[#D8D0C2] dark:border-[#384238]'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform mt-px ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function AdminArticleEditorV2() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(slug);

  // ── Core state ──
  const [loading, setLoading] = useState(isEditing);
  const [activeTab, setActiveTab] = useState<'blocks' | 'content' | 'seo' | 'settings' | 'preview'>('blocks');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autoSeoRunning, setAutoSeoRunning] = useState(false);
  const [autoSeoSuccess, setAutoSeoSuccess] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [selectedBlockCategory, setSelectedBlockCategory] = useState<'basic' | 'engineering' | 'visual' | 'conversion' | 'faq'>('engineering');
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [allArticlesList, setAllArticlesList] = useState<Article[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [showPublishSidebar, setShowPublishSidebar] = useState(false);

  // ── Autosave state ──
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Image upload state ──
  const [uploadingCover, setUploadingCover] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // ── Article options state ──
  const [articleOptions, setArticleOptions] = useState({
    allowComments: true,
    seoIndexable: true,
    showAuthor: true,
    showRelatedArticles: true,
    showRelatedCalculators: true,
    showFaq: true,
    featured: false,
    visibility: 'public' as 'public' | 'private',
    scheduledDate: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    canonicalUrl: '',
  });

  // ── Tag input state ──
  const [tagInputValue, setTagInputValue] = useState('');
  const [secTagInput, setSecTagInput] = useState('');

  // ── Article state ──
  const [article, setArticle] = useState<Article>({
    slug: '',
    title: '',
    h1: '',
    excerpt: '',
    category: 'concrete',
    author: 'CivilMath Engineering Lead',
    publishedAt: new Date().toISOString(),
    readTimeMinutes: 5,
    status: 'draft',
    tags: ['concrete', 'guide'],
    blocks: [],
    seo: {
      seoTitle: '',
      metaDescription: '',
      primaryKeyword: '',
      secondaryKeywords: [],
      lsiKeywords: [],
    },
  });

  // ── Load article if editing ──
  useEffect(() => {
    const list = getAllArticleSummaries();
    setAllArticlesList(list);

    if (isEditing && slug) {
      setLoading(true);
      getArticleBySlug(slug).then(loaded => {
        if (loaded) {
          let effectiveArticle = { ...loaded };
          if (!effectiveArticle.blocks || effectiveArticle.blocks.length === 0) {
            effectiveArticle.blocks = legacyArticleToBlocks(loaded);
          }
          setArticle(effectiveArticle);
          const exp: Record<string, boolean> = {};
          effectiveArticle.blocks.slice(0, 3).forEach(b => { exp[b.id] = true; });
          setExpandedBlocks(exp);
        } else {
          navigate('/admin');
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      const starterBlocks: ArticleBlock[] = [
        createDefaultBlock('warning', 0),
        createDefaultBlock('calculator_cta', 1),
        createDefaultBlock('heading_2', 2),
        createDefaultBlock('paragraph', 3),
        createDefaultBlock('formula', 4),
        createDefaultBlock('calculation_example', 5),
        createDefaultBlock('engineering_note', 6),
        createDefaultBlock('key_takeaway', 7),
        createDefaultBlock('faq', 8),
      ];
      setArticle(prev => ({ ...prev, blocks: starterBlocks }));
      const exp: Record<string, boolean> = {};
      starterBlocks.slice(0, 4).forEach(b => { exp[b.id] = true; });
      setExpandedBlocks(exp);
    }
  }, [slug, isEditing, navigate]);

  // ── Autosave to localStorage every 30 s ──
  useEffect(() => {
    if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    autosaveTimerRef.current = setInterval(() => {
      if (isDirty) {
        try {
          localStorage.setItem(
            `civilmath_draft_${article.slug || 'new'}`,
            JSON.stringify({ article, articleOptions, savedAt: new Date().toISOString() })
          );
          setLastSavedAt(new Date());
          setElapsedSeconds(0);
        } catch (_) { /* storage quota */ }
      }
    }, 30000);
    return () => { if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current); };
  }, [isDirty, article, articleOptions]);

  // ── Elapsed timer ticks every second ──
  useEffect(() => {
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    if (lastSavedAt) {
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - lastSavedAt.getTime()) / 1000));
      }, 1000);
    }
    return () => { if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current); };
  }, [lastSavedAt]);

  // ── SEO audit ──
  const seoAudit = useMemo(() => auditArticleSeo(article), [article]);

  // ── Mark dirty ──
  const updateArticle = useCallback((updater: (prev: Article) => Article) => {
    setIsDirty(true);
    setArticle(updater);
  }, []);

  const updateOptions = useCallback((patch: Partial<typeof articleOptions>) => {
    setIsDirty(true);
    setArticleOptions(prev => ({ ...prev, ...patch }));
  }, []);

  // ── Quality checklist ──
  const qualityChecks = useMemo(() => {
    const blocks = article.blocks || [];
    const hasFaq = blocks.some(b => b.type === 'faq');
    const hasFormula = blocks.some(b => b.type === 'formula');
    const hasCalc = blocks.some(b => b.type === 'calculator_cta' || b.type === 'related_calculator');

    return [
      { id: 'title', label: 'Article Title', passed: article.title.trim().length > 5, warning: false },
      { id: 'slug', label: 'URL Slug', passed: article.slug.trim().length > 3, warning: false },
      { id: 'excerpt', label: 'Short Description', passed: article.excerpt?.trim().length > 20, warning: false },
      { id: 'category', label: 'Category selected', passed: Boolean(article.category), warning: false },
      { id: 'cover', label: 'Cover Image', passed: Boolean(article.coverImage), warning: false },
      { id: 'seoTitle', label: 'SEO Title', passed: article.seo.seoTitle.trim().length > 10, warning: false },
      { id: 'metaDesc', label: 'Meta Description', passed: article.seo.metaDescription.trim().length > 50, warning: false },
      { id: 'keyword', label: 'Focus Keyword', passed: article.seo.primaryKeyword.trim().length > 2, warning: false },
      { id: 'blocks', label: 'Content blocks (≥3)', passed: blocks.length >= 3, warning: false },
      { id: 'faq', label: 'FAQ block', passed: hasFaq, warning: true },
      { id: 'formula', label: 'Formula block', passed: hasFormula, warning: true },
      { id: 'calculator', label: 'Calculator embed', passed: hasCalc, warning: true },
    ];
  }, [article]);

  const qualityScore = qualityChecks.filter(c => c.passed).length;
  const qualityTotal = qualityChecks.length;

  // ── Auto SEO ──
  const handleAutoSeo = async () => {
    setAutoSeoRunning(true);
    setAutoSeoSuccess(false);
    try {
      const blockText = (article.blocks || [])
        .map(b => b.content || b.title || b.data?.title || b.data?.note || b.data?.explanation || '')
        .join(' ');
      const generated = autoGenerateSeo({
        title: article.title,
        category: article.category,
        content: blockText || article.content || article.introduction,
        introduction: article.introduction,
        theory: article.theory,
        slug: article.slug,
      });
      updateArticle(prev => ({
        ...prev,
        slug: prev.slug || generated.slug,
        excerpt: prev.excerpt || generated.excerpt,
        seo: {
          seoTitle: generated.seoTitle,
          metaDescription: generated.metaDescription,
          primaryKeyword: generated.primaryKeyword,
          secondaryKeywords: generated.secondaryKeywords,
          lsiKeywords: generated.lsiKeywords,
          canonicalUrl: generated.canonicalUrl,
        },
      }));
      setAutoSeoSuccess(true);
      setTimeout(() => setAutoSeoSuccess(false), 3000);
    } finally {
      setAutoSeoRunning(false);
    }
  };

  // ── Save ──
  const handleSave = async (targetStatus?: 'published' | 'draft') => {
    if (!article.title.trim()) { alert('Please provide an article title.'); return; }
    setSaveStatus('saving');
    const finalSlug = (article.slug || slugify(article.title)).toLowerCase().trim();
    let finalSeo = { ...article.seo };
    if (!finalSeo.seoTitle || !finalSeo.primaryKeyword) {
      const blockText = (article.blocks || []).map(b => b.content || b.title || '').join(' ');
      const auto = autoGenerateSeo({ title: article.title, category: article.category, content: blockText || article.excerpt, slug: finalSlug });
      finalSeo = {
        seoTitle: finalSeo.seoTitle || auto.seoTitle,
        metaDescription: finalSeo.metaDescription || auto.metaDescription,
        primaryKeyword: finalSeo.primaryKeyword || auto.primaryKeyword,
        secondaryKeywords: finalSeo.secondaryKeywords?.length ? finalSeo.secondaryKeywords : auto.secondaryKeywords,
        lsiKeywords: finalSeo.lsiKeywords?.length ? finalSeo.lsiKeywords : auto.lsiKeywords,
      };
    }
    const articleToSave: Article = {
      ...article,
      slug: finalSlug,
      h1: article.h1 || article.title,
      status: targetStatus || article.status || 'draft',
      seo: finalSeo,
    };
    try {
      await saveArticle(articleToSave);
      setArticle(articleToSave);
      setIsDirty(false);
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      setElapsedSeconds(0);
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  // ── Block management ──
  const addBlock = useCallback((type: ArticleBlockType) => {
    const currentBlocks = article.blocks || [];
    const newBlock = createDefaultBlock(type, currentBlocks.length);
    updateArticle(prev => ({ ...prev, blocks: [...(prev.blocks || []), newBlock] }));
    setExpandedBlocks(prev => ({ ...prev, [newBlock.id]: true }));
    setShowBlockMenu(false);
  }, [article.blocks, updateArticle]);

  const removeBlock = useCallback((id: string) => {
    if (!confirm('Are you sure you want to delete this block?')) return;
    updateArticle(prev => ({ ...prev, blocks: (prev.blocks || []).filter(b => b.id !== id).map((b, i) => ({ ...b, order: i })) }));
  }, [updateArticle]);

  const duplicateBlock = useCallback((id: string) => {
    const current = article.blocks || [];
    const targetIdx = current.findIndex(b => b.id === id);
    if (targetIdx < 0) return;
    const source = current[targetIdx];
    const clone: ArticleBlock = {
      ...source,
      id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      order: targetIdx + 1,
      title: source.title ? `${source.title} (Copy)` : undefined,
      data: source.data ? JSON.parse(JSON.stringify(source.data)) : undefined,
    };
    const nextBlocks = [...current.slice(0, targetIdx + 1), clone, ...current.slice(targetIdx + 1)].map((b, i) => ({ ...b, order: i }));
    updateArticle(prev => ({ ...prev, blocks: nextBlocks }));
    setExpandedBlocks(prev => ({ ...prev, [clone.id]: true }));
  }, [article.blocks, updateArticle]);

  const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    const current = [...(article.blocks || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) return;
    [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
    updateArticle(prev => ({ ...prev, blocks: current.map((b, i) => ({ ...b, order: i })) }));
  }, [article.blocks, updateArticle]);

  const toggleBlockVisibility = useCallback((id: string) => {
    updateArticle(prev => ({
      ...prev,
      blocks: (prev.blocks || []).map(b => b.id === id ? { ...b, visibility: b.visibility === false ? true : false } : b),
    }));
  }, [updateArticle]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedBlocks(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const updateBlockContent = useCallback((id: string, content: string) => {
    updateArticle(prev => ({ ...prev, blocks: (prev.blocks || []).map(b => b.id === id ? { ...b, content } : b) }));
  }, [updateArticle]);

  const updateBlockTitle = useCallback((id: string, title: string) => {
    updateArticle(prev => ({ ...prev, blocks: (prev.blocks || []).map(b => b.id === id ? { ...b, title } : b) }));
  }, [updateArticle]);

  const updateBlockData = useCallback((id: string, dataPatch: any) => {
    updateArticle(prev => ({
      ...prev,
      blocks: (prev.blocks || []).map(b => b.id === id ? { ...b, data: { ...b.data, ...dataPatch } } : b),
    }));
  }, [updateArticle]);

  const handleConvertLegacy = () => {
    if (confirm('Convert legacy sections into structured content blocks?')) {
      const converted = legacyArticleToBlocks(article);
      updateArticle(prev => ({ ...prev, blocks: converted }));
      const exp: Record<string, boolean> = {};
      converted.forEach(b => { exp[b.id] = true; });
      setExpandedBlocks(exp);
    }
  };

  // ── Cover image ──
  const handleCoverFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setImageUploadError('Please select a valid image file.'); return; }
    setUploadingCover(true);
    setImageUploadError(null);
    try {
      const res = await uploadArticleImage(file);
      updateArticle(prev => ({ ...prev, coverImage: res.url, seo: { ...prev.seo, ogImage: res.url } }));
    } catch (err: any) {
      setImageUploadError(err.message || 'Failed to upload cover image.');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const selectPresetCover = (categoryKey: string) => {
    const preset = CATEGORY_DEFAULT_IMAGES[categoryKey];
    if (preset) updateArticle(prev => ({ ...prev, coverImage: preset.url, seo: { ...prev.seo, ogImage: preset.url } }));
  };

  const removeCoverImage = () => {
    updateArticle(prev => ({ ...prev, coverImage: undefined, seo: { ...prev.seo, ogImage: undefined } }));
  };

  // ── Tag helpers ──
  const addTag = (raw: string) => {
    const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleaned || (article.tags || []).includes(cleaned)) return;
    updateArticle(prev => ({ ...prev, tags: [...(prev.tags || []), cleaned] }));
  };

  const removeTag = (tag: string) => {
    updateArticle(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
  };

  // ── Word / char counts ──
  const titleWordCount = article.title.trim() ? article.title.trim().split(/\s+/).length : 0;

  // ─── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#657565] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#7B8978]">Loading article studio v2...</p>
        </div>
      </AdminLayout>
    );
  }

  // ─── Publish Panel (shared between sidebar and slide-over) ───────────────

  const PublishPanel = () => (
    <div className="space-y-5">
      {/* Status */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B8978]">Status</label>
            <select
              value={article.status || 'draft'}
              onChange={e => updateArticle(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full text-xs font-semibold px-2.5 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B8978]">Visibility</label>
            <select
              value={articleOptions.visibility}
              onChange={e => updateOptions({ visibility: e.target.value as any })}
              className="w-full text-xs font-semibold px-2.5 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Scheduled date */}
        {article.status === 'scheduled' && (
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B8978] flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Schedule Publish
            </label>
            <input
              type="datetime-local"
              value={articleOptions.scheduledDate}
              onChange={e => updateOptions({ scheduledDate: e.target.value })}
              className="w-full text-xs px-2.5 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl outline-none"
            />
          </div>
        )}
      </div>

      {/* Options toggles */}
      <div className="space-y-2 p-3 bg-[#FAF9F6] dark:bg-[#1E221E] rounded-xl border border-[#D8D0C2] dark:border-[#333C33]">
        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B8978] mb-3">Options</p>
        <Toggle checked={articleOptions.featured} onChange={v => updateOptions({ featured: v })} label="⭐ Featured Article" />
        <Toggle checked={articleOptions.allowComments} onChange={v => updateOptions({ allowComments: v })} label="💬 Allow Comments" />
        <Toggle checked={articleOptions.seoIndexable} onChange={v => updateOptions({ seoIndexable: v })} label="🔍 SEO Indexable" />
        <Toggle checked={articleOptions.showAuthor} onChange={v => updateOptions({ showAuthor: v })} label="👤 Show Author" />
        <Toggle checked={articleOptions.showRelatedArticles} onChange={v => updateOptions({ showRelatedArticles: v })} label="📚 Show Related Articles" />
        <Toggle checked={articleOptions.showRelatedCalculators} onChange={v => updateOptions({ showRelatedCalculators: v })} label="🔧 Show Related Calculators" />
        <Toggle checked={articleOptions.showFaq} onChange={v => updateOptions({ showFaq: v })} label="❓ Show FAQ" />
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={saveStatus === 'saving'}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] hover:border-[#657565] transition-colors cursor-pointer"
          >
            Save Draft
          </button>
          <a
            href={article.slug ? `/articles/${article.slug}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] hover:border-[#657565] transition-colors"
          >
            Preview <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <button
          type="button"
          onClick={() => handleSave('published')}
          disabled={saveStatus === 'saving'}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#657565] hover:bg-[#536153] text-white transition-all shadow-xs cursor-pointer"
        >
          {saveStatus === 'saving' ? (
            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
          ) : saveStatus === 'saved' ? (
            <><Check className="w-3.5 h-3.5" /> Published!</>
          ) : (
            <><Globe className="w-3.5 h-3.5" /> Publish Article</>
          )}
        </button>
      </div>

      {/* Quality checklist */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B8978]">Quality Checklist</p>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            qualityScore >= 9 ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
            : qualityScore >= 6 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
            : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
          }`}>
            {qualityScore}/{qualityTotal}
          </span>
        </div>

        {/* Score bar */}
        <div className="w-full h-1.5 bg-[#D8D0C2] dark:bg-[#384238] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${qualityScore >= 9 ? 'bg-emerald-500' : qualityScore >= 6 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${(qualityScore / qualityTotal) * 100}%` }}
          />
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {qualityChecks.map(chk => (
            <div key={chk.id} className="flex items-center gap-2 text-[11px]">
              {chk.passed ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : chk.warning ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              <span className={`${chk.passed ? 'text-[#20231F] dark:text-[#EAE7E0]' : chk.warning ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'}`}>
                {chk.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Article stats */}
      <div className="p-3 bg-[#FAF9F6] dark:bg-[#1E221E] rounded-xl border border-[#D8D0C2] dark:border-[#333C33] space-y-2">
        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B8978]">Article Stats</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-base font-bold text-[#20231F] dark:text-[#EAE7E0] font-mono">{article.blocks?.length || 0}</div>
            <div className="text-[10px] text-[#7B8978]">Blocks</div>
          </div>
          <div>
            <div className="text-base font-bold text-[#20231F] dark:text-[#EAE7E0] font-mono">{seoAudit.wordCount}</div>
            <div className="text-[10px] text-[#7B8978]">Words</div>
          </div>
          <div>
            <div className="text-base font-bold text-[#20231F] dark:text-[#EAE7E0] font-mono">~{seoAudit.readingTimeMinutes}m</div>
            <div className="text-[10px] text-[#7B8978]">Read</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* ── Top Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D8D0C2] dark:border-[#333C33]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="p-2 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#252B25] text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer"
              title="Return to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-[#20231F] dark:text-[#EAE7E0]">
                  {isEditing ? `Edit: ${article.title || slug}` : 'Article Studio v2'}
                </h1>
                {isDirty && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    Unsaved
                  </span>
                )}
                {lastSavedAt && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    Draft saved {formatElapsed(elapsedSeconds)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7B8978] font-mono">
                {article.slug ? `/articles/${article.slug}` : 'Route will be generated automatically'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoSeo}
              disabled={autoSeoRunning}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                autoSeoSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-[#D9B96E] to-[#B56F50] text-white hover:opacity-95'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{autoSeoRunning ? 'Optimizing...' : autoSeoSuccess ? 'SEO Optimized!' : '⚡ Auto SEO'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={saveStatus === 'saving'}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] hover:border-[#657565] transition-colors cursor-pointer"
            >
              Save Draft
            </button>

            {/* Publish sidebar toggle (visible on < xl) */}
            <button
              type="button"
              onClick={() => setShowPublishSidebar(true)}
              className="xl:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#657565] hover:bg-[#536153] text-white transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              Publish
            </button>

            <button
              type="button"
              onClick={() => handleSave('published')}
              disabled={saveStatus === 'saving'}
              className="hidden xl:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#657565] hover:bg-[#536153] text-white transition-all shadow-xs cursor-pointer"
            >
              {saveStatus === 'saving' ? (
                <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              ) : saveStatus === 'saved' ? (
                <><Check className="w-3.5 h-3.5" /> Published!</>
              ) : (
                <><Globe className="w-3.5 h-3.5" /> Publish</>
              )}
            </button>
          </div>
        </div>

        {/* ── Main 2-column layout on xl ── */}
        <div className="flex gap-6 items-start">
          {/* ── Left: tabs + content ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Tab bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] p-1 rounded-2xl w-fit overflow-x-auto">
                {([
                  { id: 'blocks', label: 'Content Blocks', icon: <Layers className="w-3.5 h-3.5" />, badge: String(article.blocks?.length || 0) },
                  { id: 'content', label: 'Article Details', icon: <FileText className="w-3.5 h-3.5" />, badge: null },
                  { id: 'seo', label: 'SEO', icon: <Sparkles className="w-3.5 h-3.5" />, badge: `${seoAudit.score}%` },
                  { id: 'settings', label: 'Settings', icon: <Settings2 className="w-3.5 h-3.5" />, badge: null },
                  { id: 'preview', label: 'Preview', icon: <Eye className="w-3.5 h-3.5" />, badge: null },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-[#657565] text-white shadow-xs'
                        : 'text-[#7B8978] hover:text-[#20231F] dark:hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                        activeTab === tab.id
                          ? 'bg-white/20 text-white'
                          : seoAudit.score >= 80 && tab.id === 'seo'
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : tab.id === 'seo'
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              : 'bg-[#D8D0C2] dark:bg-[#384238] text-[#20231F] dark:text-[#EAE7E0]'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ══ TAB: CONTENT BLOCKS ══ */}
            {activeTab === 'blocks' && (
              <div className="space-y-5">
                {/* Quick title bar */}
                <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7B8978]">
                      Article Title (H1)
                    </label>
                    <input
                      type="text"
                      value={article.title}
                      onChange={e => {
                        const val = e.target.value;
                        updateArticle(prev => ({ ...prev, title: val, slug: prev.slug || slugify(val) }));
                      }}
                      placeholder="e.g. How to Calculate Concrete Volume: Complete Engineering Guide"
                      className="w-full text-base font-bold px-3 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565]"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setShowBlockMenu(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#657565] hover:bg-[#526052] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Block</span>
                    </button>
                  </div>
                </div>

                {/* Block list */}
                <div className="space-y-4">
                  {(!article.blocks || article.blocks.length === 0) ? (
                    <div className="py-16 text-center rounded-2xl border-2 border-dashed border-[#D8D0C2] dark:border-[#384238] space-y-4 bg-white/50 dark:bg-[#252B25]/50">
                      <div className="w-12 h-12 rounded-2xl bg-[#657565]/10 text-[#657565] flex items-center justify-center mx-auto">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 max-w-md mx-auto">
                        <h3 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0]">No Content Blocks Added Yet</h3>
                        <p className="text-xs text-[#7B8978] leading-relaxed">Construct your engineering article with structured, reusable blocks.</p>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowBlockMenu(true)}
                          className="px-4 py-2 bg-[#657565] hover:bg-[#536153] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          + Add First Block
                        </button>
                        {(article.introduction || article.theory || article.formulas?.length) && (
                          <button
                            type="button"
                            onClick={handleConvertLegacy}
                            className="px-4 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-xs font-bold rounded-xl cursor-pointer hover:border-[#657565]"
                          >
                            Convert Existing Content
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    article.blocks.map((block, idx) => {
                      const isExpanded = expandedBlocks[block.id] ?? false;
                      return (
                        <div
                          key={block.id}
                          className={`rounded-2xl border transition-all ${
                            block.visibility === false
                              ? 'border-[#D8D0C2]/50 dark:border-[#384238]/50 opacity-60 bg-[#FAF9F6]/40 dark:bg-[#1E221E]/40'
                              : 'border-[#D8D0C2] dark:border-[#384238] bg-[#FAF9F6] dark:bg-[#1E221E] shadow-2xs hover:border-[#657565]'
                          }`}
                        >
                          {/* Block header */}
                          <div className="p-3 flex items-center justify-between gap-3 border-b border-[#D8D0C2]/60 dark:border-[#333C33]">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-[#657565]/12 text-[#657565] dark:text-[#A1B3A1] flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-white dark:bg-[#252B25] border border-[#D8D0C2]/80 dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] shrink-0">
                                {block.type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0] truncate">
                                {block.title || block.content?.slice(0, 50) || block.data?.title || `${block.type} block`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button type="button" onClick={() => moveBlock(idx, 'up')} disabled={idx === 0} className="p-1.5 rounded-lg text-[#7B8978] hover:text-[#20231F] dark:hover:text-white disabled:opacity-30 cursor-pointer" title="Move Up"><MoveUp className="w-3.5 h-3.5" /></button>
                              <button type="button" onClick={() => moveBlock(idx, 'down')} disabled={idx === (article.blocks?.length || 0) - 1} className="p-1.5 rounded-lg text-[#7B8978] hover:text-[#20231F] dark:hover:text-white disabled:opacity-30 cursor-pointer" title="Move Down"><MoveDown className="w-3.5 h-3.5" /></button>
                              <button type="button" onClick={() => duplicateBlock(block.id)} className="p-1.5 rounded-lg text-[#7B8978] hover:text-[#20231F] dark:hover:text-white cursor-pointer" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                              <button type="button" onClick={() => toggleBlockVisibility(block.id)} className="p-1.5 rounded-lg text-[#7B8978] hover:text-[#20231F] dark:hover:text-white cursor-pointer" title={block.visibility === false ? 'Show' : 'Hide'}>
                                {block.visibility === false ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button type="button" onClick={() => removeBlock(block.id)} className="p-1.5 rounded-lg text-[#7B8978] hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                              <button type="button" onClick={() => toggleExpand(block.id)} className="p-1.5 rounded-lg text-[#7B8978] hover:text-[#20231F] dark:hover:text-white cursor-pointer">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Block editor body */}
                          {isExpanded && (
                            <div className="p-4 bg-white dark:bg-[#252B25] rounded-b-2xl space-y-4">
                              {/* ── PARAGRAPH ── */}
                              {block.type === 'paragraph' && (
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Paragraph Content (Markdown supported)</label>
                                  <textarea value={block.content || ''} onChange={e => updateBlockContent(block.id, e.target.value)} rows={4} placeholder="Explain the concept concisely..." className="w-full text-xs p-3 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565]" />
                                </div>
                              )}

                              {/* ── HEADINGS ── */}
                              {(block.type === 'heading_2' || block.type === 'heading_3') && (
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">{block.type === 'heading_2' ? 'Section Heading (H2)' : 'Sub-section Heading (H3)'}</label>
                                  <input type="text" value={block.content || block.title || ''} onChange={e => updateBlockContent(block.id, e.target.value)} placeholder="e.g. Concrete Slab Volume Calculation Method" className="w-full text-sm font-bold p-2.5 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565]" />
                                </div>
                              )}

                              {/* ── LISTS ── */}
                              {(block.type === 'bullet_list' || block.type === 'numbered_list') && (
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0] flex items-center justify-between">
                                    <span>List Items</span>
                                    <button type="button" onClick={() => { const items = [...(block.data?.items || []), 'New list item']; updateBlockData(block.id, { items }); }} className="text-[10px] font-bold text-[#657565] hover:underline cursor-pointer">+ Add Item</button>
                                  </label>
                                  {(block.data?.items || []).map((it: string, iIdx: number) => (
                                    <div key={iIdx} className="flex items-center gap-2">
                                      <span className="text-xs font-mono text-[#7B8978] w-4 text-right">{block.type === 'numbered_list' ? `${iIdx + 1}.` : '•'}</span>
                                      <input type="text" value={it} onChange={e => { const items = [...(block.data?.items || [])]; items[iIdx] = e.target.value; updateBlockData(block.id, { items }); }} className="flex-1 text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                      <button type="button" onClick={() => { const items = (block.data?.items || []).filter((_: any, idx2: number) => idx2 !== iIdx); updateBlockData(block.id, { items }); }} className="p-1 text-[#7B8978] hover:text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* ── QUOTE ── */}
                              {block.type === 'quote' && (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Quote Text</label>
                                    <textarea value={block.data?.quote || block.content || ''} onChange={e => updateBlockData(block.id, { quote: e.target.value })} rows={2} className="w-full text-xs p-2.5 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-xl outline-none" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Author / Standard</label>
                                      <input type="text" value={block.data?.author || ''} onChange={e => updateBlockData(block.id, { author: e.target.value })} className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Source / Clause</label>
                                      <input type="text" value={block.data?.source || ''} onChange={e => updateBlockData(block.id, { source: e.target.value })} className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* ── FORMULA ── */}
                              {block.type === 'formula' && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2 space-y-1">
                                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Formula Title</label>
                                      <input type="text" value={block.data?.title || block.title || ''} onChange={e => { updateBlockTitle(block.id, e.target.value); updateBlockData(block.id, { title: e.target.value }); }} placeholder="e.g. Concrete Volume" className="w-full text-xs font-bold p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Unit</label>
                                      <input type="text" value={block.data?.unit || ''} onChange={e => updateBlockData(block.id, { unit: e.target.value })} placeholder="e.g. m³, kN·m" className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Equation (KaTeX / LaTeX or plain math)</label>
                                    <input type="text" value={block.data?.equation || block.content || ''} onChange={e => updateBlockData(block.id, { equation: e.target.value })} placeholder="e.g. V = L \times W \times T" className="w-full text-xs font-mono font-bold p-2.5 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-xl outline-none" />
                                  </div>
                                  {(block.data?.equation || block.content) && (
                                    <div className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2]/80 dark:border-[#384238]">
                                      <div className="text-[10px] font-mono text-[#7B8978] uppercase font-bold mb-1">KaTeX Live Preview:</div>
                                      <MathFormula title={block.data?.title || block.title} equation={block.data?.equation || block.content || ''} unit={block.data?.unit} reference={block.data?.reference} />
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                                      <span>Variable Definitions</span>
                                      <button type="button" onClick={() => { const vars = [...(block.data?.variables || []), { symbol: 'X', meaning: 'Description', unit: 'm' }]; updateBlockData(block.id, { variables: vars }); }} className="text-[10px] font-bold text-[#657565] hover:underline cursor-pointer">+ Add Variable</button>
                                    </div>
                                    {(block.data?.variables || []).map((v: any, vIdx: number) => (
                                      <div key={vIdx} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-3"><input type="text" value={v.symbol} onChange={e => { const vars = [...(block.data?.variables || [])]; vars[vIdx].symbol = e.target.value; updateBlockData(block.id, { variables: vars }); }} placeholder="Symbol" className="w-full text-xs font-mono font-bold p-1.5 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-md outline-none" /></div>
                                        <div className="col-span-6"><input type="text" value={v.meaning} onChange={e => { const vars = [...(block.data?.variables || [])]; vars[vIdx].meaning = e.target.value; updateBlockData(block.id, { variables: vars }); }} placeholder="Meaning" className="w-full text-xs p-1.5 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-md outline-none" /></div>
                                        <div className="col-span-2"><input type="text" value={v.unit || ''} onChange={e => { const vars = [...(block.data?.variables || [])]; vars[vIdx].unit = e.target.value; updateBlockData(block.id, { variables: vars }); }} placeholder="Unit" className="w-full text-xs font-mono p-1.5 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-md outline-none" /></div>
                                        <div className="col-span-1 text-center"><button type="button" onClick={() => { const vars = (block.data?.variables || []).filter((_: any, idx2: number) => idx2 !== vIdx); updateBlockData(block.id, { variables: vars }); }} className="text-[#7B8978] hover:text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Optional Code Reference</label>
                                      <input type="text" value={block.data?.reference || ''} onChange={e => updateBlockData(block.id, { reference: e.target.value })} placeholder="e.g. IS 456:2000 Cl. 26.5" className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Optional Explanation</label>
                                      <input type="text" value={block.data?.explanation || ''} onChange={e => updateBlockData(block.id, { explanation: e.target.value })} placeholder="e.g. Multiply length by width by thickness" className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* ── CALCULATION EXAMPLE ── */}
                              {block.type === 'calculation_example' && (
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Example Title</label>
                                    <input type="text" value={block.data?.title || block.title || ''} onChange={e => { updateBlockTitle(block.id, e.target.value); updateBlockData(block.id, { title: e.target.value }); }} placeholder="e.g. Concrete Slab Calculation" className="w-full text-xs font-bold p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Scenario / Problem Statement</label>
                                    <textarea value={block.data?.scenario || ''} onChange={e => updateBlockData(block.id, { scenario: e.target.value })} rows={2} placeholder="Describe the structural element, dimensions, and engineering objective..." className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                                      <span>Given Inputs</span>
                                      <button type="button" onClick={() => { const inputs = [...(block.data?.inputs || []), { label: 'Parameter', value: '1.0', unit: 'm' }]; updateBlockData(block.id, { inputs }); }} className="text-[10px] font-bold text-[#657565] hover:underline cursor-pointer">+ Add Input</button>
                                    </div>
                                    {(block.data?.inputs || []).map((inp: any, idx3: number) => (
                                      <div key={idx3} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-5"><input type="text" value={inp.label} onChange={e => { const inputs = [...(block.data?.inputs || [])]; inputs[idx3].label = e.target.value; updateBlockData(block.id, { inputs }); }} placeholder="Label (e.g. Length)" className="w-full text-xs p-1.5 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-md outline-none" /></div>
                                        <div className="col-span-4"><input type="text" value={inp.value} onChange={e => { const inputs = [...(block.data?.inputs || [])]; inputs[idx3].value = e.target.value; updateBlockData(block.id, { inputs }); }} placeholder="Value (e.g. 6.00)" className="w-full text-xs font-mono font-bold p-1.5 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-md outline-none" /></div>
                                        <div className="col-span-2"><input type="text" value={inp.unit || ''} onChange={e => { const inputs = [...(block.data?.inputs || [])]; inputs[idx3].unit = e.target.value; updateBlockData(block.id, { inputs }); }} placeholder="Unit (m)" className="w-full text-xs font-mono p-1.5 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-md outline-none" /></div>
                                        <div className="col-span-1 text-center"><button type="button" onClick={() => { const inputs = (block.data?.inputs || []).filter((_: any, idx4: number) => idx4 !== idx3); updateBlockData(block.id, { inputs }); }} className="text-[#7B8978] hover:text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Formula</label>
                                      <input type="text" value={block.data?.formula || ''} onChange={e => updateBlockData(block.id, { formula: e.target.value })} placeholder="V = L \times W \times T" className="w-full text-xs font-mono p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Numerical Substitution</label>
                                      <input type="text" value={block.data?.calculation || ''} onChange={e => updateBlockData(block.id, { calculation: e.target.value })} placeholder="V = 6.00 \times 4.00 \times 0.15 = 3.60" className="w-full text-xs font-mono p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl">
                                    <div>
                                      <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Prominent Result Value</label>
                                      <input type="text" value={block.data?.result || ''} onChange={e => updateBlockData(block.id, { result: e.target.value })} placeholder="e.g. 3.60" className="w-full text-sm font-mono font-black p-2 bg-white dark:bg-[#1E221E] border border-emerald-300 dark:border-emerald-800 rounded-lg outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Result Unit</label>
                                      <input type="text" value={block.data?.unit || ''} onChange={e => updateBlockData(block.id, { unit: e.target.value })} placeholder="e.g. m³" className="w-full text-sm font-mono font-bold p-2 bg-white dark:bg-[#1E221E] border border-emerald-300 dark:border-emerald-800 rounded-lg outline-none" />
                                    </div>
                                  </div>
                                  <div className="pt-2">
                                    <span className="text-[10px] font-mono text-[#7B8978] uppercase font-bold">Preview Render:</span>
                                    <CalculationCard title={block.data?.title || block.title || 'Calculation Example'} scenario={block.data?.scenario} inputs={block.data?.inputs} formula={block.data?.formula} calculation={block.data?.calculation} result={block.data?.result || '0.00'} unit={block.data?.unit} note={block.data?.note} />
                                  </div>
                                </div>
                              )}

                              {/* ── ENGINEERING NOTE / WARNING ── */}
                              {(block.type === 'engineering_note' || block.type === 'warning') && (
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Title</label>
                                    <input type="text" value={block.data?.title || block.title || ''} onChange={e => { updateBlockTitle(block.id, e.target.value); updateBlockData(block.id, { title: e.target.value }); }} placeholder="e.g. Engineering Verification" className="w-full text-xs font-bold p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Message / Content</label>
                                    <textarea value={block.data?.note || block.data?.message || block.content || ''} onChange={e => { if (block.type === 'engineering_note') { updateBlockData(block.id, { note: e.target.value }); } else { updateBlockData(block.id, { message: e.target.value }); } }} rows={3} className="w-full text-xs p-2.5 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-xl outline-none" />
                                  </div>
                                </div>
                              )}

                              {/* ── KEY TAKEAWAYS ── */}
                              {block.type === 'key_takeaway' && (
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0] flex items-center justify-between">
                                    <span>Takeaways (Bullet items with checkmarks)</span>
                                    <button type="button" onClick={() => { const items = [...(block.data?.items || []), 'New takeaway point']; updateBlockData(block.id, { items }); }} className="text-[10px] font-bold text-[#657565] hover:underline cursor-pointer">+ Add Item</button>
                                  </label>
                                  {(block.data?.items || []).map((it: string, tIdx: number) => (
                                    <div key={tIdx} className="flex items-center gap-2">
                                      <span className="text-emerald-600 font-bold text-xs">✓</span>
                                      <input type="text" value={it} onChange={e => { const items = [...(block.data?.items || [])]; items[tIdx] = e.target.value; updateBlockData(block.id, { items }); }} className="flex-1 text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                      <button type="button" onClick={() => { const items = (block.data?.items || []).filter((_: any, idx5: number) => idx5 !== tIdx); updateBlockData(block.id, { items }); }} className="p-1 text-[#7B8978] hover:text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* ── STEP-BY-STEP ── */}
                              {block.type === 'step_by_step' && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                                    <span>Procedure Steps</span>
                                    <button type="button" onClick={() => { const steps = [...(block.data?.steps || [])]; steps.push({ stepNumber: steps.length + 1, title: `Step ${steps.length + 1}`, description: 'Step instruction details...' }); updateBlockData(block.id, { steps }); }} className="text-[10px] font-bold text-[#657565] hover:underline cursor-pointer">+ Add Step</button>
                                  </div>
                                  {(block.data?.steps || []).map((st: any, sIdx: number) => (
                                    <div key={sIdx} className="p-3 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-xl space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="w-6 h-6 rounded-md bg-[#657565] text-white flex items-center justify-center text-xs font-mono font-bold shrink-0">{st.stepNumber || sIdx + 1}</span>
                                        <input type="text" value={st.title} onChange={e => { const steps = [...(block.data?.steps || [])]; steps[sIdx].title = e.target.value; updateBlockData(block.id, { steps }); }} placeholder="Step Title" className="flex-1 text-xs font-bold p-1 bg-transparent border-b border-[#D8D0C2] dark:border-[#384238] outline-none" />
                                        <button type="button" onClick={() => { const steps = (block.data?.steps || []).filter((_: any, idx6: number) => idx6 !== sIdx); updateBlockData(block.id, { steps }); }} className="p-1 text-[#7B8978] hover:text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                                      </div>
                                      <textarea value={st.description} onChange={e => { const steps = [...(block.data?.steps || [])]; steps[sIdx].description = e.target.value; updateBlockData(block.id, { steps }); }} rows={2} placeholder="Detailed instruction..." className="w-full text-xs p-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* ── TABLE ── */}
                              {block.type === 'table' && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                                    <span>Table Editor</span>
                                    <div className="flex items-center gap-2">
                                      <button type="button" onClick={() => { const headers = [...(block.data?.headers || ['Col 1', 'Col 2']), `Col ${(block.data?.headers?.length || 2) + 1}`]; const rows = (block.data?.rows || []).map((r: string[]) => [...r, '-']); updateBlockData(block.id, { headers, rows }); }} className="text-[10px] font-bold text-[#657565] hover:underline cursor-pointer">+ Add Column</button>
                                      <span>·</span>
                                      <button type="button" onClick={() => { const colCount = block.data?.headers?.length || 3; const newRow = Array(colCount).fill('Sample'); const rows = [...(block.data?.rows || []), newRow]; updateBlockData(block.id, { rows }); }} className="text-[10px] font-bold text-[#657565] hover:underline cursor-pointer">+ Add Row</button>
                                    </div>
                                  </div>
                                  <div className="overflow-x-auto max-w-full border border-[#D8D0C2] dark:border-[#384238] rounded-xl">
                                    <table className="w-full text-xs font-mono border-collapse min-w-[400px]">
                                      <thead>
                                        <tr className="bg-[#FAF9F6] dark:bg-[#1E221E] border-b border-[#D8D0C2] dark:border-[#384238]">
                                          {(block.data?.headers || []).map((h: string, hIdx: number) => (
                                            <th key={hIdx} className="p-1.5 border-r border-[#D8D0C2]/50 dark:border-[#333C33] text-left">
                                              <input type="text" value={h} onChange={e => { const headers = [...(block.data?.headers || [])]; headers[hIdx] = e.target.value; updateBlockData(block.id, { headers }); }} className="w-full text-xs font-bold font-mono bg-transparent outline-none p-1" />
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(block.data?.rows || []).map((row: string[], rIdx: number) => (
                                          <tr key={rIdx} className="border-b border-[#D8D0C2]/40 dark:border-[#333C33]">
                                            {row.map((cell: string, cIdx: number) => (
                                              <td key={cIdx} className="p-1 border-r border-[#D8D0C2]/40 dark:border-[#333C33]">
                                                <input type="text" value={cell} onChange={e => { const rows = [...(block.data?.rows || [])]; rows[rIdx][cIdx] = e.target.value; updateBlockData(block.id, { rows }); }} className="w-full text-xs p-1 bg-transparent outline-none font-mono" />
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* ── IMAGE ── */}
                              {block.type === 'image' && (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Image URL</label>
                                      <input type="text" value={block.data?.url || block.content || ''} onChange={e => updateBlockData(block.id, { url: e.target.value })} placeholder="https://... or upload below" className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Figure Number / Tag</label>
                                      <input type="text" value={block.data?.figureNumber || ''} onChange={e => updateBlockData(block.id, { figureNumber: e.target.value })} placeholder="e.g. Figure 1" className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Caption</label>
                                      <input type="text" value={block.data?.caption || ''} onChange={e => updateBlockData(block.id, { caption: e.target.value })} placeholder="e.g. Concrete slab dimension diagram" className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Layout Width</label>
                                      <select value={block.data?.layout || 'standard'} onChange={e => updateBlockData(block.id, { layout: e.target.value })} className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none cursor-pointer">
                                        <option value="standard">Standard (Max 680px)</option>
                                        <option value="full">Full Article Width</option>
                                        <option value="small">Small Diagram (Max 440px)</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}

                               {/* ── CALCULATOR EMBED (INTERACTIVE) ── */}
                              {block.type === 'calculator_embed' && (
                                <div className="space-y-4 p-4 rounded-2xl bg-[#2E6B56]/5 border border-[#2E6B56]/30">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-lg bg-[#2E6B56] text-white flex items-center justify-center">
                                        <Calculator className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="text-xs font-bold text-[#141A16] dark:text-[#ECF2EE]">
                                        Embedded Interactive Calculator
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-[#2E6B56] dark:text-[#4ADE80] font-bold">
                                      REAL CALCULATOR ENGINE
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">
                                      Select CivilMath Calculator
                                    </label>
                                    <select
                                      value={block.data?.calculatorId || 'concrete-volume'}
                                      onChange={e => {
                                        const calcId = e.target.value;
                                        const meta = EMBEDDABLE_CALCULATORS[calcId];
                                        if (meta) {
                                          updateBlockData(block.id, {
                                            calculatorId: calcId,
                                            calculatorName: meta.name,
                                            description: meta.description,
                                            initialInputs: meta.defaultInputs,
                                          });
                                          updateBlockTitle(block.id, meta.name);
                                        }
                                      }}
                                      className="w-full text-xs font-semibold p-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl outline-none cursor-pointer"
                                    >
                                      {Object.entries(EMBEDDABLE_CALCULATORS).map(([id, calc]) => (
                                        <option key={id} value={id}>
                                          [{calc.category.toUpperCase()}] {calc.name} ({id})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-xs text-[#7B8978]">Display Title</label>
                                      <input
                                        type="text"
                                        value={block.data?.calculatorName || block.title || ''}
                                        onChange={e => updateBlockData(block.id, { calculatorName: e.target.value })}
                                        className="w-full text-xs p-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs text-[#7B8978]">Short Description</label>
                                      <input
                                        type="text"
                                        value={block.data?.description || ''}
                                        onChange={e => updateBlockData(block.id, { description: e.target.value })}
                                        className="w-full text-xs p-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none"
                                      />
                                    </div>
                                  </div>

                                  {/* Live in-editor calculator preview */}
                                  <div className="pt-2 border-t border-[#2E6B56]/20">
                                    <span className="text-[10px] font-mono text-[#7B8978] block mb-2 uppercase font-bold">
                                      Live Calculator Preview:
                                    </span>
                                    <CalculatorEmbedCard
                                      calculatorId={block.data?.calculatorId || 'concrete-volume'}
                                      calculatorName={block.data?.calculatorName || block.title}
                                      description={block.data?.description}
                                      initialInputs={block.data?.initialInputs}
                                      showFullLink={false}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* ── CALCULATOR CTA ── */}
                              {(block.type === 'calculator_cta' || block.type === 'related_calculator' || block.type === 'tool_recommendation') && (
                                <div className="space-y-3 p-3 rounded-xl bg-[#657565]/10 border border-[#657565]/20">
                                  <div className="space-y-1">
                                    <label className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">Select CivilMath Calculator Route</label>
                                    <select value={block.data?.calculatorUrl || ''} onChange={e => { const selectedUrl = e.target.value; const found = AVAILABLE_CALCULATORS.find(c => c.url === selectedUrl); if (found) { updateBlockData(block.id, { calculatorUrl: found.url, title: `Calculate ${found.name}`, description: `Open the dedicated CivilMath ${found.name} for instant verified results.`, buttonText: `Launch ${found.name} →` }); } else { updateBlockData(block.id, { calculatorUrl: selectedUrl }); } }} className="w-full text-xs font-semibold p-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none cursor-pointer">
                                      <option value="">-- Choose CivilMath Calculator --</option>
                                      {AVAILABLE_CALCULATORS.map(c => (<option key={c.url} value={c.url}>[{c.category.toUpperCase()}] {c.name} ({c.url})</option>))}
                                    </select>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs text-[#7B8978]">CTA Title</label>
                                      <input type="text" value={block.data?.title || ''} onChange={e => updateBlockData(block.id, { title: e.target.value })} placeholder="e.g. Calculate Concrete Volume" className="w-full text-xs p-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Button Text</label>
                                      <input type="text" value={block.data?.buttonText || ''} onChange={e => updateBlockData(block.id, { buttonText: e.target.value })} placeholder="e.g. Open Calculator →" className="w-full text-xs p-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-xs text-[#7B8978]">Description</label>
                                    <textarea value={block.data?.description || ''} onChange={e => updateBlockData(block.id, { description: e.target.value })} rows={2} placeholder="Encourage the reader to test their specific parameters..." className="w-full text-xs p-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                  </div>
                                </div>
                              )}

                              {/* ── FAQ ── */}
                              {block.type === 'faq' && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                                    <span>FAQ Questions & Answers</span>
                                    <button type="button" onClick={() => { const faqs = [...(block.data?.faqs || []), { question: 'New engineering question?', answer: 'Technical answer...' }]; updateBlockData(block.id, { faqs }); }} className="text-[10px] font-bold text-[#657565] hover:underline cursor-pointer">+ Add Question</button>
                                  </div>
                                  {(block.data?.faqs || []).map((faq: any, fIdx: number) => (
                                    <div key={fIdx} className="p-3 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-xl space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <input type="text" value={faq.question} onChange={e => { const faqs = [...(block.data?.faqs || [])]; faqs[fIdx].question = e.target.value; updateBlockData(block.id, { faqs }); }} placeholder="Question (e.g. How do I calculate concrete volume?)" className="flex-1 text-xs font-bold p-1 bg-transparent border-b border-[#D8D0C2] dark:border-[#384238] outline-none" />
                                        <button type="button" onClick={() => { const faqs = (block.data?.faqs || []).filter((_: any, idx7: number) => idx7 !== fIdx); updateBlockData(block.id, { faqs }); }} className="p-1 text-[#7B8978] hover:text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                                      </div>
                                      <textarea value={faq.answer} onChange={e => { const faqs = [...(block.data?.faqs || [])]; faqs[fIdx].answer = e.target.value; updateBlockData(block.id, { faqs }); }} rows={2} placeholder="Engineering answer with technical explanation..." className="w-full text-xs p-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none resize-none" />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* ── DEFINITION ── */}
                              {block.type === 'definition' && (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Term</label>
                                      <input type="text" value={block.data?.term || block.title || ''} onChange={e => { updateBlockTitle(block.id, e.target.value); updateBlockData(block.id, { term: e.target.value }); }} placeholder="e.g. Dry Volume Factor (1.54)" className="w-full text-xs font-bold p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Formula (optional LaTeX)</label>
                                      <input type="text" value={block.data?.formula || ''} onChange={e => updateBlockData(block.id, { formula: e.target.value })} placeholder="e.g. V_{dry} = 1.54 \times V_{wet}" className="w-full text-xs font-mono p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Definition</label>
                                    <textarea value={block.data?.definition || ''} onChange={e => updateBlockData(block.id, { definition: e.target.value })} rows={2} className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-[#7B8978]">Context / Standard Reference</label>
                                    <input type="text" value={block.data?.context || ''} onChange={e => updateBlockData(block.id, { context: e.target.value })} placeholder="e.g. Standard multiplier adopted in IS 456" className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                  </div>
                                </div>
                              )}

                              {/* ── TWO COLUMN ── */}
                              {block.type === 'two_column' && (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Left Column Title</label>
                                      <input type="text" value={block.data?.leftTitle || ''} onChange={e => updateBlockData(block.id, { leftTitle: e.target.value })} placeholder="e.g. Nominal Mix" className="w-full text-xs font-bold p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                      <textarea value={block.data?.leftContent || ''} onChange={e => updateBlockData(block.id, { leftContent: e.target.value })} rows={4} placeholder="Left column content..." className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Right Column Title</label>
                                      <input type="text" value={block.data?.rightTitle || ''} onChange={e => updateBlockData(block.id, { rightTitle: e.target.value })} placeholder="e.g. Design Mix" className="w-full text-xs font-bold p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                      <textarea value={block.data?.rightContent || ''} onChange={e => updateBlockData(block.id, { rightContent: e.target.value })} rows={4} placeholder="Right column content..." className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* ── RELATED ARTICLE ── */}
                              {block.type === 'related_article' && (
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Related Article Slugs (comma-separated)</label>
                                  <input
                                    type="text"
                                    value={(block.data?.articleSlugs || []).join(', ')}
                                    onChange={e => { const slugs = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean); updateBlockData(block.id, { articleSlugs: slugs }); }}
                                    placeholder="e.g. concrete-volume-calculation, rebar-estimation"
                                    className="w-full text-xs font-mono p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none"
                                  />
                                  <p className="text-[11px] text-[#7B8978]">Available articles: {allArticlesList.map(a => a.slug).join(', ')}</p>
                                </div>
                              )}

                              {/* ── DIVIDER (nothing to edit) ── */}
                              {block.type === 'divider' && (
                                <p className="text-xs text-[#7B8978] italic text-center">Horizontal divider — no content to edit.</p>
                              )}

                              {/* ── IMAGE TEXT ── */}
                              {block.type === 'image_text' && (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Image URL</label>
                                      <input type="text" value={block.data?.url || ''} onChange={e => updateBlockData(block.id, { url: e.target.value })} placeholder="https://..." className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-[#7B8978]">Image Position</label>
                                      <select value={block.data?.imagePosition || 'left'} onChange={e => updateBlockData(block.id, { imagePosition: e.target.value })} className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none cursor-pointer">
                                        <option value="left">Image Left</option>
                                        <option value="right">Image Right</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-xs text-[#7B8978]">Accompanying Text</label>
                                    <textarea value={block.data?.text || ''} onChange={e => updateBlockData(block.id, { text: e.target.value })} rows={3} className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-[#7B8978]">Caption</label>
                                    <input type="text" value={block.data?.caption || ''} onChange={e => updateBlockData(block.id, { caption: e.target.value })} className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none" />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom add block trigger */}
                {(article.blocks?.length || 0) > 0 && (
                  <div className="text-center py-4">
                    <button
                      type="button"
                      onClick={() => setShowBlockMenu(true)}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-[#252B25] border-2 border-dashed border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] text-[#20231F] dark:text-[#EAE7E0] text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#657565]" />
                      <span>Add Content Block</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB: ARTICLE DETAILS ══ */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Core details */}
                <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 space-y-5 shadow-2xs">
                  <h2 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] uppercase tracking-wider font-mono">Article Core Details</h2>

                  {/* Title */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Article Title (H1) <span className="text-rose-500">*</span></label>
                      <span className="text-[10px] font-mono text-[#7B8978]">{article.title.length} chars · {titleWordCount} words</span>
                    </div>
                    <input
                      type="text"
                      value={article.title}
                      onChange={e => { const t = e.target.value; updateArticle(prev => ({ ...prev, title: t, slug: prev.slug || slugify(t) })); }}
                      placeholder="e.g. Concrete Volume Estimator & Materials Guide"
                      className="w-full text-sm font-bold px-3.5 py-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565]"
                    />
                  </div>

                  {/* Slug + Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0] flex items-center justify-between">
                        <span>URL Slug</span>
                        <button type="button" onClick={() => updateArticle(prev => ({ ...prev, slug: slugify(prev.title) }))} className="text-[10px] text-[#657565] hover:underline cursor-pointer flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Generate</button>
                      </label>
                      <div className="flex items-center bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl px-3 py-2 text-xs font-mono focus-within:border-[#657565] transition-colors">
                        <span className="text-[#7B8978] shrink-0">/articles/</span>
                        <input type="text" value={article.slug} onChange={e => updateArticle(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} placeholder="concrete-volume-estimator" className="w-full bg-transparent border-none outline-none text-[#20231F] dark:text-[#EAE7E0] font-mono pl-1" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Category</label>
                      <select value={article.category} onChange={e => updateArticle(prev => ({ ...prev, category: e.target.value as ArticleCategory }))} className="w-full text-xs font-medium px-3 py-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer">
                        {CATEGORIES.map(c => (<option key={c.id} value={c.id}>{c.label}</option>))}
                      </select>
                    </div>
                  </div>

                  {/* Excerpt with counter */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Short Description / Excerpt</label>
                      <span className={`text-[10px] font-mono ${(article.excerpt?.length || 0) > 160 ? 'text-rose-600' : 'text-[#7B8978]'}`}>{article.excerpt?.length || 0} / 160</span>
                    </div>
                    <textarea value={article.excerpt || ''} onChange={e => updateArticle(prev => ({ ...prev, excerpt: e.target.value }))} rows={3} placeholder="A concise summary of the calculation method, assumptions, and key results..." className="w-full text-xs p-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565] resize-none" />
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-[#D8D0C2] dark:bg-[#384238] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${(article.excerpt?.length || 0) > 160 ? 'bg-rose-500' : (article.excerpt?.length || 0) > 120 ? 'bg-emerald-500' : 'bg-[#657565]'}`} style={{ width: `${Math.min(100, ((article.excerpt?.length || 0) / 160) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Author + Reading time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Author</label>
                      <select value={article.author} onChange={e => updateArticle(prev => ({ ...prev, author: e.target.value }))} className="w-full text-xs px-3 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer">
                        <option value="CivilMath Engineering Lead">CivilMath Engineering Lead</option>
                        <option value="CivilMath Team">CivilMath Team</option>
                        <option value="Guest Author">Guest Author</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0] flex items-center gap-1"><Clock className="w-3 h-3" /> Reading Time (min)</label>
                      <input type="number" min={1} max={60} value={article.readTimeMinutes || seoAudit.readingTimeMinutes} onChange={e => updateArticle(prev => ({ ...prev, readTimeMinutes: parseInt(e.target.value) || 5 }))} className="w-full text-xs px-3 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none" />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0] flex items-center gap-1"><Tag className="w-3 h-3" /> Tags</label>
                    <div className="flex flex-wrap gap-2 p-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl min-h-[40px]">
                      {(article.tags || []).map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#657565]/10 text-[#657565] dark:text-[#A1B3A1] text-[11px] font-mono font-bold">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="text-[#657565]/60 hover:text-rose-500 cursor-pointer leading-none">×</button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={tagInputValue}
                        onChange={e => setTagInputValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInputValue); setTagInputValue(''); } }}
                        placeholder="Add tag, press Enter"
                        className="flex-1 min-w-[120px] text-xs bg-transparent outline-none border-none text-[#20231F] dark:text-[#EAE7E0]"
                      />
                    </div>
                    <p className="text-[10px] text-[#7B8978]">Press Enter or comma to add a tag. Tags are lowercase, hyphenated.</p>
                  </div>

                  {/* Featured toggle */}
                  <div className="p-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl">
                    <Toggle checked={articleOptions.featured} onChange={v => updateOptions({ featured: v })} label="⭐ Featured Article — appears in homepage featured section" />
                  </div>
                </div>

                {/* Cover image */}
                <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] uppercase tracking-wider font-mono flex items-center gap-2"><ImageIcon className="w-4 h-4 text-[#657565]" /> Featured Cover Image</h2>
                      <p className="text-xs text-[#7B8978] mt-0.5">Recommended 16:9 ratio (1200×675px). Shown on article cards, header, and social media.</p>
                    </div>
                    {article.coverImage && (
                      <button type="button" onClick={removeCoverImage} className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 cursor-pointer">
                        <X className="w-3.5 h-3.5" /> Remove Cover
                      </button>
                    )}
                  </div>

                  {imageUploadError && (
                    <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400 flex items-center justify-between">
                      <span>{imageUploadError}</span>
                      <button onClick={() => setImageUploadError(null)} className="text-rose-500 font-bold ml-2 cursor-pointer">×</button>
                    </div>
                  )}

                  {article.coverImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-[#D8D0C2] dark:border-[#384238] aspect-[16/9] max-w-md bg-slate-900">
                      <img src={article.coverImage} alt="Article cover" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl border-2 border-dashed border-[#D8D0C2] dark:border-[#384238] text-center space-y-3">
                      <ImageIcon className="w-8 h-8 text-[#7B8978] mx-auto" />
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <label className="px-4 py-2 rounded-xl text-xs font-bold bg-[#657565] text-white hover:bg-[#526052] transition-colors cursor-pointer">
                          <Upload className="w-3.5 h-3.5 inline mr-1.5" />
                          <span>{uploadingCover ? 'Uploading...' : 'Upload Image File'}</span>
                          <input type="file" accept="image/*" onChange={handleCoverFileUpload} disabled={uploadingCover} className="hidden" />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Preset images */}
                  <div className="pt-2 border-t border-[#EAE7E0] dark:border-[#2E362E]">
                    <div className="text-[11px] font-bold text-[#7B8978] uppercase tracking-wider font-mono mb-2">Or select CivilMath curated preset:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {Object.entries(CATEGORY_DEFAULT_IMAGES).map(([catKey, preset]) => {
                        const isSelected = article.coverImage === preset.url;
                        return (
                          <button key={catKey} type="button" onClick={() => selectPresetCover(catKey)} className={`group relative rounded-lg overflow-hidden border p-1 text-left transition-all cursor-pointer ${isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] bg-white dark:bg-[#252B25]'}`}>
                            <div className="aspect-video w-full rounded overflow-hidden bg-slate-800">
                              <img src={preset.url} alt={preset.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="mt-1 text-[10px] font-medium text-[#20231F] dark:text-[#EAE7E0] truncate">{catKey.toUpperCase()}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ TAB: SEO ══ */}
            {activeTab === 'seo' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Auto SEO banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#657565]/15 via-[#657565]/5 to-transparent border border-[#657565]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#657565]" /> Auto SEO Optimizer</h3>
                      <p className="text-[11px] text-[#7B8978] mt-0.5 max-w-md">Analyzes your structured content blocks, extracts high-intent civil keywords, and creates compliant title and meta tags.</p>
                    </div>
                    <button type="button" onClick={handleAutoSeo} disabled={autoSeoRunning} className="px-4 py-2.5 bg-[#657565] hover:bg-[#536153] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-2">
                      <RefreshCw className={`w-3.5 h-3.5 ${autoSeoRunning ? 'animate-spin' : ''}`} />
                      <span>{autoSeoRunning ? 'Generating...' : '⚡ Run Auto SEO Now'}</span>
                    </button>
                  </div>

                  {/* SEO fields */}
                  <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#7B8978] font-mono">Search Engine Metadata</h3>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                        <span>SEO Title (50-60 characters)</span>
                        <span className={`text-[10px] font-mono ${article.seo.seoTitle.length > 60 ? 'text-rose-600' : 'text-[#7B8978]'}`}>{article.seo.seoTitle.length} / 60 chars</span>
                      </div>
                      <input type="text" value={article.seo.seoTitle} onChange={e => updateArticle(prev => ({ ...prev, seo: { ...prev.seo, seoTitle: e.target.value } }))} placeholder="e.g. Concrete Volume Estimator & Materials Guide | CivilMath" className="w-full text-xs font-semibold px-3.5 py-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565]" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                        <span>Meta Description (145-160 characters)</span>
                        <span className={`text-[10px] font-mono ${article.seo.metaDescription.length > 160 ? 'text-rose-600' : 'text-[#7B8978]'}`}>{article.seo.metaDescription.length} / 160 chars</span>
                      </div>
                      <textarea value={article.seo.metaDescription} onChange={e => updateArticle(prev => ({ ...prev, seo: { ...prev.seo, metaDescription: e.target.value } }))} rows={3} placeholder="Calculate exact concrete volume, dry materials, and cost for slabs, footings, and columns using dry volume factor 1.54." className="w-full text-xs p-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565] resize-none" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Primary Focus Keyword</label>
                      <input type="text" value={article.seo.primaryKeyword} onChange={e => updateArticle(prev => ({ ...prev, seo: { ...prev.seo, primaryKeyword: e.target.value } }))} placeholder="e.g. concrete volume calculator" className="w-full text-xs font-mono px-3.5 py-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl outline-none focus:border-[#657565]" />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Secondary Keywords (comma-separated)</label>
                      <input type="text" value={(article.seo.secondaryKeywords || []).join(', ')} onChange={e => { const kws = e.target.value.split(',').map(k => k.trim()).filter(Boolean); updateArticle(prev => ({ ...prev, seo: { ...prev.seo, secondaryKeywords: kws } })); }} placeholder="e.g. concrete mix ratio, cement calculator" className="w-full text-xs font-mono px-3.5 py-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl outline-none focus:border-[#657565]" />
                    </div>
                  </div>
                </div>

                {/* SEO Audit panel */}
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase font-mono tracking-wider text-[#7B8978]">SEO Health Score</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${seoAudit.score >= 80 ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'}`}>{seoAudit.score} / 100</span>
                    </div>
                    <div className="space-y-2">
                      {seoAudit.checks.map(chk => (
                        <div key={chk.id} className="flex items-start gap-2 text-xs">
                          {chk.passed ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />}
                          <div>
                            <span className="font-semibold text-[#20231F] dark:text-[#EAE7E0]">{chk.label}</span>
                            <p className="text-[11px] text-[#7B8978] leading-tight m-0">{chk.feedback}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ TAB: SETTINGS ══ */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Publish options */}
                <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 space-y-4 shadow-2xs">
                  <h2 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] uppercase tracking-wider font-mono flex items-center gap-2"><Settings2 className="w-4 h-4 text-[#657565]" /> Display & Publish Settings</h2>
                  <div className="space-y-3">
                    <Toggle checked={articleOptions.allowComments} onChange={v => updateOptions({ allowComments: v })} label="Allow Comments" />
                    <Toggle checked={articleOptions.seoIndexable} onChange={v => updateOptions({ seoIndexable: v })} label="SEO Indexable (allow search engine crawling)" />
                    <Toggle checked={articleOptions.showAuthor} onChange={v => updateOptions({ showAuthor: v })} label="Show Author Section" />
                    <Toggle checked={articleOptions.showRelatedArticles} onChange={v => updateOptions({ showRelatedArticles: v })} label="Show Related Articles" />
                    <Toggle checked={articleOptions.showRelatedCalculators} onChange={v => updateOptions({ showRelatedCalculators: v })} label="Show Related Calculators" />
                    <Toggle checked={articleOptions.showFaq} onChange={v => updateOptions({ showFaq: v })} label="Show FAQ Section" />
                  </div>
                </div>

                {/* Open Graph */}
                <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 space-y-4 shadow-2xs">
                  <h2 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] uppercase tracking-wider font-mono flex items-center gap-2"><Share2 className="w-4 h-4 text-[#657565]" /> Open Graph (Social Sharing)</h2>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">OG Title (defaults to SEO title)</label>
                      <input type="text" value={articleOptions.ogTitle || article.seo.seoTitle} onChange={e => updateOptions({ ogTitle: e.target.value })} placeholder="Social share title..." className="w-full text-xs p-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl outline-none focus:border-[#657565]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">OG Description</label>
                      <textarea value={articleOptions.ogDescription || article.seo.metaDescription} onChange={e => updateOptions({ ogDescription: e.target.value })} rows={2} placeholder="Social share description..." className="w-full text-xs p-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl outline-none focus:border-[#657565] resize-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">OG Image URL</label>
                      <input type="text" value={articleOptions.ogImage || article.coverImage || ''} onChange={e => updateOptions({ ogImage: e.target.value })} placeholder="https://... (defaults to cover image)" className="w-full text-xs font-mono p-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl outline-none focus:border-[#657565]" />
                    </div>
                  </div>
                </div>

                {/* Canonical + Schedule */}
                <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 space-y-4 shadow-2xs">
                  <h2 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] uppercase tracking-wider font-mono flex items-center gap-2"><Globe className="w-4 h-4 text-[#657565]" /> Advanced Publishing</h2>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">Canonical URL (optional — leave blank to auto-generate)</label>
                      <input type="text" value={articleOptions.canonicalUrl || article.seo?.canonicalUrl || ''} onChange={e => updateOptions({ canonicalUrl: e.target.value })} placeholder={`${SITE_URL}/articles/${article.slug || 'your-article-slug'}`} className="w-full text-xs font-mono p-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl outline-none focus:border-[#657565]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0] flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Scheduled Publish Date & Time</label>
                      <input type="datetime-local" value={articleOptions.scheduledDate} onChange={e => updateOptions({ scheduledDate: e.target.value })} className="w-full text-xs p-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl outline-none focus:border-[#657565]" />
                      <p className="text-[11px] text-[#7B8978]">Set a future date to auto-publish. Change article status to "Scheduled" to activate.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ TAB: PREVIEW ══ */}
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 bg-[#FAF9F6] dark:bg-[#1E221E] p-1.5 rounded-2xl border border-[#D8D0C2] dark:border-[#384238] w-fit mx-auto shadow-2xs">
                  <button type="button" onClick={() => setPreviewDevice('desktop')} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${previewDevice === 'desktop' ? 'bg-[#657565] text-white shadow-xs' : 'text-[#7B8978] hover:text-[#20231F] dark:hover:text-white'}`}>
                    <Monitor className="w-3.5 h-3.5" /><span>Desktop</span>
                  </button>
                  <button type="button" onClick={() => setPreviewDevice('mobile')} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${previewDevice === 'mobile' ? 'bg-[#657565] text-white shadow-xs' : 'text-[#7B8978] hover:text-[#20231F] dark:hover:text-white'}`}>
                    <Smartphone className="w-3.5 h-3.5" /><span>Mobile (390px)</span>
                  </button>
                </div>
                <div className="flex justify-center p-2 sm:p-6 bg-[#EAE7E0]/40 dark:bg-[#131715]/40 rounded-3xl border border-[#D8D0C2]/80 dark:border-[#333C33]">
                  {previewDevice === 'mobile' ? (
                    <div className="w-[390px] max-w-full bg-[#F7F8F7] dark:bg-[#090B0A] rounded-[40px] border-8 border-slate-800 shadow-2xl overflow-hidden p-4 pt-8">
                      <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-4" />
                      <ArticleRenderer article={article} allArticles={allArticlesList} previewMode={true} />
                    </div>
                  ) : (
                    <div className="w-full max-w-5xl bg-white dark:bg-[#1E221E] rounded-3xl p-6 sm:p-10 shadow-xs border border-[#D8D0C2] dark:border-[#384238]">
                      <ArticleRenderer article={article} allArticles={allArticlesList} previewMode={true} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right sidebar — always visible xl+ ── */}
          <div className="hidden xl:block w-72 shrink-0">
            <div className="sticky top-4 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7B8978] font-mono">Publish Panel</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${article.status === 'published' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'}`}>
                  {article.status || 'Draft'}
                </span>
              </div>
              <PublishPanel />
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Content Block Modal ── */}
      {showBlockMenu && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowBlockMenu(false)}
        >
          <div
            className="bg-white dark:bg-[#1E221E] w-full max-w-3xl rounded-3xl border border-[#D8D0C2] dark:border-[#384238] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="p-5 border-b border-[#D8D0C2] dark:border-[#333C33] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#20231F] dark:text-[#EAE7E0]">Add Content Block</h3>
                <p className="text-xs text-[#7B8978] mt-0.5">Select a structured engineering block to insert into your article.</p>
              </div>
              <button type="button" onClick={() => setShowBlockMenu(false)} className="p-1.5 rounded-full hover:bg-[#FAF9F6] dark:hover:bg-[#252B25] text-[#7B8978] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category filter */}
            <div className="p-3 border-b border-[#D8D0C2]/60 dark:border-[#333C33] flex flex-wrap gap-1.5 bg-[#FAF9F6] dark:bg-[#131715]">
              {[
                { id: 'engineering', label: 'Engineering Blocks' },
                { id: 'basic', label: 'Basic Content' },
                { id: 'visual', label: 'Visual & Media' },
                { id: 'conversion', label: 'Calculator CTAs' },
                { id: 'faq', label: 'FAQ Section' },
              ].map(cat => (
                <button key={cat.id} type="button" onClick={() => setSelectedBlockCategory(cat.id as any)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${selectedBlockCategory === cat.id ? 'bg-[#657565] text-white shadow-xs' : 'text-[#7B8978] hover:text-[#20231F] dark:hover:text-white'}`}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Block options */}
            <div className="p-6 overflow-y-auto space-y-4">
              {selectedBlockCategory === 'engineering' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { type: 'formula' as const, icon: <span className="font-bold text-lg">Σ</span>, label: 'Formula (KaTeX)', desc: 'Centered mathematical equation with variable definitions table and unit.' },
                    { type: 'calculation_example' as const, icon: <Calculator className="w-4 h-4" />, label: 'Calculation Example', desc: 'Worked numerical card with given inputs, formula substitution, and high-visibility result.' },
                    { type: 'engineering_note' as const, icon: <Info className="w-4 h-4" />, label: 'Engineering Note', desc: 'Subtle blueprint callout for technical field rules, assumptions, and practical insights.' },
                    { type: 'warning' as const, icon: <AlertTriangle className="w-4 h-4" />, label: 'Warning / Verification', desc: 'Safety notice, design limitations, or code compliance verification disclaimer.', amber: true },
                    { type: 'key_takeaway' as const, icon: <BookmarkCheck className="w-4 h-4" />, label: 'Key Takeaways', desc: 'Visual summary component with checkmarks for fast scanning and memory retention.', emerald: true },
                    { type: 'step_by_step' as const, icon: <Layers className="w-4 h-4" />, label: 'Step-by-Step Procedure', desc: 'Sequential numbered cards detailing field measuring and calculation steps.' },
                    { type: 'table' as const, icon: <TableIcon className="w-4 h-4" />, label: 'Specification / Comparison Table', desc: 'Data table with mobile horizontal scrolling and column editing.' },
                    { type: 'definition' as const, icon: <Lightbulb className="w-4 h-4" />, label: 'Technical Definition', desc: 'Explain civil engineering terms, factors, and concepts clearly.' },
                  ].map(b => (
                    <button key={b.type} type="button" onClick={() => addBlock(b.type)} className="p-4 rounded-2xl border border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] hover:bg-[#FAF9F6] dark:hover:bg-[#252B25] text-left transition-all group cursor-pointer">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${b.amber ? 'bg-amber-500/10 text-amber-600' : b.emerald ? 'bg-emerald-500/10 text-emerald-600' : 'bg-[#657565]/10 text-[#657565]'}`}>{b.icon}</div>
                        <span className={`font-bold text-sm text-[#20231F] dark:text-[#EAE7E0] ${b.amber ? 'group-hover:text-amber-600' : b.emerald ? 'group-hover:text-emerald-600' : 'group-hover:text-[#657565]'}`}>{b.label}</span>
                      </div>
                      <p className="text-xs text-[#7B8978] leading-relaxed">{b.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {selectedBlockCategory === 'basic' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { type: 'paragraph' as const, label: 'Paragraph', desc: 'Standard text block with generous line height and markdown support.' },
                    { type: 'heading_2' as const, label: 'H2 Heading', desc: 'Major section title that automatically appears in the Table of Contents.' },
                    { type: 'heading_3' as const, label: 'H3 Heading', desc: 'Sub-section heading for secondary points.' },
                    { type: 'bullet_list' as const, label: 'Bullet List', desc: 'Clean bulleted items for readability.' },
                    { type: 'numbered_list' as const, label: 'Numbered List', desc: 'Ordered list for requirements and checklists.' },
                    { type: 'quote' as const, label: 'Quote / Code Excerpt', desc: 'Styled callout quote with author or clause reference.' },
                    { type: 'divider' as const, label: 'Divider', desc: 'Horizontal technical rule separating sections.' },
                  ].map(b => (
                    <button key={b.type} type="button" onClick={() => addBlock(b.type)} className="p-4 rounded-2xl border border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] text-left transition-all cursor-pointer">
                      <span className="font-bold text-sm block mb-1 text-[#20231F] dark:text-[#EAE7E0]">{b.label}</span>
                      <p className="text-xs text-[#7B8978]">{b.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {selectedBlockCategory === 'visual' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { type: 'image' as const, label: 'Diagram / Figure', desc: 'Technical image with figure numbering, caption, and full-screen lightbox zoom.' },
                    { type: 'image_text' as const, label: 'Image + Text', desc: 'Side-by-side illustration and explanatory commentary.' },
                    { type: 'two_column' as const, label: 'Two Column Content', desc: 'Compare two methods or parameters side by side.' },
                  ].map(b => (
                    <button key={b.type} type="button" onClick={() => addBlock(b.type)} className="p-4 rounded-2xl border border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] text-left transition-all cursor-pointer">
                      <span className="font-bold text-sm block mb-1 text-[#20231F] dark:text-[#EAE7E0]">{b.label}</span>
                      <p className="text-xs text-[#7B8978]">{b.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {selectedBlockCategory === 'conversion' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={() => addBlock('calculator_embed')} className="p-4 rounded-2xl border-2 border-[#2E6B56]/50 bg-[#2E6B56]/10 hover:border-[#2E6B56] text-left transition-all cursor-pointer">
                    <span className="font-bold text-sm block mb-1 text-[#2E6B56] dark:text-[#4ADE80] flex items-center gap-1.5">
                      <Calculator className="w-4 h-4" />
                      Interactive Calculator Embed
                    </span>
                    <p className="text-xs text-[#7B8978]">Embed a real live CivilMath calculator (Concrete Volume, Mix, Rebar, Steel, etc.) directly inside the article.</p>
                  </button>
                  <button type="button" onClick={() => addBlock('calculator_cta')} className="p-4 rounded-2xl border border-[#657565]/40 bg-[#657565]/5 hover:border-[#657565] text-left transition-all cursor-pointer">
                    <span className="font-bold text-sm block mb-1 text-[#657565] dark:text-[#A1B3A1]">Calculator CTA Banner</span>
                    <p className="text-xs text-[#7B8978]">High-converting interactive card sending readers to a CivilMath calculator.</p>
                  </button>
                  <button type="button" onClick={() => addBlock('related_calculator')} className="p-4 rounded-2xl border border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] text-left transition-all cursor-pointer">
                    <span className="font-bold text-sm block mb-1 text-[#20231F] dark:text-[#EAE7E0]">Related Tool Card</span>
                    <p className="text-xs text-[#7B8978]">Secondary calculator recommendation.</p>
                  </button>
                  <button type="button" onClick={() => addBlock('related_article')} className="p-4 rounded-2xl border border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] text-left transition-all cursor-pointer">
                    <span className="font-bold text-sm block mb-1 text-[#20231F] dark:text-[#EAE7E0]">Related Articles</span>
                    <p className="text-xs text-[#7B8978]">Grid of related engineering reading cards.</p>
                  </button>
                  <button type="button" onClick={() => addBlock('tool_recommendation')} className="p-4 rounded-2xl border border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] text-left transition-all cursor-pointer">
                    <span className="font-bold text-sm block mb-1 text-[#20231F] dark:text-[#EAE7E0]">Tool Recommendation</span>
                    <p className="text-xs text-[#7B8978]">Inline utility tool recommendation card.</p>
                  </button>
                </div>
              )}

              {selectedBlockCategory === 'faq' && (
                <div className="grid grid-cols-1 gap-3">
                  <button type="button" onClick={() => addBlock('faq')} className="p-4 rounded-2xl border border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] text-left transition-all cursor-pointer">
                    <span className="font-bold text-sm block mb-1 text-[#20231F] dark:text-[#EAE7E0]">FAQ Accordion Section</span>
                    <p className="text-xs text-[#7B8978]">Accessible accordion section with question-and-answer pairs, automatically outputting JSON-LD structured data.</p>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Publish sidebar slide-over (mobile / sm / lg) ── */}
      {showPublishSidebar && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end xl:hidden"
          onClick={() => setShowPublishSidebar(false)}
        >
          <div
            className="w-80 max-w-full h-full bg-white dark:bg-[#1E221E] border-l border-[#D8D0C2] dark:border-[#384238] shadow-2xl overflow-y-auto p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0]">Publish Panel</h3>
              <button type="button" onClick={() => setShowPublishSidebar(false)} className="p-1.5 rounded-full hover:bg-[#FAF9F6] dark:hover:bg-[#252B25] text-[#7B8978] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <PublishPanel />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
