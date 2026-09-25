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
  ws: 'w-full bg-[#F8FAFC] dark:bg-[#080d19] border border-[#E2E8F0] dark:border-[#1E293B] rounded-lg px-2 py-1.5 text-[10px] outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20',
  wsMd: 'w-full bg-[#F8FAFC] dark:bg-[#080d19] border border-[#E2E8F0] dark:border-[#1E293B] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20',
  wsPlain: 'w-full bg-[#F8FAFC] dark:bg-[#080d19] border border-[#E2E8F0] dark:border-[#1E293B] rounded-lg px-2 py-1.5 text-[10px] outline-none',
  calc: 'w-full bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 shadow-2xs',
  calcPlain: 'w-full bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 outline-none',
  calcCenter: 'w-full bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-center text-slate-800 dark:text-slate-100 outline-none focus:border-[#f97316] font-sans text-xs',
  calcMono: 'w-full bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 outline-none text-xs font-mono font-bold',
  calcXs: 'w-full bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-center text-slate-700 dark:text-slate-300 outline-none text-[11px] font-mono',
  ubbs: 'w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-2.5 pr-10 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 font-bold',
  ubbsDark: 'w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-2 py-1 text-white text-xs outline-none focus:border-[#f97316] h-7',
  mini: 'w-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-[10px] font-bold text-center outline-none',
  field: 'w-full mt-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] outline-none',
  fieldF: 'w-full mt-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20',
  bare: 'bg-transparent border-none outline-none text-[10px] w-full',
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
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 pointer-events-none">
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
        <span className="absolute right-3 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
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
