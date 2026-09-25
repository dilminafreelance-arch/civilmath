import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Calendar, User, Share2, Printer,
  Check, ArrowLeft, ArrowRight, ExternalLink, Calculator,
  AlertTriangle, CheckCircle, HelpCircle, Layers, Code,
  FileText, List, ChevronDown, ChevronRight, Bookmark,
  ShieldAlert, Sparkles, Lightbulb, AlertOctagon, Info
} from 'lucide-react';
import { SEOHead } from '../utils/seo';
import { Article } from '../types/article';
import { getArticleBySlug, getAllArticleSummaries, fetchAndSyncAllArticles } from '../utils/articleStore';
import { getArticleCoverImage } from '../data/articleVisuals';
import ArticleDiagram from '../components/ArticleDiagrams';
import { generateArticleJsonLd } from '../utils/autoSeo';

interface TocItem {
  id: string;
  label: string;
  number: string;
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Load article and directory
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getArticleBySlug(slug).then(data => {
      setArticle(data || null);
      setLoading(false);
    }).catch(() => {
      setArticle(null);
      setLoading(false);
    });

    const summaries = getAllArticleSummaries();
    setAllArticles(summaries);
    fetchAndSyncAllArticles()
      .then(synced => setAllArticles(synced))
      .catch(() => {});
  }, [slug]);

  // Compute Prev / Next Articles
  const { prevArticle, nextArticle, relatedArticles } = useMemo(() => {
    if (!article || allArticles.length === 0) {
      return { prevArticle: null, nextArticle: null, relatedArticles: [] };
    }

    const currentIndex = allArticles.findIndex(a => a.slug === article.slug);
    const prev = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
    const next = currentIndex >= 0 && currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

    // Related articles in same category or relevant topics
    const related = allArticles
      .filter(a => a.slug !== article.slug && (a.category === article.category || Math.abs(allArticles.indexOf(a) - currentIndex) <= 2))
      .slice(0, 3);

    return { prevArticle: prev, nextArticle: next, relatedArticles: related };
  }, [article, allArticles]);

  // Dynamic Table of Contents items
  const tocItems = useMemo<TocItem[]>(() => {
    if (!article) return [];
    const items: TocItem[] = [];
    let counter = 1;

    const add = (id: string, label: string) => {
      const numStr = counter < 10 ? `0${counter}` : `${counter}`;
      items.push({ id, label, number: numStr });
      counter++;
    };

    if (article.introduction) add('introduction', 'Introduction & Overview');
    if (article.theory) add('theory', 'Engineering Theory & Mechanics');
    if (article.formulas && article.formulas.length > 0) add('formulas', 'Governing Formulas');
    if (article.stepByStepExample) add('example', 'Worked Numerical Example');
    if (article.content) add('content', 'Detailed Engineering Guide');
    if (article.realWorldApplications && article.realWorldApplications.length > 0) add('applications', 'Practical Applications');
    if (article.commonErrors && article.commonErrors.length > 0) add('errors', 'Pitfalls & Best Practices');
    if (article.designCodes && article.designCodes.length > 0) add('codes', 'Applicable Design Codes');
    if (article.faqs && article.faqs.length > 0) add('faqs', 'Frequently Asked Questions');
    if (article.relatedCalculators && article.relatedCalculators.length > 0) add('tool', 'Interactive Calculator');

    return items;
  }, [article]);

  // Scroll spy observer for TOC active heading
  useEffect(() => {
    if (tocItems.length === 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const headingElements = tocItems.map(item => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];

      let currentId = tocItems[0].id;
      for (const el of headingElements) {
        const top = el.offsetTop - 140;
        if (scrollY >= top) {
          currentId = el.id;
        }
      }
      setActiveHeadingId(currentId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocItems]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleShareTwitter = () => {
    if (!article) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${article.title} via @CivilMath`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="py-24 text-center max-w-lg mx-auto space-y-4">
        <div className="w-8 h-8 border-2 border-[#657565] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-[#7B8978]">Loading technical article...</p>
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

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <SEOHead
        meta={{
          title: article.seo?.seoTitle || `${article.title} | CivilMath`,
          description: article.seo?.metaDescription || article.excerpt,
          path: `/articles/${article.slug}`,
          canonical: `https://civilmath.com/articles/${article.slug}`,
          image: coverImage.url,
          type: 'article',
          schema: jsonLd,
          faqs: article.faqs,
          breadcrumbs: [
            { name: 'Home', url: '/' },
            { name: 'Articles', url: '/articles' },
            { name: article.title, url: `/articles/${article.slug}` },
          ],
        }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#7B8978] flex items-center gap-1.5 font-mono mb-6">
        <Link to="/" className="hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
          Home
        </Link>
        <span>/</span>
        <Link to="/articles" className="hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
          Articles
        </Link>
        <span>/</span>
        <span className="capitalize text-[#7B8978] hidden sm:inline">{article.category}</span>
        <span className="hidden sm:inline">/</span>
        <span className="text-[#20231F] dark:text-[#EAE7E0] font-bold truncate max-w-[220px] sm:max-w-xs">
          {article.title}
        </span>
      </nav>

      {/* Top Article Header Section */}
      <header className="space-y-4 max-w-4xl mx-auto mb-8">
        {/* Category & Sharing Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono bg-[#657565]/12 text-[#657565] dark:text-[#A1B3A1] border border-[#657565]/20">
            {article.category === 'bbs' ? 'BOQ & Rebar BBS' : article.category}
          </span>

          {/* Social & Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-[#FAF9F6] dark:bg-[#1E221E] text-xs font-semibold text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer"
              title="Copy article link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Link!' : 'Share'}</span>
            </button>

            <button
              onClick={handleShareTwitter}
              className="p-2 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-[#FAF9F6] dark:bg-[#1E221E] text-xs font-semibold text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer hidden sm:flex"
              title="Share on X / Twitter"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>

            <button
              onClick={handleShareLinkedIn}
              className="p-2 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-[#FAF9F6] dark:bg-[#1E221E] text-xs font-semibold text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer hidden sm:flex"
              title="Share on LinkedIn"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl border border-[#D8D0C2] dark:border-[#384238] bg-[#FAF9F6] dark:bg-[#1E221E] text-xs font-semibold text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer print:hidden"
              title="Print article"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Large H1 Article Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#20231F] dark:text-[#EAE7E0] tracking-tight leading-tight">
          {article.h1 || article.title}
        </h1>

        {/* Short Article Description / Lead Paragraph */}
        <p className="text-base sm:text-lg text-[#555C55] dark:text-[#B2BEB2] leading-relaxed font-sans">
          {article.excerpt}
        </p>

        {/* Article Metadata Bar */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-[#7B8978] pt-2 border-t border-[#D8D0C2]/50 dark:border-[#333C33]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#657565] text-white flex items-center justify-center font-bold text-[10px]">
              CM
            </div>
            <span className="font-semibold text-[#20231F] dark:text-[#EAE7E0]">{article.author}</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Published {new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{article.readTimeMinutes} min read</span>
          </div>
        </div>
      </header>

      {/* Large Featured Image */}
      <figure className="max-w-4xl mx-auto mb-10 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#D8D0C2] dark:border-[#384238] bg-[#EAE7E0] dark:bg-[#252B25] shadow-xs">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
          <img
            src={coverImage.url}
            alt={coverImage.alt}
            loading="eager"
            className="w-full h-full object-cover"
          />
        </div>
        <figcaption className="px-4 py-2.5 bg-[#FAF9F6] dark:bg-[#1E221E] border-t border-[#D8D0C2] dark:border-[#384238] text-[11px] font-mono text-[#7B8978] text-center">
          {coverImage.caption}
        </figcaption>
      </figure>

      {/* Mobile Collapsible Table of Contents */}
      {tocItems.length > 0 && (
        <div className="lg:hidden max-w-3xl mx-auto mb-8 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-2xl overflow-hidden shadow-2xs">
          <button
            onClick={() => setMobileTocOpen(prev => !prev)}
            className="w-full p-4 flex items-center justify-between text-xs font-bold text-[#20231F] dark:text-[#EAE7E0] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-[#657565]" />
              <span>Table of Contents ({tocItems.length} Sections)</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#7B8978] transition-transform ${mobileTocOpen ? 'rotate-180' : ''}`} />
          </button>

          {mobileTocOpen && (
            <div className="p-4 pt-0 border-t border-[#D8D0C2]/50 dark:border-[#333C33] space-y-1 text-xs font-mono">
              {tocItems.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setMobileTocOpen(false)}
                  className={`block py-1.5 px-2 rounded-lg no-underline transition-colors ${
                    activeHeadingId === item.id
                      ? 'bg-[#657565]/15 text-[#657565] dark:text-[#A1B3A1] font-bold'
                      : 'text-[#7B8978] hover:text-[#20231F] dark:hover:text-white'
                  }`}
                >
                  <span className="text-[#657565] mr-2 font-bold">{item.number}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Two-Column Reading Layout: Sticky Desktop TOC + 720–850px Content */}
      <div className="flex gap-10 items-start justify-center">
        {/* Main Content Column (720–850px width) */}
        <main className="w-full max-w-[820px] space-y-10 text-[16.5px] leading-8 text-[#20231F] dark:text-[#EAE7E0] font-sans">
          {/* Engineering Warning Box */}
          <aside className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/25 p-4 sm:p-5 rounded-r-2xl text-xs sm:text-sm leading-relaxed text-amber-900 dark:text-amber-200 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 font-mono text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Engineering Verification Disclaimer</span>
            </div>
            <p className="m-0 font-sans text-xs">
              Educational and planning reference only. All engineering formulas, coefficients, and nominal assumptions must be independently verified against project drawings, local site conditions, and approved by a licensed professional engineer.
            </p>
          </aside>

          {/* Interactive Calculator Callout */}
          {article.relatedCalculators && article.relatedCalculators.length > 0 && (
            <div id="tool" className="p-5 rounded-2xl bg-gradient-to-br from-[#657565]/12 via-[#657565]/5 to-transparent border border-[#657565]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#657565] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0]">
                    Interactive Engineering Tool Available
                  </h3>
                  <p className="text-xs text-[#7B8978] mt-0.5 font-sans">
                    Execute real computations with verified formulas using our web calculator.
                  </p>
                </div>
              </div>

              <Link
                to={article.relatedCalculators[0].url}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#657565] hover:bg-[#536153] text-white text-xs font-bold rounded-xl no-underline transition-all shadow-xs shrink-0"
              >
                <span>Launch Calculator</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Section: Introduction */}
          {article.introduction && (
            <section id="introduction" className="space-y-4 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#657565] uppercase tracking-wider">
                <span>01. Introduction</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
                Introduction & Engineering Overview
              </h2>
              <div className="space-y-4 leading-8 text-[#333C33] dark:text-[#D1DDD1]">
                {article.introduction.split('\n\n').map((para, i) => (
                  <p key={i} className="m-0">{para}</p>
                ))}
              </div>
            </section>
          )}

          {/* Technical Diagram */}
          <ArticleDiagram slug={article.slug} />

          {/* Section: Theory */}
          {article.theory && (
            <section id="theory" className="space-y-4 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#657565] uppercase tracking-wider">
                <span>02. Technical Mechanics</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
                Engineering Theory & Governing Laws
              </h2>
              <div className="space-y-4 leading-8 text-[#333C33] dark:text-[#D1DDD1]">
                {article.theory.split('\n\n').map((para, i) => (
                  <p key={i} className="m-0">{para}</p>
                ))}
              </div>

              {/* Engineering Note Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#657565]">
                  <Info className="w-4 h-4 text-[#657565]" />
                  <span>Engineering Insight</span>
                </div>
                <p className="text-xs sm:text-[13px] text-[#555C55] dark:text-[#B2BEB2] leading-relaxed m-0 font-sans">
                  In structural and civil design, serviceability limits (such as deflection, crack width, and settlement) frequently govern over ultimate load-carrying strength. Always verify both limit states independently.
                </p>
              </div>
            </section>
          )}

          {/* Section: Formulas */}
          {article.formulas && article.formulas.length > 0 && (
            <section id="formulas" className="space-y-5 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#657565] uppercase tracking-wider">
                <span>03. Formulations</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
                Governing Equations & Formula Derivations
              </h2>

              <div className="grid gap-4">
                {article.formulas.map((f, i) => (
                  <div
                    key={i}
                    className="p-5 sm:p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#20231F] dark:text-[#EAE7E0]">{f.name}</h3>
                      {f.reference && (
                        <span className="text-[10px] font-mono text-[#7B8978] bg-[#EAE7E0] dark:bg-[#2A312A] px-2.5 py-0.5 rounded-md font-semibold">
                          {f.reference}
                        </span>
                      )}
                    </div>

                    {/* Formula equation highlight card */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2]/80 dark:border-[#384238] font-mono font-bold text-sm sm:text-base text-[#657565] dark:text-[#A1B3A1] overflow-x-auto shadow-2xs">
                      {f.equation}
                    </div>

                    {/* Variables table */}
                    {f.variables && f.variables.length > 0 && (
                      <div className="space-y-1.5 pt-1 text-xs">
                        <span className="text-[10px] font-mono uppercase font-bold text-[#7B8978]">Variable Definitions:</span>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs font-mono border-collapse">
                            <tbody>
                              {f.variables.map((v, vIdx) => (
                                <tr key={vIdx} className="border-b border-[#D8D0C2]/30 dark:border-[#333C33]/50">
                                  <td className="py-1 font-bold text-[#657565] w-24">{v.symbol}</td>
                                  <td className="py-1 text-[#555C55] dark:text-[#A4B2A4]">{v.meaning}</td>
                                  <td className="py-1 text-right text-[#7B8978]">{v.unit ? `[${v.unit}]` : ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Worked Numerical Example */}
          {article.stepByStepExample && (
            <section id="example" className="space-y-5 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#657565] uppercase tracking-wider">
                <span>04. Step-by-Step Numerical Example</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
                Worked Calculation Example
              </h2>

              <div className="rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] overflow-hidden shadow-2xs">
                {/* Scenario bar */}
                <div className="p-5 sm:p-6 border-b border-[#D8D0C2] dark:border-[#333C33] space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#657565] tracking-wider">
                    Engineering Scenario
                  </span>
                  <p className="text-xs sm:text-sm font-sans text-[#333C33] dark:text-[#D1DDD1] leading-relaxed m-0">
                    {article.stepByStepExample.scenario}
                  </p>
                </div>

                {/* GIVEN BOX */}
                {article.stepByStepExample.given && (
                  <div className="p-5 sm:p-6 bg-white dark:bg-[#252B25] border-b border-[#D8D0C2] dark:border-[#333C33]">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#657565] uppercase tracking-wider mb-3">
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>GIVEN PARAMETERS</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {Object.entries(article.stepByStepExample.given).map(([key, val]) => (
                        <div
                          key={key}
                          className="p-2.5 rounded-xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2]/60 dark:border-[#384238] text-xs font-mono"
                        >
                          <div className="text-[10px] text-[#7B8978]">{key}</div>
                          <div className="font-bold text-[#20231F] dark:text-[#EAE7E0] text-sm mt-0.5">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CALCULATION STEPS */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#657565] uppercase tracking-wider">
                    <Code className="w-3.5 h-3.5" />
                    <span>CALCULATION PROCEDURE</span>
                  </div>

                  <div className="space-y-3">
                    {article.stepByStepExample.steps?.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-white dark:bg-[#252B25] border border-[#D8D0C2] dark:border-[#384238] space-y-1.5 shadow-2xs"
                      >
                        <h4 className="text-xs sm:text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#657565] text-white flex items-center justify-center text-xs font-mono font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span>{step.title}</span>
                        </h4>
                        <p className="text-xs sm:text-[13px] font-mono text-[#555C55] dark:text-[#C5D0C5] leading-relaxed pl-8 m-0 whitespace-pre-wrap">
                          {step.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RESULT BOX */}
                {article.stepByStepExample.finalAnswer && (
                  <div className="p-5 sm:p-6 bg-gradient-to-br from-[#657565]/20 to-[#657565]/5 border-t border-[#657565]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-mono uppercase font-bold text-[#657565] dark:text-[#A1B3A1]">
                        FINAL COMPUTED OUTCOME
                      </div>
                      <div className="text-xs text-[#7B8978] mt-0.5">Verification against applicable design limits</div>
                    </div>
                    <div className="text-base sm:text-lg font-mono font-black text-[#657565] dark:text-[#A1B3A1] bg-white dark:bg-[#1E221E] px-4 py-2 rounded-xl border border-[#657565]/30 shadow-2xs">
                      {article.stepByStepExample.finalAnswer}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section: Freeform / Markdown Content */}
          {article.content && (
            <section id="content" className="space-y-4 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#657565] uppercase tracking-wider">
                <span>05. Detailed Guide</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
                Comprehensive Technical Walkthrough
              </h2>
              <div className="p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] shadow-2xs leading-8 text-[#333C33] dark:text-[#D1DDD1] whitespace-pre-wrap font-sans text-base">
                {article.content}
              </div>
            </section>
          )}

          {/* Section: Real-World Applications */}
          {article.realWorldApplications && article.realWorldApplications.length > 0 && (
            <section id="applications" className="space-y-4 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#657565] uppercase tracking-wider">
                <span>06. Site Context</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
                Real-World Construction Applications
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {article.realWorldApplications.map((app, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] space-y-1.5 shadow-2xs"
                  >
                    <h3 className="text-xs sm:text-sm font-bold text-[#20231F] dark:text-[#EAE7E0]">{app.title}</h3>
                    <p className="text-xs text-[#7B8978] leading-relaxed m-0 font-sans">{app.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Common Errors & Best Practices */}
          {article.commonErrors && article.commonErrors.length > 0 && (
            <section id="errors" className="space-y-4 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#657565] uppercase tracking-wider">
                <span>07. Quality Control</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
                Common Pitfalls & Site Best Practices
              </h2>

              <div className="grid gap-3.5">
                {article.commonErrors.map((err, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] space-y-2 shadow-2xs"
                  >
                    <div className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 shrink-0" />
                      <span>{err.error}</span>
                    </div>
                    <div className="text-xs text-[#7B8978] leading-relaxed font-sans">
                      <strong>Root Cause:</strong> {err.cause}
                    </div>
                    <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/25 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 leading-relaxed font-sans">
                      <strong>Engineering Solution:</strong> {err.solution}
                    </div>
                  </div>
                ))}
              </div>

              {/* Best Practices Bullet List */}
              {article.bestPractices && article.bestPractices.length > 0 && (
                <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-900/40 space-y-2.5">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    <CheckCircle className="w-4 h-4" />
                    <span>Recommended Engineering Best Practices</span>
                  </div>
                  <ul className="text-xs leading-relaxed text-[#333C33] dark:text-[#C5D0C5] space-y-1.5 pl-5 list-disc m-0 font-sans">
                    {article.bestPractices.map((bp, i) => (
                      <li key={i}>{bp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Section: Applicable Design Codes */}
          {article.designCodes && article.designCodes.length > 0 && (
            <section id="codes" className="space-y-4 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#657565] uppercase tracking-wider">
                <span>08. Design Standards</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
                Applicable Engineering Design Codes
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {article.designCodes.map((code, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] space-y-1 shadow-2xs"
                  >
                    <div className="text-xs font-bold text-[#657565] dark:text-[#A1B3A1] font-mono">{code.code}</div>
                    <div className="text-xs text-[#7B8978] leading-tight font-sans">{code.description}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: FAQs Accordion */}
          {article.faqs && article.faqs.length > 0 && (
            <section id="faqs" className="space-y-4 scroll-mt-24">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#657565] uppercase tracking-wider">
                <span>09. FAQ</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
                Frequently Asked Questions
              </h2>

              <div className="space-y-2.5">
                {article.faqs.map((faq, i) => {
                  const isOpen = openFaqIndex === i;
                  return (
                    <div
                      key={i}
                      className="rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] overflow-hidden shadow-2xs transition-colors"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                        className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] cursor-pointer hover:bg-white/40 dark:hover:bg-[#252B25]/40 transition-colors"
                      >
                        <span>{faq.question}</span>
                        <span className="text-[#657565] font-mono font-bold text-lg shrink-0">
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#555C55] dark:text-[#A4B2A4] leading-relaxed border-t border-[#D8D0C2]/50 dark:border-[#333C33]/50 font-sans">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Compact Author Bio Section */}
          <div className="p-6 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] flex items-center gap-4 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#657565] to-[#455245] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 select-none">
              CM
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">CivilMath Team</div>
              <div className="text-xs text-[#7B8978] leading-relaxed font-sans">
                “Practical civil engineering knowledge, calculations and construction guides.”
              </div>
            </div>
          </div>

          {/* Previous / Next Article Navigation */}
          {(prevArticle || nextArticle) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-[#D8D0C2]/60 dark:border-[#333C33]">
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
          {relatedArticles.length > 0 && (
            <div className="pt-8 border-t border-[#D8D0C2]/60 dark:border-[#333C33] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
                  Related Engineering Articles
                </h3>
                <Link
                  to="/articles"
                  className="text-xs font-semibold text-[#657565] dark:text-[#A1B3A1] hover:underline flex items-center gap-1 no-underline"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedArticles.map(rel => {
                  const relCover = getArticleCoverImage(rel.slug, rel.category, rel.coverImage);
                  return (
                    <Link
                      key={rel.slug}
                      to={`/articles/${rel.slug}`}
                      className="group flex flex-col bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-2xl overflow-hidden hover:border-[#657565] transition-all no-underline shadow-2xs hover:shadow-xs"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EAE7E0] dark:bg-[#252B25]">
                        <img
                          src={relCover.url}
                          alt={relCover.alt}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold">
                          {rel.category}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                        <h4 className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0] group-hover:text-[#657565] dark:group-hover:text-[#A1B3A1] transition-colors leading-snug line-clamp-2">
                          {rel.title}
                        </h4>
                        <div className="text-[10px] font-mono text-[#7B8978] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{rel.readTimeMinutes} min read</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Desktop Sticky Table of Contents (Right Sidebar) */}
        {tocItems.length > 0 && (
          <aside className="hidden lg:block w-72 shrink-0 sticky top-24 space-y-4">
            <div className="p-5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#20231F] dark:text-[#EAE7E0] pb-2 border-b border-[#D8D0C2]/50 dark:border-[#333C33]">
                <span className="flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px] text-[#657565] dark:text-[#A1B3A1]">
                  <List className="w-3.5 h-3.5" />
                  Table of Contents
                </span>
                <span className="text-[10px] font-mono text-[#7B8978]">{tocItems.length}</span>
              </div>

              <nav className="space-y-1 text-xs font-mono max-h-[70vh] overflow-y-auto pr-1">
                {tocItems.map(item => {
                  const isActive = activeHeadingId === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block py-1.5 px-2.5 rounded-xl no-underline transition-all text-[11px] ${
                        isActive
                          ? 'bg-[#657565] text-white font-bold shadow-2xs translate-x-1'
                          : 'text-[#657565] dark:text-[#9FB19F] hover:bg-[#EAE7E0]/60 dark:hover:bg-[#2A312A]'
                      }`}
                    >
                      <span className={`mr-2 ${isActive ? 'text-white/80' : 'text-[#7B8978]'}`}>
                        {item.number}
                      </span>
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Quick Calculator Shortcut in Sidebar */}
            {article.relatedCalculators && article.relatedCalculators.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#657565]/10 border border-[#657565]/20 space-y-2">
                <div className="text-[10px] font-mono uppercase font-bold text-[#657565] dark:text-[#A1B3A1] flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Related Tool</span>
                </div>
                <div className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0] line-clamp-2">
                  {article.relatedCalculators[0].name}
                </div>
                <Link
                  to={article.relatedCalculators[0].url}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#657565] dark:text-[#A1B3A1] hover:underline no-underline"
                >
                  <span>Open Tool</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
