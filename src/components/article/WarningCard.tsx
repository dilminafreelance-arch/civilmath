import React from 'react';
import { AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { WarningBlockData } from '../../types/article';

export interface WarningCardProps {
  title?: string;
  message: string;
  severity?: 'warning' | 'danger' | 'caution';
}

export default function WarningCard({
  title = 'Important Engineering Verification',
  message,
  severity = 'warning',
}: WarningCardProps) {
  const isDanger = severity === 'danger';
  const isCaution = severity === 'caution';

  const containerStyle = isDanger
    ? 'border-l-4 border-rose-500 bg-rose-50/70 dark:bg-rose-950/25 text-rose-950 dark:text-rose-200 border-[#F3C4BE] dark:border-rose-900/40'
    : isCaution
    ? 'border-l-4 border-amber-500 bg-amber-50/70 dark:bg-amber-950/25 text-amber-950 dark:text-amber-200 border-[#F2DCA5] dark:border-amber-900/40'
    : 'border-l-4 border-[#B56F50] bg-orange-50/60 dark:bg-orange-950/20 text-[#4D2316] dark:text-[#E8C2B3] border-[#E8CFC5] dark:border-orange-900/40';

  const iconStyle = isDanger
    ? 'text-rose-600'
    : isCaution
    ? 'text-amber-600'
    : 'text-[#B56F50]';

  const IconComponent = isDanger ? AlertOctagon : AlertTriangle;

  return (
    <aside className={`my-5 p-4 sm:p-5 rounded-r-2xl text-xs sm:text-sm leading-relaxed space-y-1.5 shadow-2xs ${containerStyle}`}>
      <div className="flex items-center gap-2 font-bold font-mono text-xs uppercase tracking-wider">
        <IconComponent className={`w-4 h-4 shrink-0 ${iconStyle}`} />
        <span>{title}</span>
      </div>
      <div className="font-sans text-xs sm:text-[13px] leading-relaxed pl-6 whitespace-pre-wrap opacity-95">
        {message}
      </div>
    </aside>
  );
}
