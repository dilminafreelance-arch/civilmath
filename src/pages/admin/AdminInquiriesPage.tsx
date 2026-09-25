import { useState, useEffect, useMemo } from 'react';
import {
  Mail, MessageSquare, Search, Filter, Trash2, CheckCircle2,
  Clock, AlertCircle, RefreshCw, Send, Eye, EyeOff, Archive,
  User, Calendar, ExternalLink, HelpCircle
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { SEOHead } from '../../utils/seo';
import { ContactInquiry, InquiryStatus } from '../../types/inquiry';
import {
  getAllLocalInquiries,
  fetchAndSyncInquiries,
  updateInquiryStatus,
  deleteInquiry
} from '../../utils/inquiryStore';

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await fetchAndSyncInquiries();
      setInquiries(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial local read then sync
    setInquiries(getAllLocalInquiries());
    refresh();
  }, []);

  // Compute metrics
  const stats = useMemo(() => {
    const total = inquiries.length;
    const unread = inquiries.filter(i => i.status === 'unread').length;
    const replied = inquiries.filter(i => i.status === 'replied').length;
    const calculatorIssues = inquiries.filter(i => i.category.toLowerCase().includes('calculator')).length;
    return { total, unread, replied, calculatorIssues };
  }, [inquiries]);

  // Categories present
  const availableCategories = useMemo(() => {
    const cats = new Set(inquiries.map(i => i.category).filter(Boolean));
    return Array.from(cats);
  }, [inquiries]);

  // Filtered inquiries
  const filtered = useMemo(() => {
    return inquiries.filter(inq => {
      const matchSearch =
        !search.trim() ||
        inq.name.toLowerCase().includes(search.toLowerCase()) ||
        inq.email.toLowerCase().includes(search.toLowerCase()) ||
        (inq.subject && inq.subject.toLowerCase().includes(search.toLowerCase())) ||
        inq.message.toLowerCase().includes(search.toLowerCase()) ||
        inq.category.toLowerCase().includes(search.toLowerCase());

      const matchCategory = categoryFilter === 'all' || inq.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || inq.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [inquiries, search, categoryFilter, statusFilter]);

  const handleStatusChange = async (id: string, newStatus: InquiryStatus) => {
    await updateInquiryStatus(id, newStatus);
    setInquiries(prev => prev.map(i => (i.id === id ? { ...i, status: newStatus } : i)));
  };

  const handleDelete = async (id: string) => {
    await deleteInquiry(id);
    setDeleteConfirmId(null);
    setInquiries(prev => prev.filter(i => i.id !== id));
  };

  const handleReply = (inquiry: ContactInquiry) => {
    handleStatusChange(inquiry.id, 'replied');
    const subject = encodeURIComponent(`Re: ${inquiry.subject || 'CivilMath Inquiry'}`);
    const body = encodeURIComponent(
      `Hi ${inquiry.name},\n\nThank you for reaching out to CivilMath regarding "${inquiry.category}".\n\n\n\n---\nOriginal message:\n${inquiry.message}\n`
    );
    window.location.href = `mailto:${inquiry.email}?subject=${subject}&body=${body}`;
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <AdminLayout>
      <SEOHead
        meta={{
          title: 'Contact Inquiries | CivilMath Admin Studio',
          description: 'Review and manage contact inquiries submitted via CivilMath.',
          path: '/admin/inquiries',
          noindex: true,
        }}
      />
      <div className="space-y-6 text-left">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#20231F] dark:text-[#EAE7E0]">
                Contact Inquiries &amp; Messages
              </h1>
              {stats.unread > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50">
                  {stats.unread} new
                </span>
              )}
            </div>
            <p className="text-xs text-[#7B8978] mt-1">
              Review and reply to questions, feedback, and issue reports submitted via the Contact CivilMath desk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF9F6] dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] hover:border-[#657565] transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#657565] ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh Messages'}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[11px] font-bold font-mono uppercase tracking-wider">Total Received</span>
              <MessageSquare className="w-4 h-4 text-[#657565]" />
            </div>
            <div className="text-2xl font-black text-[#20231F] dark:text-[#EAE7E0]">{stats.total}</div>
            <div className="text-[10px] text-[#7B8978] mt-1">From Contact CivilMath form</div>
          </div>

          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[11px] font-bold font-mono uppercase tracking-wider">Unread</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{stats.unread}</div>
            <div className="text-[10px] text-[#7B8978] mt-1">Requires admin review</div>
          </div>

          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[11px] font-bold font-mono uppercase tracking-wider">Replied</span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{stats.replied}</div>
            <div className="text-[10px] text-[#7B8978] mt-1">Answered via email</div>
          </div>

          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between text-[#7B8978] mb-2">
              <span className="text-[11px] font-bold font-mono uppercase tracking-wider">Calculator Reports</span>
              <HelpCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{stats.calculatorIssues}</div>
            <div className="text-[10px] text-[#7B8978] mt-1">Formula &amp; tool inquiries</div>
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
              placeholder="Search sender, email, subject, keyword..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#151815] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#657565] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs text-[#7B8978]">
              <Filter className="w-3 h-3 text-[#657565]" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 bg-white dark:bg-[#151815] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer focus:border-[#657565]"
              >
                <option value="all">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-white dark:bg-[#151815] border border-[#D8D0C2] dark:border-[#384238] rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none cursor-pointer focus:border-[#657565]"
            >
              <option value="all">All Statuses</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Inquiries List */}
        {filtered.length === 0 ? (
          <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-3xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#657565]/15 text-[#657565] mx-auto flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-[#20231F] dark:text-[#EAE7E0]">
              No inquiries found
            </h2>
            <p className="text-xs text-[#7B8978] max-w-sm mx-auto">
              {search || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'No inquiries matched your current filter criteria. Try clearing search filters.'
                : 'Any messages sent from the Contact CivilMath page will automatically appear here in your admin dashboard.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(inquiry => {
              const isUnread = inquiry.status === 'unread';
              const isReplied = inquiry.status === 'replied';

              return (
                <div
                  key={inquiry.id}
                  className={`bg-[#FAF9F6] dark:bg-[#1E221E] border rounded-2xl p-5 sm:p-6 transition-all shadow-2xs space-y-4 ${
                    isUnread
                      ? 'border-emerald-500/50 dark:border-emerald-500/40 bg-emerald-50/15 dark:bg-emerald-950/10'
                      : 'border-[#D8D0C2] dark:border-[#333C33]'
                  }`}
                >
                  {/* Top Bar: Sender details, category badge, and status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D8D0C2]/60 dark:border-[#333C33]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#657565]/15 text-[#657565] dark:text-[#9FB19F] flex items-center justify-center font-bold text-xs shrink-0">
                        {inquiry.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] truncate">
                            {inquiry.name}
                          </span>
                          <span className="text-xs text-[#7B8978] font-mono">
                            &lt;{inquiry.email}&gt;
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#7B8978] mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(inquiry.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {/* Category Pill */}
                      <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-[#EAE7E0] dark:bg-[#252B25] text-[#526052] dark:text-[#A1B3A1] border border-[#D8D0C2]/60 dark:border-[#384238]">
                        {inquiry.category}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isUnread
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : isReplied
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : 'bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        {isReplied && <CheckCircle2 className="w-3 h-3" />}
                        <span className="capitalize">{inquiry.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Subject (if present) */}
                  {inquiry.subject && (
                    <div className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">
                      Subject: <span className="font-medium text-[#526052] dark:text-[#C5D0C5]">{inquiry.subject}</span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="p-4 rounded-xl bg-white dark:bg-[#151815] border border-[#D8D0C2]/70 dark:border-[#384238] text-xs leading-relaxed text-[#20231F] dark:text-[#EAE7E0] whitespace-pre-wrap font-sans">
                    {inquiry.message}
                  </div>

                  {/* Bottom Action Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      {/* Reply Button */}
                      <button
                        onClick={() => handleReply(inquiry)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#657565] hover:bg-[#526052] text-white transition-all shadow-2xs cursor-pointer"
                        title="Open email composer and mark as replied"
                      >
                        <Send className="w-3 h-3" />
                        <span>Reply via Email</span>
                      </button>

                      {/* Toggle Read/Unread */}
                      {isUnread ? (
                        <button
                          onClick={() => handleStatusChange(inquiry.id, 'read')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#20231F] dark:text-[#EAE7E0] hover:border-[#657565] transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-[#657565]" />
                          <span>Mark as Read</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(inquiry.id, 'unread')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <EyeOff className="w-3 h-3" />
                          <span>Mark Unread</span>
                        </button>
                      )}

                      {/* Archive button */}
                      {inquiry.status !== 'archived' && (
                        <button
                          onClick={() => handleStatusChange(inquiry.id, 'archived')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer"
                          title="Archive message"
                        >
                          <Archive className="w-3 h-3" />
                          <span>Archive</span>
                        </button>
                      )}
                    </div>

                    {/* Delete action */}
                    <div>
                      {deleteConfirmId === inquiry.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-red-600 font-semibold">Delete message?</span>
                          <button
                            onClick={() => handleDelete(inquiry.id)}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Yes, delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2.5 py-1 rounded-lg border border-[#D8D0C2] dark:border-[#384238] text-[11px] font-semibold text-[#7B8978] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(inquiry.id)}
                          className="p-1.5 rounded-xl text-[#7B8978] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
