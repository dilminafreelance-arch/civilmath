import React from 'react';

export type BadgeVariant = 'brand' | 'neutral' | 'code' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  icon: Icon,
  children,
  className = '',
  dot = false,
}: BadgeProps) {
  const sizeClasses: Record<BadgeSize, string> = {
    xs: 'px-1.5 py-0.5 text-[9.5px]',
    sm: 'px-2 py-0.5 text-[10.5px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantClasses: Record<BadgeVariant, string> = {
    brand: 'bg-brand/10 text-brand border-brand/20',
    neutral: 'bg-surface-2 text-ink-secondary border-border-subtle',
    code: 'bg-surface-1 text-ink border-border-strong font-mono tracking-wider',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40',
    warning:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
    danger:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/40',
  };

  const dotColorClasses: Record<BadgeVariant, string> = {
    brand: 'bg-brand',
    neutral: 'bg-ink-muted',
    code: 'bg-brand',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-md border tracking-tight leading-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorClasses[variant]}`}
          aria-hidden="true"
        />
      )}
      {Icon && <Icon className="w-3 h-3 shrink-0" strokeWidth={1.75} />}
      <span>{children}</span>
    </span>
  );
}
