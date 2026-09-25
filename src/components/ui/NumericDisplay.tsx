import React from 'react';

interface NumericDisplayProps {
  value: string | number;
  unit?: string;
  label?: string;
  sublabel?: string;
  trend?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

export function NumericDisplay({
  value,
  unit,
  label,
  sublabel,
  trend,
  size = 'md',
  className = '',
}: NumericDisplayProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    hero: 'text-3xl sm:text-4xl lg:text-5xl',
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
          {label}
        </div>
      )}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span
          className={`font-mono font-bold tracking-tight text-ink tabular-nums ${sizeClasses[size]}`}
        >
          {value}
        </span>
        {unit && (
          <span className="font-mono text-xs sm:text-sm font-semibold text-brand">
            {unit}
          </span>
        )}
        {trend && (
          <span className="ml-1 text-[11px] font-mono text-ink-muted">
            {trend}
          </span>
        )}
      </div>
      {sublabel && (
        <div className="text-xs text-ink-secondary">{sublabel}</div>
      )}
    </div>
  );
}
