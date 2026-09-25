import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Layers, Square, Minus, Grid3x3, Box, RectangleVertical, Grid, RefreshCw } from 'lucide-react';

// ---------- Popular Calculators (icon grid with soft-colored tiles) ----------
export const POPULAR_CALCULATORS = [
  { id: 'concrete-volume', name: 'Concrete Mix Calculator', path: '/concrete/volume', icon: 'Layers', color: '#4C5FE0' },
  { id: 'structural-slab', name: 'Slab Calculator', path: '/structural/slab', icon: 'Square', color: '#4C5FE0' },
  { id: 'structural-beam', name: 'Beam Calculator', path: '/structural/beam', icon: 'Minus', color: '#E17055' },
  { id: 'brick-calculator', name: 'Brickwork Calculator', path: '/concrete/brick', icon: 'Grid3x3', color: '#E17055' },
  { id: 'geotech-bearing', name: 'Foundation Calculator', path: '/geotechnical/bearing-capacity', icon: 'Box', color: '#7C88B8' },
  { id: 'structural-column', name: 'Column Calculator', path: '/structural/column', icon: 'RectangleVertical', color: '#7C88B8' },
  { id: 'rebar-calculator', name: 'Rebar Calculator', path: '/concrete/rebar', icon: 'Grid', color: '#00B894' },
  { id: 'utility-convert', name: 'Unit Converter', path: '/utilities/unit-converter', icon: 'RefreshCw', color: '#00B894' },
];

const ICONS: Record<string, any> = { Layers, Square, Minus, Grid3x3, Box, RectangleVertical, Grid, RefreshCw };

export function PopularCalculatorsGrid() {
  const navigate = useNavigate();
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#161A2C] dark:text-[#E7EAF7]">Popular Calculators</h3>
        <button className="text-xs font-semibold text-[#4C5FE0] hover:underline inline-flex items-center gap-1 cursor-pointer">
          View All <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {POPULAR_CALCULATORS.map((c) => {
          const Icon = ICONS[c.icon] || Layers;
          return (
            <button
              key={c.id}
              onClick={() => navigate(c.path)}
              className="group text-left p-3.5 rounded-xl border border-[#EEF1FB] dark:border-[#2A3350] hover:border-[#4C5FE0]/40 hover:shadow-md transition-all cursor-pointer"
              style={{ backgroundColor: `${c.color}0D` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${c.color}22`, color: c.color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-[#161A2C] dark:text-[#E7EAF7] leading-tight">{c.name}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#4C5FE0] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Your Progress donut chart (pure SVG, no chart library) ----------
export interface DonutSlice { label: string; value: number; color: string }

export function ProgressDonut({ slices, total, centerLabel }: { slices: DonutSlice[]; total: number; centerLabel: string }) {
  const size = 160;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#161A2C] dark:text-[#E7EAF7]">Your Progress</h3>
      </div>
      <div className="flex items-center gap-6 flex-wrap">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF1FB" strokeWidth={stroke} />
            {slices.map((s, i) => {
              const frac = total > 0 ? s.value / total : 0;
              const dash = frac * c;
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-[#161A2C] dark:text-[#E7EAF7]">{total}</span>
            <span className="text-[10px] text-[#8891B0] text-center leading-tight">{centerLabel}</span>
          </div>
        </div>
        <div className="space-y-2 flex-1 min-w-[140px]">
          {slices.map((s) => (
            <div key={s.label} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[#4A5578] dark:text-[#C9D0EA]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
              <span className="font-semibold text-[#161A2C] dark:text-[#E7EAF7]">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Quick Stats bar chart (pure CSS bars) ----------
export function QuickStatsBar({ data, headline, sublabel, changeLabel }: { data: { label: string; value: number }[]; headline: string; sublabel: string; changeLabel?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const peakIdx = data.findIndex((d) => d.value === max);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#161A2C] dark:text-[#E7EAF7]">Quick Stats</h3>
        {changeLabel && (
          <span className="text-[11px] font-bold text-[#00B894] bg-[#00B894]/10 px-2 py-0.5 rounded-full">{changeLabel}</span>
        )}
      </div>
      <div className="flex items-end gap-4 mb-4">
        <div className="w-11 h-11 rounded-xl bg-[#4C5FE0]/10 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 20 20" className="w-5 h-5 text-[#4C5FE0]" fill="currentColor">
            <rect x="2" y="10" width="3" height="8" rx="1" />
            <rect x="8.5" y="6" width="3" height="12" rx="1" />
            <rect x="15" y="2" width="3" height="16" rx="1" />
          </svg>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-[#161A2C] dark:text-[#E7EAF7] leading-none">{headline}</div>
          <div className="text-[11px] text-[#8891B0] mt-1">{sublabel}</div>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2 h-20">
        {data.map((d, i) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-end justify-center h-16 relative">
              <div
                className={`w-full max-w-[18px] rounded-md transition-all ${i === peakIdx ? 'bg-[#4C5FE0]' : 'bg-[#DCE3F5] dark:bg-[#2A3350]'}`}
                style={{ height: `${Math.max((d.value / max) * 100, 8)}%` }}
              />
            </div>
            <span className="text-[9px] text-[#8891B0]">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Calendar widget ----------
export function CalendarWidget() {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const startDay = (viewDate.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = Array(startDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const isToday = (d: number | null) =>
    d !== null && monthOffset === 0 && d === today.getDate();

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#161A2C] dark:text-[#E7EAF7]">{monthName}</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setMonthOffset(monthOffset - 1)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#EEF1FB] dark:hover:bg-[#2A3350] cursor-pointer">
            <ChevronLeft className="w-3.5 h-3.5 text-[#8891B0]" />
          </button>
          <button onClick={() => setMonthOffset(monthOffset + 1)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#EEF1FB] dark:hover:bg-[#2A3350] cursor-pointer">
            <ChevronRight className="w-3.5 h-3.5 text-[#8891B0]" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-2 text-center">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <span key={d} className="text-[9px] font-semibold text-[#8891B0]">{d}</span>
        ))}
        {cells.map((d, i) => (
          <div key={i} className="flex items-center justify-center py-1">
            {d && (
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] ${
                  isToday(d) ? 'bg-[#161A2C] text-white font-bold' : 'text-[#4A5578] dark:text-[#C9D0EA]'
                }`}
              >
                {d}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


// ---------- Latest Articles ----------
export function LatestArticlesWidget({ articles }: { articles: { title: string; date: string; color: string }[] }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#161A2C] dark:text-[#E7EAF7]">Latest Articles</h3>
        <ArrowRight className="w-4 h-4 text-[#8891B0]" />
      </div>
      <div className="space-y-3">
        {articles.map((a) => (
          <div key={a.title} className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl shrink-0" style={{ backgroundColor: `${a.color}22` }} />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#161A2C] dark:text-[#E7EAF7] leading-snug truncate">{a.title}</div>
              <div className="text-[10px] text-[#8891B0] mt-0.5">{a.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Recent Calculations ----------
export function RecentCalculationsWidget({ items, onOpen }: { items: { id: string; name: string; time: string; color: string }[]; onOpen?: (id: string) => void }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#161A2C] dark:text-[#E7EAF7]">Recent Calculations</h3>
        <button className="text-xs font-semibold text-[#4C5FE0] hover:underline inline-flex items-center gap-1 cursor-pointer">
          View All <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-[#8891B0]">No calculations yet — try one of the popular calculators above.</p>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => onOpen?.(it.id)}
              className="w-full flex items-center justify-between gap-2 cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: `${it.color}22` }} />
                <span className="text-xs font-medium text-[#161A2C] dark:text-[#E7EAF7] truncate group-hover:text-[#4C5FE0] transition-colors">{it.name}</span>
              </div>
              <span className="text-[10px] text-[#8891B0] shrink-0">{it.time}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
