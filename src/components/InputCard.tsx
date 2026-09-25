import { useState } from 'react';
import { HelpCircle, Ruler, Check, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InputCardProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  unit?: string;
  placeholder?: string;
  example?: string;
  helpText?: string;
  recommended?: string;
  icon?: typeof Ruler;
  validation?: 'error' | 'warning' | 'success' | null;
  validationMessage?: string;
  beginnerMode?: boolean;
}

export default function InputCard({
  label, value, onChange, unit, placeholder, example,
  helpText, recommended, icon: Icon, validation, validationMessage, beginnerMode,
}: InputCardProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const validationColors = {
    error: { border: '#EF4444', bg: '#FEF2F2', dot: 'error' },
    warning: { border: '#F59E0B', bg: '#FFFBEB', dot: 'warning' },
    success: { border: '#22C55E', bg: '#F0FDF4', dot: 'success' },
  };

  const vc = validation ? validationColors[validation] : null;

  return (
    <div className={`relative bg-white dark:bg-[#0D1527] border-2 rounded-2xl p-4 transition-all duration-200 ${
      isFocused ? 'border-[#f97316] shadow-sm shadow-[#f97316]/10' :
      vc ? `border-[${vc.border}]` :
      'border-[#E2E8F0] dark:border-[#1E293B] hover:border-[#CBD5E1] dark:hover:border-[#334155]'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-[#f97316]/10 text-[#f97316]">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <label className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">{label}</label>
            {example && beginnerMode && (
              <div className="text-[9px] text-[#94A3B8]">Example: {example}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {recommended && beginnerMode && (
            <span className="badge badge-green text-[8px] px-1.5 py-0.5">Recommended: {recommended}</span>
          )}
          {helpText && (
            <button onClick={() => setShowHelp(!showHelp)}
              className="p-1 rounded-lg text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#2563EB]/10 transition-all cursor-pointer">
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
            className={`w-full bg-[#F8FAFC] dark:bg-[#080d19] border rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-all ${
              isFocused ? 'border-[#2563EB] ring-1 ring-[#2563EB]/20' : 'border-transparent'
            }`}
          />
          {validation && (
            <div className={`validation-dot ${vc?.dot} absolute right-3 top-1/2 -translate-y-1/2`} />
          )}
        </div>
        {unit && (
          <div className="px-3 py-2.5 bg-[#F1F5F9] dark:bg-[#1E293B] rounded-xl text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] shrink-0">
            {unit}
          </div>
        )}
      </div>

      {/* Validation message */}
      <AnimatePresence>
        {validationMessage && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className={`flex items-center gap-1 mt-1.5 text-[9px] font-medium ${
              validation === 'error' ? 'text-[#EF4444]' :
              validation === 'warning' ? 'text-[#F59E0B]' :
              'text-[#22C55E]'
            }`}>
            {validation === 'error' && <AlertTriangle className="w-3 h-3" />}
            {validation === 'warning' && <AlertTriangle className="w-3 h-3" />}
            {validation === 'success' && <Check className="w-3 h-3" />}
            {validationMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help popover */}
      <AnimatePresence>
        {showHelp && helpText && (
          <motion.div initial={{ opacity: 0, y: 4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }} transition={{ duration: 0.15 }}
            className="mt-3 bg-[#F8FAFC] dark:bg-[#080d19] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-3 text-[10px] leading-relaxed text-[#64748B]"
          >
            <div className="flex items-start gap-1.5">
              <Info className="w-3 h-3 text-[#2563EB] mt-0.5 shrink-0" />
              {helpText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Selection Card (for choosing options) ---------- */
interface SelectCardProps {
  items: { id: string; label: string; icon?: typeof Ruler; description?: string }[];
  selected: string;
  onChange: (id: string) => void;
  columns?: 2 | 3 | 4;
}

export function SelectCardGrid({ items, selected, onChange, columns = 3 }: SelectCardProps) {
  return (
    <div className={`grid grid-cols-${columns} gap-2`}>
      {items.map(item => {
        const isSelected = selected === item.id;
        return (
          <button key={item.id} onClick={() => onChange(item.id)}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
              isSelected
                ? 'border-[#f97316] bg-[#f97316]/5 dark:bg-[#f97316]/10 shadow-xs'
                : 'border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0D1527] hover:border-[#CBD5E1] dark:hover:border-[#334155] hover:shadow-xs'
            }`}
          >
            {item.icon && (
              <div className="p-1.5 rounded-lg bg-[#f97316]/10 text-[#f97316] inline-flex mb-1.5">
                <item.icon className="w-3.5 h-3.5" />
              </div>
            )}
            <div className={`text-[10px] font-bold ${isSelected ? 'text-[#f97316]' : 'text-[#0F172A] dark:text-[#F1F5F9]'}`}>
              {item.label}
            </div>
            {item.description && (
              <div className="text-[8px] text-[#94A3B8] mt-0.5">{item.description}</div>
            )}
            {isSelected && (
              <div className="mt-1.5 flex items-center gap-1 text-[8px] text-[#f97316] font-semibold">
                <Check className="w-2.5 h-2.5" /> Selected
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Bar Size / Spacing selector ---------- */
interface SizeSelectorProps {
  label: string;
  options: (string | number)[];
  selected: string | number;
  onChange: (v: string | number) => void;
  unit?: string;
}

export function SizeSelector({ label, options, selected, onChange, unit }: SizeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const isSelected = selected === opt;
          return (
            <button key={String(opt)} onClick={() => onChange(opt)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB] shadow-xs'
                  : 'border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0D1527] text-[#475569] dark:text-[#94A3B8] hover:border-[#CBD5E1] dark:hover:border-[#334155]'
              }`}
            >
              {opt}{unit && <span className="text-[9px] text-[#94A3B8] ml-0.5">{unit}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
