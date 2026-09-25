import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PenTool, Upload, Download, Search, Filter,
  FileText, ExternalLink, Trash2, Edit3, Sparkles,
  BarChart3, CheckCircle2, Clock, Globe, AlertCircle, RefreshCw, Mail
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import AdminUploadModal from './AdminUploadModal';
import { Article, ArticleCategory } from '../../types/article';
import { getAllArticleSummaries, deleteArticle, exportAllArticlesAsJson, fetchAndSyncAllArticles, clearLocalArticleCache } from '../../utils/articleStore';
import { auditArticleSeo } from '../../utils/autoSeo';
import { getUnreadInquiriesCount } from '../../utils/inquiryStore';

const CATEGORY_NAMES: Record<ArticleCategory, string> = {
  concrete: 'Concrete & Materials',
  structural: 'Structural Analysis',
  bbs: 'Rebar BBS',
  geotech: 'Geotechnical',
  survey: 'Surveying',
  utility: 'Engineering Utilities',
  general: 'General Engineering',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null);
  const [unreadInquiries, setUnreadInquiries] = useState(0);

  const refreshArticles = () => {
    const list = getAllArticleSummaries();
    setArticles(list);
    setUnreadInquiries(getUnreadInquiriesCount());
    fetchAndSyncAllArticles()
      .then(synced => setArticles(synced))
      .catch(err => console.error('Failed to sync articles in admin:', err));
  };

  useEffect(() => {
    refreshArticles();
  }, []);

  // Compute metrics
  const stats = useMemo(() => {
    const total = articles.length;
    const published = articles.filter(a => a.status === 'published').length;
    const drafts = total - published;
    
    // Average SEO score of top 10 articles
    const sample = articles.slice(0, 15);
    const scores = sample.map(a => auditArticleSeo(a).score);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return { total, published, drafts, avgScore };
  }, [articles]);

  // Filtered list
  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const matchSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.slug.toLowerCase().includes(search.toLowerCase()) ||
        a.seo?.primaryKeyword?.toLowerCase().includes(search.toLowerCase());

      const matchCat = categoryFilter === 'all' || a.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;

      return matchSearch && matchCat && matchStatus;
    });
  }, [articles, search, categoryFilter, statusFilter]);

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const json = await exportAllArticlesAsJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `civilmath-articles-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (slug: string) => {
    await deleteArticle(slug);
    setDeleteConfirmSlug(null);
    refreshArticles();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Title & Main Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#20231F] dark:text-[#EAE7E0]">
              Articles & Content Administration
            </h1>
            <p className="text-xs text-[#7B8978] mt-1">
              Publish, upload, manage articles, and run 1-click Auto SEO optimization across the CivilMath knowledge base.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                clearLocalArticleCache();
                refreshArticles();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] hover:border-[#657565] transition-all cursor-pointer shadow-2xs"
              title="Clear local browser storage and reload from Supabase"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#657565]" />
              <span>Sync Supabase</span>
            </button>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] hover:border-[#657565] transition-all cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-[#657565]" />
              <span>Bulk Upload Articles</span>
            </button>

            <button
              onClick={handleExportAll}
              disabled={exporting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] hover:border-[#657565] transition-all cursor-pointer shadow-2xs"
              title="Download backup of all articles as JSON"
            >
              <Download className="w-3.5 h-3.5 text-[#7B8978]" />
              <span>{exporting ? 'Exporting...' : 'Export All (JSON)'}</span>
            </button>

            <button
              onClick={() => navigate('/admin/inquiries')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] hover:border-[#657565] transition-all cursor-pointer shadow-2xs relative"
              title="Review messages sent from Contact CivilMath"
            >
              <Mail className="w-3.5 h-3.5 text-[#657565]" />
              <span>Contact Messages</span>
              {unreadInquiries > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                  {unreadInquiries}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('/admin/articles/new')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#657565] hover:bg-[#536153] text-white transition-all shadow-xs cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Write New Article</span>
            </button>
          </div>
        </div>

        {/* Unread Contact Messages Alert Banner */}
        {unreadInquiries > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/50 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  You have {unreadInquiries} unread inquiry message{unreadInquiries > 1 ? 's' : ''} from Contact CivilMath.
                </div>
                <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  Users have submitted questions and calculator reports waiting for response.
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/inquiries')}
              className="self-start sm:self-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs cursor-pointer shrink-0"
            >
              Open Inquiries
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[11px] font-bold font-mono uppercase tracking-wider">Total Articles</span>
              <FileText className="w-4 h-4 text-[#657565]" />
            </div>
            <div className="text-2xl font-black text-[#20231F] dark:text-[#EAE7E0]">{stats.total}</div>
            <div className="text-[10px] text-[#7B8978] mt-1">Available in public knowledge base</div>
          </div>

          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[11px] font-bold font-mono uppercase tracking-wider">Published</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{stats.published}</div>
            <div className="text-[10px] text-[#7B8978] mt-1">Live and indexable via /articles</div>
          </div>

          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[11px] font-bold font-mono uppercase tracking-wider">Drafts</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{stats.drafts}</div>
            <div className="text-[10px] text-[#7B8978] mt-1">Unpublished work in progress</div>
          </div>

          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[11px] font-bold font-mono uppercase tracking-wider">Avg SEO Score</span>
              <Sparkles className="w-4 h-4 text-[#D9B96E]" />
            </div>
            <div className="text-2xl font-black text-[#20231F] dark:text-[#EAE7E0] flex items-baseline gap-1">
              <span>{stats.avgScore}</span>
              <span className="text-xs font-normal text-[#7B8978]">/ 100</span>
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">High Google SERP compliance</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7B8978]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, slug, or keyword..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer"
            >
              <option value="all">All Categories ({articles.length})</option>
              <option value="concrete">Concrete & Materials</option>
              <option value="structural">Structural Analysis</option>
              <option value="bbs">Rebar BBS</option>
              <option value="geotech">Geotechnical</option>
              <option value="survey">Surveying</option>
              <option value="utility">Utilities</option>
              <option value="general">General Civil</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>

            <button
              onClick={refreshArticles}
              title="Refresh list"
              className="p-2 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#252B25] text-[#7B8978] hover:text-[#20231F] dark:hover:text-white cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Articles Table */}
        <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3F1EC] dark:bg-[#252B25] border-b border-[#D8D0C2] dark:border-[#384238] text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B8978]">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Article & Slug</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Primary Keyword</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SEO Health</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8D0C2]/50 dark:divide-[#333C33]">
                {filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#7B8978]">
                      No articles found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map(article => {
                    const audit = auditArticleSeo(article);
                    const isDeleting = deleteConfirmSlug === article.slug;

                    return (
                      <tr key={article.slug} className="hover:bg-white/40 dark:hover:bg-[#242A24]/40 transition-colors">
                        {/* Title & Slug */}
                        <td className="py-3.5 px-4 sm:px-6 min-w-[260px]">
                          <div className="font-bold text-[#20231F] dark:text-[#EAE7E0] leading-snug line-clamp-1">
                            {article.title}
                          </div>
                          <div className="text-[10px] font-mono text-[#7B8978] mt-0.5 flex items-center gap-1.5">
                            <span>/articles/{article.slug}</span>
                            {article.isBuiltin && (
                              <span className="px-1 py-0.2 rounded bg-[#657565]/10 text-[#657565] text-[9px] uppercase font-bold">
                                Built-in
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EAE7E0] dark:bg-[#2A312A] text-[#555C55] dark:text-[#A4B2A4]">
                            {CATEGORY_NAMES[article.category] || article.category}
                          </span>
                        </td>

                        {/* Primary Keyword */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] font-mono text-[#555C55] dark:text-[#A4B2A4]">
                          {article.seo?.primaryKeyword || '—'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              article.status === 'published'
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {article.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </td>

                        {/* SEO Health Score */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] font-mono ${
                                audit.score >= 80
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                  : audit.score >= 60
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                              }`}
                              title={`${audit.score}/100 - ${audit.status}`}
                            >
                              {audit.score}
                            </div>
                            <span className="text-[10px] text-[#7B8978] hidden sm:inline">
                              {audit.status === 'excellent' ? 'Optimal' : audit.status === 'good' ? 'Good' : 'Needs SEO'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View live article link */}
                            <Link
                              to={`/articles/${article.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[#7B8978] hover:text-[#20231F] dark:hover:text-white hover:bg-[#EAE7E0] dark:hover:bg-[#2A312A] transition-colors"
                              title="View published article"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            {/* Edit button */}
                            <button
                              onClick={() => navigate(`/admin/articles/edit/${article.slug}`)}
                              className="p-1.5 rounded-lg text-[#657565] dark:text-[#9FB19F] hover:bg-[#657565]/10 transition-colors cursor-pointer"
                              title="Edit article & SEO"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete custom article */}
                            {!article.isBuiltin && (
                              isDeleting ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(article.slug)}
                                    className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmSlug(null)}
                                    className="px-1.5 py-0.5 text-[10px] text-[#7B8978] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmSlug(article.slug)}
                                  className="p-1.5 rounded-lg text-[#94A094] hover:text-[#B56F50] hover:bg-[#FFF4EE] dark:hover:bg-[#2A1E1A] transition-colors cursor-pointer"
                                  title="Delete custom article"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Modal */}
        <AdminUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => refreshArticles()}
        />
      </div>
    </AdminLayout>
  );
}
