import { useState } from 'react';
import { HelpCircle, Ruler, Check, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from './ui';

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

  return (
    <div className={`relative bg-surface-1 border-2 rounded-2xl p-4 transition-all duration-200 ${
      isFocused ? 'border-brand ring-2 ring-brand/20 shadow-xs' :
      validation === 'error' ? 'border-danger' :
      validation === 'warning' ? 'border-warning' :
      validation === 'success' ? 'border-success' :
      'border-border-subtle hover:border-brand/40'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-brand/10 text-brand">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <label className="text-sm font-bold text-ink">{label}</label>
            {example && beginnerMode && (
              <div className="text-[9px] text-ink-muted">Example: {example}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {recommended && beginnerMode && (
            <Badge variant="brand" size="xs">Recommended: {recommended}</Badge>
          )}
          {helpText && (
            <button onClick={() => setShowHelp(!showHelp)}
              className="p-1 rounded-lg text-ink-muted hover:text-brand hover:bg-brand/10 transition-all cursor-pointer">
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
            className={`w-full bg-surface-0 dark:bg-surface-2 border rounded-xl px-3 py-2.5 text-sm font-semibold text-ink outline-none transition-all placeholder:text-ink-muted ${
              isFocused ? 'border-brand ring-1 ring-brand/20' : 'border-border-subtle'
            }`}
          />
          {validation && (
            <div className={`validation-dot ${validation} absolute right-3 top-1/2 -translate-y-1/2`} />
          )}
        </div>
        {unit && (
          <div className="px-3 py-2.5 bg-surface-2 dark:bg-surface-3 rounded-xl text-[10px] font-bold text-ink-secondary shrink-0 border border-border-subtle">
            {unit}
          </div>
        )}
      </div>

      {/* Validation message */}
      <AnimatePresence>
        {validationMessage && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="mt-2">
            <Badge
              variant={validation === 'error' ? 'danger' : validation === 'warning' ? 'warning' : 'success'}
              size="xs"
              icon={validation === 'error' || validation === 'warning' ? AlertTriangle : Check}
            >
              {validationMessage}
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help popover */}
      <AnimatePresence>
        {showHelp && helpText && (
          <motion.div initial={{ opacity: 0, y: 4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }} transition={{ duration: 0.15 }}
            className="mt-3 bg-surface-2 dark:bg-surface-2 border border-border-subtle rounded-xl p-3 text-[10px] leading-relaxed text-ink-secondary"
          >
            <div className="flex items-start gap-1.5">
              <Info className="w-3 h-3 text-brand mt-0.5 shrink-0" />
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

const GRID_COLS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

export function SelectCardGrid({ items, selected, onChange, columns = 3 }: SelectCardProps) {
  return (
    <div className={`grid ${GRID_COLS[columns] ?? 'grid-cols-3'} gap-2`}>
      {items.map(item => {
        const isSelected = selected === item.id;
        return (
          <button key={item.id} onClick={() => onChange(item.id)}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
              isSelected
                ? 'border-brand bg-brand/5 dark:bg-brand/10 shadow-xs'
                : 'border-border-subtle bg-surface-1 hover:border-brand/40 hover:shadow-xs'
            }`}
          >
            {item.icon && (
              <div className="p-1.5 rounded-lg bg-brand/10 text-brand inline-flex mb-1.5">
                <item.icon className="w-3.5 h-3.5" />
              </div>
            )}
            <div className={`text-[10px] font-bold ${isSelected ? 'text-brand' : 'text-ink'}`}>
              {item.label}
            </div>
            {item.description && (
              <div className="text-[8px] text-ink-muted mt-0.5">{item.description}</div>
            )}
            {isSelected && (
              <div className="mt-1.5 flex items-center gap-1 text-[8px] text-brand font-semibold">
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
      <div className="text-[10px] font-bold font-mono text-ink-muted uppercase tracking-widest">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const isSelected = selected === opt;
          return (
            <button key={String(opt)} onClick={() => onChange(opt)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-brand bg-brand/10 text-brand shadow-xs'
                  : 'border-border-subtle bg-surface-1 text-ink-secondary hover:border-brand/40'
              }`}
            >
              {opt}{unit && <span className="text-[9px] text-ink-muted ml-0.5">{unit}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
