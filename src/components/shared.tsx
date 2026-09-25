import React from 'react';
import { Card } from './ui';

export function cls(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function TitledCard({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      {title && <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">{title}</h3>}
      {children}
    </Card>
  );
}

export function ProgressBar({ value, size = 'md', color = '#2E6B56' }: { value: number; size?: 'sm' | 'md'; color?: string }) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2';
  return (
    <div className={cls('w-full bg-border-subtle rounded-full overflow-hidden', h)}>
      <div className={cls('rounded-full transition-all duration-300', h)} style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }} />
    </div>
  );
}

export function StatusBadge({ label, color = '#2E6B56' }: { label: string; color?: string }) {
  return (
    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border" style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, color }}>
      {label}
    </span>
  );
}

export function Avatar({ name, url, size = 7 }: { name: string; url?: string; size?: number }) {
  const sizeClasses: Record<number, string> = {
    5: 'w-5 h-5 text-[8px]',
    6: 'w-6 h-6 text-[9px]',
    7: 'w-7 h-7 text-[10px]',
    8: 'w-8 h-8 text-xs',
    10: 'w-10 h-10 text-sm',
    12: 'w-12 h-12 text-base',
  };
  const sizeClass = sizeClasses[size] ?? 'w-7 h-7 text-[10px]';
  return url ? (
    <img src={url} alt={`${name}'s avatar`} className={`${sizeClass} rounded-full object-cover`} />
  ) : (
    <div className={`${sizeClass} rounded-full bg-brand/15 flex items-center justify-center text-brand font-bold shrink-0 font-mono`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function formatNum(n: number, d = 2): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}
