import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  ChangeEvent,
} from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Save, Eye, ArrowLeft, Send, Sparkles, RefreshCw, Check,
  Link as LinkIcon, Image as ImageIcon, Trash2, Copy, Plus,
  FileText, Clock, HelpCircle, Code, AlignLeft,
  ChevronDown, ChevronUp, Monitor, Tablet, Smartphone, Calculator,
  Compass, Table as TableIcon, Layers, AlertTriangle, Lightbulb,
  Info, BookOpen, Quote, Shield, CheckCircle2, ChevronRight,
  ExternalLink, Upload, X, Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Maximize2, Loader2, MoveUp, MoveDown, EyeOff,
  Columns, CheckSquare, CornerDownLeft, Sparkle
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
  TwoColumnBlockData,
  legacyArticleToBlocks,
} from '../../types/article';
import {
  getArticleBySlug,
  saveArticle,
  uploadArticleImage,
  getAllArticleSummaries,
} from '../../utils/articleStore';
import { autoGenerateSeo, auditArticleSeo, slugify } from '../../utils/autoSeo';
import MathFormula from '../../components/article/MathFormula';
import ArticleRenderer from '../../components/article/ArticleRenderer';
import CalculationCard from '../../components/article/CalculationCard';

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

// ─── Toggle Switch Component ────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 cursor-pointer select-none">
      {label && <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{label}</span>}
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

// ─── Default Sample Article ─────────────────────────────────────────────────
const DEFAULT_CONCRETE_ARTICLE: Article = {
  slug: 'how-to-calculate-concrete-volume',
  title: 'How to Calculate Concrete Volume',
  h1: 'How to Calculate Concrete Volume',
  excerpt: 'Learn how to calculate concrete volume with formula, step-by-step method, example and use our free online calculator.',
  category: 'concrete',
  author: 'CivilMath Team',
  publishedAt: '2026-09-27T00:00:00.000Z',
  readTimeMinutes: 8,
  status: 'draft',
  featured: true,
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
    metaDescription: 'Learn how to calculate concrete volume with formula, step-by-step method, example and free online calculator.',
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
      title: 'Introduction',
      content: 'Concrete volume is the total amount of concrete required for a structure. It is an essential calculation in construction for estimation, cost control and material planning.',
    },
    {
      id: 'blk_formula_vol',
      type: 'formula',
      order: 1,
      visibility: true,
      title: 'Concrete Volume Formula',
      data: {
        title: 'Concrete Volume Formula',
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
      title: 'Step by Step Method',
      data: {
        title: 'Step by Step Method',
        steps: [
          { stepNumber: 1, title: 'Identify the structure and dimensions', description: 'Measure clear length, width, and depth.' },
          { stepNumber: 2, title: 'Convert all dimensions to metres', description: 'Ensure millimeter/inch measurements are converted to meters.' },
          { stepNumber: 3, title: 'Use the formula V = L × W × H', description: 'Multiply all 3 orthogonal dimensions.' },
          { stepNumber: 4, title: 'Calculate the volume', description: 'Obtain theoretical neat volume.' },
          { stepNumber: 5, title: 'Add wastage if required (2% – 5%)', description: 'Account for spillage and foundation unevenness.' },
        ],
      } as StepByStepBlockData,
    },
    {
      id: 'blk_calculator',
      type: 'calculator_embed',
      order: 3,
      visibility: true,
      title: 'Concrete Volume Calculator',
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
      title: 'Engineering Verification Required',
      data: {
        title: 'Engineering Verification Required',
        message: 'The calculated quantity represents theoretical neat volume. Actual ordering must account for project site wastage, pumping losses, and approved construction drawings.',
        severity: 'warning',
      } as WarningBlockData,
    },
  ],
};

// ─── Add Block Types Palette ────────────────────────────────────────────────
interface PaletteItem {
  type: ArticleBlockType;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'paragraph', label: 'Paragraph', icon: <span className="font-bold text-xs">T</span>, colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  { type: 'heading_2', label: 'Heading', icon: <span className="font-bold text-xs">H</span>, colorClass: 'text-blue-700 bg-blue-100/60 dark:bg-blue-900/40' },
  { type: 'image', label: 'Image', icon: <ImageIcon className="w-3.5 h-3.5" />, colorClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  { type: 'table', label: 'Table', icon: <TableIcon className="w-3.5 h-3.5" />, colorClass: 'text-slate-700 bg-slate-100 dark:bg-slate-800' },
  { type: 'formula', label: 'Formula', icon: <span className="font-serif italic font-bold text-xs">fx</span>, colorClass: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
  { type: 'calculator_embed', label: 'Calculator', icon: <Calculator className="w-3.5 h-3.5" />, colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  { type: 'diagram', label: 'Diagram', icon: <Compass className="w-3.5 h-3.5" />, colorClass: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40' },
  { type: 'step_by_step', label: 'Step by Step', icon: <ListOrdered className="w-3.5 h-3.5" />, colorClass: 'text-slate-800 bg-slate-100 dark:bg-slate-800' },
  { type: 'key_takeaway', label: 'Key Point', icon: <Lightbulb className="w-3.5 h-3.5" />, colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
  { type: 'engineering_note', label: 'Note', icon: <Info className="w-3.5 h-3.5" />, colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
  { type: 'calculation_example', label: 'Example', icon: <BookOpen className="w-3.5 h-3.5" />, colorClass: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
  { type: 'warning', label: 'Warning', icon: <AlertTriangle className="w-3.5 h-3.5" />, colorClass: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
  { type: 'faq', label: 'FAQ', icon: <HelpCircle className="w-3.5 h-3.5" />, colorClass: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
  { type: 'code_block', label: 'Code Block', icon: <Code className="w-3.5 h-3.5" />, colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
  { type: 'quote', label: 'Quote', icon: <Quote className="w-3.5 h-3.5" />, colorClass: 'text-slate-700 bg-slate-100 dark:bg-slate-800' },
  { type: 'related_article', label: 'Related Articles', icon: <LinkIcon className="w-3.5 h-3.5" />, colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
];

export default function AdminArticleEditorV2() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(slug);

  // ── Article State ──────────────────────────────────────────────────────────
  const [article, setArticle] = useState<Article>(() => DEFAULT_CONCRETE_ARTICLE);
  const [loading, setLoading] = useState(isEditing);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pane 1 tabs
  const [pane1Tab, setPane1Tab] = useState<'content' | 'seo' | 'settings'>('content');

  // Pane 3 tabs & device
  const [previewTab, setPreviewTab] = useState<'preview' | 'editor'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Interactive Calculator State
  const [calcLength, setCalcLength] = useState<number>(5);
  const [calcWidth, setCalcWidth] = useState<number>(3);
  const [calcHeight, setCalcHeight] = useState<number>(0.15);
  const [calculatedVolume, setCalculatedVolume] = useState<number | null>(2.25);

  // Quick content input
  const [quickInputText, setQuickInputText] = useState('');

  // Expanded blocks map
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({
    blk_h2_intro: true,
    blk_formula_vol: true,
    blk_step_by_step: true,
    blk_calculator: true,
    blk_warning: true,
  });

  // Tag input state
  const [tagInput, setTagInput] = useState('');

  // Dropdown for Paragraph toolbar
  const [paragraphMenuOpen, setParagraphMenuOpen] = useState(false);

  // Active focused textarea ref for toolbar formatting
  const lastActiveTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load article if editing
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
          } else {
            navigate('/admin/articles');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [slug, isEditing, navigate]);

  // Handle calculator execution
  const handleCalculate = () => {
    const vol = calcLength * calcWidth * calcHeight;
    setCalculatedVolume(Number(vol.toFixed(3)));
  };

  // Tag management
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

  // Add block from palette
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
          content: 'Add an informative section heading and technical discussion here...',
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
            title: 'Engineering Formula',
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
            title: 'Step by Step Method',
            steps: [
              { stepNumber: 1, title: 'Step 1: Determine initial parameters', description: 'Inspect site drawings and specifications.' },
              { stepNumber: 2, title: 'Step 2: Execute calculation', description: 'Apply verified formula.' },
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
          title: 'Concrete Volume Calculator',
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
          title: 'Safety Warning',
          data: {
            title: 'Safety Warning',
            message: 'All calculations must be verified by a registered civil/structural engineer prior to casting.',
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
          title: 'Engineering Practice Note',
          data: {
            title: 'Engineering Practice Note',
            note: 'Always convert all linear dimensions into consistent SI units (metres) before volumetric multiplication.',
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
              'Verify dimensions on Approved for Construction drawings.',
              'Apply 1.54 multiplier when calculating dry ingredients.',
              'Account for 3-5% pouring and spillage wastage.',
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
          title: 'Engineering Properties Table',
          data: {
            title: 'Engineering Properties Table',
            headers: ['Grade', 'Mix Ratio', 'Characteristic Strength (MPa)', 'Applications'],
            rows: [
              ['M15', '1 : 2 : 4', '15 MPa', 'PCC, Plain Footing Bed'],
              ['M20', '1 : 1.5 : 3', '20 MPa', 'General RCC, Slabs, Beams'],
              ['M25', '1 : 1 : 2', '25 MPa', 'Heavy Columns, Water Retaining'],
            ],
            caption: 'Table 1: Standard Concrete Nominal Mixes',
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
            alt: 'Foundation excavation and rebar cage layout',
            caption: 'Figure 1: Measurement profile for foundation casting',
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
              { question: 'What is the dry volume factor in concrete?', answer: 'The dry volume factor 1.54 compensates for voids between dry cement, sand, and stone.' },
              { question: 'How much wastage should be added for ready-mix pumping?', answer: 'Usually 3% to 5% depending on pump line length and site layout.' },
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
          title: 'Standard of Care Quote',
          data: {
            quote: 'Structural safety and durability depend on precise estimation and adherence to code standards.',
            author: 'ACI Concrete Field Guide',
          } as QuoteBlockData,
        };
        break;
      default:
        newBlock = {
          id: newId,
          type: 'paragraph',
          order: newOrder,
          visibility: true,
          content: 'Enter technical guidelines, material properties, or site notes here...',
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

  // Block actions
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
    // update order
    blocks.forEach((b, i) => { b.order = i; });
    setArticle((prev) => ({ ...prev, blocks }));
  };

  const toggleBlockVisibility = (blockId: string) => {
    setArticle((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).map((b) =>
        b.id === blockId ? { ...b, visibility: b.visibility === false ? true : false } : b
      ),
    }));
  };

  const toggleExpandBlock = (blockId: string) => {
    setExpandedBlocks((prev) => ({
      ...prev,
      [blockId]: !prev[blockId],
    }));
  };

  // Update block content helper
  const updateBlockContent = (blockId: string, content: string) => {
    setArticle((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).map((b) =>
        b.id === blockId ? { ...b, content } : b
      ),
    }));
  };

  // Update block title helper
  const updateBlockTitle = (blockId: string, title: string) => {
    setArticle((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).map((b) =>
        b.id === blockId ? { ...b, title, data: b.data ? { ...b.data, title } : b.data } : b
      ),
    }));
  };

  // Update block data helper
  const updateBlockData = (blockId: string, dataPatch: any) => {
    setArticle((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).map((b) =>
        b.id === blockId ? { ...b, data: { ...(b.data || {}), ...dataPatch } } : b
      ),
    }));
  };

  // Quick add from prompt
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

  // Formatting toolbar action
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

  // Save handler
  const handleSave = async (status: 'draft' | 'published') => {
    try {
      setSaveStatus('saving');
      const toSave: Article = {
        ...article,
        status,
        updatedAt: new Date().toISOString(),
      };
      await saveArticle(toSave);
      setArticle(toSave);
      setSaveStatus('saved');
      showToast(status === 'published' ? '🎉 Article published successfully!' : '💾 Draft saved successfully!');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      showToast('❌ Error saving article');
    }
  };

  // Run auto SEO
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
    showToast('⚡ Auto SEO keywords and meta tags generated!');
  };

  // Cover image change
  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadArticleImage(file);
      setArticle((prev) => ({ ...prev, coverImage: url }));
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
      <div className="w-full space-y-4">
        {/* Floating Toast notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ── TOP PAGE HEADER ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                {isEditing ? `Edit: ${article.title}` : 'Add New Article'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Create high-quality engineering content with diagrams, formulas and calculators.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Save Draft */}
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={saveStatus === 'saving'}
              className="px-3.5 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Save Draft</span>
            </button>

            {/* Preview */}
            <button
              type="button"
              onClick={() => {
                if (article.slug) {
                  window.open(`/articles/${article.slug}`, '_blank');
                }
              }}
              className="px-3.5 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview</span>
            </button>

            {/* Publish Button */}
            <button
              type="button"
              onClick={() => handleSave('published')}
              disabled={saveStatus === 'saving'}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-600/30 transition-all cursor-pointer"
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saveStatus === 'saved' ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Publish</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>

        {/* ── 4-PANE MULTI-COLUMN WORKSPACE ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 xl:gap-5 items-start">
          
          {/* ══════════════════════════════════════════════════════════════════
              PANE 1: METADATA & ARTICLE SETTINGS
          ══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-2xs">
            {/* Top Tabs */}
            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-slate-800/80 pb-2">
              <button
                type="button"
                onClick={() => setPane1Tab('content')}
                className={`text-xs font-bold pb-2 -mb-2 border-b-2 transition-colors cursor-pointer ${
                  pane1Tab === 'content'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Content
              </button>
              <button
                type="button"
                onClick={() => setPane1Tab('seo')}
                className={`text-xs font-bold pb-2 -mb-2 border-b-2 transition-colors cursor-pointer ${
                  pane1Tab === 'seo'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                SEO
              </button>
              <button
                type="button"
                onClick={() => setPane1Tab('settings')}
                className={`text-xs font-bold pb-2 -mb-2 border-b-2 transition-colors cursor-pointer ${
                  pane1Tab === 'settings'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Settings
              </button>
            </div>

            {/* TAB CONTENT: Content */}
            {pane1Tab === 'content' && (
              <div className="space-y-3.5">
                {/* Article Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Article Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={article.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setArticle((prev) => ({
                        ...prev,
                        title: val,
                        slug: prev.slug || slugify(val),
                      }));
                    }}
                    placeholder="e.g. How to Calculate Concrete Volume"
                    className="w-full text-xs font-semibold px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* URL Slug */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    URL Slug <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <LinkIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={article.slug}
                        onChange={(e) => setArticle((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                        className="w-full text-xs font-mono pl-8 pr-2 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setArticle((prev) => ({ ...prev, slug: slugify(prev.title) }))}
                      className="px-2.5 py-2 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      Short Description (Excerpt)
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={article.excerpt}
                    onChange={(e) => setArticle((prev) => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Short summary of the article..."
                    className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                  <div className="text-right text-[10px] text-slate-400 font-mono mt-0.5">
                    {article.excerpt?.length || 0}/160 characters
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Cover Image
                  </label>
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-900 group">
                    {article.coverImage ? (
                      <img
                        src={article.coverImage}
                        alt="Article Cover Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                        <span className="text-[11px]">No cover image uploaded</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-1.5 px-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Change Image</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    {article.coverImage && (
                      <button
                        type="button"
                        onClick={() => setArticle((prev) => ({ ...prev, coverImage: '' }))}
                        className="py-1.5 px-3 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100/60 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={article.category}
                    onChange={(e) => setArticle((prev) => ({ ...prev, category: e.target.value as ArticleCategory }))}
                    className="w-full text-xs font-medium px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Tags (comma separated)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg min-h-[38px]">
                    {(article.tags || []).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-md text-[11px] font-medium"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          className="text-slate-400 hover:text-rose-500 leading-none cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                      placeholder="Add tag..."
                      className="flex-1 min-w-[80px] bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                </div>

                {/* Author */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Author
                  </label>
                  <select
                    value={article.author}
                    onChange={(e) => setArticle((prev) => ({ ...prev, author: e.target.value }))}
                    className="w-full text-xs font-medium px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="CivilMath Team">CivilMath Team</option>
                    <option value="CivilMath Engineering Lead">CivilMath Engineering Lead</option>
                    <option value="Guest Author">Guest Author</option>
                  </select>
                </div>

                {/* Reading Time */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Reading Time (auto)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{article.readTimeMinutes || 8} min</span>
                  </span>
                </div>

                {/* Featured Article */}
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                  <Toggle
                    checked={Boolean(article.featured)}
                    onChange={(v) => setArticle((prev) => ({ ...prev, featured: v }))}
                    label="Featured Article"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: SEO */}
            {pane1Tab === 'seo' && (
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
                    Focus Keyword
                  </label>
                  <input
                    type="text"
                    value={article.seo.primaryKeyword}
                    onChange={(e) => setArticle((prev) => ({ ...prev, seo: { ...prev.seo, primaryKeyword: e.target.value } }))}
                    className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Secondary Keywords
                  </label>
                  <input
                    type="text"
                    value={(article.seo.secondaryKeywords || []).join(', ')}
                    onChange={(e) => setArticle((prev) => ({ ...prev, seo: { ...prev.seo, secondaryKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))}
                    className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Canonical URL
                  </label>
                  <input
                    type="text"
                    value={article.seo.canonicalUrl || `https://civilmath.com/articles/${article.slug}`}
                    onChange={(e) => setArticle((prev) => ({ ...prev, seo: { ...prev.seo, canonicalUrl: e.target.value } }))}
                    className="w-full text-xs font-mono px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: Settings */}
            {pane1Tab === 'settings' && (
              <div className="space-y-3">
                <Toggle
                  checked={Boolean(article.allowComments ?? true)}
                  onChange={(v) => setArticle((prev) => ({ ...prev, allowComments: v }))}
                  label="Allow Comments"
                />
                <Toggle
                  checked={Boolean(article.seoIndex ?? true)}
                  onChange={(v) => setArticle((prev) => ({ ...prev, seoIndex: v }))}
                  label="SEO Indexable"
                />
                <Toggle
                  checked={Boolean(article.showAuthor ?? true)}
                  onChange={(v) => setArticle((prev) => ({ ...prev, showAuthor: v }))}
                  label="Show Author Box"
                />
                <Toggle
                  checked={Boolean(article.showRelatedArticles ?? true)}
                  onChange={(v) => setArticle((prev) => ({ ...prev, showRelatedArticles: v }))}
                  label="Show Related Articles"
                />
                <Toggle
                  checked={Boolean(article.showRelatedCalculators ?? true)}
                  onChange={(v) => setArticle((prev) => ({ ...prev, showRelatedCalculators: v }))}
                  label="Show Related Calculators"
                />
                <Toggle
                  checked={Boolean(article.showFaq ?? true)}
                  onChange={(v) => setArticle((prev) => ({ ...prev, showFaq: v }))}
                  label="Show FAQ Section"
                />
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              PANE 2: CONTENT BUILDER PANE
          ══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-2xs">
            {/* Formatting Toolbar at Top */}
            <div className="flex flex-wrap items-center gap-1 pb-3 border-b border-gray-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 relative">
              {/* Paragraph menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setParagraphMenuOpen(!paragraphMenuOpen)}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-md text-xs font-semibold cursor-pointer"
                >
                  <span>Paragraph</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {paragraphMenuOpen && (
                  <div className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-[#101E33] border border-gray-200 dark:border-[#1E3050] rounded-xl shadow-xl p-1 z-30 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => { handleAddBlock('paragraph'); setParagraphMenuOpen(false); }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Paragraph
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleAddBlock('heading_2'); setParagraphMenuOpen(false); }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Heading 2 (H2)
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleAddBlock('quote'); setParagraphMenuOpen(false); }}
                      className="w-full text-left px-2.5 py-1.5 text-xs italic text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Quote
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleAddBlock('code_block'); setParagraphMenuOpen(false); }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Code Block
                    </button>
                  </div>
                )}
              </div>

              <span className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1" />

              <button type="button" onClick={() => applyFormatting('bold')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => applyFormatting('italic')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => applyFormatting('underline')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Underline"><Underline className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => applyFormatting('strike')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></button>

              <span className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1" />

              <button type="button" onClick={() => applyFormatting('bullet')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => applyFormatting('number')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>

              <span className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1" />

              <button type="button" onClick={() => applyFormatting('link')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Insert Link"><LinkIcon className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => applyFormatting('quote')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Quote"><Quote className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => applyFormatting('code')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Code"><Code className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => handleAddBlock('table')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Insert Table"><TableIcon className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => handleAddBlock('image')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Insert Image"><ImageIcon className="w-3.5 h-3.5" /></button>
            </div>

            {/* Quick content input box */}
            <div className="relative flex items-center gap-2">
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
                placeholder="Write your content here, press Enter to append..."
                className="w-full text-xs px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:italic focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={!quickInputText.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-40"
              >
                + Add
              </button>
            </div>

            {/* Layout with vertical palette on left + content canvas on right */}
            <div className="flex gap-3">
              {/* Palette: + Add Block */}
              <div className="w-32 shrink-0 space-y-1">
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Add Block</span>
                </div>
                <div className="space-y-0.5">
                  {PALETTE_ITEMS.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleAddBlock(item.type)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${item.colorClass}`}>
                        {item.icon}
                      </div>
                      <span className="truncate group-hover:text-blue-600 transition-colors text-[11px]">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Block Canvas Stack */}
              <div className="flex-1 space-y-3 min-w-0 max-h-[800px] overflow-y-auto pr-1">
                {(article.blocks || []).length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                    No blocks added yet. Click any block in the palette to start.
                  </div>
                ) : (
                  (article.blocks || []).map((block, idx) => {
                    const isExpanded = expandedBlocks[block.id] ?? true;

                    return (
                      <div
                        key={block.id}
                        className={`border rounded-xl transition-all shadow-2xs ${
                          block.visibility === false
                            ? 'border-gray-200 dark:border-slate-800 opacity-60 bg-gray-50/50'
                            : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111A2E]'
                        }`}
                      >
                        {/* Block Header */}
                        <div className="p-2.5 flex items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800/80 bg-gray-50/60 dark:bg-slate-900/40 rounded-t-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 uppercase shrink-0">
                              {block.type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {block.title || block.content?.slice(0, 35) || 'Block'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                              title="Move Up"
                            >
                              <MoveUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(idx, 'down')}
                              disabled={idx === (article.blocks?.length || 0) - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                              title="Move Down"
                            >
                              <MoveDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                              title="Duplicate"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleBlockVisibility(block.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                              title="Toggle Visibility"
                            >
                              {block.visibility === false ? <EyeOff className="w-3 h-3 text-amber-500" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleExpandBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Block Body */}
                        {isExpanded && (
                          <div className="p-3 space-y-3">
                            {/* ── PARAGRAPH BLOCK ── */}
                            {block.type === 'paragraph' && (
                              <div>
                                <textarea
                                  ref={(el) => { if (el) lastActiveTextareaRef.current = el; }}
                                  rows={4}
                                  value={block.content || ''}
                                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                  placeholder="Enter paragraph text (Markdown supported)..."
                                  className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 resize-none outline-none focus:border-blue-500"
                                />
                                <div className="text-right text-[10px] text-slate-400 mt-0.5">
                                  {(block.content || '').length} characters
                                </div>
                              </div>
                            )}

                            {/* ── HEADING 2 BLOCK ── */}
                            {block.type === 'heading_2' && (
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Heading Title
                                  </label>
                                  <input
                                    type="text"
                                    value={block.title || ''}
                                    onChange={(e) => updateBlockTitle(block.id, e.target.value)}
                                    placeholder="Section Heading"
                                    className="w-full text-xs font-bold p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Introduction / Content
                                  </label>
                                  <textarea
                                    ref={(el) => { if (el) lastActiveTextareaRef.current = el; }}
                                    rows={3}
                                    value={block.content || ''}
                                    onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                    placeholder="Section introductory explanation..."
                                    className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 resize-none outline-none focus:border-blue-500"
                                  />
                                </div>
                              </div>
                            )}

                            {/* ── FORMULA BLOCK ── */}
                            {block.type === 'formula' && (
                              <div className="space-y-3">
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
                                    placeholder="e.g. Concrete Volume Formula"
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

                                {/* KaTeX Preview */}
                                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl text-center">
                                  <div className="text-[10px] uppercase font-bold text-blue-500 mb-1">Rendered Math</div>
                                  <MathFormula equation={block.data?.equation || 'V = L \\times W \\times H'} />
                                </div>

                                {/* Variables List */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                    <span>Variables</span>
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
                                        className="w-16 text-xs font-mono font-bold p-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md"
                                      />
                                      <input
                                        type="text"
                                        value={v.meaning}
                                        onChange={(e) => {
                                          const vars = [...(block.data?.variables || [])];
                                          vars[vIdx] = { ...vars[vIdx], meaning: e.target.value };
                                          updateBlockData(block.id, { variables: vars });
                                        }}
                                        placeholder="Meaning (e.g. Concrete volume (m³))"
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

                            {/* ── STEP BY STEP BLOCK ── */}
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
                                    placeholder="Step by Step Method"
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
                                    <div key={sIdx} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-slate-900/60 rounded-lg border border-gray-200 dark:border-slate-800">
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
                                          placeholder="Step title"
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
                                          className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md resize-none"
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

                            {/* ── CALCULATOR BLOCK ── */}
                            {block.type === 'calculator_embed' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                    Embed Calculator
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

                                {/* Live Calculator Embed Preview & Test */}
                                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                                      *
                                    </div>
                                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                                      Concrete Volume Calculator
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                                        Length (m)
                                      </label>
                                      <input
                                        type="number"
                                        value={calcLength}
                                        onChange={(e) => setCalcLength(parseFloat(e.target.value) || 0)}
                                        className="w-full text-xs font-bold p-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 rounded-md outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                                        Width (m)
                                      </label>
                                      <input
                                        type="number"
                                        value={calcWidth}
                                        onChange={(e) => setCalcWidth(parseFloat(e.target.value) || 0)}
                                        className="w-full text-xs font-bold p-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 rounded-md outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                                        Height (m)
                                      </label>
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
                                    <span>Calculate Volume</span>
                                  </button>

                                  {calculatedVolume !== null && (
                                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-center text-xs font-bold text-slate-900 dark:text-white border border-emerald-200 dark:border-emerald-800">
                                      Volume: <span className="text-blue-600 dark:text-blue-400 font-mono text-sm">{calculatedVolume} m³</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* ── WARNING BLOCK ── */}
                            {block.type === 'warning' && (
                              <div className="space-y-2 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40">
                                <div>
                                  <label className="block text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase mb-1">
                                    Warning Title
                                  </label>
                                  <input
                                    type="text"
                                    value={block.data?.title || block.title || ''}
                                    onChange={(e) => {
                                      updateBlockTitle(block.id, e.target.value);
                                      updateBlockData(block.id, { title: e.target.value });
                                    }}
                                    placeholder="Engineering Verification Required"
                                    className="w-full text-xs font-bold p-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase mb-1">
                                    Warning Message
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={block.data?.message || block.content || ''}
                                    onChange={(e) => {
                                      updateBlockContent(block.id, e.target.value);
                                      updateBlockData(block.id, { message: e.target.value });
                                    }}
                                    placeholder="Enter engineering code disclaimer and verification notes..."
                                    className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg resize-none"
                                  />
                                </div>
                              </div>
                            )}

                            {/* ── NOTE BLOCK ── */}
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

                            {/* ── KEY TAKEAWAYS BLOCK ── */}
                            {block.type === 'key_takeaway' && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                  <span>Key Points</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const items = block.data?.items || [];
                                      updateBlockData(block.id, { items: [...items, 'New key takeaway point'] });
                                    }}
                                    className="text-blue-600 hover:underline cursor-pointer"
                                  >
                                    + Add Item
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

                            {/* ── TABLE BLOCK ── */}
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
                                <div className="overflow-x-auto max-w-full border border-gray-200 dark:border-slate-700 rounded-lg">
                                  <table className="w-full text-xs font-mono">
                                    <thead>
                                      <tr className="bg-gray-100 dark:bg-slate-800">
                                        {(block.data?.headers || []).map((h: string, hIdx: number) => (
                                          <th key={hIdx} className="p-1 border-r border-gray-200 dark:border-slate-700">
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
                                            <td key={cIdx} className="p-1 border-r border-gray-200 dark:border-slate-700">
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
                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 rounded font-semibold text-blue-600 cursor-pointer"
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
                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 rounded font-semibold text-blue-600 cursor-pointer"
                                  >
                                    + Add Row
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* ── IMAGE BLOCK ── */}
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
                                  <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 max-h-36 aspect-video bg-slate-900">
                                    <img src={block.data.url} alt="Block preview" className="w-full h-full object-cover" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* ── FAQ BLOCK ── */}
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
                                  <div key={fIdx} className="p-2.5 bg-gray-50 dark:bg-slate-900/60 rounded-lg border border-gray-200 dark:border-slate-800 space-y-1.5">
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
                                      placeholder="Technical answer..."
                                      className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md resize-none"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* ── CODE BLOCK ── */}
                            {block.type === 'code_block' && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Code</label>
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
                                  placeholder="# Write script or calculation snippet..."
                                  className="w-full text-xs font-mono p-2.5 bg-slate-900 text-slate-100 rounded-lg resize-none outline-none"
                                />
                              </div>
                            )}

                            {/* ── QUOTE BLOCK ── */}
                            {block.type === 'quote' && (
                              <div className="space-y-2">
                                <textarea
                                  rows={2}
                                  value={block.data?.quote || block.content || ''}
                                  onChange={(e) => updateBlockData(block.id, { quote: e.target.value })}
                                  placeholder="Enter quote text..."
                                  className="w-full text-xs italic p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none"
                                />
                                <input
                                  type="text"
                                  value={block.data?.author || ''}
                                  onChange={(e) => updateBlockData(block.id, { author: e.target.value })}
                                  placeholder="Quote Author / Standard Reference"
                                  className="w-full text-xs p-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              PANE 3: LIVE PREVIEW (WEBSITE SIMULATION)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col space-y-3.5">
            {/* Header: Tabs + Device Switcher */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/80 pb-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewTab('preview')}
                  className={`text-xs font-bold pb-2 -mb-2 border-b-2 transition-colors cursor-pointer ${
                    previewTab === 'preview'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Live Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('editor')}
                  className={`text-xs font-bold pb-2 -mb-2 border-b-2 transition-colors cursor-pointer ${
                    previewTab === 'editor'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Editor (JSON)
                </button>
              </div>

              {/* Devices */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'border border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Desktop Preview"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    previewDevice === 'tablet'
                      ? 'border border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Tablet Preview"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'border border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Mobile Preview"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Simulated Live Reader Canvas */}
            {previewTab === 'preview' ? (
              <div
                className={`w-full overflow-y-auto max-h-[800px] p-4 bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl space-y-4 transition-all text-left ${
                  previewDevice === 'mobile'
                    ? 'max-w-[340px] mx-auto shadow-lg border-2 border-slate-700'
                    : previewDevice === 'tablet'
                    ? 'max-w-[500px] mx-auto shadow-lg border-2 border-slate-700'
                    : 'w-full'
                }`}
              >
                {/* Real-time ArticleRenderer Simulation */}
                <ArticleRenderer article={article} previewMode={true} />
              </div>
            ) : (
              <div className="w-full max-h-[800px] overflow-auto p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] leading-relaxed">
                <pre>{JSON.stringify(article, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              PANE 4: PUBLISH, SEO SETTINGS & RELATED CONTENT
          ══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            {/* Card 1: Publish */}
            <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Publish
              </h3>

              {/* Status */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Status</label>
                <select
                  value={article.status}
                  onChange={(e) => setArticle((prev) => ({ ...prev, status: e.target.value as any }))}
                  className="w-full text-xs font-medium px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Visibility</label>
                <select
                  className="w-full text-xs font-medium px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {/* Publish Radio */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1.5">Publish</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input type="radio" name="publish_schedule" defaultChecked className="text-blue-600" />
                    <span>Immediately</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input type="radio" name="publish_schedule" className="text-blue-600" />
                    <span>Schedule</span>
                  </label>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-1 border-t border-gray-100 dark:border-slate-800">
                <Toggle
                  checked={Boolean(article.featured)}
                  onChange={(v) => setArticle((prev) => ({ ...prev, featured: v }))}
                  label="Featured Article"
                />
                <Toggle
                  checked={Boolean(article.allowComments ?? true)}
                  onChange={(v) => setArticle((prev) => ({ ...prev, allowComments: v }))}
                  label="Allow Comments"
                />
                <div>
                  <Toggle
                    checked={Boolean(article.seoIndex ?? true)}
                    onChange={(v) => setArticle((prev) => ({ ...prev, seoIndex: v }))}
                    label="SEO Index"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Allow search engines to index this article
                  </p>
                </div>
              </div>

              {/* Primary Publish Button */}
              <button
                type="button"
                onClick={() => handleSave('published')}
                disabled={saveStatus === 'saving'}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish</span>
                <ChevronDown className="w-3 h-3 ml-auto opacity-70" />
              </button>
            </div>

            {/* Card 2: SEO Settings */}
            <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  SEO Settings
                </h3>
                <button
                  type="button"
                  onClick={handleAutoSeo}
                  className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-fill</span>
                </button>
              </div>

              {/* SEO Title */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">SEO Title</label>
                <input
                  type="text"
                  value={article.seo?.seoTitle || `${article.title} | CivilMath`}
                  onChange={(e) => setArticle((prev) => ({ ...prev, seo: { ...prev.seo, seoTitle: e.target.value } }))}
                  className="w-full text-xs font-medium px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
                <div className="text-right text-[10px] text-slate-400 font-mono mt-0.5">
                  {(article.seo?.seoTitle || '').length || 45}/60
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  value={article.seo?.metaDescription || article.excerpt || ''}
                  onChange={(e) => setArticle((prev) => ({ ...prev, seo: { ...prev.seo, metaDescription: e.target.value } }))}
                  className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 resize-none"
                />
                <div className="text-right text-[10px] text-slate-400 font-mono mt-0.5">
                  {(article.seo?.metaDescription || '').length || 120}/160
                </div>
              </div>

              {/* Focus Keyword */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Focus Keyword</label>
                <input
                  type="text"
                  value={article.seo?.primaryKeyword || 'concrete volume'}
                  onChange={(e) => setArticle((prev) => ({ ...prev, seo: { ...prev.seo, primaryKeyword: e.target.value } }))}
                  className="w-full text-xs px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Canonical URL */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Canonical URL</label>
                <input
                  type="text"
                  value={article.seo?.canonicalUrl || `https://civilmath.com/articles/${article.slug}`}
                  onChange={(e) => setArticle((prev) => ({ ...prev, seo: { ...prev.seo, canonicalUrl: e.target.value } }))}
                  className="w-full text-xs font-mono px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 truncate"
                />
              </div>
            </div>

            {/* Card 3: Related Content */}
            <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Related Content
              </h3>

              <div className="space-y-2.5">
                <Toggle
                  checked={Boolean(article.showRelatedCalculators ?? true)}
                  onChange={(v) => setArticle((prev) => ({ ...prev, showRelatedCalculators: v }))}
                  label="Show Related Calculators"
                />
                <Toggle
                  checked={Boolean(article.showRelatedArticles ?? true)}
                  onChange={(v) => setArticle((prev) => ({ ...prev, showRelatedArticles: v }))}
                  label="Show Related Articles"
                />
                <Toggle
                  checked={Boolean(article.showFaq ?? true)}
                  onChange={(v) => setArticle((prev) => ({ ...prev, showFaq: v }))}
                  label="Show FAQ Section"
                />
                <Toggle
                  checked={Boolean(article.showAuthor ?? true)}
                  onChange={(v) => setArticle((prev) => ({ ...prev, showAuthor: v }))}
                  label="Show Author Box"
                />
              </div>
            </div>

          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
