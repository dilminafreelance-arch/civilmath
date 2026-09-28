import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  ChangeEvent,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save, Eye, ArrowLeft, Send, Sparkles, RefreshCw, Check,
  Link as LinkIcon, Image as ImageIcon, Trash2, Copy, Plus,
  FileText, Clock, HelpCircle, Code, AlignLeft,
  ChevronDown, Monitor, Tablet, Smartphone, Calculator,
  Compass, Table as TableIcon, Layers, AlertTriangle, Lightbulb,
  Info, BookOpen, Quote, Shield, CheckCircle2, ChevronRight,
  ExternalLink, Upload, X, Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Maximize2, Loader2
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import {
  Article,
  ArticleCategory,
  ArticleBlock,
  ArticleBlockType,
  FormulaBlockData,
  StepByStepBlockData,
  legacyArticleToBlocks,
} from '../../types/article';
import {
  getArticleBySlug,
  saveArticle,
  uploadArticleImage,
  getAllArticleSummaries,
} from '../../utils/articleStore';
import { autoGenerateSeo, slugify } from '../../utils/autoSeo';
import MathFormula from '../../components/article/MathFormula';

// ─── Categories ──────────────────────────────────────────────────────────────
const CATEGORIES: { id: ArticleCategory; label: string }[] = [
  { id: 'concrete', label: 'Concrete' },
  { id: 'structural', label: 'Structural' },
  { id: 'bbs', label: 'Bar Bending Schedule (BBS)' },
  { id: 'geotech', label: 'Geotechnical' },
  { id: 'survey', label: 'Surveying & Leveling' },
  { id: 'utility', label: 'Engineering Utilities' },
  { id: 'general', label: 'General Civil' },
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

// ─── Default Sample Article Matching Reference Image ───────────────────────
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

  // Tag input state
  const [tagInput, setTagInput] = useState('');

  // Cover image input
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          title: 'Interactive Calculator',
          data: {
            calculatorId: 'concrete-volume',
            title: 'Concrete Volume Calculator',
          },
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
  };

  // Block actions
  const handleDeleteBlock = (blockId: string) => {
    setArticle((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).filter((b) => b.id !== blockId),
    }));
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
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
    }
  };

  // Cover image change
  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadArticleImage(file);
      setArticle((prev) => ({ ...prev, coverImage: url }));
    } catch (err) {
      console.error('Image upload failed', err);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="w-full space-y-4">
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
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              PANE 2: CONTENT BUILDER PANE
          ══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-2xs">
            {/* Formatting Toolbar at Top */}
            <div className="flex flex-wrap items-center gap-1 pb-3 border-b border-gray-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded-md text-xs font-semibold cursor-pointer">
                <span>Paragraph</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <span className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1" />
              <button type="button" className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Underline"><Underline className="w-3.5 h-3.5" /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></button>
              <span className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1" />
              <button type="button" className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
              <span className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1" />
              <button type="button" className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Link"><LinkIcon className="w-3.5 h-3.5" /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Quote"><Quote className="w-3.5 h-3.5" /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Code"><Code className="w-3.5 h-3.5" /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Table"><TableIcon className="w-3.5 h-3.5" /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer" title="Image"><ImageIcon className="w-3.5 h-3.5" /></button>
              <button type="button" className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md hover:text-slate-900 cursor-pointer ml-auto" title="Fullscreen"><Maximize2 className="w-3.5 h-3.5" /></button>
            </div>

            <div className="text-[11px] text-slate-400 font-medium italic">
              Write your content here...
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
              <div className="flex-1 space-y-3 min-w-0">
                {(article.blocks || []).map((block) => (
                  <div
                    key={block.id}
                    className="border border-gray-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111A2E] p-3 space-y-2.5 shadow-2xs group"
                  >
                    {/* Block 1: H2 Heading / Intro */}
                    {block.type === 'heading_2' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              H2
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {block.title || 'Introduction'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <textarea
                          rows={3}
                          value={block.content || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setArticle((prev) => ({
                              ...prev,
                              blocks: (prev.blocks || []).map((b) =>
                                b.id === block.id ? { ...b, content: val } : b
                              ),
                            }));
                          }}
                          className="w-full text-xs p-2 bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-slate-200 resize-none outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* Block 2: Formula Block */}
                    {block.type === 'formula' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 text-[10px] font-serif italic font-bold rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                              fx
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {block.title || 'Formula Block'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {/* Formula Content Card */}
                        <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-2.5">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {block.data?.title || 'Concrete Volume Formula'}
                          </div>
                          <div className="py-2 text-center text-lg font-serif">
                            <MathFormula
                              equation={block.data?.equation || 'V = L \\times W \\times H'}
                            />
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono space-y-1 pt-1 border-t border-blue-100/60 dark:border-blue-900/40">
                            <div><strong className="font-bold">V</strong> = Concrete volume (m³)</div>
                            <div><strong className="font-bold">L</strong> = Length (m)</div>
                            <div><strong className="font-bold">W</strong> = Width (m)</div>
                            <div><strong className="font-bold">H</strong> = Height or Thickness (m)</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Block 3: Step by Step Block */}
                    {block.type === 'step_by_step' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {block.title || 'Step by Step Block'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {/* Steps List */}
                        <div className="space-y-2">
                          {[
                            { n: 1, text: 'Identify the structure and dimensions' },
                            { n: 2, text: 'Convert all dimensions to metres' },
                            { n: 3, text: 'Use the formula V = L × W × H' },
                            { n: 4, text: 'Calculate the volume' },
                            { n: 5, text: 'Add wastage if required (2% – 5%)' },
                          ].map((step) => (
                            <div key={step.n} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                {step.n}
                              </span>
                              <span>{step.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Block 4: Calculator Block */}
                    {block.type === 'calculator_embed' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calculator className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              Calculator Block
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(block.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {/* Interactive Calculator Box */}
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

                    {/* Generic block display for other types */}
                    {!['heading_2', 'formula', 'step_by_step', 'calculator_embed'].includes(block.type) && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase font-mono">
                            {block.type.replace(/_/g, ' ')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={block.content || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setArticle((prev) => ({
                              ...prev,
                              blocks: (prev.blocks || []).map((b) =>
                                b.id === block.id ? { ...b, content: val } : b
                              ),
                            }));
                          }}
                          className="w-full text-xs p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                ))}
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
                  Editor
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
            <div
              className={`w-full overflow-y-auto max-h-[750px] p-4 bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl space-y-3.5 transition-all text-left ${
                previewDevice === 'mobile'
                  ? 'max-w-[340px] mx-auto'
                  : previewDevice === 'tablet'
                  ? 'max-w-[480px] mx-auto'
                  : 'w-full'
              }`}
            >
              {/* Breadcrumb */}
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 flex-wrap">
                <span>Home</span>
                <span>&gt;</span>
                <span>Articles</span>
                <span>&gt;</span>
                <span className="capitalize">{article.category}</span>
                <span>&gt;</span>
                <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[150px]">
                  {article.title}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {article.title || 'How to Calculate Concrete Volume'}
              </h2>

              {/* Meta row */}
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>By <span className="text-blue-600 dark:text-blue-400 font-medium">{article.author}</span></span>
                <span>·</span>
                <span>{article.readTimeMinutes || 8} min read</span>
                <span>·</span>
                <span>Updated Sep 27, 2026</span>
              </div>

              {/* Hero Image */}
              {article.coverImage && (
                <div className="rounded-xl overflow-hidden aspect-video bg-slate-900">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Intro paragraph */}
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed m-0">
                Concrete volume is the total amount of concrete required for a structure. It is an essential calculation in construction for estimation, cost control and material planning.
              </p>

              {/* Rendered Formula Card */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <span className="text-purple-600 font-serif italic">fx</span>
                  <span>Concrete Volume Formula</span>
                </div>
                <div className="py-1 text-center">
                  <MathFormula equation="V = L \times W \times H" />
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono space-y-0.5">
                  <div>V = Concrete volume (m³)</div>
                  <div>L = Length (m)</div>
                  <div>W = Width (m)</div>
                  <div>H = Height or Thickness (m)</div>
                </div>
              </div>

              {/* Rendered Step-by-Step Method */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Step by Step Method
                </div>
                <div className="space-y-2">
                  {[
                    'Identify the structure and dimensions',
                    'Convert all dimensions to metres',
                    'Use the formula V = L × W × H',
                    'Calculate the volume',
                    'Add wastage if required (2% – 5%)',
                  ].map((st, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                        {idx + 1}
                      </span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                SEO Settings
              </h3>

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
