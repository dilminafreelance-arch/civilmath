import React, { useMemo } from 'react';
import { Calculator, CheckCircle2, Bookmark, ArrowRight, FileCheck } from 'lucide-react';
import katex from 'katex';
import { CalculationInput } from '../../types/article';
import { formatEquationForKatex } from './MathFormula';

export interface CalculationCardProps {
  title: string;
  scenario?: string;
  inputs?: CalculationInput[];
  formula?: string;
  calculation?: string;
  result: string;
  unit?: string;
  note?: string;
}

export default function CalculationCard({
  title,
  scenario,
  inputs = [],
  formula,
  calculation,
  result,
  unit,
  note,
}: CalculationCardProps) {
  // Render formula in KaTeX if available
  const formulaHtml = useMemo(() => {
    if (!formula) return null;
    const formatted = formatEquationForKatex(formula);
    try {
      return katex.renderToString(formatted, { displayMode: false, throwOnError: false });
    } catch {
      return null;
    }
  }, [formula]);

  return (
    <div className="my-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] overflow-hidden shadow-2xs transition-all">
      {/* Engineering Header */}
      <div className="p-4 sm:p-5 border-b border-[#D8D0C2]/80 dark:border-[#333C33] bg-white/70 dark:bg-[#252B25]/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#657565] text-white flex items-center justify-center font-bold shadow-xs">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#657565] dark:text-[#9FB19F]">
              WORKED CALCULATION EXAMPLE
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#20231F] dark:text-[#EAE7E0] leading-snug">
              {title || 'Calculation Example'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>VERIFIED STEP</span>
        </div>
      </div>

      {/* Scenario text if provided */}
      {scenario && (
        <div className="p-4 sm:p-5 border-b border-[#D8D0C2]/60 dark:border-[#333C33] bg-[#FAF9F6]/80 dark:bg-[#1E221E]/80 text-xs sm:text-sm text-[#555C55] dark:text-[#B2BEB2] leading-relaxed">
          {scenario}
        </div>
      )}

      {/* Inputs / Given Parameters */}
      {inputs.length > 0 && (
        <div className="p-4 sm:p-5 bg-white dark:bg-[#252B25] border-b border-[#D8D0C2]/80 dark:border-[#333C33]">
          <div className="text-[10px] font-mono uppercase font-bold text-[#7B8978] tracking-wider mb-2.5 flex items-center gap-1.5">
            <Bookmark className="w-3 h-3 text-[#657565]" />
            <span>GIVEN DESIGN PARAMETERS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {inputs.map((inp, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2]/60 dark:border-[#384238] flex items-baseline justify-between"
              >
                <span className="text-xs text-[#555C55] dark:text-[#A4B2A4] font-medium truncate mr-2">
                  {inp.label}
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-[#20231F] dark:text-[#EAE7E0] shrink-0">
                  {inp.value} {inp.unit && <span className="text-[11px] font-normal text-[#7B8978]">{inp.unit}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formula & Calculation Steps */}
      {(formula || calculation) && (
        <div className="p-4 sm:p-5 space-y-3 bg-[#FAF9F6] dark:bg-[#1E221E] border-b border-[#D8D0C2]/80 dark:border-[#333C33]">
          {formula && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-[#7B8978]">
                Governing Equation:
              </span>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2]/70 dark:border-[#384238] font-mono text-xs sm:text-sm font-bold text-[#657565] dark:text-[#9FB19F] overflow-x-auto">
                {formulaHtml ? (
                  <span dangerouslySetInnerHTML={{ __html: formulaHtml }} />
                ) : (
                  formula
                )}
              </div>
            </div>
          )}

          {calculation && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-[#7B8978]">
                Numerical Substitution:
              </span>
              <div className="p-3 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2]/70 dark:border-[#384238] font-mono text-xs sm:text-sm text-[#20231F] dark:text-[#EAE7E0] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {calculation}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visually Prominent RESULT Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-[#657565]/20 via-[#657565]/10 to-[#FAF9F6] dark:to-[#1E221E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase font-bold text-[#657565] dark:text-[#9FB19F] tracking-wider flex items-center gap-1.5">
            <FileCheck className="w-4 h-4" />
            <span>CALCULATED FINAL RESULT</span>
          </div>
          <p className="text-xs text-[#7B8978] mt-0.5 font-sans">
            Ready for engineering verification & material schedule
          </p>
        </div>

        <div className="flex items-baseline gap-2 bg-white dark:bg-[#1E221E] px-5 py-3 rounded-2xl border border-[#657565]/30 shadow-xs shrink-0 self-start sm:self-auto">
          <span className="text-2xl sm:text-3xl font-mono font-black text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
            {result}
          </span>
          {unit && (
            <span className="text-sm sm:text-base font-mono font-bold text-[#657565] dark:text-[#9FB19F]">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Optional Note */}
      {note && (
        <div className="px-5 py-3 border-t border-[#D8D0C2]/60 dark:border-[#333C33] bg-[#FAF9F6] dark:bg-[#1E221E] text-xs text-[#7B8978] font-sans leading-relaxed">
          <strong>Note:</strong> {note}
        </div>
      )}
    </div>
  );
}
