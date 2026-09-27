import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { Copy, Check, Info, BookOpen } from 'lucide-react';
import { FormulaVariable } from '../../types/article';

export interface MathFormulaProps {
  key?: React.Key;
  title?: string;
  equation: string;
  variables?: FormulaVariable[];
  unit?: string;
  explanation?: string;
  reference?: string;
  centered?: boolean;
}

/**
 * Prepares raw user equation strings into clean KaTeX/LaTeX syntax.
 */
export function formatEquationForKatex(raw: string): string {
  if (!raw || !raw.trim()) return '';
  let eq = raw.trim();

  // If user already wrote valid LaTeX syntax, retain it
  if (eq.includes('\\') || eq.includes('{')) {
    return eq;
  }

  // Pre-process common human mathematical conventions
  eq = eq
    .replace(/\s*[xX*×]\s*/g, ' \\times ')
    .replace(/\s*·\s*/g, ' \\cdot ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s*<=\s*/g, ' \\le ')
    .replace(/\s*>=\s*/g, ' \\ge ')
    .replace(/\s*!=\s*/g, ' \\neq ')
    .replace(/\s*pi\b/gi, ' \\pi ')
    .replace(/\s*theta\b/gi, ' \\theta ')
    .replace(/\s*sigma\b/gi, ' \\sigma ')
    .replace(/\s*delta\b/gi, ' \\Delta ')
    .replace(/\s*phi\b/gi, ' \\phi ')
    .replace(/\s*alpha\b/gi, ' \\alpha ')
    .replace(/\s*beta\b/gi, ' \\beta ')
    .replace(/\s*gamma\b/gi, ' \\gamma ')
    .replace(/\s*rho\b/gi, ' \\rho ')
    .replace(/\s*tau\b/gi, ' \\tau ')
    .replace(/\s*lambda\b/gi, ' \\lambda ')
    .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');

  return eq;
}

export default function MathFormula({
  title,
  equation,
  variables,
  unit,
  explanation,
  reference,
  centered = true,
}: MathFormulaProps) {
  const [copied, setCopied] = useState(false);

  const formattedLatex = useMemo(() => formatEquationForKatex(equation), [equation]);

  const { html, isError } = useMemo(() => {
    if (!formattedLatex) return { html: '', isError: false };
    try {
      const rendered = katex.renderToString(formattedLatex, {
        displayMode: true,
        throwOnError: true,
        strict: false,
      });
      return { html: rendered, isError: false };
    } catch {
      try {
        const fallback = katex.renderToString(equation, {
          displayMode: true,
          throwOnError: false,
        });
        return { html: fallback, isError: false };
      } catch {
        return { html: equation, isError: true };
      }
    }
  }, [formattedLatex, equation]);

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(equation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] overflow-hidden shadow-2xs transition-all">
      {/* Top Header */}
      {(title || reference || unit) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-[#D8D0C2]/80 dark:border-[#333C33] bg-white/60 dark:bg-[#252B25]/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#657565]" />
            <h3 className="text-xs sm:text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
              {title || 'GOVERNING FORMULA'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {unit && (
              <span className="text-[10px] font-mono font-bold text-[#657565] dark:text-[#9FB19F] bg-[#657565]/10 px-2 py-0.5 rounded-md border border-[#657565]/20">
                Unit: {unit}
              </span>
            )}
            {reference && (
              <span className="text-[10px] font-mono text-[#7B8978] bg-[#EAE7E0] dark:bg-[#2A312A] px-2 py-0.5 rounded-md">
                Ref: {reference}
              </span>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-md text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer"
              title="Copy formula text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Equation Display Box */}
      <div className={`p-5 sm:p-6 bg-white dark:bg-[#252B25] overflow-x-auto ${centered ? 'text-center' : 'text-left'}`}>
        {isError ? (
          <div className="font-mono text-base font-bold text-[#20231F] dark:text-[#EAE7E0] tracking-wider py-2">
            {equation}
          </div>
        ) : (
          <div
            className="text-base sm:text-xl text-[#20231F] dark:text-[#EAE7E0] select-all py-1 inline-block min-w-0 max-w-full"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>

      {/* Variables Breakdown */}
      {variables && variables.length > 0 && (
        <div className="px-5 py-4 border-t border-[#D8D0C2]/80 dark:border-[#333C33] bg-[#FAF9F6] dark:bg-[#1E221E] space-y-2">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7B8978]">
            Where:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {variables.map((v, i) => (
              <div
                key={i}
                className="flex items-baseline justify-between p-2 rounded-lg bg-white dark:bg-[#252B25] border border-[#D8D0C2]/60 dark:border-[#384238]"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-[#657565] dark:text-[#9FB19F] min-w-6">
                    {v.symbol}
                  </span>
                  <span className="text-[#333C33] dark:text-[#D1DDD1] font-sans">
                    = {v.meaning}
                  </span>
                </div>
                {v.unit && (
                  <span className="text-[11px] text-[#7B8978] shrink-0 ml-2">
                    ({v.unit})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Explanation */}
      {explanation && (
        <div className="px-5 py-3 border-t border-[#D8D0C2]/60 dark:border-[#333C33] bg-[#FAF9F6]/60 dark:bg-[#1E221E]/60 flex items-start gap-2 text-xs text-[#555C55] dark:text-[#B2BEB2] leading-relaxed">
          <Info className="w-3.5 h-3.5 text-[#657565] shrink-0 mt-0.5" />
          <p className="m-0 font-sans">{explanation}</p>
        </div>
      )}
    </div>
  );
}
