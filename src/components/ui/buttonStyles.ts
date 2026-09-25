export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export const buttonBaseClasses =
  'relative inline-flex items-center justify-center font-medium transition-all select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

export const buttonSizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 min-h-8 text-xs gap-1.5 rounded-md',
  sm: 'px-3 py-1.5 min-h-9 text-xs gap-2 rounded-lg',
  md: 'px-4 py-2 min-h-11 text-xs sm:text-sm gap-2 rounded-lg font-semibold',
  lg: 'px-5 py-2.5 min-h-12 text-sm sm:text-base gap-2.5 rounded-xl font-semibold',
};

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand hover:bg-primary-dark text-white shadow-xs dark:text-canvas dark:shadow-[0_0_16px_rgba(52,211,153,0.3)] border border-brand/20',
  secondary:
    'bg-surface-1 hover:bg-surface-2 text-ink border border-border-subtle shadow-2xs',
  outline:
    'bg-transparent hover:bg-surface-2 text-ink-secondary hover:text-ink border border-border-subtle',
  ghost:
    'bg-transparent hover:bg-brand/10 text-ink-secondary hover:text-brand',
  danger:
    'bg-danger hover:bg-red-600 text-white border border-red-600/30 shadow-xs',
};

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  mono = false,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  mono?: boolean;
  className?: string;
}): string {
  const fontClass = mono ? 'font-mono tracking-tight' : 'font-sans';
  return `${buttonBaseClasses} ${buttonSizeClasses[size]} ${buttonVariantClasses[variant]} ${fontClass} ${className}`.trim();
}
