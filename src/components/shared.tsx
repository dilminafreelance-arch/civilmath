import React from 'react';

export function cls(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function Card({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cls("bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-4", className)}>
      {title && <h3 className="text-xs font-extrabold text-[#0F172A] dark:text-white mb-3">{title}</h3>}
      {children}
    </div>
  );
}

export function ProgressBar({ value, size = 'md', color = '#2563EB' }: { value: number; size?: 'sm' | 'md'; color?: string }) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div className={cls("w-full bg-[#E2E8F0] dark:bg-[#1E293B] rounded-full overflow-hidden", h)}>
      <div className={cls("rounded-full transition-all duration-500", h)} style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }} />
    </div>
  );
}

export function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ backgroundColor: `${color}20`, color }}>
      {label}
    </span>
  );
}

export function Avatar({ name, url, size = 7 }: { name: string; url?: string; size?: number }) {
  const s = size * 4;
  return url ? (
    <img src={url} alt={`${name}'s avatar`} className={`w-${size} h-${size} rounded-full`} />
  ) : (
    <div className={`w-${size} h-${size} rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[#2563EB] text-[${size * 1.5}px] font-bold shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function formatNum(n: number, d = 2): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}
