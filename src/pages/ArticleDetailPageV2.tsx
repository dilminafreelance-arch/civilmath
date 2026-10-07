import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, Edit3, Eye } from 'lucide-react';
import { SEOHead } from '../utils/seo';
import { Article } from '../types/article';
import {
  getArticleBySlug,
  getCachedArticleSync,
  getAllArticleSummaries,
  fetchAndSyncAllArticles,
  getAdminToken,
} from '../utils/articleStore';
import { getArticleCoverImage } from '../data/articleVisuals';
import { generateArticleJsonLd } from '../utils/autoSeo';
import ArticleRenderer from '../components/article/ArticleRenderer';

export default function ArticleDetailPageV2() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isPreviewParam = searchParams.get('preview') === 'true';
  const isAdmin = Boolean(getAdminToken());

  const cached = slug ? getCachedArticleSync(slug) : undefined;
  const [article, setArticle] = useState<Article | null>(() => {
    if (cached) {
      if (cached.status === 'draft' && !isAdmin && !isPreviewParam) {
        return null;
      }
      return cached;
    }
    return null;
  });
  const [allArticles, setAllArticles] = useState<Article[]>(() => getAllArticleSummaries());
  const [loading, setLoading] = useState<boolean>(() => !cached);
  // confirmedMissing = API definitively said 404 (or article is a draft hidden
  // from the public). Only in this case may the page noindex itself.
  // loadError = the fetch failed transiently (network/timeout/abort). This must
  // NEVER noindex — a bot with a flaky fetch would otherwise deindex real pages.
  const [loadError, setLoadError] = useState<boolean>(false);
  const [confirmedMissing, setConfirmedMissing] = useState<boolean>(false);

  // Load article and directory (SWR pattern: instant render + background refresh)
  useEffect(() => {
    if (!slug) return;
    
    const syncArt = getCachedArticleSync(slug);
    if (syncArt) {
      if (syncArt.status === 'draft' && !isAdmin && !isPreviewParam) {
        setArticle(null);
        setConfirmedMissing(true);
      } else {
        setArticle(syncArt);
      }
      setLoading(false);
    } else {
      setLoading(true);
    }

    setLoadError(false);
    setConfirmedMissing(false);
    getArticleBySlug(slug)
      .then(data => {
        if (data) {
          if (data.status === 'draft' && !isAdmin && !isPreviewParam) {
            setArticle(null);
            setConfirmedMissing(true);
          } else {
            setArticle(data);
          }
        } else if (!syncArt) {
          // Fetch failed transiently (network/timeout/abort) — do NOT treat as
          // "not found". Show a retryable error WITHOUT noindex.
          setLoadError(true);
        }
      })
      .catch((e) => {
        if (e?.code === 'ARTICLE_NOT_FOUND' && !syncArt) {
          // API definitively returned 404 — safe to noindex.
          setArticle(null);
          setConfirmedMissing(true);
        } else if (!syncArt) {
          setLoadError(true);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    // Populate related articles if directory is empty
    if (allArticles.length === 0) {
      fetchAndSyncAllArticles()
        .then(synced => setAllArticles(synced))
        .catch(() => {});
    }
  }, [slug, isAdmin, isPreviewParam]);

  if (loading) {
    return (
      <div className="py-24 text-center max-w-lg mx-auto space-y-4">
        <div className="w-8 h-8 border-2 border-[#657565] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-[#7B8978]">Loading technical engineering article...</p>
      </div>
    );
  }

  if (!article && confirmedMissing) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto space-y-4">
        <SEOHead
          meta={{
            title: 'Article Not Found | CivilMath',
            description: 'The requested civil engineering article was not found.',
            path: '/articles',
            noindex: true,
          }}
        />
        <div className="w-12 h-12 rounded-2xl bg-[#657565]/10 text-[#657565] flex items-center justify-center mx-auto text-xl font-bold font-mono">
          404
        </div>
        <h1 className="text-2xl font-bold text-[#20231F] dark:text-[#EAE7E0]">Article Not Found</h1>
        <p className="text-xs text-[#7B8978] leading-relaxed">
          The requested civil engineering article does not exist or has been updated.
        </p>
        <Link
          to="/articles"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#657565] hover:bg-[#536153] text-white rounded-xl text-xs font-bold no-underline transition-all shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Browse All Articles
        </Link>
      </div>
    );
  }

  if (!article && loadError) {
    // Transient fetch failure — deliberately NO noindex here. A bot (or user)
    // with a flaky connection must never cause a real article to deindex.
    return (
      <div className="py-20 text-center max-w-lg mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-[#20231F] dark:text-[#EAE7E0]">Couldn't load the article</h1>
        <p className="text-xs text-[#7B8978] leading-relaxed">
          Something went wrong while loading this article. Please check your connection and try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#657565] hover:bg-[#536153] text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            Try Again
          </button>
          <Link
            to="/articles"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold no-underline transition-all border border-[#657565]/30 text-[#657565]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Browse All Articles
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    // Shouldn't normally happen (loading covers the fetch window), but never
    // leave crawlers on a blank page — and never noindex without confirmation.
    return (
      <div className="py-24 text-center max-w-lg mx-auto space-y-4">
        <div className="w-8 h-8 border-2 border-[#657565] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-[#7B8978]">Loading technical engineering article...</p>
      </div>
    );
  }

  const coverImage = getArticleCoverImage(article.slug, article.category, article.coverImage);
  const jsonLd = generateArticleJsonLd(article);
  const isDraft = article.status === 'draft';

  // Extract FAQs from structured blocks if present or legacy field
  const faqData = article.faqs?.length
    ? article.faqs
    : article.blocks?.find(b => b.type === 'faq')?.data?.faqs || [];

  return (
    <div className="w-full max-w-6xl mx-auto py-2">
      {/* Admin Draft Mode Warning Banner */}
      {isDraft && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
            <Clock className="w-4 h-4 shrink-0 text-amber-600" />
            <span><strong>Draft Preview:</strong> This article is an unpublished draft and hidden from the public.</span>
          </div>
          <Link
            to={`/admin/articles/edit/${article.slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit in Studio</span>
          </Link>
        </div>
      )}

      <SEOHead
        meta={{
          title: article.seo?.seoTitle || `${article.title} | CivilMath`,
          description: article.seo?.metaDescription || article.excerpt,
          path: `/articles/${article.slug}`,
          canonical: `https://civilmath.com/articles/${article.slug}`,
          image: coverImage.url,
          type: 'article',
          noindex: isDraft || Boolean(article.seo?.noindex),
          schema: jsonLd,
          faqs: faqData.length ? faqData : undefined,
          breadcrumbs: [
            { name: 'Home', url: '/' },
            { name: 'Articles', url: '/articles' },
            { name: article.title, url: `/articles/${article.slug}` },
          ],
        }}
      />

      {/* Complete dedicated full-page article view with NO calculator on the side */}
      <ArticleRenderer
        article={article}
        allArticles={allArticles}
        previewMode={false}
      />
    </div>
  );
}
