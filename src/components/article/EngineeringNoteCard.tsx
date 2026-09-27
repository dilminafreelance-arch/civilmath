import React from 'react';
import { Info, Shield, CheckCircle2, Lightbulb, Wrench } from 'lucide-react';
import { EngineeringNoteBlockData } from '../../types/article';

export interface EngineeringNoteCardProps {
  title?: string;
  note: string;
  icon?: 'info' | 'shield' | 'check' | 'lightbulb' | 'wrench';
  reference?: string;
}

export default function EngineeringNoteCard({
  title = 'Engineering Note',
  note,
  icon = 'info',
  reference,
}: EngineeringNoteCardProps) {
  const IconComponent = () => {
    switch (icon) {
      case 'shield':
        return <Shield className="w-4 h-4 text-[#657565]" />;
      case 'check':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'lightbulb':
        return <Lightbulb className="w-4 h-4 text-amber-600" />;
      case 'wrench':
        return <Wrench className="w-4 h-4 text-[#657565]" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-[#657565]" />;
    }
  };

  return (
    <aside className="my-5 rounded-2xl bg-[#FAF9F6] dark:bg-[#1E221E] border border-[#D8D0C2] dark:border-[#384238] p-5 shadow-2xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#657565]/12 flex items-center justify-center shrink-0">
            <IconComponent />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-[#20231F] dark:text-[#EAE7E0] tracking-tight">
            {title}
          </h4>
        </div>
        {reference && (
          <span className="text-[10px] font-mono text-[#7B8978] bg-[#EAE7E0] dark:bg-[#2A312A] px-2 py-0.5 rounded-md">
            {reference}
          </span>
        )}
      </div>

      <div className="text-xs sm:text-[13px] text-[#333C33] dark:text-[#D1DDD1] leading-relaxed font-sans pl-8 whitespace-pre-wrap">
        {note}
      </div>
    </aside>
  );
}
