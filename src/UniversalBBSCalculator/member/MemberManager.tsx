import { useState, useCallback, useMemo, ReactNode, DragEvent } from 'react';
import {
  Plus, Search, FolderOpen, ChevronDown, ChevronRight, GripVertical,
} from 'lucide-react';
import { IProjectMember, MEMBER_CATEGORIES, STRUCTURE_TO_CATEGORY } from './memberTypes';
import { StructureType } from '../types';
import { DesignStandard } from '../engine/types';
import { METRIC_REBAR_OPTIONS, IMPERIAL_REBAR_OPTIONS } from '../modules';
import { getDefaultInputs } from './defaultInputs';
import MemberCard from './MemberCard';
import ProjectSummary from './ProjectSummary';
import { NumericInput } from '../../components/NumericInput';

interface MemberManagerFullProps {
  unitSystem: 'metric' | 'imperial';
  designStandard: DesignStandard;
  currency: string;
  steelPrice: number;
  concretePrice: number;
  projectName: string;
  onMembersChange?: (members: IProjectMember[]) => void;
  isPrintPreviewMode?: boolean;
}

const categoryCounters: Record<string, number> = {
  footings: 0, columns: 0, beams: 0, slabs: 0, stairs: 0, 'retaining-walls': 0, 'foundation-mesh': 0,
};

function createDefaultMember(type: StructureType, isMetric: boolean): IProjectMember {
  const cat = STRUCTURE_TO_CATEGORY[type];
  categoryCounters[cat]++;
  const prefixMap: Record<string, string> = {
    footings: 'F', columns: 'C', beams: 'B', slabs: 'S',
    stairs: 'ST', 'retaining-walls': 'RW', 'foundation-mesh': 'FM',
  };
  const prefix = prefixMap[cat] || 'M';
  const label = `${prefix}${categoryCounters[cat]}`;
  return {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    label,
    memberName: `${label} - ${type.replace(/-/g, ' ')}`,
    quantity: 1,
    structureType: type,
    category: cat,
    inputs: getDefaultInputs(type, isMetric),
    cover: 40,
    concreteGrade: 'C30 / M25',
    steelGrade: 'Grade 60 / Fe500',
    remarks: '',
    collapsed: false,
    order: Date.now(),
  };
}

function rebarOpts(isMetric: boolean) {
  return isMetric ? METRIC_REBAR_OPTIONS : IMPERIAL_REBAR_OPTIONS;
}

const renderNumField = (key: string, label: string, value: number | undefined, onChange: (v: number) => void, suffix: string) => (
  <div>
    <label className="text-[8px] font-mono text-slate-400 uppercase tracking-wider font-bold">{label}</label>
    <NumericInput value={value ?? ''}
      onChange={(raw, num) => onChange(raw === '' ? 0 : num)}
      variant="fieldF" />
  </div>
);

const renderSelField = (key: string, label: string, value: number | undefined, options: { value: number; label: string }[], onChange: (v: number) => void) => (
  <div>
    <label className="text-[8px] font-mono text-slate-400 uppercase tracking-wider font-bold">{label}</label>
    <select value={value ?? ''} onChange={e => onChange(parseInt(e.target.value) || 0)}
      className="w-full mt-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] outline-none focus:border-[#0A84FF] h-7">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export default function MemberManager({
  unitSystem, designStandard, currency, steelPrice, concretePrice, projectName, onMembersChange, isPrintPreviewMode,
}: MemberManagerFullProps) {
  const isMetric = unitSystem === 'metric';
  const [members, setMembers] = useState<IProjectMember[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const updateMembers = useCallback((updated: IProjectMember[]) => {
    setMembers(updated);
    onMembersChange?.(updated);
  }, [onMembersChange]);

  const handleUpdate = useCallback((id: string, updates: Partial<IProjectMember>) => {
    updateMembers(members.map(m => m.id === id ? { ...m, ...updates, inputs: updates.inputs || m.inputs } : m));
  }, [members, updateMembers]);

  const handleDelete = useCallback((id: string) => {
    updateMembers(members.filter(m => m.id !== id));
  }, [members, updateMembers]);

  const handleDuplicate = useCallback((id: string) => {
    const source = members.find(m => m.id === id);
    if (!source) return;
    const label = `${source.label} Copy`;
    const newMember: IProjectMember = {
      ...source,
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label,
      memberName: `${label} - ${source.structureType.replace(/-/g, ' ')}`,
      collapsed: false,
      order: Date.now(),
    };
    updateMembers([...members, newMember]);
  }, [members, updateMembers]);

  const handleMoveUp = useCallback((id: string) => {
    const idx = members.findIndex(m => m.id === id);
    if (idx <= 0) return;
    const updated = [...members];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    updateMembers(updated);
  }, [members, updateMembers]);

  const handleMoveDown = useCallback((id: string) => {
    const idx = members.findIndex(m => m.id === id);
    if (idx < 0 || idx >= members.length - 1) return;
    const updated = [...members];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    updateMembers(updated);
  }, [members, updateMembers]);

  const handleCopyFrom = useCallback((targetId: string, sourceId: string) => {
    const source = members.find(m => m.id === sourceId);
    if (!source) return;
    handleUpdate(targetId, {
      inputs: { ...source.inputs },
      cover: source.cover,
      structureType: source.structureType,
    });
  }, [members, handleUpdate]);

  const addMember = useCallback((type: StructureType) => {
    const newMember = createDefaultMember(type, isMetric);
    updateMembers([...members, newMember]);
  }, [members, isMetric, updateMembers]);

  // Drag-and-drop handlers
  const handleDragStart = useCallback((e: DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = dragId;
    if (!sourceId || sourceId === targetId) return;
    const updated = [...members];
    const sourceIdx = updated.findIndex(m => m.id === sourceId);
    const targetIdx = updated.findIndex(m => m.id === targetId);
    if (sourceIdx < 0 || targetIdx < 0) return;
    const [removed] = updated.splice(sourceIdx, 1);
    updated.splice(targetIdx, 0, removed);
    updateMembers(updated);
    setDragId(null);
  }, [dragId, members, updateMembers]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(m =>
      m.label.toLowerCase().includes(q) ||
      m.memberName.toLowerCase().includes(q) ||
      m.structureType.toLowerCase().includes(q) ||
      m.remarks.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  const groupedMembers = useMemo(() => {
    const groups: Record<string, IProjectMember[]> = {};
    MEMBER_CATEGORIES.forEach(cat => { groups[cat.key] = []; });
    filteredMembers.forEach(m => {
      const cat = STRUCTURE_TO_CATEGORY[m.structureType];
      if (groups[cat]) groups[cat].push(m);
    });
    return groups;
  }, [filteredMembers]);

  // Render inputs per structure type
  const renderInputsForMember = useCallback((member: IProjectMember, _isMetric: boolean, _standard: DesignStandard): ReactNode => {
    const inputs = member.inputs || {};
    const opts = rebarOpts(isMetric);
    const onChange = (field: string, value: any) => {
      handleUpdate(member.id, { inputs: { ...inputs, [field]: value } });
    };
    const num = (key: string, label: string, val: number | undefined, suffix: string) =>
      renderNumField(key, label, val, v => onChange(key, v), suffix);
    const sel = (key: string, label: string, val: number | undefined, opt: { value: number; label: string }[]) =>
      renderSelField(key, label, val, opt, v => onChange(key, v));

    const coverField = (key = 'cover') => num(key, 'Cover', inputs[key], isMetric ? 'mm' : 'in');

    switch (member.structureType) {
      case 'footing':
        return (
          <div className="grid grid-cols-3 gap-2">
            {num('length', 'Length', inputs.length, isMetric ? 'm' : 'ft')}
            {num('width', 'Width', inputs.width, isMetric ? 'm' : 'ft')}
            {num('depth', 'Depth', inputs.depth, isMetric ? 'm' : 'ft')}
            {coverField()}
            {sel('mainDia', 'Main Dia', inputs.mainDia, opts)}
            {num('mainSpacing', 'Main Spc', inputs.mainSpacing, isMetric ? 'mm' : 'in')}
            {sel('distDia', 'Dist Dia', inputs.distDia, opts)}
            {num('distSpacing', 'Dist Spc', inputs.distSpacing, isMetric ? 'mm' : 'in')}
          </div>
        );
      case 'combined-footing': {
        const sections: any[] = inputs.footings || [];
        return (
          <div className="space-y-2">
            <div className="text-[8px] font-mono text-slate-400 uppercase">Combined Footing Sections ({sections.length})</div>
            {sections.map((fs: any, fi: number) => (
              <div key={fi} className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-2 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-[#0A84FF]">{fs.label || `F${fi + 1}`}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {num(`len-${fi}`, 'Length', fs.length, isMetric ? 'm' : 'ft')}
                  {num(`wid-${fi}`, 'Width', fs.width, isMetric ? 'm' : 'ft')}
                  {num(`thk-${fi}`, 'Height', fs.thickness, isMetric ? 'm' : 'ft')}
                </div>
                {num(`cv-${fi}`, 'Cover', fs.cover, isMetric ? 'mm' : 'in')}
                {fi === sections.length - 1 && (
                  <button onClick={() => {
                    const newSections = [...sections, { label: `F${sections.length + 1}`, length: 2.6, width: 2.4, thickness: 0.65, cover: 50, includeBottomBars: true, botMainDia: 16, botMainSpacing: 150, botDistDia: 12, botDistSpacing: 150, includeTopBars: true, topMainDia: 16, topMainSpacing: 150, topDistDia: 12, topDistSpacing: 200 }];
                    onChange('footings', newSections);
                  }} className="text-[8px] text-[#0A84FF] font-bold cursor-pointer hover:underline">+ Add Section</button>
                )}
              </div>
            ))}
          </div>
        );
      }
      case 'column':
        return (
          <div className="grid grid-cols-3 gap-2">
            {num('height', 'Height', inputs.height, isMetric ? 'm' : 'ft')}
            {num('width', 'Width', inputs.width, isMetric ? 'm' : 'ft')}
            {num('depth', 'Depth', inputs.depth, isMetric ? 'm' : 'ft')}
            {coverField()}
            {sel('mainDia', 'Main Dia', inputs.mainDia, opts)}
            {num('mainCount', 'Main Count', inputs.mainCount, '')}
            {sel('tieDia', 'Tie Dia', inputs.tieDia, opts)}
            {num('tieSpacing', 'Tie Spc', inputs.tieSpacing, isMetric ? 'mm' : 'in')}
            {num('lapLengthFactor', 'Lap ×d', inputs.lapLengthFactor, '')}
            {num('embedment', 'Embed', inputs.embedment, isMetric ? 'mm' : 'in')}
          </div>
        );
      case 'beam':
        return (
          <div className="grid grid-cols-3 gap-2">
            {num('span', 'Span', inputs.span, isMetric ? 'm' : 'ft')}
            {num('width', 'Width', inputs.width, isMetric ? 'm' : 'ft')}
            {num('depth', 'Depth', inputs.depth, isMetric ? 'm' : 'ft')}
            {coverField()}
            {sel('topDia', 'Top Dia', inputs.topDia, opts)}
            {num('topCount', 'Top Ct', inputs.topCount, '')}
            {sel('botDia', 'Bot Dia', inputs.botDia, opts)}
            {num('botCount', 'Bot Ct', inputs.botCount, '')}
            {sel('stirrupDia', 'Stir. Dia', inputs.stirrupDia, opts)}
            {num('stirrupSpacing', 'Stir. Spc', inputs.stirrupSpacing, isMetric ? 'mm' : 'in')}
            {num('hookLengthFactor', 'Hook ×d', inputs.hookLengthFactor, '')}
          </div>
        );
      case 'slab':
        return (
          <div className="grid grid-cols-3 gap-2">
            {num('length', 'Length', inputs.length, isMetric ? 'm' : 'ft')}
            {num('width', 'Width', inputs.width, isMetric ? 'm' : 'ft')}
            {num('thickness', 'Thk', inputs.thickness, isMetric ? 'mm' : 'in')}
            {coverField()}
            {sel('mainDia', 'Main Dia', inputs.mainDia, opts)}
            {num('mainSpacing', 'Main Spc', inputs.mainSpacing, isMetric ? 'mm' : 'in')}
            {sel('distDia', 'Dist Dia', inputs.distDia, opts)}
            {num('distSpacing', 'Dist Spc', inputs.distSpacing, isMetric ? 'mm' : 'in')}
            {num('chairCount', 'Chairs', inputs.chairCount, '')}
            {num('chairDia', 'Chair Dia', inputs.chairDia, isMetric ? 'mm' : 'in')}
          </div>
        );
      case 'staircase':
        return (
          <div className="grid grid-cols-3 gap-2">
            {num('waistSlab', 'Waist', inputs.waistSlab, isMetric ? 'mm' : 'in')}
            {coverField()}
            {num('riser', 'Riser', inputs.riser, isMetric ? 'mm' : 'in')}
            {num('tread', 'Tread', inputs.tread, isMetric ? 'mm' : 'in')}
            {num('steps', 'Steps', inputs.steps, '')}
            {num('landingTop', 'Top Ldg', inputs.landingTop, isMetric ? 'm' : 'ft')}
            {num('landingBot', 'Bot Ldg', inputs.landingBot, isMetric ? 'm' : 'ft')}
            {num('landingWidth', 'Ldg W', inputs.landingWidth, isMetric ? 'm' : 'ft')}
            {sel('mainDia', 'Main Dia', inputs.mainDia, opts)}
            {num('mainSpacing', 'Main Spc', inputs.mainSpacing, isMetric ? 'mm' : 'in')}
            {sel('distDia', 'Dist Dia', inputs.distDia, opts)}
            {num('distSpacing', 'Dist Spc', inputs.distSpacing, isMetric ? 'mm' : 'in')}
          </div>
        );
      case 'retaining-wall':
        return (
          <div className="grid grid-cols-3 gap-2">
            {num('stemHeight', 'Stem Ht', inputs.stemHeight, isMetric ? 'm' : 'ft')}
            {num('stemBaseThk', 'Stem Base', inputs.stemBaseThk, isMetric ? 'm' : 'ft')}
            {num('stemTopThk', 'Stem Top', inputs.stemTopThk, isMetric ? 'm' : 'ft')}
            {num('baseLength', 'Base Len', inputs.baseLength, isMetric ? 'm' : 'ft')}
            {num('baseThk', 'Base Thk', inputs.baseThk, isMetric ? 'm' : 'ft')}
            {coverField()}
            {sel('vertDia', 'Vert Dia', inputs.vertDia, opts)}
            {num('vertSpacing', 'Vert Spc', inputs.vertSpacing, isMetric ? 'mm' : 'in')}
            {sel('horizDia', 'Horiz Dia', inputs.horizDia, opts)}
            {num('horizSpacing', 'Horiz Spc', inputs.horizSpacing, isMetric ? 'mm' : 'in')}
          </div>
        );
      case 'raft-foundation':
        return (
          <div className="grid grid-cols-3 gap-2">
            {num('length', 'Length', inputs.length, isMetric ? 'm' : 'ft')}
            {num('width', 'Width', inputs.width, isMetric ? 'm' : 'ft')}
            {num('thickness', 'Thk', inputs.thickness, isMetric ? 'm' : 'ft')}
            {coverField()}
            <div className="col-span-3 text-[8px] font-mono text-slate-400 uppercase border-t border-slate-100 dark:border-slate-800 pt-1">Bottom Mesh</div>
            {sel('botMainDia', 'B-Main Dia', inputs.botMainDia, opts)}
            {num('botMainSpacing', 'B-Main Spc', inputs.botMainSpacing, isMetric ? 'mm' : 'in')}
            {sel('botDistDia', 'B-Dist Dia', inputs.botDistDia, opts)}
            {num('botDistSpacing', 'B-Dist Spc', inputs.botDistSpacing, isMetric ? 'mm' : 'in')}
            <div className="col-span-3 text-[8px] font-mono text-slate-400 uppercase border-t border-slate-100 dark:border-slate-800 pt-1">Top Mesh</div>
            {sel('topMainDia', 'T-Main Dia', inputs.topMainDia, opts)}
            {num('topMainSpacing', 'T-Main Spc', inputs.topMainSpacing, isMetric ? 'mm' : 'in')}
            {sel('topDistDia', 'T-Dist Dia', inputs.topDistDia, opts)}
            {num('topDistSpacing', 'T-Dist Spc', inputs.topDistSpacing, isMetric ? 'mm' : 'in')}
            {num('chairDia', 'Chair Dia', inputs.chairDia, isMetric ? 'mm' : 'in')}
            {num('chairSpacing', 'Chair Spc', inputs.chairSpacing, isMetric ? 'm' : 'ft')}
          </div>
        );
      case 'foundation-mesh':
        return (
          <div className="grid grid-cols-3 gap-2">
            {num('length', 'Length', inputs.length, isMetric ? 'm' : 'ft')}
            {num('width', 'Width', inputs.width, isMetric ? 'm' : 'ft')}
            {num('depth', 'Depth', inputs.depth, isMetric ? 'm' : 'ft')}
            {coverField()}
            <div className="col-span-3 text-[8px] font-mono text-slate-400 uppercase border-t border-slate-100 dark:border-slate-800 pt-1">Bottom Mesh</div>
            {sel('botMainDia', 'B-Main Dia', inputs.botMainDia, opts)}
            {num('botMainSpacing', 'B-Main Spc', inputs.botMainSpacing, isMetric ? 'mm' : 'in')}
            {sel('botDistDia', 'B-Dist Dia', inputs.botDistDia, opts)}
            {num('botDistSpacing', 'B-Dist Spc', inputs.botDistSpacing, isMetric ? 'mm' : 'in')}
            <div className="col-span-3 text-[8px] font-mono text-slate-400 uppercase border-t border-slate-100 dark:border-slate-800 pt-1">Top Mesh</div>
            {sel('topMainDia', 'T-Main Dia', inputs.topMainDia, opts)}
            {num('topMainSpacing', 'T-Main Spc', inputs.topMainSpacing, isMetric ? 'mm' : 'in')}
            {sel('topDistDia', 'T-Dist Dia', inputs.topDistDia, opts)}
            {num('topDistSpacing', 'T-Dist Spc', inputs.topDistSpacing, isMetric ? 'mm' : 'in')}
          </div>
        );
      case 'plinth-beam':
      case 'tie-beam':
      case 'lintel-beam':
        return (
          <div className="grid grid-cols-3 gap-2">
            {member.structureType === 'lintel-beam' ? (
              <>
                {num('clearSpan', 'Clear Span', inputs.clearSpan, isMetric ? 'm' : 'ft')}
                {num('bearing', 'Bearing', inputs.bearing, isMetric ? 'm' : 'ft')}
              </>
            ) : (
              <>
                {num('length', 'Length', inputs.length, isMetric ? 'm' : 'ft')}
                <div />
              </>
            )}
            {num('width', 'Width', inputs.width, isMetric ? 'm' : 'ft')}
            {num('depth', 'Depth', inputs.depth, isMetric ? 'm' : 'ft')}
            {coverField()}
            {sel('topDia', 'Top Dia', inputs.topDia, opts)}
            {num('topCount', 'Top Ct', inputs.topCount, '')}
            {sel('botDia', 'Bot Dia', inputs.botDia, opts)}
            {num('botCount', 'Bot Ct', inputs.botCount, '')}
            {sel('stirrupDia', 'Stir. Dia', inputs.stirrupDia, opts)}
            {num('stirrupSpacing', 'Stir. Spc', inputs.stirrupSpacing, isMetric ? 'mm' : 'in')}
          </div>
        );
      case 'strip-footing':
        return (
          <div className="grid grid-cols-3 gap-2">
            {num('length', 'Length', inputs.length, isMetric ? 'm' : 'ft')}
            {num('width', 'Width', inputs.width, isMetric ? 'm' : 'ft')}
            {num('thickness', 'Thk', inputs.thickness, isMetric ? 'm' : 'ft')}
            {coverField()}
            {sel('longitudinalDia', 'Long Dia', inputs.longitudinalDia, opts)}
            {num('longitudinalCount', 'Long Ct', inputs.longitudinalCount, '')}
            {sel('transverseDia', 'Trans Dia', inputs.transverseDia, opts)}
            {num('transverseSpacing', 'Trans Spc', inputs.transverseSpacing, isMetric ? 'mm' : 'in')}
          </div>
        );
      case 'pedestal':
        return (
          <div className="grid grid-cols-3 gap-2">
            {num('height', 'Height', inputs.height, isMetric ? 'm' : 'ft')}
            {num('width', 'Width', inputs.width, isMetric ? 'm' : 'ft')}
            {num('depth', 'Depth', inputs.depth, isMetric ? 'm' : 'ft')}
            {coverField()}
            {sel('mainDia', 'Main Dia', inputs.mainDia, opts)}
            {num('mainCount', 'Main Ct', inputs.mainCount, '')}
            {sel('tieDia', 'Tie Dia', inputs.tieDia, opts)}
            {num('tieSpacing', 'Tie Spc', inputs.tieSpacing, isMetric ? 'mm' : 'in')}
            {num('starterHook', 'Start Hook', inputs.starterHook, isMetric ? 'mm' : 'in')}
          </div>
        );
      default:
        return <div className="text-[9px] text-slate-500">Input fields not defined for {member.structureType}</div>;
    }
  }, [handleUpdate, isMetric]);

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-3xl backdrop-blur-lg shadow-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input type="text" placeholder="Search members by label, name, type..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-7 pr-2 py-1.5 text-[10px] outline-none focus:border-[#0A84FF]" />
          </div>
          <span className="text-[9px] font-mono text-slate-400 font-bold px-2">{members.length} members</span>
        </div>
      </div>

      {/* Category Sections */}
      {MEMBER_CATEGORIES.map(cat => {
        const categoryMembers = groupedMembers[cat.key] || [];
        if (categoryMembers.length === 0 && searchQuery) return null;
        const isCollapsed = collapsedCategories.has(cat.key);

        return (
          <div key={cat.key} className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl backdrop-blur-lg shadow-xs overflow-hidden">
            {/* Category Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  const next = new Set(collapsedCategories);
                  isCollapsed ? next.delete(cat.key) : next.add(cat.key);
                  setCollapsedCategories(next);
                }} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <FolderOpen className="w-4 h-4 text-[#0A84FF]" />
                <h3 className="text-[11px] font-bold font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider">{cat.label}</h3>
                <span className="text-[9px] font-mono bg-[#0A84FF]/10 text-[#0A84FF] px-2 py-0.5 rounded-full font-bold">{categoryMembers.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {cat.types.slice(0, 3).map(type => (
                  <button key={type} onClick={() => addMember(type)}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-[#0A84FF]/40 text-[8px] font-bold text-slate-500 hover:text-[#0A84FF] transition-all cursor-pointer flex items-center gap-1">
                    <Plus className="w-2.5 h-2.5" /> {type.split('-')[0].replace(/\b\w/g, c => c.toUpperCase())}
                  </button>
                ))}
                {cat.types.length > 3 && (
                  <select onChange={e => { if (e.target.value) addMember(e.target.value as StructureType); e.target.value = ''; }}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-1.5 py-1 text-[8px] font-bold text-slate-500 outline-none cursor-pointer h-7">
                    <option value="">+ More...</option>
                    {cat.types.slice(3).map(t => (
                      <option key={t} value={t}>{t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Members List */}
            {!isCollapsed && (
              <div className="p-3 space-y-2">
                {categoryMembers.map((m, idx) => (
                  <div key={m.id}
                    draggable
                    onDragStart={e => handleDragStart(e, m.id)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, m.id)}
                    className={`transition-opacity ${dragId === m.id ? 'opacity-50' : ''}`}
                  >
                    <MemberCard
                      member={m} index={idx} total={categoryMembers.length}
                      isMetric={isMetric} designStandard={designStandard}
                      onUpdate={handleUpdate} onDelete={handleDelete} onDuplicate={handleDuplicate}
                      onMoveUp={handleMoveUp} onMoveDown={handleMoveDown} onCopyFrom={handleCopyFrom}
                      allMembers={categoryMembers}
                      renderInputs={renderInputsForMember}
                    />
                  </div>
                ))}
                {/* Add New Member button at the bottom */}
                {cat.types.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[9px] font-mono text-slate-400">Add:</span>
                    {cat.types.map(type => (
                      <button key={type} onClick={() => addMember(type)}
                        className="px-2.5 py-1.5 rounded-xl border border-dashed border-[#0A84FF]/40 bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[#0A84FF] text-[9px] font-semibold transition-all cursor-pointer flex items-center gap-1">
                        <Plus className="w-2.5 h-2.5" /> {type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty category state */}
            {!isCollapsed && categoryMembers.length === 0 && (
              <div className="p-6 text-center space-y-2">
                <div className="text-[10px] text-slate-400 font-mono">No {cat.label.toLowerCase()} in this project</div>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {cat.types.map(type => (
                    <button key={type} onClick={() => addMember(type)}
                      className="px-3 py-1.5 rounded-xl border border-dashed border-[#0A84FF]/40 bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 text-[#0A84FF] text-[9px] font-semibold transition-all cursor-pointer flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add {type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {members.length === 0 && !searchQuery && (
        <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-10 rounded-3xl text-center">
          <div className="text-4xl mb-3 text-slate-300 dark:text-slate-600">🏗️</div>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">No Members Yet</h3>
          <p className="text-[10px] font-mono text-slate-400 mb-4">Add footings, columns, beams, slabs, stairs, or retaining walls below.</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {MEMBER_CATEGORIES.map(cat => (
              <div key={cat.key} className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-slate-400">{cat.label}:</span>
                {cat.types.slice(0, 2).map(type => (
                  <button key={type} onClick={() => addMember(type)}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[8px] font-bold text-slate-500 hover:text-[#0A84FF] cursor-pointer">
                    +{type.split('-')[0].replace(/\b\w/g, c => c.toUpperCase())}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Summary — includes ALL members (collapsed or not) */}
      {members.length > 0 && (
        <ProjectSummary
          members={members}
          isMetric={isMetric}
          designStandard={designStandard}
          currency={currency}
          steelPrice={steelPrice}
          concretePrice={concretePrice}
        />
      )}
    </div>
  );
}
