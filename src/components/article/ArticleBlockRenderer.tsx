import React from 'react';
import {
  ArticleBlock,
  FormulaBlockData,
  CalculationExampleBlockData,
  EngineeringNoteBlockData,
  WarningBlockData,
  KeyTakeawayBlockData,
  DefinitionBlockData,
  StepByStepBlockData,
  TableBlockData,
  ImageBlockData,
  ImageTextBlockData,
  TwoColumnBlockData,
  CalculatorCtaBlockData,
  CalculatorEmbedBlockData,
  RelatedArticlesBlockData,
  FaqBlockData,
  ListBlockData,
  QuoteBlockData,
} from '../../types/article';
import MathFormula from './MathFormula';
import CalculationCard from './CalculationCard';
import EngineeringNoteCard from './EngineeringNoteCard';
import WarningCard from './WarningCard';
import KeyTakeawayCard from './KeyTakeawayCard';
import DefinitionCard from './DefinitionCard';
import StepByStepCard from './StepByStepCard';
import TableBlockRenderer from './TableBlockRenderer';
import DiagramCard from './DiagramCard';
import CalculatorCtaCard from './CalculatorCtaCard';
import CalculatorEmbedCard from './CalculatorEmbedCard';
import RelatedArticlesCard from './RelatedArticlesCard';
import FAQSectionCard from './FAQSectionCard';
import { Quote } from 'lucide-react';

export interface ArticleBlockRendererProps {
  key?: React.Key;
  block: ArticleBlock;
  currentSlug?: string;
  category?: string;
}

/**
 * Renders inline text, handling bold, code, and links simply and cleanly.
 */
function FormattedInlineText({ text }: { text: string }) {
  if (!text) return null;

  // Split into paragraphs if contains double newlines
  const paragraphs = text.split('\n\n').map(p => p.trim()).filter(Boolean);

  return (
    <>
      {paragraphs.map((para, idx) => (
        <p
          key={idx}
          className="text-base sm:text-[16.5px] leading-8 text-[#333C33] dark:text-[#D1DDD1] font-sans my-4"
        >
          {para}
        </p>
      ))}
    </>
  );
}

export default function ArticleBlockRenderer({
  block,
  currentSlug,
  category,
}: ArticleBlockRendererProps) {
  if (block.visibility === false) return null;

  const { type, content, data, title } = block;

  switch (type) {
    // ── Basic Content ──
    case 'paragraph':
      return <FormattedInlineText text={content || ''} />;

    case 'heading_2': {
      const headingText = content || title || '';
      const anchorId = headingText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      return (
        <div id={anchorId} className="pt-6 pb-2 scroll-mt-24">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#20231F] dark:text-[#EAE7E0] tracking-tight flex items-baseline gap-2">
            <span className="w-1.5 h-6 bg-[#657565] rounded-full shrink-0 translate-y-0.5" />
            <span>{headingText}</span>
          </h2>
        </div>
      );
    }

    case 'heading_3': {
      const headingText = content || title || '';
      const anchorId = headingText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      return (
        <div id={anchorId} className="pt-4 pb-1 scroll-mt-24">
          <h3 className="text-lg sm:text-xl font-bold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
            {headingText}
          </h3>
        </div>
      );
    }

    case 'bullet_list': {
      const listData = (data as ListBlockData) || { items: [] };
      const items = listData.items?.length
        ? listData.items
        : content
        ? content.split('\n').map(s => s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean)
        : [];
      return (
        <ul className="my-4 space-y-2 pl-6 list-disc text-sm sm:text-base text-[#333C33] dark:text-[#D1DDD1] leading-relaxed font-sans">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    }

    case 'numbered_list': {
      const listData = (data as ListBlockData) || { items: [] };
      const items = listData.items?.length
        ? listData.items
        : content
        ? content.split('\n').map(s => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean)
        : [];
      return (
        <ol className="my-4 space-y-2 pl-6 list-decimal text-sm sm:text-base text-[#333C33] dark:text-[#D1DDD1] leading-relaxed font-sans font-mono-marker">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ol>
      );
    }

    case 'quote': {
      const quoteData = (data as QuoteBlockData) || { quote: content || '' };
      return (
        <blockquote className="my-6 p-5 sm:p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border-l-4 border-[#657565] border-[#D8D0C2] dark:border-[#384238] shadow-2xs space-y-2">
          <Quote className="w-5 h-5 text-[#657565] opacity-60" />
          <p className="text-sm sm:text-base italic text-[#20231F] dark:text-[#EAE7E0] leading-relaxed font-sans m-0">
            “{quoteData.quote || content}”
          </p>
          {(quoteData.author || quoteData.source) && (
            <cite className="block text-xs font-mono text-[#7B8978] not-italic pt-1">
              — {quoteData.author} {quoteData.source ? `(${quoteData.source})` : ''}
            </cite>
          )}
        </blockquote>
      );
    }

    case 'divider':
      return (
        <hr className="my-8 border-t border-[#D8D0C2] dark:border-[#333C33] opacity-60" />
      );

    // ── Engineering Content ──
    case 'formula': {
      const formulaData = (data as FormulaBlockData) || {
        equation: content || '',
        title: title || '',
      };
      return (
        <MathFormula
          title={formulaData.title || title}
          equation={formulaData.equation || content || ''}
          variables={formulaData.variables}
          unit={formulaData.unit}
          explanation={formulaData.explanation}
          reference={formulaData.reference}
          centered={block.styling?.alignment !== 'left'}
        />
      );
    }

    case 'calculation_example': {
      const calcData = (data as CalculationExampleBlockData) || {
        title: title || 'Calculation Example',
        inputs: [],
        result: '',
      };
      return (
        <CalculationCard
          title={calcData.title || title || 'Calculation Example'}
          scenario={calcData.scenario}
          inputs={calcData.inputs}
          formula={calcData.formula}
          calculation={calcData.calculation}
          result={calcData.result}
          unit={calcData.unit}
          note={calcData.note}
        />
      );
    }

    case 'engineering_note': {
      const noteData = (data as EngineeringNoteBlockData) || {
        note: content || '',
        title: title || 'Engineering Note',
      };
      return (
        <EngineeringNoteCard
          title={noteData.title || title}
          note={noteData.note || content || ''}
          icon={noteData.icon}
          reference={noteData.reference}
        />
      );
    }

    case 'warning': {
      const warnData = (data as WarningBlockData) || {
        message: content || '',
        title: title || 'Important',
      };
      return (
        <WarningCard
          title={warnData.title || title}
          message={warnData.message || content || ''}
          severity={warnData.severity}
        />
      );
    }

    case 'key_takeaway': {
      const takeawayData = (data as KeyTakeawayBlockData) || {
        items: content ? content.split('\n').filter(Boolean) : [],
        title: title || 'Key Takeaways',
      };
      return (
        <KeyTakeawayCard
          title={takeawayData.title || title}
          items={takeawayData.items}
        />
      );
    }

    case 'definition': {
      const defData = (data as DefinitionBlockData) || {
        term: title || '',
        definition: content || '',
      };
      return (
        <DefinitionCard
          term={defData.term || title || ''}
          definition={defData.definition || content || ''}
          context={defData.context}
          formula={defData.formula}
        />
      );
    }

    case 'step_by_step': {
      const stepData = (data as StepByStepBlockData) || {
        steps: [],
        title: title,
      };
      return (
        <StepByStepCard
          title={stepData.title || title}
          steps={stepData.steps}
        />
      );
    }

    case 'table': {
      const tableData = (data as TableBlockData) || {
        headers: [],
        rows: [],
        title: title,
      };
      return (
        <TableBlockRenderer
          title={tableData.title || title}
          headers={tableData.headers}
          rows={tableData.rows}
          caption={tableData.caption}
        />
      );
    }

    // ── Visual Content ──
    case 'image': {
      const imgData = (data as ImageBlockData) || {
        url: content || '',
        alt: title,
      };
      return (
        <DiagramCard
          url={imgData.url || content || ''}
          alt={imgData.alt || title || 'Civil engineering diagram'}
          caption={imgData.caption}
          figureNumber={imgData.figureNumber}
          layout={imgData.layout}
          link={imgData.link}
        />
      );
    }

    case 'image_text': {
      const itData = (data as ImageTextBlockData) || {
        url: '',
        text: content || '',
      };
      const isRight = itData.imagePosition === 'right';
      return (
        <div className={`my-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center ${isRight ? 'md:grid-flow-dense' : ''}`}>
          <div className={isRight ? 'md:col-start-2' : ''}>
            <DiagramCard
              url={itData.url}
              alt={itData.alt || 'Figure diagram'}
              caption={itData.caption}
            />
          </div>
          <div className={`space-y-3 ${isRight ? 'md:col-start-1' : ''}`}>
            {title && (
              <h3 className="text-lg font-bold text-[#20231F] dark:text-[#EAE7E0]">
                {title}
              </h3>
            )}
            <p className="text-sm sm:text-base leading-relaxed text-[#333C33] dark:text-[#D1DDD1] font-sans m-0">
              {itData.text || content}
            </p>
          </div>
        </div>
      );
    }

    case 'two_column': {
      const colData = (data as TwoColumnBlockData) || {
        leftContent: content || '',
        rightContent: '',
      };
      return (
        <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] space-y-2">
            {colData.leftTitle && (
              <h4 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0]">
                {colData.leftTitle}
              </h4>
            )}
            <p className="text-xs sm:text-sm text-[#555C55] dark:text-[#B2BEB2] leading-relaxed font-sans m-0 whitespace-pre-wrap">
              {colData.leftContent}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] space-y-2">
            {colData.rightTitle && (
              <h4 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0]">
                {colData.rightTitle}
              </h4>
            )}
            <p className="text-xs sm:text-sm text-[#555C55] dark:text-[#B2BEB2] leading-relaxed font-sans m-0 whitespace-pre-wrap">
              {colData.rightContent}
            </p>
          </div>
        </div>
      );
    }

    // ── Conversion / Links ──
    case 'calculator_embed': {
      const embedData = (data as CalculatorEmbedBlockData) || {
        calculatorId: 'concrete-volume',
        title: title || 'Interactive Calculator',
      };
      return (
        <CalculatorEmbedCard
          calculatorId={embedData.calculatorId || 'concrete-volume'}
          calculatorName={embedData.calculatorName || embedData.title || title}
          description={embedData.description}
          initialInputs={embedData.initialInputs}
        />
      );
    }

    case 'calculator_cta': {
      const ctaData = (data as CalculatorCtaBlockData) || {
        calculatorUrl: '',
        title: title || 'Interactive Calculator',
        description: '',
      };

      // If calculatorId is provided and embeddable, render interactive CalculatorEmbedCard
      if (ctaData.calculatorId) {
        return (
          <CalculatorEmbedCard
            calculatorId={ctaData.calculatorId}
            calculatorName={ctaData.title || title}
            description={ctaData.description}
          />
        );
      }

      return (
        <CalculatorCtaCard
          calculatorUrl={ctaData.calculatorUrl}
          title={ctaData.title || title || 'Interactive Engineering Tool'}
          description={ctaData.description}
          buttonText={ctaData.buttonText}
        />
      );
    }

    case 'related_calculator': {
      const ctaData = (data as CalculatorCtaBlockData) || {
        calculatorUrl: '',
        title: title || 'Related Calculator',
        description: '',
      };
      return (
        <CalculatorCtaCard
          calculatorUrl={ctaData.calculatorUrl}
          title={ctaData.title || title || 'Related Calculator'}
          description={ctaData.description}
          buttonText={ctaData.buttonText || 'Open Tool →'}
        />
      );
    }

    case 'related_article': {
      const relData = (data as RelatedArticlesBlockData) || {
        articleSlugs: [],
        title: title || 'Related Articles',
      };
      return (
        <RelatedArticlesCard
          title={relData.title || title}
          articleSlugs={relData.articleSlugs}
          currentSlug={currentSlug}
          category={category}
        />
      );
    }

    case 'tool_recommendation': {
      const ctaData = (data as CalculatorCtaBlockData) || {
        calculatorUrl: '',
        title: title || 'Recommended Engineering Tool',
        description: '',
      };
      return (
        <CalculatorCtaCard
          calculatorUrl={ctaData.calculatorUrl}
          title={ctaData.title || title || 'Recommended CivilMath Calculator'}
          description={ctaData.description}
          buttonText={ctaData.buttonText || 'Launch Tool →'}
        />
      );
    }

    // ── FAQ ──
    case 'faq': {
      const faqData = (data as FaqBlockData) || {
        faqs: [],
        title: title || 'Frequently Asked Questions',
      };
      return (
        <FAQSectionCard
          title={faqData.title || title}
          faqs={faqData.faqs}
        />
      );
    }

    default:
      return null;
  }
}
