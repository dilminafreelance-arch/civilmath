import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun, Moon, Menu, X, Bell,
  Home, Calculator, Search as SearchIcon, Wrench, Keyboard,
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
    <div className="min-h-screen text-[#161A2C] dark:text-[#E7EAF7] flex font-sans transition-colors duration-300">
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
                className="absolute top-4 right-4 p-2 rounded-xl bg-[#141830] text-[#7C88B8] shadow-xs cursor-pointer"
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
        <header className="sticky top-0 z-30 bg-white/60 dark:bg-[#0B0D16]/70 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 border-b border-white/60 dark:border-[#232A3D]">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="xl:hidden p-2 rounded-xl border border-[#DCE3F5] dark:border-[#2A3350] backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 text-[#161A2C] dark:text-[#E7EAF7] hover:border-[#7C88B8] transition-colors cursor-pointer shadow-2xs"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Search Input with Ctrl+K */}
            <GlobalSearch />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Shortcut Help Button */}
            <button
              onClick={() => setShortcutHelpOpen(true)}
              className="hidden sm:flex p-2 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-[#FAF8F5] dark:bg-[#242A24] text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
              title="Keyboard shortcuts (?)"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-[#DCE3F5] dark:border-[#2A3350] backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 text-[#7C88B8] hover:text-[#161A2C] dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
              title={theme === 'light' ? 'Switch to Warm Studio Mode' : 'Switch to Warm Light Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#D9B96E]" />}
            </button>

            {/* Notifications Bell */}
            <button
              className="relative p-2 rounded-xl border border-[#DCE3F5] dark:border-[#2A3350] backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 text-[#7C88B8] hover:text-[#161A2C] dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#B56F50] rounded-full" />
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2">
              <div className="w-8 h-8 rounded-full bg-[#4C5FE0] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                E
              </div>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-[10px] text-[#7C88B8] font-medium">Good to see you!</span>
                <span className="text-xs font-bold text-[#161A2C] dark:text-[#E7EAF7]">Engineer</span>
              </div>
            </div>

            {/* User Profile Pill — now functional */}
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
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 xl:hidden flex items-center gap-1 px-3 py-2 bg-white/90 dark:bg-[#11141F]/90 backdrop-blur-xl border border-[#DCE3F5] dark:border-[#2A3350] rounded-2xl shadow-xl">
        <Link
          to="/"
          className={`flex flex-col items-center px-3 py-1 rounded-xl text-[10px] font-bold no-underline transition-colors ${
            location.pathname === '/' ? 'text-[#4C5FE0] bg-[#E7EAF7]/60 dark:bg-[#1D2438]' : 'text-[#7C88B8]'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          to="/calculators"
          className={`flex flex-col items-center px-3 py-1 rounded-xl text-[10px] font-bold no-underline transition-colors ${
            location.pathname.startsWith('/calculators') || location.pathname.startsWith('/concrete') ? 'text-[#4C5FE0] bg-[#E7EAF7]/60 dark:bg-[#1D2438]' : 'text-[#7C88B8]'
          }`}
        >
          <Calculator className="w-4 h-4 mb-0.5" />
          <span>Calculators</span>
        </Link>
        <button
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
          }}
          className="flex flex-col items-center px-3 py-1 rounded-xl text-[10px] font-bold text-[#7C88B8] transition-colors cursor-pointer"
        >
          <SearchIcon className="w-4 h-4 mb-0.5" />
          <span>Search</span>
        </button>
        <Link
          to="/articles"
          className={`flex flex-col items-center px-3 py-1 rounded-xl text-[10px] font-bold no-underline transition-colors ${
            location.pathname.startsWith('/construction') ? 'text-[#4C5FE0] bg-[#E7EAF7]/60 dark:bg-[#1D2438]' : 'text-[#7C88B8]'
          }`}
        >
          <Wrench className="w-4 h-4 mb-0.5" />
          <span>Tools</span>
        </Link>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          className="flex flex-col items-center px-3 py-1 rounded-xl text-[10px] font-bold text-[#7B8978] transition-colors cursor-pointer"
        >
          <SearchIcon className="w-4 h-4 mb-0.5" />
          <span>Search</span>
        </button>
      </div>

      {/* Floating ChatBot Assistant */}
      <ChatBot activeCalcId={activeCalcId} unitSystem={unitSystem} />

      {/* Keyboard Shortcut Help Modal */}
      <ShortcutHelpModal open={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />
    </div>
  );
}
