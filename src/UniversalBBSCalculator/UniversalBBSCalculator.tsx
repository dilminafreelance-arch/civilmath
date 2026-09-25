import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clipboard, FileText, FileSpreadsheet, Printer, Save, Download,
  RefreshCw, CheckCircle2, Info, Layers, Box, Hammer, AlertTriangle, Plus, Trash2,
  BookOpen, Calculator, Ruler, Sigma, FileCode2, ListChecks, X,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import XLSX from 'xlsx-js-style';
import { UnitSystem, SavedCalculation } from '../types';
import { CALCULATORS_LIST } from '../data/calculatorsData';
import { StructureType, STRUCTURES, BBSRebarItem } from './types';
import { calculateBBS, getRebarData, METRIC_REBAR_OPTIONS, IMPERIAL_REBAR_OPTIONS } from './modules';
import type { FootingInputs } from './modules/Footing';
import type { CombinedFootingInputs, FootingSection } from './modules/CombinedFooting';
import type { ColumnInputs } from './modules/Column';
import type { BeamInputs } from './modules/Beam';
import type { SlabInputs } from './modules/Slab';
import type { StaircaseInputs } from './modules/Staircase';
import type { RetainingWallInputs } from './modules/RetainingWall';
import type { RaftFoundationInputs } from './modules/RaftFoundation';
import type { PedestalInputs } from './modules/Pedestal';
import type { StripFootingInputs } from './modules/StripFooting';
import type { FoundationMeshInputs } from './modules/FoundationMesh';
import type { GenericBeamInputs } from './modules/GenericBeam';
import { getDrawingComponent } from './drawings/Drawings';
import { DesignStandard, STANDARD_OPTIONS, getStandard, validateReinforcement, getElementFormulas } from './engine';
import MemberManager from './member/MemberManager';
import { IProjectMember } from './member/memberTypes';
import { getDefaultInputs } from './member/defaultInputs';
import { NumericInput } from '../components/NumericInput';

interface UniversalBBSCalculatorProps {
  calculatorId: string;
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  onSaveCalculation: (calc: SavedCalculation) => void;
  savedCalculations: SavedCalculation[];
  loadedCalculation?: SavedCalculation | null;
  currency: string;
  isPrintPreviewMode?: boolean;
  setIsPrintPreviewMode?: (val: boolean) => void;
}

const STRUCTURE_TYPE_MAP: Record<string, StructureType> = {
  'bbs-footing': 'footing',
  'bbs-combined-footing': 'combined-footing',
  'bbs-strip-footing': 'strip-footing',
  'bbs-raft-foundation': 'raft-foundation',
  'bbs-beam': 'beam',
  'bbs-plinth-beam': 'plinth-beam',
  'bbs-tie-beam': 'tie-beam',
  'bbs-lintel-beam': 'lintel-beam',
  'bbs-column': 'column',
  'bbs-pedestal': 'pedestal',
  'bbs-slab': 'slab',
  'bbs-stair': 'staircase',
  'bbs-retaining-wall': 'retaining-wall',
  'bbs-foundation': 'foundation-mesh',
};

export default function UniversalBBSCalculator({
  calculatorId, unitSystem, setUnitSystem, onSaveCalculation,
  savedCalculations, loadedCalculation, currency,
  isPrintPreviewMode, setIsPrintPreviewMode,
}: UniversalBBSCalculatorProps) {
  const isMetric = unitSystem === 'metric';
  const initialType = STRUCTURE_TYPE_MAP[calculatorId] || 'footing';
  const [structureType, setStructureType] = useState<StructureType>(initialType);
  const [inputs, setInputs] = useState<Record<string, any>>(getDefaultInputs(initialType, isMetric));
  const [projectName, setProjectName] = useState('Universal BBS Project');
  const [drawingNumber, setDrawingNumber] = useState('BBS-001');
  const [engineer, setEngineer] = useState('Structural QC');
  const [client, setClient] = useState('Client Name');
  const [revision, setRevision] = useState('R0');
  const [steelGrade, setSteelGrade] = useState('Grade 60 / Fe500');
  const [concreteGrade, setConcreteGrade] = useState('C30 / M25');
  const [notes, setNotes] = useState('');
  const [steelPrice, setSteelPrice] = useState(() => currency === 'LKR' ? 280000 : 1200);
  const [steelPriceUnit, setSteelPriceUnit] = useState<'tonne' | 'kg'>('tonne');
  const [concretePrice, setConcretePrice] = useState(() => currency === 'LKR' ? 35000 : 110);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcHistory, setCalcHistory] = useState<{ timestamp: number; totalSteel: number }[]>([]);
  const [designStandard, setDesignStandard] = useState<DesignStandard>('ACI 318');
  const [showFormulas, setShowFormulas] = useState(false);
  const [expandedBarMark, setExpandedBarMark] = useState<string | null>(null);
  const [multiMemberMode, setMultiMemberMode] = useState(false);
  const [multiMembers, setMultiMembers] = useState<IProjectMember[]>([]);
  const [isResultSheetOpen, setIsResultSheetOpen] = useState(false);

  useEffect(() => {
    const showResults = () => {
      setIsResultSheetOpen(true);
      const el = document.getElementById('calculator-results');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('civilmath:show-results', showResults);
    return () => window.removeEventListener('civilmath:show-results', showResults);
  }, []);

  // Combined footing sections
  const [footingSections, setFootingSections] = useState<FootingSection[]>(() => {
    const def = getDefaultInputs('combined-footing', isMetric) as CombinedFootingInputs;
    return def.footings;
  });

  useEffect(() => {
    if (currency === 'LKR') { setSteelPrice(280000); setConcretePrice(35000); }
    else { setSteelPrice(1200); setConcretePrice(110); }
  }, [currency]);

  const handleStructureChange = useCallback((type: StructureType) => {
    setStructureType(type);
    const defaults = getDefaultInputs(type, isMetric);
    setInputs(defaults as Record<string, any>);
    if (type === 'combined-footing') {
      setFootingSections((defaults as CombinedFootingInputs).footings);
    }
  }, [isMetric]);

  // Sync with calculatorId from parent
  useEffect(() => {
    const mapped = STRUCTURE_TYPE_MAP[calculatorId];
    if (mapped && mapped !== structureType) {
      handleStructureChange(mapped);
    }
  }, [calculatorId]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    setIsCalculating(true);
    setTimeout(() => setIsCalculating(false), 200);
  }, []);

  const handleFootingSectionChange = useCallback((index: number, field: string, value: any) => {
    setFootingSections(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f));
  }, []);

  const addFootingSection = useCallback(() => {
    setFootingSections(prev => [...prev, {
      label: `F${prev.length + 1}`, length: 2.6, width: 2.4, thickness: 0.65, cover: 50,
      includeBottomBars: true, botMainDia: 16, botMainSpacing: 150, botDistDia: 12, botDistSpacing: 150,
      includeTopBars: true, topMainDia: 16, topMainSpacing: 150, topDistDia: 12, topDistSpacing: 200,
    }]);
  }, []);

  const removeFootingSection = useCallback((index: number) => {
    setFootingSections(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  }, []);

  // Calculate
  const calcInputs = structureType === 'combined-footing' ? { ...inputs, footings: footingSections } : inputs;
  const output = useMemo(() => calculateBBS(structureType, calcInputs, isMetric, designStandard), [structureType, calcInputs, isMetric, designStandard]);
  const { rebarList, concreteVolume, totalSteelWeight, steelWeightByDia } = output;

  const reinforcementRatio = useMemo(() => {
    if (concreteVolume <= 0) return 0;
    if (isMetric) return totalSteelWeight / concreteVolume;
    return (totalSteelWeight * 0.45359237) / (concreteVolume * 0.764554858);
  }, [totalSteelWeight, concreteVolume, isMetric]);

  const actualSteelPricePerUnit = steelPriceUnit === 'tonne' ? steelPrice / (isMetric ? 1000 : 2000) : steelPrice;
  const totalSteelCost = totalSteelWeight * actualSteelPricePerUnit;
  const totalConcreteCost = concreteVolume * concretePrice;
  const totalProjectCost = totalSteelCost + totalConcreteCost;

  const DrawingComponent = getDrawingComponent(structureType);

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, 297, 25, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont("Helvetica", "bold"); doc.setFontSize(14);
    doc.text("CIVILMATH UNIVERSAL BAR BENDING SCHEDULE", 12, 11);
    doc.setFont("Helvetica", "normal"); doc.setFontSize(8);
    doc.text(`STRUCTURE: ${structureType.toUpperCase()} | CODE: ${steelGrade}`, 12, 18);
    doc.text(`DATE: ${new Date().toLocaleDateString()} | SYSTEM: ${unitSystem.toUpperCase()}`, 200, 18);

    doc.setFillColor(248, 250, 252); doc.rect(12, 28, 273, 20, 'F');
    doc.setTextColor(51, 65, 85); doc.setFont("Helvetica", "bold"); doc.setFontSize(8);
    doc.text("PROJECT:", 16, 34); doc.text("ENGINEER:", 110, 34); doc.text("CONCRETE:", 205, 34);
    doc.setFont("Helvetica", "normal");
    doc.text(projectName, 40, 34); doc.text(engineer, 128, 34);
    doc.text(`${concreteVolume} ${isMetric ? 'm³' : 'yd³'}`, 230, 34);
    doc.setFont("Helvetica", "bold"); doc.text("STEEL WEIGHT:", 16, 42); doc.text("REINF RATIO:", 110, 42); doc.text("GRAND TOTAL:", 205, 42);
    doc.setFont("Helvetica", "normal");
    doc.text(`${totalSteelWeight} ${isMetric ? 'kg' : 'lbs'}`, 50, 42);
    doc.text(`${reinforcementRatio.toFixed(2)} kg/m³`, 135, 42);
    doc.text(`${currency} ${totalProjectCost.toFixed(2)}`, 230, 42);

    const startY = 53; doc.setFillColor(30, 41, 59); doc.rect(12, startY, 273, 7, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont("Helvetica", "bold"); doc.setFontSize(6.5);
    doc.text("MARK", 14, startY+4.5); doc.text("DESCRIPTION", 30, startY+4.5);
    doc.text("DIA", 85, startY+4.5); doc.text("SHAPE", 97, startY+4.5);
    doc.text("A", 112, startY+4.5); doc.text("B", 124, startY+4.5); doc.text("C", 136, startY+4.5);
    doc.text("PCS", 148, startY+4.5); doc.text("TOT", 164, startY+4.5);
    doc.text(isMetric ? "CUT(m)" : "CUT(ft)", 182, startY+4.5);
    doc.text(isMetric ? "TOT(m)" : "TOT(ft)", 205, startY+4.5);
    doc.text(isMetric ? "WT(kg)" : "WT(lb)", 240, startY+4.5);

    let rowY = startY + 7; doc.setFont("Helvetica", "normal"); doc.setFontSize(6.5);
    rebarList.forEach((row, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 241, idx % 2 === 0 ? 255 : 245, 249);
      doc.rect(12, rowY, 273, 6.5, 'F');
      doc.setTextColor(15, 23, 42);
      doc.text(row.mark, 14, rowY+4); doc.text(row.description.substring(0, 35), 30, rowY+4);
      doc.text(getRebarData(row.dia, isMetric).label, 85, rowY+4);
      doc.text(`C${row.shapeCode}`, 97, rowY+4);
      doc.text(row.dims.a.toFixed(0), 112, rowY+4); doc.text(row.dims.b.toFixed(0), 124, rowY+4);
      doc.text(row.dims.c.toFixed(0), 136, rowY+4); doc.text(`${row.barsPerMember}`, 148, rowY+4);
      doc.text(`${row.totalBars}`, 164, rowY+4); doc.text(row.cuttingLength.toFixed(3), 182, rowY+4);
      doc.text(row.totalLength.toFixed(3), 205, rowY+4);
      doc.setFont("Helvetica", "bold"); doc.text(row.totalWeight.toFixed(2), 240, rowY+4);
      doc.setFont("Helvetica", "normal");
      rowY += 6.5;
    });
    doc.save(`Universal-BBS-${structureType}-${projectName.replace(/\s+/g, '_')}.pdf`);
  };

  // Export Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows: any[] = [];
    rows.push([`CIVILMATH UNIVERSAL BBS - ${projectName.toUpperCase()}`]);
    rows.push([`Structure: ${structureType} | ${steelGrade}`]);
    rows.push([]);
    rows.push(["Mark", "Description", "Dia", "Shape", "Dim A", "Dim B", "Dim C", "Pcs/Mem", "Total", isMetric ? "Cut(m)" : "Cut(ft)", isMetric ? "Tot(m)" : "Tot(ft)", isMetric ? "Wt(kg)" : "Wt(lb)"]);
    rebarList.forEach(r => rows.push([r.mark, r.description, getRebarData(r.dia, isMetric).label, r.shapeCode, r.dims.a, r.dims.b, r.dims.c, r.barsPerMember, r.totalBars, r.cuttingLength, r.totalLength, r.totalWeight]));
    rows.push([]); rows.push(["Concrete Vol", `${concreteVolume} ${isMetric ? 'm³' : 'yd³'}`]);
    rows.push(["Steel Weight", `${totalSteelWeight} ${isMetric ? 'kg' : 'lbs'}`]);
    rows.push(["Total Cost", `${currency} ${totalProjectCost.toFixed(2)}`]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "BBS"); XLSX.writeFile(wb, `BBS-${structureType}-${projectName.replace(/\s+/g, '_')}.xlsx`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows: string[] = [`CIVILMATH UNIVERSAL BBS,${projectName}`, `Structure,${structureType}`, ''];
    rows.push("Mark,Description,Dia,Shape,Pcs/Mem,Total,Len,Weight");
    rebarList.forEach(r => rows.push(`${r.mark},"${r.description}",${getRebarData(r.dia, isMetric).label},${r.shapeCode},${r.barsPerMember},${r.totalBars},${r.cuttingLength.toFixed(3)},${r.totalWeight.toFixed(2)}`));
    rows.push(''); rows.push(`Concrete Vol,${concreteVolume} ${isMetric ? 'm³' : 'yd³'}`);
    rows.push(`Steel Weight,${totalSteelWeight} ${isMetric ? 'kg' : 'lbs'}`);
    rows.push(`Total Cost,${currency} ${totalProjectCost.toFixed(2)}`);
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `BBS-${structureType}-${projectName.replace(/\s+/g, '_')}.csv`; a.click();
  };

  const handleSaveProject = () => {
    const calcObj: SavedCalculation = {
      id: `bbs_saved_${Date.now()}`, calculatorId, name: `${projectName} (Universal BBS - ${structureType})`,
      timestamp: Date.now(), unitSystem, inputs: { ...inputs, projectName, engineer, steelPrice, concretePrice },
      outputs: { concreteVolume, totalSteelWeight, totalProjectCost, rebarCount: rebarList.length }, notes,
    };
    onSaveCalculation(calcObj); setIsSavedSuccessfully(true);
    setTimeout(() => setIsSavedSuccessfully(false), 4000);
  };

  // Input field rendering helper
  const renderNumberField = (key: string, label: string, value: number | undefined, onChange: (v: number) => void, suffix: string, step = 'any') => (
    <div>
      <label className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{label}</label>
      <div className="relative mt-0.5">
        <NumericInput step={step} value={value ?? ''}
          onChange={(raw, num) => onChange(raw === '' ? 0 : num)}
          variant="ubbs" />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] uppercase text-slate-400 font-bold">{suffix}</span>
      </div>
    </div>
  );

  const renderSelectField = (key: string, label: string, value: number | undefined, options: { value: number; label: string }[], onChange: (v: number) => void) => (
    <div>
      <label className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{label}</label>
      <select value={value ?? ''} onChange={e => onChange(parseInt(e.target.value) || 0)}
        className="w-full mt-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#0A84FF] cursor-pointer h-8">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const rebarOptions = isMetric ? METRIC_REBAR_OPTIONS : IMPERIAL_REBAR_OPTIONS;

  return (
    <div className={`space-y-5 text-left ${isPrintPreviewMode ? 'print-preview-mode' : ''}`}>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isResultSheetOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm" onClick={() => setIsResultSheetOpen(false)}>
              <motion.section initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} role="dialog" aria-modal="true" aria-label="BBS Calculation results" className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900" onClick={event => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">Calculation complete</span>
                    <h2 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{structureType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} BBS Summary</h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Review bar bending schedule and quantity survey summary.</p>
                  </div>
                  <button onClick={() => setIsResultSheetOpen(false)} aria-label="Close results" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Concrete Volume</div>
                    <div className="mt-1 break-words text-base font-extrabold text-slate-800 dark:text-white">{concreteVolume} {isMetric ? 'm³' : 'yd³'}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total Steel Weight</div>
                    <div className="mt-1 break-words text-base font-extrabold text-[#2563EB]">{totalSteelWeight.toFixed(1)} {isMetric ? 'kg' : 'lbs'}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Reinforcement Ratio</div>
                    <div className="mt-1 break-words text-base font-extrabold text-emerald-600 dark:text-emerald-400">{reinforcementRatio.toFixed(2)} kg/m³</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total Cost</div>
                    <div className="mt-1 break-words text-base font-extrabold text-amber-600 dark:text-amber-400">{currency} {totalProjectCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 font-mono">Bar Schedule Overview ({rebarList.length} marks)</div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {rebarList.map(item => (
                      <div key={item.mark} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.mark} ({item.description})</span>
                        <span className="font-mono text-slate-500">φ{item.dia} · {item.totalBars} bars · {item.totalWeight.toFixed(1)} {isMetric ? 'kg' : 'lbs'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button onClick={handleExportPDF} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">Download PDF</button>
                  <button onClick={handleExportExcel} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">Download Excel</button>
                  <button onClick={() => {
                    const text = `Structure: ${structureType}\nConcrete: ${concreteVolume} ${isMetric ? 'm³' : 'yd³'}\nSteel: ${totalSteelWeight.toFixed(1)} ${isMetric ? 'kg' : 'lbs'}\nCost: ${currency} ${totalProjectCost.toFixed(2)}`;
                    navigator.clipboard.writeText(text);
                  }} className="rounded-xl bg-[#2563EB] px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer">Copy summary</button>
                </div>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl backdrop-blur-lg shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-[#0A84FF] rounded-xl border border-blue-100/50 dark:border-blue-900/40">
            <Clipboard className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-sans">Universal Bar Bending Schedule</h2>
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{structureType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Module</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 flex text-[9px]">
            <button onClick={() => setUnitSystem('metric')} className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${isMetric ? 'bg-[#0A84FF] text-white' : 'text-slate-500'}`}>SI</button>
            <button onClick={() => setUnitSystem('imperial')} className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${!isMetric ? 'bg-[#0A84FF] text-white' : 'text-slate-500'}`}>US</button>
          </div>
          <select value={designStandard} onChange={e => setDesignStandard(e.target.value as DesignStandard)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-[9px] font-bold text-slate-600 outline-none cursor-pointer h-8">
            {STANDARD_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={() => setMultiMemberMode(!multiMemberMode)} className={`px-2.5 py-1.5 rounded-xl text-[10px] font-semibold flex items-center gap-1 border cursor-pointer ${multiMemberMode ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600'}`}><ListChecks className="w-3 h-3" />{multiMemberMode ? 'Multi-Member' : 'Single'}</button>
          <button onClick={() => setShowFormulas(!showFormulas)} className={`px-2.5 py-1.5 rounded-xl text-[10px] font-semibold flex items-center gap-1 border cursor-pointer ${showFormulas ? 'bg-[#0A84FF]/10 border-[#0A84FF]/40 text-[#0A84FF]' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600'}`}><BookOpen className="w-3 h-3" />{showFormulas ? 'Hide' : 'Show'} Steps</button>
          <button onClick={handleExportPDF} className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-semibold text-slate-600 flex items-center gap-1 hover:bg-slate-50 cursor-pointer"><FileText className="w-3 h-3 text-red-500" />PDF</button>
          <button onClick={handleExportExcel} className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-semibold text-slate-600 flex items-center gap-1 hover:bg-slate-50 cursor-pointer"><FileSpreadsheet className="w-3 h-3 text-emerald-600" />XLSX</button>
          <button onClick={handleExportCSV} className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-semibold text-slate-600 flex items-center gap-1 hover:bg-slate-50 cursor-pointer"><Download className="w-3 h-3 text-purple-500" />CSV</button>
          <button onClick={() => window.print()} className="px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-semibold text-slate-600 flex items-center gap-1 hover:bg-slate-50 cursor-pointer"><Printer className="w-3 h-3 text-blue-500" />Print</button>
          <button onClick={handleSaveProject} className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer ${isSavedSuccessfully ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white dark:bg-blue-600'}`}><Save className="w-3 h-3" />{isSavedSuccessfully ? 'Saved!' : 'Save'}</button>
        </div>
      </div>

      {/* Structure Type Selector — hidden in multi-member mode */}
      {!multiMemberMode && (
      <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl backdrop-blur-lg shadow-xs">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#0A84FF]" />
          SELECT STRUCTURE TYPE
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-1.5">
          {STRUCTURES.map(s => (
            <button key={s.id} onClick={() => handleStructureChange(s.id)}
              className={`px-2.5 py-2 rounded-xl text-[10px] font-bold font-mono transition-all cursor-pointer border text-left leading-tight ${
                structureType === s.id
                  ? 'bg-[#0A84FF]/10 dark:bg-[#0A84FF]/20 border-[#0A84FF]/40 text-[#0A84FF] shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-[#0A84FF]/30 hover:text-[#0A84FF]'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Engineering Formula Transparency Panel */}
      {showFormulas && (
        <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl backdrop-blur-lg shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Sigma className="w-3.5 h-3.5 text-[#0A84FF]" />
              <h3 className="text-[10px] font-bold font-mono text-slate-700 dark:text-slate-350 uppercase tracking-wider">FORMULA TRANSPARENCY — {getStandard(designStandard).label}</h3>
            </div>
            <button onClick={() => setShowFormulas(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"><X className="w-3 h-3 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
            {rebarList.map((item) => (
              <div key={item.mark} className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-[9px] font-mono space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#0A84FF] font-bold">{item.mark}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-600 dark:text-slate-300">{item.description}</span>
                </div>
                <div className="flex flex-wrap gap-1 text-slate-500">
                  <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">φ{item.dia}</span>
                  <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">Shape C{item.shapeCode}</span>
                  <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{item.totalBars} bars</span>
                </div>
                <div className="text-slate-500 leading-relaxed text-[8px]">
                  <span className="font-bold text-slate-600">Cutting Length:</span> {item.cuttingLength.toFixed(3)} {isMetric ? 'm' : 'ft'}
                </div>
                <div className="text-slate-500 leading-relaxed text-[8px]">
                  <span className="font-bold text-slate-600">Formula:</span> L = {item.dims.a.toFixed(0)} + {item.dims.b.toFixed(0)} + {item.dims.c.toFixed(0)} (shape C{item.shapeCode})
                </div>
                {item.formulaSteps && item.formulaSteps.length > 0 && (
                  <button onClick={() => setExpandedBarMark(expandedBarMark === item.mark ? null : item.mark)}
                    className="text-[#0A84FF] text-[8px] hover:underline cursor-pointer">
                    {expandedBarMark === item.mark ? '▲ Hide steps' : '▼ Show calculation steps'}
                  </button>
                )}
                {expandedBarMark === item.mark && item.formulaSteps && (
                  <div className="bg-white dark:bg-slate-900 rounded-lg p-2 mt-1 border border-slate-200 dark:border-slate-700 space-y-0.5">
                    {item.formulaSteps.map((step, si) => (
                      <div key={si} className="text-slate-600 dark:text-slate-400 text-[8px] leading-relaxed flex gap-1">
                        <span className="text-[#0A84FF] shrink-0">{'→'}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {rebarList.length === 0 && (
            <div className="text-[10px] text-slate-500 text-center py-4">No items calculated yet. Adjust inputs and the BBS will generate.</div>
          )}
        </div>
      )}

      {/* Engineering Validation Summary */}
      {rebarList.length > 0 && (() => {
        const valResult = validateReinforcement({
          elementType: structureType,
          width: inputs.width || inputs.width || 0.3,
          depth: inputs.depth || inputs.depth || 0.5,
          length: inputs.length || inputs.span || 1,
          cover: inputs.cover || 30,
          barDia: inputs.mainDia || inputs.mainDia || 12,
          barCount: inputs.mainCount || 4,
          spacing: inputs.mainSpacing || inputs.mainSpacing || 150,
          isMetric,
        }, designStandard);
        if (!valResult.passed || valResult.warnings.length > 0) {
          return (
            <div className={`p-4 rounded-3xl border text-[10px] space-y-2 ${!valResult.passed ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'}`}>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className={`w-3.5 h-3.5 ${!valResult.passed ? 'text-red-500' : 'text-amber-500'}`} />
                <h3 className="text-[10px] font-bold font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider">ENGINEERING VALIDATION — {designStandard}</h3>
              </div>
              {valResult.errors.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-red-600 dark:text-red-400"><span className="text-red-500 font-bold shrink-0">✗</span><span>{r.label}: {r.message}</span></div>
              ))}
              {valResult.warnings.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-amber-600 dark:text-amber-400"><span className="text-amber-500 font-bold shrink-0">⚠</span><span>{r.label}: {r.message}</span></div>
              ))}
            </div>
          );
        }
        return null;
      })()}

      {/* Multi-Member Mode */}
      {multiMemberMode ? (
        <MemberManager
          unitSystem={unitSystem}
          designStandard={designStandard}
          currency={currency}
          steelPrice={steelPrice}
          concretePrice={concretePrice}
          projectName={projectName}
          isPrintPreviewMode={isPrintPreviewMode}
          onMembersChange={setMultiMembers}
        />
      ) : (
        <>
      {/* Main Grid: Inputs + Drawing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT: Project + Inputs */}
        <div className="lg:col-span-4 space-y-5">
          {/* Project Details */}
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl backdrop-blur-lg shadow-xs space-y-2.5">
            <h3 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
              <Info className="w-3 h-3 text-[#0A84FF]" /> PROJECT DETAILS
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {[
                ['projectName', 'Project Name', projectName, setProjectName],
                ['drawingNumber', 'Drawing No.', drawingNumber, setDrawingNumber],
                ['engineer', 'Engineer', engineer, setEngineer],
                ['client', 'Client', client, setClient],
                ['revision', 'Revision', revision, setRevision],
                ['steelGrade', 'Steel Grade', steelGrade, setSteelGrade],
              ].map(([key, label, val, setter]) => (
                <div key={key as string}>
                  <label className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{label as string}</label>
                  <input type="text" value={val as string} onChange={e => (setter as Function)(e.target.value)}
                    className="w-full mt-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#0A84FF]" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Concrete Grade</label>
              <input type="text" value={concreteGrade} onChange={e => setConcreteGrade(e.target.value)}
                className="w-full mt-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#0A84FF]" />
            </div>
            <div>
              <label className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full mt-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-[#0A84FF] resize-none" />
            </div>
          </div>

          {/* Dynamic Inputs */}
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl backdrop-blur-lg shadow-xs space-y-3">
            <h3 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
              MEMBER DIMENSIONS &amp; REINFORCEMENT
            </h3>
            <div className="space-y-2.5">
              {(structureType === 'footing') && (
                <>
                  {renderNumberField('length', 'Length', inputs.length, v => handleInputChange('length', v), isMetric ? 'm' : 'ft')}
                  {renderNumberField('width', 'Width', inputs.width, v => handleInputChange('width', v), isMetric ? 'm' : 'ft')}
                  {renderNumberField('depth', 'Depth / Thickness', inputs.depth, v => handleInputChange('depth', v), isMetric ? 'm' : 'ft')}
                  {renderNumberField('cover', 'Concrete Cover', inputs.cover, v => handleInputChange('cover', v), isMetric ? 'mm' : 'in')}
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('mainDia', 'Main Bar Dia', inputs.mainDia, rebarOptions, v => handleInputChange('mainDia', v))}
                    {renderNumberField('mainSpacing', 'Main Spacing', inputs.mainSpacing, v => handleInputChange('mainSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('distDia', 'Dist. Bar Dia', inputs.distDia, rebarOptions, v => handleInputChange('distDia', v))}
                    {renderNumberField('distSpacing', 'Dist. Spacing', inputs.distSpacing, v => handleInputChange('distSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                </>
              )}

              {(structureType === 'column') && (
                <>
                  {renderNumberField('height', 'Column Height', inputs.height, v => handleInputChange('height', v), isMetric ? 'm' : 'ft')}
                  <div className="grid grid-cols-2 gap-2">
                    {renderNumberField('width', 'Width (b)', inputs.width, v => handleInputChange('width', v), isMetric ? 'm' : 'ft')}
                    {renderNumberField('depth', 'Depth (h)', inputs.depth, v => handleInputChange('depth', v), isMetric ? 'm' : 'ft')}
                  </div>
                  {renderNumberField('cover', 'Concrete Cover', inputs.cover, v => handleInputChange('cover', v), isMetric ? 'mm' : 'in')}
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('mainDia', 'Main Bar Dia', inputs.mainDia, rebarOptions, v => handleInputChange('mainDia', v))}
                    {renderNumberField('mainCount', 'Main Bar Count', inputs.mainCount, v => handleInputChange('mainCount', v), '')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('tieDia', 'Tie Dia', inputs.tieDia, rebarOptions, v => handleInputChange('tieDia', v))}
                    {renderNumberField('tieSpacing', 'Tie Spacing', inputs.tieSpacing, v => handleInputChange('tieSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderNumberField('lapLengthFactor', 'Lap Factor (×d)', inputs.lapLengthFactor, v => handleInputChange('lapLengthFactor', v), '')}
                    {renderNumberField('embedment', 'Embedment', inputs.embedment, v => handleInputChange('embedment', v), isMetric ? 'mm' : 'in')}
                  </div>
                </>
              )}

              {(structureType === 'beam') && (
                <>
                  {renderNumberField('span', 'Beam Span', inputs.span, v => handleInputChange('span', v), isMetric ? 'm' : 'ft')}
                  <div className="grid grid-cols-2 gap-2">
                    {renderNumberField('width', 'Width (b)', inputs.width, v => handleInputChange('width', v), isMetric ? 'm' : 'ft')}
                    {renderNumberField('depth', 'Depth (h)', inputs.depth, v => handleInputChange('depth', v), isMetric ? 'm' : 'ft')}
                  </div>
                  {renderNumberField('cover', 'Concrete Cover', inputs.cover, v => handleInputChange('cover', v), isMetric ? 'mm' : 'in')}
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('topDia', 'Top Bar Dia', inputs.topDia, rebarOptions, v => handleInputChange('topDia', v))}
                    {renderNumberField('topCount', 'Top Bar Count', inputs.topCount, v => handleInputChange('topCount', v), '')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('botDia', 'Bottom Bar Dia', inputs.botDia, rebarOptions, v => handleInputChange('botDia', v))}
                    {renderNumberField('botCount', 'Bottom Bar Count', inputs.botCount, v => handleInputChange('botCount', v), '')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('stirrupDia', 'Stirrup Dia', inputs.stirrupDia, rebarOptions, v => handleInputChange('stirrupDia', v))}
                    {renderNumberField('stirrupSpacing', 'Stirrup Spacing', inputs.stirrupSpacing, v => handleInputChange('stirrupSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  {renderNumberField('hookLengthFactor', 'Hook Factor (×d)', inputs.hookLengthFactor, v => handleInputChange('hookLengthFactor', v), '')}
                </>
              )}

              {(structureType === 'slab') && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {renderNumberField('length', 'Slab Length', inputs.length, v => handleInputChange('length', v), isMetric ? 'm' : 'ft')}
                    {renderNumberField('width', 'Slab Width', inputs.width, v => handleInputChange('width', v), isMetric ? 'm' : 'ft')}
                  </div>
                  {renderNumberField('thickness', 'Slab Thickness', inputs.thickness, v => handleInputChange('thickness', v), isMetric ? 'mm' : 'in')}
                  {renderNumberField('cover', 'Concrete Cover', inputs.cover, v => handleInputChange('cover', v), isMetric ? 'mm' : 'in')}
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('mainDia', 'Main Bar Dia', inputs.mainDia, rebarOptions, v => handleInputChange('mainDia', v))}
                    {renderNumberField('mainSpacing', 'Main Spacing', inputs.mainSpacing, v => handleInputChange('mainSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('distDia', 'Dist. Bar Dia', inputs.distDia, rebarOptions, v => handleInputChange('distDia', v))}
                    {renderNumberField('distSpacing', 'Dist. Spacing', inputs.distSpacing, v => handleInputChange('distSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  {renderNumberField('chairCount', 'Chair Count', inputs.chairCount, v => handleInputChange('chairCount', v), '')}
                </>
              )}

              {(structureType === 'staircase') && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {renderNumberField('waistSlab', 'Waist Slab Thk', inputs.waistSlab, v => handleInputChange('waistSlab', v), isMetric ? 'mm' : 'in')}
                    {renderNumberField('cover', 'Cover', inputs.cover, v => handleInputChange('cover', v), isMetric ? 'mm' : 'in')}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {renderNumberField('riser', 'Riser', inputs.riser, v => handleInputChange('riser', v), isMetric ? 'mm' : 'in')}
                    {renderNumberField('tread', 'Tread', inputs.tread, v => handleInputChange('tread', v), isMetric ? 'mm' : 'in')}
                    {renderNumberField('steps', 'Steps', inputs.steps, v => handleInputChange('steps', v), '')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderNumberField('landingTop', 'Top Landing', inputs.landingTop, v => handleInputChange('landingTop', v), isMetric ? 'm' : 'ft')}
                    {renderNumberField('landingBot', 'Bot Landing', inputs.landingBot, v => handleInputChange('landingBot', v), isMetric ? 'm' : 'ft')}
                  </div>
                  {renderNumberField('landingWidth', 'Landing Width', inputs.landingWidth, v => handleInputChange('landingWidth', v), isMetric ? 'm' : 'ft')}
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('mainDia', 'Main Bar Dia', inputs.mainDia, rebarOptions, v => handleInputChange('mainDia', v))}
                    {renderNumberField('mainSpacing', 'Main Spacing', inputs.mainSpacing, v => handleInputChange('mainSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('distDia', 'Dist. Bar Dia', inputs.distDia, rebarOptions, v => handleInputChange('distDia', v))}
                    {renderNumberField('distSpacing', 'Dist. Spacing', inputs.distSpacing, v => handleInputChange('distSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                </>
              )}

              {(structureType === 'retaining-wall') && (
                <>
                  {renderNumberField('stemHeight', 'Stem Height', inputs.stemHeight, v => handleInputChange('stemHeight', v), isMetric ? 'm' : 'ft')}
                  <div className="grid grid-cols-2 gap-2">
                    {renderNumberField('stemBaseThk', 'Stem Base Thk', inputs.stemBaseThk, v => handleInputChange('stemBaseThk', v), isMetric ? 'm' : 'ft')}
                    {renderNumberField('stemTopThk', 'Stem Top Thk', inputs.stemTopThk, v => handleInputChange('stemTopThk', v), isMetric ? 'm' : 'ft')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderNumberField('baseLength', 'Base Length', inputs.baseLength, v => handleInputChange('baseLength', v), isMetric ? 'm' : 'ft')}
                    {renderNumberField('baseThk', 'Base Thickness', inputs.baseThk, v => handleInputChange('baseThk', v), isMetric ? 'm' : 'ft')}
                  </div>
                  {renderNumberField('cover', 'Cover', inputs.cover, v => handleInputChange('cover', v), isMetric ? 'mm' : 'in')}
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('vertDia', 'Vertical Bar Dia', inputs.vertDia, rebarOptions, v => handleInputChange('vertDia', v))}
                    {renderNumberField('vertSpacing', 'Vert. Spacing', inputs.vertSpacing, v => handleInputChange('vertSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('horizDia', 'Horiz. Bar Dia', inputs.horizDia, rebarOptions, v => handleInputChange('horizDia', v))}
                    {renderNumberField('horizSpacing', 'Horiz. Spacing', inputs.horizSpacing, v => handleInputChange('horizSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                </>
              )}

              {(structureType === 'raft-foundation') && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {renderNumberField('length', 'Raft Length', inputs.length, v => handleInputChange('length', v), isMetric ? 'm' : 'ft')}
                    {renderNumberField('width', 'Raft Width', inputs.width, v => handleInputChange('width', v), isMetric ? 'm' : 'ft')}
                  </div>
                  {renderNumberField('thickness', 'Raft Thickness', inputs.thickness, v => handleInputChange('thickness', v), isMetric ? 'm' : 'ft')}
                  {renderNumberField('cover', 'Cover', inputs.cover, v => handleInputChange('cover', v), isMetric ? 'mm' : 'in')}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 text-[9px] font-mono text-slate-400 uppercase">Bottom Mesh</div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('botMainDia', 'Bot Main Dia', inputs.botMainDia, rebarOptions, v => handleInputChange('botMainDia', v))}
                    {renderNumberField('botMainSpacing', 'Bot Main Spacing', inputs.botMainSpacing, v => handleInputChange('botMainSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('botDistDia', 'Bot Dist Dia', inputs.botDistDia, rebarOptions, v => handleInputChange('botDistDia', v))}
                    {renderNumberField('botDistSpacing', 'Bot Dist Spacing', inputs.botDistSpacing, v => handleInputChange('botDistSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 text-[9px] font-mono text-slate-400 uppercase">Top Mesh</div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('topMainDia', 'Top Main Dia', inputs.topMainDia, rebarOptions, v => handleInputChange('topMainDia', v))}
                    {renderNumberField('topMainSpacing', 'Top Main Spacing', inputs.topMainSpacing, v => handleInputChange('topMainSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('topDistDia', 'Top Dist Dia', inputs.topDistDia, rebarOptions, v => handleInputChange('topDistDia', v))}
                    {renderNumberField('topDistSpacing', 'Top Dist Spacing', inputs.topDistSpacing, v => handleInputChange('topDistSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('chairDia', 'Chair Dia', inputs.chairDia, rebarOptions, v => handleInputChange('chairDia', v))}
                    {renderNumberField('chairSpacing', 'Chair Spacing', inputs.chairSpacing, v => handleInputChange('chairSpacing', v), isMetric ? 'm' : 'ft')}
                  </div>
                </>
              )}

              {(structureType === 'pedestal') && (
                <>
                  {renderNumberField('height', 'Pedestal Height', inputs.height, v => handleInputChange('height', v), isMetric ? 'm' : 'ft')}
                  <div className="grid grid-cols-2 gap-2">
                    {renderNumberField('width', 'Width', inputs.width, v => handleInputChange('width', v), isMetric ? 'm' : 'ft')}
                    {renderNumberField('depth', 'Depth', inputs.depth, v => handleInputChange('depth', v), isMetric ? 'm' : 'ft')}
                  </div>
                  {renderNumberField('cover', 'Cover', inputs.cover, v => handleInputChange('cover', v), isMetric ? 'mm' : 'in')}
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('mainDia', 'Main Bar Dia', inputs.mainDia, rebarOptions, v => handleInputChange('mainDia', v))}
                    {renderNumberField('mainCount', 'Main Count', inputs.mainCount, v => handleInputChange('mainCount', v), '')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('tieDia', 'Tie Dia', inputs.tieDia, rebarOptions, v => handleInputChange('tieDia', v))}
                    {renderNumberField('tieSpacing', 'Tie Spacing', inputs.tieSpacing, v => handleInputChange('tieSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  {renderNumberField('starterHook', 'Starter Hook', inputs.starterHook, v => handleInputChange('starterHook', v), isMetric ? 'mm' : 'in')}
                </>
              )}

              {(structureType === 'strip-footing') && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {renderNumberField('length', 'Footing Length', inputs.length, v => handleInputChange('length', v), isMetric ? 'm' : 'ft')}
                    {renderNumberField('width', 'Footing Width', inputs.width, v => handleInputChange('width', v), isMetric ? 'm' : 'ft')}
                  </div>
                  {renderNumberField('thickness', 'Thickness', inputs.thickness, v => handleInputChange('thickness', v), isMetric ? 'm' : 'ft')}
                  {renderNumberField('cover', 'Cover', inputs.cover, v => handleInputChange('cover', v), isMetric ? 'mm' : 'in')}
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('longitudinalDia', 'Long. Bar Dia', inputs.longitudinalDia, rebarOptions, v => handleInputChange('longitudinalDia', v))}
                    {renderNumberField('longitudinalCount', 'Long. Count', inputs.longitudinalCount, v => handleInputChange('longitudinalCount', v), '')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('transverseDia', 'Trans. Bar Dia', inputs.transverseDia, rebarOptions, v => handleInputChange('transverseDia', v))}
                    {renderNumberField('transverseSpacing', 'Trans. Spacing', inputs.transverseSpacing, v => handleInputChange('transverseSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                </>
              )}

              {(structureType === 'foundation-mesh') && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {renderNumberField('length', 'Foundation Length', inputs.length, v => handleInputChange('length', v), isMetric ? 'm' : 'ft')}
                    {renderNumberField('width', 'Foundation Width', inputs.width, v => handleInputChange('width', v), isMetric ? 'm' : 'ft')}
                  </div>
                  {renderNumberField('depth', 'Foundation Depth', inputs.depth, v => handleInputChange('depth', v), isMetric ? 'm' : 'ft')}
                  {renderNumberField('cover', 'Cover', inputs.cover, v => handleInputChange('cover', v), isMetric ? 'mm' : 'in')}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 text-[9px] font-mono text-slate-400 uppercase">Bottom Mesh</div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('botMainDia', 'Bot Main Dia', inputs.botMainDia, rebarOptions, v => handleInputChange('botMainDia', v))}
                    {renderNumberField('botMainSpacing', 'Bot Main Spacing', inputs.botMainSpacing, v => handleInputChange('botMainSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('botDistDia', 'Bot Dist Dia', inputs.botDistDia, rebarOptions, v => handleInputChange('botDistDia', v))}
                    {renderNumberField('botDistSpacing', 'Bot Dist Spacing', inputs.botDistSpacing, v => handleInputChange('botDistSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 text-[9px] font-mono text-slate-400 uppercase">Top Mesh</div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('topMainDia', 'Top Main Dia', inputs.topMainDia, rebarOptions, v => handleInputChange('topMainDia', v))}
                    {renderNumberField('topMainSpacing', 'Top Main Spacing', inputs.topMainSpacing, v => handleInputChange('topMainSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('topDistDia', 'Top Dist Dia', inputs.topDistDia, rebarOptions, v => handleInputChange('topDistDia', v))}
                    {renderNumberField('topDistSpacing', 'Top Dist Spacing', inputs.topDistSpacing, v => handleInputChange('topDistSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                </>
              )}

              {/* Generic Beams: plinth, tie, lintel */}
              {['plinth-beam', 'tie-beam', 'lintel-beam'].includes(structureType) && (
                <>
                  {structureType === 'lintel-beam' ? (
                    <div className="grid grid-cols-2 gap-2">
                      {renderNumberField('clearSpan', 'Clear Span', inputs.clearSpan, v => handleInputChange('clearSpan', v), isMetric ? 'm' : 'ft')}
                      {renderNumberField('bearing', 'Bearing', inputs.bearing, v => handleInputChange('bearing', v), isMetric ? 'm' : 'ft')}
                    </div>
                  ) : (
                    renderNumberField('length', 'Beam Length', inputs.length, v => handleInputChange('length', v), isMetric ? 'm' : 'ft')
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {renderNumberField('width', 'Width', inputs.width, v => handleInputChange('width', v), isMetric ? 'm' : 'ft')}
                    {renderNumberField('depth', 'Depth', inputs.depth, v => handleInputChange('depth', v), isMetric ? 'm' : 'ft')}
                  </div>
                  {renderNumberField('cover', 'Cover', inputs.cover, v => handleInputChange('cover', v), isMetric ? 'mm' : 'in')}
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('topDia', 'Top Bar Dia', inputs.topDia, rebarOptions, v => handleInputChange('topDia', v))}
                    {renderNumberField('topCount', 'Top Count', inputs.topCount, v => handleInputChange('topCount', v), '')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('botDia', 'Bot Bar Dia', inputs.botDia, rebarOptions, v => handleInputChange('botDia', v))}
                    {renderNumberField('botCount', 'Bot Count', inputs.botCount, v => handleInputChange('botCount', v), '')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {renderSelectField('stirrupDia', 'Stirrup Dia', inputs.stirrupDia, rebarOptions, v => handleInputChange('stirrupDia', v))}
                    {renderNumberField('stirrupSpacing', 'Stirrup Spacing', inputs.stirrupSpacing, v => handleInputChange('stirrupSpacing', v), isMetric ? 'mm' : 'in')}
                  </div>
                </>
              )}

              {/* Combined Footing */}
              {structureType === 'combined-footing' && (
                <div className="space-y-3">
                  {footingSections.map((footing, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono bg-blue-50 dark:bg-blue-950 text-[#0A84FF] px-2 py-0.5 rounded-full font-bold">{footing.label || `F${idx + 1}`}</span>
                        {footingSections.length > 1 && (
                          <button onClick={() => removeFootingSection(idx)} className="p-1 rounded-lg bg-red-50 dark:bg-red-950 hover:bg-red-100 text-red-500 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {renderNumberField(`len-${idx}`, 'Length', footing.length, v => handleFootingSectionChange(idx, 'length', v), isMetric ? 'm' : 'ft')}
                        {renderNumberField(`wid-${idx}`, 'Width', footing.width, v => handleFootingSectionChange(idx, 'width', v), isMetric ? 'm' : 'ft')}
                        {renderNumberField(`thk-${idx}`, 'Height', footing.thickness, v => handleFootingSectionChange(idx, 'thickness', v), isMetric ? 'm' : 'ft')}
                      </div>
                      {renderNumberField(`cv-${idx}`, 'Cover', footing.cover, v => handleFootingSectionChange(idx, 'cover', v), isMetric ? 'mm' : 'in')}
                      {footing.includeBottomBars && (
                        <div className="space-y-2">
                          <div className="text-[9px] font-mono text-slate-400 uppercase">Bottom Mesh</div>
                          <div className="grid grid-cols-2 gap-2">
                            {renderSelectField(`botMd-${idx}`, 'Main Dia', footing.botMainDia, rebarOptions, v => handleFootingSectionChange(idx, 'botMainDia', v))}
                            {renderNumberField(`botMs-${idx}`, 'Main Spacing', footing.botMainSpacing, v => handleFootingSectionChange(idx, 'botMainSpacing', v), isMetric ? 'mm' : 'in')}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {renderSelectField(`botDd-${idx}`, 'Dist Dia', footing.botDistDia, rebarOptions, v => handleFootingSectionChange(idx, 'botDistDia', v))}
                            {renderNumberField(`botDs-${idx}`, 'Dist Spacing', footing.botDistSpacing, v => handleFootingSectionChange(idx, 'botDistSpacing', v), isMetric ? 'mm' : 'in')}
                          </div>
                        </div>
                      )}
                      {footing.includeTopBars && (
                        <div className="space-y-2">
                          <div className="text-[9px] font-mono text-slate-400 uppercase">Top Mesh</div>
                          <div className="grid grid-cols-2 gap-2">
                            {renderSelectField(`topMd-${idx}`, 'Main Dia', footing.topMainDia, rebarOptions, v => handleFootingSectionChange(idx, 'topMainDia', v))}
                            {renderNumberField(`topMs-${idx}`, 'Main Spacing', footing.topMainSpacing, v => handleFootingSectionChange(idx, 'topMainSpacing', v), isMetric ? 'mm' : 'in')}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {renderSelectField(`topDd-${idx}`, 'Dist Dia', footing.topDistDia, rebarOptions, v => handleFootingSectionChange(idx, 'topDistDia', v))}
                            {renderNumberField(`topDs-${idx}`, 'Dist Spacing', footing.topDistSpacing, v => handleFootingSectionChange(idx, 'topDistSpacing', v), isMetric ? 'mm' : 'in')}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3 text-[9px] font-mono">
                        <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={footing.includeBottomBars} onChange={e => handleFootingSectionChange(idx, 'includeBottomBars', e.target.checked)} className="accent-[#0A84FF]" /> Bottom</label>
                        <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={footing.includeTopBars} onChange={e => handleFootingSectionChange(idx, 'includeTopBars', e.target.checked)} className="accent-[#0A84FF]" /> Top</label>
                      </div>
                    </div>
                  ))}
                  <button onClick={addFootingSection} className="w-full py-2 border border-dashed border-[#0A84FF]/40 bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 text-[#0A84FF] text-[10px] font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add Footing</button>
                </div>
              )}
            </div>
          </div>

          {/* Drawing */}
          <DrawingComponent />
        </div>

        {/* RIGHT: Summary + BBS Table */}
        <div id="calculator-results" className="lg:col-span-8 space-y-5">
          {/* Summary */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Box className="w-40 h-40" /></div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0A84FF]" />
                <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">QUANTITY SURVEY SUMMARY</h3>
              </div>
              {isCalculating && <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
              <span className="text-[8px] font-mono text-slate-500">{rebarList.length} items · {Object.keys(steelWeightByDia).length} sizes</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><span className="text-[9px] font-mono text-slate-400 uppercase block">Concrete Volume</span><span className="text-lg font-bold">{concreteVolume} <span className="text-[10px] font-mono text-slate-400">{isMetric ? 'm³' : 'yd³'}</span></span></div>
              <div><span className="text-[9px] font-mono text-slate-400 uppercase block">Total Steel Weight</span><span className="text-lg font-bold text-[#0A84FF]">{totalSteelWeight.toFixed(1)} <span className="text-[10px] font-mono text-slate-400">{isMetric ? 'kg' : 'lbs'}</span></span></div>
              <div><span className="text-[9px] font-mono text-slate-400 uppercase block">Reinforcement Ratio</span><span className="text-lg font-bold text-emerald-400">{reinforcementRatio.toFixed(2)} <span className="text-[10px] font-mono text-slate-400">kg/m³</span></span></div>
              <div><span className="text-[9px] font-mono text-slate-400 uppercase block">Total Cost</span><span className="text-lg font-bold text-amber-400">{currency} {totalProjectCost.toFixed(2)}</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-mono">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 text-[9px]">Steel Price</span>
                  <select value={steelPriceUnit} onChange={e => setSteelPriceUnit(e.target.value as 'tonne' | 'kg')} className="bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-0.5 text-slate-300 text-[9px] outline-none cursor-pointer">
                    <option value="tonne">{isMetric ? '/tonne' : '/ton'}</option>
                    <option value="kg">{isMetric ? '/kg' : '/lb'}</option>
                  </select>
                </div>
                <div className="relative"><NumericInput value={steelPrice} onChange={(raw, num) => setSteelPrice(num)} variant="ubbsDark"  prefix={currency}/></div>
                <div className="text-slate-500 text-[8px]">{currency} {(totalSteelCost).toFixed(2)} total</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[9px]">Concrete Price ({isMetric ? '/m³' : '/yd³'})</span>
                <div className="relative"><NumericInput value={concretePrice} onChange={(raw, num) => setConcretePrice(num)} variant="none" className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-2 py-1 text-white text-xs outline-none focus:border-emerald-500 h-7"  prefix={currency}/></div>
                <div className="text-slate-500 text-[8px]">{currency} {(totalConcreteCost).toFixed(2)} total</div>
              </div>
              <div className="flex flex-col justify-center items-start bg-slate-950 rounded-xl p-2 border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase">Grand Total</span>
                <span className="text-lg font-bold text-amber-400">{currency} {totalProjectCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* BBS Table */}
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl backdrop-blur-lg shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5 text-[#0A84FF]" />
                <h3 className="text-[10px] font-bold font-mono text-slate-700 dark:text-slate-350 uppercase tracking-wider">BAR BENDING SCHEDULE</h3>
              </div>
              <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 font-bold">{rebarList.length} items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                    <th className="py-2 pr-1">Mark</th>
                    <th className="py-2 pr-1">Description</th>
                    <th className="py-2 text-center">Dia</th>
                    <th className="py-2 text-center">Shape</th>
                    <th className="py-2 text-center">A</th>
                    <th className="py-2 text-center">B</th>
                    <th className="py-2 text-center">C</th>
                    <th className="py-2 text-center">Pcs</th>
                    <th className="py-2 text-center">Tot</th>
                    <th className="py-2 text-right">{isMetric ? "Cut(m)" : "Cut(ft)"}</th>
                    <th className="py-2 text-right">{isMetric ? "Tot(m)" : "Tot(ft)"}</th>
                    <th className="py-2 text-right">{isMetric ? "Wt(kg)" : "Wt(lb)"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {rebarList.map((row) => (
                    <tr key={row.mark} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all font-mono text-[10px]">
                      <td className="py-2 font-bold text-[#0A84FF]">{row.mark}</td>
                      <td className="py-2 font-sans pr-1 font-medium text-slate-800 dark:text-slate-200">{row.description}</td>
                      <td className="py-2 text-center font-bold">{getRebarData(row.dia, isMetric).label}</td>
                      <td className="py-2 text-center font-mono text-slate-400">C{row.shapeCode}</td>
                      <td className="py-2 text-center font-mono">{row.dims.a.toFixed(0)}</td>
                      <td className="py-2 text-center font-mono">{row.dims.b.toFixed(0)}</td>
                      <td className="py-2 text-center font-mono">{row.dims.c.toFixed(0)}</td>
                      <td className="py-2 text-center">{row.barsPerMember}</td>
                      <td className="py-2 text-center font-bold text-slate-700 dark:text-slate-300">{row.totalBars}</td>
                      <td className="py-2 text-right font-mono">{row.cuttingLength.toFixed(3)}</td>
                      <td className="py-2 text-right font-bold font-mono">{row.totalLength.toFixed(3)}</td>
                      <td className="py-2 text-right font-extrabold text-slate-900 dark:text-emerald-400">{row.totalWeight.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Steel weight breakdown */}
            {Object.keys(steelWeightByDia).length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block mb-2 font-bold">Steel Size Breakdown</span>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(steelWeightByDia) as [string, number][]).map(([dia, wt]) => (
                    <span key={dia} className="text-[9px] font-mono bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <span className="font-bold text-[#0A84FF]">{dia}</span>
                      <span className="text-slate-300">|</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{wt.toFixed(1)} {isMetric ? 'kg' : 'lbs'}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Compliance */}
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl text-[10px] space-y-2">
            <span className="text-slate-500 font-mono text-[8px] uppercase tracking-widest font-bold">ENGINEERING COMPLIANCE — {getStandard(designStandard).label} · {steelGrade} · {concreteGrade}</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600 dark:text-slate-400 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Design Code: {designStandard}</h4>
                <p className="font-mono text-[9px]">fy = {getStandard(designStandard).fy} MPa · fck = {getStandard(designStandard).fck} MPa · ρ_min = {(getStandard(designStandard).minReinfRatio(structureType) * 100).toFixed(2)}%</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"><Info className="w-3 h-3 text-blue-500" /> Material Standards</h4>
                <p className="text-[9px]">Steel density: 7,850 kg/m³ (490 lbs/ft³). Bar weight (metric): d²/162 kg/m. Concrete gross volume excludes rebar displacement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
