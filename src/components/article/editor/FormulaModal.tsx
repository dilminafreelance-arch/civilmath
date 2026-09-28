import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Calculator, Sparkles, BookOpen } from 'lucide-react';
import { renderKatexHtml } from './mathExtension';

export interface FormulaPreset {
  label: string;
  latex: string;
  category: string;
}

const CIVIL_FORMULA_PRESETS: FormulaPreset[] = [
  {
    label: 'Concrete Volume',
    latex: 'V = L \\times W \\times H',
    category: 'Concrete',
  },
  {
    label: 'Bending Moment (Simply Supported)',
    latex: 'M_{max} = \\frac{w L^2}{8}',
    category: 'Structural',
  },
  {
    label: 'Slab Min Thickness (ACI 318)',
    latex: 'h_{min} = \\frac{L}{28}',
    category: 'Structural',
  },
  {
    label: 'Rebar Unit Weight',
    latex: 'w = \\frac{D^2}{162} \\text{ kg/m}',
    category: 'BBS',
  },
  {
    label: 'RCC Column Axial Capacity',
    latex: 'P_n = 0.85 f\'_c (A_g - A_{st}) + f_y A_{st}',
    category: 'Structural',
  },
  {
    label: 'Terzaghi Bearing Capacity',
    latex: 'q_u = c N_c + q N_q + 0.5 \\gamma B N_\\gamma',
    category: 'Geotech',
  },
  {
    label: 'Shear Stress in Beams',
    latex: '\\tau = \\frac{V \\cdot Q}{I \\cdot b}',
    category: 'Structural',
  },
  {
    label: 'Water-Cement Ratio',
    latex: 'w/c = \\frac{W_{water}}{W_{cement}}',
    category: 'Concrete',
  },
];

export interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string, isBlock: boolean) => void;
  initialLatex?: string;
  initialIsBlock?: boolean;
}

export default function FormulaModal({
  isOpen,
  onClose,
  onInsert,
  initialLatex = '',
  initialIsBlock = true,
}: FormulaModalProps) {
  const [latex, setLatex] = useState(initialLatex);
  const [isBlock, setIsBlock] = useState(initialIsBlock);

  useEffect(() => {
    setLatex(initialLatex);
    setIsBlock(initialIsBlock);
  }, [initialLatex, initialIsBlock, isOpen]);

  // Handle ESC or Enter
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (latex.trim()) {
          onInsert(latex.trim(), isBlock);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, latex, isBlock, onInsert, onClose]);

  const previewHtml = useMemo(() => {
    return renderKatexHtml(latex || 'f(x) = ...', isBlock);
  }, [latex, isBlock]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
              ∑
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {initialLatex ? 'Edit Math Formula' : 'Insert KaTeX Formula'}
              </h3>
              <p className="text-xs text-stone-500">Live preview & civil engineering formula presets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Format Type Switcher */}
          <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setIsBlock(true)}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                isBlock
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
              }`}
            >
              Block Formula ($$...$$)
            </button>
            <button
              type="button"
              onClick={() => setIsBlock(false)}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                !isBlock
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
              }`}
            >
              Inline Formula ($...$)
            </button>
          </div>

          {/* LaTeX Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-stone-700 dark:text-stone-300 font-mono">
                LaTeX Syntax:
              </label>
              <span className="text-[11px] text-stone-400">Press Ctrl+Enter to insert</span>
            </div>
            <textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="e.g. V = L \times W \times H"
              rows={3}
              autoFocus
              className="w-full font-mono text-sm p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
            />
          </div>

          {/* Live Preview Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              Live KaTeX Preview:
            </label>
            <div className="p-4 rounded-xl bg-stone-100/80 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 min-h-[70px] flex items-center justify-center overflow-x-auto">
              <div
                className="text-stone-900 dark:text-stone-100 text-lg"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>

          {/* Engineering Presets */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>Civil Engineering Quick Presets (Click to insert):</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {CIVIL_FORMULA_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLatex(preset.latex)}
                  className="text-left p-2 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-purple-400 dark:hover:border-purple-500 bg-white dark:bg-stone-800/80 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all text-xs group"
                >
                  <div className="font-bold text-stone-800 dark:text-stone-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    {preset.label}
                  </div>
                  <div className="font-mono text-[11px] text-stone-400 truncate mt-0.5">
                    {preset.latex}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!latex.trim()}
            onClick={() => {
              if (latex.trim()) {
                onInsert(latex.trim(), isBlock);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-5 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>{initialLatex ? 'Update Formula' : 'Insert Formula'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
