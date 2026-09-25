import { useState, useEffect, useMemo, KeyboardEvent, ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Save, Sparkles, Eye, ArrowLeft, CheckCircle2,
  AlertTriangle, Globe, Share2, HelpCircle, Code,
  Smartphone, Monitor, Plus, Trash2, Check, RefreshCw,
  Image as ImageIcon, Upload, X, Link as LinkIcon, Loader2,
  FileImage, CheckCircle, ExternalLink
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Article, ArticleCategory, ArticleSEO } from '../../types/article';
import { getArticleBySlug, saveArticle, getAdminAuthHeaders, uploadArticleImage } from '../../utils/articleStore';
import { autoGenerateSeo, auditArticleSeo, generateArticleJsonLd, slugify } from '../../utils/autoSeo';
import { CATEGORY_DEFAULT_IMAGES } from '../../data/articleVisuals';
import { SITE_URL } from '../../utils/seo';

const CATEGORIES: { id: ArticleCategory; label: string }[] = [
  { id: 'concrete', label: 'Concrete & Materials' },
  { id: 'structural', label: 'Structural Engineering' },
  { id: 'bbs', label: 'Bar Bending Schedule (BBS)' },
  { id: 'geotech', label: 'Geotechnical Engineering' },
  { id: 'survey', label: 'Surveying & Leveling' },
  { id: 'utility', label: 'Engineering Utilities' },
  { id: 'general', label: 'General Civil Engineering' },
];

export default function AdminArticleEditor() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(slug);

  const [loading, setLoading] = useState(isEditing);
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'preview'>('content');
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autoSeoRunning, setAutoSeoRunning] = useState(false);
  const [autoSeoSuccess, setAutoSeoSuccess] = useState(false);

  // Image Upload state
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [customImageUrlInput, setCustomImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Article state
  const [article, setArticle] = useState<Article>({
    slug: '',
    title: '',
    h1: '',
    excerpt: '',
    category: 'concrete',
    author: 'CivilMath Engineering Lead',
    publishedAt: new Date().toISOString(),
    readTimeMinutes: 5,
    status: 'published',
    tags: ['concrete', 'guide'],
    content: '',
    introduction: '',
    theory: '',
    formulas: [],
    faqs: [],
    seo: {
      seoTitle: '',
      metaDescription: '',
      primaryKeyword: '',
      secondaryKeywords: [],
      lsiKeywords: [],
    },
  });

  // Secondary keyword tag input
  const [secTagInput, setSecTagInput] = useState('');

  // Load article if editing
  useEffect(() => {
    if (isEditing && slug) {
      setLoading(true);
      getArticleBySlug(slug).then(loaded => {
        if (loaded) {
          setArticle(loaded);
        } else {
          navigate('/admin');
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [slug, isEditing, navigate]);

  // Real-time SEO Audit computation
  const seoAudit = useMemo(() => auditArticleSeo(article), [article]);

  // 1-Click Auto SEO Generator
  const handleAutoSeo = async () => {
    setAutoSeoRunning(true);
    setAutoSeoSuccess(false);

    try {
      // First run client-side rule engine
      const generated = autoGenerateSeo({
        title: article.title,
        category: article.category,
        content: article.content,
        introduction: article.introduction,
        theory: article.theory,
        slug: article.slug,
      });

      // Try calling server-side AI endpoint if available
      try {
        const res = await fetch('/api/seo/generate', {
          method: 'POST',
          headers: getAdminAuthHeaders(),
          body: JSON.stringify({
            title: article.title,
            category: article.category,
            content: `${article.introduction || ''} ${article.content || ''}`,
          }),
        });
        if (res.ok) {
          const text = await res.text();
          let aiData: any = null;
          try {
            aiData = text && text.trim() ? JSON.parse(text) : null;
          } catch {
            aiData = null;
          }
          if (aiData && aiData.status === 'success' && aiData.seo) {
            generated.seoTitle = aiData.seo.seoTitle || generated.seoTitle;
            generated.metaDescription = aiData.seo.metaDescription || generated.metaDescription;
            generated.primaryKeyword = aiData.seo.primaryKeyword || generated.primaryKeyword;
            generated.secondaryKeywords = aiData.seo.secondaryKeywords || generated.secondaryKeywords;
            generated.lsiKeywords = aiData.seo.lsiKeywords || generated.lsiKeywords;
            if (!article.slug && aiData.seo.slug) {
              generated.slug = aiData.seo.slug;
            }
          }
        }
      } catch {
        // Fall back to client-generated SEO
      }

      setArticle(prev => ({
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

  // Save article handler
  const handleSave = async (targetStatus?: 'published' | 'draft') => {
    if (!article.title.trim()) {
      alert('Please provide an article title.');
      return;
    }

    setSaveStatus('saving');
    const finalSlug = (article.slug || slugify(article.title)).toLowerCase().trim();

    // If SEO is incomplete, auto-populate before saving
    let finalSeo = { ...article.seo };
    if (!finalSeo.seoTitle || !finalSeo.primaryKeyword) {
      const auto = autoGenerateSeo({
        title: article.title,
        category: article.category,
        content: article.content || article.introduction,
        slug: finalSlug,
      });
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
      status: targetStatus || article.status,
      seo: finalSeo,
    };

    try {
      await saveArticle(articleToSave);
      setArticle(articleToSave);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  // Add formula helper
  const addFormula = () => {
    setArticle(prev => ({
      ...prev,
      formulas: [...(prev.formulas || []), { name: '', equation: '', reference: '' }],
    }));
  };

  const removeFormula = (index: number) => {
    setArticle(prev => ({
      ...prev,
      formulas: prev.formulas?.filter((_, i) => i !== index),
    }));
  };

  // Add FAQ helper
  const addFaq = () => {
    setArticle(prev => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: '', answer: '' }],
    }));
  };

  const removeFaq = (index: number) => {
    setArticle(prev => ({
      ...prev,
      faqs: prev.faqs?.filter((_, i) => i !== index),
    }));
  };

  // Add secondary keyword
  const handleAddSecondaryKw = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && secTagInput.trim()) {
      e.preventDefault();
      const trimmed = secTagInput.trim().toLowerCase();
      if (!article.seo.secondaryKeywords.includes(trimmed)) {
        setArticle(prev => ({
          ...prev,
          seo: {
            ...prev.seo,
            secondaryKeywords: [...prev.seo.secondaryKeywords, trimmed],
          },
        }));
      }
      setSecTagInput('');
    }
  };

  const removeSecondaryKw = (kw: string) => {
    setArticle(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        secondaryKeywords: prev.seo.secondaryKeywords.filter(k => k !== kw),
      },
    }));
  };

  // ── Cover Image Handlers ──
  const handleCoverFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select a valid image file (PNG, JPG, WebP, SVG, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageUploadError('Image exceeds 10MB limit. Please choose a smaller file.');
      return;
    }

    setUploadingCover(true);
    setImageUploadError(null);

    try {
      const res = await uploadArticleImage(file);
      setArticle(prev => ({
        ...prev,
        coverImage: res.url,
        seo: {
          ...prev.seo,
          ogImage: res.url,
        },
      }));
    } catch (err: any) {
      setImageUploadError(err.message || 'Failed to upload cover image.');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  // ── Inline Markdown Image Handler ──
  const handleInlineImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    setUploadingInline(true);
    try {
      const res = await uploadArticleImage(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const mdSnippet = `\n\n![${cleanName}](${res.url})\n*Figure: ${cleanName}*\n\n`;

      setArticle(prev => ({
        ...prev,
        content: (prev.content || '') + mdSnippet,
      }));
    } catch (err: any) {
      alert('Failed to upload image: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingInline(false);
      e.target.value = '';
    }
  };

  const applyCustomImageUrl = () => {
    if (!customImageUrlInput.trim()) return;
    const url = customImageUrlInput.trim();
    setArticle(prev => ({
      ...prev,
      coverImage: url,
      seo: {
        ...prev.seo,
        ogImage: url,
      },
    }));
    setCustomImageUrlInput('');
    setShowUrlInput(false);
  };

  const selectPresetCover = (categoryKey: string) => {
    const preset = CATEGORY_DEFAULT_IMAGES[categoryKey];
    if (preset) {
      setArticle(prev => ({
        ...prev,
        coverImage: preset.url,
        seo: {
          ...prev.seo,
          ogImage: preset.url,
        },
      }));
    }
  };

  const removeCoverImage = () => {
    setArticle(prev => ({
      ...prev,
      coverImage: undefined,
      seo: {
        ...prev.seo,
        ogImage: undefined,
      },
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#657565] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#7B8978]">Loading article editor...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D8D0C2] dark:border-[#333C33]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#252B25] text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer"
              title="Return to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">
                {isEditing ? `Edit: ${article.title}` : 'Write New Technical Article'}
              </h1>
              <p className="text-[11px] text-[#7B8978]">
                {article.slug ? `Route: /articles/${article.slug}` : 'Route will be generated from title or custom slug'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 1-Click Auto SEO CTA in header */}
            <button
              onClick={handleAutoSeo}
              disabled={autoSeoRunning}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                autoSeoSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-[#D9B96E] to-[#B56F50] text-white hover:opacity-95'
              }`}
              title="Auto-generate title, description, keywords, and slug based on content"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{autoSeoRunning ? 'Optimizing...' : autoSeoSuccess ? 'SEO Optimized!' : '⚡ 1-Click Auto SEO'}</span>
            </button>

            <button
              onClick={() => handleSave('draft')}
              disabled={saveStatus === 'saving'}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] hover:border-[#657565] transition-colors cursor-pointer"
            >
              Save Draft
            </button>

            <button
              onClick={() => handleSave('published')}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#657565] hover:bg-[#536153] text-white transition-all shadow-xs cursor-pointer"
            >
              {saveStatus === 'saving' ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Published!
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save & Publish
                </>
              )}
            </button>
          </div>
        </div>

        {/* Editor Tabs & Live Score Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] p-1 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'content'
                  ? 'bg-[#657565] text-white shadow-xs'
                  : 'text-[#7B8978] hover:text-[#20231F] dark:hover:text-white'
              }`}
            >
              Article Content
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'seo'
                  ? 'bg-[#657565] text-white shadow-xs'
                  : 'text-[#7B8978] hover:text-[#20231F] dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Auto SEO Assistant</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                seoAudit.score >= 80 ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}>
                {seoAudit.score}%
              </span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-[#657565] text-white shadow-xs'
                  : 'text-[#7B8978] hover:text-[#20231F] dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live Preview
            </button>
          </div>

          {/* Quick Info bar */}
          <div className="flex items-center gap-3 text-xs text-[#7B8978] font-mono">
            <span>Words: <strong className="text-[#20231F] dark:text-[#EAE7E0]">{seoAudit.wordCount}</strong></span>
            <span>·</span>
            <span>Read: <strong className="text-[#20231F] dark:text-[#EAE7E0]">~{seoAudit.readingTimeMinutes} min</strong></span>
            <span>·</span>
            <span>Density: <strong className="text-[#20231F] dark:text-[#EAE7E0]">{seoAudit.keywordDensity}%</strong></span>
          </div>
        </div>

        {/* ── TAB 1: CONTENT EDITOR ── */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Top Primary Metadata Fields */}
            <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] uppercase tracking-wider font-mono">
                Article Core Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                    Article Title (H1) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={article.title}
                    onChange={e => {
                      const t = e.target.value;
                      setArticle(prev => ({
                        ...prev,
                        title: t,
                        slug: prev.slug || slugify(t),
                      }));
                    }}
                    placeholder="e.g. Concrete Volume Estimator & Mix Design Guide"
                    className="w-full text-sm font-bold px-3.5 py-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                    Category
                  </label>
                  <select
                    value={article.category}
                    onChange={e => setArticle(prev => ({ ...prev, category: e.target.value as ArticleCategory }))}
                    className="w-full text-xs font-medium px-3 py-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0] flex items-center justify-between">
                    <span>URL Slug</span>
                    <button
                      type="button"
                      onClick={() => setArticle(prev => ({ ...prev, slug: slugify(prev.title) }))}
                      className="text-[10px] text-[#657565] hover:underline cursor-pointer"
                    >
                      Regenerate from Title
                    </button>
                  </label>
                  <div className="flex items-center bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl px-3 py-2 text-xs font-mono">
                    <span className="text-[#7B8978] shrink-0">/articles/</span>
                    <input
                      type="text"
                      value={article.slug}
                      onChange={e => setArticle(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      placeholder="concrete-volume-estimator"
                      className="w-full bg-transparent border-none outline-none text-[#20231F] dark:text-[#EAE7E0] font-mono pl-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                    Author
                  </label>
                  <input
                    type="text"
                    value={article.author}
                    onChange={e => setArticle(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                    Publication Status
                  </label>
                  <select
                    value={article.status}
                    onChange={e => setArticle(prev => ({ ...prev, status: e.target.value as 'published' | 'draft' }))}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer"
                  >
                    <option value="published">Published (Public)</option>
                    <option value="draft">Draft (Private)</option>
                  </select>
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                  Short Excerpt (Displayed on article cards & search results)
                </label>
                <textarea
                  value={article.excerpt}
                  onChange={e => setArticle(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={2}
                  placeholder="A concise summary of the calculation method, assumptions, and key results..."
                  className="w-full text-xs p-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565] resize-none"
                />
              </div>
            </div>

            {/* Featured / Cover Image */}
            <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] uppercase tracking-wider font-mono flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#657565]" />
                    Featured / Cover Image
                  </h2>
                  <p className="text-xs text-[#7B8978] mt-0.5">
                    Recommended 16:9 ratio (1200×675px). Displayed on article cards, article header, and shared on social / Google Discover.
                  </p>
                </div>
                {article.coverImage && (
                  <button
                    type="button"
                    onClick={removeCoverImage}
                    className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove Cover
                  </button>
                )}
              </div>

              {imageUploadError && (
                <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400 flex items-center justify-between">
                  <span>{imageUploadError}</span>
                  <button onClick={() => setImageUploadError(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-2">×</button>
                </div>
              )}

              {/* Cover Preview or Upload Dropzone */}
              {article.coverImage ? (
                <div className="relative group rounded-xl overflow-hidden border border-[#D8D0C2] dark:border-[#384238] bg-slate-900 aspect-video max-h-72">
                  <img
                    src={article.coverImage}
                    alt={article.title || 'Cover image preview'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = CATEGORY_DEFAULT_IMAGES[article.category]?.url || '';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-end justify-between p-4 text-white">
                    <div className="text-xs truncate max-w-[70%]">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 block">Active Cover Image</span>
                      <span className="truncate block opacity-90">{article.coverImage}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/90 text-slate-900 hover:bg-white transition-colors shadow">
                        <Upload className="w-3.5 h-3.5" />
                        Replace
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                          onChange={handleCoverFileUpload}
                          disabled={uploadingCover}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  {uploadingCover && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold">
                      Uploading image...
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] dark:hover:border-[#657565] rounded-xl p-6 text-center transition-colors bg-white/50 dark:bg-[#252B25]/50">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#EAE7E0] dark:bg-[#2E362E] flex items-center justify-center text-[#657565]">
                      <FileImage className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                        Upload article cover image
                      </p>
                      <p className="text-[11px] text-[#7B8978] mt-0.5">
                        PNG, JPG, WebP, SVG, GIF up to 10MB
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <label className={`cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#657565] hover:bg-[#526052] transition-colors shadow-xs ${uploadingCover ? 'opacity-60 pointer-events-none' : ''}`}>
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingCover ? 'Uploading...' : 'Choose File from Computer'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                          onChange={handleCoverFileUpload}
                          disabled={uploadingCover}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-[#657565] dark:text-[#A4B2A4] border border-[#D8D0C2] dark:border-[#384238] hover:bg-white dark:hover:bg-[#252B25] transition-colors cursor-pointer"
                      >
                        Paste Image URL
                      </button>
                    </div>

                    {showUrlInput && (
                      <div className="pt-2 flex items-center gap-2 max-w-md mx-auto">
                        <input
                          type="url"
                          value={customImageUrlInput}
                          onChange={(e) => setCustomImageUrlInput(e.target.value)}
                          placeholder="https://example.com/diagram.webp"
                          className="w-full text-xs px-3 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565]"
                        />
                        <button
                          type="button"
                          onClick={applyCustomImageUrl}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#657565] hover:bg-[#526052] shrink-0 cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Civil Engineering Preset Images */}
              <div className="pt-2 border-t border-[#EAE7E0] dark:border-[#2E362E]">
                <div className="text-[11px] font-bold text-[#7B8978] uppercase tracking-wider font-mono mb-2">
                  Or select CivilMath curated diagram preset:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {Object.entries(CATEGORY_DEFAULT_IMAGES).map(([catKey, preset]) => {
                    const isSelected = article.coverImage === preset.url;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => selectPresetCover(catKey)}
                        className={`group relative rounded-lg overflow-hidden border p-1 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20'
                            : 'border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] bg-white dark:bg-[#252B25]'
                        }`}
                      >
                        <div className="aspect-video w-full rounded overflow-hidden bg-slate-800">
                          <img
                            src={preset.url}
                            alt={preset.alt}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="mt-1 text-[10px] font-medium text-[#20231F] dark:text-[#EAE7E0] truncate">
                          {catKey.toUpperCase()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Structured Sections */}
            <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
              <h2 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] uppercase tracking-wider font-mono">
                Article Content & Engineering Body
              </h2>

              {/* Introduction */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                  Introduction & Practical Context
                </label>
                <textarea
                  value={article.introduction || ''}
                  onChange={e => setArticle(prev => ({ ...prev, introduction: e.target.value }))}
                  rows={4}
                  placeholder="Explain why this engineering calculation matters, where it is used in the field, and common site challenges..."
                  className="w-full text-xs p-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565]"
                />
              </div>

              {/* Theory */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                  Engineering Theory & Governing Principles
                </label>
                <textarea
                  value={article.theory || ''}
                  onChange={e => setArticle(prev => ({ ...prev, theory: e.target.value }))}
                  rows={4}
                  placeholder="Scientific laws, equilibrium conditions, stress-strain behavior, or material physics underlying this computation..."
                  className="w-full text-xs p-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565]"
                />
              </div>

              {/* Markdown / Freeform Content */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                    Extended Content (Markdown supported)
                  </label>
                  <label className={`cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#657565] dark:text-[#A4B2A4] hover:text-[#526052] bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] px-2.5 py-1 rounded-lg hover:border-[#657565] transition-colors shadow-2xs ${uploadingInline ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload className="w-3 h-3" />
                    <span>{uploadingInline ? 'Uploading figure...' : 'Insert Diagram / Figure'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                      onChange={handleInlineImageUpload}
                      disabled={uploadingInline}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={article.content || ''}
                  onChange={e => setArticle(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  placeholder="Add deep-dive commentary, design charts, site notes, or full markdown text... (Use 'Insert Diagram' above to embed images)"
                  className="w-full text-xs font-mono p-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565]"
                />
              </div>

              {/* Formulas Editor */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                    Formulas & Equations ({article.formulas?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={addFormula}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#657565] dark:text-[#9FB19F] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Formula
                  </button>
                </div>

                {article.formulas?.map((f, i) => (
                  <div key={i} className="p-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={f.name}
                        onChange={e => {
                          const updated = [...(article.formulas || [])];
                          updated[i].name = e.target.value;
                          setArticle(prev => ({ ...prev, formulas: updated }));
                        }}
                        placeholder="Formula Name (e.g. Dry Volume Conversion)"
                        className="text-xs font-semibold px-2 py-1 bg-transparent border-b border-[#D8D0C2] dark:border-[#384238] outline-none flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeFormula(i)}
                        className="text-[#94A094] hover:text-[#B56F50] p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={f.equation}
                      onChange={e => {
                        const updated = [...(article.formulas || [])];
                        updated[i].equation = e.target.value;
                        setArticle(prev => ({ ...prev, formulas: updated }));
                      }}
                      placeholder="Equation (e.g. V_dry = 1.54 × V_wet)"
                      className="w-full text-xs font-mono px-2 py-1.5 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* FAQs Editor */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                    Frequently Asked Questions ({article.faqs?.length || 0})
                  </label>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#657565] dark:text-[#9FB19F] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add FAQ
                  </button>
                </div>

                {article.faqs?.map((faq, i) => (
                  <div key={i} className="p-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={e => {
                          const updated = [...(article.faqs || [])];
                          updated[i].question = e.target.value;
                          setArticle(prev => ({ ...prev, faqs: updated }));
                        }}
                        placeholder="Question (e.g. Why is the 1.54 factor used in concrete?)"
                        className="text-xs font-semibold px-2 py-1 bg-transparent border-b border-[#D8D0C2] dark:border-[#384238] outline-none flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeFaq(i)}
                        className="text-[#94A094] hover:text-[#B56F50] p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={faq.answer}
                      onChange={e => {
                        const updated = [...(article.faqs || [])];
                        updated[i].answer = e.target.value;
                        setArticle(prev => ({ ...prev, faqs: updated }));
                      }}
                      rows={2}
                      placeholder="Answer with engineering explanation..."
                      className="w-full text-xs p-2 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-lg outline-none resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: AUTO SEO ASSISTANT ── */}
        {activeTab === 'seo' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: SEO Controls & SERP Preview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Auto SEO Action Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#657565]/15 via-[#657565]/5 to-transparent border border-[#657565]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#657565]" />
                    Auto SEO Optimizer
                  </h3>
                  <p className="text-[11px] text-[#7B8978] mt-0.5 max-w-md">
                    Analyzes your text, extracts focus terms, crafts an optimal 50-60 char title, 150 char meta description, and generates LSI semantic tags.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoSeo}
                  disabled={autoSeoRunning}
                  className="px-4 py-2.5 bg-[#657565] hover:bg-[#536153] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${autoSeoRunning ? 'animate-spin' : ''}`} />
                  <span>{autoSeoRunning ? 'Generating...' : '⚡ Run Auto SEO Now'}</span>
                </button>
              </div>

              {/* SEO Meta Fields */}
              <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7B8978] font-mono">
                  Search Engine Metadata
                </h3>

                {/* SEO Title */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                    <span>SEO Title (Target: 50-60 characters)</span>
                    <span className={`text-[10px] font-mono ${
                      article.seo.seoTitle.length >= 45 && article.seo.seoTitle.length <= 65
                        ? 'text-emerald-600 font-bold'
                        : 'text-amber-600'
                    }`}>
                      {article.seo.seoTitle.length} / 60 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={article.seo.seoTitle}
                    onChange={e => setArticle(prev => ({
                      ...prev,
                      seo: { ...prev.seo, seoTitle: e.target.value },
                    }))}
                    placeholder="e.g. Concrete Volume Estimator & Materials Guide | CivilMath"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565]"
                  />
                  <div className="w-full bg-[#EAE7E0] dark:bg-[#2A312A] h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        article.seo.seoTitle.length >= 45 && article.seo.seoTitle.length <= 65
                          ? 'bg-emerald-500'
                          : article.seo.seoTitle.length > 65
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, (article.seo.seoTitle.length / 65) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Meta Description */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                    <span>Meta Description (Target: 145-160 characters)</span>
                    <span className={`text-[10px] font-mono ${
                      article.seo.metaDescription.length >= 140 && article.seo.metaDescription.length <= 165
                        ? 'text-emerald-600 font-bold'
                        : 'text-amber-600'
                    }`}>
                      {article.seo.metaDescription.length} / 160 chars
                    </span>
                  </div>
                  <textarea
                    value={article.seo.metaDescription}
                    onChange={e => setArticle(prev => ({
                      ...prev,
                      seo: { ...prev.seo, metaDescription: e.target.value },
                    }))}
                    rows={3}
                    placeholder="Calculate exact concrete volume, dry materials (cement, sand, aggregate), and cost for slabs, footings, and columns using dry volume factor 1.54."
                    className="w-full text-xs p-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565] resize-none"
                  />
                  <div className="w-full bg-[#EAE7E0] dark:bg-[#2A312A] h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        article.seo.metaDescription.length >= 140 && article.seo.metaDescription.length <= 165
                          ? 'bg-emerald-500'
                          : article.seo.metaDescription.length > 165
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, (article.seo.metaDescription.length / 165) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Primary Keyword */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                    Primary Target Keyword
                  </label>
                  <input
                    type="text"
                    value={article.seo.primaryKeyword}
                    onChange={e => setArticle(prev => ({
                      ...prev,
                      seo: { ...prev.seo, primaryKeyword: e.target.value },
                    }))}
                    placeholder="e.g. concrete volume calculator"
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none"
                  />
                </div>

                {/* Secondary Keywords */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                    Secondary Keywords
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl min-h-[42px] items-center">
                    {article.seo.secondaryKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[#EAE7E0] dark:bg-[#333C33] text-[#20231F] dark:text-[#EAE7E0]"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => removeSecondaryKw(kw)}
                          className="hover:text-rose-500 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={secTagInput}
                      onChange={e => setSecTagInput(e.target.value)}
                      onKeyDown={handleAddSecondaryKw}
                      placeholder="Type & press Enter to add keyword..."
                      className="text-xs bg-transparent border-none outline-none flex-1 min-w-[140px] px-1 text-[#20231F] dark:text-[#EAE7E0]"
                    />
                  </div>
                </div>

                {/* LSI Semantic Keywords */}
                {article.seo.lsiKeywords && article.seo.lsiKeywords.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8978]">
                      Semantic LSI Terms (Auto-detected)
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {article.seo.lsiKeywords.map((lsi, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#657565]/10 text-[#657565] dark:text-[#9FB19F]"
                        >
                          {lsi}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SERP Search Preview */}
              <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#7B8978] font-mono flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#657565]" />
                    Google Search Result (SERP) Preview
                  </h3>

                  <div className="flex items-center gap-1 p-0.5 bg-[#EAE7E0] dark:bg-[#2A312A] rounded-lg">
                    <button
                      type="button"
                      onClick={() => setSerpDevice('desktop')}
                      className={`p-1 rounded cursor-pointer ${serpDevice === 'desktop' ? 'bg-white dark:bg-[#1E221E] text-[#20231F] dark:text-white shadow-2xs' : 'text-[#7B8978]'}`}
                      title="Desktop Search Preview"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSerpDevice('mobile')}
                      className={`p-1 rounded cursor-pointer ${serpDevice === 'mobile' ? 'bg-white dark:bg-[#1E221E] text-[#20231F] dark:text-white shadow-2xs' : 'text-[#7B8978]'}`}
                      title="Mobile Search Preview"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Google Card */}
                <div className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A1D1A] ${serpDevice === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
                  <div className="text-[11px] text-[#4d5156] dark:text-[#bdc1c6] truncate flex items-center gap-1 mb-1 font-sans">
                    <span className="font-semibold text-slate-800 dark:text-slate-300">civilmath.com</span>
                    <span>› articles › {article.slug || 'slug'}</span>
                  </div>

                  <div className="text-base text-[#1a0dab] dark:text-[#8ab4f8] font-medium hover:underline cursor-pointer font-sans leading-snug mb-1">
                    {article.seo.seoTitle || article.title || 'Untitled Article | CivilMath'}
                  </div>

                  <p className="text-[12px] text-[#4d5156] dark:text-[#bdc1c6] font-sans leading-relaxed m-0">
                    {article.seo.metaDescription || article.excerpt || 'No description provided yet.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Live SEO Health Auditor */}
            <div className="space-y-6">
              <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#7B8978] font-mono">
                    SEO Health Audit
                  </h3>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    seoAudit.status === 'excellent'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : seoAudit.status === 'good'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {seoAudit.status.toUpperCase()}
                  </div>
                </div>

                {/* Score Circle / Meter */}
                <div className="flex items-center gap-4 py-2">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-xl font-mono ${
                    seoAudit.score >= 85
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      : seoAudit.score >= 70
                      ? 'bg-emerald-500/10 text-emerald-700'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                  }`}>
                    <span>{seoAudit.score}</span>
                    <span className="text-[9px] font-normal text-[#7B8978]">/ 100</span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="font-bold text-[#20231F] dark:text-[#EAE7E0]">
                      {seoAudit.score >= 85 ? 'Optimized for Ranking' : 'A few tweaks recommended'}
                    </div>
                    <p className="text-[11px] text-[#7B8978] leading-tight m-0">
                      {seoAudit.checks.filter(c => c.passed).length} of {seoAudit.checks.length} ranking criteria passed.
                    </p>
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-2 pt-2 border-t border-[#D8D0C2] dark:border-[#333C33]">
                  {seoAudit.checks.map(check => (
                    <div
                      key={check.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#20231F] dark:text-[#EAE7E0]">
                          {check.label}
                        </span>
                        {check.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#7B8978] m-0">
                        {check.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* JSON-LD Schema preview card */}
              <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7B8978] font-mono flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-[#657565]" />
                    JSON-LD Schema
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold">
                    VALID
                  </span>
                </div>
                <pre className="text-[9px] font-mono bg-white dark:bg-[#252B25] p-3 rounded-xl border border-[#D8D0C2] dark:border-[#384238] overflow-x-auto max-h-48 text-[#555C55] dark:text-[#A4B2A4]">
                  {JSON.stringify(generateArticleJsonLd(article), null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: LIVE PREVIEW ── */}
        {activeTab === 'preview' && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-2xl p-6 sm:p-10 shadow-lg space-y-8">
            {/* Header */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#657565] font-bold mb-2">
                {article.category} · {article.readTimeMinutes} min read
              </div>
              <h1 className="text-3xl font-black text-[#20231F] dark:text-[#EAE7E0] leading-tight">
                {article.title || 'Untitled Article'}
              </h1>
              <p className="text-sm text-[#7B8978] mt-3 leading-relaxed">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-3 mt-4 text-xs text-[#7B8978] font-mono">
                <span>By {article.author}</span>
                <span>·</span>
                <span>Published {new Date(article.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Featured Image in Preview */}
            {article.coverImage && (
              <div className="rounded-2xl overflow-hidden border border-[#D8D0C2] dark:border-[#384238] shadow-md aspect-video max-h-96 w-full bg-slate-900">
                <img
                  src={article.coverImage}
                  alt={article.title || 'Cover image'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Disclaimer */}
            <aside className="border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-xs leading-5 text-amber-900 dark:text-amber-200 rounded-r-xl">
              Educational reference material only. All calculation formulas, coefficients, and nominal assumptions must be verified against applicable project specifications and reviewed by a licensed professional engineer.
            </aside>

            {/* Introduction */}
            {article.introduction && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">Introduction</h2>
                <div className="text-xs font-mono text-[#555C55] dark:text-[#C5D0C5] leading-relaxed space-y-2">
                  {article.introduction.split('\n\n').map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Theory */}
            {article.theory && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">Engineering Theory & Principles</h2>
                <div className="text-xs font-mono text-[#555C55] dark:text-[#C5D0C5] leading-relaxed space-y-2">
                  {article.theory.split('\n\n').map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown Body */}
            {article.content && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">Detailed Engineering Guide</h2>
                <div className="text-xs font-mono text-[#555C55] dark:text-[#C5D0C5] leading-relaxed whitespace-pre-wrap">
                  {article.content}
                </div>
              </div>
            )}

            {/* Formulas */}
            {article.formulas && article.formulas.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">Governing Formulas</h2>
                <div className="grid gap-3">
                  {article.formulas.map((f, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238]">
                      <h3 className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">{f.name}</h3>
                      <p className="font-mono text-sm text-[#657565] dark:text-[#9FB19F] mt-1 font-bold">{f.equation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {article.faqs && article.faqs.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-[#20231F] dark:text-[#EAE7E0]">Frequently Asked Questions</h2>
                <div className="space-y-2">
                  {article.faqs.map((faq, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238]">
                      <h3 className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">{faq.question}</h3>
                      <p className="text-xs text-[#7B8978] mt-1 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
