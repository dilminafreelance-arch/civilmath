import React, { useState, useEffect } from 'react';

export type NumericInputVariant =
  | 'ws'
  | 'wsMd'
  | 'wsPlain'
  | 'calc'
  | 'calcPlain'
  | 'calcCenter'
  | 'calcMono'
  | 'calcXs'
  | 'ubbs'
  | 'ubbsDark'
  | 'mini'
  | 'field'
  | 'fieldF'
  | 'bare'
  | 'none';

const VARIANTS: Record<Exclude<NumericInputVariant, 'none'>, string> = {
  ws: 'w-full bg-surface-2 dark:bg-surface-2 border border-border-subtle rounded-xl px-2 py-1.5 text-[10px] text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all',
  wsMd: 'w-full bg-surface-2 dark:bg-surface-2 border border-border-subtle rounded-xl px-3 py-1.5 text-xs text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all',
  wsPlain: 'w-full bg-surface-2 dark:bg-surface-2 border border-border-subtle rounded-xl px-2 py-1.5 text-[10px] text-ink outline-none',
  calc: 'w-full bg-surface-0 dark:bg-surface-1 border border-border-subtle rounded-xl px-3 py-2 text-xs text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 shadow-2xs transition-all',
  calcPlain: 'w-full bg-surface-0 dark:bg-surface-1 border border-border-subtle rounded-xl px-3 py-2 text-xs text-ink outline-none',
  calcCenter: 'w-full bg-surface-0 dark:bg-surface-1 border border-border-subtle rounded-xl p-1.5 text-center text-ink outline-none focus:border-brand font-sans text-xs transition-all',
  calcMono: 'w-full bg-surface-0 dark:bg-surface-1 border border-border-subtle rounded-xl px-3 py-2 text-ink outline-none text-xs font-mono font-bold',
  calcXs: 'w-full bg-surface-0 dark:bg-surface-1 border border-border-subtle rounded-lg p-1.5 text-center text-ink-secondary outline-none text-[11px] font-mono',
  ubbs: 'w-full bg-surface-0 dark:bg-surface-1 border border-border-subtle rounded-xl pl-2.5 pr-10 py-1.5 text-xs text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 font-bold transition-all',
  ubbsDark: 'w-full bg-surface-1 border border-border-subtle rounded-xl pl-9 pr-2 py-1 text-ink text-xs outline-none focus:border-brand h-7 transition-all',
  mini: 'w-10 bg-surface-0 dark:bg-surface-1 border border-border-subtle rounded-md px-1 py-0.5 text-[10px] font-bold text-center outline-none text-ink',
  field: 'w-full mt-0.5 bg-surface-0 dark:bg-surface-1 border border-border-subtle rounded-xl px-2 py-1 text-[10px] text-ink outline-none',
  fieldF: 'w-full mt-0.5 bg-surface-0 dark:bg-surface-1 border border-border-subtle rounded-xl px-2 py-1 text-[10px] text-ink outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all',
  bare: 'bg-transparent border-none outline-none text-[10px] w-full text-ink',
};

export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  variant?: NumericInputVariant;
  value?: string | number | null;
  onChange: (raw: string, num: number) => void;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export function NumericInput({
  variant = 'ws',
  value,
  onChange,
  className,
  prefix,
  suffix,
  ...rest
}: NumericInputProps) {
  const [localVal, setLocalVal] = useState<string>(() => (value != null ? String(value) : ''));

  useEffect(() => {
    const propStr = value != null ? String(value) : '';
    // Resync when external value changes to a different numeric value or empty string
    if (propStr === '' && localVal !== '') {
      setLocalVal('');
    } else if (propStr !== '') {
      const parsedProp = parseFloat(propStr);
      const parsedLocal = parseFloat(localVal);
      if (isNaN(parsedLocal) || parsedProp !== parsedLocal) {
        if (!localVal.endsWith('.')) {
          setLocalVal(propStr);
        }
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!/^-?\d*\.?\d*$/.test(raw)) return;
    setLocalVal(raw);
    const num = parseFloat(raw);
    onChange(raw, Number.isNaN(num) ? 0 : num);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (localVal.endsWith('.')) {
      const trimmed = localVal.slice(0, -1);
      setLocalVal(trimmed);
    }
    rest.onBlur?.(e);
  };

  return (
    <>
      {prefix != null && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-ink-muted pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        className={[variant !== 'none' ? VARIANTS[variant] : '', className, prefix != null && 'pl-9', suffix != null && 'pr-10']
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
      {suffix != null && (
        <span className="absolute right-3 text-[10px] font-mono uppercase text-ink-muted pointer-events-none font-bold">
          {suffix}
        </span>
      )}
    </>
  );
}

export function useNumericInput(initial: string = '') {
  const [value, setValue] = useState(initial);
  return { value, onChange: setValue };
}
