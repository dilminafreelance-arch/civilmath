import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { FaqBlockData } from '../../types/article';

export interface FAQSectionCardProps {
  title?: string;
  faqs: { question: string; answer: string }[];
}

export default function FAQSectionCard({
  title = 'Frequently Asked Questions',
  faqs = [],
}: FAQSectionCardProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First open by default for immediate value

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="my-8 space-y-4">
      <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#657565] dark:text-[#9FB19F] uppercase tracking-wider">
        <HelpCircle className="w-4 h-4" />
        <span>{title}</span>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="rounded-2xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] overflow-hidden shadow-2xs transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 text-xs sm:text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] hover:bg-[#FAF9F6] dark:hover:bg-[#1E221E] transition-colors cursor-pointer"
              >
                <span>{faq.question}</span>
                <span className={`w-6 h-6 rounded-lg bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2]/80 dark:border-[#384238] flex items-center justify-center text-xs font-mono font-bold text-[#657565] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-[13.5px] text-[#555C55] dark:text-[#B2BEB2] leading-relaxed border-t border-[#D8D0C2]/50 dark:border-[#333C33] font-sans whitespace-pre-wrap">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
