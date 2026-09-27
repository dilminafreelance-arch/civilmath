import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { DefinitionBlockData } from '../../types/article';

export interface DefinitionCardProps {
  term: string;
  definition: string;
  context?: string;
  formula?: string;
}

export default function DefinitionCard({
  term,
  definition,
  context,
  formula,
}: DefinitionCardProps) {
  if (!term && !definition) return null;

  return (
    <div className="my-5 rounded-2xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] p-5 shadow-2xs space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#657565] dark:text-[#9FB19F] bg-[#657565]/10 px-2 py-0.5 rounded-md">
          TECHNICAL DEFINITION
        </span>
        <h4 className="text-sm sm:text-base font-bold text-[#20231F] dark:text-[#EAE7E0]">
          {term}
        </h4>
      </div>

      <p className="text-xs sm:text-[13.5px] text-[#333C33] dark:text-[#D1DDD1] leading-relaxed font-sans m-0">
        {definition}
      </p>

      {context && (
        <div className="text-xs text-[#7B8978] leading-relaxed font-sans pt-1 border-t border-[#D8D0C2]/50 dark:border-[#333C33]">
          <strong>Engineering Application:</strong> {context}
        </div>
      )}

      {formula && (
        <div className="p-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2]/60 dark:border-[#384238] font-mono text-xs font-bold text-[#657565] dark:text-[#9FB19F]">
          {formula}
        </div>
      )}
    </div>
  );
}
