import { Link, useLocation } from 'react-router-dom';
import {
  Home, Box, Grid, Compass, HardHat,
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
    <aside className={`w-64 shrink-0 flex flex-col justify-between py-6 px-4 bg-[#0D100E] border-r border-white/8 select-none text-left ${className}`}>
      {/* Top Section */}
      <div className="space-y-6">
        {/* Geometric Engineering Logo */}
        <Link to="/" onClick={onItemClick} className="flex items-center gap-3 px-2 no-underline group">
          <div className="w-8 h-8 rounded-lg bg-[#18221D] border border-[#34D399]/30 flex items-center justify-center text-[#34D399] shadow-[0_0_12px_rgba(52,211,153,0.15)] group-hover:scale-105 transition-transform">
            {/* Geometric isometric engineering mark */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight text-[#ECF2EE] leading-tight">
              Civil<span className="text-[#34D399]">Math</span>
            </div>
            <div className="text-[9px] font-mono tracking-wider uppercase text-[#7A8981]">
              Precision Studio
            </div>
          </div>
        </Link>

        {/* Home Button */}
        <div>
          <Link
            to="/"
            onClick={onItemClick}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors no-underline ${
              location.pathname === '/'
                ? 'bg-[#18221D] text-[#34D399] border border-[#34D399]/25 shadow-2xs'
                : 'text-[#97A69E] hover:bg-[#131715] hover:text-[#ECF2EE]'
            }`}
          >
            <Home className="w-4 h-4 text-[#7A8981]" />
            <span>Overview</span>
          </Link>
        </div>

        {/* Calculators Categories */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[9px] font-mono font-bold uppercase tracking-wider text-[#64736B]">
            DISCIPLINES
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
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all no-underline ${
                    active
                      ? 'bg-[#18221D] text-[#34D399] border border-[#34D399]/30 font-semibold shadow-2xs'
                      : 'text-[#97A69E] hover:bg-[#131715] hover:text-[#ECF2EE]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
                      style={{ color: active ? '#34D399' : '#7A8981' }}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[9.5px] font-mono ${active ? 'text-[#34D399]' : 'text-[#64736B]'}`}>
                      {cat.count}
                    </span>
                    {active && <ChevronRight className="w-3 h-3 text-[#34D399]" />}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Tools Section */}
      <div className="pt-4 border-t border-white/8 space-y-1">
        <div className="px-3 pb-1 text-[9px] font-mono font-bold uppercase tracking-wider text-[#64736B]">
          RESOURCES
        </div>

        {TOOLS.map((t) => {
          const IconComp = t.icon;
          const active = location.pathname === t.path;

          return (
            <Link
              key={t.name}
              to={t.path}
              onClick={onItemClick}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors no-underline ${
                active
                  ? 'bg-[#18221D] text-[#34D399] border border-[#34D399]/25 font-semibold'
                  : 'text-[#97A69E] hover:bg-[#131715] hover:text-[#ECF2EE]'
              }`}
            >
              <IconComp className="w-3.5 h-3.5 text-[#7A8981]" />
              <span className="truncate">{t.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
