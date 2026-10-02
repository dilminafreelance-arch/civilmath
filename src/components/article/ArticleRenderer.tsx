import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, User, Share2, Printer, Check,
  ArrowLeft, ArrowRight, Calculator, ExternalLink, ShieldAlert
} from 'lucide-react';
import { Article, ArticleBlock, legacyArticleToBlocks } from '../../types/article';
import { getArticleCoverImage } from '../../data/articleVisuals';
import ArticleDiagram from '../ArticleDiagrams';
import ArticleBlockRenderer from './ArticleBlockRenderer';
import HtmlArticleRenderer from './HtmlArticleRenderer';
import TableOfContents from './TableOfContents';
import ArticleReadingProgress from './ArticleReadingProgress';
import RelatedArticlesCard from './RelatedArticlesCard';

export interface ArticleRendererProps {
  article: Article;
  allArticles?: Article[];
  previewMode?: boolean;
}

export default function ArticleRenderer({
  article,
  allArticles = [],
  previewMode = false,
}: ArticleRendererProps) {
  const [copied, setCopied] = useState(false);

  const isHtmlFormat = useMemo(() => {
    if (article.contentFormat === 'html') return true;
    if (article.contentFormat === 'legacy') return false;
    // Auto-detect: if content has HTML tags and no structured blocks
    if ((!article.blocks || article.blocks.length === 0) && article.content) {
      return article.content.includes('<p') || article.content.includes('<h2') || article.content.includes('<div');
    }
    return false;
  }, [article.contentFormat, article.blocks, article.content]);

  // Determine blocks: if article has blocks, use them. Otherwise convert legacy fields.
  const blocks = useMemo<ArticleBlock[]>(() => {
    if (isHtmlFormat) return [];
    if (article.blocks && article.blocks.length > 0) {
      return [...article.blocks].sort((a, b) => a.order - b.order);
    }
    return legacyArticleToBlocks(article);
  }, [article, isHtmlFormat]);

  // Compute Prev / Next articles
  const { prevArticle, nextArticle } = useMemo(() => {
    if (!article.slug || allArticles.length === 0) {
      return { prevArticle: null, nextArticle: null };
    }
    const idx = allArticles.findIndex(a => a.slug === article.slug);
    if (idx < 0) return { prevArticle: null, nextArticle: null };
    return {
      prevArticle: idx > 0 ? allArticles[idx - 1] : null,
      nextArticle: idx < allArticles.length - 1 ? allArticles[idx + 1] : null,
    };
  }, [article.slug, allArticles]);

  const coverImage = getArticleCoverImage(article.slug, article.category, article.coverImage);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareTwitter = () => {
    if (typeof window === 'undefined') return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${article.title} via @CivilMath`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    if (typeof window === 'undefined') return;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
  };

  const navigate = useNavigate();

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/articles');
    }
  };

  return (
    <article className="w-full pb-16 selection:bg-[#657565]/20">
      {!previewMode && <ArticleReadingProgress />}

      {/* Back button & Breadcrumb Navigation */}
      {!previewMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-[#FAF9F6] dark:bg-[#1E221E] text-xs font-semibold text-[#657565] dark:text-[#A1B3A1] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer shadow-2xs group"
            title="Go back to previous page"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>

          <nav aria-label="Breadcrumb" className="text-xs text-[#7B8978] flex items-center gap-1.5 font-mono overflow-hidden">
            <Link to="/" className="hover:text-[#20231F] dark:hover:text-white transition-colors no-underline shrink-0">
              Home
            </Link>
            <span>/</span>
            <Link to="/articles" className="hover:text-[#20231F] dark:hover:text-white transition-colors no-underline shrink-0">
              Articles
            </Link>
            <span>/</span>
            <span className="capitalize text-[#7B8978] hidden sm:inline shrink-0">{article.category}</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-[#20231F] dark:text-[#EAE7E0] font-bold truncate max-w-[160px] sm:max-w-xs">
              {article.title}
            </span>
          </nav>
        </div>
      )}

      {/* Top Article Header Section */}
      <header className="space-y-4 max-w-4xl mx-auto mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono bg-[#657565]/12 text-[#657565] dark:text-[#A1B3A1] border border-[#657565]/20">
            {article.category === 'bbs' ? 'BOQ & Rebar BBS' : article.category}
          </span>

          {!previewMode && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-[#FAF9F6] dark:bg-[#1E221E] text-xs font-semibold text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer"
                title="Copy article link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Link!' : 'Share'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareTwitter}
                className="p-2 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-[#FAF9F6] dark:bg-[#1E221E] text-xs font-semibold text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer hidden sm:flex"
                title="Share on X / Twitter"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleShareLinkedIn}
                className="p-2 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-[#FAF9F6] dark:bg-[#1E221E] text-xs font-semibold text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer hidden sm:flex"
                title="Share on LinkedIn"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="p-2 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-[#FAF9F6] dark:bg-[#1E221E] text-xs font-semibold text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer print:hidden"
                title="Print article"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Large H1 Article Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#20231F] dark:text-[#EAE7E0] tracking-tight leading-tight">
          {article.h1 || article.title}
        </h1>

        {/* Short Lead Paragraph / Excerpt */}
        {article.excerpt && (
          <p className="text-base sm:text-lg text-[#555C55] dark:text-[#B2BEB2] leading-relaxed font-sans">
            {article.excerpt}
          </p>
        )}

        {/* Article Metadata Bar */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-[#7B8978] pt-2 border-t border-[#D8D0C2]/50 dark:border-[#333C33]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#657565] text-white flex items-center justify-center font-bold text-[10px]">
              CM
            </div>
            <span className="font-semibold text-[#20231F] dark:text-[#EAE7E0]">{article.author || 'CivilMath Engineering Team'}</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recently Updated'}
            </span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{article.readTimeMinutes || 5} min read</span>
          </div>
        </div>
      </header>

      {/* Featured Cover Image */}
      {coverImage.url && (
        <figure className="max-w-4xl mx-auto mb-10 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#D8D0C2] dark:border-[#384238] bg-[#EAE7E0] dark:bg-[#252B25] shadow-xs">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
            <img
              src={coverImage.url}
              alt={coverImage.alt || article.title}
              loading="eager"
              className="w-full h-full object-cover"
            />
          </div>
          {coverImage.caption && (
            <figcaption className="px-4 py-2.5 bg-[#FAF9F6] dark:bg-[#1E221E] border-t border-[#D8D0C2] dark:border-[#384238] text-[11px] font-mono text-[#7B8978] text-center">
              {coverImage.caption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Mobile Table of Contents (shown only on small/mobile screens) */}
      {!previewMode && <TableOfContents article={article} mode="mobile-only" />}

      {/* Dedicated Reading Layout: Centered Article Body + Clean Table of Contents Outline */}
      <div className="max-w-5xl mx-auto flex gap-10 items-start justify-center">
        {/* Main Content Column */}
        <main className="flex-1 min-w-0 max-w-[820px] space-y-6">
          {/* Engineering Diagram if Builtin */}
          {article.isBuiltin && article.slug && (
            <div className="my-4">
              <ArticleDiagram slug={article.slug} />
            </div>
          )}

          {/* Render Sanitized HTML or Legacy Structured Content Blocks */}
          {isHtmlFormat ? (
            <HtmlArticleRenderer content={article.content || ''} article={article} />
          ) : (
            <div className="space-y-6">
              {blocks.map(block => (
                <ArticleBlockRenderer
                  key={block.id}
                  block={block}
                  currentSlug={article.slug}
                  category={article.category}
                />
              ))}
            </div>
          )}

          {/* Author Signature Box */}
          <div className="mt-12 p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] flex items-center gap-4 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#657565] to-[#455245] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 select-none">
              CM
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">
                CivilMath Engineering Editorial Team
              </div>
              <div className="text-xs text-[#7B8978] leading-relaxed font-sans">
                Professional civil engineering calculation methodologies, structural design guides, and construction material estimators.
              </div>
            </div>
          </div>

          {/* Previous / Next Article Navigation */}
          {!previewMode && (prevArticle || nextArticle) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-[#D8D0C2]/60 dark:border-[#333C33]">
              {prevArticle ? (
                <Link
                  to={`/articles/${prevArticle.slug}`}
                  className="group p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] transition-all no-underline shadow-2xs space-y-1 block"
                >
                  <div className="text-[10px] font-mono text-[#7B8978] flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                    <span>PREVIOUS ARTICLE</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] group-hover:text-[#657565] dark:group-hover:text-[#A1B3A1] transition-colors line-clamp-1">
                    {prevArticle.title}
                  </div>
                </Link>
              ) : <div />}

              {nextArticle ? (
                <Link
                  to={`/articles/${nextArticle.slug}`}
                  className="group p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] hover:border-[#657565] transition-all no-underline shadow-2xs space-y-1 block sm:text-right"
                >
                  <div className="text-[10px] font-mono text-[#7B8978] flex items-center justify-start sm:justify-end gap-1">
                    <span>NEXT ARTICLE</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] group-hover:text-[#657565] dark:group-hover:text-[#A1B3A1] transition-colors line-clamp-1">
                    {nextArticle.title}
                  </div>
                </Link>
              ) : <div />}
            </div>
          )}

          {/* Related Articles Section */}
          {!previewMode && (
            <RelatedArticlesCard
              currentSlug={article.slug}
              category={article.category}
            />
          )}
        </main>

        {/* Desktop Sticky Table of Contents (Right Sidebar - Content Outline only) */}
        {!previewMode && (
          <aside className="hidden lg:block w-72 shrink-0 sticky top-24 space-y-4">
            <TableOfContents article={article} mode="sidebar-only" />
          </aside>
        )}
      </div>
    </article>
  );
}
