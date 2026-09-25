import { useEffect, useState, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  Weight, Ruler, Hash, DollarSign, Scale, Gauge, Shield, CheckCircle,
  Download, FileSpreadsheet, Printer, Share2, BarChart3, ClipboardList,
} from 'lucide-react';
import { Card, NumericDisplay } from './ui';

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

interface ResultCardProps {
  icon: typeof Weight;
  label: string;
  value: number;
  unit?: string;
  color?: string;
  delay?: number;
  highlight?: boolean;
  decimals?: number;
}

export function ResultCard({ icon: Icon, label, value, unit, color = '#2E6B56', delay = 0, highlight, decimals = 1 }: ResultCardProps) {
  const animatedValue = useCountUp(value, 600 + delay * 200);
  const displayValue = decimals === 0 ? animatedValue : animatedValue / Math.pow(10, decimals);
  const formatted = decimals === 0 ? String(displayValue) : displayValue.toFixed(decimals);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.08, duration: 0.3, ease: 'easeOut' }}
    >
      <Card
        elevation={highlight ? 'raised' : 'flat'}
        className={`hover:-translate-y-0.5 transition-transform p-4 ${highlight ? 'ring-2 ring-brand/30 border-brand/50' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${color}15` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div className="min-w-0 flex-1">
            <NumericDisplay
              label={label}
              value={formatted}
              unit={unit}
              size="sm"
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

interface SummaryItem {
  icon: typeof CheckCircle;
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
}

export function ResultSummary({ items, className = '' }: {
  items: SummaryItem[]; className?: string;
}) {
  return (
    <Card elevation="raised" className={`bg-brand/5 dark:bg-brand/10 border-brand/20 dark:border-brand/25 p-5 shadow-xs ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-4 h-4 text-emerald-500" />
        <span className="text-xs font-extrabold text-ink">You Need</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item, idx) => (
          <ItemRow key={idx} item={item} delay={idx} />
        ))}
      </div>
    </Card>
  );
}

function ItemRow({ item, delay }: { key?: number; item: SummaryItem; delay: number }) {
  const animatedValue = useCountUp(item.value, 500 + delay * 100);
  const displayValue = item.decimals && item.decimals > 0
    ? (animatedValue / Math.pow(10, item.decimals)).toFixed(item.decimals)
    : String(animatedValue);

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.3, ease: 'easeOut' }} className="flex items-center gap-2.5">
      <item.icon className="w-4 h-4 text-emerald-500 shrink-0" />
      <div>
        <span className="text-sm font-extrabold text-ink tabular-nums">{displayValue}</span>
        {item.unit && <span className="text-[10px] text-ink-muted ml-0.5">{item.unit}</span>}
        <div className="text-[9px] text-ink-muted">{item.label}</div>
      </div>
    </motion.div>
  );
}

export function ResultDashboard({ children, className = '' }: {
  children: ReactNode; className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-bold font-mono text-ink-muted uppercase tracking-widest">Results Ready</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
      </div>
    </div>
  );
}

export function ExportBar({ onPdf, onExcel, onPrint, onShare }: {
  onPdf?: () => void; onExcel?: () => void; onPrint?: () => void; onShare?: () => void;
}) {
  const actions = [
    { label: 'PDF', icon: Download, onClick: onPdf },
    { label: 'Excel', icon: FileSpreadsheet, onClick: onExcel },
    { label: 'Print', icon: Printer, onClick: onPrint },
    { label: 'Share', icon: Share2, onClick: onShare },
  ].filter(a => a.onClick);

  return (
    <Card elevation="flat" className="flex flex-wrap items-center gap-2 p-3 shadow-xs">
      <span className="text-[10px] font-bold font-mono text-ink-muted uppercase tracking-widest mr-1">Export</span>
      {actions.map(a => (
        <button key={a.label} onClick={a.onClick}
          className="px-3 py-1.5 rounded-xl bg-surface-1 hover:bg-surface-2 border border-border-subtle text-[10px] font-semibold text-ink-secondary hover:text-ink transition-all flex items-center gap-1.5 cursor-pointer">
          <a.icon className="w-3 h-3 text-brand" /> {a.label}
        </button>
      ))}
    </Card>
  );
}
