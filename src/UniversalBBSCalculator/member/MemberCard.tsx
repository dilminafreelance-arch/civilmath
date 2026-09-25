import { useState, ReactNode } from 'react';
import {
  ChevronDown, ChevronRight, Copy, Trash2, GripVertical, Search, Plus, X, ChevronUp
} from 'lucide-react';
import { IProjectMember, MEMBER_CATEGORIES } from './memberTypes';
import { StructureType } from '../types';
import { METRIC_REBAR_OPTIONS, IMPERIAL_REBAR_OPTIONS } from '../modules/shared';
import { DesignStandard } from '../engine';
import { NumericInput } from '../../components/NumericInput';

interface MemberCardProps {
  member: IProjectMember;
  index: number;
  total: number;
  isMetric: boolean;
  designStandard: DesignStandard;
  onUpdate: (id: string, updates: Partial<IProjectMember>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onCopyFrom: (id: string, sourceId: string) => void;
  allMembers: IProjectMember[];
  renderInputs: (member: IProjectMember, isMetric: boolean, designStandard: DesignStandard) => ReactNode;
  key?: string;
}

function getStructureLabel(type: StructureType): string {
  const labels: Record<string, string> = {
    'footing': 'Isolated Footing',
    'combined-footing': 'Combined Footing',
    'strip-footing': 'Strip Footing',
    'raft-foundation': 'Raft Foundation',
    'beam': 'Beam',
    'plinth-beam': 'Plinth Beam',
    'tie-beam': 'Tie Beam',
    'lintel-beam': 'Lintel Beam',
    'column': 'Column',
    'pedestal': 'Pedestal',
    'slab': 'Slab',
    'staircase': 'Staircase',
    'retaining-wall': 'Retaining Wall',
    'foundation-mesh': 'Foundation Mesh',
  };
  return labels[type] || type;
}

export default function MemberCard({
  member, index, total, isMetric, designStandard,
  onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, onCopyFrom, allMembers,
  renderInputs,
}: MemberCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newLabel, setNewLabel] = useState(member.label);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRename = () => {
    if (newLabel.trim()) {
      onUpdate(member.id, { label: newLabel.trim().toUpperCase() });
    }
    setIsRenaming(false);
  };

  const otherMembers = allMembers.filter(m => m.id !== member.id && m.category === member.category);

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-800">
        <button onClick={() => onUpdate(member.id, { collapsed: !member.collapsed })} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
          {member.collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <GripVertical className="w-3 h-3 text-slate-300 cursor-grab" />

        {isRenaming ? (
          <div className="flex items-center gap-1 flex-1">
            <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
              onBlur={handleRename} onKeyDown={e => e.key === 'Enter' && handleRename()}
              className="w-20 bg-white dark:bg-slate-950 border border-[#0A84FF] rounded px-1.5 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none" autoFocus />
            <button onClick={handleRename} className="text-[9px] text-[#0A84FF] font-bold cursor-pointer">OK</button>
          </div>
        ) : (
          <span onClick={() => { setNewLabel(member.label); setIsRenaming(true); }}
            className="text-xs font-bold text-[#0A84FF] cursor-pointer hover:underline px-1">
            {member.label}
          </span>
        )}

        <span className="text-[9px] font-mono text-slate-400">{getStructureLabel(member.structureType)}</span>

        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[8px] font-mono text-slate-400">Qty:</span>
          <NumericInput min={1} value={member.quantity}
            onChange={(raw, num) => onUpdate(member.id, { quantity: Math.max(1, parseInt(raw) || 1) })}
            variant="mini" />

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

          {otherMembers.length > 0 && (
            <button onClick={() => setShowCopyDialog(!showCopyDialog)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-[#0A84FF] cursor-pointer" title="Copy from another member">
              <Copy className="w-3 h-3" />
            </button>
          )}

          <button onClick={() => onDuplicate(member.id)}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-500 cursor-pointer" title="Duplicate">
            <Plus className="w-3 h-3" />
          </button>

          <button onClick={() => onMoveUp(member.id)} disabled={index === 0}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-20 disabled:cursor-default" title="Move up">
            <ChevronUp className="w-3 h-3" />
          </button>
          <button onClick={() => onMoveDown(member.id)} disabled={index === total - 1}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-20 disabled:cursor-default" title="Move down">
            <ChevronDown className="w-3 h-3" />
          </button>

          <button onClick={() => onDelete(member.id)}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500 cursor-pointer" title="Delete member">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Copy from dialog */}
      {showCopyDialog && (
        <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Search className="w-3 h-3 text-[#0A84FF]" />
            <input type="text" placeholder="Search members..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[10px] outline-none" />
          </div>
          <div className="max-h-24 overflow-y-auto space-y-0.5">
            {otherMembers.filter(m => !searchQuery || m.label.toLowerCase().includes(searchQuery.toLowerCase())).map(m => (
              <button key={m.id} onClick={() => { onCopyFrom(member.id, m.id); setShowCopyDialog(false); }}
                className="w-full text-left px-2 py-1 rounded text-[9px] hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-400 cursor-pointer">
                Copy from {m.label} ({getStructureLabel(m.structureType)})
              </button>
            ))}
            {otherMembers.length === 0 && <span className="text-[9px] text-slate-400 italic">No other members in this category</span>}
          </div>
        </div>
      )}

      {/* Body */}
      {!member.collapsed && (
        <div className="p-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] font-mono text-slate-400 uppercase tracking-wider font-bold">Member Name</label>
              <input type="text" value={member.memberName}
                onChange={e => onUpdate(member.id, { memberName: e.target.value })}
                className="w-full mt-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-[#0A84FF]" />
            </div>
            <div>
              <label className="text-[8px] font-mono text-slate-400 uppercase tracking-wider font-bold">Structure Type</label>
              <select value={member.structureType}
                onChange={e => onUpdate(member.id, { structureType: e.target.value as StructureType })}
                className="w-full mt-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-[#0A84FF] h-7">
                {(MEMBER_CATEGORIES.find(c => c.key === member.category)?.types || []).map(t => (
                  <option key={t} value={t}>{getStructureLabel(t)}</option>
                ))}
              </select>
            </div>
          </div>

          {renderInputs(member, isMetric, designStandard)}

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-[8px] font-mono text-slate-400 uppercase tracking-wider font-bold">Cover ({isMetric ? 'mm' : 'in'})</label>
              <NumericInput value={member.cover}
                onChange={(raw, num) => onUpdate(member.id, { cover: num })}
                variant="field" />
            </div>
            <div>
              <label className="text-[8px] font-mono text-slate-400 uppercase tracking-wider font-bold">Concrete Grade</label>
              <input type="text" value={member.concreteGrade}
                onChange={e => onUpdate(member.id, { concreteGrade: e.target.value })}
                className="w-full mt-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] outline-none" />
            </div>
            <div>
              <label className="text-[8px] font-mono text-slate-400 uppercase tracking-wider font-bold">Steel Grade</label>
              <input type="text" value={member.steelGrade}
                onChange={e => onUpdate(member.id, { steelGrade: e.target.value })}
                className="w-full mt-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[8px] font-mono text-slate-400 uppercase tracking-wider font-bold">Remarks</label>
            <input type="text" value={member.remarks}
              onChange={e => onUpdate(member.id, { remarks: e.target.value })}
              className="w-full mt-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] outline-none" />
          </div>
        </div>
      )}
    </div>
  );
}
