import React from 'react';
import { CheckCircle2, BookmarkCheck } from 'lucide-react';
import { KeyTakeawayBlockData } from '../../types/article';

export interface KeyTakeawayCardProps {
  title?: string;
  items: string[];
}

export default function KeyTakeawayCard({
  title = 'Key Takeaways & Engineering Rules',
  items = [],
}: KeyTakeawayCardProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="my-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 p-5 sm:p-6 shadow-2xs space-y-3">
      <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
        <BookmarkCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>{title}</span>
      </div>

      <div className="space-y-2.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-emerald-600/15 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              ✓
            </span>
            <span className="text-xs sm:text-[13.5px] text-[#253025] dark:text-[#D4E2D4] leading-relaxed font-sans font-medium">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
