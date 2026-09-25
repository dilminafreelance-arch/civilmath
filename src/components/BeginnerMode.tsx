import { useState } from 'react';
import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Sparkles, Lightbulb, X, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

export function BeginnerToggle({ enabled, onChange }: {
  enabled: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
        enabled
          ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E] shadow-xs'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
      }`}
    >
      <Sparkles className={`w-3.5 h-3.5 ${enabled ? 'text-[#22C55E]' : ''}`} />
      <span>{enabled ? 'Beginner Mode ON' : 'Beginner Mode'}</span>
    </button>
  );
}

interface HelpContent {
  title: string;
  what: string;
  why: string;
  example?: string;
  tip?: string;
}

export function HelpPopover({ content, children }: {
  content: HelpContent; children?: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-lg text-slate-300 hover:text-[#2563EB] hover:bg-[#2563EB]/10 transition-all cursor-pointer"
        title="Learn more"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 w-72 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{content.title}</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-slate-500 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2 text-[10px] leading-relaxed">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">What is this? </span>
                <span className="text-slate-500">{content.what}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Why it matters: </span>
                <span className="text-slate-500">{content.why}</span>
              </div>
              {content.example && (
                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Example: </span>
                  <span className="text-slate-500">{content.example}</span>
                </div>
              )}
              {content.tip && (
                <div className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400">
                  <BookOpen className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{content.tip}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}

export function CollapsibleSection({ title, defaultOpen = false, children }: {
  title: string; defaultOpen?: boolean; children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer"
      >
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          {title}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 py-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
