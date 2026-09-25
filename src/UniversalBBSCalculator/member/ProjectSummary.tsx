import { useMemo } from 'react';
import { IProjectMember, IMemberOutput, MEMBER_CATEGORIES, STRUCTURE_TO_CATEGORY } from './memberTypes';
import { StructureType, BBSOutput, BBSRebarItem } from '../types';
import { calculateBBS } from '../modules';
import { DesignStandard } from '../engine/types';
import { Layers, Box, Hammer } from 'lucide-react';

interface ProjectSummaryProps {
  members: IProjectMember[];
  isMetric: boolean;
  designStandard: DesignStandard;
  currency: string;
  steelPrice: number;
  concretePrice: number;
}

export default function ProjectSummary({
  members, isMetric, designStandard, currency, steelPrice, concretePrice,
}: ProjectSummaryProps) {
  const memberOutputs = useMemo(() => {
    return members.map(m => {
        const output = calculateBBS(m.structureType, m.inputs, isMetric, designStandard);
        return {
          memberId: m.id,
          label: m.label,
          quantity: m.quantity,
          output,
          structureType: m.structureType,
        } as IMemberOutput;
      });
  }, [members, isMetric, designStandard]);

  const categorySummaries = useMemo(() => {
    return MEMBER_CATEGORIES.map(cat => {
      const catMembers = memberOutputs.filter(m => STRUCTURE_TO_CATEGORY[m.structureType] === cat.key);
      const totalSteel = catMembers.reduce((s, m) => s + m.output.totalSteelWeight * m.quantity, 0);
      const totalConcrete = catMembers.reduce((s, m) => s + m.output.concreteVolume * m.quantity, 0);
      const steelCost = totalSteel * (steelPrice / (isMetric ? 1000 : 2000));
      const concreteCost = totalConcrete * concretePrice;
      return { ...cat, members: catMembers, totalSteel, totalConcrete, steelCost, concreteCost };
    }).filter(c => c.members.length > 0);
  }, [memberOutputs, steelPrice, concretePrice, isMetric]);

  const grandTotalSteel = categorySummaries.reduce((s, c) => s + c.totalSteel, 0);
  const grandTotalConcrete = categorySummaries.reduce((s, c) => s + c.totalConcrete, 0);
  const grandTotalCost = categorySummaries.reduce((s, c) => s + c.steelCost + c.concreteCost, 0);

  if (members.length === 0) return null;

  return (
    <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-800 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Box className="w-40 h-40" /></div>

      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
        <Layers className="w-4 h-4 text-[#0A84FF]" />
        <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">PROJECT SUMMARY — {members.length} Members</h3>
      </div>

      {/* Grand totals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div>
          <span className="text-[9px] font-mono text-slate-400 uppercase block">Total Members</span>
          <span className="text-lg font-bold">{members.length}</span>
        </div>
        <div>
          <span className="text-[9px] font-mono text-slate-400 uppercase block">Total Steel Weight</span>
          <span className="text-lg font-bold text-[#0A84FF]">{grandTotalSteel.toFixed(1)} <span className="text-[10px] font-mono text-slate-400">{isMetric ? 'kg' : 'lbs'}</span></span>
        </div>
        <div>
          <span className="text-[9px] font-mono text-slate-400 uppercase block">Total Concrete</span>
          <span className="text-lg font-bold text-emerald-400">{grandTotalConcrete.toFixed(2)} <span className="text-[10px] font-mono text-slate-400">{isMetric ? 'm³' : 'yd³'}</span></span>
        </div>
        <div>
          <span className="text-[9px] font-mono text-slate-400 uppercase block">Total Cost</span>
          <span className="text-lg font-bold text-amber-400">{currency} {grandTotalCost.toFixed(2)}</span>
        </div>
      </div>

      {/* Category-wise breakdown */}
      {categorySummaries.map(cat => (
        <div key={cat.key} className="mb-3 last:mb-0">
          <div className="flex items-center justify-between bg-slate-950 rounded-xl px-3 py-2 border border-slate-800 mb-1.5">
            <span className="text-[10px] font-bold font-mono text-slate-300 uppercase">{cat.label}</span>
            <div className="flex items-center gap-4 text-[9px] font-mono">
              <span className="text-slate-400">{cat.members.length} members</span>
              <span className="text-[#0A84FF] font-bold">{cat.totalSteel.toFixed(1)} {isMetric ? 'kg' : 'lbs'}</span>
              <span className="text-emerald-400">{cat.totalConcrete.toFixed(2)} {isMetric ? 'm³' : 'yd³'}</span>
            </div>
          </div>
          {cat.members.map(m => (
            <div key={m.memberId} className="flex items-center justify-between px-3 py-1 text-[9px] font-mono hover:bg-slate-950/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-[#0A84FF] font-bold">{m.label}</span>
                <span className="text-slate-500">×{m.quantity}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span>Steel: <span className="text-slate-300 font-bold">{(m.output.totalSteelWeight * m.quantity).toFixed(1)} {isMetric ? 'kg' : 'lbs'}</span></span>
                <span>Concrete: <span className="text-slate-300">{(m.output.concreteVolume * m.quantity).toFixed(3)} {isMetric ? 'm³' : 'yd³'}</span></span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
