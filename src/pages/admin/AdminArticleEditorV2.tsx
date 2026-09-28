import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  ChangeEvent,
} from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Save, Eye, ArrowLeft, Send, Sparkles, RefreshCw, Check,
  Link as LinkIcon, Image as ImageIcon, Trash2, Copy, Plus,
  FileText, Clock, HelpCircle, Code, AlignLeft,
  ChevronDown, ChevronUp, Monitor, Tablet, Smartphone, Calculator,
  Compass, Table as TableIcon, Layers, AlertTriangle, Lightbulb,
  Info, BookOpen, Quote, Shield, CheckCircle2, ChevronRight,
  ExternalLink, Upload, X, Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Maximize2, Loader2, MoveUp, MoveDown, EyeOff,
  Columns, CheckSquare, CornerDownLeft, Sparkle, Download, FileCode,
  FileCheck, AlertCircle, Edit3, SplitSquareVertical, Sliders, CheckCheck
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import {
  Article,
  ArticleCategory,
  ArticleBlock,
  ArticleBlockType,
  FormulaBlockData,
  StepByStepBlockData,
  TableBlockData,
  ImageBlockData,
  FaqBlockData,
  CalculationExampleBlockData,
  WarningBlockData,
  EngineeringNoteBlockData,
  KeyTakeawayBlockData,
  QuoteBlockData,
  legacyArticleToBlocks,
} from '../../types/article';
import {
  getArticleBySlug,
  saveArticle,
  uploadArticleImage,
  getAllArticleSummaries,
  normalizeArticleData,
} from '../../utils/articleStore';
import { autoGenerateSeo, auditArticleSeo, slugify } from '../../utils/autoSeo';
import MathFormula from '../../components/article/MathFormula';
import ArticleRenderer from '../../components/article/ArticleRenderer';

// ─── Categories ──────────────────────────────────────────────────────────────
const CATEGORIES: { id: ArticleCategory; label: string }[] = [
  { id: 'concrete', label: 'Concrete' },
  { id: 'structural', label: 'Structural Analysis' },
  { id: 'bbs', label: 'Bar Bending Schedule (BBS)' },
  { id: 'geotech', label: 'Geotechnical' },
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

// ─── Clean Blank Article Initializer ─────────────────────────────────────────
function createBlankArticle(): Article {
  return {
    slug: '',
    title: '',
    h1: '',
    excerpt: '',
    category: 'general',
    author: 'CivilMath Team',
    publishedAt: new Date().toISOString(),
    readTimeMinutes: 5,
    status: 'draft',
    featured: false,
    allowComments: true,
    seoIndex: true,
    showAuthor: true,
    showRelatedArticles: true,
    showRelatedCalculators: true,
    showFaq: true,
    coverImage: '',
    tags: [],
    seo: {
      seoTitle: '',
      metaDescription: '',
      primaryKeyword: '',
      secondaryKeywords: [],
      lsiKeywords: [],
      canonicalUrl: '',
    },
    blocks: [
      {
        id: `blk_${Date.now()}_intro`,
        type: 'paragraph',
        order: 0,
        visibility: true,
        content: '',
      },
    ],
  };
}

// ─── Sample Calculation Guide Template ──────────────────────────────────────
const SAMPLE_CALCULATION_TEMPLATE: Article = {
  slug: 'how-to-calculate-concrete-volume',
  title: 'How to Calculate Concrete Volume',
  h1: 'How to Calculate Concrete Volume',
  excerpt: 'Learn how to calculate concrete volume with formula, step-by-step method, practical example, and online calculator.',
  category: 'concrete',
  author: 'CivilMath Team',
  publishedAt: new Date().toISOString(),
  readTimeMinutes: 8,
  status: 'draft',
  featured: false,
  allowComments: true,
  seoIndex: true,
  showAuthor: true,
  showRelatedArticles: true,
  showRelatedCalculators: true,
  showFaq: true,
  coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80',
  tags: ['concrete volume', 'concrete calculation', 'construction'],
  seo: {
    seoTitle: 'How to Calculate Concrete Volume | CivilMath',
    metaDescription: 'Learn how to calculate concrete volume with formula, step-by-step method, practical example and free online calculator.',
    primaryKeyword: 'concrete volume',
    secondaryKeywords: ['concrete calculation', 'concrete formula'],
    lsiKeywords: [],
    canonicalUrl: 'https://civilmath.com/articles/how-to-calculate-concrete-volume',
  },
  blocks: [
    {
      id: 'blk_h2_intro',
      type: 'heading_2',
      order: 0,
      visibility: true,
      title: 'Introduction to Concrete Volume Calculation',
      content: 'Concrete volume is the total volume required for cast-in-place or precast structures. Precision in estimation prevents costly shortfalls and wasteful excess.',
    },
    {
      id: 'blk_formula_vol',
      type: 'formula',
      order: 1,
      visibility: true,
      title: 'Concrete Volume Formula',
      data: {
        title: 'Volume Calculation Formula',
        equation: 'V = L \\times W \\times H',
        variables: [
          { symbol: 'V', meaning: 'Concrete volume (m³)' },
          { symbol: 'L', meaning: 'Length (m)' },
          { symbol: 'W', meaning: 'Width (m)' },
          { symbol: 'H', meaning: 'Height or Thickness (m)' },
        ],
      } as FormulaBlockData,
    },
    {
      id: 'blk_step_by_step',
      type: 'step_by_step',
      order: 2,
      visibility: true,
      title: 'Step by Step Calculation Method',
      data: {
        title: 'Step by Step Method',
        steps: [
          { stepNumber: 1, title: 'Measure clear dimensions', description: 'Measure length, width, and depth from approved construction drawings.' },
          { stepNumber: 2, title: 'Convert all units to meters', description: 'Standardize millimeters or inches into meters before multiplying.' },
          { stepNumber: 3, title: 'Apply the volumetric formula', description: 'Multiply Length × Width × Depth to find neat cubic volume.' },
          { stepNumber: 4, title: 'Add wastage allowance (2% - 5%)', description: 'Allow margin for subgrade irregularities and concrete pump spillage.' },
        ],
      } as StepByStepBlockData,
    },
    {
      id: 'blk_calculator',
      type: 'calculator_embed',
      order: 3,
      visibility: true,
      title: 'Interactive Concrete Volume Calculator',
      data: {
        calculatorId: 'concrete-volume',
        title: 'Concrete Volume Calculator',
      },
    },
    {
      id: 'blk_warning',
      type: 'warning',
      order: 4,
      visibility: true,
      title: 'Engineering Quality Notice',
      data: {
        title: 'Engineering Verification Required',
        message: 'Calculated neat volume does not include subgrade settlement or pipeline transit loss. Always verify against approved structural drawings.',
        severity: 'warning',
      } as WarningBlockData,
    },
  ],
};

// ─── Standard Guide Template ────────────────────────────────────────────────
const SAMPLE_STANDARD_GUIDE_TEMPLATE: Article = {
  slug: 'site-concrete-curing-guide',
  title: 'Site Guide: Concrete Curing Standards & Methods',
  h1: 'Site Guide: Concrete Curing Standards & Methods',
  excerpt: 'Essential engineering guidelines on concrete curing duration, methods, temperature control, and compressive strength development.',
  category: 'concrete',
  author: 'CivilMath Team',
  publishedAt: new Date().toISOString(),
  readTimeMinutes: 6,
  status: 'draft',
  featured: false,
  allowComments: true,
  seoIndex: true,
  showAuthor: true,
  showRelatedArticles: true,
  showRelatedCalculators: true,
  showFaq: true,
  coverImage: '',
  tags: ['curing', 'concrete quality', 'site engineering'],
  seo: {
    seoTitle: 'Concrete Curing Methods & Duration Guide | CivilMath',
    metaDescription: 'Complete guide to concrete curing: ponding, membrane curing, wet hessian, and standard curing durations according to BS and ACI codes.',
    primaryKeyword: 'concrete curing methods',
    secondaryKeywords: ['curing duration', 'concrete strength'],
    lsiKeywords: [],
    canonicalUrl: 'https://civilmath.com/articles/site-concrete-curing-guide',
  },
  blocks: [
    {
      id: 'blk_guide_intro',
      type: 'heading_2',
      order: 0,
      visibility: true,
      title: 'Why Concrete Curing is Critical',
      content: 'Curing maintains moisture and favorable temperatures to allow continuous hydration of Portland cement. Inadequate curing reduces compressive strength and increases cracking susceptibility.',
    },
    {
      id: 'blk_guide_p1',
      type: 'paragraph',
      order: 1,
      visibility: true,
      content: 'Hydration of cement paste requires continuous presence of water. Without adequate curing during the first 7 to 14 days, surface scaling, plastic shrinkage cracking, and high permeability will occur.',
    },
    {
      id: 'blk_guide_table',
      type: 'table',
      order: 2,
      visibility: true,
      title: 'Standard Minimum Curing Periods',
      data: {
        title: 'Minimum Curing Durations',
        headers: ['Cement Type', 'Moderate Weather (Days)', 'Hot & Dry Weather (Days)'],
        rows: [
          ['Ordinary Portland Cement (OPC)', '7 Days', '10 Days'],
          ['Portland Pozzolana / Slag (PPC/PSC)', '10 Days', '14 Days'],
          ['Rapid Hardening Cement', '3 Days', '5 Days'],
        ],
        caption: 'Table 1: Governing curing duration standards (ACI 308 & IS 456)',
      } as TableBlockData,
    },
    {
      id: 'blk_guide_takeaways',
      type: 'key_takeaway',
      order: 3,
      visibility: true,
      title: 'Site Inspection Key Takeaways',
      data: {
        title: 'Site Inspection Key Takeaways',
        items: [
          'Commence moist curing immediately after the final set of concrete.',
          'Keep vertical columns wrapped in wet hessian burlap with poly wrap.',
          'Never allow surfaces to alternate between wet and dry cycles.',
        ],
      } as KeyTakeawayBlockData,
    },
    {
      id: 'blk_guide_faqs',
      type: 'faq',
      order: 4,
      visibility: true,
      title: 'Frequently Asked Questions',
      data: {
        title: 'Frequently Asked Questions',
        faqs: [
          { question: 'What happens if concrete is not cured for 7 days?', answer: 'Compressive strength can drop by 30% to 50%, and durability against abrasion and chemical attack is drastically compromised.' },
          { question: 'Which curing method is best for flat floor slabs?', answer: 'Water ponding or continuous wet burlap covering with impermeable plastic sheeting is the most effective approach for horizontal slabs.' },
        ],
      } as FaqBlockData,
    },
  ],
};

// ─── Markdown to Blocks Converter ───────────────────────────────────────────
function markdownToArticleBlocks(md: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const lines = md.split('\n');
  let currentParagraph = '';
  let order = 0;

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      blocks.push({
        id: `blk_${Date.now()}_p_${order}`,
        type: 'paragraph',
        order: order++,
        visibility: true,
        content: currentParagraph.trim(),
      });
      currentParagraph = '';
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Skip top H1 if it's the title
    if (trimmed.startsWith('# ') && order === 0) {
      continue;
    }

    // H2 Heading
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      blocks.push({
        id: `blk_${Date.now()}_h2_${order}`,
        type: 'heading_2',
        order: order++,
        visibility: true,
        title: trimmed.replace(/^##\s+/, ''),
        content: '',
      });
      continue;
    }

    // H3 Heading
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      blocks.push({
        id: `blk_${Date.now()}_h3_${order}`,
        type: 'heading_3',
        order: order++,
        visibility: true,
        title: trimmed.replace(/^###\s+/, ''),
        content: '',
      });
      continue;
    }

    // Quote
    if (trimmed.startsWith('> ')) {
      flushParagraph();
      blocks.push({
        id: `blk_${Date.now()}_quote_${order}`,
        type: 'quote',
        order: order++,
        visibility: true,
        data: {
          quote: trimmed.replace(/^>\s+/, ''),
        },
      });
      continue;
    }

    // Code block
    if (trimmed.startsWith('```')) {
      flushParagraph();
      const lang = trimmed.replace('```', '').trim() || 'python';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        id: `blk_${Date.now()}_code_${order}`,
        type: 'code_block',
        order: order++,
        visibility: true,
        data: {
          language: lang,
          code: codeLines.join('\n'),
        },
      });
      continue;
    }

    // Key Takeaway / Bullet list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph();
      const items: string[] = [trimmed.replace(/^[-*]\s+/, '')];
      while (i + 1 < lines.length && (lines[i + 1].trim().startsWith('- ') || lines[i + 1].trim().startsWith('* '))) {
        i++;
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
      }
      blocks.push({
        id: `blk_${Date.now()}_takeaway_${order}`,
        type: 'key_takeaway',
        order: order++,
        visibility: true,
        data: {
          title: 'Key Points',
          items,
        },
      });
      continue;
    }

    // Paragraph text line
    if (currentParagraph) {
      currentParagraph += '\n' + trimmed;
    } else {
      currentParagraph = trimmed;
    }
  }

  flushParagraph();
  return blocks;
}

// ─── Palette Items ──────────────────────────────────────────────────────────
interface PaletteItem {
  type: ArticleBlockType;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'paragraph', label: 'Paragraph', icon: <span className="font-bold text-xs">P</span>, colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  { type: 'heading_2', label: 'Heading (H2)', icon: <span className="font-bold text-xs">H2</span>, colorClass: 'text-blue-700 bg-blue-100/60 dark:bg-blue-900/40' },
  { type: 'formula', label: 'Formula (KaTeX)', icon: <span className="font-serif italic font-bold text-xs">fx</span>, colorClass: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
  { type: 'step_by_step', label: 'Step-by-Step', icon: <ListOrdered className="w-3.5 h-3.5" />, colorClass: 'text-slate-800 bg-slate-100 dark:bg-slate-800' },
  { type: 'calculator_embed', label: 'Calculator', icon: <Calculator className="w-3.5 h-3.5" />, colorClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  { type: 'table', label: 'Table', icon: <TableIcon className="w-3.5 h-3.5" />, colorClass: 'text-slate-700 bg-slate-100 dark:bg-slate-800' },
  { type: 'image', label: 'Image', icon: <ImageIcon className="w-3.5 h-3.5" />, colorClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  { type: 'key_takeaway', label: 'Key Points', icon: <Lightbulb className="w-3.5 h-3.5" />, colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
  { type: 'warning', label: 'Warning / Notice', icon: <AlertTriangle className="w-3.5 h-3.5" />, colorClass: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
  { type: 'engineering_note', label: 'Engineering Note', icon: <Info className="w-3.5 h-3.5" />, colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
  { type: 'faq', label: 'FAQ', icon: <HelpCircle className="w-3.5 h-3.5" />, colorClass: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
  { type: 'quote', label: 'Quote', icon: <Quote className="w-3.5 h-3.5" />, colorClass: 'text-slate-700 bg-slate-100 dark:bg-slate-800' },
  { type: 'code_block', label: 'Code Block', icon: <Code className="w-3.5 h-3.5" />, colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
];

// ─── Toggle Switch Component ────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 select-none py-1">
      <div className="flex flex-col">
        {label && <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{label}</span>}
        {description && <span className="text-[10px] text-slate-400 mt-0.5">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer ${
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// ─── Main Editor Component ──────────────────────────────────────────────────
type EditorMode = 'visual' | 'markdown' | 'json' | 'preview' | 'split';
type SidebarTab = 'publish' | 'seo' | 'media';

export default function AdminArticleEditorV2() {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = Boolean(slug);

  // ── Mode & View State ─────────────────────────────────────────────────────
  const initialMode: EditorMode = useMemo(() => {
    const qMode = searchParams.get('mode') || searchParams.get('tab');
    if (qMode === 'json') return 'json';
    if (qMode === 'markdown') return 'markdown';
    if (qMode === 'preview') return 'preview';
    return 'visual';
  }, [searchParams]);

  const [editorMode, setEditorMode] = useState<EditorMode>(initialMode);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('publish');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // ── Article Core State ────────────────────────────────────────────────────
  const [article, setArticle] = useState<Article>(() => {
    return isEditing ? SAMPLE_CALCULATION_TEMPLATE : createBlankArticle();
  });
  const [loading, setLoading] = useState(isEditing);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── JSON Editor State ─────────────────────────────────────────────────────
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonIsDirty, setJsonIsDirty] = useState<boolean>(false);
  const [jsonCopied, setJsonCopied] = useState<boolean>(false);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // ── Markdown Fast Writer State ────────────────────────────────────────────
  const [markdownText, setMarkdownText] = useState<string>('');

  // ── Interactive Block Calculator State ─────────────────────────────────────
  const [calcLength, setCalcLength] = useState<number>(5);
  const [calcWidth, setCalcWidth] = useState<number>(3);
  const [calcHeight, setCalcHeight] = useState<number>(0.15);
  const [calculatedVolume, setCalculatedVolume] = useState<number | null>(2.25);

  // ── UI States ─────────────────────────────────────────────────────────────
  const [quickInputText, setQuickInputText] = useState('');
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [tagInput, setTagInput] = useState('');
  const lastActiveTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync JSON text from article when article changes (if user hasn't made unsynced changes)
  useEffect(() => {
    if (!jsonIsDirty) {
      setJsonText(JSON.stringify(article, null, 2));
      setJsonError(null);
    }
  }, [article, jsonIsDirty]);

  // Load article if editing existing slug
  useEffect(() => {
    if (isEditing && slug) {
      setLoading(true);
      getArticleBySlug(slug)
        .then((loaded) => {
          if (loaded) {
            let eff = { ...loaded };
            if (!eff.blocks || eff.blocks.length === 0) {
              eff.blocks = legacyArticleToBlocks(loaded);
            }
            setArticle(eff);
            const exp: Record<string, boolean> = {};
            eff.blocks.forEach((b) => { exp[b.id] = true; });
            setExpandedBlocks(exp);
            setJsonText(JSON.stringify(eff, null, 2));
            setJsonIsDirty(false);
          } else {
            navigate('/admin/articles');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [slug, isEditing, navigate]);

  // ── Mode Switcher Logic ───────────────────────────────────────────────────
  const handleSwitchMode = (targetMode: EditorMode) => {
    // If leaving JSON mode with unsaved changes, validate and apply
    if (editorMode === 'json' && targetMode !== 'json' && jsonIsDirty) {
      try {
        const parsed = JSON.parse(jsonText);
        const normalized = normalizeArticleData(parsed, article.slug);
        setArticle(normalized);
        setJsonIsDirty(false);
        showToast('✓ JSON changes applied to visual article');
      } catch (err: any) {
        showToast('⚠️ JSON has syntax errors; please fix or revert before switching');
        setJsonError(err.message);
        return;
      }
    }

    // If entering Markdown mode, populate with current content if empty
    if (targetMode === 'markdown' && !markdownText.trim()) {
      const generatedMd = (article.blocks || [])
        .map(b => {
          if (b.type === 'heading_2') return `## ${b.title || ''}\n${b.content || ''}`;
          if (b.type === 'heading_3') return `### ${b.title || ''}\n${b.content || ''}`;
          if (b.type === 'paragraph') return b.content || '';
          if (b.type === 'quote') return `> ${b.data?.quote || b.content || ''}`;
          if (b.type === 'key_takeaway' && b.data?.items) {
            return `### Key Points\n` + b.data.items.map((i: string) => `- ${i}`).join('\n');
          }
          return b.content || '';
        })
        .filter(Boolean)
        .join('\n\n');
      setMarkdownText(generatedMd);
    }

    setEditorMode(targetMode);
  };

  // ── JSON Actions ──────────────────────────────────────────────────────────
  const handleJsonChange = (val: string) => {
    setJsonText(val);
    setJsonIsDirty(true);
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const normalized = normalizeArticleData(parsed, article.slug);
      setArticle(normalized);
      setJsonIsDirty(false);
      setJsonError(null);
      showToast('🎉 Article updated from JSON successfully!');
    } catch (err: any) {
      setJsonError(err.message);
      showToast('❌ Cannot apply: Invalid JSON syntax');
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setJsonError(null);
      showToast('✨ JSON formatted and prettified');
    } catch (err: any) {
      setJsonError(err.message);
      showToast('❌ Cannot format: Invalid JSON syntax');
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    setJsonCopied(true);
    showToast('📋 JSON copied to clipboard');
    setTimeout(() => setJsonCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.slug || 'article'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('💾 Article JSON downloaded');
  };

  const handleUploadJsonFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          const item = Array.isArray(parsed) ? parsed[0] : parsed;
          const normalized = normalizeArticleData(item, article.slug);
          setArticle(normalized);
          setJsonText(JSON.stringify(normalized, null, 2));
          setJsonIsDirty(false);
          setJsonError(null);
          showToast('📂 JSON file loaded and applied!');
        } catch (err: any) {
          setJsonError(err.message);
          showToast('❌ Invalid JSON in file');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetJson = () => {
    setJsonText(JSON.stringify(article, null, 2));
    setJsonIsDirty(false);
    setJsonError(null);
    showToast('🔄 Reverted JSON to current visual article');
  };

  // ── Template Switcher ─────────────────────────────────────────────────────
  const handleApplyTemplate = (type: 'blank' | 'calc' | 'guide') => {
    if (type === 'blank') {
      setArticle(createBlankArticle());
      setJsonIsDirty(false);
      showToast('Clean blank canvas loaded');
    } else if (type === 'calc') {
      setArticle({
        ...SAMPLE_CALCULATION_TEMPLATE,
        publishedAt: new Date().toISOString(),
      });
      setJsonIsDirty(false);
      showToast('Calculation guide template loaded');
    } else if (type === 'guide') {
      setArticle({
        ...SAMPLE_STANDARD_GUIDE_TEMPLATE,
        publishedAt: new Date().toISOString(),
      });
      setJsonIsDirty(false);
      showToast('Standard technical guide template loaded');
    }
  };

  // ── Quick Markdown to Blocks ──────────────────────────────────────────────
  const handleConvertMarkdown = () => {
    if (!markdownText.trim()) {
      showToast('Please enter markdown content first');
      return;
    }
    const blocks = markdownToArticleBlocks(markdownText);
    let title = article.title;
    let slugVal = article.slug;
    const h1Match = markdownText.match(/^#\s+(.+)$/m);
    if (h1Match && (!title || title === 'Untitled Article')) {
      title = h1Match[1].trim();
      if (!slugVal) slugVal = slugify(title);
    }
    setArticle(prev => ({
      ...prev,
      title: title || prev.title,
      slug: slugVal || prev.slug,
      blocks: blocks.length > 0 ? blocks : prev.blocks,
    }));
    showToast(`⚡ Created ${blocks.length} structured blocks from Markdown!`);
    setEditorMode('visual');
  };

  // ── Calculator execution simulation ───────────────────────────────────────
  const handleCalculate = () => {
    const vol = calcLength * calcWidth * calcHeight;
    setCalculatedVolume(Number(vol.toFixed(3)));
  };

  // ── Tag Management ────────────────────────────────────────────────────────
  const addTag = (val: string) => {
    const cleaned = val.trim().toLowerCase();
    if (!cleaned) return;
    if (!(article.tags || []).includes(cleaned)) {
      setArticle((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), cleaned],
      }));
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setArticle((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tagToRemove),
    }));
  };

  // ── Block Management ──────────────────────────────────────────────────────
  const handleAddBlock = (type: ArticleBlockType) => {
    const newId = `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newOrder = (article.blocks || []).length;
    let newBlock: ArticleBlock;

    switch (type) {
      case 'heading_2':
        newBlock = {
          id: newId,
          type: 'heading_2',
          order: newOrder,
          visibility: true,
          title: 'Section Heading',
          content: 'Add technical explanation and site guidance here...',
        };
        break;
      case 'formula':
        newBlock = {
          id: newId,
          type: 'formula',
          order: newOrder,
          visibility: true,
          title: 'Engineering Formula',
          data: {
            title: 'Governing Formula',
            equation: 'V = L \\times W \\times H',
            variables: [
              { symbol: 'V', meaning: 'Volume (m³)' },
              { symbol: 'L', meaning: 'Length (m)' },
              { symbol: 'W', meaning: 'Width (m)' },
              { symbol: 'H', meaning: 'Height (m)' },
            ],
          } as FormulaBlockData,
        };
        break;
      case 'step_by_step':
        newBlock = {
          id: newId,
          type: 'step_by_step',
          order: newOrder,
          visibility: true,
          title: 'Step by Step Method',
          data: {
            title: 'Procedure',
            steps: [
              { stepNumber: 1, title: 'Step 1: Check site drawings', description: 'Measure clear dimensions from approved structural drawings.' },
              { stepNumber: 2, title: 'Step 2: Apply formula', description: 'Compute volume using standard SI units.' },
            ],
          } as StepByStepBlockData,
        };
        break;
      case 'calculator_embed':
        newBlock = {
          id: newId,
          type: 'calculator_embed',
          order: newOrder,
          visibility: true,
          title: 'Interactive Calculator',
          data: {
            calculatorId: 'concrete-volume',
            title: 'Concrete Volume Calculator',
          },
        };
        break;
      case 'warning':
        newBlock = {
          id: newId,
          type: 'warning',
          order: newOrder,
          visibility: true,
          title: 'Engineering Caution',
          data: {
            title: 'Engineering Verification Required',
            message: 'All theoretical calculations must be confirmed by a licensed professional engineer prior to construction.',
            severity: 'warning',
          } as WarningBlockData,
        };
        break;
      case 'engineering_note':
        newBlock = {
          id: newId,
          type: 'engineering_note',
          order: newOrder,
          visibility: true,
          title: 'Practice Note',
          data: {
            title: 'Field Practice Note',
            note: 'Always convert dimensions to uniform SI units (meters) prior to volumetric calculation.',
          } as EngineeringNoteBlockData,
        };
        break;
      case 'key_takeaway':
        newBlock = {
          id: newId,
          type: 'key_takeaway',
          order: newOrder,
          visibility: true,
          title: 'Key Takeaways',
          data: {
            title: 'Key Takeaways',
            items: [
              'Verify dimensions on approved drawings.',
              'Apply appropriate wastage factors for pumping loss.',
            ],
          } as KeyTakeawayBlockData,
        };
        break;
      case 'table':
        newBlock = {
          id: newId,
          type: 'table',
          order: newOrder,
          visibility: true,
          title: 'Specification Table',
          data: {
            title: 'Technical Specifications',
            headers: ['Grade', 'Mix Ratio', 'Characteristic Strength (MPa)'],
            rows: [
              ['M15', '1 : 2 : 4', '15 MPa'],
              ['M20', '1 : 1.5 : 3', '20 MPa'],
              ['M25', '1 : 1 : 2', '25 MPa'],
            ],
            caption: 'Table: Standard Concrete Nominal Mixes',
          } as TableBlockData,
        };
        break;
      case 'image':
        newBlock = {
          id: newId,
          type: 'image',
          order: newOrder,
          visibility: true,
          title: 'Site Diagram',
          data: {
            url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80',
            alt: 'Civil engineering construction detailing',
            caption: 'Figure 1: Measurement profile on construction site',
          } as ImageBlockData,
        };
        break;
      case 'faq':
        newBlock = {
          id: newId,
          type: 'faq',
          order: newOrder,
          visibility: true,
          title: 'Frequently Asked Questions',
          data: {
            title: 'Frequently Asked Questions',
            faqs: [
              { question: 'What dry volume factor should be applied?', answer: 'A factor of 1.54 is standard to account for voids in dry ingredients.' },
            ],
          } as FaqBlockData,
        };
        break;
      case 'quote':
        newBlock = {
          id: newId,
          type: 'quote',
          order: newOrder,
          visibility: true,
          title: 'Standard Reference Quote',
          data: {
            quote: 'Structural safety depends directly on rigorous estimation and compliance with building codes.',
            author: 'ACI Code Handbook',
          } as QuoteBlockData,
        };
        break;
      case 'code_block':
        newBlock = {
          id: newId,
          type: 'code_block',
          order: newOrder,
          visibility: true,
          title: 'Python Script',
          data: {
            language: 'python',
            code: '# Compute neat concrete volume\ndef calc_volume(length_m, width_m, height_m):\n    return length_m * width_m * height_m',
          },
        };
        break;
      default:
        newBlock = {
          id: newId,
          type: 'paragraph',
          order: newOrder,
          visibility: true,
          content: '',
        };
        break;
    }

    setArticle((prev) => ({
      ...prev,
      blocks: [...(prev.blocks || []), newBlock],
    }));
    setExpandedBlocks((prev) => ({ ...prev, [newId]: true }));
    showToast(`Added ${newBlock.type.replace(/_/g, ' ')} block`);
  };

  const handleDeleteBlock = (blockId: string) => {
    setArticle((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).filter((b) => b.id !== blockId),
    }));
    showToast('Block removed');
  };

  const handleDuplicateBlock = (blockId: string) => {
    const existing = (article.blocks || []).find((b) => b.id === blockId);
    if (!existing) return;
    const duplicated: ArticleBlock = {
      ...existing,
      id: `blk_${Date.now()}_copy`,
      title: existing.title ? `${existing.title} (Copy)` : undefined,
    };
    setArticle((prev) => ({
      ...prev,
      blocks: [...(prev.blocks || []), duplicated],
    }));
    setExpandedBlocks((prev) => ({ ...prev, [duplicated.id]: true }));
    showToast('Block duplicated');
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const blocks = [...(article.blocks || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const temp = blocks[index];
    blocks[index] = blocks[targetIndex];
    blocks[targetIndex] = temp;
    blocks.forEach((b, i) => { b.order = i; });
    setArticle((prev) => ({ ...prev, blocks }));
  };

  const toggleBlockVisibility = (blockId: string) => {
    setArticle((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).map((b) =>
        b.id === blockId ? { ...b, visibility: b.visibility === false } : b
      ),
    }));
  };

  const toggleExpandBlock = (blockId: string) => {
    setExpandedBlocks((prev) => ({
      ...prev,
      [blockId]: !prev[blockId],
    }));
  };

  const updateBlockContent = (blockId: string, content: string) => {
    setArticle((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).map((b) =>
        b.id === blockId ? { ...b, content } : b
      ),
    }));
  };

  const updateBlockTitle = (blockId: string, title: string) => {
    setArticle((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).map((b) =>
        b.id === blockId ? { ...b, title, data: b.data ? { ...b.data, title } : b.data } : b
      ),
    }));
  };

  const updateBlockData = (blockId: string, dataPatch: any) => {
    setArticle((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).map((b) =>
        b.id === blockId ? { ...b, data: { ...(b.data || {}), ...dataPatch } } : b
      ),
    }));
  };

  const handleQuickAdd = () => {
    if (!quickInputText.trim()) return;
    const newId = `blk_${Date.now()}_p`;
    const newBlock: ArticleBlock = {
      id: newId,
      type: 'paragraph',
      order: (article.blocks || []).length,
      visibility: true,
      content: quickInputText.trim(),
    };
    setArticle((prev) => ({
      ...prev,
      blocks: [...(prev.blocks || []), newBlock],
    }));
    setQuickInputText('');
    setExpandedBlocks((prev) => ({ ...prev, [newId]: true }));
    showToast('Paragraph added to content');
  };

  const applyFormatting = (format: 'bold' | 'italic' | 'underline' | 'strike' | 'bullet' | 'number' | 'link' | 'quote' | 'code') => {
    if (lastActiveTextareaRef.current) {
      const textarea = lastActiveTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);
      let replacement = '';
      switch (format) {
        case 'bold': replacement = `**${selected || 'bold text'}**`; break;
        case 'italic': replacement = `*${selected || 'italic text'}*`; break;
        case 'underline': replacement = `<u>${selected || 'underline text'}</u>`; break;
        case 'strike': replacement = `~~${selected || 'strikethrough text'}~~`; break;
        case 'bullet': replacement = `\n- ${selected || 'List item'}`; break;
        case 'number': replacement = `\n1. ${selected || 'Numbered item'}`; break;
        case 'link': replacement = `[${selected || 'Link text'}](https://example.com)`; break;
        case 'quote': replacement = `\n> ${selected || 'Quote text'}`; break;
        case 'code': replacement = `\`${selected || 'code'}\``; break;
      }
      const updated = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
      textarea.value = updated;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      showToast(`Applied ${format} formatting`);
    } else {
      if (format === 'bullet') handleAddBlock('step_by_step');
      else if (format === 'quote') handleAddBlock('quote');
      else if (format === 'code') handleAddBlock('code_block');
      else handleAddBlock('paragraph');
    }
  };

  // ── Save Handler ──────────────────────────────────────────────────────────
  const handleSave = async (status: 'draft' | 'published') => {
    try {
      setSaveStatus('saving');

      let currentArticleData = { ...article };

      // If currently on JSON tab, ensure valid JSON is applied
      if (editorMode === 'json' && jsonIsDirty) {
        try {
          const parsed = JSON.parse(jsonText);
          currentArticleData = normalizeArticleData(parsed, article.slug);
          setArticle(currentArticleData);
          setJsonIsDirty(false);
        } catch (err: any) {
          setSaveStatus('error');
          showToast('❌ Cannot save: Please fix JSON syntax error first');
          return;
        }
      }

      const finalTitle = currentArticleData.title.trim() || 'Untitled Article';
      const finalSlug = (currentArticleData.slug || slugify(finalTitle) || `article-${Date.now()}`).trim();

      const toSave: Article = {
        ...currentArticleData,
        title: finalTitle,
        slug: finalSlug,
        status,
        updatedAt: new Date().toISOString(),
      };

      await saveArticle(toSave);
      setArticle(toSave);
      setSaveStatus('saved');
      showToast(status === 'published' ? '🎉 Article published successfully!' : '💾 Draft saved successfully!');
      setTimeout(() => setSaveStatus('idle'), 2500);

      if (!isEditing && toSave.slug) {
        navigate(`/admin/articles/edit/${toSave.slug}`, { replace: true });
      }
    } catch {
      setSaveStatus('error');
      showToast('❌ Error saving article');
    }
  };

  // ── Auto SEO Generator ────────────────────────────────────────────────────
  const handleAutoSeo = () => {
    const generated = autoGenerateSeo(article);
    setArticle((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        seoTitle: generated.seoTitle || prev.seo.seoTitle,
        metaDescription: generated.metaDescription || prev.seo.metaDescription,
        primaryKeyword: generated.primaryKeyword || prev.seo.primaryKeyword,
        secondaryKeywords: generated.secondaryKeywords || prev.seo.secondaryKeywords,
      },
    }));
    showToast('⚡ Auto SEO metadata generated from content!');
  };

  // ── Cover Image Upload ────────────────────────────────────────────────────
  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadArticleImage(file);
      setArticle((prev) => ({ ...prev, coverImage: res.url }));
      showToast('Image uploaded successfully');
    } catch (err) {
      console.error('Image upload failed', err);
      showToast('Image upload failed');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="w-full space-y-4 max-w-7xl mx-auto pb-16">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ── TOP HEADER & MODE CONTROLS ───────────────────────────────────── */}
        <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-3">
              <Link
                to="/admin/articles"
                className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                title="Back to Articles"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {isEditing ? `Edit: ${article.title || 'Untitled'}` : 'Create New Article'}
                  </h1>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                    article.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {article.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {article.slug ? `civilmath.com/articles/${article.slug}` : 'Draft will be assigned a permanent URL slug'}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Auto SEO */}
              <button
                type="button"
                onClick={handleAutoSeo}
                className="px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800/60 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Automatically generate meta tags and focus keywords"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Auto SEO</span>
              </button>

              {/* View in Public Tab */}
              {article.slug && (
                <button
                  type="button"
                  onClick={() => window.open(`/articles/${article.slug}`, '_blank')}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="View published article in new tab"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Preview Tab</span>
                </button>
              )}

              {/* Save Draft */}
              <button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={saveStatus === 'saving'}
                className="px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>Save Draft</span>
              </button>

              {/* Publish Button */}
              <button
                type="button"
                onClick={() => handleSave('published')}
                disabled={saveStatus === 'saving'}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
              >
                {saveStatus === 'saving' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Publish</span>
              </button>
            </div>
          </div>

          {/* ── MODE SELECTOR TABS ────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-900 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleSwitchMode('visual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  editorMode === 'visual'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Visual Blocks</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('markdown')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  editorMode === 'markdown'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Quick Markdown</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  editorMode === 'json'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>JSON Editor</span>
                {jsonIsDirty && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Unapplied changes" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  editorMode === 'preview'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Reader</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('split')}
                className={`hidden md:flex px-3 py-1.5 rounded-lg text-xs font-bold items-center gap-1.5 transition-all cursor-pointer ${
                  editorMode === 'split'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
            </div>

            {/* Quick Starter Templates (Especially handy for new articles!) */}
            {!isEditing && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="hidden sm:inline font-medium">Templates:</span>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('blank')}
                  className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Blank
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('guide')}
                  className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Technical Guide
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('calc')}
                  className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Calculation Guide
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            MODE: JSON CODE EDITOR (DIRECT EDIT & IMPORT)
        ══════════════════════════════════════════════════════════════════════ */}
        {editorMode === 'json' && (
          <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
            {/* JSON Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-mono font-bold text-xs">
                  {'{}'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Raw Article JSON Editor
                    </span>
                    {jsonError ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Invalid JSON</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Valid JSON</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Edit raw properties directly or paste complete article JSON. Click Apply Changes when finished.
                  </p>
                </div>
              </div>

              {/* JSON Toolbar Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Apply Changes */}
                <button
                  type="button"
                  onClick={handleApplyJson}
                  disabled={Boolean(jsonError)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    jsonIsDirty && !jsonError
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40'
                  }`}
                  title="Apply JSON changes to visual article and preview"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Apply Changes to Article</span>
                </button>

                {/* Format / Prettify */}
                <button
                  type="button"
                  onClick={handleFormatJson}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Format JSON with standard 2-space indentation"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Format</span>
                </button>

                {/* Copy JSON */}
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Copy full JSON to clipboard"
                >
                  {jsonCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{jsonCopied ? 'Copied!' : 'Copy'}</span>
                </button>

                {/* Download JSON */}
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Download article as .json file"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Download</span>
                </button>

                {/* Load from File */}
                <button
                  type="button"
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Load JSON from a file on your device"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Upload .json</span>
                </button>
                <input
                  ref={jsonFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleUploadJsonFile}
                  className="hidden"
                />

                {/* Revert / Reset */}
                <button
                  type="button"
                  onClick={handleResetJson}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                  title="Discard JSON changes and reload from current article state"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Syntax Error Alert Banner */}
            {jsonError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">JSON Syntax Error: </span>
                  <span className="font-mono">{jsonError}</span>
                </div>
              </div>
            )}

            {/* Editable JSON Code Editor Textarea */}
            <div className="relative">
              <textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                onKeyDown={(e) => {
                  // Support indenting with tab
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const value = e.currentTarget.value;
                    e.currentTarget.value = value.substring(0, start) + '  ' + value.substring(end);
                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                    handleJsonChange(e.currentTarget.value);
                  }
                }}
                spellCheck={false}
                rows={28}
                className="w-full p-4 rounded-xl font-mono text-xs sm:text-[13px] leading-relaxed bg-[#0B132B] text-emerald-300 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner resize-y"
                placeholder="Paste or write valid Article JSON here..."
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MODE: QUICK MARKDOWN WRITER
        ══════════════════════════════════════════════════════════════════════ */}
        {editorMode === 'markdown' && (
          <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>Quick Article Writer (Markdown / Plain Text)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Write or paste your article in Markdown. Headings (##), lists (-), quotes (&gt;) and code will automatically convert into structured blocks.
                </p>
              </div>

              <button
                type="button"
                onClick={handleConvertMarkdown}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-600/30 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Convert to Structured Blocks</span>
              </button>
            </div>

            <textarea
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              rows={22}
              className="w-full p-4 rounded-xl font-mono text-xs sm:text-sm bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-y leading-relaxed"
              placeholder={`# Your Article Title

Write your introduction paragraph here...

## Section 1: Theory and Background
Detailed engineering discussion and parameters...

### Key Points
- Point 1
- Point 2
- Point 3

## Section 2: Mathematical Formulation
Write formulas or practical site steps...`}
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Words: {markdownText.split(/\s+/).filter(Boolean).length} | Characters: {markdownText.length}</span>
              <button
                type="button"
                onClick={handleConvertMarkdown}
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Click here to build blocks →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MODE: LIVE READER PREVIEW
        ══════════════════════════════════════════════════════════════════════ */}
        {editorMode === 'preview' && (
          <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-4">
            {/* Device Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Live Reader Simulation
              </span>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-400'
                  }`}
                  title="Desktop Preview"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    previewDevice === 'tablet' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-400'
                  }`}
                  title="Tablet Preview"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-400'
                  }`}
                  title="Mobile Preview"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div
              className={`mx-auto bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 transition-all ${
                previewDevice === 'mobile'
                  ? 'max-w-[360px] shadow-2xl border-4 border-slate-700'
                  : previewDevice === 'tablet'
                  ? 'max-w-[640px] shadow-2xl border-4 border-slate-700'
                  : 'w-full'
              }`}
            >
              <ArticleRenderer article={article} previewMode={true} />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MODES: VISUAL BLOCKS & SPLIT VIEW (SPACIOUS 2-COLUMN WORKSPACE)
        ══════════════════════════════════════════════════════════════════════ */}
        {(editorMode === 'visual' || editorMode === 'split') && (
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            
            {/* ── LEFT / MAIN CONTENT STAGE ─────────────────────────────────── */}
            <div className="flex-1 w-full space-y-4 min-w-0">
              {/* Document Header Card: Title, Slug, Excerpt */}
              <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3.5">
                {/* Title */}
                <div>
                  <input
                    type="text"
                    value={article.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setArticle((prev) => ({
                        ...prev,
                        title: val,
                        slug: isEditing ? prev.slug : (prev.slug ? prev.slug : slugify(val)),
                      }));
                    }}
                    placeholder="Enter Article Title (e.g. Design of Cantilever Retaining Walls)..."
                    className="w-full text-lg sm:text-2xl font-black text-slate-900 dark:text-white bg-transparent outline-none border-b border-gray-200 dark:border-slate-800 pb-2 placeholder:text-slate-400 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Slug & Category Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                    <span className="text-slate-400 font-mono text-[11px]">URL: /articles/</span>
                    <input
                      type="text"
                      value={article.slug}
                      onChange={(e) => setArticle(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                      placeholder="url-slug"
                      className="text-xs font-mono font-semibold px-2 py-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-blue-600 dark:text-blue-400 flex-1 max-w-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setArticle(prev => ({ ...prev, slug: slugify(prev.title) }))}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-[10px] font-bold rounded text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      Regen
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">Category:</span>
                    <select
                      value={article.category}
                      onChange={(e) => setArticle(prev => ({ ...prev, category: e.target.value as any }))}
                      className="text-xs font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 rounded-lg cursor-pointer"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Excerpt / Summary */}
                <div>
                  <textarea
                    rows={2}
                    value={article.excerpt}
                    onChange={(e) => setArticle(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Short summary / excerpt for search engines and directory cards..."
                    className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 resize-none outline-none focus:border-blue-500"
                  />
                  <div className="text-right text-[10px] text-slate-400">
                    {(article.excerpt || '').length}/160 characters
                  </div>
                </div>
              </div>

              {/* In Split View Mode: Render Split Editor + Live Preview */}
              {editorMode === 'split' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                  {/* Left Half: Blocks Editor */}
                  <div className="space-y-4">
                    {/* Add Block Palette bar */}
                    <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Content Blocks</span>
                        <span className="text-[11px] text-slate-400 font-mono">{(article.blocks || []).length} blocks</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {PALETTE_ITEMS.map((item) => (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => handleAddBlock(item.type)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <span className={item.colorClass}>{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Blocks Stack */}
                    <div className="space-y-3">
                      {renderBlocksList()}
                    </div>
                  </div>

                  {/* Right Half: Live Simulation Preview */}
                  <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs max-h-[850px] overflow-y-auto">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
                      Real-time Article Preview
                    </div>
                    <ArticleRenderer article={article} previewMode={true} />
                  </div>
                </div>
              ) : (
                /* Standard Visual Blocks Mode */
                <div className="space-y-4">
                  {/* Content Palette & Quick Actions Bar */}
                  <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Add Content Block
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{(article.blocks || []).length} blocks</span>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => {
                            const exp: Record<string, boolean> = {};
                            (article.blocks || []).forEach(b => { exp[b.id] = true; });
                            setExpandedBlocks(exp);
                          }}
                          className="hover:text-blue-600 cursor-pointer"
                        >
                          Expand All
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setExpandedBlocks({})}
                          className="hover:text-blue-600 cursor-pointer"
                        >
                          Collapse All
                        </button>
                      </div>
                    </div>

                    {/* Block Add Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {PALETTE_ITEMS.map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => handleAddBlock(item.type)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-600 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-50/60 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs group"
                        >
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${item.colorClass}`}>
                            {item.icon}
                          </span>
                          <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Quick Text Input Box */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={quickInputText}
                        onChange={(e) => setQuickInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickAdd();
                          }
                        }}
                        placeholder="Quickly type a paragraph and press Enter to append..."
                        className="w-full text-xs px-3.5 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:italic focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAdd}
                        disabled={!quickInputText.trim()}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-40"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Render All Content Blocks */}
                  <div className="space-y-3.5">
                    {renderBlocksList()}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: UNIFIED SETTINGS SIDEBAR ─────────────────────── */}
            <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-4">
              <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-4">
                {/* Sidebar Navigation Tabs */}
                <div className="flex items-center border-b border-gray-100 dark:border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('publish')}
                    className={`flex-1 text-center pb-2 -mb-2 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
                      sidebarTab === 'publish'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarTab('seo')}
                    className={`flex-1 text-center pb-2 -mb-2 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
                      sidebarTab === 'seo'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    SEO Optimizer
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarTab('media')}
                    className={`flex-1 text-center pb-2 -mb-2 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
                      sidebarTab === 'media'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Media & Links
                  </button>
                </div>

                {/* TAB 1: PUBLISH & GENERAL */}
                {sidebarTab === 'publish' && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Status
                      </label>
                      <select
                        value={article.status}
                        onChange={(e) => setArticle(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer"
                      >
                        <option value="draft">Draft (Private)</option>
                        <option value="published">Published (Live)</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Author Name
                      </label>
                      <input
                        type="text"
                        value={article.author}
                        onChange={(e) => setArticle(prev => ({ ...prev, author: e.target.value }))}
                        className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Estimated Read Time (Minutes)
                      </label>
                      <input
                        type="number"
                        value={article.readTimeMinutes || 5}
                        onChange={(e) => setArticle(prev => ({ ...prev, readTimeMinutes: Number(e.target.value) || 5 }))}
                        className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
                      <Toggle
                        checked={Boolean(article.featured)}
                        onChange={(v) => setArticle(prev => ({ ...prev, featured: v }))}
                        label="Featured Article"
                        description="Pin prominently in article directories"
                      />
                      <Toggle
                        checked={Boolean(article.seoIndex ?? true)}
                        onChange={(v) => setArticle(prev => ({ ...prev, seoIndex: v }))}
                        label="Search Engine Indexing"
                        description="Allow Google / Bing to index this page"
                      />
                      <Toggle
                        checked={Boolean(article.allowComments ?? true)}
                        onChange={(v) => setArticle(prev => ({ ...prev, allowComments: v }))}
                        label="Allow Comments & Feedback"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSave('published')}
                      disabled={saveStatus === 'saving'}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all cursor-pointer mt-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{article.status === 'published' ? 'Update Published Article' : 'Publish Article Now'}</span>
                    </button>
                  </div>
                )}

                {/* TAB 2: SEO OPTIMIZER */}
                {sidebarTab === 'seo' && (
                  <div className="space-y-3.5">
                    <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl flex items-center justify-between">
                      <div className="text-xs font-bold text-blue-900 dark:text-blue-300">
                        ⚡ Instant Optimizer
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoSeo}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        Run Auto SEO
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Primary Focus Keyword
                      </label>
                      <input
                        type="text"
                        value={article.seo.primaryKeyword}
                        onChange={(e) => setArticle((prev) => ({ ...prev, seo: { ...prev.seo, primaryKeyword: e.target.value } }))}
                        placeholder="e.g. concrete volume"
                        className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                        SEO Meta Title
                      </label>
                      <input
                        type="text"
                        value={article.seo.seoTitle || `${article.title || 'Civil Engineering'} | CivilMath`}
                        onChange={(e) => setArticle((prev) => ({ ...prev, seo: { ...prev.seo, seoTitle: e.target.value } }))}
                        className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                      <div className="text-right text-[10px] text-slate-400 mt-0.5">
                        {(article.seo.seoTitle || '').length}/60 chars
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                        SEO Meta Description
                      </label>
                      <textarea
                        rows={3}
                        value={article.seo.metaDescription || article.excerpt}
                        onChange={(e) => setArticle((prev) => ({ ...prev, seo: { ...prev.seo, metaDescription: e.target.value } }))}
                        className="w-full text-xs p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 resize-none"
                      />
                      <div className="text-right text-[10px] text-slate-400 mt-0.5">
                        {(article.seo.metaDescription || '').length}/160 chars
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Canonical URL
                      </label>
                      <input
                        type="text"
                        value={article.seo.canonicalUrl || `https://civilmath.com/articles/${article.slug}`}
                        onChange={(e) => setArticle((prev) => ({ ...prev, seo: { ...prev.seo, canonicalUrl: e.target.value } }))}
                        className="w-full text-xs font-mono px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: MEDIA & EMBEDS */}
                {sidebarTab === 'media' && (
                  <div className="space-y-3.5">
                    {/* Cover Image */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Cover Image
                      </label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={article.coverImage || ''}
                          onChange={(e) => setArticle(prev => ({ ...prev, coverImage: e.target.value }))}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full text-xs px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Image</span>
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                        </div>
                        {article.coverImage && (
                          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 aspect-video max-h-36 bg-slate-900">
                            <img src={article.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Embed Calculator */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Linked CivilMath Calculator
                      </label>
                      <select
                        value={article.relatedCalculators?.[0]?.calculatorId || 'none'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'none') {
                            setArticle(prev => ({ ...prev, relatedCalculators: [] }));
                          } else {
                            const found = AVAILABLE_CALCULATORS.find(c => c.id === val);
                            if (found) {
                              setArticle(prev => ({
                                ...prev,
                                relatedCalculators: [{ calculatorId: found.id, title: found.name, url: found.url }],
                              }));
                            }
                          }
                        }}
                        className="w-full text-xs font-medium px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer"
                      >
                        <option value="none">-- None --</option>
                        {AVAILABLE_CALCULATORS.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Article Tags
                      </label>
                      <div className="flex gap-1.5 mb-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag(tagInput);
                            }
                          }}
                          placeholder="Add tag and press Enter..."
                          className="flex-1 text-xs px-2.5 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => addTag(tagInput)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(article.tags || []).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                          >
                            <span>#{t}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(t)}
                              className="text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Section Visibility Toggles */}
                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
                      <Toggle
                        checked={Boolean(article.showRelatedCalculators ?? true)}
                        onChange={(v) => setArticle(prev => ({ ...prev, showRelatedCalculators: v }))}
                        label="Show Related Calculators"
                      />
                      <Toggle
                        checked={Boolean(article.showRelatedArticles ?? true)}
                        onChange={(v) => setArticle(prev => ({ ...prev, showRelatedArticles: v }))}
                        label="Show Related Articles"
                      />
                      <Toggle
                        checked={Boolean(article.showFaq ?? true)}
                        onChange={(v) => setArticle(prev => ({ ...prev, showFaq: v }))}
                        label="Show FAQ Accordion"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </AdminLayout>
  );

  // ── Helper: Render Blocks List ────────────────────────────────────────────
  function renderBlocksList() {
    if ((article.blocks || []).length === 0) {
      return (
        <div className="p-10 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#0F172A] space-y-3">
          <FileText className="w-8 h-8 mx-auto text-slate-400" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Content Blocks Added Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click any block type above to add a section, or switch to Quick Markdown to paste complete text.
          </p>
          <button
            type="button"
            onClick={() => handleAddBlock('paragraph')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            + Add First Paragraph
          </button>
        </div>
      );
    }

    return (article.blocks || []).map((block, idx) => {
      const isExpanded = expandedBlocks[block.id] ?? true;

      return (
        <div
          key={block.id}
          className={`border rounded-2xl transition-all shadow-2xs ${
            block.visibility === false
              ? 'border-gray-200 dark:border-slate-800 opacity-60 bg-gray-50/50'
              : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]'
          }`}
        >
          {/* Block Header */}
          <div className="p-3 flex items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800/80 bg-gray-50/80 dark:bg-slate-900/60 rounded-t-2xl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 uppercase shrink-0">
                {block.type.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {block.title || block.content?.slice(0, 45) || `Block #${idx + 1}`}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleMoveBlock(idx, 'up')}
                disabled={idx === 0}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                title="Move Up"
              >
                <MoveUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveBlock(idx, 'down')}
                disabled={idx === (article.blocks?.length || 0) - 1}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                title="Move Down"
              >
                <MoveDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDuplicateBlock(block.id)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                title="Duplicate Block"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => toggleBlockVisibility(block.id)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                title="Toggle Visibility"
              >
                {block.visibility === false ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBlock(block.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                title="Delete Block"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => toggleExpandBlock(block.id)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Block Body Content */}
          {isExpanded && (
            <div className="p-4 space-y-3">
              {/* ── PARAGRAPH ── */}
              {block.type === 'paragraph' && (
                <div>
                  <textarea
                    ref={(el) => { if (el) lastActiveTextareaRef.current = el; }}
                    rows={4}
                    value={block.content || ''}
                    onChange={(e) => updateBlockContent(block.id, e.target.value)}
                    placeholder="Enter paragraph text (Markdown formatting supported)..."
                    className="w-full text-xs sm:text-sm p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 resize-none outline-none focus:border-blue-500 leading-relaxed"
                  />
                  <div className="text-right text-[10px] text-slate-400 mt-1">
                    {(block.content || '').length} characters
                  </div>
                </div>
              )}

              {/* ── HEADING 2 ── */}
              {block.type === 'heading_2' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Section Heading (H2)
                    </label>
                    <input
                      type="text"
                      value={block.title || ''}
                      onChange={(e) => updateBlockTitle(block.id, e.target.value)}
                      placeholder="e.g. Design Considerations & Load Combinations"
                      className="w-full text-sm font-bold p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Introductory Explanation
                    </label>
                    <textarea
                      ref={(el) => { if (el) lastActiveTextareaRef.current = el; }}
                      rows={3}
                      value={block.content || ''}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      placeholder="Introductory text under this section..."
                      className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 resize-none outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* ── FORMULA (LATEX) ── */}
              {block.type === 'formula' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Formula Title
                      </label>
                      <input
                        type="text"
                        value={block.data?.title || block.title || ''}
                        onChange={(e) => {
                          updateBlockTitle(block.id, e.target.value);
                          updateBlockData(block.id, { title: e.target.value });
                        }}
                        placeholder="e.g. Bending Moment Formula"
                        className="w-full text-xs font-bold p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        LaTeX Equation
                      </label>
                      <input
                        type="text"
                        value={block.data?.equation || ''}
                        onChange={(e) => updateBlockData(block.id, { equation: e.target.value })}
                        placeholder="V = L \times W \times H"
                        className="w-full text-xs font-mono font-bold p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-blue-600 dark:text-blue-400"
                      />
                    </div>
                  </div>

                  {/* KaTeX Live Math Preview */}
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-center">
                    <div className="text-[10px] uppercase font-bold text-blue-500 mb-1">Rendered Math Preview</div>
                    <MathFormula equation={block.data?.equation || 'V = L \\times W \\times H'} />
                  </div>

                  {/* Variables */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      <span>Equation Variables</span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentVars = block.data?.variables || [];
                          updateBlockData(block.id, {
                            variables: [...currentVars, { symbol: 'X', meaning: 'Parameter explanation' }],
                          });
                        }}
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        + Add Variable
                      </button>
                    </div>
                    {(block.data?.variables || []).map((v: any, vIdx: number) => (
                      <div key={vIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={v.symbol}
                          onChange={(e) => {
                            const vars = [...(block.data?.variables || [])];
                            vars[vIdx] = { ...vars[vIdx], symbol: e.target.value };
                            updateBlockData(block.id, { variables: vars });
                          }}
                          placeholder="Symbol"
                          className="w-20 text-xs font-mono font-bold p-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md"
                        />
                        <input
                          type="text"
                          value={v.meaning}
                          onChange={(e) => {
                            const vars = [...(block.data?.variables || [])];
                            vars[vIdx] = { ...vars[vIdx], meaning: e.target.value };
                            updateBlockData(block.id, { variables: vars });
                          }}
                          placeholder="Meaning (e.g. Concrete volume in m³)"
                          className="flex-1 text-xs p-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const vars = (block.data?.variables || []).filter((_: any, idx2: number) => idx2 !== vIdx);
                            updateBlockData(block.id, { variables: vars });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP BY STEP ── */}
              {block.type === 'step_by_step' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={block.data?.title || block.title || ''}
                      onChange={(e) => {
                        updateBlockTitle(block.id, e.target.value);
                        updateBlockData(block.id, { title: e.target.value });
                      }}
                      placeholder="Step by Step Procedure"
                      className="w-full text-xs font-bold p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      <span>Procedure Steps</span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentSteps = block.data?.steps || [];
                          const nextNum = currentSteps.length + 1;
                          updateBlockData(block.id, {
                            steps: [
                              ...currentSteps,
                              { stepNumber: nextNum, title: `Step ${nextNum} instruction`, description: '' },
                            ],
                          });
                        }}
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        + Add Step
                      </button>
                    </div>

                    {(block.data?.steps || []).map((st: any, sIdx: number) => (
                      <div key={sIdx} className="flex items-start gap-2 p-2.5 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-800">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-1">
                          {sIdx + 1}
                        </span>
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            value={st.title}
                            onChange={(e) => {
                              const steps = [...(block.data?.steps || [])];
                              steps[sIdx] = { ...steps[sIdx], title: e.target.value };
                              updateBlockData(block.id, { steps });
                            }}
                            placeholder="Step summary"
                            className="w-full text-xs font-semibold p-1 bg-transparent border-b border-gray-200 dark:border-slate-700 outline-none"
                          />
                          <textarea
                            rows={2}
                            value={st.description || ''}
                            onChange={(e) => {
                              const steps = [...(block.data?.steps || [])];
                              steps[sIdx] = { ...steps[sIdx], description: e.target.value };
                              updateBlockData(block.id, { steps });
                            }}
                            placeholder="Detailed step instruction..."
                            className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const steps = (block.data?.steps || []).filter((_: any, idx3: number) => idx3 !== sIdx);
                            updateBlockData(block.id, { steps });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CALCULATOR EMBED ── */}
              {block.type === 'calculator_embed' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Choose Calculator to Embed
                    </label>
                    <select
                      value={block.data?.calculatorId || 'concrete-volume'}
                      onChange={(e) => updateBlockData(block.id, { calculatorId: e.target.value })}
                      className="w-full text-xs font-medium px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer"
                    >
                      {AVAILABLE_CALCULATORS.map((calc) => (
                        <option key={calc.id} value={calc.id}>
                          {calc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Calculator Simulation Preview for concrete-volume */}
                  {block.data?.calculatorId === 'concrete-volume' && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-3">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                          Live Calculator Preview
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">Length (m)</label>
                          <input
                            type="number"
                            value={calcLength}
                            onChange={(e) => setCalcLength(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs font-bold p-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 rounded-md outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">Width (m)</label>
                          <input
                            type="number"
                            value={calcWidth}
                            onChange={(e) => setCalcWidth(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs font-bold p-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 rounded-md outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">Height (m)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={calcHeight}
                            onChange={(e) => setCalcHeight(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs font-bold p-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 rounded-md outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCalculate}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Test Calculation</span>
                      </button>
                      {calculatedVolume !== null && (
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-center text-xs font-bold text-slate-900 dark:text-white border border-emerald-200 dark:border-emerald-800">
                          Volume: <span className="text-blue-600 dark:text-blue-400 font-mono text-sm">{calculatedVolume} m³</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── WARNING / NOTICE ── */}
              {block.type === 'warning' && (
                <div className="space-y-2 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase mb-1">
                      Notice Title
                    </label>
                    <input
                      type="text"
                      value={block.data?.title || block.title || ''}
                      onChange={(e) => {
                        updateBlockTitle(block.id, e.target.value);
                        updateBlockData(block.id, { title: e.target.value });
                      }}
                      placeholder="Engineering Verification Notice"
                      className="w-full text-xs font-bold p-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase mb-1">
                      Notice Message
                    </label>
                    <textarea
                      rows={3}
                      value={block.data?.message || block.content || ''}
                      onChange={(e) => {
                        updateBlockContent(block.id, e.target.value);
                        updateBlockData(block.id, { message: e.target.value });
                      }}
                      placeholder="Enter verification guidelines or code disclaimers..."
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ── ENGINEERING NOTE ── */}
              {block.type === 'engineering_note' && (
                <div className="space-y-2 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
                  <div>
                    <label className="block text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase mb-1">
                      Note Title
                    </label>
                    <input
                      type="text"
                      value={block.data?.title || block.title || ''}
                      onChange={(e) => {
                        updateBlockTitle(block.id, e.target.value);
                        updateBlockData(block.id, { title: e.target.value });
                      }}
                      className="w-full text-xs font-bold p-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase mb-1">
                      Note Content
                    </label>
                    <textarea
                      rows={2}
                      value={block.data?.note || block.content || ''}
                      onChange={(e) => updateBlockData(block.id, { note: e.target.value })}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg resize-none"
                    />
                  </div>
                </div>
              )}

              {/* ── KEY TAKEAWAYS ── */}
              {block.type === 'key_takeaway' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    <span>Key Points</span>
                    <button
                      type="button"
                      onClick={() => {
                        const items = block.data?.items || [];
                        updateBlockData(block.id, { items: [...items, 'New critical takeaway point'] });
                      }}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      + Add Point
                    </button>
                  </div>
                  {(block.data?.items || []).map((it: string, itIdx: number) => (
                    <div key={itIdx} className="flex items-center gap-2">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <input
                        type="text"
                        value={it}
                        onChange={(e) => {
                          const items = [...(block.data?.items || [])];
                          items[itIdx] = e.target.value;
                          updateBlockData(block.id, { items });
                        }}
                        className="flex-1 text-xs p-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const items = (block.data?.items || []).filter((_: any, i: number) => i !== itIdx);
                          updateBlockData(block.id, { items });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── TABLE ── */}
              {block.type === 'table' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Table Caption / Title
                    </label>
                    <input
                      type="text"
                      value={block.data?.title || block.data?.caption || ''}
                      onChange={(e) => updateBlockData(block.id, { title: e.target.value, caption: e.target.value })}
                      className="w-full text-xs font-bold p-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md"
                    />
                  </div>
                  <div className="overflow-x-auto max-w-full border border-gray-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-slate-800">
                          {(block.data?.headers || []).map((h: string, hIdx: number) => (
                            <th key={hIdx} className="p-1.5 border-r border-gray-200 dark:border-slate-700">
                              <input
                                type="text"
                                value={h}
                                onChange={(e) => {
                                  const headers = [...(block.data?.headers || [])];
                                  headers[hIdx] = e.target.value;
                                  updateBlockData(block.id, { headers });
                                }}
                                className="w-full font-bold bg-transparent outline-none p-1 text-xs"
                              />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(block.data?.rows || []).map((row: string[], rIdx: number) => (
                          <tr key={rIdx} className="border-t border-gray-200 dark:border-slate-700">
                            {row.map((cell: string, cIdx: number) => (
                              <td key={cIdx} className="p-1.5 border-r border-gray-200 dark:border-slate-700">
                                <input
                                  type="text"
                                  value={cell}
                                  onChange={(e) => {
                                    const rows = [...(block.data?.rows || [])];
                                    rows[rIdx] = [...rows[rIdx]];
                                    rows[rIdx][cIdx] = e.target.value;
                                    updateBlockData(block.id, { rows });
                                  }}
                                  className="w-full bg-transparent outline-none p-1 text-xs"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const headers = [...(block.data?.headers || ['Col 1', 'Col 2']), `Col ${(block.data?.headers?.length || 2) + 1}`];
                        const rows = (block.data?.rows || []).map((r: string[]) => [...r, '-']);
                        updateBlockData(block.id, { headers, rows });
                      }}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 rounded-md font-semibold text-blue-600 cursor-pointer"
                    >
                      + Add Column
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const colCount = block.data?.headers?.length || 3;
                        const newRow = Array(colCount).fill('Sample');
                        const rows = [...(block.data?.rows || []), newRow];
                        updateBlockData(block.id, { rows });
                      }}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 rounded-md font-semibold text-blue-600 cursor-pointer"
                    >
                      + Add Row
                    </button>
                  </div>
                </div>
              )}

              {/* ── IMAGE ── */}
              {block.type === 'image' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={block.data?.url || ''}
                      onChange={(e) => updateBlockData(block.id, { url: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full text-xs p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Caption
                    </label>
                    <input
                      type="text"
                      value={block.data?.caption || ''}
                      onChange={(e) => updateBlockData(block.id, { caption: e.target.value })}
                      placeholder="Figure 1: Measurement profile..."
                      className="w-full text-xs p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  {block.data?.url && (
                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 max-h-48 aspect-video bg-slate-900">
                      <img src={block.data.url} alt="Block preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              {/* ── FAQ ── */}
              {block.type === 'faq' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    <span>Questions & Answers</span>
                    <button
                      type="button"
                      onClick={() => {
                        const faqs = [...(block.data?.faqs || []), { question: 'New engineering question?', answer: 'Detailed explanation...' }];
                        updateBlockData(block.id, { faqs });
                      }}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      + Add Question
                    </button>
                  </div>
                  {(block.data?.faqs || []).map((faq: any, fIdx: number) => (
                    <div key={fIdx} className="p-3 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const faqs = [...(block.data?.faqs || [])];
                            faqs[fIdx] = { ...faqs[fIdx], question: e.target.value };
                            updateBlockData(block.id, { faqs });
                          }}
                          placeholder="Question"
                          className="flex-1 text-xs font-bold bg-transparent outline-none border-b border-gray-200 dark:border-slate-700 pb-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const faqs = (block.data?.faqs || []).filter((_: any, i: number) => i !== fIdx);
                            updateBlockData(block.id, { faqs });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const faqs = [...(block.data?.faqs || [])];
                          faqs[fIdx] = { ...faqs[fIdx], answer: e.target.value };
                          updateBlockData(block.id, { faqs });
                        }}
                        placeholder="Detailed technical explanation..."
                        className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* ── CODE BLOCK ── */}
              {block.type === 'code_block' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Code Snippet</label>
                    <input
                      type="text"
                      value={block.data?.language || 'python'}
                      onChange={(e) => updateBlockData(block.id, { language: e.target.value })}
                      placeholder="Language"
                      className="text-xs font-mono px-2 py-0.5 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700"
                    />
                  </div>
                  <textarea
                    rows={4}
                    value={block.content || block.data?.code || ''}
                    onChange={(e) => {
                      updateBlockContent(block.id, e.target.value);
                      updateBlockData(block.id, { code: e.target.value });
                    }}
                    placeholder="# Calculation script or snippet..."
                    className="w-full text-xs font-mono p-3 bg-slate-900 text-slate-100 rounded-xl resize-none outline-none leading-relaxed"
                  />
                </div>
              )}

              {/* ── QUOTE ── */}
              {block.type === 'quote' && (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={block.data?.quote || block.content || ''}
                    onChange={(e) => updateBlockData(block.id, { quote: e.target.value })}
                    placeholder="Enter standard quote text..."
                    className="w-full text-xs italic p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl resize-none"
                  />
                  <input
                    type="text"
                    value={block.data?.author || ''}
                    onChange={(e) => updateBlockData(block.id, { author: e.target.value })}
                    placeholder="Quote Author / Standard Reference (e.g. BS EN 1992-1-1)"
                    className="w-full text-xs p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      );
    });
  }
}
