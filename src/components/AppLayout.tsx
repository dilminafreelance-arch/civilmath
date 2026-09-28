import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun, Moon, Menu, X, Bell,
  Home, Calculator, Search as SearchIcon, Keyboard,
  BookOpen, LayoutDashboard, MessageSquare, Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import GlobalSearch from './GlobalSearch';
import LeftSidebar from './LeftSidebar';
import RightUtilityPanel from './RightUtilityPanel';
import { ChatBot } from './ChatBot';

import NotificationsPanel from './NotificationsPanel';
import ShortcutHelpModal from './ShortcutHelpModal';
import SiteFooter from './SiteFooter';
import { Button } from './ui';

export default function AppLayout() {
  const { theme, toggleTheme, activeCalcId, unitSystem, setUnitSystem, currency, setCurrency, notificationCount } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const isArticlesActive = location.pathname.startsWith('/articles');
  const isCalculatorsActive =
    !isArticlesActive &&
    (location.pathname === '/' ||
      location.pathname.startsWith('/calculators') ||
      location.pathname.startsWith('/concrete') ||
      location.pathname.startsWith('/structural') ||
      location.pathname.startsWith('/geotechnical') ||
      location.pathname.startsWith('/surveying') ||
      location.pathname.startsWith('/bbs') ||
      location.pathname.startsWith('/utilities'));

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const notifButtonRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer on Escape / route change
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMobileMenuOpen(false); setNotifOpen(false); }
      // Press '?' (not inside input/textarea) to toggle shortcut modal
      if (e.key === '?' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setShortcutHelpOpen(prev => !prev);
      }
      // Ctrl+D → toggle theme
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleTheme();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [toggleTheme]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setNotifOpen(false);
    setChatOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen text-ink flex font-sans transition-colors duration-300">
      {/* 1. Left Sidebar (Desktop Persistent - hidden on article pages) */}
      {!isArticlesActive && (
        <LeftSidebar className="hidden xl:flex sticky top-0 h-screen" />
      )}

      {/* Mobile Drawer (Left Sidebar on small screens) */}
      <AnimatePresence>
        {mobileMenuOpen && !isArticlesActive && (
          <div className="fixed inset-0 z-50 xl:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 w-72 h-full shadow-2xl"
            >
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-surface-2 dark:bg-surface-3 text-ink-muted hover:text-ink shadow-xs cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
              <LeftSidebar onItemClick={() => setMobileMenuOpen(false)} className="w-full h-full" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Center Column + Header */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Floating Top Header */}
        <header className="sticky top-0 z-30 bg-surface-1/80 dark:bg-canvas-dark/80 backdrop-blur-xl px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 border-b border-border-subtle transition-colors max-w-full overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {/* Logo on Article pages when left sidebar is hidden */}
            {isArticlesActive && (
              <Link to="/" className="flex items-center gap-2 mr-1 no-underline text-ink shrink-0 group">
                <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                  CM
                </div>
                <span className="font-extrabold text-sm tracking-tight hidden sm:inline text-ink">
                  CivilMath
                </span>
              </Link>
            )}

            {/* Mobile Hamburger Button (only when not viewing articles) */}
            {!isArticlesActive && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="xl:hidden p-2 rounded-lg border border-border-subtle bg-surface-1 dark:bg-surface-2 text-ink dark:text-ink-dark hover:border-brand/50 transition-colors cursor-pointer shadow-2xs shrink-0"
                aria-label="Open navigation menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            {/* Calculators Link on Article pages */}
            {isArticlesActive && (
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium border-[#E2E6E2] dark:border-white/10 bg-white dark:bg-[#131715] text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-[#ECF2EE] no-underline shadow-2xs"
                title="Civil Engineering Calculators"
              >
                <Calculator className="w-3.5 h-3.5 text-[#7A8981]" />
                <span>Calculators</span>
              </Link>
            )}

            {/* Search Input with Ctrl+K */}
            <GlobalSearch />

            {/* Articles Tab (Hidden on small mobile screens since floating bottom nav provides direct access) */}
            <Link
              to="/articles"
              className={`hidden sm:inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors no-underline shadow-2xs ${
                isArticlesActive
                  ? 'border-brand/60 bg-brand/10 text-brand dark:text-brand-light font-semibold'
                  : 'border-[#E2E6E2] dark:border-white/10 bg-white dark:bg-[#131715] text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-[#ECF2EE] hover:border-[#2E6B56]/50 dark:hover:border-[#34D399]/40'
              }`}
              title="Engineering Articles"
            >
              <BookOpen className={`w-3.5 h-3.5 ${isArticlesActive ? 'text-brand dark:text-brand-light' : 'text-[#7A8981]'}`} />
              <span>Articles</span>
            </Link>

            {/* Dashboard Link */}
            <Link
              to="/dashboard"
              className={`hidden md:inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors no-underline shadow-2xs ${
                location.pathname === '/dashboard'
                  ? 'border-brand/60 bg-brand/10 text-brand dark:text-brand-light font-semibold'
                  : 'border-[#E2E6E2] dark:border-white/10 bg-white dark:bg-[#131715] text-[#526058] dark:text-[#97A69E] hover:text-[#141A16] dark:hover:text-[#ECF2EE] hover:border-[#2E6B56]/50 dark:hover:border-[#34D399]/40'
              }`}
              title="My Dashboard & Saved Calcs"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#7A8981]" />
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

            {/* Unit System Toggle — responsive pill */}
            <div className="flex rounded-lg overflow-hidden border border-border-subtle shadow-2xs">
              {(['metric', 'imperial'] as const).map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnitSystem(u)}
                  className={`px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] font-bold transition-colors cursor-pointer capitalize ${
                    unitSystem === u
                      ? 'bg-brand text-white'
                      : 'bg-surface-1 dark:bg-surface-2 text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark'
                  }`}
                  title={`${u === 'metric' ? 'Metric (SI: m, mm, kg, kN)' : 'Imperial (US: ft, in, lbs, kips)'}`}
                >
                  {u === 'imperial' ? (
                    <>
                      <span className="hidden sm:inline">Imperial</span>
                      <span className="sm:hidden">Imp</span>
                    </>
                  ) : (
                    'Metric'
                  )}
                </button>
              ))}
            </div>

            {/* Currency Select — inline */}
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="hidden md:block text-[10px] font-bold bg-surface-1 dark:bg-surface-2 border border-border-subtle rounded-lg px-2 py-1.5 text-ink dark:text-ink-dark cursor-pointer outline-none shadow-2xs"
              title="Change active currency"
            >
              {['USD','INR','EUR','GBP','AED','SGD'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Shortcut Help Button */}
            <button
              onClick={() => setShortcutHelpOpen(true)}
              className="hidden lg:flex p-2 rounded-lg border border-border-subtle bg-surface-1 dark:bg-surface-2 text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark hover:border-brand/50 transition-colors cursor-pointer shadow-2xs"
              title="Keyboard shortcuts (?)"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border-subtle bg-surface-1 dark:bg-surface-2 text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark hover:border-brand/50 transition-colors cursor-pointer shadow-2xs"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#F59E0B]" />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(prev => !prev)}
                className="relative p-2 rounded-lg border border-border-subtle bg-surface-1 dark:bg-surface-2 text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark hover:border-brand/50 transition-colors cursor-pointer shadow-2xs"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand rounded-full" />
                )}
              </button>
              <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>
          </div>
        </header>


        {/* Main Workspace Canvas */}
        <main className={`flex-1 w-full ${isArticlesActive ? 'max-w-7xl' : 'max-w-6xl'} mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-8`}>
          <Outlet />
        </main>

        {/* Global Site Footer */}
        <SiteFooter />
      </div>

      {/* 3. Right Utility Panel (Desktop Persistent on wide screens - hidden on article pages) */}
      {!isArticlesActive && (
        <RightUtilityPanel className="hidden 2xl:flex sticky top-0 h-screen" />
      )}

      {/* Floating Bottom Mobile Navigation Bar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 xl:hidden flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 bg-surface-1/90 dark:bg-surface-2/95 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-xl select-none touch-manipulation max-w-[calc(100vw-16px)]">
        <Link
          to="/"
          className={`flex flex-col items-center px-3 py-1 rounded-xl text-[10px] font-bold no-underline transition-colors ${
            location.pathname === '/' ? 'text-brand dark:text-brand-light bg-brand/10' : 'text-ink-muted dark:text-ink-muted-dark'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          to="/calculators"
          className={`flex flex-col items-center px-3 py-1 rounded-xl text-[10px] font-bold no-underline transition-colors ${
            isCalculatorsActive ? 'text-brand dark:text-brand-light bg-brand/10' : 'text-ink-muted dark:text-ink-muted-dark'
          }`}
        >
          <Calculator className="w-4 h-4 mb-0.5" />
          <span>Calculators</span>
        </Link>
        <button
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
          }}
          className="flex flex-col items-center px-3 py-1 rounded-xl text-[10px] font-bold text-ink-muted dark:text-ink-muted-dark transition-colors cursor-pointer"
        >
          <SearchIcon className="w-4 h-4 mb-0.5" />
          <span>Search</span>
        </button>
        <Link
          to="/articles"
          className={`flex flex-col items-center px-3 py-1 rounded-xl text-[10px] font-bold no-underline transition-colors ${
            isArticlesActive ? 'text-brand dark:text-brand-light bg-brand/10' : 'text-ink-muted dark:text-ink-muted-dark'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span>Articles</span>
        </Link>
        <button
          onClick={() => setChatOpen(prev => !prev)}
          className={`flex flex-col items-center px-2.5 sm:px-3 py-1 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
            chatOpen ? 'text-brand dark:text-brand-light bg-brand/10' : 'text-ink-muted dark:text-ink-muted-dark'
          }`}
          aria-label="Toggle Engineering Assistant AI"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 mb-0.5" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-brand rounded-full" />
          </div>
          <span>AI</span>
        </button>
      </div>

      {/* Floating ChatBot Assistant (Controlled from Mobile Bottom Bar or Desktop Floating Bubble) */}
      <ChatBot
        activeCalcId={activeCalcId}
        unitSystem={unitSystem}
        isOpen={chatOpen}
        onOpenChange={setChatOpen}
      />

      {/* Keyboard Shortcut Help Modal */}
      <ShortcutHelpModal open={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />
    </div>
  );
}
