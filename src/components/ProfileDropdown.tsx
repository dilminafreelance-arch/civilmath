import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Settings, LayoutDashboard,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'AED', 'SGD'];

export default function ProfileDropdown() {
  const { userName, unitSystem, setUnitSystem, currency, setCurrency, toggleTheme, theme } = useApp();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => { setOpen(prev => !prev); }}
        className="flex items-center gap-2 pl-1 sm:pl-2 rounded-xl hover:bg-[#ECF2EE]/60 dark:hover:bg-[#181E1A] p-1.5 transition-colors cursor-pointer"
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs shadow-2xs select-none">
          {initials}
        </div>
        <div className="hidden md:flex flex-col text-left leading-tight">
          <span className="text-[10px] text-[#7A8981] font-medium">Good to see you!</span>
          <span className="text-xs font-bold text-[#141A16] dark:text-[#ECF2EE]">{userName}</span>
        </div>
        <ChevronDown className={`hidden md:block w-3.5 h-3.5 text-[#7A8981] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 backdrop-blur-xl backdrop-saturate-150 bg-[#F2F5F3]/95 dark:bg-[#131715]/95 border border-[#E2E6E2] dark:border-[#1A211D] rounded-2xl shadow-xl z-50 overflow-hidden text-left"
          >

            {/* Settings */}
            <div className="p-3 space-y-3 border-b border-[#E2E6E2] dark:border-[#1A211D]">
              {/* Unit System */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#7A8981] dark:text-[#7A8981]">Unit System</span>
                <div className="flex rounded-lg overflow-hidden border border-[#E2E6E2] dark:border-[#1A211D]">
                  {(['metric', 'imperial'] as const).map(u => (
                    <button
                      key={u}
                      onClick={() => setUnitSystem(u)}
                      className={`px-2.5 py-1 text-[10px] font-bold transition-colors cursor-pointer capitalize ${
                        unitSystem === u
                          ? 'bg-brand text-white'
                          : 'bg-white dark:bg-[#181E1A] text-[#7A8981] hover:text-[#141A16] dark:hover:text-white'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#7A8981] dark:text-[#7A8981]">Currency</span>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="text-[10px] font-bold bg-white dark:bg-[#181E1A] border border-[#E2E6E2] dark:border-[#1A211D] rounded-lg px-2 py-1 text-[#141A16] dark:text-[#ECF2EE] cursor-pointer outline-none"
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#7A8981] dark:text-[#7A8981]">Appearance</span>
                <button
                  onClick={toggleTheme}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-[#181E1A] border border-[#E2E6E2] dark:border-[#1A211D] text-[#7A8981] hover:text-[#141A16] dark:hover:text-white cursor-pointer transition-colors"
                >
                  {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </button>
              </div>
            </div>

            {/* Nav Links */}
            <div className="p-2 space-y-0.5">
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#141A16] dark:text-[#ECF2EE] hover:bg-[#ECF2EE]/60 dark:hover:bg-[#181E1A] no-underline transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-brand" />
                My Dashboard &amp; Saved Calcs
              </Link>
              <Link
                to="/about"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#7A8981] hover:text-[#141A16] dark:hover:text-white hover:bg-[#ECF2EE]/60 dark:hover:bg-[#181E1A] no-underline transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#7A8981]" />
                About CivilMath
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#7A8981] hover:text-[#141A16] dark:hover:text-white hover:bg-[#ECF2EE]/60 dark:hover:bg-[#181E1A] cursor-pointer transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Press <kbd className="mx-1 px-1.5 py-0.5 rounded border border-[#E2E6E2] dark:border-[#1A211D] bg-white dark:bg-[#181E1A] text-[9px] font-mono text-[#141A16] dark:text-[#ECF2EE]">?</kbd> for shortcuts
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
