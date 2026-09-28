import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Save, Eye, ArrowLeft, Send, Check, AlertCircle, AlertTriangle,
  Upload, X, Image as ImageIcon, Loader2, Sparkles, Clock, Globe,
  CheckCircle2, ChevronDown, ChevronUp, Tag, Layers
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import TiptapArticleEditor from '../../components/article/editor/TiptapArticleEditor';
import {
  Article,
  ArticleCategory,
} from '../../types/article';
import {
  getArticleBySlug,
  saveArticle,
  uploadArticleImage,
  checkSlugExists,
  normalizeArticleData,
} from '../../utils/articleStore';
import { slugify } from '../../utils/autoSeo';

const CATEGORIES: { id: ArticleCategory; label: string }[] = [
  { id: 'concrete', label: 'Concrete & Materials' },
  { id: 'structural', label: 'Structural Engineering' },
  { id: 'bbs', label: 'Bar Bending Schedule (BBS)' },
  { id: 'geotech', label: 'Geotechnical Engineering' },
  { id: 'survey', label: 'Surveying & Leveling' },
  { id: 'utility', label: 'Engineering Utilities' },
  { id: 'general', label: 'General Civil Engineering' },
];

export default function AdminArticleEditorV2() {
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(routeSlug);

  // Core Article State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState(routeSlug || '');
  const [originalSlug, setOriginalSlug] = useState(routeSlug || '');
  const [initialStatus, setInitialStatus] = useState<'draft' | 'published'>('draft');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [category, setCategory] = useState<ArticleCategory>('general');
  const [tags, setTags] = useState<string[]>(['general']);
  const [tagInput, setTagInput] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [contentHtml, setContentHtml] = useState('');

  // UI & Auto-Save States
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugModified, setSlugModified] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(true);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<any>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── Load article on mount if editing ──
  useEffect(() => {
    if (isEditing && routeSlug) {
      setLoading(true);
      getArticleBySlug(routeSlug)
        .then((art) => {
          if (art) {
            setTitle(art.title || '');
            setSlug(art.slug || routeSlug);
            setOriginalSlug(art.slug || routeSlug);
            setInitialStatus(art.status === 'published' ? 'published' : 'draft');
            setStatus(art.status === 'published' ? 'published' : 'draft');
            setCategory(art.category || 'general');
            setTags(art.tags?.length ? art.tags : [art.category || 'general']);
            setExcerpt(art.excerpt || '');
            setCoverImageUrl(art.coverImage || art.coverImageUrl || '');

            // Determine content
            if (art.content && art.contentFormat === 'html') {
              setContentHtml(art.content);
            } else if (art.content && !art.blocks?.length) {
              setContentHtml(art.content);
            } else if (art.blocks?.length) {
              // Convert legacy blocks into clean HTML
              const convertedHtml = art.blocks
                .map((b) => {
                  if (b.type === 'heading_2') return `<h2>${b.title || b.content || ''}</h2>`;
                  if (b.type === 'heading_3') return `<h3>${b.title || b.content || ''}</h3>`;
                  if (b.type === 'paragraph') return `<p>${b.content || ''}</p>`;
                  if (b.type === 'formula' && (b.data?.equation || b.title)) {
                    return `<div data-type="math-block" data-latex="${b.data?.equation || b.title}"></div>`;
                  }
                  if (b.type === 'quote') return `<blockquote>${b.data?.quote || b.content || ''}</blockquote>`;
                  return b.content ? `<p>${b.content}</p>` : '';
                })
                .filter(Boolean)
                .join('');
              setContentHtml(convertedHtml);
            }
          } else {
            showToast('Article not found', 'error');
            navigate('/admin/articles');
          }
        })
        .catch(() => {
          showToast('Failed to load article', 'error');
          navigate('/admin/articles');
        })
        .finally(() => setLoading(false));
    }
  }, [routeSlug, isEditing, navigate]);

  // ── Auto-generate slug from title for new articles ──
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && !slugModified) {
      const generated = slugify(val);
      setSlug(generated);
      validateSlug(generated);
    }
  };

  const handleSlugChange = (val: string) => {
    setSlugModified(true);
    const cleaned = slugify(val);
    setSlug(cleaned);
    validateSlug(cleaned);
  };

  const validateSlug = async (testSlug: string) => {
    if (!testSlug.trim()) {
      setSlugError('Slug is required.');
      return false;
    }
    const exists = await checkSlugExists(testSlug, originalSlug);
    if (exists) {
      setSlugError(`The slug "${testSlug}" is already taken by another article.`);
      return false;
    }
    setSlugError(null);
    return true;
  };

  // ── Tags management ──
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // ── Cover Image Upload ──
  const handleCoverUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    setIsCoverUploading(true);
    try {
      const { url } = await uploadArticleImage(file, slug || 'article');
      setCoverImageUrl(url);
      showToast('Cover photo uploaded & optimized (WebP)!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload cover image', 'error');
    } finally {
      setIsCoverUploading(false);
    }
  };

  // ── Auto-save to localStorage & server draft ──
  useEffect(() => {
    if (loading) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      const currentSlug = slug.trim();
      if (!currentSlug || !title.trim()) return;

      // 1. Save backup to localStorage immediately
      const draftBackup: Partial<Article> = {
        title,
        slug: currentSlug,
        excerpt,
        category,
        tags,
        coverImage: coverImageUrl,
        coverImageUrl,
        content: contentHtml,
        contentFormat: 'html',
        status: status,
      };
      try {
        localStorage.setItem(`civilmath_draft_${currentSlug}`, JSON.stringify(draftBackup));
      } catch {
        // ignore
      }

      // 2. Silent upsert draft to server API if valid
      if (!slugError) {
        setAutoSaveState('saving');
        try {
          const articleToSave: Article = normalizeArticleData({
            ...draftBackup,
            status: status === 'published' ? 'published' : 'draft',
          }, currentSlug);

          await saveArticle(articleToSave);
          setAutoSaveState('saved');
          setLastSavedTime(new Date());
        } catch {
          setAutoSaveState('error');
        }
      }
    }, 10000); // every 10 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [title, slug, excerpt, category, tags, coverImageUrl, contentHtml, status, slugError, loading]);

  // ── Explicit Save / Publish Handler ──
  const handleSave = async (targetStatus: 'draft' | 'published') => {
    const cleanTitle = title.trim();
    const cleanSlug = slug.trim();

    if (!cleanTitle) {
      showToast('Please enter an article title', 'error');
      return;
    }

    if (!cleanSlug) {
      showToast('Please enter a valid URL slug', 'error');
      return;
    }

    const isValid = await validateSlug(cleanSlug);
    if (!isValid) {
      showToast(slugError || 'Slug is already used by another article', 'error');
      return;
    }

    // Warn if slug changed on a published article
    if (isEditing && initialStatus === 'published' && cleanSlug !== originalSlug) {
      const confirmChange = window.confirm(
        `Warning: Changing the slug from "${originalSlug}" to "${cleanSlug}" will break existing links, bookmarks, and search engine rankings. Are you sure you want to change it?`
      );
      if (!confirmChange) return;
    }

    setSaving(true);

    try {
      const articleData: Article = normalizeArticleData({
        title: cleanTitle,
        h1: cleanTitle,
        slug: cleanSlug,
        excerpt: excerpt.trim() || cleanTitle,
        category,
        tags: tags.length ? tags : [category],
        coverImage: coverImageUrl,
        coverImageUrl: coverImageUrl,
        content: contentHtml,
        contentFormat: 'html',
        status: targetStatus,
        publishedAt: targetStatus === 'published' ? new Date().toISOString() : undefined,
      }, cleanSlug);

      await saveArticle(articleData);

      setStatus(targetStatus);
      setOriginalSlug(cleanSlug);
      if (targetStatus === 'published') {
        setInitialStatus('published');
      }
      setLastSavedTime(new Date());
      setAutoSaveState('saved');

      showToast(
        targetStatus === 'published'
          ? '🎉 Article published successfully to the live site!'
          : '✓ Draft saved successfully!',
        'success'
      );

      // Clean local draft backup on successful publish
      try {
        localStorage.removeItem(`civilmath_draft_${cleanSlug}`);
      } catch {}

      if (!isEditing || cleanSlug !== routeSlug) {
        navigate(`/admin/articles/edit/${cleanSlug}`, { replace: true });
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save article.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Preview action: opens exact reader view in new tab with draft auth
  const handleOpenPreview = () => {
    const cleanSlug = slug.trim();
    if (!cleanSlug) {
      showToast('Please set a slug before previewing', 'warning');
      return;
    }
    window.open(`/articles/${cleanSlug}?preview=true`, '_blank');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-24 text-center max-w-lg mx-auto space-y-3">
          <Loader2 className="w-8 h-8 text-[#657565] animate-spin mx-auto" />
          <p className="text-xs font-mono text-stone-500">Loading Article Editor...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-2 border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-amber-900 text-white border-amber-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* ── Top Header Navigation & Action Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/articles"
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-600 dark:text-stone-300"
              title="Back to Articles"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                  {isEditing ? 'Edit Article' : 'New Article'}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    status === 'published'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-stone-400 mt-0.5">
                {autoSaveState === 'saving' && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Loader2 className="w-3 h-3 animate-spin" /> Auto-saving draft...
                  </span>
                )}
                {autoSaveState === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3 h-3" /> Auto-saved {lastSavedTime ? `at ${lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </span>
                )}
                {autoSaveState === 'idle' && <span>Auto-saves every 10s & localStorage</span>}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Preview Button */}
            <button
              type="button"
              onClick={handleOpenPreview}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-200 hover:border-[#657565] transition-all cursor-pointer shadow-2xs"
              title="Preview article as readers see it"
            >
              <Eye className="w-3.5 h-3.5 text-stone-500" />
              <span>Preview</span>
            </button>

            {/* Save Draft Button */}
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('draft')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving && status === 'draft' ? 'Saving…' : 'Save Draft'}</span>
            </button>

            {/* Publish Button */}
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave('published')}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{saving && status === 'published' ? 'Publishing…' : 'Publish'}</span>
            </button>
          </div>
        </div>

        {/* ── Metadata Drawer Card ── */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs overflow-hidden">
          <div
            onClick={() => setMetadataOpen(!metadataOpen)}
            className="flex items-center justify-between px-6 py-3.5 bg-stone-50/70 dark:bg-stone-800/40 border-b border-stone-200 dark:border-stone-800 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300 font-mono uppercase tracking-wider">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Article Settings & Meta (Slug, Category, Tags, Excerpt)</span>
            </div>
            <button type="button" className="text-stone-400 hover:text-stone-600">
              {metadataOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {metadataOpen && (
            <div className="p-6 space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-xs font-mono font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
                  Article Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. How to Calculate Concrete Volume with Mix Ratios"
                  className="w-full text-lg sm:text-xl font-bold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-600 text-stone-900 dark:text-white"
                />
              </div>

              {/* Slug Input with Duplicate Validation & Published Breakage Warning */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                    Permanent URL Slug <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-stone-400 font-mono">
                    https://civilmath.com/articles/{slug || '...'}
                  </span>
                </div>
                <div className="flex items-center bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono focus-within:border-emerald-600">
                  <span className="text-stone-400 shrink-0">articles/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="how-to-calculate-concrete-volume"
                    className="bg-transparent flex-1 outline-none text-stone-900 dark:text-stone-100 font-bold ml-1"
                  />
                </div>

                {slugError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{slugError}</span>
                  </p>
                )}

                {isEditing && initialStatus === 'published' && slug !== originalSlug && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      Changing the slug of an already published article will break external links and search rankings.
                    </span>
                  </div>
                )}
              </div>

              {/* Category & Tags Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                    className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-emerald-600 text-stone-900 dark:text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
                    Tags <span className="text-stone-400 font-normal">(Press Enter or comma to add)</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl min-h-[38px]">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-mono"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          className="text-stone-400 hover:text-stone-700 dark:hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder={tags.length === 0 ? 'concrete, rebar, formulas...' : ''}
                      className="bg-transparent flex-1 text-xs outline-none px-1 text-stone-900 dark:text-white min-w-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-mono font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
                  Article Excerpt / Lead Summary <span className="text-stone-400 font-normal">(Used for Google description & article card)</span>
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  placeholder="A concise, high-impact summary of this engineering guide..."
                  className="w-full text-xs p-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl outline-none focus:border-emerald-600 text-stone-900 dark:text-white leading-relaxed"
                />
              </div>

              {/* Cover Image Upload & Preview */}
              <div>
                <label className="block text-xs font-mono font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">
                  Cover Photo <span className="text-stone-400 font-normal">(Auto-optimized to WebP)</span>
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverUpload(file);
                    }}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isCoverUploading}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 hover:border-emerald-600 transition-colors cursor-pointer"
                  >
                    {isCoverUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    ) : (
                      <Upload className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{isCoverUploading ? 'Optimizing…' : coverImageUrl ? 'Change Cover Photo' : 'Upload Cover Photo'}</span>
                  </button>

                  {coverImageUrl && (
                    <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                      <img
                        src={coverImageUrl}
                        alt="Cover preview"
                        className="w-12 h-8 rounded-lg object-cover"
                      />
                      <span className="text-[11px] font-mono text-stone-500 truncate max-w-xs px-1">
                        {coverImageUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCoverImageUrl('')}
                        className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-white"
                        title="Remove cover"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── WYSIWYG Article Editor (TipTap) ── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
              Article Body Content (WYSIWYG Writer)
            </label>
            <span className="text-[11px] text-stone-400">
              Clean typography (18px) · KaTeX Math · WebP Photos
            </span>
          </div>

          <TiptapArticleEditor
            content={contentHtml}
            onChange={(html) => setContentHtml(html)}
            articleSlug={slug || 'article'}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
