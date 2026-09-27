import React from 'react';
import { Layers } from 'lucide-react';
import { StepItem } from '../../types/article';

export interface StepByStepCardProps {
  title?: string;
  steps: StepItem[];
}

export default function StepByStepCard({
  title = 'Step-by-Step Engineering Procedure',
  steps = [],
}: StepByStepCardProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="my-6 space-y-4">
      {title && (
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#657565] dark:text-[#9FB19F] uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>{title}</span>
        </div>
      )}

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const stepNum = step.stepNumber ?? idx + 1;
          return (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] shadow-2xs space-y-2 hover:border-[#657565] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-[#657565] text-white flex items-center justify-center text-xs font-mono font-bold shrink-0 shadow-2xs">
                  {stepNum}
                </span>
                <h4 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
                  {step.title}
                </h4>
              </div>

              {step.description && (
                <p className="text-xs sm:text-[13px] text-[#555C55] dark:text-[#B2BEB2] leading-relaxed font-sans pl-10 m-0 whitespace-pre-wrap">
                  {step.description}
                </p>
              )}

              {step.detail && (
                <div className="ml-10 p-3 rounded-xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2]/60 dark:border-[#384238] text-[11px] font-mono text-[#333C33] dark:text-[#C5D0C5] leading-relaxed">
                  {step.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
