import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun, Moon, Menu, X, Bell,
  Home, Calculator, Search as SearchIcon, Keyboard,
  BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import GlobalSearch from './GlobalSearch';
import LeftSidebar from './LeftSidebar';
import RightUtilityPanel from './RightUtilityPanel';
import { ChatBot } from './ChatBot';
import ProfileDropdown from './ProfileDropdown';
import NotificationsPanel from './NotificationsPanel';
import ShortcutHelpModal from './ShortcutHelpModal';
import SiteFooter from './SiteFooter';
import { Button } from './ui';

export default function AppLayout() {
  const { theme, toggleTheme, activeCalcId, unitSystem, notificationCount } = useApp();
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
  }, [location.pathname]);

  return (
    <div className="min-h-screen text-ink flex font-sans transition-colors duration-300">
      {/* 1. Left Sidebar (Desktop Persistent) */}
      <LeftSidebar className="hidden xl:flex sticky top-0 h-screen" />

      {/* Mobile Drawer (Left Sidebar on small screens) */}
      <AnimatePresence>
        {mobileMenuOpen && (
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
        <header className="sticky top-0 z-30 bg-surface-1/80 dark:bg-canvas-dark/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 border-b border-border-subtle transition-colors">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="xl:hidden p-2 rounded-lg border border-border-subtle bg-surface-1 dark:bg-surface-2 text-ink dark:text-ink-dark hover:border-brand/50 transition-colors cursor-pointer shadow-2xs"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Search Input with Ctrl+K */}
            <GlobalSearch />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Shortcut Help Button */}
            <button
              onClick={() => setShortcutHelpOpen(true)}
              className="hidden sm:flex p-2 rounded-lg border border-border-subtle bg-surface-1 dark:bg-surface-2 text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark hover:border-brand/50 transition-colors cursor-pointer shadow-2xs"
              title="Keyboard shortcuts (?)"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border-subtle bg-surface-1 dark:bg-surface-2 text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark hover:border-brand/50 transition-colors cursor-pointer shadow-2xs"
              title={theme === 'light' ? 'Switch to Obsidian Dark Mode' : 'Switch to Architectural Chalk Light Mode'}
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

            {/* User Profile Pill */}
            <ProfileDropdown />
          </div>
        </header>

        {/* Main Workspace Canvas */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-8">
          <Outlet />
        </main>

        {/* Global Site Footer */}
        <SiteFooter />
      </div>

      {/* 3. Right Utility Panel (Desktop Persistent on wide screens) */}
      <RightUtilityPanel className="hidden 2xl:flex sticky top-0 h-screen" />

      {/* Floating Bottom Mobile Navigation Bar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 xl:hidden flex items-center gap-1 px-3 py-1.5 bg-surface-1/90 dark:bg-surface-2/95 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-xl">
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
      </div>

      {/* Floating ChatBot Assistant */}
      <ChatBot activeCalcId={activeCalcId} unitSystem={unitSystem} />

      {/* Keyboard Shortcut Help Modal */}
      <ShortcutHelpModal open={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />
    </div>
  );
}
