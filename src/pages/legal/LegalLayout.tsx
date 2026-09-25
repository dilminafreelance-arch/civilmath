import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, Calendar, ArrowLeft, Printer, Check, Copy } from 'lucide-react';

interface TocItem {
  id: string;
  label: string;
}

interface LegalLayoutProps {
  title: string;
  badge?: string;
  lastUpdated: string;
  summary: string;
  toc?: TocItem[];
  children: ReactNode;
}

export default function LegalLayout({
  title,
  badge = 'CivilMath Legal & Trust Center',
  lastUpdated,
  summary,
  toc = [],
  children,
}: LegalLayoutProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left pb-12 font-sans">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#7B8978] font-mono">
        <Link to="/" className="hover:text-[#20231F] dark:hover:text-white transition-colors no-underline">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span>Legal & Trust</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#20231F] dark:text-[#EAE7E0] font-semibold truncate max-w-[200px] sm:max-w-none">
          {title}
        </span>
      </nav>

      {/* Header Block */}
      <header className="space-y-4 border-b border-[#D8D0C2] dark:border-[#333C33] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#657565]/10 dark:bg-[#657565]/20 text-[#657565] dark:text-[#9FB19F]">
            <Shield className="w-3.5 h-3.5" />
            <span>{badge}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              type="button"
              className="inline-flex items-center gap-1 text-xs text-[#7B8978] hover:text-[#20231F] dark:hover:text-white px-2.5 py-1 rounded-lg border border-[#D8D0C2] dark:border-[#384238] hover:bg-white dark:hover:bg-[#252B25] transition-colors cursor-pointer"
              title="Copy page URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1 text-xs text-[#7B8978] hover:text-[#20231F] dark:hover:text-white px-2.5 py-1 rounded-lg border border-[#D8D0C2] dark:border-[#384238] hover:bg-white dark:hover:bg-[#252B25] transition-colors cursor-pointer"
              title="Print document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Single H1 for SEO compliance */}
        <h1 className="text-3xl sm:text-4xl font-black text-[#20231F] dark:text-[#EAE7E0] tracking-tight leading-tight">
          {title}
        </h1>

        <div className="flex items-center gap-2 text-xs text-[#7B8978] font-mono">
          <Calendar className="w-3.5 h-3.5" />
          <span>Last Updated: {lastUpdated}</span>
          <span>·</span>
          <span>Effective: Immediate</span>
        </div>

        {/* Executive Summary Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#333C33] text-xs sm:text-sm text-[#555C55] dark:text-[#C5D0C5] leading-relaxed">
          <strong className="text-[#20231F] dark:text-[#EAE7E0] font-bold block mb-1 uppercase font-mono text-[11px] tracking-wider">
            Key Takeaway / Overview
          </strong>
          {summary}
        </div>
      </header>

      {/* Table of Contents (if provided) */}
      {toc.length > 0 && (
        <nav aria-label="Table of Contents" className="p-5 rounded-2xl bg-white/70 dark:bg-[#1E221E]/70 border border-[#D8D0C2] dark:border-[#333C33] space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7B8978] font-mono">
            Table of Contents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {toc.map((item, idx) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center gap-2 p-1.5 rounded-lg text-[#555C55] dark:text-[#A4B2A4] hover:text-[#657565] dark:hover:text-[#9FB19F] hover:bg-[#F3F1EC] dark:hover:bg-[#252B25] transition-colors no-underline"
              >
                <span className="font-mono text-[11px] text-[#7B8978] w-5 shrink-0">{idx + 1}.</span>
                <span className="truncate">{item.label}</span>
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* Main Content Body */}
      <article className="prose prose-slate dark:prose-invert max-w-none text-[#333933] dark:text-[#D0DDD0] text-sm leading-relaxed space-y-8">
        {children}
      </article>

      {/* Legal Footer Note */}
      <div className="pt-8 border-t border-[#D8D0C2] dark:border-[#333C33] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#7B8978]">
        <div>
          Have questions regarding this document? Contact us at{' '}
          <a href="mailto:support@civilmath.com" className="text-[#657565] dark:text-[#9FB19F] font-mono hover:underline">
            support@civilmath.com
          </a>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#657565] dark:text-[#9FB19F] hover:underline font-semibold no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to CivilMath Home
        </Link>
      </div>
    </div>
  );
}
