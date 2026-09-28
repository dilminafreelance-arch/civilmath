import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PenTool, Search, RefreshCw, Eye, Edit3, Trash2, Copy,
  CheckCircle2, AlertCircle, Clock, CalendarClock, Archive,
  FileText, Sparkles, Upload,
  Download, Mail, X, Image as ImageIcon,
  ChevronLeft, ChevronRight, TrendingUp, BookOpen, Loader2,
  MoreHorizontal, Code,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import AdminUploadModal from './AdminUploadModal';
import { Article, ArticleCategory } from '../../types/article';
import {
  getAllArticleSummaries,
  deleteArticle,
  exportAllArticlesAsJson,
  fetchAndSyncAllArticles,
  clearLocalArticleCache,
  saveArticle,
} from '../../utils/articleStore';
import { getUnreadInquiriesCount } from '../../utils/inquiryStore';
import { getArticleCoverImage } from '../../data/articleVisuals';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_NAMES: Record<ArticleCategory, string> = {
  concrete: 'Concrete & Materials',
  structural: 'Structural Analysis',
  bbs: 'Rebar BBS',
  geotech: 'Geotechnical',
  survey: 'Surveying',
  utility: 'Engineering Utilities',
  general: 'General Engineering',
};

const CATEGORY_COLORS: Record<ArticleCategory, string> = {
  concrete:   'bg-stone-100 dark:bg-stone-900/40 text-stone-700 dark:text-stone-300',
  structural: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  bbs:        'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  geotech:    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  survey:     'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
  utility:    'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  general:    'bg-[#EAE7E0] dark:bg-[#2A312A] text-[#555C55] dark:text-[#A4B2A4]',
};

const CATEGORY_PLACEHOLDER_COLORS: Record<ArticleCategory, string> = {
  concrete:   'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300',
  structural: 'bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-300',
  bbs:        'bg-orange-200 dark:bg-orange-800 text-orange-600 dark:text-orange-300',
  geotech:    'bg-amber-200 dark:bg-amber-800 text-amber-600 dark:text-amber-300',
  survey:     'bg-teal-200 dark:bg-teal-800 text-teal-600 dark:text-teal-300',
  utility:    'bg-purple-200 dark:bg-purple-800 text-purple-600 dark:text-purple-300',
  general:    'bg-[#D8D0C2] dark:bg-[#333C33] text-[#657565] dark:text-[#9FB19F]',
};

const PAGE_SIZE = 10;

// ─── Helper utilities ─────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatViews(n?: number): string {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: Article['status'];
}

function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<Article['status'], { label: string; className: string; Icon: React.ElementType }> = {
    published: {
      label: 'Published',
      className: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300',
      Icon: CheckCircle2,
    },
    draft: {
      label: 'Draft',
      className: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
      Icon: Clock,
    },
    scheduled: {
      label: 'Scheduled',
      className: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300',
      Icon: CalendarClock,
    },
    archived: {
      label: 'Archived',
      className: 'bg-[#EAE7E0] dark:bg-[#2A312A] text-[#7B8978] dark:text-[#7B8978]',
      Icon: Archive,
    },
  };

  const cfg = map[status] ?? map.draft;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

interface ArticleThumbnailProps {
  article: Article;
  size?: number;
}

function ArticleThumbnail({ article, size = 48 }: ArticleThumbnailProps) {
  const [errored, setErrored] = useState(false);
  const img = getArticleCoverImage(article.slug, article.category, article.coverImage);
  const placeholderCls = CATEGORY_PLACEHOLDER_COLORS[article.category] ?? CATEGORY_PLACEHOLDER_COLORS.general;
  const letter = (article.title?.[0] ?? article.category?.[0] ?? 'A').toUpperCase();

  if (errored || !img?.url) {
    return (
      <div
        className={`flex-shrink-0 rounded-lg flex items-center justify-center font-bold text-sm select-none ${placeholderCls}`}
        style={{ width: size, height: size }}
      >
        {letter}
      </div>
    );
  }

  return (
    <img
      src={img.url}
      alt={img.alt}
      width={size}
      height={size}
      className="flex-shrink-0 rounded-lg object-cover"
      style={{ width: size, height: size }}
      onError={() => setErrored(true)}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type SortKey = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'most-views';

export default function AdminArticlesDashboard() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [unreadInquiries, setUnreadInquiries] = useState(0);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Row actions
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null);
  const [actionLoadingSlug, setActionLoadingSlug] = useState<string | null>(null);
  const [openMenuSlug, setOpenMenuSlug] = useState<string | null>(null);

  // Bulk actions
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);

  // ── Data loading ───────────────────────────────────────────────────────────

  const refreshArticles = useCallback((skipRemote = false) => {
    const local = getAllArticleSummaries();
    setArticles(local);
    setUnreadInquiries(getUnreadInquiriesCount());
    setLoading(false);

    if (!skipRemote) {
      fetchAndSyncAllArticles()
        .then(synced => {
          setArticles(synced);
          setUnreadInquiries(getUnreadInquiriesCount());
        })
        .catch(err => console.error('Failed to sync articles in admin:', err));
    }
  }, []);

  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  // Close dropdown menu on outside click
  useEffect(() => {
    if (!openMenuSlug) return;
    const handler = () => setOpenMenuSlug(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuSlug]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = articles.length;
    const published = articles.filter(a => a.status === 'published').length;
    const drafts = articles.filter(a => a.status === 'draft').length;
    const scheduled = articles.filter(a => a.status === 'scheduled').length;
    const totalViews = articles.reduce((sum, a) => sum + (a.viewCount ?? 0), 0);
    const avgReadTime = total
      ? Math.round(articles.reduce((s, a) => s + (a.readTimeMinutes ?? 0), 0) / total)
      : 0;
    return { total, published, drafts, scheduled, totalViews, avgReadTime };
  }, [articles]);

  // ── Filtered & sorted list ─────────────────────────────────────────────────

  const filteredArticles = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = articles.filter(a => {
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        (a.excerpt ?? '').toLowerCase().includes(q) ||
        (a.seo?.primaryKeyword ?? '').toLowerCase().includes(q);
      const matchCat = categoryFilter === 'all' || a.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });

    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case 'newest':
          return new Date(b.updatedAt ?? b.publishedAt).getTime() - new Date(a.updatedAt ?? a.publishedAt).getTime();
        case 'oldest':
          return new Date(a.updatedAt ?? a.publishedAt).getTime() - new Date(b.updatedAt ?? b.publishedAt).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'most-views':
          return (b.viewCount ?? 0) - (a.viewCount ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [articles, search, categoryFilter, statusFilter, sortKey]);

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filteredArticles.length);
  const pageArticles = filteredArticles.slice(pageStart, pageEnd);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [search, categoryFilter, statusFilter, sortKey]);

  // ── Selection helpers ──────────────────────────────────────────────────────

  const allPageSelected =
    pageArticles.length > 0 && pageArticles.every(a => selected.has(a.slug));

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        pageArticles.forEach(a => next.delete(a.slug));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        pageArticles.forEach(a => next.add(a.slug));
        return next;
      });
    }
  }

  function toggleSelect(slug: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleSync = async () => {
    setSyncing(true);
    clearLocalArticleCache();
    try {
      const synced = await fetchAndSyncAllArticles();
      setArticles(synced);
      setUnreadInquiries(getUnreadInquiriesCount());
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const json = await exportAllArticlesAsJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `civilmath-articles-backup-${new Date().toISOString().split('T')[0]}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (slug: string) => {
    setActionLoadingSlug(slug);
    try {
      await deleteArticle(slug);
      setDeleteConfirmSlug(null);
      setSelected(prev => { const n = new Set(prev); n.delete(slug); return n; });
      await fetchAndSyncAllArticles();
      refreshArticles(false);
      showToast('Article deleted successfully.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete article.', 'error');
    } finally {
      setActionLoadingSlug(null);
    }
  };

  const handleDuplicate = async (article: Article) => {
    setActionLoadingSlug(article.slug);
    const newSlug = `${article.slug}-copy`;
    const duped: Article = {
      ...article,
      id: undefined,
      slug: newSlug,
      title: `${article.title} (Copy)`,
      status: 'draft',
      viewCount: 0,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBuiltin: false,
    };
    await saveArticle(duped);
    setActionLoadingSlug(null);
    refreshArticles(true);
  };

  const handleTogglePublish = async (article: Article) => {
    setActionLoadingSlug(article.slug);
    const updated: Article = {
      ...article,
      status: article.status === 'published' ? 'draft' : 'published',
      updatedAt: new Date().toISOString(),
    };
    await saveArticle(updated);
    setActionLoadingSlug(null);
    refreshArticles(true);
  };

  // ── Bulk actions ───────────────────────────────────────────────────────────

  const selectedSlugs = useMemo(() => Array.from(selected), [selected]);

  const handleBulkPublish = async () => {
    setBulkLoading(true);
    for (const slug of selectedSlugs) {
      const article = articles.find(a => a.slug === slug);
      if (article && article.status !== 'published') {
        await saveArticle({ ...article, status: 'published', updatedAt: new Date().toISOString() });
      }
    }
    setSelected(new Set());
    setBulkLoading(false);
    refreshArticles(true);
  };

  const handleBulkUnpublish = async () => {
    setBulkLoading(true);
    for (const slug of selectedSlugs) {
      const article = articles.find(a => a.slug === slug);
      if (article && article.status === 'published') {
        await saveArticle({ ...article, status: 'draft', updatedAt: new Date().toISOString() });
      }
    }
    setSelected(new Set());
    setBulkLoading(false);
    refreshArticles(true);
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    const count = selectedSlugs.length;
    try {
      for (const slug of selectedSlugs) {
        await deleteArticle(slug);
      }
      setSelected(new Set());
      setBulkDeleteConfirm(false);
      await fetchAndSyncAllArticles();
      refreshArticles(false);
      showToast(`${count} article(s) deleted successfully.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete selected articles.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Page numbers ───────────────────────────────────────────────────────────

  function getPageNumbers(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '…')[] = [1];
    if (safePage > 3) pages.push('…');
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
      pages.push(i);
    }
    if (safePage < totalPages - 2) pages.push('…');
    pages.push(totalPages);
    return pages;
  }

  // ── Shared class ─────────────────────────────────────────────────────────

  const secondaryBtn =
    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] hover:border-[#657565] transition-all cursor-pointer shadow-2xs';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-5">
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

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#20231F] dark:text-[#EAE7E0]">
              Articles
            </h1>
            <p className="text-xs text-[#7B8978] mt-0.5">
              Manage engineering articles, guides, formulas and calculator content
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sync Supabase */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className={secondaryBtn}
              title="Clear local browser storage and reload from Supabase"
            >
              {syncing
                ? <Loader2 className="w-3.5 h-3.5 text-[#657565] animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5 text-[#657565]" />}
              <span>{syncing ? 'Syncing…' : 'Sync Supabase'}</span>
            </button>

            {/* Bulk Upload */}
            <button
              onClick={() => setUploadModalOpen(true)}
              className={secondaryBtn}
            >
              <Upload className="w-3.5 h-3.5 text-[#657565]" />
              <span>Bulk Upload</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={handleExportAll}
              disabled={exporting}
              className={secondaryBtn}
              title="Download backup of all articles as JSON"
            >
              <Download className="w-3.5 h-3.5 text-[#7B8978]" />
              <span>{exporting ? 'Exporting…' : 'Export JSON'}</span>
            </button>

            {/* Contact Messages */}
            <button
              onClick={() => navigate('/admin/inquiries')}
              className={`${secondaryBtn} relative`}
              title="Review messages sent from Contact CivilMath"
            >
              <Mail className="w-3.5 h-3.5 text-[#657565]" />
              <span>Contact Messages</span>
              {unreadInquiries > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                  {unreadInquiries}
                </span>
              )}
            </button>

            {/* New Article (primary CTA) */}
            <button
              onClick={() => navigate('/admin/articles/new')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#657565] hover:bg-[#536153] text-white transition-all shadow-xs cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>+ New Article</span>
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Total Articles */}
          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Total</span>
              <FileText className="w-3.5 h-3.5 text-[#657565]" />
            </div>
            <div className="text-2xl font-black text-[#20231F] dark:text-[#EAE7E0]">{stats.total}</div>
            <div className="text-[10px] text-[#7B8978] mt-0.5">All articles</div>
          </div>

          {/* Published */}
          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Published</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{stats.published}</div>
            <div className="text-[10px] text-[#7B8978] mt-0.5">Live on site</div>
          </div>

          {/* Drafts */}
          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Drafts</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{stats.drafts}</div>
            <div className="text-[10px] text-[#7B8978] mt-0.5">Work in progress</div>
          </div>

          {/* Scheduled */}
          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Scheduled</span>
              <CalendarClock className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{stats.scheduled}</div>
            <div className="text-[10px] text-[#7B8978] mt-0.5">Queued for publish</div>
          </div>

          {/* Total Views */}
          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Views</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#657565]" />
            </div>
            <div className="text-2xl font-black text-[#20231F] dark:text-[#EAE7E0]">
              {stats.totalViews.toLocaleString()}
            </div>
            <div className="text-[10px] text-[#7B8978] mt-0.5">Across all articles</div>
          </div>

          {/* Avg Read Time */}
          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Read Time</span>
              <BookOpen className="w-3.5 h-3.5 text-[#657565]" />
            </div>
            <div className="text-2xl font-black text-[#20231F] dark:text-[#EAE7E0]">
              {stats.avgReadTime} <span className="text-sm font-normal">min</span>
            </div>
            <div className="text-[10px] text-[#7B8978] mt-0.5">Average read time</div>
          </div>
        </div>

        {/* ── Filter / Search bar ── */}
        <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7B8978]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles…"
              className="w-full text-xs pl-8 pr-8 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7B8978] hover:text-[#20231F] dark:hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:ml-auto">
            {/* Category */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer focus:border-[#657565] transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="concrete">Concrete &amp; Materials</option>
              <option value="structural">Structural Analysis</option>
              <option value="bbs">Rebar BBS</option>
              <option value="geotech">Geotechnical</option>
              <option value="survey">Surveying</option>
              <option value="utility">Utilities</option>
              <option value="general">General Civil</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer focus:border-[#657565] transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>

            {/* Sort */}
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="text-xs py-2 px-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer focus:border-[#657565] transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title-asc">Title A → Z</option>
              <option value="title-desc">Title Z → A</option>
              <option value="most-views">Most Views</option>
            </select>

            {/* Refresh */}
            <button
              onClick={() => refreshArticles()}
              title="Refresh list"
              className="p-2 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#252B25] text-[#7B8978] hover:text-[#20231F] dark:hover:text-white cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Bulk actions bar ── */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[#F3F1EC] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-2xl">
            <span className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0] mr-1">
              {selected.size} article{selected.size !== 1 ? 's' : ''} selected
            </span>

            <button
              onClick={handleBulkPublish}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors disabled:opacity-60"
            >
              <CheckCircle2 className="w-3 h-3" />
              Publish All
            </button>

            <button
              onClick={handleBulkUnpublish}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-colors disabled:opacity-60"
            >
              <Clock className="w-3 h-3" />
              Unpublish All
            </button>

            {bulkDeleteConfirm ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
                  Delete {selected.size} articles?
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors disabled:opacity-60"
                >
                  {bulkLoading ? 'Deleting…' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setBulkDeleteConfirm(false)}
                  className="px-2 py-1.5 rounded-lg text-[11px] text-[#7B8978] cursor-pointer hover:text-[#20231F] dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors disabled:opacity-60"
              >
                <Trash2 className="w-3 h-3" />
                Delete Selected
              </button>
            )}

            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto p-1.5 rounded-lg text-[#7B8978] hover:text-[#20231F] dark:hover:text-white cursor-pointer transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Table card ── */}
        <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl shadow-2xs overflow-hidden">

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-[#7B8978]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading articles…</span>
            </div>
          ) : filteredArticles.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#EAE7E0] dark:bg-[#2A312A] flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-[#7B8978]" />
              </div>
              <div className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] mb-1">
                No articles found
              </div>
              <div className="text-xs text-[#7B8978] max-w-xs">
                {search || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'No articles match the current filters. Try adjusting your search or filter criteria.'
                  : 'No articles yet. Start by writing your first article or bulk uploading a JSON batch.'}
              </div>
              {(search || categoryFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all'); }}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#657565] hover:bg-[#536153] text-white cursor-pointer transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[780px]">
                {/* ── Table head ── */}
                <thead className="bg-[#F3F1EC] dark:bg-[#252B25] border-b border-[#D8D0C2] dark:border-[#384238] text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B8978]">
                  <tr>
                    <th className="py-3 pl-4 pr-2 w-8">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded cursor-pointer accent-[#657565]"
                        title="Select all on this page"
                      />
                    </th>
                    <th className="py-3 px-3 min-w-[280px]">Article</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 hidden sm:table-cell">Author</th>
                    <th className="py-3 px-3 hidden md:table-cell">Views</th>
                    <th className="py-3 px-3 hidden md:table-cell">Read</th>
                    <th className="py-3 px-3 hidden lg:table-cell">Updated</th>
                    <th className="py-3 px-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>

                {/* ── Table body ── */}
                <tbody className="divide-y divide-[#D8D0C2]/50 dark:divide-[#333C33]">
                  {pageArticles.map(article => {
                    const isDeleting = deleteConfirmSlug === article.slug;
                    const isActionLoading = actionLoadingSlug === article.slug;
                    const isSelected = selected.has(article.slug);
                    const displayDate = article.updatedAt ?? article.publishedAt;

                    return (
                      <tr
                        key={article.slug}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-[#657565]/5 dark:bg-[#657565]/10'
                            : 'hover:bg-white/60 dark:hover:bg-[#242A24]/60'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 pl-4 pr-2 align-middle">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(article.slug)}
                            className="w-3.5 h-3.5 rounded cursor-pointer accent-[#657565]"
                          />
                        </td>

                        {/* Article column */}
                        <td className="py-3 px-3 align-middle">
                          <div className="flex items-center gap-3">
                            <ArticleThumbnail article={article} size={48} />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-[#20231F] dark:text-[#EAE7E0] leading-snug line-clamp-1">
                                {article.title}
                              </div>
                              <div className="text-[10px] text-[#7B8978] mt-0.5 line-clamp-1">
                                {truncate(article.excerpt, 80)}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                                    CATEGORY_COLORS[article.category] ?? CATEGORY_COLORS.general
                                  }`}
                                >
                                  {CATEGORY_NAMES[article.category] ?? article.category}
                                </span>
                                {article.isBuiltin && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#657565]/10 text-[#657565]">
                                    Built-in
                                  </span>
                                )}
                                {article.featured && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#D9B96E]/20 text-amber-700 dark:text-amber-400">
                                    ★ Featured
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap">
                          <StatusBadge status={article.status} />
                        </td>

                        {/* Author */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap hidden sm:table-cell text-[11px] text-[#555C55] dark:text-[#A4B2A4] max-w-[120px] truncate">
                          {article.author}
                        </td>

                        {/* Views */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap hidden md:table-cell text-[11px] font-mono text-[#7B8978]">
                          {formatViews(article.viewCount)}
                        </td>

                        {/* Reading time */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap hidden md:table-cell text-[11px] text-[#7B8978]">
                          {article.readTimeMinutes} min
                        </td>

                        {/* Updated date */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap hidden lg:table-cell text-[11px] text-[#7B8978]">
                          {formatDate(displayDate)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 pr-4 align-middle whitespace-nowrap text-right">
                          {isDeleting ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleDelete(article.slug)}
                                disabled={isActionLoading}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors disabled:opacity-60"
                              >
                                {isActionLoading ? 'Deleting…' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmSlug(null)}
                                className="px-2 py-1 text-[10px] text-[#7B8978] cursor-pointer hover:text-[#20231F] dark:hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-0.5 relative">
                              {/* Edit */}
                              <button
                                onClick={() => navigate(`/admin/articles/edit/${article.slug}`)}
                                className="p-1.5 rounded-lg text-[#657565] dark:text-[#9FB19F] hover:bg-[#657565]/10 transition-colors cursor-pointer"
                                title="Edit article"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Preview */}
                              <a
                                href={`/articles/${article.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-[#7B8978] hover:text-[#20231F] dark:hover:text-white hover:bg-[#EAE7E0] dark:hover:bg-[#2A312A] transition-colors"
                                title="Preview article in new tab"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </a>

                              {/* More actions dropdown */}
                              <div className="relative">
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setOpenMenuSlug(openMenuSlug === article.slug ? null : article.slug);
                                  }}
                                  disabled={isActionLoading}
                                  className="p-1.5 rounded-lg text-[#7B8978] hover:text-[#20231F] dark:hover:text-white hover:bg-[#EAE7E0] dark:hover:bg-[#2A312A] transition-colors cursor-pointer disabled:opacity-50"
                                  title="More actions"
                                >
                                  {isActionLoading
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <MoreHorizontal className="w-3.5 h-3.5" />}
                                </button>

                                {openMenuSlug === article.slug && (
                                  <div
                                    className="absolute right-0 top-full mt-1 z-50 w-44 bg-white dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-xl shadow-lg overflow-hidden"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    {/* Edit in JSON Editor */}
                                    <Link
                                      to={`/admin/articles/edit/${article.slug}?mode=json`}
                                      onClick={() => setOpenMenuSlug(null)}
                                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-[11px] font-medium text-[#20231F] dark:text-[#EAE7E0] hover:bg-[#F3F1EC] dark:hover:bg-[#252B25] cursor-pointer transition-colors"
                                    >
                                      <Code className="w-3.5 h-3.5 text-blue-600" />
                                      Edit in JSON Editor
                                    </Link>

                                    {/* Copy JSON */}
                                    <button
                                      onClick={() => {
                                        setOpenMenuSlug(null);
                                        navigator.clipboard.writeText(JSON.stringify(article, null, 2));
                                      }}
                                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-[11px] font-medium text-[#20231F] dark:text-[#EAE7E0] hover:bg-[#F3F1EC] dark:hover:bg-[#252B25] cursor-pointer transition-colors"
                                      title="Copy article JSON to clipboard"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-[#657565]" />
                                      Copy Raw JSON
                                    </button>

                                    {/* Duplicate */}
                                    <button
                                      onClick={() => {
                                        setOpenMenuSlug(null);
                                        handleDuplicate(article);
                                      }}
                                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-[11px] font-medium text-[#20231F] dark:text-[#EAE7E0] hover:bg-[#F3F1EC] dark:hover:bg-[#252B25] cursor-pointer transition-colors"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-[#657565]" />
                                      Duplicate as Draft
                                    </button>

                                    {/* Publish / Unpublish toggle */}
                                    <button
                                      onClick={() => {
                                        setOpenMenuSlug(null);
                                        handleTogglePublish(article);
                                      }}
                                      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-[11px] font-medium text-[#20231F] dark:text-[#EAE7E0] hover:bg-[#F3F1EC] dark:hover:bg-[#252B25] cursor-pointer transition-colors"
                                    >
                                      {article.status === 'published' ? (
                                        <>
                                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                                          Unpublish (→ Draft)
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          Publish Now
                                        </>
                                      )}
                                    </button>

                                    {/* Delete — not for built-ins */}
                                    {!article.isBuiltin && (
                                      <>
                                        <div className="border-t border-[#D8D0C2] dark:border-[#333C33] my-1" />
                                        <button
                                          onClick={() => {
                                            setOpenMenuSlug(null);
                                            setDeleteConfirmSlug(article.slug);
                                          }}
                                          className="flex items-center gap-2.5 w-full px-3 py-2.5 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          Delete Article
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination footer ── */}
          {!loading && filteredArticles.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-t border-[#D8D0C2] dark:border-[#333C33] bg-[#F3F1EC] dark:bg-[#252B25]">
              <span className="text-[11px] text-[#7B8978]">
                Showing <span className="font-bold text-[#20231F] dark:text-[#EAE7E0]">{pageStart + 1}</span>–
                <span className="font-bold text-[#20231F] dark:text-[#EAE7E0]">{pageEnd}</span> of{' '}
                <span className="font-bold text-[#20231F] dark:text-[#EAE7E0]">{filteredArticles.length}</span> articles
              </span>

              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-lg border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#1E221E] text-[#7B8978] hover:text-[#20231F] dark:hover:text-white hover:border-[#657565] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((num, idx) =>
                  num === '…' ? (
                    <span key={`ellipsis-${idx}`} className="px-1.5 text-[11px] text-[#7B8978]">…</span>
                  ) : (
                    <button
                      key={num}
                      onClick={() => setPage(num as number)}
                      className={`min-w-[28px] h-7 px-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        num === safePage
                          ? 'bg-[#657565] border-[#657565] text-white'
                          : 'border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#1E221E] text-[#7B8978] hover:border-[#657565] hover:text-[#20231F] dark:hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#1E221E] text-[#7B8978] hover:text-[#20231F] dark:hover:text-white hover:border-[#657565] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Upload Modal ── */}
        <AdminUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => refreshArticles()}
        />
      </div>
    </AdminLayout>
  );
}
