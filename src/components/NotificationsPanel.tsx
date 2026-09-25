import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Sparkles, Clock, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CALCULATORS_LIST } from '../data/calculatorsData';

interface NotificationItem {
  id: string;
  type: 'new' | 'info' | 'activity' | 'tip';
  title: string;
  body: string;
  time: string;
  link?: string;
  icon: typeof Bell;
  iconColor: string;
  iconBg: string;
}

const STATIC_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'new',
    title: 'BBS Calculator v2 launched 🎉',
    body: 'All 12 reinforcement structures now support PDF & Excel export with professional shape codes.',
    time: '2 days ago',
    link: '/bbs',
    icon: Sparkles,
    iconColor: '#D9B96E',
    iconBg: 'rgba(217,185,110,0.15)',
  },
  {
    id: 'n2',
    type: 'new',
    title: 'BOQ Master Builder available',
    body: 'Create itemized material quantity takeoffs and export unified project cost schedules.',
    time: '3 days ago',
    link: '/boq-builder',
    icon: CheckCircle,
    iconColor: '#657565',
    iconBg: 'rgba(101,117,101,0.14)',
  },
  {
    id: 'n3',
    type: 'tip',
    title: 'Engineering Tip',
    body: 'Use Ctrl+K to quickly search across all 50+ calculators from anywhere on the site.',
    time: '1 week ago',
    icon: BookOpen,
    iconColor: '#9CB5C4',
    iconBg: 'rgba(156,181,196,0.18)',
  },
];

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const { recentCalculatorIds, recentCalcTimestamps, markNotificationsRead } = useApp();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    if (open) {
      document.addEventListener('mousedown', handler);
      markNotificationsRead();
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, markNotificationsRead]);

  // Build activity notifications from recent calc timestamps
  const activityNotifications: NotificationItem[] = recentCalculatorIds.slice(0, 3).map(id => {
    const calc = CALCULATORS_LIST.find(c => c.id === id);
    const ts = recentCalcTimestamps[id];
    return {
      id: `activity-${id}`,
      type: 'activity' as const,
      title: `Opened: ${calc?.name ?? id}`,
      body: `${calc?.category ?? ''} calculator · ${ts ? timeAgo(ts) : 'recently'}`,
      time: ts ? timeAgo(ts) : 'recently',
      link: calc ? `/${calc.category}` : undefined,
      icon: Clock,
      iconColor: '#7B8978',
      iconBg: 'rgba(123,137,120,0.14)',
    };
  });

  const allNotifications = [...STATIC_NOTIFICATIONS, ...activityNotifications];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, x: 12, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 12, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          className="absolute right-0 top-full mt-2 w-80 bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] rounded-2xl shadow-xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#D8D0C2] dark:border-[#333C33]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#657565]" />
              <h3 className="text-xs font-bold text-[#20231F] dark:text-[#EAE7E0]">Notifications</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#94A094] hover:text-[#20231F] dark:hover:text-white hover:bg-[#EAE7E0] dark:hover:bg-[#2A312A] cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-[#D8D0C2]/40 dark:divide-[#333C33]/60">
            {allNotifications.map(n => {
              const Icon = n.icon;
              const content = (
                <div className="flex items-start gap-3 px-4 py-3 hover:bg-[#F3F1EC] dark:hover:bg-[#242A24] transition-colors">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: n.iconBg, color: n.iconColor }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] font-bold text-[#20231F] dark:text-[#EAE7E0] leading-tight">{n.title}</p>
                    <p className="text-[10.5px] text-[#7B8978] dark:text-[#8E9A8E] leading-relaxed mt-0.5">{n.body}</p>
                    <p className="text-[9.5px] font-mono text-[#94A094] mt-1">{n.time}</p>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} to={n.link} onClick={onClose} className="block no-underline">{content}</Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[#D8D0C2] dark:border-[#333C33]">
            <Link
              to="/dashboard"
              onClick={onClose}
              className="text-[10px] font-semibold text-[#657565] hover:underline no-underline"
            >
              View all activity in Dashboard →
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
