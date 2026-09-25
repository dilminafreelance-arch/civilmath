import { Link, useLocation } from 'react-router-dom';
import {
  Home, Box, Grid, Compass,
  Layers, ArrowLeftRight, ClipboardList,
  FileText, Bookmark, BookOpen, ChevronRight
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  count: number;
  path: string;
  icon: any;
  color: string;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'concrete', name: 'Concrete', count: 6, path: '/concrete', icon: Box, color: '#8CA0F0' },
  { id: 'reinforcement', name: 'Reinforcement', count: 5, path: '/concrete/rebar', icon: Grid, color: '#C9A876' },
  { id: 'masonry', name: 'Masonry', count: 4, path: '/concrete/brick', icon: Layers, color: '#E0977B' },
  { id: 'earthwork', name: 'Earthwork', count: 5, path: '/construction', icon: HardHat, color: '#D9B96E' },
  { id: 'surveying', name: 'Surveying', count: 4, path: '/surveying', icon: Compass, color: '#7DD3E0' },
  { id: 'area-volume', name: 'Area & Volume', count: 6, path: '/calculators', icon: Layers, color: '#A5B4F5' },
  { id: 'quantity', name: 'Quantity Estimation', count: 5, path: '/bbs', icon: ClipboardList, color: '#C7A8E5' },
  { id: 'conversions', name: 'Conversions', count: 8, path: '/utilities/unit-converter', icon: ArrowLeftRight, color: '#9CA3C9' },
];

const TOOLS = [
  { name: 'Unit Converter', path: '/utilities/unit-converter', icon: ArrowLeftRight },
  { name: 'Engineering Articles', path: '/articles', icon: BookOpen },
  { name: 'Formula Library', path: '/formulas', icon: FileText },
  { name: 'Material Guide', path: '/guides', icon: Bookmark },
  { name: 'Saved Calculations', path: '/dashboard', icon: Bookmark },
];

interface LeftSidebarProps {
  onItemClick?: () => void;
  className?: string;
}

export default function LeftSidebar({ onItemClick, className = '' }: LeftSidebarProps) {
  const location = useLocation();

  const isCategoryActive = (item: CategoryItem) => {
    if (item.id === 'concrete') {
      return location.pathname.startsWith('/concrete') && !location.pathname.includes('/rebar') && !location.pathname.includes('/brick');
    }
    if (item.id === 'reinforcement') {
      return location.pathname.includes('/rebar') || location.pathname.includes('/steel');
    }
    if (item.id === 'masonry') {
      return location.pathname.includes('/brick');
    }
    if (item.id === 'surveying') {
      return location.pathname.startsWith('/surveying');
    }
    if (item.id === 'quantity') {
      return location.pathname.startsWith('/bbs');
    }
    if (item.id === 'conversions') {
      return location.pathname.includes('/unit-converter');
    }
    if (item.id === 'area-volume') {
      return location.pathname === '/calculators';
    }
    return location.pathname === item.path;
  };

  // Sidebar is intentionally always dark (independent of the light/dark theme toggle),
  // matching the dark nav-rail look of the reference dashboard.
  return (
    <aside className={`w-64 shrink-0 flex flex-col justify-between py-6 px-4 bg-[#0C0F1D] border-r border-[#1C2138] select-none text-left ${className}`}>
      {/* Top Section */}
      <div className="space-y-6">
        {/* Geometric Engineering Logo (No brand name) */}
        <Link to="/" onClick={onItemClick} className="flex items-center gap-3 px-2 no-underline group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4C5FE0] to-[#7C88B8] flex items-center justify-center text-white shadow-[0_4px_14px_rgba(76,95,224,0.4)] group-hover:scale-105 transition-transform">
            {/* Geometric isometric engineering mark */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-extrabold tracking-wider uppercase text-[#E7EAF7] leading-tight">
              Engineering Tools
            </div>
            <div className="text-[9.5px] font-medium tracking-wide text-[#7C88B8]">
              Precision Workspace
            </div>
          </div>
        </Link>

        {/* Home Button */}
        <div>
          <Link
            to="/"
            onClick={onItemClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors no-underline ${
              location.pathname === '/'
                ? 'bg-[#1B2140] text-[#E7EAF7]'
                : 'text-[#9AA3C4] hover:bg-[#141830] hover:text-[#E7EAF7]'
            }`}
          >
            <Home className="w-4 h-4 text-[#7C88B8]" />
            <span>Home</span>
          </Link>
        </div>

        {/* Calculators Categories */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[9px] font-bold font-mono uppercase tracking-wider text-[#5E6996]">
            Calculators
          </div>

          <div className="space-y-0.5">
            {CATEGORIES.map((cat) => {
              const active = isCategoryActive(cat);
              const IconComp = cat.icon;

              return (
                <Link
                  key={cat.id}
                  to={cat.path}
                  onClick={onItemClick}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all no-underline ${
                    active
                      ? 'bg-[#4C5FE0] text-white shadow-[0_4px_14px_rgba(76,95,224,0.35)] font-semibold'
                      : 'text-[#C9D0EA] hover:bg-[#141830]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                      style={{ color: active ? '#ffffff' : cat.color }}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[10px] font-mono ${active ? 'text-white/80' : 'text-[#5E6996]'}`}>
                      {cat.count}
                    </span>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-white/90" />}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Tools Section */}
      <div className="pt-4 border-t border-[#1C2138] space-y-1">
        <div className="px-3 pb-1 text-[9px] font-bold font-mono uppercase tracking-wider text-[#5E6996]">
          Tools
        </div>

        {TOOLS.map((t) => {
          const IconComp = t.icon;
          const active = location.pathname === t.path;

          return (
            <Link
              key={t.name}
              to={t.path}
              onClick={onItemClick}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-colors no-underline ${
                active
                  ? 'bg-[#1B2140] text-[#E7EAF7] font-semibold'
                  : 'text-[#9AA3C4] hover:bg-[#141830] hover:text-[#E7EAF7]'
              }`}
            >
              <IconComp className="w-3.5 h-3.5 text-[#7C88B8]" />
              <span className="truncate">{t.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
