import React, { useEffect, useState } from 'react';
import { List, ChevronDown } from 'lucide-react';
import { Article, ArticleBlock } from '../../types/article';

export interface TocItem {
  id: string;
  label: string;
  number: string;
  level: 2 | 3;
}

export interface TableOfContentsProps {
  article: Article;
  activeId?: string;
  onSelect?: (id: string) => void;
  mode?: 'all' | 'mobile-only' | 'sidebar-only';
}

/**
 * Extracts Table of Contents items from article blocks or legacy article fields.
 */
export function extractTocItems(article: Article): TocItem[] {
  const items: TocItem[] = [];
  let counter = 1;

  const addItem = (id: string, label: string, level: 2 | 3 = 2) => {
    if (!id || !label) return;
    // Prevent duplicate IDs
    if (items.some(it => it.id === id)) return;

    const numStr = counter < 10 ? `0${counter}` : `${counter}`;
    items.push({ id, label, number: numStr, level });
    if (level === 2) counter++;
  };

  // Check if article has HTML content
  if (article.content && (article.contentFormat === 'html' || article.content.includes('<h2') || article.content.includes('<h3'))) {
    const headingRegex = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let match;
    while ((match = headingRegex.exec(article.content)) !== null) {
      const level = Number(match[1]) as 2 | 3;
      const text = match[2].replace(/<[^>]*>/g, '').trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (id && text) {
        addItem(id, text, level);
      }
    }
  } else if (article.blocks && article.blocks.length > 0) {
    for (const b of article.blocks) {
      if (b.visibility === false) continue;

      if (b.type === 'heading_2') {
        const text = b.content || b.title || '';
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (id) addItem(id, text, 2);
      } else if (b.type === 'heading_3') {
        const text = b.content || b.title || '';
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (id) addItem(id, text, 3);
      } else if (b.type === 'formula' && b.title) {
        const id = `formula-${b.id}`;
        addItem(id, `Formula: ${b.title}`, 2);
      } else if (b.type === 'calculation_example' && (b.title || b.data?.title)) {
        const id = `calc-${b.id}`;
        addItem(id, `Example: ${b.title || b.data?.title}`, 2);
      } else if (b.type === 'faq') {
        addItem('faq-section', 'Frequently Asked Questions', 2);
      }
    }
  } else {
    // Fallback for legacy articles without blocks
    if (article.introduction) addItem('introduction', 'Introduction & Overview', 2);
    if (article.theory) addItem('theory', 'Engineering Theory & Mechanics', 2);
    if (article.formulas && article.formulas.length > 0) addItem('formulas', 'Governing Formulas', 2);
    if (article.stepByStepExample) addItem('example', 'Worked Numerical Example', 2);
    if (article.content) addItem('content', 'Detailed Engineering Guide', 2);
    if (article.realWorldApplications && article.realWorldApplications.length > 0) addItem('applications', 'Practical Applications', 2);
    if (article.commonErrors && article.commonErrors.length > 0) addItem('errors', 'Pitfalls & Quality Control', 2);
    if (article.designCodes && article.designCodes.length > 0) addItem('codes', 'Applicable Design Codes', 2);
    if (article.faqs && article.faqs.length > 0) addItem('faqs', 'Frequently Asked Questions', 2);
  }

  return items;
}

export default function TableOfContents({
  article,
  activeId,
  onSelect,
  mode = 'all',
}: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentActiveId, setCurrentActiveId] = useState<string>(activeId || '');

  useEffect(() => {
    setItems(extractTocItems(article));
  }, [article]);

  useEffect(() => {
    if (activeId) {
      setCurrentActiveId(activeId);
    }
  }, [activeId]);

  // Scroll spy observer
  useEffect(() => {
    if (items.length === 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const elements = items.map(it => document.getElementById(it.id)).filter(Boolean) as HTMLElement[];

      let found = items[0]?.id || '';
      for (const el of elements) {
        const top = el.offsetTop - 140;
        if (scrollY >= top) {
          found = el.id;
        }
      }
      setCurrentActiveId(found);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMobileOpen(false);
    setCurrentActiveId(id);
    const element = document.getElementById(id);
    if (element) {
      const topOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      try {
        window.history.replaceState(null, '', `#${id}`);
      } catch {}
    }
    if (onSelect) {
      onSelect(id);
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      {/* Mobile Collapsible TOC */}
      {mode !== 'sidebar-only' && (
        <div className="lg:hidden w-full mb-8 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-2xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileOpen(prev => !prev)}
          className="w-full p-4 flex items-center justify-between text-xs font-bold text-[#20231F] dark:text-[#EAE7E0] cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-[#657565]" />
            <span>On This Page ({items.length} Sections)</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#7B8978] transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
        </button>

        {mobileOpen && (
          <div className="p-4 pt-0 border-t border-[#D8D0C2]/50 dark:border-[#333C33] space-y-1 text-xs font-mono max-h-72 overflow-y-auto">
            {items.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={e => handleItemClick(e, item.id)}
                className={`block py-1.5 px-2 rounded-lg no-underline transition-colors ${
                  item.level === 3 ? 'pl-6 text-[11px]' : ''
                } ${
                  currentActiveId === item.id
                    ? 'bg-[#657565]/15 text-[#657565] dark:text-[#A1B3A1] font-bold'
                    : 'text-[#7B8978] hover:text-[#20231F] dark:hover:text-white'
                }`}
              >
                {item.level === 2 && <span className="text-[#657565] mr-2 font-bold">{item.number}</span>}
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Desktop Sticky Sidebar TOC */}
      {mode !== 'mobile-only' && (
        <div className="hidden lg:block p-5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-[#20231F] dark:text-[#EAE7E0] pb-2 border-b border-[#D8D0C2]/50 dark:border-[#333C33]">
          <span className="flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px] text-[#657565] dark:text-[#A1B3A1]">
            <List className="w-3.5 h-3.5" />
            Table of Contents
          </span>
          <span className="text-[10px] font-mono text-[#7B8978]">{items.length}</span>
        </div>

        <nav className="space-y-1 text-xs font-mono max-h-[65vh] overflow-y-auto pr-1">
          {items.map(item => {
            const isActive = currentActiveId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={e => handleItemClick(e, item.id)}
                className={`block py-1.5 px-2.5 rounded-xl no-underline transition-all ${
                  item.level === 3 ? 'pl-5 text-[10.5px] opacity-90' : 'text-[11px]'
                } ${
                  isActive
                    ? 'bg-[#657565] text-white font-bold shadow-2xs translate-x-1'
                    : 'text-[#657565] dark:text-[#9FB19F] hover:bg-[#EAE7E0]/60 dark:hover:bg-[#2A312A]'
                }`}
              >
                {item.level === 2 && (
                  <span className={`mr-2 ${isActive ? 'text-white/80' : 'text-[#7B8978]'}`}>
                    {item.number}
                  </span>
                )}
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
      )}
    </>
  );
}
