import React, { ReactNode, useState, useEffect, FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ExternalLink, ArrowLeft, ShieldCheck,
  BookOpen, Lock, Mail, Eye, EyeOff, LogOut, AlertCircle, Loader2,
  KeyRound, ShieldAlert, ChevronDown, ChevronRight, PlusCircle,
  Tag, Image as ImageIcon, Calculator, Compass, Table as TableIcon,
  HelpCircle, Users, MessageSquare, BarChart3, Settings, Search,
  Sun, Moon, Bell, Menu, X, Layers, Sparkles
} from 'lucide-react';
import { SEOHead } from '../../utils/seo';
import { AdminAuthProvider, useAdminAuth } from '../../context/AdminAuthContext';
import { getUnreadInquiriesCount } from '../../utils/inquiryStore';

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminLoginForm() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your administrator email and password.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const res = await login(email.trim(), password);

      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your admin credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during login.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0B1528]">
      <div className="w-full max-w-md">
        {/* Header Card */}
        <div className="bg-[#101E33] border border-[#1E3050] rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">
              CivilMath Studio
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Articles &amp; Content Administration — Technical SEO Command Center
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-start gap-3 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="leading-relaxed font-medium">
                <div>{errorMessage}</div>
                {errorMessage.includes('not configured') && (
                  <div className="mt-2 pt-2 border-t border-red-800/60 text-[11px] text-red-300 font-normal">
                    To fix this, add <strong className="font-semibold text-white">ADMIN_EMAIL</strong> and <strong className="font-semibold text-white">ADMIN_PASSWORD</strong> in your hosting environment variables or local <code className="px-1 py-0.5 rounded bg-red-900/60 text-white">.env</code> file, then redeploy or restart the server.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@civilmath.com"
                  required
                  autoFocus
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1E3050] bg-[#0B1528] text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-[#1E3050] bg-[#0B1528] text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Admin Studio</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-[#1E3050] flex items-center gap-2.5 text-[11px] text-slate-400">
            <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              Server-side authentication enforced. Credentials are encrypted and verified securely.
            </span>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors no-underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to CivilMath Calculators</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const { isAuthenticated, isLoading, adminEmail, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [articlesExpanded, setArticlesExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setUnreadCount(getUnreadInquiriesCount());
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, [location.pathname]);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('civilmath_theme', 'light');
      setIsDarkMode(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('civilmath_theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Loading state during session check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1528] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="text-sm font-bold tracking-wide">CivilMath Studio</div>
        <div className="text-xs text-slate-400 mt-1">Verifying administrator session...</div>
      </div>
    );
  }

  // Unauthenticated: Render Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B1528] text-white flex flex-col font-sans transition-colors duration-200">
        <SEOHead
          meta={{
            title: 'Admin Authentication | CivilMath',
            description: 'CivilMath internal content administration sign in.',
            path: '/admin',
            noindex: true,
          }}
        />
        <AdminLoginForm />
      </div>
    );
  }

  const isArticlesPath = location.pathname.startsWith('/admin/articles') || location.pathname.startsWith('/admin/categories');
  const isAddNewArticle = location.pathname === '/admin/articles/new';
  const isAllArticles = location.pathname === '/admin/articles';
  const isCategories = location.pathname === '/admin/categories';
  const isDashboard = location.pathname === '/admin';
  const isInquiries = location.pathname === '/admin/inquiries';

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#070D18] text-slate-900 dark:text-slate-100 font-sans antialiased">
      <SEOHead
        meta={{
          title: 'Article Management Admin Studio | CivilMath',
          description: 'CivilMath internal content administration panel for publishing engineering articles and optimizing technical SEO.',
          path: '/admin',
          noindex: true,
        }}
      />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── LEFT DARK NAVY SIDEBAR ────────────────────────────────────── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0D192B] text-slate-300 flex flex-col justify-between border-r border-[#15233E] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top brand & nav */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Area */}
          <div className="p-5 border-b border-[#15233E]/80 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 no-underline group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                  CivilMath
                </div>
                <div className="text-[11px] text-slate-400 font-normal leading-none mt-0.5">
                  Engineering Calculators &amp; Guides
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs font-medium">
            {/* Dashboard */}
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl no-underline transition-all ${
                isDashboard
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#132238]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </Link>

            {/* Articles Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setArticlesExpanded(!articlesExpanded)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  isArticlesPath && !articlesExpanded
                    ? 'bg-blue-600/20 text-blue-400 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-[#132238]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">Articles</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    articlesExpanded ? 'rotate-180 text-blue-400' : 'text-slate-500'
                  }`}
                />
              </button>

              {/* Sub-menu */}
              {articlesExpanded && (
                <div className="pl-6 pr-2 py-1 space-y-1">
                  <Link
                    to="/admin/articles"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline transition-all ${
                      isAllArticles
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-[#132238]'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>All Articles</span>
                  </Link>

                  <Link
                    to="/admin/articles/new"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline transition-all ${
                      isAddNewArticle
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-[#132238]'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Add New Article</span>
                  </Link>

                  <Link
                    to="/admin/categories"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline transition-all ${
                      isCategories
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-[#132238]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span>Categories</span>
                  </Link>

                  <Link
                    to="/admin/articles"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline text-slate-400 hover:text-white hover:bg-[#132238] transition-all"
                  >
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span>Tags</span>
                  </Link>

                  <Link
                    to="/admin/articles"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline text-slate-400 hover:text-white hover:bg-[#132238] transition-all"
                  >
                    <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>Media Library</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Calculators */}
            <Link
              to="/calculators"
              target="_blank"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl no-underline text-slate-300 hover:text-white hover:bg-[#132238] transition-all"
            >
              <Calculator className="w-4 h-4 shrink-0" />
              <span>Calculators</span>
            </Link>

            {/* Diagrams */}
            <Link
              to="/guides"
              target="_blank"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl no-underline text-slate-300 hover:text-white hover:bg-[#132238] transition-all"
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>Diagrams</span>
            </Link>

            {/* Tables */}
            <Link
              to="/tables"
              target="_blank"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl no-underline text-slate-300 hover:text-white hover:bg-[#132238] transition-all"
            >
              <TableIcon className="w-4 h-4 shrink-0" />
              <span>Tables</span>
            </Link>

            {/* Formulas */}
            <Link
              to="/formulas"
              target="_blank"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl no-underline text-slate-300 hover:text-white hover:bg-[#132238] transition-all"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Formulas</span>
            </Link>

            {/* FAQs */}
            <Link
              to="/faq"
              target="_blank"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl no-underline text-slate-300 hover:text-white hover:bg-[#132238] transition-all"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>FAQs</span>
            </Link>

            {/* Users */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#132238] transition-all cursor-pointer">
              <Users className="w-4 h-4 shrink-0" />
              <span>Users</span>
            </div>

            {/* Comments / Inquiries */}
            <Link
              to="/admin/inquiries"
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl no-underline transition-all ${
                isInquiries
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#132238]'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Comments</span>
              </div>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Analytics */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#132238] transition-all cursor-pointer">
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Analytics</span>
            </div>

            {/* Settings */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#132238] transition-all cursor-pointer">
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </div>
          </nav>
        </div>

        {/* Bottom card: CivilMath v1.0.0 */}
        <div className="p-3">
          <div className="bg-[#091322] border border-[#162744] rounded-2xl p-3.5">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">CivilMath</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded-md">v1.0.0</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight m-0">
              Engineering Knowledge Made Simple
            </p>
          </div>
        </div>
      </aside>

      {/* ── RIGHT MAIN WRAPPER ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-[#0F172A] border-b border-gray-200 dark:border-slate-800/80 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & Search input */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles, categories..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Right: Actions & User Avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Site */}
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors no-underline"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>View Site</span>
            </Link>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  3
                </span>
              </button>
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 pl-2 py-1 pr-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                  D
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    Admin
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Administrator
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#101E33] border border-gray-200 dark:border-[#1E3050] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Admin Administrator</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{adminEmail || 'admin@civilmath.com'}</div>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/admin/inquiries"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/80 rounded-lg no-underline"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                      <span>User Inquiries</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 w-full bg-[#F8FAFC] dark:bg-[#070D18] p-4 sm:p-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  );
}
