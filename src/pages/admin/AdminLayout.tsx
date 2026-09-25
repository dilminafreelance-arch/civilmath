import React, { ReactNode, useState, FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PenTool, ExternalLink, ArrowLeft, ShieldCheck,
  BookOpen, Lock, Mail, Eye, EyeOff, LogOut, AlertCircle, Loader2,
  KeyRound, ShieldAlert
} from 'lucide-react';
import { SEOHead } from '../../utils/seo';
import { AdminAuthProvider, useAdminAuth } from '../../context/AdminAuthContext';

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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Card */}
        <div className="bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] rounded-3xl p-8 shadow-xl shadow-stone-900/5 dark:shadow-none">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#657565]/15 dark:bg-[#657565]/25 border border-[#657565]/30 text-[#657565] dark:text-[#9FB19F] mx-auto flex items-center justify-center mb-4">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-[#20231F] dark:text-[#EAE7E0] tracking-tight mb-2">
              CivilMath Studio
            </h1>
            <p className="text-xs text-[#7B8978] dark:text-[#A1AFA0] leading-relaxed max-w-xs mx-auto">
              Articles & Content Administration — Technical SEO Command Center
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="leading-relaxed font-medium">
                <div>{errorMessage}</div>
                {errorMessage.includes('not configured') && (
                  <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-900/50 text-[11px] text-red-600 dark:text-red-300 font-normal">
                    To fix this, add <strong className="font-semibold">ADMIN_EMAIL</strong> and <strong className="font-semibold">ADMIN_PASSWORD</strong> in your hosting environment variables (e.g. Vercel Project Settings &rarr; Environment Variables) or local <code className="px-1 py-0.5 rounded bg-red-100 dark:bg-red-900/50">.env</code> file, then redeploy or restart the server.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7B8978] dark:text-[#9FB19F] mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B8978]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@civilmath.com"
                  required
                  autoFocus
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#151815] text-[#20231F] dark:text-[#EAE7E0] text-sm focus:outline-none focus:ring-2 focus:ring-[#657565] focus:border-transparent transition-all placeholder:text-[#9FB19F]/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7B8978] dark:text-[#9FB19F] mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7B8978]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-white dark:bg-[#151815] text-[#20231F] dark:text-[#EAE7E0] text-sm focus:outline-none focus:ring-2 focus:ring-[#657565] focus:border-transparent transition-all placeholder:text-[#9FB19F]/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8978] hover:text-[#20231F] dark:hover:text-[#EAE7E0] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#657565] hover:bg-[#536153] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
          <div className="mt-6 pt-5 border-t border-[#D8D0C2]/60 dark:border-[#333C33] flex items-center gap-2.5 text-[11px] text-[#7B8978] dark:text-[#8E9D8D]">
            <ShieldAlert className="w-4 h-4 text-[#657565] shrink-0" />
            <span>
              Server-side authentication enforced. Credentials are encrypted and verified against server environment variables.
            </span>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors no-underline"
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

  const isNew = location.pathname.includes('/new');
  const isDashboard = location.pathname === '/admin' || location.pathname === '/admin/articles';

  // Loading state during session check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F1EC] dark:bg-[#1A1D1A] flex flex-col items-center justify-center text-[#20231F] dark:text-[#EAE7E0]">
        <div className="w-12 h-12 rounded-2xl bg-[#657565]/20 text-[#657565] flex items-center justify-center mb-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="text-sm font-bold tracking-wide">CivilMath Studio</div>
        <div className="text-xs text-[#7B8978] mt-1">Verifying administrator session...</div>
      </div>
    );
  }

  // Unauthenticated: Render Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F3F1EC] dark:bg-[#1A1D1A] text-[#20231F] dark:text-[#EAE7E0] flex flex-col font-sans transition-colors duration-200">
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

  // Authenticated: Render Admin Panel with Full Studio Controls
  return (
    <div className="min-h-screen bg-[#F3F1EC] dark:bg-[#1A1D1A] text-[#20231F] dark:text-[#EAE7E0] flex flex-col font-sans transition-colors duration-200">
      <SEOHead
        meta={{
          title: 'Article Management Admin Studio | CivilMath',
          description: 'CivilMath internal content administration panel for publishing engineering articles and optimizing technical SEO.',
          path: '/admin',
          noindex: true,
        }}
      />

      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 dark:bg-[#1E221E]/90 backdrop-blur-md border-b border-[#D8D0C2] dark:border-[#333C33] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-[#20231F] dark:text-[#EAE7E0] no-underline group"
              title="Return to CivilMath Home"
            >
              <div className="w-8 h-8 rounded-xl bg-[#657565] text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                CM
              </div>
              <div>
                <div className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
                  CivilMath Studio
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#657565]/15 text-[#657565] dark:text-[#9FB19F] font-mono font-bold">
                    ADMIN
                  </span>
                </div>
                <div className="text-[10px] text-[#7B8978]">Articles & SEO Command Center</div>
              </div>
            </Link>

            <span className="hidden sm:inline-block w-px h-5 bg-[#D8D0C2] dark:bg-[#384238]" />

            {/* Navigation Pills */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold no-underline transition-colors flex items-center gap-1.5 ${
                  isDashboard
                    ? 'bg-[#EAE7E0] dark:bg-[#2A312A] text-[#20231F] dark:text-white'
                    : 'text-[#7B8978] hover:text-[#20231F] dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                All Articles & Overview
              </Link>
              <Link
                to="/admin/articles/new"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold no-underline transition-colors flex items-center gap-1.5 ${
                  isNew
                    ? 'bg-[#657565] text-white shadow-xs'
                    : 'text-[#7B8978] hover:text-[#20231F] dark:hover:text-white'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                Write New Article
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Live Articles */}
            <Link
              to="/articles"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#657565] dark:text-[#A1B3A1] hover:bg-[#EAE7E0]/60 dark:hover:bg-[#2A312A] no-underline transition-colors border border-[#D8D0C2] dark:border-[#384238]"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>View Live Articles</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>

            {/* Logged in admin badge */}
            {adminEmail && (
              <div
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#EAE7E0]/70 dark:bg-[#2A312A] text-[11px] font-mono text-[#526052] dark:text-[#A1B3A1] border border-[#D8D0C2]/50 dark:border-[#384238]/50"
                title={`Authenticated as ${adminEmail}`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#657565]" />
                <span className="max-w-[140px] truncate">{adminEmail}</span>
              </div>
            )}

            {/* Sign Out Button */}
            <button
              onClick={() => logout()}
              title="Sign out of Admin Studio"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors border border-red-200/60 dark:border-red-900/50 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            {/* Back to App */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer Disclaimer */}
      <footer className="border-t border-[#D8D0C2]/60 dark:border-[#333C33] px-4 py-4 text-center text-[10px] text-[#7B8978]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#657565]" />
            <span>CivilMath Administration — Protected Content Management & Auto SEO System</span>
          </div>
          <p className="m-0">
            Internal use only. All published engineering articles must include safety disclaimers and code references.
          </p>
        </div>
      </footer>
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
