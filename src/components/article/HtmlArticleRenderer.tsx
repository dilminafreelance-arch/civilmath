import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import katex from 'katex';
import { Article } from '../../types/article';

export interface HtmlArticleRendererProps {
  content: string;
  article?: Article;
}

/**
 * Pre-processes HTML to render KaTeX math elements and ensure tables/math scroll horizontally on mobile.
 */
function prepareArticleHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  let html = rawHtml;

  // 1. Render data-type="math-block" or div with data-latex
  html = html.replace(/<div([^>]*?)data-latex="([^"]+)"([^>]*?)>([\s\S]*?)<\/div>/gi, (_, before, latex, after) => {
    const unescapedLatex = latex
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    let rendered = '';
    try {
      rendered = katex.renderToString(unescapedLatex, { displayMode: true, throwOnError: false });
    } catch {
      rendered = `<div class="font-mono text-sm">${latex}</div>`;
    }
    return `<div class="math-block-container my-6 p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-center overflow-x-auto select-all shadow-2xs">${rendered}</div>`;
  });

  // 2. Render data-type="math-inline" or span with data-latex
  html = html.replace(/<span([^>]*?)data-latex="([^"]+)"([^>]*?)>([\s\S]*?)<\/span>/gi, (_, before, latex, after) => {
    const unescapedLatex = latex
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    let rendered = '';
    try {
      rendered = katex.renderToString(unescapedLatex, { displayMode: false, throwOnError: false });
    } catch {
      rendered = `<span class="font-mono text-sm">${latex}</span>`;
    }
    return `<span class="math-inline-container inline-block px-1 select-all">${rendered}</span>`;
  });

  // 3. Ensure tables are wrapped in a responsive overflow container if not already wrapped
  if (html.includes('<table') && !html.includes('table-responsive-wrapper')) {
    html = html.replace(/<table([\s\S]*?)<\/table>/gi, match => {
      return `<div class="table-responsive-wrapper my-6 overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs">${match}</div>`;
    });
  }

  // 4. Inject slugified id attributes into h2 and h3 headings for Table of Contents anchor jumping
  html = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, inner) => {
    const plainText = inner.replace(/<[^>]*>/g, '').trim();
    const id = plainText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!attrs.includes('id=')) {
      return `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
    }
    return match;
  });

  // 5. Sanitize with DOMPurify, allowing math, SVGs, tables, and images
  const sanitized = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true },
    ADD_TAGS: ['figure', 'figcaption'],
    ADD_ATTR: ['id', 'target', 'rel', 'data-type', 'data-latex', 'loading'],
  });

  return sanitized;
}

export default function HtmlArticleRenderer({ content, article }: HtmlArticleRendererProps) {
  const cleanHtml = useMemo(() => {
    return prepareArticleHtml(content);
  }, [content]);

  return (
    <div className="article-reader-container w-full">
      <div
        className="article-body-content max-w-[720px] mx-auto text-[17px] sm:text-[18px] leading-[1.7] text-stone-800 dark:text-stone-200 space-y-6 break-words"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    </div>
  );
}
