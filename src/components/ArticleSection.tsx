import { useEffect, useState } from 'react';
import { ArticleData, getArticleLoader } from '../data/articles';
import { BookOpen, FileText, AlertTriangle, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface ArticleSectionProps {
  calculatorId: string;
}

export default function ArticleSection({ calculatorId }: ArticleSectionProps) {
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const loader = getArticleLoader(calculatorId);
    if (!loader) {
      setLoading(false);
      return;
    }
    loader().then(data => {
      setArticle(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [calculatorId]);

  if (loading) {
    return (
      <div className="mt-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!article) return null;

  const sectionClass = "mt-10 max-w-4xl";
  const cardClass = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden";
  const headingClass = "text-lg font-bold text-slate-900 dark:text-white font-sans tracking-tight flex items-center gap-2";
  const subheadingClass = "text-sm font-semibold text-slate-700 dark:text-slate-300 mt-4 mb-2";
  const textClass = "text-[11px] font-mono text-slate-600 dark:text-slate-400 leading-relaxed";
  const labelClass = "text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono";

  return (
    <div className={sectionClass}>
      <div className="flex items-center gap-2 mb-5">
        <FileText className="w-5 h-5 text-[#0A84FF]" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-sans tracking-tight">
          {article.h1}
        </h2>
      </div>
      <aside className="mb-6 border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-xs leading-5 text-amber-900 dark:text-amber-200">
        Educational reference material only. Any cited standard, coefficient, detailing value or example must be checked against the applicable edition, project specification and a qualified professional before design, procurement or construction use.
      </aside>

      {/* Introduction */}
      <div className={`${cardClass} p-6 mb-6`}>
        <h3 className={headingClass}><BookOpen className="w-4 h-4 text-[#0A84FF]" /> Introduction</h3>
        <div className="mt-3 space-y-3">
          {article.introduction.split('\n\n').map((p, i) => (
            <p key={i} className={textClass}>{p}</p>
          ))}
        </div>
      </div>

      {/* Theory */}
      <div className={`${cardClass} p-6 mb-6`}>
        <h3 className={headingClass}>Engineering Theory & Background</h3>
        <div className="mt-3 space-y-3">
          {article.theory.split('\n\n').map((p, i) => (
            <p key={i} className={textClass}>{p}</p>
          ))}
        </div>
      </div>

      {/* Real World Applications */}
      <div className={`${cardClass} p-6 mb-6`}>
        <h3 className={headingClass}>Real World Applications</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {article.realWorldApplications.map((app, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">{app.title}</h4>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-relaxed">{app.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Input Parameters */}
      <div className={`${cardClass} p-6 mb-6`}>
        <h3 className={headingClass}>Input Parameters</h3>
        <p className={`${textClass} mt-2 mb-4`}>Each input field in this calculator serves a specific engineering purpose. Understanding these parameters ensures accurate results.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left p-2 font-bold text-slate-700 dark:text-slate-300">Parameter</th>
                <th className="text-left p-2 font-bold text-slate-700 dark:text-slate-300">Purpose</th>
                <th className="text-left p-2 font-bold text-slate-700 dark:text-slate-300">Unit</th>
                <th className="text-left p-2 font-bold text-slate-700 dark:text-slate-300">Recommended Range</th>
              </tr>
            </thead>
            <tbody>
              {article.inputParameters.map((param, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="p-2 font-semibold text-slate-700 dark:text-slate-300">{param.name}</td>
                  <td className="p-2 text-slate-500 dark:text-slate-400">{param.purpose}</td>
                  <td className="p-2 text-slate-500 dark:text-slate-400">{param.unit}</td>
                  <td className="p-2 text-slate-500 dark:text-slate-400">{param.range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 space-y-3">
          {article.inputParameters.map((param, i) => (
            <div key={i} className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl p-3">
              <h4 className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1">{param.name} — Common Mistakes</h4>
              <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400">{param.mistakes}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Calculation Logic */}
      <div className={`${cardClass} p-6 mb-6`}>
        <h3 className={headingClass}><CheckCircle className="w-4 h-4 text-[#0A84FF]" /> Calculation Logic & Sequence</h3>
        <div className="mt-3 space-y-3">
          {article.calculationLogic.split('\n\n').map((p, i) => (
            <p key={i} className={textClass}>{p}</p>
          ))}
        </div>
      </div>

      {/* Formulas */}
      <div className={`${cardClass} p-6 mb-6`}>
        <h3 className={headingClass}>Engineering Formulas</h3>
        <p className={`${textClass} mt-2 mb-4`}>The following formulas are used in this calculator. Each variable is explained with its engineering meaning and unit.</p>
        {article.formulas.map((formula, fi) => (
          <div key={fi} className="mb-6 last:mb-0 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">{formula.name}</h4>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-3 font-mono text-[12px] text-center text-slate-800 dark:text-slate-200 italic">
              {formula.equation}
            </div>
            <div className="space-y-1">
              {formula.variables.map((v, vi) => (
                <div key={vi} className="flex items-start gap-2 text-[10px] font-mono">
                  <span className="font-bold text-[#0A84FF] min-w-[24px]">{v.symbol}</span>
                  <span className="text-slate-600 dark:text-slate-400">{v.meaning}</span>
                  <span className="text-slate-400 ml-auto">[{v.unit}]</span>
                </div>
              ))}
            </div>
            <p className={`${labelClass} mt-2`}>Reference: {formula.reference}</p>
          </div>
        ))}
      </div>

      {/* Step-by-Step Example */}
      <div className={`${cardClass} p-6 mb-6`}>
        <h3 className={headingClass}>Step-by-Step Calculation Example</h3>
        <div className="mt-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/30 rounded-xl p-4 mb-4">
          <h4 className="text-[11px] font-bold text-blue-800 dark:text-blue-300 mb-1">Scenario</h4>
          <p className="text-[10px] font-mono text-blue-700 dark:text-blue-400">{article.stepByStepExample.scenario}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Object.entries(article.stepByStepExample.given).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300">{key}:</span>
                <span className="text-[10px] font-mono text-blue-700 dark:text-blue-400">{val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {article.stepByStepExample.steps.map((step, i) => (
            <div key={i} className="flex gap-3 bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 rounded-xl p-3">
              <span className="w-6 h-6 rounded-full bg-[#0A84FF] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <div>
                <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{step.title}</h4>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">{step.explanation}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-green-50 dark:bg-green-950/30 border border-green-200/50 dark:border-green-900/30 rounded-xl p-4">
          <h4 className="text-[11px] font-bold text-green-800 dark:text-green-300">Final Answer</h4>
          <p className="text-[10px] font-mono text-green-700 dark:text-green-400 mt-0.5">{article.stepByStepExample.finalAnswer}</p>
        </div>
      </div>

      {/* Result Explanation */}
      <div className={`${cardClass} p-6 mb-6`}>
        <h3 className={headingClass}>Understanding Your Results</h3>
        <div className="mt-3 space-y-3">
          {article.resultExplanation.split('\n\n').map((p, i) => (
            <p key={i} className={textClass}>{p}</p>
          ))}
        </div>
      </div>

      {/* Common Errors */}
      <div className={`${cardClass} p-6 mb-6`}>
        <h3 className={headingClass}><AlertTriangle className="w-4 h-4 text-amber-500" /> Common Errors & How to Avoid Them</h3>
        <p className={`${textClass} mt-2 mb-4`}>Based on extensive field experience, here are the most common mistakes engineers make when using this calculator.</p>
        <div className="space-y-2">
          {article.commonErrors.map((err, i) => (
            <div key={i} className="border border-slate-100 dark:border-slate-700/50 rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{err.error}</h4>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5"><span className="font-semibold text-red-500">Cause:</span> {err.cause}</p>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400"><span className="font-semibold text-green-500">Solution:</span> {err.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Practices */}
      <div className={`${cardClass} p-6 mb-6`}>
        <h3 className={headingClass}><CheckCircle className="w-4 h-4 text-green-500" /> Best Practices & Engineering Tips</h3>
        <div className="mt-3 space-y-2">
          {article.bestPractices.map((practice, i) => (
            <div key={i} className="flex items-start gap-2 bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-xl p-3">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
              <p className="text-[10px] font-mono text-green-700 dark:text-green-400">{practice}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Design Codes */}
      <div className={`${cardClass} p-6 mb-6`}>
        <h3 className={headingClass}>Referenced Design Codes & Standards</h3>
        <p className={`${textClass} mt-2 mb-3`}>References are provided for further review; this calculator does not certify compliance with any code or project requirement.</p>
        <div className="mt-3 space-y-2">
          {article.designCodes.map((code, i) => (
            <div key={i} className="flex items-start gap-2 bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 rounded-xl p-3">
              <span className="text-[10px] font-bold text-[#0A84FF] bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md min-w-[80px]">{code.code}</span>
              <p className="text-[10px] font-mono text-slate-600 dark:text-slate-400">{code.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className={`${cardClass} p-6 mb-6`}>
        <h3 className={headingClass}><HelpCircle className="w-4 h-4 text-[#0A84FF]" /> Frequently Asked Questions</h3>
        <div className="mt-3 space-y-3">
          {article.faqs.map((faq, i) => (
            <details key={i} className="group border border-slate-100 dark:border-slate-700/50 rounded-xl overflow-hidden">
              <summary className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex items-center gap-2">
                <HelpCircle className="w-3 h-3 text-[#0A84FF] shrink-0" />
                {faq.question}
              </summary>
              <div className="px-3 pb-3 border-t border-slate-100 dark:border-slate-700/50 pt-2 mt-0">
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Related Calculators */}
      <div className={`${cardClass} p-6 mb-6`}>
        <h3 className={headingClass}><ArrowRight className="w-4 h-4 text-[#0A84FF]" /> Related CivilMath Calculators</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {article.relatedCalculators.map((rel, i) => (
            <a key={i} href={rel.url}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/30 text-[10px] font-medium text-[#0A84FF] hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors no-underline">
              {rel.name}
            </a>
          ))}
        </div>
      </div>

      {/* References */}
      <div className={`${cardClass} p-6`}>
        <h3 className={headingClass}>References & Further Reading</h3>
        <div className="mt-3 space-y-1.5">
          {article.references.map((ref, i) => (
            <p key={i} className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-relaxed pl-3 border-l-2 border-slate-200 dark:border-slate-700">
              {ref}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
