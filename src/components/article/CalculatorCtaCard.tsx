import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, ArrowRight, Sparkles } from 'lucide-react';
import { CalculatorCtaBlockData } from '../../types/article';

export interface CalculatorCtaCardProps {
  calculatorUrl: string;
  title: string;
  description: string;
  buttonText?: string;
}

export default function CalculatorCtaCard({
  calculatorUrl,
  title = 'Interactive CivilMath Calculator',
  description = 'Run calculations with automated unit conversions, engineering formulas, and visual preview.',
  buttonText = 'Open Calculator →',
}: CalculatorCtaCardProps) {
  if (!calculatorUrl) return null;

  return (
    <div className="my-8 rounded-2xl bg-gradient-to-br from-[#657565]/15 via-[#657565]/5 to-transparent border border-[#657565]/35 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all hover:border-[#657565]/50">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#657565] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Calculator className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#657565] dark:text-[#9FB19F]">
              CIVILMATH INTERACTIVE TOOL
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#657565]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-[13px] text-[#555C55] dark:text-[#B2BEB2] leading-relaxed font-sans max-w-xl">
            {description}
          </p>
        </div>
      </div>

      <Link
        to={calculatorUrl}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#657565] hover:bg-[#526052] text-white text-xs sm:text-sm font-bold no-underline transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
      >
        <span>{buttonText}</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
