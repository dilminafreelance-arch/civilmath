import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open calculator search' },
      { keys: ['Esc'], description: 'Close any open panel or modal' },
      { keys: ['?'], description: 'Toggle this shortcut help panel' },
    ],
  },
  {
    title: 'Calculator',
    shortcuts: [
      { keys: ['Enter'], description: 'Run / recalculate active calculator' },
      { keys: ['Ctrl', 'S'], description: 'Save current calculation result' },
      { keys: ['Ctrl', 'P'], description: 'Export result to PDF' },
    ],
  },
  {
    title: 'Workspace',
    shortcuts: [
      { keys: ['Ctrl', 'D'], description: 'Toggle dark / light mode' },
      { keys: ['Ctrl', 'N'], description: 'Open sticky notes pad' },
    ],
  },
];

interface ShortcutHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutHelpModal({ open, onClose }: ShortcutHelpModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md backdrop-blur-xl backdrop-saturate-150 bg-[#F2F5F3]/95 dark:bg-[#131715]/95 border border-[#E2E6E2] dark:border-[#1A211D] rounded-2xl shadow-2xl overflow-hidden text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E6E2] dark:border-[#1A211D]">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-brand" />
                <h2 className="text-sm font-bold text-[#141A16] dark:text-[#ECF2EE]">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-[#7A8981] hover:text-[#141A16] dark:hover:text-white hover:bg-[#ECF2EE]/60 dark:hover:bg-[#181E1A] cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Groups */}
            <div className="p-5 space-y-5">
              {SHORTCUT_GROUPS.map(group => (
                <div key={group.title}>
                  <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#7A8981] mb-2">{group.title}</p>
                  <div className="space-y-1.5">
                    {group.shortcuts.map(sc => (
                      <div key={sc.description} className="flex items-center justify-between">
                        <span className="text-xs text-[#141A16] dark:text-[#ECF2EE]">{sc.description}</span>
                        <div className="flex items-center gap-1">
                          {sc.keys.map((k, i) => (
                            <span key={i}>
                              <kbd className="px-2 py-0.5 rounded-md border border-[#E2E6E2] dark:border-[#1A211D] bg-white dark:bg-[#181E1A] text-[10px] font-mono font-bold text-[#141A16] dark:text-[#ECF2EE]">
                                {k}
                              </kbd>
                              {i < sc.keys.length - 1 && <span className="text-[10px] text-[#7A8981] mx-0.5">+</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-[#E2E6E2] dark:border-[#1A211D] bg-[#F2F5F3]/70 dark:bg-[#090B0A]/40">
              <p className="text-[10px] font-mono text-[#7A8981] text-center">Press <kbd className="px-1.5 py-0.5 rounded border border-[#E2E6E2] dark:border-[#1A211D] bg-white dark:bg-[#181E1A] font-mono text-[9px] text-[#141A16] dark:text-[#ECF2EE]">?</kbd> or <kbd className="px-1.5 py-0.5 rounded border border-[#E2E6E2] dark:border-[#1A211D] bg-white dark:bg-[#181E1A] font-mono text-[9px] text-[#141A16] dark:text-[#ECF2EE]">Esc</kbd> to close</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
