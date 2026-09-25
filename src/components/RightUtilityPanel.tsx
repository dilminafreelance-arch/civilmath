import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock, Box,
  ArrowLeftRight, FileText, BookOpen, Bookmark,
  ExternalLink, Star, Copy, MoreVertical, X
} from 'lucide-react';

interface RecentCalc {
  id: string;
  name: string;
  value: string;
  detail: string;
  time: string;
  path: string;
  iconBg: string;
  iconColor: string;
}

const RECENT_CALCS: RecentCalc[] = [
  {
    id: '1',
    name: 'Concrete Volume',
    value: '3.00 m³',
    detail: '5.00 × 4.00 × 0.15',
    time: '2 min ago',
    path: '/concrete/volume',
    iconBg: 'rgba(76, 95, 224, 0.14)',
    iconColor: '#3B47B8',
  },
  {
    id: '2',
    name: 'Rebar Weight',
    value: '5.33 kg',
    detail: '12 mm × 6 m',
    time: '1 hour ago',
    path: '/concrete/rebar',
    iconBg: 'rgba(154, 128, 98, 0.14)',
    iconColor: '#846B4E',
  },
  {
    id: '3',
    name: 'Brick Quantity',
    value: '1,728 pcs',
    detail: 'Wall 3.6 × 2.4 × 0.2',
    time: '3 hours ago',
    path: '/concrete/brick',
    iconBg: 'rgba(181, 111, 80, 0.14)',
    iconColor: '#9C4E2D',
  },
  {
    id: '4',
    name: 'Plaster Quantity',
    value: '0.76 m³',
    detail: '25.4 m²',
    time: '5 hours ago',
    path: '/concrete/brick',
    iconBg: 'rgba(156, 181, 196, 0.18)',
    iconColor: '#45677A',
  },
  {
    id: '5',
    name: 'Earthwork Volume',
    value: '180.00 m³',
    detail: 'Area 120 m² × 1.5 m',
    time: '1 day ago',
    path: '/construction',
    iconBg: 'rgba(217, 185, 110, 0.18)',
    iconColor: '#806626',
  },
];

const QUICK_TOOLS = [
  { name: 'Unit Converter', path: '/utilities/unit-converter', icon: ArrowLeftRight },
  { name: 'Formula Library', path: '/formulas', icon: FileText },
  { name: 'Material Guide', path: '/guides', icon: BookOpen },
  { name: 'Saved Items', path: '/dashboard', icon: Bookmark },
];

const ENGINEERING_TIPS = [
  { text: "The minimum concrete cover for a footing exposed to soil is 75 mm per ACI 318.", attr: "ACI 318-19 §20.6" },
  { text: "For a simply supported beam, maximum bending moment = qL²/8 at midspan.", attr: "Structural Mechanics" },
  { text: "Standard concrete mix ratios by volume: 1:2:4 (M15), 1:1.5:3 (M20), 1:1:2 (M25).", attr: "IS 456:2000" },
  { text: "Rebar development length in tension ≈ 40Ø for M20 concrete and Fe415 steel.", attr: "IS 456 Cl. 26.2" },
  { text: "Compression steel in columns reduces creep deformation and long-term shortening.", attr: "AISC / ACI" },
  { text: "Terzaghi's general bearing capacity: qu = 1.3·c·Nc + q·Nq + 0.4·γ·B·Nγ", attr: "Terzaghi (1943)" },
  { text: "Measure twice, build once — precision in estimating saves costly site rework.", attr: "Engineering Principle" },
  { text: "A 10% increase in slab thickness reduces deflection by ~27% (∝ h³).", attr: "Elastic Theory" },
];

function timeAgo(ts: number | undefined): string {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ICON_COLORS = [
  { bg: 'rgba(101,117,101,0.14)', color: '#526052' },
  { bg: 'rgba(154,128,98,0.14)', color: '#846B4E' },
  { bg: 'rgba(181,111,80,0.14)', color: '#9C4E2D' },
  { bg: 'rgba(156,181,196,0.18)', color: '#45677A' },
  { bg: 'rgba(217,185,110,0.18)', color: '#806626' },
  { bg: 'rgba(183,168,197,0.18)', color: '#6B5A7E' },
  { bg: 'rgba(123,137,120,0.18)', color: '#4A5E4A' },
  { bg: 'rgba(181,111,80,0.12)', color: '#B56F50' },
];

export default function RightUtilityPanel({ className = '' }: { className?: string }) {
  const { recentCalculatorIds, recentCalcTimestamps, favoriteCalculatorIds, toggleFavoriteCalculator } = useApp();
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Today's rotating tip — changes daily
  const todaysTip = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000) % ENGINEERING_TIPS.length;
    return ENGINEERING_TIPS[dayIndex];
  }, []);

  // Build live recent calcs list from context
  const recentCalcs = useMemo(() =>
    recentCalculatorIds.slice(0, 5).map((id, idx) => {
      const calc = CALCULATORS_LIST.find(c => c.id === id);
      if (!calc) return null;
      const ts = recentCalcTimestamps[id];
      const isFav = favoriteCalculatorIds.includes(id);
      const colorSet = ICON_COLORS[idx % ICON_COLORS.length];
      const path = calc.category === 'bbs'
        ? '/bbs/footing'
        : `/${CATEGORY_PATH_MAP[calc.category]}/${getCalculatorSlug(calc)}`;
      return { id, name: calc.name, category: calc.category, ts, isFav, colorSet, path };
    }).filter(Boolean) as NonNullable<ReturnType<typeof recentCalculatorIds.slice>[0]>[],
    [recentCalculatorIds, recentCalcTimestamps, favoriteCalculatorIds]
  );

  return (
    <aside className={`w-80 shrink-0 flex flex-col gap-6 py-6 px-4 backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#11141F]/80 border-l border-[#DCE3F5] dark:border-[#262E42] select-none text-left ${className}`}>
      {/* 1. Recent Calculations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#7C88B8]" />
            <h3 className="text-xs font-bold text-[#161A2C] dark:text-[#E7EAF7]">
              Recent Calculations
            </h3>
          </div>
          <Link
            to="/dashboard"
            className="text-[10px] font-semibold text-[#7C88B8] hover:text-[#161A2C] dark:hover:text-white no-underline transition-colors"
          >
            See all
          </Link>
        </div>

        <div className="space-y-1.5">
          {RECENT_CALCS.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-white/80 dark:bg-[#141826]/70 border border-[#DCE3F5]/70 dark:border-[#2A3350] hover:border-[#7C88B8]/60 transition-all no-underline group shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/80 dark:bg-[#242A24] border border-[#D8D0C2]/70 dark:border-[#384238] hover:border-[#7B8978]/60 transition-all group shadow-2xs cursor-pointer"
                  onClick={() => { if (openMenuId !== item.id) navigate(item.path); }}
                >
                  <Box className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11.5px] font-bold text-[#161A2C] dark:text-[#E7EAF7] truncate">
                    {item.name}
                  </div>
                  <div className="text-[9.5px] font-mono text-[#7C88B8] dark:text-[#8894BE] truncate">
                    {item.detail}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                <div className="text-right">
                  <div className="text-xs font-bold text-[#161A2C] dark:text-[#E7EAF7]">
                    {item.value}
                  </div>
                  <div className="text-[9px] font-mono text-[#8894BE] dark:text-[#6B7AA6]">
                    {item.time}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="p-1 rounded-lg text-[#8894BE] hover:text-[#161A2C] dark:hover:text-white transition-colors cursor-pointer"
                  title="More actions"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 2. Quick Tools (2 x 2 grid) */}
      <div className="space-y-3">
        <div className="px-1 text-xs font-bold text-[#161A2C] dark:text-[#E7EAF7]">
          Quick Tools
        </div>

        <div className="grid grid-cols-2 gap-2">
          {QUICK_TOOLS.map((tool) => {
            const IconComp = tool.icon;
            return (
              <Link
                key={tool.name}
                to={tool.path}
                className="flex items-center gap-2 p-3 rounded-2xl bg-white/80 dark:bg-[#141826]/70 border border-[#DCE3F5]/70 dark:border-[#2A3350] hover:border-[#7C88B8]/60 transition-all no-underline group shadow-2xs text-left"
              >
                <div className="w-7 h-7 rounded-xl bg-[#EEF1FB] dark:bg-[#232A3D] flex items-center justify-center text-[#7C88B8] group-hover:text-[#161A2C] dark:group-hover:text-white shrink-0 transition-colors">
                  <IconComp className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-[#161A2C] dark:text-[#E7EAF7] leading-tight">
                  {tool.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. Architectural Inspiration Card */}
      <div className="mt-auto relative p-5 rounded-3xl bg-gradient-to-br from-[#F7F9FF] to-[#E7EAF7] dark:from-[#141826] dark:to-[#1B1E1B] border border-[#DCE3F5] dark:border-[#2A3350] overflow-hidden shadow-2xs">
        {/* Faint architectural lines */}
        <div className="absolute inset-0 opacity-10 blueprint-grid pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="text-2xl font-serif text-[#7C88B8] leading-none block">“</span>
          <p className="text-xs font-semibold text-[#161A2C] dark:text-[#E7EAF7] leading-snug">
            Measure twice, build once.
          </p>
          <div className="w-6 h-[1.5px] bg-[#9A8062] rounded-full my-1.5" />
          <p className="text-[10px] font-medium text-[#7C88B8] dark:text-[#8894BE]">
            Good engineering lasts.
          </p>
        </div>
      </div>
    </aside>
  );
}
