import React, { useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, HardHat, Columns, Beaker, Layers, MoveDiagonal,
  Wallpaper, BrickWall, Database, ClipboardList, BarChart3, Plus, Trash2, Copy,
  Download, Upload, Save, FolderOpen, FileDown, Printer, X, ChevronRight,
  Edit3, Check, AlertCircle, DollarSign, Package, Truck, Wrench,
  Hammer, Settings2, Search, Archive, Sun, Moon,
} from 'lucide-react';
import { BOQProvider, useBOQ } from './BOQContext';
import { FoundationBOQ, ColumnBOQ, BeamBOQ, SlabBOQ, StairBOQ, RetainingWallBOQ, BrickWallBOQ } from './types';
import type { BOQSection } from './types';
import { SEO, SITE_URL, DEFAULT_IMAGE } from '../utils/seo';

const SECTION_META: { id: BOQSection; label: string; icon: typeof FileText }[] = [
  { id: 'project-info', label: 'Project', icon: FileText },
  { id: 'foundations', label: 'Foundations', icon: HardHat },
  { id: 'columns', label: 'Columns', icon: Columns },
  { id: 'beams', label: 'Beams', icon: Beaker },
  { id: 'slabs', label: 'Slabs', icon: Layers },
  { id: 'stairs', label: 'Stairs', icon: MoveDiagonal },
  { id: 'retaining-walls', label: 'Retaining Walls', icon: Wallpaper },
  { id: 'brick-walls', label: 'Brick Walls', icon: BrickWall },
  { id: 'materials', label: 'Materials', icon: Database },
  { id: 'boq', label: 'BOQ', icon: ClipboardList },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
];

function formatNum(n: number, decimals = 2): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function cls(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

function Input({ label, val, onChange, type = 'number', step, min, placeholder, className }: {
  label: string; val: string | number; onChange: (v: string) => void;
  type?: string; step?: string; min?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1">{label}</label>
      <input type={type} value={val} onChange={e => onChange(e.target.value)}
        step={step} min={min} placeholder={placeholder}
        className="w-full bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all" />
    </div>
  );
}

function Select({ label, val, onChange, options, className }: {
  label: string; val: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1">{label}</label>
      <select value={val} onChange={e => onChange(e.target.value)}
        className="w-full bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Card({ title, children, onAdd, className }: {
  title: string; children: React.ReactNode; onAdd?: () => void; className?: string;
}) {
  return (
    <div className={cls("bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-extrabold text-[#0F172A] dark:text-white">{title}</h3>
        {onAdd && (
          <button onClick={onAdd} className="flex items-center gap-1 px-2.5 py-1 bg-[#2563EB] text-white rounded-lg text-[10px] font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer">
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ElementCard<T extends { id: string; label: string; cost: number }>({
  item, fields, onUpdate, onRemove, onDuplicate, badge,
}: {
  item: T; fields: { label: string; val: string | number; key?: string }[];
  onUpdate: (id: string, upd: Partial<T>) => void; onRemove: (id: string) => void;
  onDuplicate: (id: string) => void; badge?: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const renderVal = (f: { label: string; val: string | number; key?: string }) => {
    const v = typeof f.val === 'string' && !isNaN(Number(f.val)) ? f.val : f.val;
    return typeof v === 'number' ? formatNum(v) : v;
  };

  return (
    <motion.div layout className="bg-[#F8FAFC] dark:bg-[#080d19] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <ChevronRight className={cls("w-3 h-3 text-[#94A3B8] transition-transform", expanded && "rotate-90")} />
          <span className="text-xs font-bold text-[#0F172A] dark:text-white">{item.label}</span>
          {badge}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-[#2563EB]">{formatNum(item.cost)}</span>
          <button onClick={(e) => { e.stopPropagation(); setEditing(!editing); }}
            className="p-1 rounded hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B] text-[#64748B] cursor-pointer">
            {editing ? <Check className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(item.id); }}
            className="p-1 rounded hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B] text-[#64748B] cursor-pointer">
            <Copy className="w-3 h-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[#EF4444] cursor-pointer">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#E2E8F0] dark:border-[#1E293B]">
            <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {fields.map((f, idx) => (
                editing ? (
                  <div key={idx}>
                    <label className="block text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1">{f.label}</label>
                    <input type="text" value={f.val} onChange={e => onUpdate(item.id, { [f.key || f.label.toLowerCase()]: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) } as Partial<T>)}
                      className="w-full bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all" />
                  </div>
                ) : (
                  <div key={idx}>
                    <div className="text-[9px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase">{f.label}</div>
                    <div className="text-xs font-medium text-[#0F172A] dark:text-white">{renderVal(f)}</div>
                  </div>
                )
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SectionNav({ active, onSelect }: { active: BOQSection; onSelect: (s: BOQSection) => void }) {
  return (
    <div className="space-y-0.5">
      {SECTION_META.map(s => (
        <button key={s.id} onClick={() => onSelect(s.id)}
          className={cls(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left",
            active === s.id
              ? "bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/20"
              : "text-[#475569] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
          )}>
          <s.icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

function ProjectInfoSection() {
  const { state, updateProjectInfo } = useBOQ();
  const p = state.projectInfo;
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-white mb-4">Project Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Input label="Project Name" val={p.name} onChange={v => updateProjectInfo({ name: v })} type="text" placeholder="Enter project name" />
        <Input label="Project Number" val={p.number} onChange={v => updateProjectInfo({ number: v })} type="text" placeholder="e.g. PRJ-2024-001" />
        <Input label="Client" val={p.client} onChange={v => updateProjectInfo({ client: v })} type="text" placeholder="Client name" />
        <Input label="Consultant" val={p.consultant} onChange={v => updateProjectInfo({ consultant: v })} type="text" />
        <Input label="Contractor" val={p.contractor} onChange={v => updateProjectInfo({ contractor: v })} type="text" />
        <Input label="Location" val={p.location} onChange={v => updateProjectInfo({ location: v })} type="text" />
        <Input label="Prepared By" val={p.preparedBy} onChange={v => updateProjectInfo({ preparedBy: v })} type="text" />
        <Input label="Date" val={p.date} onChange={v => updateProjectInfo({ date: v })} type="text" />
        <Input label="Waste %" val={p.wastePercent} onChange={v => updateProjectInfo({ wastePercent: Number(v) })} min="0" step="1" />
        <Select label="Concrete Grade" val={p.concreteGrade} onChange={v => updateProjectInfo({ concreteGrade: v })}
          options={['M15', 'M20', 'M25', 'M30', 'M35', 'M40'].map(g => ({ value: g, label: g }))} />
        <Select label="Steel Grade" val={p.steelGrade} onChange={v => updateProjectInfo({ steelGrade: v })}
          options={['Fe415', 'Fe500', 'Fe550', 'Fe600'].map(g => ({ value: g, label: g }))} />
      </div>
      <div className="mt-3">
        <label className="block text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1">Notes</label>
        <textarea value={p.notes} onChange={e => updateProjectInfo({ notes: e.target.value })}
          className="w-full bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 transition-all min-h-[80px]" />
      </div>
    </div>
  );
}

function FoundationSection() {
  const { state, addFoundation, updateFoundation, removeFoundation, duplicateFoundation } = useBOQ();
  return (
    <div>
      <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-white mb-4">Foundations</h2>
      <div className="space-y-2">
        {state.foundations.map(f => (
          <div key={f.id}><ElementCard item={f} onUpdate={updateFoundation} onRemove={removeFoundation} onDuplicate={duplicateFoundation}
            badge={<span className="text-[9px] font-bold text-[#2563EB] bg-[#2563EB]/10 px-1.5 py-0.5 rounded">{formatNum(f.concreteVolume)} m³</span>}
            fields={[
              { label: 'Count', key: 'count', val: f.count },
              { label: 'Length (m)', key: 'length', val: f.length },
              { label: 'Width (m)', key: 'width', val: f.width },
              { label: 'Depth (m)', key: 'depth', val: f.depth },
              { label: 'Grade', key: 'concreteGrade', val: f.concreteGrade },
              { label: 'Bot Reinf', key: 'botReinf', val: f.botReinf },
              { label: 'Top Reinf', key: 'topReinf', val: f.topReinf },
              { label: 'Cover (mm)', key: 'cover', val: f.cover },
              { label: 'Spacing (mm)', key: 'spacing', val: f.spacing },
              { label: 'Concrete (m³)', key: 'concreteVolume', val: formatNum(f.concreteVolume) },
              { label: 'Cement (bags)', key: 'cementBags', val: f.cementBags },
              { label: 'Steel (kg)', key: 'steelWeight', val: formatNum(f.steelWeight) },
            ]} /></div>
        ))}
      </div>
      {state.foundations.length === 0 && (
        <p className="text-xs text-[#94A3B8] text-center py-8">No foundations added yet.</p>
      )}
      <div className="mt-3">
        <button onClick={() => addFoundation()} className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Add Foundation
        </button>
      </div>
    </div>
  );
}

function ColumnSection() {
  const { state, addColumn, updateColumn, removeColumn, duplicateColumn } = useBOQ();
  return (
    <div>
      <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-white mb-4">Columns</h2>
      <div className="space-y-2">
        {state.columns.map(c => (
          <div key={c.id}><ElementCard item={c} onUpdate={updateColumn} onRemove={removeColumn} onDuplicate={duplicateColumn}
            badge={<span className="text-[9px] font-bold text-[#2563EB] bg-[#2563EB]/10 px-1.5 py-0.5 rounded">{formatNum(c.steelWeight)} kg</span>}
            fields={[
              { label: 'Count', key: 'count', val: c.count },
              { label: 'Width (mm)', key: 'width', val: c.width },
              { label: 'Depth (mm)', key: 'depth', val: c.depth },
              { label: 'Height (m)', key: 'height', val: c.height },
              { label: 'Main Bars', key: 'mainBars', val: c.mainBars },
              { label: 'Corner Bars', key: 'cornerBars', val: c.cornerBars },
              { label: 'Side Bars', key: 'sideBars', val: c.sideBars },
              { label: 'Tie Dia (mm)', key: 'tieDia', val: c.tieDia },
              { label: 'Tie Spacing (mm)', key: 'tieSpacing', val: c.tieSpacing },
              { label: 'Grade', key: 'concreteGrade', val: c.concreteGrade },
              { label: 'Concrete (m³)', key: 'concreteVolume', val: formatNum(c.concreteVolume) },
              { label: 'Steel (kg)', key: 'steelWeight', val: formatNum(c.steelWeight) },
            ]} /></div>
        ))}
      </div>
      {state.columns.length === 0 && (
        <p className="text-xs text-[#94A3B8] text-center py-8">No columns added yet.</p>
      )}
      <div className="mt-3">
        <button onClick={() => addColumn()} className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Add Column
        </button>
      </div>
    </div>
  );
}

function BeamSection() {
  const { state, addBeam, updateBeam, removeBeam, duplicateBeam } = useBOQ();
  return (
    <div>
      <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-white mb-4">Beams</h2>
      <div className="space-y-2">
        {state.beams.map(b => (
          <div key={b.id}><ElementCard item={b} onUpdate={updateBeam} onRemove={removeBeam} onDuplicate={duplicateBeam}
            badge={<span className="text-[9px] font-bold text-[#2563EB] bg-[#2563EB]/10 px-1.5 py-0.5 rounded">{formatNum(b.formworkArea)} m²</span>}
            fields={[
              { label: 'Count', key: 'count', val: b.count },
              { label: 'Length (m)', key: 'length', val: b.length },
              { label: 'Width (mm)', key: 'width', val: b.width },
              { label: 'Depth (mm)', key: 'depth', val: b.depth },
              { label: 'Top Bars', key: 'topBars', val: b.topBars },
              { label: 'Bottom Bars', key: 'bottomBars', val: b.bottomBars },
              { label: 'Extra Bars', key: 'extraBars', val: b.extraBars },
              { label: 'Stirrup Dia (mm)', key: 'stirrupDia', val: b.stirrupDia },
              { label: 'Stirrup Spacing (mm)', key: 'stirrupSpacing', val: b.stirrupSpacing },
              { label: 'Grade', key: 'concreteGrade', val: b.concreteGrade },
              { label: 'Concrete (m³)', key: 'concreteVolume', val: formatNum(b.concreteVolume) },
              { label: 'Steel (kg)', key: 'steelWeight', val: formatNum(b.steelWeight) },
            ]} /></div>
        ))}
      </div>
      {state.beams.length === 0 && (
        <p className="text-xs text-[#94A3B8] text-center py-8">No beams added yet.</p>
      )}
      <div className="mt-3">
        <button onClick={() => addBeam()} className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Add Beam
        </button>
      </div>
    </div>
  );
}

function SlabSection() {
  const { state, addSlab, updateSlab, removeSlab, duplicateSlab } = useBOQ();
  return (
    <div>
      <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-white mb-4">Slabs</h2>
      <div className="space-y-2">
        {state.slabs.map(s => (
          <div key={s.id}><ElementCard item={s} onUpdate={updateSlab} onRemove={removeSlab} onDuplicate={duplicateSlab}
            badge={<span className="text-[9px] font-bold text-[#2563EB] bg-[#2563EB]/10 px-1.5 py-0.5 rounded">{formatNum(s.concreteVolume)} m³</span>}
            fields={[
              { label: 'Count', key: 'count', val: s.count },
              { label: 'Length (m)', key: 'length', val: s.length },
              { label: 'Width (m)', key: 'width', val: s.width },
              { label: 'Thickness (mm)', key: 'thickness', val: s.thickness },
              { label: 'Top Mesh', key: 'topMesh', val: s.topMesh },
              { label: 'Bottom Mesh', key: 'bottomMesh', val: s.bottomMesh },
              { label: 'Dist Bars', key: 'distBars', val: s.distBars },
              { label: 'Grade', key: 'concreteGrade', val: s.concreteGrade },
              { label: 'Concrete (m³)', key: 'concreteVolume', val: formatNum(s.concreteVolume) },
              { label: 'Steel (kg)', key: 'steelWeight', val: formatNum(s.steelWeight) },
            ]} /></div>
        ))}
      </div>
      {state.slabs.length === 0 && (
        <p className="text-xs text-[#94A3B8] text-center py-8">No slabs added yet.</p>
      )}
      <div className="mt-3">
        <button onClick={() => addSlab()} className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Add Slab
        </button>
      </div>
    </div>
  );
}

function StairSection() {
  const { state, addStair, updateStair, removeStair } = useBOQ();
  return (
    <div>
      <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-white mb-4">Staircases</h2>
      <div className="space-y-2">
        {state.stairs.map(s => (
          <div key={s.id}><ElementCard item={s} onUpdate={updateStair} onRemove={removeStair} onDuplicate={() => {}}
            badge={<span className="text-[9px] font-bold text-[#2563EB] bg-[#2563EB]/10 px-1.5 py-0.5 rounded">{formatNum(s.concreteVolume)} m³</span>}
            fields={[
              { label: 'Count', key: 'count', val: s.count },
              { label: 'Width (mm)', key: 'width', val: s.width },
              { label: 'Flight Length (m)', key: 'flightLength', val: s.flightLength },
              { label: 'Landing (m)', key: 'landingLength', val: s.landingLength },
              { label: 'Thickness (mm)', key: 'thickness', val: s.thickness },
              { label: 'Main Bars', key: 'mainBars', val: s.mainBars },
              { label: 'Dist Bars', key: 'distBars', val: s.distBars },
              { label: 'Grade', key: 'concreteGrade', val: s.concreteGrade },
              { label: 'Concrete (m³)', key: 'concreteVolume', val: formatNum(s.concreteVolume) },
              { label: 'Steel (kg)', key: 'steelWeight', val: formatNum(s.steelWeight) },
            ]} /></div>
        ))}
      </div>
      {state.stairs.length === 0 && (
        <p className="text-xs text-[#94A3B8] text-center py-8">No staircases added yet.</p>
      )}
      <div className="mt-3">
        <button onClick={() => addStair()} className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Add Staircase
        </button>
      </div>
    </div>
  );
}

function RetainingWallSection() {
  const { state, addRetainingWall, updateRetainingWall, removeRetainingWall } = useBOQ();
  return (
    <div>
      <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-white mb-4">Retaining Walls</h2>
      <div className="space-y-2">
        {state.retainingWalls.map(r => (
          <div key={r.id}><ElementCard item={r} onUpdate={updateRetainingWall} onRemove={removeRetainingWall} onDuplicate={() => {}}
            badge={<span className="text-[9px] font-bold text-[#2563EB] bg-[#2563EB]/10 px-1.5 py-0.5 rounded">{formatNum(r.concreteVolume)} m³</span>}
            fields={[
              { label: 'Count', key: 'count', val: r.count },
              { label: 'Length (m)', key: 'length', val: r.length },
              { label: 'Stem Height (m)', key: 'stemHeight', val: r.stemHeight },
              { label: 'Stem Thickness (mm)', key: 'stemThickness', val: r.stemThickness },
              { label: 'Base Width (m)', key: 'baseWidth', val: r.baseWidth },
              { label: 'Base Thickness (mm)', key: 'baseThickness', val: r.baseThickness },
              { label: 'Vert Bars', key: 'vertBars', val: r.vertBars },
              { label: 'Horiz Bars', key: 'horizBars', val: r.horizBars },
              { label: 'Grade', key: 'concreteGrade', val: r.concreteGrade },
              { label: 'Concrete (m³)', key: 'concreteVolume', val: formatNum(r.concreteVolume) },
              { label: 'Steel (kg)', key: 'steelWeight', val: formatNum(r.steelWeight) },
              { label: 'Formwork (m²)', key: 'formworkArea', val: formatNum(r.formworkArea) },
            ]} /></div>
        ))}
      </div>
      {state.retainingWalls.length === 0 && (
        <p className="text-xs text-[#94A3B8] text-center py-8">No retaining walls added yet.</p>
      )}
      <div className="mt-3">
        <button onClick={() => addRetainingWall()} className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Add Retaining Wall
        </button>
      </div>
    </div>
  );
}

function BrickWallSection() {
  const { state, addBrickWall, updateBrickWall, removeBrickWall } = useBOQ();
  return (
    <div>
      <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-white mb-4">Brick Walls</h2>
      <div className="space-y-2">
        {state.brickWalls.map(b => (
          <div key={b.id}><ElementCard item={b} onUpdate={updateBrickWall} onRemove={removeBrickWall} onDuplicate={() => {}}
            badge={<span className="text-[9px] font-bold text-[#2563EB] bg-[#2563EB]/10 px-1.5 py-0.5 rounded">{Math.round(b.brickCount).toLocaleString()} bricks</span>}
            fields={[
              { label: 'Count', key: 'count', val: b.count },
              { label: 'Length (m)', key: 'length', val: b.length },
              { label: 'Height (m)', key: 'height', val: b.height },
              { label: 'Thickness (mm)', key: 'thickness', val: b.thickness },
              { label: 'Brick Type', key: 'brickType', val: b.brickType },
              { label: 'Mortar Mix', key: 'mortarMix', val: b.mortarMix },
              { label: 'Bricks (Nos)', key: 'brickCount', val: Math.round(b.brickCount).toLocaleString() },
              { label: 'Mortar (m³)', key: 'mortarVolume', val: formatNum(b.mortarVolume) },
              { label: 'Cement (bags)', key: 'cementBags', val: b.cementBags },
              { label: 'Sand (m³)', key: 'sandVolume', val: formatNum(b.sandVolume) },
            ]} /></div>
        ))}
      </div>
      {state.brickWalls.length === 0 && (
        <p className="text-xs text-[#94A3B8] text-center py-8">No brick walls added yet.</p>
      )}
      <div className="mt-3">
        <button onClick={() => addBrickWall()} className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Add Brick Wall
        </button>
      </div>
    </div>
  );
}

function MaterialSection() {
  const { state, updateMaterialPrices } = useBOQ();
  const p = state.materialPrices;

  const update = <K extends keyof typeof p>(key: K, val: number) => updateMaterialPrices({ [key]: val } as any);

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-white mb-4">Material Prices</h2>
      <Card title="Concrete & Masonry">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input label="Concrete / m³" val={p.concretePerM3} onChange={v => update('concretePerM3', Number(v))} />
          <Input label="Cement / Bag" val={p.cementPerBag} onChange={v => update('cementPerBag', Number(v))} />
          <Input label="Sand / m³" val={p.sandPerM3} onChange={v => update('sandPerM3', Number(v))} />
          <Input label="Aggregate / m³" val={p.aggregatePerM3} onChange={v => update('aggregatePerM3', Number(v))} />
          <Input label="Brick / 1000" val={p.brickPer1000} onChange={v => update('brickPer1000', Number(v))} />
        </div>
      </Card>
      <div className="mt-3">
        <Card title="Steel Reinforcement (per kg)">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(p.steelPerKg).map(([dia, rate]) => (
              <Input label={`${dia}mm Bar`} val={rate} onChange={v => updateMaterialPrices({ steelPerKg: { ...p.steelPerKg, [dia]: Number(v) } })} />
            ))}
            <Input label="Tie Wire / kg" val={p.tieWirePerKg} onChange={v => update('tieWirePerKg', Number(v))} />
          </div>
        </Card>
      </div>
      <div className="mt-3">
        <Card title="Formwork & Labour">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input label="Formwork / m²" val={p.formworkPerM2} onChange={v => update('formworkPerM2', Number(v))} />
            <Input label="Timber / m³" val={p.timberPerM3} onChange={v => update('timberPerM3', Number(v))} />
            <Input label="Plywood / Sheet" val={p.plywoodPerSheet} onChange={v => update('plywoodPerSheet', Number(v))} />
            <Input label="Labour / Day" val={p.labourPerDay} onChange={v => update('labourPerDay', Number(v))} />
          </div>
        </Card>
      </div>
      <div className="mt-3">
        <Card title="Overheads & Profit">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input label="Transport" val={p.transport} onChange={v => update('transport', Number(v))} />
            <Input label="Equipment" val={p.equipment} onChange={v => update('equipment', Number(v))} />
            <Input label="Contractor Profit %" val={p.contractorProfitPercent} onChange={v => update('contractorProfitPercent', Number(v))} />
            <Input label="VAT %" val={p.vatPercent} onChange={v => update('vatPercent', Number(v))} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function BOQSummarySection() {
  const { state, boqLines, aggregate } = useBOQ();
  const printRef = useRef<HTMLDivElement>(null);

  const categories = [...new Set(boqLines.map(l => l.category))];

  const handlePrint = () => {
    const w = window.open('');
    if (!w) return;
    w.document.write(`<html><head><title>BOQ</title><style>
      body { font-family: 'Courier New', monospace; font-size: 11px; padding: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
      th { background: #f0f0f0; }
      .total { font-weight: bold; background: #f8f8f8; }
      h1 { font-size: 16px; margin-bottom: 4px; }
      h2 { font-size: 13px; color: #555; }
    </style></head><body>
    <h1>Bill of Quantities</h1>
    <table><thead><tr><th>Item</th><th>Description</th><th>Unit</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>`);
    categories.forEach(cat => {
      const items = boqLines.filter(l => l.category === cat);
      w.document.write(`<tr><td colspan="6" style="background:#e8e8e8;font-weight:bold">${cat}</td></tr>`);
      items.forEach(l => {
        w.document.write(`<tr><td>${l.itemNo}</td><td>${l.description}</td><td>${l.unit}</td><td>${l.quantity}</td><td>${l.rate}</td><td>${l.amount}</td></tr>`);
      });
    });
    w.document.write(`</tbody></table></body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div ref={printRef} className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-white">Bill of Quantities</h2>
        <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer">
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
      </div>

      <div className="bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] dark:bg-[#080d19] border-b border-[#E2E8F0] dark:border-[#1E293B]">
              <th className="px-3 py-2 text-left font-bold text-[#64748B] dark:text-[#94A3B8]">Item</th>
              <th className="px-3 py-2 text-left font-bold text-[#64748B] dark:text-[#94A3B8]">Description</th>
              <th className="px-3 py-2 text-left font-bold text-[#64748B] dark:text-[#94A3B8]">Unit</th>
              <th className="px-3 py-2 text-right font-bold text-[#64748B] dark:text-[#94A3B8]">Qty</th>
              <th className="px-3 py-2 text-right font-bold text-[#64748B] dark:text-[#94A3B8]">Rate</th>
              <th className="px-3 py-2 text-right font-bold text-[#64748B] dark:text-[#94A3B8]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const items = boqLines.filter(l => l.category === cat);
              const catKey = `cat-${cat}`;
              return (
                <React.Fragment key={catKey}>
                  <tr className="bg-[#F1F5F9] dark:bg-[#1E293B]">
                    <td colSpan={6} className="px-3 py-1.5 text-[10px] font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider">{cat}</td>
                  </tr>
                  {items.map(l => (
                    <tr key={l.itemNo} className="border-b border-[#E2E8F0] dark:border-[#1E293B] hover:bg-[#F8FAFC] dark:hover:bg-[#080d19]">
                      <td className="px-3 py-1.5 text-[#64748B] font-mono">{l.itemNo}</td>
                      <td className="px-3 py-1.5 text-[#0F172A] dark:text-white">{l.description}</td>
                      <td className="px-3 py-1.5 text-[#64748B]">{l.unit}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-[#0F172A] dark:text-white">{formatNum(l.quantity)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-[#0F172A] dark:text-white">{formatNum(l.rate)}</td>
                      <td className="px-3 py-1.5 text-right font-mono font-bold text-[#2563EB]">{formatNum(l.amount)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
            <tr className="bg-[#F8FAFC] dark:bg-[#080d19] font-bold">
              <td colSpan={5} className="px-3 py-2 text-right text-xs text-[#0F172A] dark:text-white">Material Cost</td>
              <td className="px-3 py-2 text-right font-mono text-[#2563EB]">{formatNum(aggregate.materialCost)}</td>
            </tr>
            <tr className="text-[10px]">
              <td colSpan={5} className="px-3 py-1 text-right text-[#64748B]">Labour</td>
              <td className="px-3 py-1 text-right font-mono text-[#64748B]">{formatNum(aggregate.labourCost)}</td>
            </tr>
            <tr className="text-[10px]">
              <td colSpan={5} className="px-3 py-1 text-right text-[#64748B]">Equipment + Transport</td>
              <td className="px-3 py-1 text-right font-mono text-[#64748B]">{formatNum(aggregate.equipmentCost + aggregate.transportCost)}</td>
            </tr>
            <tr className="text-[10px]">
              <td colSpan={5} className="px-3 py-1 text-right text-[#64748B]">Contractor Profit ({state.materialPrices.contractorProfitPercent}%)</td>
              <td className="px-3 py-1 text-right font-mono text-[#64748B]">{formatNum(aggregate.contractorProfit)}</td>
            </tr>
            <tr className="text-[10px]">
              <td colSpan={5} className="px-3 py-1 text-right text-[#64748B]">VAT ({state.materialPrices.vatPercent}%)</td>
              <td className="px-3 py-1 text-right font-mono text-[#64748B]">{formatNum(aggregate.vat)}</td>
            </tr>
            <tr className="bg-[#2563EB]/5 border-t-2 border-[#2563EB]">
              <td colSpan={5} className="px-3 py-2 text-right text-sm font-extrabold text-[#0F172A] dark:text-white">GRAND TOTAL</td>
              <td className="px-3 py-2 text-right font-mono text-sm font-extrabold text-[#2563EB]">{formatNum(aggregate.grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashboardSection() {
  const { aggregate, state } = useBOQ();

  const cards = [
    { label: 'Total Concrete', val: `${formatNum(aggregate.totalConcreteM3)} m³`, icon: Layers, color: '#2563EB' },
    { label: 'Cement Bags', val: `${aggregate.totalCementBags} bags`, icon: Package, color: '#059669' },
    { label: 'Total Sand', val: `${formatNum(aggregate.totalSandM3)} m³`, icon: Truck, color: '#D97706' },
    { label: 'Total Aggregate', val: `${formatNum(aggregate.totalAggregateM3)} m³`, icon: HardHat, color: '#7C3AED' },
    { label: 'Steel Weight', val: `${formatNum(aggregate.totalSteelKg)} kg`, icon: Beaker, color: '#DC2626' },
    { label: 'Formwork', val: `${formatNum(aggregate.totalFormworkM2)} m²`, icon: Layers, color: '#0891B2' },
    { label: 'Tie Wire', val: `${formatNum(aggregate.totalTieWireKg)} kg`, icon: Wrench, color: '#65A30D' },
    { label: 'Bricks', val: `${aggregate.totalBricks.toLocaleString()} nos`, icon: BrickWall, color: '#E11D48' },
  ];

  const PieChart = ({ segments }: { segments: { label: string; val: number; color: string }[] }) => {
    const total = segments.reduce((s, x) => s + x.val, 0) || 1;
    let cumulative = 0;
    const paths = segments.map(s => {
      const startAngle = (cumulative / total) * 360;
      cumulative += s.val;
      const endAngle = (cumulative / total) * 360;
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;
      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      return { path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`, color: s.color, label: s.label, pct: (s.val / total) * 100 };
    });
    return (
      <svg viewBox="0 0 100 100" className="w-full max-w-[160px]">
        {paths.map((p, i) => <path key={i} d={p.path} fill={p.color} />)}
      </svg>
    );
  };

  const BarChart = ({ bars }: { bars: { label: string; val: number; color: string }[] }) => {
    const max = Math.max(...bars.map(b => b.val), 1);
    return (
      <div className="flex items-end gap-2 h-32">
        {bars.map((b, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[8px] font-mono text-[#64748B]">{formatNum(b.val)}</span>
            <div className="w-full rounded-t" style={{ height: `${(b.val / max) * 100}%`, backgroundColor: b.color, minHeight: b.val > 0 ? 4 : 0 }} />
            <span className="text-[8px] font-semibold text-[#64748B] truncate w-full text-center">{b.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const costSegments = [
    { label: 'Material', val: aggregate.materialCost, color: '#2563EB' },
    { label: 'Labour', val: aggregate.labourCost, color: '#059669' },
    { label: 'Equip+Trans', val: aggregate.equipmentCost + aggregate.transportCost, color: '#D97706' },
    { label: 'Profit', val: aggregate.contractorProfit, color: '#7C3AED' },
    { label: 'VAT', val: aggregate.vat, color: '#DC2626' },
  ];

  const sectionLabels: Record<string, string> = {
    foundations: 'Foundations', columns: 'Columns', beams: 'Beams', slabs: 'Slabs',
    stairs: 'Stairs', 'retaining-walls': 'Ret.Walls', 'brick-walls': 'Brick Walls',
  };

  const concreteBars = [
    { label: 'Foundations', val: state.foundations.reduce((s, f) => s + f.concreteVolume, 0), color: '#2563EB' },
    { label: 'Columns', val: state.columns.reduce((s, c) => s + c.concreteVolume, 0), color: '#059669' },
    { label: 'Beams', val: state.beams.reduce((s, b) => s + b.concreteVolume, 0), color: '#D97706' },
    { label: 'Slabs', val: state.slabs.reduce((s, sl) => s + sl.concreteVolume, 0), color: '#7C3AED' },
    { label: 'Stairs', val: state.stairs.reduce((s, st) => s + st.concreteVolume, 0), color: '#DC2626' },
    { label: 'Ret.Walls', val: state.retainingWalls.reduce((s, r) => s + r.concreteVolume, 0), color: '#0891B2' },
  ];

  const steelBars = [
    { label: 'Foundations', val: state.foundations.reduce((s, f) => s + f.steelWeight, 0), color: '#2563EB' },
    { label: 'Columns', val: state.columns.reduce((s, c) => s + c.steelWeight, 0), color: '#059669' },
    { label: 'Beams', val: state.beams.reduce((s, b) => s + b.steelWeight, 0), color: '#D97706' },
    { label: 'Slabs', val: state.slabs.reduce((s, sl) => s + sl.steelWeight, 0), color: '#7C3AED' },
    { label: 'Stairs', val: state.stairs.reduce((s, st) => s + st.steelWeight, 0), color: '#DC2626' },
    { label: 'Ret.Walls', val: state.retainingWalls.reduce((s, r) => s + r.steelWeight, 0), color: '#0891B2' },
  ];

  return (
    <div>
      <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-white mb-4">Project Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className="w-4 h-4" style={{ color: c.color }} />
              <span className="text-[10px] font-semibold text-[#64748B] uppercase">{c.label}</span>
            </div>
            <div className="text-sm font-extrabold text-[#0F172A] dark:text-white">{c.val}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Cost Breakdown">
          <div className="flex items-center gap-4">
            <PieChart segments={costSegments} />
            <div className="space-y-1.5">
              {costSegments.map(s => (
                <div key={s.label} className="flex items-center gap-2 text-[10px]">
                  <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: s.color }} />
                  <span className="text-[#64748B]">{s.label}</span>
                  <span className="font-mono font-bold text-[#0F172A] dark:text-white">{formatNum(s.val)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Grand Total">
          <div className="text-center py-4">
            <div className="text-3xl font-extrabold text-[#2563EB]">{formatNum(aggregate.grandTotal)}</div>
            <div className="text-[10px] text-[#64748B] mt-1">
              Material: {formatNum(aggregate.materialCost)} | Labour: {formatNum(aggregate.labourCost)}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card title="Concrete Distribution (m³)">
          <BarChart bars={concreteBars} />
        </Card>
        <Card title="Steel Distribution (kg)">
          <BarChart bars={steelBars} />
        </Card>
      </div>
    </div>
  );
}

function ProjectActions() {
  const { state, saveProject, newProject, loadProject, deleteProject, exportProject, importProject } = useBOQ();
  const [saveName, setSaveName] = useState(state.projectInfo.name || 'Untitled Project');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleExport = () => {
    const json = exportProject();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.projectInfo.name || 'project'}-boq.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) importProject(await file.text());
    };
    input.click();
  };

  const filtered = state.savedProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setShowSaveDialog(true)}
        className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-[#1D4ED8] transition-colors cursor-pointer">
        <Save className="w-3.5 h-3.5" /> {state.isDirty ? 'Save*' : 'Save'}
      </button>
      <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl text-xs font-bold text-[#475569] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors cursor-pointer">
        <Download className="w-3.5 h-3.5" /> Export
      </button>
      <button onClick={handleImport} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl text-xs font-bold text-[#475569] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition-colors cursor-pointer">
        <Upload className="w-3.5 h-3.5" /> Import
      </button>
      <button onClick={newProject} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl text-xs font-bold text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
        <FileDown className="w-3.5 h-3.5" /> New
      </button>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowSaveDialog(false)}>
          <div className="bg-white dark:bg-[#0D1527] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-extrabold text-[#0F172A] dark:text-white mb-3">Save Project</h3>
            <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)}
              className="w-full bg-[#F8FAFC] dark:bg-[#080d19] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#2563EB] mb-3" placeholder="Project name" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSaveDialog(false)} className="px-3 py-2 text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] rounded-xl cursor-pointer">Cancel</button>
              <button onClick={() => { saveProject(saveName); setShowSaveDialog(false); }} className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-[#1D4ED8] cursor-pointer">Save</button>
            </div>

            {state.savedProjects.length > 0 && (
              <div className="mt-4">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#94A3B8]" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#080d19] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl pl-7 pr-3 py-1.5 text-xs outline-none" placeholder="Search saved..." />
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {filtered.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]">
                      <button onClick={() => { loadProject(p.id); setShowSaveDialog(false); }} className="text-xs text-[#0F172A] dark:text-white hover:text-[#2563EB] cursor-pointer text-left">
                        {p.name}
                      </button>
                      <button onClick={() => deleteProject(p.id)} className="p-1 text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BottomSummaryBar({ aggregate, elementCount }: { aggregate: any; elementCount: number }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0D1527] border-t border-[#E2E8F0] dark:border-[#1E293B] shadow-xl">
      <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-4">
          <span className="font-bold text-[#0F172A] dark:text-white">{elementCount} elements</span>
          <span className="text-[#64748B]">Concrete: <strong className="text-[#0F172A] dark:text-white">{formatNum(aggregate.totalConcreteM3)} m³</strong></span>
          <span className="text-[#64748B]">Steel: <strong className="text-[#0F172A] dark:text-white">{formatNum(aggregate.totalSteelKg)} kg</strong></span>
          <span className="text-[#64748B]">Cement: <strong className="text-[#0F172A] dark:text-white">{aggregate.totalCementBags} bags</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#64748B]">Material: <strong className="text-[#0F172A] dark:text-white">{formatNum(aggregate.materialCost)}</strong></span>
          <span className="text-sm font-extrabold text-[#2563EB]">Total: {formatNum(aggregate.grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}

function BOQBuilderContent() {
  const { state, setSection, aggregate } = useBOQ();

  const elementCount = state.foundations.length + state.columns.length + state.beams.length +
    state.slabs.length + state.stairs.length + state.retainingWalls.length + state.brickWalls.length;

  const renderSection = () => {
    switch (state.activeSection) {
      case 'project-info': return <ProjectInfoSection />;
      case 'foundations': return <FoundationSection />;
      case 'columns': return <ColumnSection />;
      case 'beams': return <BeamSection />;
      case 'slabs': return <SlabSection />;
      case 'stairs': return <StairSection />;
      case 'retaining-walls': return <RetainingWallSection />;
      case 'brick-walls': return <BrickWallSection />;
      case 'materials': return <MaterialSection />;
      case 'boq': return <BOQSummarySection />;
      case 'dashboard': return <DashboardSection />;
      default: return <ProjectInfoSection />;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8px)] pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-[#2563EB]" />
          <div>
            <h1 className="text-base font-extrabold text-[#0F172A] dark:text-white">Project BOQ Builder</h1>
            <p className="text-[10px] text-[#64748B]">{state.projectInfo.name || 'Untitled Project'}</p>
          </div>
        </div>
        <ProjectActions />
      </div>

      <div className="flex gap-4 flex-1">
        {/* Section Nav Sidebar */}
        <div className="w-[180px] shrink-0">
          <SectionNav active={state.activeSection} onSelect={setSection} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={state.activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <BottomSummaryBar aggregate={aggregate} elementCount={elementCount} />
    </div>
  );
}

export default function BOQBuilderPage() {
  return (
    <>
      <SEO
        title="Bill of Quantities Builder | Construction Cost | CivilMath"
        description="Interactive Bill of Quantities (BOQ) estimation tool for civil engineering projects. Calculate takeoff materials, labor costs, and export formatted reports."
        canonicalUrl={`${SITE_URL}/boq-builder`}
        keywords={['bill of quantities builder', 'boq generator civil engineering', 'construction costing', 'quantity takeoff']}
        ogImage={DEFAULT_IMAGE}
        type="website"
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'BOQ Builder', url: '/boq-builder' }]}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'CivilMath Bill of Quantities Builder',
          applicationCategory: 'EngineeringApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
      />
      <BOQProvider>
        <BOQBuilderContent />
      </BOQProvider>
    </>
  );
}
