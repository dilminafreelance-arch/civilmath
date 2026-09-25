import React from 'react';

export type CardElevation = 'flat' | 'raised' | 'interactive' | 'blueprint';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: CardElevation;
  coord?: string;
  crosshairs?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Card({
  elevation = 'raised',
  coord,
  crosshairs = false,
  children,
  className = '',
  ...props
}: CardProps) {
  const elevationClasses: Record<CardElevation, string> = {
    flat: 'bg-surface-2 border border-border-subtle',
    raised:
      'bg-surface-1 border border-border-subtle shadow-2xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
    interactive:
      'bg-surface-1 border border-border-subtle hover:border-brand/50 shadow-2xs hover:shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all duration-150 cursor-pointer',
    blueprint:
      'bg-surface-1/90 backdrop-blur-md border border-border-subtle blueprint-grid',
  };

  return (
    <div
      className={`relative rounded-2xl p-5 ${elevationClasses[elevation]} ${crosshairs ? 'corner-crosshair' : ''} ${className}`}
      {...props}
    >
      {coord && (
        <div className="absolute top-3 right-4 font-mono text-[9px] uppercase tracking-wider text-ink-muted pointer-events-none select-none">
          {coord}
        </div>
      )}
      {children}
    </div>
  );
}
