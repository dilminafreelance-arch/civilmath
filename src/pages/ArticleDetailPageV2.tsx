import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, Edit3, Eye } from 'lucide-react';
import { SEOHead } from '../utils/seo';
import { Article } from '../types/article';
import {
  getArticleBySlug,
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

  const [article, setArticle] = useState<Article | null>(null);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = Boolean(getAdminToken());

  // Load article and directory
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getArticleBySlug(slug)
      .then(data => {
        if (data) {
          // If draft and not admin, hide article (public 404)
          if (data.status === 'draft' && !isAdmin && !isPreviewParam) {
            setArticle(null);
          } else {
            setArticle(data);
          }
        } else {
          setArticle(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setArticle(null);
        setLoading(false);
      });

    const summaries = getAllArticleSummaries();
    setAllArticles(summaries);
    fetchAndSyncAllArticles()
      .then(synced => setAllArticles(synced))
      .catch(() => {});
  }, [slug, isAdmin, isPreviewParam]);

  if (loading) {
    return (
      <div className="py-24 text-center max-w-lg mx-auto space-y-4">
        <div className="w-8 h-8 border-2 border-[#657565] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-[#7B8978]">Loading technical engineering article...</p>
      </div>
    );
  }

  if (!article) {
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

  const coverImage = getArticleCoverImage(article.slug, article.category, article.coverImage);
  const jsonLd = generateArticleJsonLd(article);
  const isDraft = article.status === 'draft';

  // Extract FAQs from structured blocks if present or legacy field
  const faqData = article.faqs?.length
    ? article.faqs
    : article.blocks?.find(b => b.type === 'faq')?.data?.faqs || [];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
