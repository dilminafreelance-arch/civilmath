import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, GitCommit, Grid, Server, Anchor, Trello, Compass, TrendingUp, RefreshCw, 
  Sparkles, Check, AlertTriangle, HelpCircle, Save, Share2, Clipboard, Printer, Undo2, 
  ArrowRight, FileText, ListOrdered, Code, FileSpreadsheet, Plus, Trash2, Layout,
  ChevronDown, ChevronUp, Copy, BookOpen, Calculator, Box
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import XLSX from 'xlsx-js-style';
import { UnitSystem, SavedCalculation, CURRENCY_MAPPING } from '../types';
import { ExportModal } from './ExportModal';
import { encodeCalculationToUrl, parseCalculationFromUrl, copyShareLinkToClipboard } from '../utils/shareUrl';
import Visual3DPreview from './Visual3DPreview';
import BrickEstimator3D from './BrickEstimator3D';
import BBSCalculator from './BBSCalculator';
import { UniversalBBSCalculator } from '../UniversalBBSCalculator';
import { CALCULATORS_LIST, FORMULA_REFERENCES } from '../data/calculatorsData';
import { 
  calculateConcreteVolume, 
  calculateBeam, 
  calculateColumn, 
  calculateSlabThickness, 
  calculateBearingCapacity, 
  calculateRetainingWall, 
  calculateCoordinateGeometry,
  calculateHeightOfInstrument,
  calculateTraverseCompass,
  calculateSteelWeight,
  calculateRebarQuantity,
  calculateBrickMasonry,
  UNIT_CONVERSIONS,
  convertUnits,
  METRIC_MATERIALS,
  IMPERIAL_MATERIALS
} from '../utils/calcEngine';
import { NumericInput } from './NumericInput';

interface ConcreteStepByStepProps {
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  unitSystem: UnitSystem;
  getNormalizedValue: (field: string, expectedUnit: string) => number;
}

export function ConcreteStepByStep({ inputs, outputs, unitSystem, getNormalizedValue }: ConcreteStepByStepProps) {
  const isM = unitSystem === 'metric';
  const len = Number(inputs.length) || 0;
  const wid = Number(inputs.width) || 0;
  const thk = Number(inputs.thickness) || 0;

  // Standard Normalized Metric Values for Formula Trace (Floating point precision)
  const L_m = getNormalizedValue('length', 'm');
  const W_m = getNormalizedValue('width', 'm');
  const T_m = getNormalizedValue('thickness', 'm');

  const WetVolume = L_m * W_m * T_m;
  const shrinkageInputType = inputs.shrinkageInputType || 'percentage';
  const shrinkage = shrinkageInputType === 'multiplier'
    ? (inputs.shrinkageMultiplier !== undefined ? Number(inputs.shrinkageMultiplier) : 1.54)
    : (inputs.shrinkagePercent !== undefined ? Number(inputs.shrinkagePercent) : 54);
  const Factor = shrinkageInputType === 'multiplier' ? shrinkage : (1 + shrinkage / 100);
  const wastePercent = Number(inputs.wastePercent) || 0;
  const WastageFactor = 1 + wastePercent / 100;

  // "Never apply wastage to material quantities." Dry volume must carry no wastage!
  const DryVolume = WetVolume * Factor;
  const OrderedConcrete = WetVolume * WastageFactor;

  const mix = inputs.mixType || 'M20';
  let CementPart = 1, SandPart = 1.5, AggregatePart = 3;
  if (mix === 'M5') { CementPart = 1; SandPart = 5; AggregatePart = 10; }
  else if (mix === 'M7.5') { CementPart = 1; SandPart = 4; AggregatePart = 8; }
  else if (mix === 'M10') { CementPart = 1; SandPart = 3; AggregatePart = 6; }
  else if (mix === 'M15') { CementPart = 1; SandPart = 2; AggregatePart = 4; }
  else if (mix === 'M25') { CementPart = 1; SandPart = 1; AggregatePart = 2; }
  else if (mix === 'custom') {
    CementPart = typeof inputs.cementRatio !== 'undefined' && inputs.cementRatio !== '' && !isNaN(Number(inputs.cementRatio)) && Number(inputs.cementRatio) > 0 ? Number(inputs.cementRatio) : 1;
    SandPart = typeof inputs.sandRatio !== 'undefined' && inputs.sandRatio !== '' && !isNaN(Number(inputs.sandRatio)) && Number(inputs.sandRatio) >= 0 ? Number(inputs.sandRatio) : 1.5;
    AggregatePart = typeof inputs.aggregateRatio !== 'undefined' && inputs.aggregateRatio !== '' && !isNaN(Number(inputs.aggregateRatio)) && Number(inputs.aggregateRatio) >= 0 ? Number(inputs.aggregateRatio) : 3;
  }
  const TotalParts = CementPart + SandPart + AggregatePart;
  const TotalPartsSafe = TotalParts > 0 ? TotalParts : 5.5;

  const CementVolume = DryVolume * (CementPart / TotalPartsSafe);
  const CementWeight = CementVolume * 1440;
  // "One 50 kg cement bag = 0.0347 m³", "Cement Bags = Cement Volume / 0.0347" (rounded up)
  const bagVol = isM ? 0.0347 : 0.0283168;
  const Bags = CementVolume / bagVol;

  const SandVolume = DryVolume * (SandPart / TotalPartsSafe);
  const SandWeight = (SandVolume * 1600) / 1000;

  const AggregateVolume = DryVolume * (AggregatePart / TotalPartsSafe);
  const AggregateWeight = (AggregateVolume * 1550) / 1000;

  const wcRatio = typeof inputs.waterCementRatio !== 'undefined' && !isNaN(Number(inputs.waterCementRatio)) && Number(inputs.waterCementRatio) > 0
    ? Number(inputs.waterCementRatio)
    : (mix === 'M5' ? 0.60 : mix === 'M7.5' || mix === 'M10' ? 0.55 : mix === 'M25' ? 0.45 : 0.50);
  const WaterLiters = CementWeight * wcRatio;
  const WaterGallons = WaterLiters * 0.264172;

  // Accordion state (all initially expanded)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
  });

  const toggleStep = (stepNum: number) => {
    setExpanded(prev => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  const expandAll = () => {
    setExpanded({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: true });
  };

  const collapseAll = () => {
    setExpanded({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false });
  };

  return (
    <div className="space-y-4 font-mono text-xs text-slate-300 font-mono">
      <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
        <span className="text-[10px] font-sans font-bold text-slate-450 uppercase tracking-wider">Step Controls</span>
        <div className="flex space-x-1.5">
          <button
            type="button"
            onClick={expandAll}
            className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-md text-[9px] hover:bg-slate-800 cursor-pointer font-bold"
          >
            EXPAND ALL
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-md text-[9px] hover:bg-slate-800 cursor-pointer font-bold"
          >
            COLLAPSE ALL
          </button>
        </div>
      </div>

      {/* STEP 1 */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleStep(1)}
          className="w-full flex justify-between items-center p-3 bg-slate-900/60 hover:bg-slate-900 border-b border-slate-850 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 flex items-center justify-center bg-[#0A84FF]/10 text-[#0A84FF] rounded-md font-bold text-[10px] border border-[#0A84FF]/20">01</span>
            <span className="font-bold text-slate-200">Step 1 – Wet Concrete Volume</span>
          </div>
          {expanded[1] ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-450" />}
        </button>
        
        {expanded[1] && (
          <div className="p-4 space-y-3 leading-relaxed">
            <div>
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-1">Formula</span>
              <div className="py-2 bg-slate-900/80 border border-slate-850 rounded-lg text-center text-emerald-400 font-sans font-bold text-xs select-all">
                Wet Volume = Length × Width × Thickness
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900/20 p-2.5 rounded-lg border border-slate-900">
              <div>
                <span className="text-slate-500 text-[9px]">Length (L)</span>
                <p className="text-white font-bold">{L_m.toFixed(3)} m</p>
                {!isM && <span className="text-[8px] text-slate-500 font-sans">({len.toFixed(3)} ft)</span>}
              </div>
              <div>
                <span className="text-slate-500 text-[9px]">Width (W)</span>
                <p className="text-white font-bold">{W_m.toFixed(3) } m</p>
                {!isM && <span className="text-[8px] text-slate-500 font-sans">({wid.toFixed(3)} ft)</span>}
              </div>
              <div>
                <span className="text-slate-500 text-[9px]">Thickness (T)</span>
                <p className="text-white font-bold">{T_m.toFixed(3)} m</p>
                {!isM && <span className="text-[8px] text-slate-500 font-sans">({thk.toFixed(3)} in)</span>}
              </div>
            </div>

            <div>
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-1">Calculation</span>
              <div className="text-slate-300 font-mono space-y-1">
                <p>Wet Volume = {L_m.toFixed(3)} × {W_m.toFixed(3)} × {T_m.toFixed(3)}</p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg mt-1 text-emerald-420">
                  = <span className="font-extrabold text-white tracking-wider text-xs">{WetVolume.toFixed(3)} m³</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2 */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleStep(2)}
          className="w-full flex justify-between items-center p-3 bg-slate-900/60 hover:bg-slate-900 border-b border-slate-850 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 flex items-center justify-center bg-[#0A84FF]/10 text-[#0A84FF] rounded-md font-bold text-[10px] border border-[#0A84FF]/20">02</span>
            <span className="font-bold text-slate-200">Step 2 – Dry Volume & Wastage</span>
          </div>
          {expanded[2] ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-450" />}
        </button>

        {expanded[2] && (
          <div className="p-4 space-y-3 leading-relaxed">
            <div className="space-y-4">
              <div>
                <span className="text-slate-500 text-[9px] uppercase font-bold block mb-1">Dry Volume Formula (No Wastage)</span>
                <div className="py-2 bg-slate-900/80 border border-slate-850 rounded-lg text-center text-emerald-400 font-sans font-bold text-xs select-all">
                  {shrinkageInputType === 'multiplier' 
                    ? `Dry Volume = Wet Volume × Dry Volume Factor` 
                    : `Dry Volume = Wet Volume × (1 + Shrinkage% / 100)`}
                </div>
                <div className="text-slate-300 font-mono space-y-1 mt-2 pl-1">
                  <p>Dry Volume = {WetVolume.toFixed(3)} m³ × {Factor.toFixed(3)}</p>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg mt-1 text-emerald-420">
                    = <span className="font-extrabold text-white tracking-wider text-xs">{DryVolume.toFixed(3)} m³</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block">
                    {shrinkageInputType === 'multiplier' 
                      ? `(${Factor.toFixed(3)} dry volume multiplier factor)` 
                      : `(${shrinkage}% dry shrinkage ratio multiplier)`}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[9px] uppercase font-bold block mb-1">Ordered Concrete Formula (Wastage applied only to Ordered Concrete)</span>
                <div className="py-2 bg-slate-900/80 border border-slate-850 rounded-lg text-center text-emerald-400 font-sans font-bold text-xs select-all">
                  Ordered Concrete = Wet Volume × (1 + Wastage% / 100)
                </div>
                <div className="text-slate-300 font-mono space-y-1 mt-2 pl-1">
                  <p>Ordered Concrete = {WetVolume.toFixed(3)} m³ × {WastageFactor.toFixed(3)}</p>
                  <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg mt-1 text-blue-420">
                    = <span className="font-extrabold text-blue-400 tracking-wider text-xs">{OrderedConcrete.toFixed(3)} m³</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block">({wastePercent}% wastage multiplier applied to raw orders)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 3 */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleStep(3)}
          className="w-full flex justify-between items-center p-3 bg-slate-900/60 hover:bg-slate-900 border-b border-slate-850 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 flex items-center justify-center bg-[#0A84FF]/10 text-[#0A84FF] rounded-md font-bold text-[10px] border border-[#0A84FF]/20">03</span>
            <span className="font-bold text-slate-200">Step 3 – Total Mix Ratio</span>
          </div>
          {expanded[3] ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-450" />}
        </button>

        {expanded[3] && (
          <div className="p-4 space-y-3 leading-relaxed">
            <div>
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-1">Ratio</span>
              <div className="py-2.5 bg-slate-900/80 border border-slate-850 rounded-lg text-center text-emerald-420 font-sans font-bold text-xs">
                {CementPart} : {SandPart} : {AggregatePart} (Cement:Sand:Aggregate)
              </div>
            </div>

            <div>
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-1">Calculation</span>
              <div className="text-slate-300 font-mono space-y-1">
                <p>Total Parts = Cement + Sand + Aggregate</p>
                <p>= {CementPart} + {SandPart} + {AggregatePart}</p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg mt-1 text-emerald-420">
                  = <span className="font-extrabold text-white tracking-wider text-xs">{TotalParts.toFixed(3)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 4 */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleStep(4)}
          className="w-full flex justify-between items-center p-3 bg-slate-900/60 hover:bg-slate-900 border-b border-slate-850 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 flex items-center justify-center bg-[#0A84FF]/10 text-[#0A84FF] rounded-md font-bold text-[10px] border border-[#0A84FF]/20">04</span>
            <span className="font-bold text-slate-200">Step 4 – Cement Calculation</span>
          </div>
          {expanded[4] ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-450" />}
        </button>

        {expanded[4] && (
          <div className="p-4 space-y-4 leading-relaxed">
            {/* Cement Volume */}
            <div>
              <span className="text-slate-500 text-[9px] block mb-1 font-bold">1. VOLUME CALCULATION</span>
              <div className="py-2 bg-slate-900 border border-slate-850 rounded-lg text-center text-emerald-400 font-sans font-bold text-xs select-all">
                Cement Volume = Dry Volume × (Cement Part / Total Parts)
              </div>
              <p className="mt-1.5 text-slate-500 text-[9px]">Calculation:</p>
              <div className="text-slate-300 font-mono pl-1">
                <p>= {DryVolume.toFixed(3)} × ({CementPart} / {TotalParts.toFixed(3)})</p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-1.5 rounded-md text-emerald-420 inline-block mt-1">
                  = <span className="font-bold text-white font-mono text-xs">{CementVolume.toFixed(3)} m³</span>
                </div>
              </div>
            </div>

            {/* Cement Weight */}
            <div className="border-t border-slate-900 pt-3">
              <span className="text-slate-500 text-[9px] block mb-1 font-bold">2. WEIGHT CALCULATION (Cement Density = 1440 kg/m³)</span>
              <div className="py-2 bg-slate-900 border border-slate-850 rounded-lg text-center text-emerald-400 font-sans font-bold text-xs select-all">
                Cement Weight = Cement Volume × 1440
              </div>
              <p className="mt-1.5 text-slate-500 text-[9px]">Calculation:</p>
              <div className="text-slate-300 font-mono pl-1">
                <p>= {CementVolume.toFixed(3)} × 1440</p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-1.5 rounded-md text-emerald-420 inline-block mt-1">
                  = <span className="font-bold text-white font-mono text-xs">{CementWeight.toFixed(3)} kg</span>
                </div>
              </div>
            </div>

            {/* Cement Bags */}
            <div className="border-t border-slate-900 pt-3">
              <span className="text-slate-500 text-[9px] block mb-1 font-bold">3. BAG CALCULATION (Standard 50kg bag = 0.0347 m³)</span>
              <div className="py-2 bg-slate-900 border border-slate-850 rounded-lg text-center text-emerald-400 font-sans font-bold text-xs select-all">
                Cement Bags = Cement Volume / 0.0347
              </div>
              <p className="mt-1.5 text-slate-500 text-[9px]">Calculation:</p>
              <div className="text-slate-300 font-mono pl-1">
                <p>= {CementVolume.toFixed(3)} / 0.0347</p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg mt-1 text-emerald-420">
                  = <span className="font-bold text-white tracking-wider font-mono text-xs">{Bags.toFixed(3)} Bags</span>
                  <span className="text-[9px] text-slate-400 font-sans ml-1.5">({Math.ceil(Bags)} bags rounded up)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 5 */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleStep(5)}
          className="w-full flex justify-between items-center p-3 bg-slate-900/60 hover:bg-slate-900 border-b border-slate-850 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 flex items-center justify-center bg-[#0A84FF]/10 text-[#0A84FF] rounded-md font-bold text-[10px] border border-[#0A84FF]/20">05</span>
            <span className="font-bold text-slate-200">Step 5 – Sand Calculation</span>
          </div>
          {expanded[5] ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-450" />}
        </button>

        {expanded[5] && (
          <div className="p-4 space-y-4 leading-relaxed">
            <div>
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-1">1. VOLUME CALCULATION</span>
              <div className="py-2 bg-slate-900/80 border border-slate-850 rounded-lg text-center text-emerald-400 font-sans font-bold text-xs select-all">
                Sand Volume = Dry Volume × (Sand Part / Total Parts)
              </div>
              <p className="mt-1.5 text-slate-500 text-[9px]">Calculation:</p>
              <div className="text-slate-300 font-mono pl-1">
                <p>Sand Volume = {DryVolume.toFixed(3)} × ({SandPart} / {TotalParts.toFixed(3)})</p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg mt-1 text-emerald-420 inline-block">
                  = <span className="font-extrabold text-white tracking-wider text-xs">{SandVolume.toFixed(3)} m³</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-3">
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-1">2. MASS WEIGHT CALCULATION (Density = 1600 kg/m³)</span>
              <div className="py-2 bg-slate-900/80 border border-slate-850 rounded-lg text-center text-emerald-400 font-sans font-bold text-xs select-all">
                Sand Weight (Tons) = Sand Volume × 1600 / 1000
              </div>
              <p className="mt-1.5 text-slate-500 text-[9px]">Calculation:</p>
              <div className="text-slate-300 font-mono pl-1">
                <p>Sand Weight = {SandVolume.toFixed(3)} × 1.6</p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg mt-1 text-emerald-420 inline-block">
                  = <span className="font-extrabold text-white text-xs">{SandWeight.toFixed(3)} Tons</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 6 */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => toggleStep(6)}
          className="w-full flex justify-between items-center p-3 bg-slate-900/60 hover:bg-slate-900 border-b border-slate-850 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 flex items-center justify-center bg-[#0A84FF]/10 text-[#0A84FF] rounded-md font-bold text-[10px] border border-[#0A84FF]/20">06</span>
            <span className="font-bold text-slate-200">Step 6 – Aggregate Calculation</span>
          </div>
          {expanded[6] ? <ChevronUp className="w-4 h-4 text-slate-450" /> : <ChevronDown className="w-4 h-4 text-slate-450" />}
        </button>

        {expanded[6] && (
          <div className="p-4 space-y-4 leading-relaxed">
            <div>
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-1">1. VOLUME CALCULATION</span>
              <div className="py-2 bg-slate-900/80 border border-slate-850 rounded-lg text-center text-emerald-400 font-sans font-bold text-xs select-all">
                Aggregate Volume = Dry Volume × (Aggregate Part / Total Parts)
              </div>
              <p className="mt-1.5 text-slate-500 text-[9px]">Calculation:</p>
              <div className="text-slate-300 font-mono pl-1">
                <p>Aggregate Volume = {DryVolume.toFixed(3)} × ({AggregatePart} / {TotalParts.toFixed(3)})</p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg mt-1 text-emerald-420 inline-block">
                  = <span className="font-extrabold text-white tracking-wider text-xs">{AggregateVolume.toFixed(3)} m³</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-3">
              <span className="text-slate-500 text-[9px] uppercase font-bold block mb-1">2. MASS WEIGHT CALCULATION (Density = 1550 kg/m³)</span>
              <div className="py-2 bg-slate-900/80 border border-slate-850 rounded-lg text-center text-emerald-400 font-sans font-bold text-xs select-all">
                Aggregate Weight (Tons) = Aggregate Volume × 1550 / 1000
              </div>
              <p className="mt-1.5 text-slate-500 text-[9px]">Calculation:</p>
              <div className="text-slate-300 font-mono pl-1">
                <p>Aggregate Weight = {AggregateVolume.toFixed(3)} × 1.55</p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg mt-1 text-emerald-420 inline-block">
                  = <span className="font-extrabold text-white text-xs">{AggregateWeight.toFixed(3)} Tons</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUMMARY CARD */}
      <div className="bg-[#101931] border-2 border-emerald-500/40 rounded-2xl p-5 space-y-4 text-left shadow-2xl relative overflow-hidden">
        {/* Subtle accent light */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
          <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Check className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-xs font-bold text-white tracking-tight uppercase">Concrete Engineering Summary</h3>
            <p className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">Verified Material Requirements</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850/60 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">✓ Wet Volume</span>
              <span className="text-sm font-black text-white font-mono">{WetVolume.toFixed(3)} m³</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850/60 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">✓ Dry Volume (Raw Materials)</span>
              <span className="text-sm font-black text-white font-mono">{DryVolume.toFixed(3)} m³</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850/60 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">✓ Cement Volume</span>
              <span className="text-sm font-black text-[#0A84FF] font-mono">{CementVolume.toFixed(3)} m³</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850/60 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">✓ Cement Weight</span>
              <span className="text-sm font-black text-white font-mono">{CementWeight.toFixed(3)} kg</span>
            </div>
          </div>

          <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/20 sm:col-span-2 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[9px] text-emerald-420 block uppercase font-semibold">✓ Cement Bags</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{Math.ceil(Bags)} Bags</span>
              <span className="text-[8px] text-slate-400 block font-mono">({Bags.toFixed(3)} exact 50kg bags)</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850/60 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">✓ Sand Mass Weight</span>
              <span className="text-sm font-black text-white font-mono">{SandWeight.toFixed(3)} Tons</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850/60 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">✓ Aggregate Mass Weight</span>
              <span className="text-sm font-black text-white font-mono">{AggregateWeight.toFixed(3)} Tons</span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850/60 flex items-center justify-between sm:col-span-2">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold">✓ Water Requirement (w/c: {wcRatio.toFixed(2)})</span>
              <span className="text-sm font-black text-blue-400 font-mono">{WaterLiters.toFixed(1)} Liters <span className="text-xs text-slate-400 font-sans">({WaterGallons.toFixed(1)} Gallons)</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CalculatorWorkspaceProps {
  calculatorId: string;
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  onSaveCalculation: (calc: SavedCalculation) => void;
  savedCalculations: SavedCalculation[];
  loadedCalculation?: SavedCalculation | null;
  currency?: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export default function CalculatorWorkspace({ 
  calculatorId, 
  unitSystem, 
  setUnitSystem,
  onSaveCalculation,
  savedCalculations,
  loadedCalculation = null,
  currency = 'USD',
  isSidebarCollapsed = false,
  onToggleSidebar = () => {}
}: CalculatorWorkspaceProps) {
  const calcDef = CALCULATORS_LIST.find(c => c.id === calculatorId);
  const formulaRef = FORMULA_REFERENCES[calculatorId];
  const currencySymbol = CURRENCY_MAPPING[currency]?.symbol || '$';

  // Sharing State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Layout Controls
  const [isVisualPreviewHidden, setIsVisualPreviewHidden] = useState<boolean>(false);
  const [surveyViewMode, setSurveyViewMode] = useState<'table' | 'cards'>('table');
  const [isPrintPreviewMode, setIsPrintPreviewMode] = useState<boolean>(false);

  useEffect(() => {
    if (isPrintPreviewMode) {
      document.documentElement.classList.add('print-preview-active');
    } else {
      document.documentElement.classList.remove('print-preview-active');
    }
    return () => {
      document.documentElement.classList.remove('print-preview-active');
    };
  }, [isPrintPreviewMode]);

  // Global inputs state
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [outputs, setOutputs] = useState<Record<string, any>>({});
  const [paramUnits, setParamUnits] = useState<Record<string, string>>({});
  
  // Custom material output unit selections
  const [cementOutputUnit, setCementOutputUnit] = useState<string>('Bags');
  const [sandOutputUnit, setSandOutputUnit] = useState<string>('m³');
  const [aggregateOutputUnit, setAggregateOutputUnit] = useState<string>('m³');
  const [waterOutputUnit, setWaterOutputUnit] = useState<string>('Liters');
  
  // Custom states for specific tools (e.g., coordinates for survey plat area)
  const [coords, setCoords] = useState<{ x: number; y: number }[]>([
    { x: 0, y: 0 },
    { x: 0, y: 15 },
    { x: 20, y: 15 },
    { x: 20, y: 0 }
  ]);

  // Height of Instrument Leveling book survey rows state
  const [startingRL, setStartingRL] = useState<number>(520.455);
  const [surveyRows, setSurveyRows] = useState<{
    station: string;
    distance: number;
    bs: number | null;
    is: number | null;
    fs: number | null;
    remarks: string;
  }[]>([
    { station: 'A', distance: 0, bs: 0.585, is: null, fs: null, remarks: 'Mark' },
    { station: '', distance: 30, bs: null, is: 0.936, fs: null, remarks: '' },
    { station: '', distance: 60, bs: null, is: 1.953, fs: null, remarks: '' },
    { station: '', distance: 90, bs: null, is: 2.846, fs: null, remarks: '' },
    { station: '', distance: 120, bs: null, is: 3.644, fs: null, remarks: '' },
    { station: '', distance: 150, bs: 0.962, is: null, fs: 3.938, remarks: 'CP1' },
    { station: '', distance: 180, bs: null, is: 1.035, fs: null, remarks: '' },
    { station: '', distance: 210, bs: null, is: 1.689, fs: null, remarks: '' },
    { station: '', distance: 240, bs: null, is: 2.534, fs: null, remarks: '' },
    { station: '', distance: 270, bs: 0.956, is: null, fs: 3.844, remarks: 'CP2' },
    { station: '', distance: 300, bs: null, is: 1.589, fs: null, remarks: '' },
    { station: 'B', distance: 330, bs: null, is: null, fs: 3.016, remarks: '' },
  ]);

  const handleAddSurveyRow = () => {
    setSurveyRows(prev => {
      const lastRow = prev[prev.length - 1];
      const nextDistance = lastRow ? lastRow.distance + 30 : 30;
      return [
        ...prev,
        { station: '', distance: nextDistance, bs: null, is: null, fs: null, remarks: '' }
      ];
    });
  };

  const handleRemoveSurveyRow = (index: number) => {
    if (surveyRows.length <= 1) return;
    setSurveyRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSurveyRow = (index: number, key: string, val: any) => {
    setSurveyRows(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [key]: val === '' ? null : val
      };
      return copy;
    });
  };

  // Length unit conversions
  const convertToPivot = (value: number, unit: string): number => {
    switch (unit) {
      case 'm': return value;
      case 'cm': return value / 100;
      case 'mm': return value / 1000;
      case 'ft': return value * 0.3048;
      case 'in': return value * 0.0254;
      default: return value;
    }
  };

  const convertFromPivot = (value: number, targetUnit: string): number => {
    switch (targetUnit) {
      case 'm': return value;
      case 'cm': return value * 100;
      case 'mm': return value * 1000;
      case 'ft': return value / 0.3048;
      case 'in': return value / 0.0254;
      default: return value;
    }
  };

  const convertBetweenUnits = (value: number, fromUnit: string, toUnit: string): number => {
    const inMeters = convertToPivot(value, fromUnit);
    return convertFromPivot(inMeters, toUnit);
  };

  const getDefaultMetricUnit = (field: string): string => {
    if (field === 'thickness' || field === 'depth' || field === 'width' || field === 'barDiameter') {
      if (calculatorId === 'concrete-volume' && field === 'width') return 'm';
      return 'mm';
    }
    return 'm';
  };

  const getDefaultImperialUnit = (field: string): string => {
    if (field === 'thickness' || field === 'depth' || field === 'width' || field === 'barDiameter') {
      if (calculatorId === 'concrete-volume' && field === 'width') return 'ft';
      return 'in';
    }
    return 'ft';
  };

  const getNormalizedValue = (field: string, expectedUnit: string): number => {
    const currentVal = Number(inputs[field]) || 0;
    const currentUnit = paramUnits[field] || (unitSystem === 'metric' ? getDefaultMetricUnit(field) : getDefaultImperialUnit(field));
    return convertBetweenUnits(currentVal, currentUnit, expectedUnit);
  };

  const getMaterialValueAndUnit = (type: 'cement' | 'sand' | 'aggregate' | 'water', unit: string) => {
    // 1. Compute physical volume in m³ first
    const L_m = getNormalizedValue('length', 'm');
    const W_m = getNormalizedValue('width', 'm');
    const T_m = getNormalizedValue('thickness', 'm');
    const WetVolume = L_m * W_m * T_m;
    
    const shrinkageInputType = inputs.shrinkageInputType || 'percentage';
    const Factor = shrinkageInputType === 'multiplier'
      ? (inputs.shrinkageMultiplier !== undefined ? Number(inputs.shrinkageMultiplier) : 1.54)
      : (1 + (inputs.shrinkagePercent !== undefined ? Number(inputs.shrinkagePercent) : 54) / 100);
    const DryVolume = WetVolume * Factor;
    
    const mix = inputs.mixType || 'M20';
    let CementPart = 1, SandPart = 1.5, AggregatePart = 3;
    if (mix === 'M5') { CementPart = 1; SandPart = 5; AggregatePart = 10; }
    else if (mix === 'M7.5') { CementPart = 1; SandPart = 4; AggregatePart = 8; }
    else if (mix === 'M10') { CementPart = 1; SandPart = 3; AggregatePart = 6; }
    else if (mix === 'M15') { CementPart = 1; SandPart = 2; AggregatePart = 4; }
    else if (mix === 'M25') { CementPart = 1; SandPart = 1; AggregatePart = 2; }
    else if (mix === 'custom') {
      CementPart = typeof inputs.cementRatio !== 'undefined' && inputs.cementRatio !== '' && !isNaN(Number(inputs.cementRatio)) && Number(inputs.cementRatio) > 0 ? Number(inputs.cementRatio) : 1;
      SandPart = typeof inputs.sandRatio !== 'undefined' && inputs.sandRatio !== '' && !isNaN(Number(inputs.sandRatio)) && Number(inputs.sandRatio) >= 0 ? Number(inputs.sandRatio) : 1.5;
      AggregatePart = typeof inputs.aggregateRatio !== 'undefined' && inputs.aggregateRatio !== '' && !isNaN(Number(inputs.aggregateRatio)) && Number(inputs.aggregateRatio) >= 0 ? Number(inputs.aggregateRatio) : 3;
    }
    const TotalParts = CementPart + SandPart + AggregatePart;
    const TotalPartsSafe = TotalParts > 0 ? TotalParts : 5.5;
    
    let volM3 = 0;
    let density = 0; // kg/m³
    
    if (type === 'cement') {
      volM3 = DryVolume * (CementPart / TotalPartsSafe);
      density = 1440;
    } else if (type === 'sand') {
      volM3 = DryVolume * (SandPart / TotalPartsSafe);
      density = 1600;
    } else if (type === 'aggregate') {
      volM3 = DryVolume * (AggregatePart / TotalPartsSafe);
      density = 1550;
    } else if (type === 'water') {
      const cementVol = DryVolume * (CementPart / TotalPartsSafe);
      const cementKg = cementVol * 1440;
      const wc = typeof inputs.waterCementRatio !== 'undefined' && !isNaN(Number(inputs.waterCementRatio)) && Number(inputs.waterCementRatio) > 0
        ? Number(inputs.waterCementRatio)
        : (mix === 'M5' ? 0.60 : mix === 'M7.5' || mix === 'M10' ? 0.55 : mix === 'M25' ? 0.45 : 0.50);
      const waterLiters = cementKg * wc;
      if (unit === 'Liters') return { value: Math.round(waterLiters), label: 'Liters' };
      if (unit === 'Gallons') return { value: parseFloat((waterLiters * 0.264172).toFixed(1)), label: 'Gallons' };
      if (unit === 'm³') return { value: parseFloat((waterLiters / 1000).toFixed(3)), label: 'm³' };
      if (unit === 'kg') return { value: Math.round(waterLiters), label: 'kg' };
      if (unit === 'lbs') return { value: Math.round(waterLiters * 2.20462), label: 'lbs' };
      return { value: Math.round(waterLiters), label: unit };
    }
    
    // 2. Perform Conversion
    if (unit === 'm³') {
      return { value: parseFloat(volM3.toFixed(3)), label: 'm³' };
    }
    if (unit === 'ft³') {
      return { value: parseFloat((volM3 * 35.3146667).toFixed(2)), label: 'ft³' };
    }
    if (unit === 'yd³') {
      return { value: parseFloat((volM3 * 1.30795062).toFixed(3)), label: 'yd³' };
    }
    if (unit === 'kg') {
      return { value: Math.ceil(volM3 * density), label: 'kg' };
    }
    if (unit === 'lbs') {
      return { value: Math.ceil(volM3 * density * 2.20462262), label: 'lbs' };
    }
    if (unit === 'Tons') {
      const metricTons = (volM3 * density) / 1000;
      const displayValue = unitSystem === 'metric' ? metricTons : metricTons * 1.10231131;
      return { value: parseFloat(displayValue.toFixed(3)), label: unitSystem === 'metric' ? 'Metric Tons' : 'Short Tons' };
    }
    if (unit === 'Bags') {
      const bagVol = unitSystem === 'metric' ? 0.0347 : 0.0296;
      return { value: Math.ceil(volM3 / bagVol), label: unitSystem === 'metric' ? 'Bags (50kg)' : 'Bags (94lb)' };
    }
    
    return { value: 0, label: unit };
  };

  const handleUnitChange = (field: string, newUnit: string) => {
    const oldUnit = paramUnits[field] || (unitSystem === 'metric' ? getDefaultMetricUnit(field) : getDefaultImperialUnit(field));
    if (oldUnit === newUnit) return;
    
    setInputHistory(prev => [...prev, { ...inputs }]);
    const currentValue = Number(inputs[field]) || 0;
    const convertedVal = parseFloat(convertBetweenUnits(currentValue, oldUnit, newUnit).toFixed(4));
    
    setParamUnits(prev => ({ ...prev, [field]: newUnit }));
    setInputs(prev => ({ ...prev, [field]: convertedVal }));
  };

  // Unit Converter specific state
  const [convCategory, setConvCategory] = useState<string>('length');
  const [convValue, setConvValue] = useState<number>(10);
  const [convFrom, setConvFrom] = useState<string>('m');
  const [convTo, setConvTo] = useState<string>('ft');

  // Active view tab: 'calculator', 'formula', 'history'
  const [activeTab, setActiveTab] = useState<'calculator' | 'formula' | 'docs'>('calculator');
  const [isFormulasExpanded, setIsFormulasExpanded] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // AI Assistant trigger state
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string>('');
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [showAiConsole, setShowAiConsole] = useState<boolean>(false);

  // History / Undo queue state (simple undo for user edits)
  const [inputHistory, setInputHistory] = useState<Record<string, any>[]>([]);
  const [beamStationX, setBeamStationX] = useState<number | null>(null);

  const getBeamValuesAtX = (x: number) => {
    const span = Number(inputs.span) || 6;
    const load = Number(inputs.load) || 12;
    const loadType = inputs.loadType || 'udl';
    const matIdx = Number(inputs.materialIdx) || 0;
    const isM = unitSystem === 'metric';

    const eValue = isM 
      ? METRIC_MATERIALS[matIdx]?.eValue || 200e9 
      : IMPERIAL_MATERIALS[matIdx]?.eValue || 29e6;
    const inertia = Number(inputs.inertia) || 12000;

    let sf = 0;
    let bm = 0;
    let def = 0;

    if (loadType === 'udl') {
      sf = load * (span / 2 - x);
      bm = (load * x * (span - x)) / 2;

      if (isM) {
        const w = load * 1000;
        const I = inertia * 1e-8;
        const E = eValue;
        def = (w * x * (Math.pow(span, 3) - 2 * span * Math.pow(x, 2) + Math.pow(x, 3))) / (24 * E * I);
        def = def * 1000;
      } else {
        const w_in = (load * 1000) / 12;
        const L_in = span * 12;
        const x_in = x * 12;
        const I = inertia;
        const E = eValue;
        def = (w_in * x_in * (Math.pow(L_in, 3) - 2 * L_in * Math.pow(x_in, 2) + Math.pow(x_in, 3))) / (24 * E * I);
      }
    } else {
      if (x < span / 2) {
        sf = load / 2;
        bm = (load * x) / 2;
      } else if (Math.abs(x - span / 2) < 0.00001) {
        sf = 0;
        bm = (load * span) / 4;
      } else {
        sf = -load / 2;
        bm = (load * (span - x)) / 2;
      }

      if (isM) {
        const P = load * 1000;
        const I = inertia * 1e-8;
        const E = eValue;
        if (x <= span / 2) {
          def = (P * x * (3 * Math.pow(span, 2) - 4 * Math.pow(x, 2))) / (48 * E * I);
        } else {
          const z = span - x;
          def = (P * z * (3 * Math.pow(span, 2) - 4 * Math.pow(z, 2))) / (48 * E * I);
        }
        def = def * 1000;
      } else {
        const P = load * 1000;
        const L_in = span * 12;
        const x_in = x * 12;
        const I = inertia;
        const E = eValue;
        if (x <= span / 2) {
          def = (P * x_in * (3 * Math.pow(L_in, 2) - 4 * Math.pow(x_in, 2))) / (48 * E * I);
        } else {
          const z_in = (span - x) * 12;
          def = (P * z_in * (3 * Math.pow(L_in, 2) - 4 * Math.pow(z_in, 2))) / (48 * E * I);
        }
      }
    }

    return {
      sf: parseFloat(sf.toFixed(2)),
      bm: parseFloat(bm.toFixed(2)),
      def: parseFloat(Math.max(0, def).toFixed(3))
    };
  };

  // Initialize inputs based on active calculator and unitSystem
  useEffect(() => {
    resetToDefaults();
    setBeamStationX(null);
    setAiResult(null);
    setShowAiConsole(false);
    setCustomQuestion('');
    setActiveTab('calculator');
  }, [calculatorId, unitSystem]);

  useEffect(() => {
    if (!loadedCalculation || loadedCalculation.calculatorId !== calculatorId) return;
    setInputs(loadedCalculation.inputs || {});
    setOutputs(loadedCalculation.outputs || {});
    setSavedSuccess(false);
  }, [loadedCalculation, calculatorId]);

  const resetToDefaults = () => {
    let defs: Record<string, any> = {};
    if (calculatorId === 'concrete-volume') {
      defs = {
        length: 5.0,
        width: 4.0,
        thickness: unitSystem === 'metric' ? 0.15 : 6,
        wastePercent: 0,
        shrinkagePercent: 54,
        shrinkageMultiplier: 1.54,
        shrinkageInputType: 'percentage',
        unitCost: unitSystem === 'metric' ? 120 : 90,
        mixType: 'M20',
        cementRatio: 1,
        sandRatio: 1.5,
        aggregateRatio: 3,
        waterCementRatio: 0.50,
        customMixString: '1:1.5:3'
      };
    } else if (calculatorId === 'structural-beam' || calculatorId === 'structural-deflection') {
      defs = {
        span: 6,
        load: unitSystem === 'metric' ? 12 : 1.5, // 12 kN/m or 1.5 klf
        loadType: 'udl',
        materialIdx: 0, // Steel A36
        inertia: unitSystem === 'metric' ? 12000 : 350, // cm^4 or in^4
      };
    } else if (calculatorId === 'structural-column') {
      defs = {
        width: unitSystem === 'metric' ? 400 : 16, // mm or inches
        depth: unitSystem === 'metric' ? 400 : 16,
        fc: unitSystem === 'metric' ? 30 : 4000,   // MPa or psi
        fy: unitSystem === 'metric' ? 420 : 60000,
        barCount: 6,
        barDiameter: unitSystem === 'metric' ? 20 : 0.75, // mm or inches
      };
    } else if (calculatorId === 'structural-slab') {
      defs = {
        span: 4.5,
        supportType: 'simple',
        fy: unitSystem === 'metric' ? 420 : 60000
      };
    } else if (calculatorId === 'geotech-bearing') {
      defs = {
        bg: 1.8,
        lg: 1.8,
        df: 1.2,
        cohesion: unitSystem === 'metric' ? 15 : 300, // kPa or psf
        phi: 28,
        unitWeight: unitSystem === 'metric' ? 18 : 115, // kN/m3 or pcf
        safetyFactor: 3.0
      };
    } else if (calculatorId === 'geotech-retaining') {
      defs = {
        height: 4.0,
        frictionAngle: 30,
        unitWeight: unitSystem === 'metric' ? 18 : 115,
        backfillSlope: 0
      };
    } else if (calculatorId === 'survey-hi') {
      const distStep = unitSystem === 'metric' ? 30 : 100;
      setStartingRL(unitSystem === 'metric' ? 100.0 : 328.084);
      setSurveyRows([
        { station: 'BM', distance: 0, bs: unitSystem === 'metric' ? 1.500 : 4.50, is: null, fs: null, remarks: 'Benchmark' },
        { station: 'TP1', distance: distStep, bs: null, is: unitSystem === 'metric' ? 1.220 : 3.65, fs: null, remarks: '' },
        { station: 'A', distance: distStep * 2, bs: null, is: null, fs: unitSystem === 'metric' ? 2.050 : 6.10, remarks: 'Foresight' },
      ]);
      defs = {};
    } else if (calculatorId === 'survey-coordinate') {
      defs = {
        startNorthing: unitSystem === 'metric' ? 5000 : 15000,
        startEasting: unitSystem === 'metric' ? 10000 : 30000,
        startElevation: unitSystem === 'metric' ? 100 : 300,
        distance: unitSystem === 'metric' ? 120 : 400,
        bearingDeg: 45,
        verticalAngle: 2.5
      };
    } else if (calculatorId === 'steel-calculator') {
      defs = {
        steelShape: 'plate',
        length: unitSystem === 'metric' ? 6 : 20,
        width: unitSystem === 'metric' ? 0.3 : 12,
        thickness: unitSystem === 'metric' ? 10 : 0.5,
        depth: unitSystem === 'metric' ? 200 : 8,
        quantity: 10
      };
    } else if (calculatorId === 'rebar-calculator') {
      defs = {
        elementLength: unitSystem === 'metric' ? 8 : 25,
        elementWidth: unitSystem === 'metric' ? 4 : 12,
        barSize: unitSystem === 'metric' ? 12 : 4,
        spacing: unitSystem === 'metric' ? 200 : 8,
        lapSplice: 40,
        concreteCover: unitSystem === 'metric' ? 50 : 2
      };
    } else if (calculatorId === 'brick-calculator') {
      defs = {
        wallLength: unitSystem === 'metric' ? 5 : 16,
        wallHeight: unitSystem === 'metric' ? 3 : 10,
        wallThickness: unitSystem === 'metric' ? 110 : 4,
        brickLength: unitSystem === 'metric' ? 230 : 9,
        brickWidth: unitSystem === 'metric' ? 110 : 4,
        brickHeight: unitSystem === 'metric' ? 76 : 3,
        mortarJoint: unitSystem === 'metric' ? 10 : 0.375,
        mixRatio: '1:4',
        wastePercent: 10,
        bondType: 'stretcher',
        openings: [],
        brickPrice: 0.6,
        cementPrice: 8.5,
        sandPrice: 35.0,
        labourCost: 20.0,
        transportCost: 45.0
      };
    } else if (calculatorId === 'utility-convert') {
      setConvCategory('length');
      setConvValue(10);
      setConvFrom(UNIT_CONVERSIONS.length.units[0].symbol);
      setConvTo(UNIT_CONVERSIONS.length.units[2].symbol);
    }

    const defaultUnits: Record<string, string> = {
      length: unitSystem === 'metric' ? 'm' : 'ft',
      width: (calculatorId === 'structural-column') 
        ? (unitSystem === 'metric' ? 'mm' : 'in')
        : (unitSystem === 'metric' ? 'm' : 'ft'),
      thickness: calculatorId === 'concrete-volume'
        ? (unitSystem === 'metric' ? 'm' : 'ft')
        : (unitSystem === 'metric' ? 'mm' : 'in'),
      span: unitSystem === 'metric' ? 'm' : 'ft',
      depth: unitSystem === 'metric' ? 'mm' : 'in',
      barDiameter: unitSystem === 'metric' ? 'mm' : 'in',
      bg: unitSystem === 'metric' ? 'm' : 'ft',
      lg: unitSystem === 'metric' ? 'm' : 'ft',
      df: unitSystem === 'metric' ? 'm' : 'ft',
      height: unitSystem === 'metric' ? 'm' : 'ft',
      run: unitSystem === 'metric' ? 'm' : 'ft',
      rise: unitSystem === 'metric' ? 'm' : 'ft',
    };

    // Check if inputs are provided via shareable URL parameters
    const urlData = parseCalculationFromUrl();
    if (urlData && urlData.inputs && Object.keys(urlData.inputs).length > 0) {
      defs = { ...defs, ...urlData.inputs };
      if (urlData.unitSystem && urlData.unitSystem !== unitSystem) {
        setUnitSystem(urlData.unitSystem);
      }
    }

    setParamUnits(defaultUnits);
    setInputs(defs);
    setInputHistory([]);
  };

  // Deep helper to sanitize and remove NaN or Infinite numbers from calculation outputs
  const sanitizeNaN = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'number') {
      return isNaN(obj) || !isFinite(obj) ? 0 : obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeNaN);
    }
    if (typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = sanitizeNaN(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Perform calculations in real-time when inputs change
  useEffect(() => {
    let results: Record<string, any> = {};

    try {
      if (calculatorId === 'concrete-volume') {
        const inputType = inputs.shrinkageInputType || 'percentage';
        const finalShrinkagePercent = inputType === 'multiplier' 
          ? ((inputs.shrinkageMultiplier !== undefined ? Number(inputs.shrinkageMultiplier) : 1.54) - 1) * 100 
          : (inputs.shrinkagePercent !== undefined ? Number(inputs.shrinkagePercent) : 54);

        const mix = inputs.mixType || 'M20';
        let cementVal = 1;
        let sandVal = 1.5;
        let aggVal = 3;
        let wcVal = 0.50;

        if (mix === 'M5') {
          cementVal = 1; sandVal = 5; aggVal = 10; wcVal = 0.60;
        } else if (mix === 'M7.5') {
          cementVal = 1; sandVal = 4; aggVal = 8; wcVal = 0.55;
        } else if (mix === 'M10') {
          cementVal = 1; sandVal = 3; aggVal = 6; wcVal = 0.55;
        } else if (mix === 'M15') {
          cementVal = 1; sandVal = 2; aggVal = 4; wcVal = 0.50;
        } else if (mix === 'M20') {
          cementVal = 1; sandVal = 1.5; aggVal = 3; wcVal = 0.50;
        } else if (mix === 'M25') {
          cementVal = 1; sandVal = 1; aggVal = 2; wcVal = 0.45;
        } else if (mix === 'custom') {
          cementVal = typeof inputs.cementRatio !== 'undefined' && inputs.cementRatio !== '' && !isNaN(Number(inputs.cementRatio)) && Number(inputs.cementRatio) > 0 ? Number(inputs.cementRatio) : 1;
          sandVal = typeof inputs.sandRatio !== 'undefined' && inputs.sandRatio !== '' && !isNaN(Number(inputs.sandRatio)) && Number(inputs.sandRatio) >= 0 ? Number(inputs.sandRatio) : 1.5;
          aggVal = typeof inputs.aggregateRatio !== 'undefined' && inputs.aggregateRatio !== '' && !isNaN(Number(inputs.aggregateRatio)) && Number(inputs.aggregateRatio) >= 0 ? Number(inputs.aggregateRatio) : 3;
          wcVal = typeof inputs.waterCementRatio !== 'undefined' && !isNaN(Number(inputs.waterCementRatio)) && Number(inputs.waterCementRatio) > 0 ? Number(inputs.waterCementRatio) : 0.50;
        }

        results = calculateConcreteVolume({
          length: getNormalizedValue('length', unitSystem === 'metric' ? 'm' : 'ft'),
          width: getNormalizedValue('width', unitSystem === 'metric' ? 'm' : 'ft'),
          thickness: getNormalizedValue('thickness', unitSystem === 'metric' ? 'm' : 'in'),
          wastePercent: Number(inputs.wastePercent) || 0,
          shrinkagePercent: finalShrinkagePercent,
          unitCost: Number(inputs.unitCost) || 0,
          cementRatio: cementVal,
          sandRatio: sandVal,
          aggregateRatio: aggVal,
          waterCementRatio: wcVal
        }, unitSystem);
      } else if (calculatorId === 'structural-beam' || calculatorId === 'structural-deflection') {
        const matIdx = Number(inputs.materialIdx) || 0;
        const ePreset = unitSystem === 'metric' 
          ? METRIC_MATERIALS[matIdx]?.eValue || 200e9 
          : IMPERIAL_MATERIALS[matIdx]?.eValue || 29e6;

        results = calculateBeam({
          span: getNormalizedValue('span', unitSystem === 'metric' ? 'm' : 'ft'),
          load: Number(inputs.load) || 0,
          loadType: inputs.loadType || 'udl',
          eValue: ePreset,
          inertia: Number(inputs.inertia) || 1
        }, unitSystem);
      } else if (calculatorId === 'structural-column') {
        results = calculateColumn({
          width: getNormalizedValue('width', unitSystem === 'metric' ? 'mm' : 'in'),
          depth: getNormalizedValue('depth', unitSystem === 'metric' ? 'mm' : 'in'),
          fc: Number(inputs.fc) || 0,
          fy: Number(inputs.fy) || 0,
          barCount: Number(inputs.barCount) || 4,
          barDiameter: getNormalizedValue('barDiameter', unitSystem === 'metric' ? 'mm' : 'in')
        }, unitSystem);
      } else if (calculatorId === 'structural-slab') {
        results = calculateSlabThickness({
          span: getNormalizedValue('span', unitSystem === 'metric' ? 'm' : 'ft'),
          supportType: inputs.supportType || 'simple',
          fy: Number(inputs.fy) || (unitSystem === 'metric' ? 420 : 60000)
        }, unitSystem);
      } else if (calculatorId === 'geotech-bearing') {
        results = calculateBearingCapacity({
          bg: getNormalizedValue('bg', unitSystem === 'metric' ? 'm' : 'ft'),
          lg: getNormalizedValue('lg', unitSystem === 'metric' ? 'm' : 'ft'),
          df: getNormalizedValue('df', unitSystem === 'metric' ? 'm' : 'ft'),
          cohesion: Number(inputs.cohesion) || 0,
          phi: Number(inputs.phi) || 0,
          unitWeight: Number(inputs.unitWeight) || 0,
          safetyFactor: Number(inputs.safetyFactor) || 3.0
        }, unitSystem);
      } else if (calculatorId === 'geotech-retaining') {
        results = calculateRetainingWall({
          height: getNormalizedValue('height', unitSystem === 'metric' ? 'm' : 'ft'),
          frictionAngle: Number(inputs.frictionAngle) || 0,
          unitWeight: Number(inputs.unitWeight) || 0,
          backfillSlope: Number(inputs.backfillSlope) || 0
        }, unitSystem);
      } else if (calculatorId === 'survey-hi') {
        results = calculateHeightOfInstrument({
          startingRL: Number(startingRL) || 0,
          rows: surveyRows.map(row => ({
            station: row.station,
            distance: Number(row.distance) || 0,
            bs: row.bs !== null ? Number(row.bs) : null,
            is: row.is !== null ? Number(row.is) : null,
            fs: row.fs !== null ? Number(row.fs) : null,
            remarks: row.remarks
          }))
        });
      } else if (calculatorId === 'utility-convert') {
        const outVal = convertUnits(convValue, convFrom, convTo, convCategory);
        results = {
          convertedValue: outVal
        };
      } else if (calculatorId === 'survey-coordinate') {
        results = calculateTraverseCompass({
          startNorthing: Number(inputs.startNorthing) || 0,
          startEasting: Number(inputs.startEasting) || 0,
          startElevation: Number(inputs.startElevation) || 0,
          distance: Number(inputs.distance) || 0,
          bearingDeg: Number(inputs.bearingDeg) || 0,
          verticalAngle: Number(inputs.verticalAngle) || 0
        });
      } else if (calculatorId === 'steel-calculator') {
        results = calculateSteelWeight({
          steelShape: inputs.steelShape || 'plate',
          length: Number(inputs.length) || 0,
          width: Number(inputs.width) || 0,
          thickness: Number(inputs.thickness) || 0,
          depth: Number(inputs.depth) || 0,
          quantity: Number(inputs.quantity) || 1
        }, unitSystem);
      } else if (calculatorId === 'rebar-calculator') {
        results = calculateRebarQuantity({
          elementLength: Number(inputs.elementLength) || 0,
          elementWidth: Number(inputs.elementWidth) || 0,
          barSize: Number(inputs.barSize) || 0,
          spacing: Number(inputs.spacing) || 0,
          lapSplice: Number(inputs.lapSplice) || 0,
          concreteCover: Number(inputs.concreteCover) || 0
        }, unitSystem);
      } else if (calculatorId === 'brick-calculator') {
        results = calculateBrickMasonry({
          wallLength: Number(inputs.wallLength) || 0,
          wallHeight: Number(inputs.wallHeight) || 0,
          wallThickness: Number(inputs.wallThickness) || 0,
          brickLength: Number(inputs.brickLength) || 0,
          brickWidth: Number(inputs.brickWidth) || 0,
          brickHeight: Number(inputs.brickHeight) || 0,
          mortarJoint: Number(inputs.mortarJoint) || 0,
          mixRatio: inputs.mixRatio || '1:4',
          wastePercent: Number(inputs.wastePercent) || 0,
          bondType: inputs.bondType || 'stretcher',
          openings: inputs.openings || [],
          brickPrice: Number(inputs.brickPrice) || 0,
          cementPrice: Number(inputs.cementPrice) || 0,
          sandPrice: Number(inputs.sandPrice) || 0,
          labourCost: Number(inputs.labourCost) || 0,
          transportCost: Number(inputs.transportCost) || 0
        }, unitSystem);
      }
    } catch (e) {
      console.error(e);
    }

    setOutputs(sanitizeNaN(results));
  }, [calculatorId, inputs, coords, unitSystem, convCategory, convValue, convFrom, convTo, paramUnits, startingRL, surveyRows]);

  // Handle standard input change with undo log tracking
  const handleInputChange = (field: string, val: any) => {
    setInputHistory(prev => [...prev, { ...inputs }]);
    setInputs(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleMixTypeChange = (val: string) => {
    setInputHistory(prev => [...prev, { ...inputs }]);
    let cement = 1;
    let sand = 1.5;
    let aggregate = 3;
    let wc = 0.50;

    if (val === 'M5') {
      cement = 1; sand = 5; aggregate = 10; wc = 0.60;
    } else if (val === 'M7.5') {
      cement = 1; sand = 4; aggregate = 8; wc = 0.55;
    } else if (val === 'M10') {
      cement = 1; sand = 3; aggregate = 6; wc = 0.55;
    } else if (val === 'M15') {
      cement = 1; sand = 2; aggregate = 4; wc = 0.50;
    } else if (val === 'M20') {
      cement = 1; sand = 1.5; aggregate = 3; wc = 0.50;
    } else if (val === 'M25') {
      cement = 1; sand = 1; aggregate = 2; wc = 0.45;
    } else if (val === 'custom') {
      cement = typeof inputs.cementRatio !== 'undefined' && inputs.cementRatio !== '' && !isNaN(Number(inputs.cementRatio)) && Number(inputs.cementRatio) > 0 ? Number(inputs.cementRatio) : 1;
      sand = typeof inputs.sandRatio !== 'undefined' && inputs.sandRatio !== '' && !isNaN(Number(inputs.sandRatio)) && Number(inputs.sandRatio) >= 0 ? Number(inputs.sandRatio) : 1.5;
      aggregate = typeof inputs.aggregateRatio !== 'undefined' && inputs.aggregateRatio !== '' && !isNaN(Number(inputs.aggregateRatio)) && Number(inputs.aggregateRatio) >= 0 ? Number(inputs.aggregateRatio) : 3;
      wc = typeof inputs.waterCementRatio !== 'undefined' && !isNaN(Number(inputs.waterCementRatio)) && Number(inputs.waterCementRatio) > 0 ? Number(inputs.waterCementRatio) : 0.50;
    }

    setInputs(prev => ({
      ...prev,
      mixType: val,
      cementRatio: cement,
      sandRatio: sand,
      aggregateRatio: aggregate,
      waterCementRatio: wc,
      customMixString: `${cement}:${sand}:${aggregate}`
    }));
  };

  const handleCustomMixStringChange = (val: string) => {
    setInputHistory(prev => [...prev, { ...inputs }]);
    const parts = val.split(':').map(p => p.trim());
    const c = parts.length > 0 && parts[0] !== '' ? parseFloat(parts[0]) : undefined;
    const s = parts.length > 1 && parts[1] !== '' ? parseFloat(parts[1]) : undefined;
    const a = parts.length > 2 && parts[2] !== '' ? parseFloat(parts[2]) : undefined;

    setInputs(prev => ({
      ...prev,
      customMixString: val,
      ...(c !== undefined && !isNaN(c) && c > 0 ? { cementRatio: c } : {}),
      ...(s !== undefined && !isNaN(s) && s >= 0 ? { sandRatio: s } : {}),
      ...(a !== undefined && !isNaN(a) && a >= 0 ? { aggregateRatio: a } : {}),
    }));
  };

  const handleUndo = () => {
    if (inputHistory.length === 0) return;
    const previous = inputHistory[inputHistory.length - 1];
    setInputs(previous);
    setInputHistory(prev => prev.slice(0, prev.length - 1));
  };

  const handleSaveWorkspace = () => {
    if (!calcDef) return;
    const newCalc: SavedCalculation = {
      id: `calc_${Date.now()}`,
      calculatorId: calculatorId,
      name: `${calcDef.name} Report`,
      timestamp: Date.now(),
      unitSystem: unitSystem,
      inputs: inputs,
      outputs: outputs
    };
    onSaveCalculation(newCalc);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Trigger Gemini engineering AI analysis agent
  const handleExplainWithAi = async (overridePrompt?: string) => {
    setIsAiLoading(true);
    setShowAiConsole(true);
    setAiResult(null);

    // Dynamic logging messages during heavy computation
    const statusSequence = [
      'Initializing CivilMath AI principal agent...',
      'Mapping material parameters and boundary constants...',
      'Solving finite serviceability deflection charts...',
      'Validating stress distributions against ACI building code sheets...',
      'Finalizing structural report summary...'
    ];

    let msgIndex = 0;
    setAiStatusMessage(statusSequence[msgIndex]);
    const timer = setInterval(() => {
      msgIndex = (msgIndex + 1) % statusSequence.length;
      setAiStatusMessage(statusSequence[msgIndex]);
    }, 1200);

    try {
      const payload = {
        calculatorId,
        calculatorName: calcDef?.name || 'Simulator',
        inputs: inputs,
        outputs,
        unitSystem,
        customQuestion: overridePrompt || customQuestion
      };

      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text && text.trim() ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      clearInterval(timer);

      if (data && data.status === 'success') {
        setAiResult(data);
      } else {
        setAiResult({
          explanation: `System alert: ${data?.error || 'The server returned an empty prompt response.'}`,
          recommendations: ['Check server connection rules', 'Declare OPENROUTER_API_KEY environment variable'],
          safetyNotes: 'Standard safety disclaimer applies.'
        });
      }
    } catch (err: any) {
      clearInterval(timer);
      setAiResult({
        explanation: `Analysis failed: Could not establish a communication path with the AI service. Details: ${err.message}`,
        recommendations: ['Verify Express middleware connectivity', 'Try refreshing the applet tab'],
        safetyNotes: 'Local calculator engine remains fully healthy and functional.'
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Helper selectors for Unit Converter symbols
  const handleConvCategoryChange = (cat: string) => {
    setConvCategory(cat);
    const unitList = UNIT_CONVERSIONS[cat].units;
    setConvFrom(unitList[0].symbol);
    setConvTo(unitList[1]?.symbol || unitList[0].symbol);
  };

  // Coordinates editor tools
  const handleAddCoord = () => {
    setCoords(prev => [...prev, { x: 10, y: 10 }]);
  };

  const handleUpdateCoord = (idx: number, field: 'x' | 'y', val: number) => {
    setCoords(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveCoord = (idx: number) => {
    if (coords.length <= 3) return; // polygon needs at least 3 vertices
    setCoords(prev => prev.filter((_, i) => i !== idx));
  };

  const getExcelInputLabel = (key: string, unit: UnitSystem) => {
    const isMetric = unit === 'metric';
    const labels: Record<string, string> = {
      length: `Slab Length (${isMetric ? 'm' : 'ft'})`,
      width: `Slab Width / Width (${isMetric ? 'm' : 'ft'})`,
      thickness: `Slab Thickness (${isMetric ? 'mm' : 'in'})`,
      wastePercent: `Wastage allowance (%)`,
      shrinkagePercent: `Shrinkage ratio / allowance (%)`,
      unitCost: `Unit cost of concrete (per ${isMetric ? 'm³' : 'yd³'})`,
      span: `Span Length (${isMetric ? 'm' : 'ft'})`,
      load: `Design Load (${isMetric ? 'kN/m' : 'klf'})`,
      loadType: `Load configuration type`,
      materialIdx: `Material preset index`,
      inertia: `Section moment of inertia (${isMetric ? 'cm⁴' : 'in⁴'})`,
      depth: `Section Depth (${isMetric ? 'mm' : 'in'})`,
      fc: `Concrete compressive durability f'c (${isMetric ? 'MPa' : 'psi'})`,
      fy: `Rebar yield stress fy (${isMetric ? 'MPa' : 'psi'})`,
      barCount: `Number of reinforcing rebar segments`,
      barDiameter: `Bar diameter size (${isMetric ? 'mm' : 'in'})`,
      supportType: `Support boundary configuration`,
      bg: `Footing structural width B (${isMetric ? 'm' : 'ft'})`,
      lg: `Footing structural length L (${isMetric ? 'm' : 'ft'})`,
      df: `Foundation burial depth Df (${isMetric ? 'm' : 'ft'})`,
      cohesion: `Cohesiveness friction state c (${isMetric ? 'kPa' : 'psf'})`,
      phi: `Angle of internal shearing resistance (°)`,
      unitWeight: `Gamma soil density weight (${isMetric ? 'kN/m³' : 'pcf'})`,
      safetyFactor: `Target structural factor of safety (FS)`,
      height: `Retaining wall vertical height (${isMetric ? 'm' : 'ft'})`,
      frictionAngle: `Backfill aggregate friction angle (°)`,
      backfillSlope: `Incline angle of backfill surcharge (°)`,
      run: `Horizontal baseline run length (${isMetric ? 'm' : 'ft'})`,
      rise: `Vertical change in rise (${isMetric ? 'm' : 'ft'})`,
      mixType: `Concrete mix grade / selection`,
      cementRatio: `Cement mix proportion ratio segment`,
      sandRatio: `Sand mix proportion ratio segment`,
      aggregateRatio: `Aggregates mix proportion ratio segment`
    };
    return labels[key] || key;
  };

  const getActiveInputKeys = (): string[] => {
    if (calculatorId === 'concrete-volume') {
      const keys = ['length', 'width', 'thickness', 'mixType'];
      if (inputs.mixType === 'custom') {
        keys.push('cementRatio', 'sandRatio', 'aggregateRatio');
      }
      if (inputs.shrinkageInputType === 'multiplier') {
        keys.push('shrinkageMultiplier');
      } else {
        keys.push('shrinkagePercent');
      }
      keys.push('wastePercent', 'unitCost');
      return keys;
    }
    if (calculatorId === 'structural-beam' || calculatorId === 'structural-deflection') {
      return ['span', 'load', 'loadType', 'materialIdx', 'inertia'];
    }
    if (calculatorId === 'structural-column') {
      return ['width', 'depth', 'fc', 'fy', 'barCount', 'barDiameter'];
    }
    if (calculatorId === 'structural-slab') {
      return ['span', 'supportType', 'fy'];
    }
    if (calculatorId === 'geotech-bearing') {
      return ['bg', 'lg', 'df', 'cohesion', 'phi', 'unitWeight', 'safetyFactor'];
    }
    if (calculatorId === 'geotech-retaining') {
      return ['height', 'frictionAngle', 'unitWeight', 'backfillSlope'];
    }
    if (calculatorId === 'survey-hi') {
      return [];
    }
    if (calculatorId === 'utility-convert') {
      return [];
    }
    return Object.keys(inputs);
  };


  const getFormattedOutputs = () => {
    const isMetric = unitSystem === 'metric';
    const list: { label: string; value: string | number; unit: string }[] = [];

    if (calculatorId === 'concrete-volume') {
      const mixRatioStr = inputs.mixType === 'custom' 
        ? `${inputs.cementRatio ?? 1}:${inputs.sandRatio ?? 1.5}:${inputs.aggregateRatio ?? 3}` 
        : `${inputs.mixType ?? 'M20'}`;
      const cementObj = getMaterialValueAndUnit('cement', cementOutputUnit);
      const sandObj = getMaterialValueAndUnit('sand', sandOutputUnit);
      const aggObj = getMaterialValueAndUnit('aggregate', aggregateOutputUnit);
      const waterObj = getMaterialValueAndUnit('water', waterOutputUnit);

      list.push({ label: 'Net Volume Required', value: outputs.volumeRaw ?? 0, unit: isMetric ? 'm³' : 'yd³' });
      list.push({ label: 'Dry Volume Required', value: outputs.volumeDry ?? 0, unit: isMetric ? 'm³' : 'yd³' });
      list.push({ label: 'Total Ordered Volume', value: outputs.volumeTotal ?? 0, unit: isMetric ? 'm³' : 'yd³' });
      list.push({ label: 'Cement Required', value: cementObj.value, unit: cementObj.label });
      list.push({ label: 'Sand Required', value: sandObj.value, unit: sandObj.label });
      list.push({ label: 'Aggregates Required', value: aggObj.value, unit: aggObj.label });
      list.push({ label: 'Water Required', value: waterObj.value, unit: waterObj.label });
      list.push({ label: 'Mix Proportion (C:S:A)', value: mixRatioStr, unit: 'Ratio' });
      list.push({ label: 'Estimated Material Cost', value: `${currencySymbol}${outputs.totalCost ?? 0}`, unit: currency });
    } else if (calculatorId === 'structural-beam' || calculatorId === 'structural-deflection') {
      list.push({ label: 'Maximum Shear Force (V_max)', value: outputs.maxShear ?? 0, unit: isMetric ? 'kN' : 'kips' });
      list.push({ label: 'Maximum Bending Moment (M_max)', value: outputs.maxMoment ?? 0, unit: isMetric ? 'kN·m' : 'kip·ft' });
      list.push({ label: 'Expected Total Deflection (Δ)', value: outputs.maxDeflection ?? 0, unit: isMetric ? 'mm' : 'in' });
      list.push({ label: 'Serviceability Limit Delta L/240', value: outputs.deflectionLimit ?? 0, unit: isMetric ? 'mm' : 'in' });
      list.push({ label: 'Safety Serviceability Check', value: outputs.isDeflectionOk ? 'PASS' : 'FAIL', unit: 'Status' });
    } else if (calculatorId === 'structural-column') {
      const steelCheck = outputs.minRebarWarning
        ? 'FAIL — below 1% min ρ'
        : outputs.maxRebarWarning
          ? 'FAIL — above 8% max ρ'
          : 'PASS — within 1–8% ρ';
      list.push({ label: 'Gross Section Area (Ag)', value: outputs.grossArea ?? 0, unit: isMetric ? 'mm²' : 'in²' });
      list.push({ label: 'Reinforcing Steel Area (As)', value: outputs.steelArea ?? 0, unit: isMetric ? 'mm²' : 'in²' });
      list.push({ label: 'Steel Reinforcement Ratio (ρ)', value: `${outputs.steelRatio ?? 0}%`, unit: 'Ratio' });
      list.push({ label: 'Nominal Axial Capacity (Pn)', value: outputs.nominalCapacityPn ?? 0, unit: isMetric ? 'kN' : 'kips' });
      list.push({ label: 'Factored Design Capacity (φPn)', value: outputs.factoredCapacityPhiPn ?? 0, unit: isMetric ? 'kN' : 'kips' });
      list.push({ label: 'ACI Area Check Status', value: steelCheck, unit: 'Status' });
    } else if (calculatorId === 'structural-slab') {
      list.push({ label: 'Minimum Flat Slab Depth', value: outputs.minThickness ?? 0, unit: isMetric ? 'mm' : 'in' });
      list.push({ label: 'Recommended Deflection Depth', value: outputs.recommendedThickness ?? 0, unit: isMetric ? 'mm' : 'in' });
      list.push({ label: 'Support Condition', value: inputs.supportType ?? 'simple', unit: 'Boundary' });
    } else if (calculatorId === 'geotech-bearing') {
      list.push({ label: 'Terzaghi Bearing Coeff Nc', value: (outputs.nc ?? 0).toFixed(2), unit: 'Factor' });
      list.push({ label: 'Terzaghi Bearing Coeff Nq', value: (outputs.nq ?? 0).toFixed(2), unit: 'Factor' });
      list.push({ label: 'Terzaghi Bearing Coeff Nγ', value: (outputs.ngg ?? 0).toFixed(2), unit: 'Factor' });
      list.push({ label: 'Ultimate Bearing Load (qu)', value: outputs.ultimateCapacity ?? 0, unit: isMetric ? 'kPa' : 'psf' });
      list.push({ label: 'Safe Allowable Bearing (q_allow)', value: outputs.allowableCapacity ?? 0, unit: isMetric ? 'kPa' : 'psf' });
    } else if (calculatorId === 'geotech-retaining') {
      list.push({ label: 'Active Earth Pressure Coeff (Ka)', value: outputs.ka ?? 0, unit: 'Coefficient' });
      list.push({ label: 'Lateral Soil Thrust (Pa)', value: outputs.lateralMoistureThrust ?? 0, unit: isMetric ? 'kN/m' : 'lbs/ft' });
      list.push({ label: 'Overturning Moment (M_over)', value: outputs.overturningMoment ?? 0, unit: isMetric ? 'kN·m/m' : 'lb-ft/ft' });
    } else if (calculatorId === 'survey-hi') {
      const u = isMetric ? 'm' : 'ft';
      list.push({ label: 'Total Backsight (Σ BS)', value: outputs.sumBS ?? 0, unit: u });
      list.push({ label: 'Total Foresight (Σ FS)', value: outputs.sumFS ?? 0, unit: u });
      list.push({ label: 'Backsight minus Foresight (Σ BS - Σ FS)', value: outputs.bsFsDifference ?? 0, unit: u });
      list.push({ label: 'First to Last RL Delta', value: outputs.firstLastRlDifference ?? 0, unit: u });
      list.push({ label: 'Arithmetic Check Passed', value: outputs.isCheckPassed ? 'YES' : 'NO', unit: 'Status' });
      list.push({ label: 'Total Survey Run Distance', value: outputs.totalDistance ?? 0, unit: u });
      list.push({ label: 'Active Instrument Setups', value: outputs.activeSetupsCount ?? 0, unit: 'count' });
    } else if (calculatorId === 'survey-coordinate') {
      const u = isMetric ? 'm' : 'ft';
      list.push({ label: 'Horizontal Distance (HD)', value: outputs.horizontalDistance ?? 0, unit: u });
      list.push({ label: 'Vertical Distance (VD)', value: outputs.verticalDistance ?? 0, unit: u });
      list.push({ label: 'Latitude Shift (Δ Northing)', value: outputs.deltaNorthing ?? 0, unit: u });
      list.push({ label: 'Departure Shift (Δ Easting)', value: outputs.deltaEasting ?? 0, unit: u });
      list.push({ label: 'Final Northing (N)', value: outputs.endNorthing ?? 0, unit: u });
      list.push({ label: 'Final Easting (E)', value: outputs.endEasting ?? 0, unit: u });
      list.push({ label: 'Final Elevation (Z)', value: outputs.endElevation ?? 0, unit: u });
    } else if (calculatorId === 'steel-calculator') {
      list.push({ label: 'Section Cross-Area', value: outputs.sectionalArea ?? 0, unit: isMetric ? 'mm²' : 'in²' });
      list.push({ label: 'Unit Volume', value: outputs.volumePerUnit ?? 0, unit: isMetric ? 'm³' : 'in³' });
      list.push({ label: 'Single Member Weight', value: outputs.weightPerUnit ?? 0, unit: isMetric ? 'kg' : 'lbs' });
      list.push({ label: 'Total Batch Weight', value: outputs.totalWeight ?? 0, unit: isMetric ? 'kg' : 'lbs' });
      list.push({ label: 'Exposed Surface Area (unit)', value: outputs.surfaceAreaPerUnit ?? 0, unit: isMetric ? 'm²' : 'ft²' });
    } else if (calculatorId === 'rebar-calculator') {
      list.push({ label: 'L-Direction Bars Count', value: outputs.barsAlongLengthCount ?? 0, unit: 'bars' });
      list.push({ label: 'W-Direction Bars Count', value: outputs.barsAlongWidthCount ?? 0, unit: 'bars' });
      list.push({ label: 'Total reinforcing bars', value: outputs.totalBarsCount ?? 0, unit: 'bars' });
      list.push({ label: 'L-Bar Cut Length (individual)', value: outputs.singleBarLenL ?? 0, unit: isMetric ? 'm' : 'ft' });
      list.push({ label: 'W-Bar Cut Length (individual)', value: outputs.singleBarLenW ?? 0, unit: isMetric ? 'm' : 'ft' });
      list.push({ label: 'Total Rebar Length', value: outputs.totalLength ?? 0, unit: isMetric ? 'm' : 'ft' });
      list.push({ label: 'Nominal Unit Weight', value: outputs.unitWeight ?? 0, unit: isMetric ? 'kg/m' : 'lbs/ft' });
      list.push({ label: 'Total Rebar Weight', value: outputs.totalWeight ?? 0, unit: isMetric ? 'kg' : 'lbs' });
    } else if (calculatorId === 'brick-calculator') {
      list.push({ label: 'Gross Wall Volume', value: outputs.wallVolumeGross ?? 0, unit: isMetric ? 'm³' : 'ft³' });
      list.push({ label: 'Net Wall Volume', value: outputs.wallVolumeNet ?? 0, unit: isMetric ? 'm³' : 'ft³' });
      list.push({ label: 'Net Wall Area', value: outputs.wallAreaNet ?? 0, unit: isMetric ? 'm²' : 'ft²' });
      list.push({ label: 'Full Bricks Placed', value: outputs.fullBricksCount ?? 0, unit: 'bricks' });
      list.push({ label: 'Half Bricks Count', value: outputs.halfBricksCount ?? 0, unit: 'half-bricks' });
      list.push({ label: 'Cut Bricks Count', value: outputs.cutBricksCount ?? 0, unit: 'cut-bricks' });
      list.push({ label: 'Total Bricks (+ waste)', value: outputs.totalBricksWithWaste ?? 0, unit: 'bricks' });
      list.push({ label: 'Mortar Volume (Wet)', value: outputs.mortarVolumeWet ?? 0, unit: isMetric ? 'm³' : 'ft³' });
      list.push({ label: 'Mortar Volume (Dry)', value: outputs.mortarVolumeDry ?? 0, unit: isMetric ? 'm³' : 'ft³' });
      list.push({ label: 'Portland Cement Bags', value: outputs.cementBagsRequired ?? 0, unit: 'bags' });
      list.push({ label: 'Masonry Sand Volume', value: outputs.sandVolumeRequired ?? 0, unit: isMetric ? 'm³' : 'ft³' });
      list.push({ label: 'Masonry Sand Weight', value: outputs.sandWeightRequired ?? 0, unit: isMetric ? 'kg' : 'lbs' });
      list.push({ label: 'Mixing Water Required', value: outputs.waterRequired ?? 0, unit: isMetric ? 'L' : 'gal' });
      list.push({ label: 'Material Cost Estimate', value: outputs.materialCost ?? 0, unit: currencySymbol });
      list.push({ label: 'Labour Cost Estimate', value: outputs.labourCost ?? 0, unit: currencySymbol });
      list.push({ label: 'Grand Total Cost', value: outputs.grandTotal ?? 0, unit: currencySymbol });
    } else if (calculatorId === 'utility-convert') {
      list.push({ label: 'Converted Output Value', value: outputs.convertedValue ?? 0, unit: convTo });
    }
    return list;
  };

  const getExcelDualUnits = (): { name: string; val: string; calculatorId: string }[] => {
    const isMetric = unitSystem === 'metric';
    const items: { name: string; val: string; calculatorId: string }[] = [];

    if (calculatorId === 'concrete-volume') {
      items.push({
        name: 'Net Volume',
        val: isMetric 
          ? `${((outputs.volumeRaw || 0) * 1.30795).toFixed(2)} yd³` 
          : `${((outputs.volumeRaw || 0) / 1.30795).toFixed(2)} m³`,
        calculatorId: 'concrete-volume'
      });
      items.push({
        name: 'Dry Volume',
        val: isMetric 
          ? `${((outputs.volumeDry || 0) * 1.30795).toFixed(2)} yd³` 
          : `${((outputs.volumeDry || 0) / 1.30795).toFixed(2)} m³`,
        calculatorId: 'concrete-volume'
      });
      items.push({
        name: 'Total Ordered',
        val: isMetric 
          ? `${((outputs.volumeTotal || 0) * 1.30795).toFixed(2)} yd³` 
          : `${((outputs.volumeTotal || 0) / 1.30795).toFixed(2)} m³`,
        calculatorId: 'concrete-volume'
      });
    } else if (calculatorId === 'structural-beam' || calculatorId === 'structural-deflection') {
      items.push({
        name: 'Span Length',
        val: isMetric 
          ? `${((inputs.span || 0) * 3.28084).toFixed(2)} ft` 
          : `${((inputs.span || 0) / 3.28084).toFixed(2)} m`,
        calculatorId
      });
      items.push({
        name: 'Max Shear V_max',
        val: isMetric 
          ? `${((outputs.maxShear || 0) * 0.224809).toFixed(2)} kips` 
          : `${((outputs.maxShear || 0) / 0.224809).toFixed(2)} kN`,
        calculatorId
      });
      items.push({
        name: 'Max Moment M_max',
        val: isMetric 
          ? `${((outputs.maxMoment || 0) * 0.73756).toFixed(2)} kip·ft` 
          : `${((outputs.maxMoment || 0) / 0.73756).toFixed(2)} kN·m`,
        calculatorId
      });
      items.push({
        name: 'Max Deflection Δ',
        val: isMetric 
          ? `${((outputs.maxDeflection || 0) / 25.4).toFixed(3)} in` 
          : `${((outputs.maxDeflection || 0) * 25.4).toFixed(1)} mm`,
        calculatorId
      });
    } else if (calculatorId === 'structural-column') {
      items.push({
        name: 'Section Size',
        val: isMetric
          ? `${((inputs.width || 0) / 25.4).toFixed(1)}×${((inputs.depth || 0) / 25.4).toFixed(1)} in`
          : `${Math.round((inputs.width || 0) * 25.4)}×${Math.round((inputs.depth || 0) * 25.4)} mm`,
        calculatorId
      });
      items.push({
        name: 'Concrete f\'c',
        val: isMetric
          ? `${Math.round((inputs.fc || 0) * 145.038)} psi`
          : `${((inputs.fc || 0) / 145.038).toFixed(1)} MPa`,
        calculatorId
      });
      items.push({
        name: 'Rebar Yield fy',
        val: isMetric
          ? `${Math.round((inputs.fy || 0) * 145.038 / 1000)} ksi`
          : `${((inputs.fy || 0) / 145.038).toFixed(1)} MPa`,
        calculatorId
      });
      items.push({
        name: 'Design Capacity φPn',
        val: isMetric
          ? `${((outputs.factoredCapacityPhiPn || 0) * 0.224809).toFixed(1)} kips`
          : `${((outputs.factoredCapacityPhiPn || 0) / 0.224809).toFixed(1)} kN`,
        calculatorId
      });
    } else if (calculatorId === 'structural-slab') {
      items.push({
        name: 'Span Length',
        val: isMetric 
          ? `${((inputs.span || 0) * 3.28084).toFixed(2)} ft` 
          : `${((inputs.span || 0) / 3.28084).toFixed(2)} m`,
        calculatorId
      });
      items.push({
        name: 'Min Thickness',
        val: isMetric
          ? `${((outputs.minThickness || 0) / 25.4).toFixed(2)} in`
          : `${((outputs.minThickness || 0) * 25.4).toFixed(1)} mm`,
        calculatorId
      });
      items.push({
        name: 'Recommended Thickness',
        val: isMetric
          ? `${((outputs.recommendedThickness || 0) / 25.4).toFixed(1)} in`
          : `${((outputs.recommendedThickness || 0) * 25.4).toFixed(1)} mm`,
        calculatorId
      });
    } else if (calculatorId === 'geotech-bearing') {
      items.push({
        name: 'Footing B×L',
        val: isMetric
          ? `${((inputs.bg || 0) * 3.28084).toFixed(1)}×${((inputs.lg || 0) * 3.28084).toFixed(1)} ft`
          : `${((inputs.bg || 0) / 3.28084).toFixed(2)}×${((inputs.lg || 0) / 3.28084).toFixed(2)} m`,
        calculatorId
      });
      items.push({
        name: 'Cohesion force c',
        val: isMetric
          ? `${((inputs.cohesion || 0) * 20.8854).toFixed(1)} psf`
          : `${((inputs.cohesion || 0) / 20.8854).toFixed(1)} kPa`,
        calculatorId
      });
      items.push({
        name: 'Allowable q_allow',
        val: isMetric
          ? `${((outputs.allowableCapacity || 0) * 20.8854).toFixed(0)} psf`
          : `${((outputs.allowableCapacity || 0) / 20.8854).toFixed(1)} kPa`,
        calculatorId
      });
    } else if (calculatorId === 'geotech-retaining') {
      items.push({
        name: 'Wall Height H',
        val: isMetric 
          ? `${((inputs.height || 0) * 3.28084).toFixed(2)} ft` 
          : `${((inputs.height || 0) / 3.28084).toFixed(2)} m`,
        calculatorId
      });
      items.push({
        name: 'Active Thrust Pa',
        val: isMetric 
          ? `${((outputs.lateralMoistureThrust || 0) * 68.5218).toFixed(1)} lbs/ft` 
          : `${((outputs.lateralMoistureThrust || 0) / 68.5218).toFixed(1)} kN/m`,
        calculatorId
      });
      items.push({
        name: 'Overturning Moment',
        val: isMetric 
          ? `${((outputs.overturningMoment || 0) * 224.809).toFixed(0)} lb-ft/ft` 
          : `${((outputs.overturningMoment || 0) / 224.809).toFixed(1)} kN·m/m`,
        calculatorId
      });
    } else if (calculatorId === 'survey-hi') {
      items.push({
        name: 'Total Backsight (Σ BS)',
        val: isMetric 
          ? `${((outputs.sumBS || 0) * 3.28084).toFixed(3)} ft` 
          : `${((outputs.sumBS || 0) / 3.28084).toFixed(3)} m`,
        calculatorId
      });
      items.push({
        name: 'Total Foresight (Σ FS)',
        val: isMetric 
          ? `${((outputs.sumFS || 0) * 3.28084).toFixed(3)} ft` 
          : `${((outputs.sumFS || 0) / 3.28084).toFixed(3)} m`,
        calculatorId
      });
      items.push({
        name: 'Elevation Closing Delta',
        val: isMetric 
          ? `${((outputs.firstLastRlDifference || 0) * 3.28084).toFixed(3)} ft` 
          : `${((outputs.firstLastRlDifference || 0) / 3.28084).toFixed(3)} m`,
        calculatorId
      });
    } else if (calculatorId === 'survey-coordinate') {
      items.push({
        name: 'Horizontal Distance',
        val: isMetric 
          ? `${((outputs.horizontalDistance || 0) * 3.28084).toFixed(2)} ft` 
          : `${((outputs.horizontalDistance || 0) / 3.28084).toFixed(2)} m`,
        calculatorId
      });
      items.push({
        name: 'Delta Elevation (VD)',
        val: isMetric 
          ? `${((outputs.verticalDistance || 0) * 3.28084).toFixed(2)} ft` 
          : `${((outputs.verticalDistance || 0) / 3.28084).toFixed(2)} m`,
        calculatorId
      });
    } else if (calculatorId === 'steel-calculator') {
      items.push({
        name: 'Total Steel Weight',
        val: isMetric 
          ? `${((outputs.totalWeight || 0) * 2.20462).toFixed(1)} lbs` 
          : `${((outputs.totalWeight || 0) / 2.20462).toFixed(1)} kg`,
        calculatorId
      });
    } else if (calculatorId === 'rebar-calculator') {
      items.push({
        name: 'Total Length',
        val: isMetric 
          ? `${((outputs.totalLength || 0) * 3.28084).toFixed(1)} ft` 
          : `${((outputs.totalLength || 0) / 3.28084).toFixed(1)} m`,
        calculatorId
      });
      items.push({
        name: 'Total Weight',
        val: isMetric 
          ? `${((outputs.totalWeight || 0) * 2.20462).toFixed(1)} lbs` 
          : `${((outputs.totalWeight || 0) / 2.20462).toFixed(1)} kg`,
        calculatorId
      });
    } else if (calculatorId === 'brick-calculator') {
      items.push({
        name: 'Net Wall Volume',
        val: isMetric 
          ? `${((outputs.wallVolumeNet || 0) * 35.3147).toFixed(1)} ft³` 
          : `${((outputs.wallVolumeNet || 0) / 35.3147).toFixed(1)} m³`,
        calculatorId
      });
    }
    return items;
  };

  const renderConcreteVolumeDerivation = () => {
    return (
      <ConcreteStepByStep 
        inputs={inputs} 
        outputs={outputs} 
        unitSystem={unitSystem} 
        getNormalizedValue={getNormalizedValue}
      />
    );
  };

  const renderBeamDerivation = () => {
    const isM = unitSystem === 'metric';
    const span = Number(inputs.span) || 1;
    const load = Number(inputs.load) || 1;
    const loadType = inputs.loadType || 'udl';
    const matIdx = Number(inputs.materialIdx) || 0;
    const matName = isM ? METRIC_MATERIALS[matIdx]?.name : IMPERIAL_MATERIALS[matIdx]?.name;
    const eValue = isM ? METRIC_MATERIALS[matIdx]?.eValue : IMPERIAL_MATERIALS[matIdx]?.eValue;
    const inertia = Number(inputs.inertia) || 1;

    return (
      <div className="space-y-4 font-mono text-xs text-slate-300">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 1: ULS Envelope - Max Bending Moment</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            {loadType === 'udl' ? 'M_max = (w · L²) / 8' : 'M_max = (P · L) / 4'}
          </div>
          <p className="text-slate-405 leading-normal">
            Current Span L = <span className="text-white font-bold">{span} {isM ? 'm' : 'ft'}</span>, load = <span className="text-white font-bold">{load} {isM ? 'kN/m' : 'kips'}</span> ({loadType === 'udl' ? 'Uniform' : 'Point Load'}).<br/>
            {loadType === 'udl' ? `(${load} × ${span}²) / 8` : `(${load} × ${span}) / 4`} = <span className="text-white font-bold">{outputs.maxMoment ?? 0} {isM ? 'kN·m' : 'kip·ft'}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 2: Vertical shear envelopes (Critical Reaction force)</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            {loadType === 'udl' ? 'V_max = (w · L) / 2' : 'V_max = P / 2'}
          </div>
          <p className="text-slate-405 leading-normal">
            Boundary Shear Reactions: {loadType === 'udl' ? `(${load} × ${span}) / 2` : `${load} / 2`} = <span className="text-white font-bold">{outputs.maxShear ?? 0} {isM ? 'kN' : 'kips'}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 3: Deflection Profile Integration</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            {loadType === 'udl' ? 'Δ_max = (5 · w · L⁴) / (384 · E · I)' : 'Δ_max = (P · L³) / (48 · E · I)'}
          </div>
          <p className="text-slate-405 leading-normal">
            Elastic Modulus (E) = <span className="text-white">{eValue?.toExponential(2)} Pa ({matName})</span><br/>
            Inertia (I) = <span className="text-white">{inertia?.toExponential(2)} {isM ? 'mm⁴' : 'in⁴'}</span><br/>
            Substituting values yields calculated deflection: <span className="text-white font-bold">{outputs.maxDeflection ?? 0} {isM ? 'mm' : 'in'}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 4: SLS Serviceability Limit validation</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            Deflection Limit = L / 240
          </div>
          <p className="text-slate-405 leading-normal">
            L/240 Limit = <span className="text-white font-bold">{outputs.deflectionLimit ?? 0} {isM ? 'mm' : 'in'}</span>.<br/>
            Safety Status Check: <span className={`font-bold ${String(outputs.deflectionCheck).toLowerCase().includes('fail') ? 'text-red-500' : 'text-emerald-400'}`}>{outputs.deflectionCheck}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderColumnDerivation = () => {
    const isM = unitSystem === 'metric';
    const width = Number(inputs.width) || 0;
    const depth = Number(inputs.depth) || 0;
    const fc = Number(inputs.fc) || 0;
    const fy = Number(inputs.fy) || 0;
    const count = Number(inputs.barCount) || 4;
    const barD = Number(inputs.barDiameter) || 0;

    return (
      <div className="space-y-4 font-mono text-xs text-slate-300">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 1: Gross Sectional Area & Steel Rebar Capacity</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            A_g = Width × Depth &nbsp;|&nbsp; A_st = Bars × (π · d_bar²) / 4
          </div>
          <p className="text-slate-405 leading-normal">
            Gross column bounds A_g = {width} × {depth} = <span className="text-white font-bold">{outputs.grossArea ?? 0} {isM ? 'mm²' : 'in²'}</span><br/>
            Longitudinal rebar area A_st = {count} × (π × {barD}²) / 4 = <span className="text-white font-bold">{outputs.steelArea ?? 0} {isM ? 'mm²' : 'in²'}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 2: ACI Concrete Ratio safety check (1% ≤ ρ ≤ 8%)</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400 font-mono">
            Steel ratio ρ = (A_st / A_g) × 100%
          </div>
          <p className="text-slate-405 leading-normal">
            ρ = ({outputs.steelArea} / {outputs.grossArea}) × 100% = <span className="text-white font-bold">{outputs.steelRatio ?? 0}%</span><br/>
            ACI Standard Status Check: <span className={`font-bold ${outputs.minRebarWarning || outputs.maxRebarWarning ? 'text-red-500' : 'text-emerald-400'}`}>
              {outputs.minRebarWarning ? 'FAIL — below 1% min ρ' : outputs.maxRebarWarning ? 'FAIL — above 8% max ρ' : 'PASS — within 1–8% ρ'}
            </span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 3: ACI nominal compressive capacity (Pn)</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400 font-mono">
            P_n = 0.85 × [ 0.85 · f'c · (Ag - Ast) + fy · Ast ]
          </div>
          <p className="text-slate-405 leading-normal">
            Concrete f'c = <span className="text-white">{fc} {isM ? 'MPa' : 'psi'}</span>, Rebar yield fy = <span className="text-white">{fy} {isM ? 'MPa' : 'psi'}</span>.<br/>
            Solving P_n gives: <span className="text-white font-bold">{outputs.nominalCapacityPn ?? 0} {isM ? 'kN' : 'kips'}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 4: Factored Capacity Margin (φPn)</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400 font-mono">
            φP_n = φ × 0.80 × P_n &nbsp;(&nbsp;φ = 0.65 tied compression reduction factor&nbsp;)
          </div>
          <p className="text-slate-405 leading-normal font-mono">
            φP_n = 0.65 × 0.80 × {outputs.nominalCapacityPn} = <span className="text-emerald-405 font-black text-sm">{outputs.factoredCapacityPhiPn ?? 0} {isM ? 'kN' : 'kips'}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderSlabDerivation = () => {
    const isM = unitSystem === 'metric';
    const span = Number(inputs.span) || 1;
    const support = inputs.supportType || 'simple';
    const fy = Number(inputs.fy) || (isM ? 420 : 60000);

    let divisor = 20;
    if (support === 'one-end-continuous') divisor = 24;
    else if (support === 'both-ends-continuous') divisor = 28;
    else if (support === 'cantilever') divisor = 10;

    return (
      <div className="space-y-4 font-mono text-xs text-slate-300">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 1: Identify Deflection constraint divisor</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400 font-mono">
            Divisor based on boundary: L / {divisor} ({support.replace('-', ' ')})
          </div>
          <p className="text-slate-405 leading-normal">
            Span range (L) = <span className="text-white font-bold">{span} {isM ? 'm' : 'ft'}</span>.
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 2: Steel Yield Multiplier Factor</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            {isM ? 'Factor = 0.4 + (fy / 700)' : 'Factor = 0.4 + (fy / 100,000)'}
          </div>
          <p className="text-slate-405 leading-normal">
            Steel grade fy = <span className="text-white font-bold">{fy} {isM ? 'MPa' : 'psi'}</span>.<br/>
            Factor multiplier = <span className="text-white font-bold">{(isM ? (0.4 + fy / 700) : (0.4 + fy / 100000)).toFixed(4)}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 3: Minimum Slab Thickness Required</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400 font-mono">
            h_min = (L / Divisor) × Factor
          </div>
          <p className="text-slate-405 leading-normal font-mono">
            Calculated minimum thickness target = <span className="text-white font-bold">{outputs.minThickness ?? 0} {isM ? 'mm' : 'in'}</span>.<br/>
            Recommended standard builder thickness: <span className="text-emerald-405 font-black text-sm">{outputs.recommendedThickness ?? 0} {isM ? 'mm' : 'in'}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderBearingCapacityDerivation = () => {
    const isM = unitSystem === 'metric';
    const bg = Number(inputs.bg) || 1;
    const lg = Number(inputs.lg) || 1;
    const df = Number(inputs.df) || 1;
    const cohesion = Number(inputs.cohesion) || 0;
    const phi = Number(inputs.phi) || 0;
    const gamma = Number(inputs.unitWeight) || 0;
    const sf = Number(inputs.safetyFactor) || 3.0;

    return (
      <div className="space-y-4 font-mono text-xs text-slate-300">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 1: Terzaghi geotechnical bearing factors</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            Internal soil shear resistance friction angle φ = {phi}°
          </div>
          <p className="text-slate-405 leading-normal">
            Soil Shear multipliers:<br/>
            Nc Cohesion Multiplier = <span className="text-white font-bold">{outputs.nc}</span><br/>
            Nq Overburden Surcharge Multiplier = <span className="text-white font-bold">{outputs.nq}</span><br/>
            Nγ Unit Weight Multiplier = <span className="text-white font-bold">{outputs.ngg}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 2: Base Level Overburden surcharge & Shape factors</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            Surcharge q = γ · Df &nbsp;|&nbsp; Shape sc = 1 + 0.3 · B/L &nbsp;,&nbsp; sγ = 1 - 0.2 · B/L
          </div>
          <p className="text-slate-405 leading-normal">
            Surcharge burden q = {gamma} × {df} = <span className="text-white font-bold">{(gamma * df).toFixed(2)} {isM ? 'kPa' : 'psf'}</span><br/>
            sc = {(1 + 0.3 * bg / lg).toFixed(3)} &nbsp;|&nbsp; sγ = {(1 - 0.2 * bg / lg).toFixed(3)}
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 3: Terzaghi ultimate soil failure stress (q_ult)</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400 font-mono">
            q_ult = c · Nc · sc + q · Nq + 0.5 · γ · B · Nγ · sγ
          </div>
          <p className="text-slate-405 leading-normal font-mono">
            Substitution:<br/>
            Cohesion Part = {cohesion} × {outputs.nc} × {(1 + 0.3 * bg / lg).toFixed(2)} = <span className="text-white">{(cohesion * (outputs.nc || 0) * (1 + 0.3 * bg / lg)).toFixed(1)}</span><br/>
            Surcharge Part = {(gamma * df).toFixed(2)} × {outputs.nq} = <span className="text-white">{(gamma * df * (outputs.nq || 0)).toFixed(1)}</span><br/>
            Density Weight Part = 0.5 × {gamma} × {bg} × {outputs.ngg} × {(1 - 0.2 * bg / lg).toFixed(2)} = <span className="text-white">{(0.5 * gamma * bg * (outputs.ngg || 0) * (1 - 0.2 * bg / lg)).toFixed(1)}</span><br/>
            q_ult = Sum of parts = <span className="text-white font-bold">{outputs.ultimateCapacity ?? 0} {isM ? 'kPa' : 'psf'}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 4: Safe ASD Bearing Load (q_allowable)</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-405">
            q_allowable = q_ult / Safety Factor
          </div>
          <p className="text-slate-405 leading-normal font-mono">
            Safety factor margin target = <span className="text-white font-bold">{sf}</span>.<br/>
            q_allowable = {outputs.ultimateCapacity} / {sf} = <span className="text-emerald-405 font-black text-sm">{outputs.allowableCapacity ?? 0} {isM ? 'kPa' : 'psf'}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderRetainingDerivation = () => {
    const isM = unitSystem === 'metric';
    const h = Number(inputs.height) || 1;
    const phi = Number(inputs.frictionAngle) || 30;
    const gamma = Number(inputs.unitWeight) || 120;

    return (
      <div className="space-y-4 font-mono text-xs text-slate-300">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 1: Rankine soil active pressure coefficient</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            Ka = tan²(45° - φ/2)
          </div>
          <p className="text-slate-405 leading-normal">
            Internal soil shear friction angle φ = <span className="text-white font-bold">{phi}°</span>.<br/>
            Rankine Ka Active friction coefficient = <span className="text-white font-bold">{outputs.ka ?? 0.333}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 2: Active lateral pushing thrust (Pa)</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            Pa = 0.5 × Ka × γ × H²
          </div>
          <p className="text-slate-405 leading-normal">
            Retaining Wall Height (H) = <span className="text-white font-bold">{h} {isM ? 'm' : 'ft'}</span>, Soil density γ = <span className="text-white">{gamma} {isM ? 'kN/m³' : 'lbs/ft³'}</span>.<br/>
            Pa = 0.5 × {outputs.ka} × {gamma} × {h}² = <span className="text-white font-bold">{outputs.lateralMoistureThrust ?? 0} {isM ? 'kN/m' : 'lbs/ft'}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 3: Centroid resultant base overturning moment</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-405 font-mono">
            M_overturning = Pa × (H / 3)
          </div>
          <p className="text-slate-405 leading-normal">
            Soil thrust peaks at H/3 centroid triangle height = <span className="text-white font-bold">{(h/3).toFixed(3)} {isM ? 'm' : 'ft'}</span>.<br/>
            Base structural overturning moment limit: <span className="text-emerald-455 font-black text-sm">{outputs.overturningMoment ?? 0} {isM ? 'kN·m/m' : 'lb-ft/ft'}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderSurveyHIDerivation = () => {
    const isM = unitSystem === 'metric';
    const u = isM ? 'm' : 'ft';

    return (
      <div className="space-y-4 font-mono text-xs text-slate-350">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Rule 1: Height of Instrument (HI) Line of Sight</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            HI = Station Elevation (RL) + Backsight Reading (BS)
          </div>
          <p className="text-slate-405 leading-normal">
            When the level instrument is set up, a backsight reading (BS) is taken on a known reference point (Benchmark RL). Adding this value establishes the level plane of sight height.
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Rule 2: Ground Reduced Levels (RL)</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            RL = HI - (Intermediate Sight or Foresight Reading)
          </div>
          <p className="text-slate-405 leading-normal">
            To find the absolute ground level at any subsequent rod station, we subtract either the Intermediate Sight (IS) or the Foresight reading (FS) from the current active HI plane.
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Rule 3: Field Book Arithmetic Check</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-450 font-mono">
            Σ BS - Σ FS = Last RL - First RL
          </div>
          <p className="text-slate-405 leading-normal text-slate-300">
            • Sum of Backsights (Σ BS) = <span className="text-white font-bold">{outputs.sumBS ?? 0} {u}</span><br />
            • Sum of Foresights (Σ FS) = <span className="text-white font-bold">{outputs.sumFS ?? 0} {u}</span><br />
            • Difference (Σ BS - Σ FS) = <span className="text-white font-bold">{outputs.bsFsDifference ?? 0} {u}</span><br />
            • Elevation Delta (Last RL - First RL) = <span className="text-white font-bold">{outputs.firstLastRlDifference ?? 0} {u}</span><br />
            • Arithmetic Check: <span className={`font-bold ${outputs.isCheckPassed ? 'text-emerald-400' : 'text-red-400'}`}>{outputs.isCheckPassed ? 'PASSED ✅' : 'FAILED - MISMATCH ❌'}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderUtilityConvertDerivation = () => {
    return (
      <div className="space-y-4 font-mono text-xs text-slate-350">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 1: Unit Scalar Converter Factor Multiplication</span>
          <p className="text-slate-405 leading-normal">
            Converting active source coordinate value: <span className="text-white font-bold">{convValue} {convFrom}</span> to unit <span className="text-white font-bold">{convTo}</span>.<br/>
            Active conversion classification: <span className="text-blue-400 uppercase font-black">{convCategory}</span>.<br/>
            Multiplication matrix outcome = <span className="text-emerald-405 text-sm font-black">{outputs.convertedValue ?? 0} {convTo}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderSurveyCoordinateDerivation = () => {
    const isM = unitSystem === 'metric';
    const u = isM ? 'm' : 'ft';
    return (
      <div className="space-y-4 font-mono text-xs text-slate-350">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 1: Coordinate Sighting Geometry</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            Horizontal Distance (HD) = S × cos(α) <br/>
            Vertical Distance (VD) = S × sin(α)
          </div>
          <p className="text-slate-300 leading-normal">
            Given measured slope distance (S) = <span className="text-white font-bold">{inputs.distance ?? 0} {u}</span> and vertical angle (α) = <span className="text-white font-bold">{inputs.verticalAngle ?? 0}°</span>:<br />
            • Computed HD = <span className="text-white font-bold">{outputs.horizontalDistance ?? 0} {u}</span><br />
            • Computed VD (Delta Z) = <span className="text-white font-bold">{outputs.verticalDistance ?? 0} {u}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 2: Traverse Departure & Latitude Shift</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            Latitude (Δ Northing) = HD × cos(θ) <br/>
            Departure (Δ Easting) = HD × sin(θ)
          </div>
          <p className="text-slate-300 leading-normal">
            Given horizontal distance (HD) = <span className="text-white font-bold">{outputs.horizontalDistance ?? 0} {u}</span> and horizontal azimuth (θ) = <span className="text-white font-bold">{inputs.bearingDeg ?? 0}°</span>:<br />
            • Δ Northing (Latitude) = <span className="text-white font-bold">{outputs.deltaNorthing ?? 0} {u}</span><br />
            • Δ Easting (Departure) = <span className="text-white font-bold">{outputs.deltaEasting ?? 0} {u}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 3: Solve Traverse Coordinates</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            N_end = N₀ + Δ Northing <br/>
            E_end = E₀ + Δ Easting <br/>
            Z_end = Z₀ + VD
          </div>
          <p className="text-slate-300 leading-normal">
            Starting Reference Position: (<span className="text-white font-bold">N: {inputs.startNorthing ?? 0}, E: {inputs.startEasting ?? 0}, Z: {inputs.startElevation ?? 0}</span>)<br />
            End Position Resolved Coordinate Set:<br />
            • Resolved Northing = <span className="text-emerald-405 font-bold text-sm">{outputs.endNorthing ?? 0}</span><br />
            • Resolved Easting = <span className="text-emerald-405 font-bold text-sm">{outputs.endEasting ?? 0}</span><br />
            • Resolved Elevation = <span className="text-emerald-405 font-bold text-sm">{outputs.endElevation ?? 0}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderSteelWeightDerivation = () => {
    const isM = unitSystem === 'metric';
    const wtUnit = isM ? 'kg' : 'lbs';
    const areaUnit = isM ? 'mm²' : 'in²';
    const densityExplanation = isM 
      ? 'Carbon Steel standard weight density = 7850 kg/m³' 
      : 'Carbon Steel standard weight density = 0.28356 lbs/in³ (490 lbs/ft³)';

    return (
      <div className="space-y-4 font-mono text-xs text-slate-350">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 1: Metal Section Profile Area & Density</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-left font-sans text-xs text-emerald-400 space-y-1">
            <strong>Selected Profile Shape:</strong> {inputs.steelShape === 'plate' ? 'Solid Flat Plate' : inputs.steelShape === 'round' ? 'Solid Round Bar' : inputs.steelShape === 'pipe' ? 'Hollow Circular Pipe' : 'Wide Flange / H-Beam'}<br />
            <strong>Calculated Area (As):</strong> {outputs.sectionalArea ?? 0} {areaUnit}
          </div>
          <p className="text-slate-405 leading-normal">
            {densityExplanation}
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 2: Member Volume & Batch Weight</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            Total Weight = Area × Length × Density × Qty
          </div>
          <p className="text-slate-300 leading-normal">
            Given member Length = <span className="text-white font-bold">{inputs.length ?? 0} {isM ? 'm' : 'ft'}</span> and Quantity = <span className="text-white font-bold">{inputs.quantity ?? 1} pcs</span>:<br />
            • Segment Volume (Per Unit) = <span className="text-white font-bold">{outputs.volumePerUnit ?? 0} {isM ? 'm³' : 'in³'}</span><br />
            • Structural Weight (Per Element) = <span className="text-white font-bold">{outputs.weightPerUnit ?? 0} {wtUnit}</span><br />
            • Grand Total Steel Weight = <span className="text-emerald-405 text-sm font-black">{outputs.totalWeight ?? 0} {wtUnit}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderRebarDerivation = () => {
    const isM = unitSystem === 'metric';
    const lenUnit = isM ? 'm' : 'ft';
    const wtUnit = isM ? 'kg' : 'lbs';
    const diaUnit = isM ? 'mm' : 'in';
    const spacingUnit = isM ? 'mm' : 'in';

    return (
      <div className="space-y-4 font-mono text-xs text-slate-350">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 1: Net Concrete Workspace Bounds</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            Net dimension = Element dimension - (2 × Clear Cover)
          </div>
          <p className="text-slate-300 leading-normal">
            Slab / Pad dimensions: <span className="text-white font-bold">{inputs.elementLength ?? 0}m × {inputs.elementWidth ?? 0}m</span> with standard clear cover = <span className="text-white font-bold">{inputs.concreteCover ?? 0} {spacingUnit}</span>:<br />
            • Net Length (interior) = <span className="text-white font-bold">{(isM ? (inputs.elementLength - 2 * (inputs.concreteCover/1000)) : (inputs.elementLength - 2 * (inputs.concreteCover/12))).toFixed(3)} {lenUnit}</span><br />
            • Net Width (interior) = <span className="text-white font-bold">{(isM ? (inputs.elementWidth - 2 * (inputs.concreteCover/1000)) : (inputs.elementWidth - 2 * (inputs.concreteCover/12))).toFixed(3)} {lenUnit}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 2: Reinforcing Steel Grid Counts</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            Bar Count = ceil(Net Span / Spacing) + 1 starter bar
          </div>
          <p className="text-slate-300 leading-normal">
            Given grid centers spacing spacing (c/c) = <span className="text-white font-bold">{inputs.spacing ?? 0} {spacingUnit}</span>:<br />
            • Longitudinal (L-Dir) Grid Bars Count = <span className="text-white font-bold">{outputs.barsAlongLengthCount ?? 0} pcs</span><br />
            • Transverse (W-Dir) Grid Bars Count = <span className="text-white font-bold">{outputs.barsAlongWidthCount ?? 0} pcs</span><br />
            • Grand Mesh Bars Total = <span className="text-white font-bold">{outputs.totalBarsCount ?? 0} bars</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 3: Anchoring, Lapping & theoretical weight</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-left font-sans text-xs text-emerald-450 space-y-1">
            <strong>Theoretical Unit Weight:</strong> {outputs.unitWeight ?? 0} {isM ? 'kg/m' : 'lbs/ft'}<br />
            <strong>Calculated Lap Splice:</strong> {inputs.lapSplice ?? 40}D multiplier
          </div>
          <p className="text-slate-300 leading-normal">
            • Single rebar length (L-Direction) = <span className="text-white font-bold">{outputs.singleBarLenL ?? 0} {lenUnit}</span><br />
            • Single rebar length (W-Direction) = <span className="text-white font-bold">{outputs.singleBarLenW ?? 0} {lenUnit}</span><br />
            • Total Grid Steel Length Sum = <span className="text-white font-bold">{outputs.totalLength ?? 0} {lenUnit}</span><br />
            • Grand Total Rebar Steel Weight = <span className="text-emerald-405 text-sm font-black">{outputs.totalWeight ?? 0} {wtUnit}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderBrickDerivation = () => {
    const isM = unitSystem === 'metric';
    const volUnit = isM ? 'm³' : 'ft³';
    const wtUnit = isM ? 'kg' : 'lbs';
    const sizeUnit = isM ? 'mm' : 'in';
    const areaUnit = isM ? 'm²' : 'ft²';
    const opCount = inputs.openings?.length || 0;

    return (
      <div className="space-y-4 font-mono text-xs text-slate-350">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 1: Solid Wall Sizing & Deductions</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-medium text-emerald-400">
            Net Volume = (Length × Height × Thickness) - Openings Volume
          </div>
          <p className="text-slate-300 leading-normal">
            • Gross Wall Volume: <span className="text-white font-bold">{outputs.wallVolumeGross ?? 0} {volUnit}</span><br />
            • Net Wall Volume: <span className="text-white font-bold">{outputs.wallVolumeNet ?? 0} {volUnit}</span> (After deducting {opCount} opening(s))<br />
            • Net Wall Face Area: <span className="text-white font-bold">{outputs.wallAreaNet ?? 0} {areaUnit}</span><br />
            • Brick Preset Size: <span className="text-white font-bold">{inputs.brickLength ?? 0} × {inputs.brickWidth ?? 0} × {inputs.brickHeight ?? 0} {sizeUnit}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 2: Simulation Brick Placements & Cuts</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-bold text-emerald-400">
            Net Bricks = Full Bricks + Math.ceil(Half Bricks / 2) + Cut Bricks
          </div>
          <p className="text-slate-300 leading-normal">
            We run the exact pattern placement algorithm for the selected bond type (<span className="text-amber-500 font-bold">{inputs.bondType || 'stretcher'}</span>):<br />
            • Full Bricks laid: <span className="text-white font-bold">{outputs.fullBricksCount ?? 0}</span> units<br />
            • Half Bricks cut: <span className="text-white font-bold">{outputs.halfBricksCount ?? 0}</span> units<br />
            • Cut Bricks details: <span className="text-white font-bold">{outputs.cutBricksCount ?? 0}</span> units<br />
            • Net units required: <span className="text-white font-bold">{outputs.netBricksCount ?? 0}</span> units<br />
            • Order (+ <span className="text-white font-bold">{inputs.wastePercent ?? 10}%</span> wastage): <span className="text-emerald-400 font-bold text-sm">{outputs.totalBricksWithWaste ?? 0} bricks</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 3: Mortar & Dry Compaction Quantities</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-center font-sans font-bold text-emerald-400">
            Dry Mortar Vol = (Wall Net Volume - Solid Bricks Volume - Cavity Volume) × 1.27
          </div>
          <p className="text-slate-300 leading-normal">
            Shrinkage compaction allowance accounts for ~27% volume loss when dry sand/cement powder is hydrated.<br />
            • Wet Mortar Volume: <span className="text-white font-bold">{outputs.mortarVolumeWet ?? 0} {volUnit}</span><br />
            • Dry Mortar Volume: <span className="text-white font-bold">{outputs.mortarVolumeDry ?? 0} {volUnit}</span><br />
            • Mix Ratio Model: <span className="text-white font-bold">1 : {inputs.mixRatio ? inputs.mixRatio.split(':')[1] : 4} (C : S)</span><br />
            • Cement bags (50kg/94lbs): <span className="text-emerald-400 font-bold">{outputs.cementBagsRequired ?? 0} bags</span><br />
            • Sand needed: <span className="text-emerald-400 font-bold">{outputs.sandVolumeRequired ?? 0} {volUnit} ({outputs.sandWeightRequired ?? 0} {wtUnit})</span><br />
            • Hydration Water: <span className="text-emerald-400 font-bold">{outputs.waterRequired ?? 0} {isM ? 'Liters' : 'Gallons'}</span>
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 text-left">
          <span className="text-amber-450 font-bold block uppercase tracking-wider text-[10px]">Step 4: Engineering Cost Valuation</span>
          <div className="p-2 py-3 bg-slate-900/60 border border-slate-800 rounded-lg text-left font-sans text-xs text-emerald-450 space-y-1">
            <strong>Materials cost:</strong> {currencySymbol}{outputs.materialCost ?? 0}<br />
            <strong>Labour cost:</strong> {currencySymbol}{outputs.labourCost ?? 0}<br />
            <strong>Transport flat rate:</strong> {currencySymbol}{inputs.transportCost ?? 0}
          </div>
          <p className="text-slate-300 leading-normal">
            • Grand Project Total: <span className="text-emerald-400 font-black text-sm">{currencySymbol}{outputs.grandTotal ?? 0}</span><br />
            • Cost density (per unit area): <span className="text-white font-bold">{currencySymbol}{outputs.costPerArea ?? 0} /{areaUnit}</span><br />
            • Cost density (per unit volume): <span className="text-white font-bold">{currencySymbol}{outputs.costPerVolume ?? 0} /{volUnit}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderDynamicMathematicalDerivation = () => {
    switch (calculatorId) {
      case 'concrete-volume':
        return renderConcreteVolumeDerivation();
      case 'structural-beam':
      case 'structural-deflection':
        return renderBeamDerivation();
      case 'structural-column':
        return renderColumnDerivation();
      case 'structural-slab':
        return renderSlabDerivation();
      case 'geotech-bearing':
        return renderBearingCapacityDerivation();
      case 'geotech-retaining':
        return renderRetainingDerivation();
      case 'survey-hi':
        return renderSurveyHIDerivation();
      case 'survey-coordinate':
        return renderSurveyCoordinateDerivation();
      case 'steel-calculator':
        return renderSteelWeightDerivation();
      case 'rebar-calculator':
        return renderRebarDerivation();
      case 'brick-calculator':
        return renderBrickDerivation();
      case 'utility-convert':
        return renderUtilityConvertDerivation();
      default:
        return <div className="text-slate-400 p-4">Select an active workspace engineering model.</div>;
    }
  };

  const handleShareCalculation = async () => {
    const url = encodeCalculationToUrl(inputs, unitSystem);
    const ok = await copyShareLinkToClipboard(url);
    if (ok) {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    }
  };

  const handleDownloadPDF = (metadata?: {
    projectName?: string;
    engineerName?: string;
    companyName?: string;
    clientName?: string;
    notes?: string;
  }) => {
    try {
      const doc = new jsPDF();
      const isMetric = unitSystem === 'metric';
      
      const drawPageDecorations = (docObj: InstanceType<typeof jsPDF>, pageNum: number, totalPages: number) => {
        // Outline Outer Structural Frame
        docObj.setDrawColor(203, 213, 225); // slate-300
        docObj.setLineWidth(0.4);
        docObj.rect(10, 10, 190, 277); // Beautiful frame
        
        // Brand Top Header Strap block
        docObj.setFillColor(15, 23, 42); // deep slate-900
        docObj.rect(10, 10, 190, 24, 'F');
        
        // Dynamic Accent line separator (CivilMath signature orange)
        docObj.setFillColor(249, 115, 22);
        docObj.rect(10, 34, 190, 1.8, 'F');
        
        // Title Text on Top dark bar
        const company = metadata?.companyName || 'CIVILMATH™ ENGINEERING SYSTEMS';
        const projectTitle = metadata?.projectName || (calcDef?.name ? `${calcDef.name.toUpperCase()} CALCULATION` : 'ENGINEERING REPORT');
        const eng = metadata?.engineerName || 'SITE ENGINEER';
        const client = metadata?.clientName || 'CLIENT PROJECT';

        docObj.setTextColor(255, 255, 255);
        docObj.setFont('helvetica', 'bold');
        docObj.setFontSize(11);
        docObj.text(company.toUpperCase().substring(0, 48), 15, 20);
        
        // Sub-bar dynamic subtitle
        docObj.setFont('helvetica', 'normal');
        docObj.setFontSize(7.5);
        docObj.setTextColor(249, 115, 22);
        docObj.text(`PROJECT: ${projectTitle.toUpperCase().substring(0, 52)}`, 15, 26);
        
        // Right side metadata
        docObj.setTextColor(255, 255, 255);
        docObj.setFont('helvetica', 'bold');
        docObj.setFontSize(7.5);
        docObj.text(`ENGINEER: ${eng.substring(0, 24)}`, 138, 19);
        docObj.setFont('helvetica', 'normal');
        docObj.setTextColor(203, 213, 225);
        docObj.text(`CLIENT: ${client.substring(0, 24)}`, 138, 24);
        docObj.text(`DATE: ${new Date().toLocaleDateString()}`, 138, 28);
        
        // Footer section
        docObj.setFont('helvetica', 'normal');
        docObj.setFontSize(6.5);
        docObj.setTextColor(148, 163, 184);
        docObj.text('CONFIDENTIAL // GENERAL BUILDING REVIEW & STRUCTURAL FORECAST PREVIEW // DATA VERIFIED SECURE', 15, 282);
        docObj.setFont('helvetica', 'bold');
        docObj.text(`PAGE ${pageNum}`, 188, 282);
        docObj.setDrawColor(226, 232, 240);
        docObj.line(10, 278, 200, 278);
      };

      // PAGE 1: Setup - we will draw page decorations retroactively for all pages at the end!
      
      // Sheet name & title header block
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`MODULE CALCULATION SHEET: ${calcDef?.name || 'Simulation'}`, 15, 41);

      // Section 1: Inputs Title
      let currentY = 48;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('I. METADATA SPECIFICATIONS & DESIGN PARAMETERS', 15, currentY);
      
      // Draw elegant blue bar under title
      doc.setFillColor(10, 132, 255);
      doc.rect(15, currentY + 1.5, 180, 0.5, 'F');
      currentY += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      
      // Zebra table listing active inputs only
      const activeKeys = getActiveInputKeys();
      activeKeys.forEach((key) => {
        if (!(key in inputs)) return;
        const value = inputs[key];
        if (key === 'materialIdx' || key === 'loadType' || key === 'supportType') return; // skip system keys
        const label = getExcelInputLabel(key, unitSystem);
        const textVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
        
        doc.setFillColor(248, 250, 252); // light slate background
        doc.rect(15, currentY - 4, 180, 6.5, 'F');
        
        doc.setTextColor(100, 116, 139);
        doc.text(label, 18, currentY);
        
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(textVal, 145, currentY);
        doc.setFont('helvetica', 'normal');
        
        currentY += 6.5;
        if (currentY > 265) { 
          doc.addPage(); 
          currentY = 45; 
        }
      });
      
      // Add comfortable vertical space between Section I and Section II, only splitting if space is limited
      currentY += 10;
      if (currentY > 225) {
        doc.addPage();
        currentY = 45;
      }
      
      // Section 2: Computed Results
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('II. COMPUTED STRUCTURAL MATRIX RESULTS', 15, currentY);
      
      // Draw green underscore bar representing successful analysis
      doc.setFillColor(16, 185, 129); // green success
      doc.rect(15, currentY + 1.5, 180, 0.5, 'F');
      currentY += 8;
      
      const formattedOutputs = getFormattedOutputs();
      
      // Grid of KPI dashboard cards for outputs on Page 2
      let oddRow = true;
      let cardX = 15;
      
      formattedOutputs.forEach((item) => {
        const cardWidth = 86;
        const cardHeight = 15;
        
        // draw background box
        doc.setFillColor(240, 253, 244); // light green accent shade
        doc.rect(cardX, currentY, cardWidth, cardHeight, 'F');
        
        // left status bar on the card
        doc.setFillColor(16, 185, 129); // emerald green
        doc.rect(cardX, currentY, 2.5, cardHeight, 'F');
        
        // Label text
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(item.label.substring(0, 48), cardX + 6, currentY + 5);
        
        // Bold Value text
        doc.setTextColor(15, 107, 49); // bold forest green
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`${item.value} ${item.unit}`, cardX + 6, currentY + 11);
        
        if (oddRow) {
          cardX = 108; // move to second column
          oddRow = false;
        } else {
          cardX = 15; // reset column
          currentY += 18; // line gap
          oddRow = true;
        }
        
        if (currentY > 255) {
          doc.addPage();
          currentY = 45;
          cardX = 15;
          oddRow = true;
        }
      });
      
      if (!oddRow) {
        currentY += 18; // finalize leftover column
      }
      
      // SECTION 3: Dedicated Leveling Field Book Sheet (Only for Surveying HI)
      if (calculatorId === 'survey-hi') {
        currentY += 10;
        if (currentY > 230) {
          doc.addPage();
          currentY = 45;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text('III. FIELD SURVEY LEVELING FIELD BOOK SHEET', 15, currentY);

        doc.setFillColor(10, 132, 255); // civilmath blue
        doc.rect(15, currentY + 1.5, 180, 0.5, 'F');
        currentY += 8;

        // Header columns
        const colWidths = [12, 18, 22, 26, 22, 22, 26, 32]; // total 180
        const colNames = ['Station', 'Dist (m/ft)', 'BS (+)', 'HI (Calc)', 'IS', 'FS (-)', 'RL (Calc)', 'Remarks'];
        
        let headerX = 15;
        doc.setFillColor(30, 41, 59); // deep slate-800
        doc.rect(15, currentY - 4, 180, 6.5, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        
        colNames.forEach((name, i) => {
          doc.text(name, headerX + 2, currentY);
          headerX += colWidths[i];
        });
        currentY += 6.5;

        // Field book rows loop
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        
        surveyRows.forEach((row, idx) => {
          const calculatedRow = outputs.rows?.[idx];
          
          if (currentY > 255) {
            doc.addPage();
            currentY = 45;
            
            // Re-draw table header
            let subHeaderX = 15;
            doc.setFillColor(30, 41, 59);
            doc.rect(15, currentY - 4, 180, 6.5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(255, 255, 255);
            colNames.forEach((name, i) => {
              doc.text(name, subHeaderX + 2, currentY);
              subHeaderX += colWidths[i];
            });
            currentY += 6.5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
          }

          // Row background
          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
          } else {
            doc.setFillColor(255, 255, 255);
          }
          doc.rect(15, currentY - 4.5, 180, 6.5, 'F');

          let cellHI = calculatedRow?.hi !== undefined && calculatedRow.hi !== null ? calculatedRow.hi.toFixed(3) : '-';
          let cellRL = calculatedRow?.rl !== undefined && calculatedRow.rl !== null ? calculatedRow.rl.toFixed(3) : '-';

          let textX = 15;
          doc.setTextColor(15, 23, 42);
          
          // Station
          doc.setFont('helvetica', 'bold');
          doc.text(row.station || `Stn ${idx + 1}`, textX + 2, currentY);
          textX += colWidths[0];

          // Distance
          doc.setFont('helvetica', 'normal');
          doc.text(typeof row.distance === 'number' ? row.distance.toString() : String(row.distance), textX + 2, currentY);
          textX += colWidths[1];

          // BS (+)
          doc.setTextColor(10, 132, 255);
          doc.setFont('helvetica', 'bold');
          doc.text(row.bs !== null ? row.bs.toFixed(3) : '-', textX + 2, currentY);
          textX += colWidths[2];

          // HI (calculated)
          doc.setTextColor(30, 58, 138);
          doc.setFont('helvetica', 'bold');
          doc.text(cellHI, textX + 2, currentY);
          textX += colWidths[3];

          // IS
          doc.setTextColor(71, 85, 105);
          doc.setFont('helvetica', 'normal');
          doc.text(row.is !== null ? row.is.toFixed(3) : '-', textX + 2, currentY);
          textX += colWidths[4];

          // FS (-)
          doc.setTextColor(220, 38, 38);
          doc.setFont('helvetica', 'bold');
          doc.text(row.fs !== null ? row.fs.toFixed(3) : '-', textX + 2, currentY);
          textX += colWidths[5];

          // RL (calculated)
          doc.setTextColor(4, 120, 87);
          doc.setFont('helvetica', 'bold');
          doc.text(cellRL, textX + 2, currentY);
          textX += colWidths[6];

          // Remarks
          doc.setTextColor(71, 85, 105);
          doc.setFont('helvetica', 'normal');
          doc.text(row.remarks || '-', textX + 2, currentY);
          textX += colWidths[7];

          currentY += 6.5;
        });

        currentY += 4; // safety spacing
      }

      // Section 4: Dual unit cross equivalents
      currentY += 4;
      if (currentY > 255) { doc.addPage(); currentY = 45; }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(calculatorId === 'survey-hi' ? 'IV. COMPLIANT ALTERNATIVE DUAL-UNIT EQUIVALENTS' : 'III. COMPLIANT ALTERNATIVE DUAL-UNIT EQUIVALENTS', 15, currentY);
      
      doc.setFillColor(245, 158, 11); // warning yellow-amber indicator style
      doc.rect(15, currentY + 1.5, 180, 0.5, 'F');
      currentY += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Multinational cross-border project conversions based on alternate metric & imperial standards:', 15, currentY);
      currentY += 5.5;
      
      const dualUnits = getExcelDualUnits().filter(item => item.calculatorId === calculatorId);
      if (dualUnits.length > 0) {
        dualUnits.forEach((du) => {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, currentY - 4, 180, 6, 'F');
          
          doc.setTextColor(100, 116, 139);
          doc.text(du.name, 18, currentY);
          
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.text(du.val, 145, currentY);
          doc.setFont('helvetica', 'normal');
          
          currentY += 6;
          if (currentY > 255) { doc.addPage(); currentY = 45; }
        });
      } else {
        doc.text('Direct direct-ratio conversions check is not required for static parameters.', 18, currentY);
        currentY += 6;
      }
      
      // Signature Section
      currentY += 10;
      if (currentY > 240) { doc.addPage(); currentY = 45; }
      
      doc.setDrawColor(203, 213, 225);
      doc.line(15, currentY, 195, currentY);
      currentY += 6;
      
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text('ENGINEER SYSTEM COMPLIANCE VERIFICATION: CALIBRATED ALGORITHMS ADHERE TO ACI-318, ASTM Standards.', 15, currentY);
      currentY += 4;
      doc.text('FOR STRUCTURAL PLANNING PURPOSES ONLY. SIGNED APPROVAL IS MANDATED BEFORE REAL CONSTRUCTION FIELD DEPLOYMENTS.', 15, currentY);
      
      // Retroactively render all page frame decorations to ensure perfect accurate page numbering and headers
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        drawPageDecorations(doc, p, totalPages);
      }

      // Download
      doc.save(`${calculatorId}_executive_report_${Date.now()}.pdf`);
    } catch (e: any) {
      console.error('PDF creation error:', e);
      alert('Could not export high-fidelity PDF. Check logs/data inputs.');
    }
  };

  const handleDownloadExcel = () => {
    try {
      const rows: any[][] = [];
      const isMetric = unitSystem === 'metric';

      // Advanced number/string parsers for native Excel cell format bindings
      const cleanNumericValue = (val: any) => {
        if (typeof val === 'number') return val;
        let str = String(val).trim();
        if (str.startsWith(currencySymbol)) {
          str = str.substring(currencySymbol.length).trim();
        }
        str = str.replace(/,/g, '');
        let isPercent = false;
        if (str.endsWith('%')) {
          str = str.substring(0, str.length - 1).trim();
          isPercent = true;
        }
        const parsed = parseFloat(str);
        if (!isNaN(parsed) && isFinite(parsed)) {
          return isPercent ? parsed / 100 : parsed;
        }
        return val;
      };

      const formatGenerationDate = () => {
        const d = new Date();
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const day = d.getDate();
        const monthStr = months[d.getMonth()];
        const year = d.getFullYear();
        const pad = (num: number) => String(num).padStart(2, '0');
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        return `Generated ${day} ${monthStr} ${year} at ${hours}:${minutes}`;
      };

      // Styles creation helper to build SheetJS cell objects cleanly
      const createCell = (
        val: any,
        style: any = {},
        type: string = 's',
        numFormat?: string
      ) => {
        const defaultFont = { name: 'Calibri', sz: 11, color: { rgb: '000000' } };
        const mergedStyle = {
          ...style,
          font: { ...defaultFont, ...(style.font || {}) }
        };
        const cellObj: any = { v: val, t: type, s: mergedStyle };
        if (numFormat) {
          cellObj.z = numFormat;
        }
        return cellObj;
      };

      // Header styling mimicking the orange and dark grey screenshot branding
      const titleMainStyle = {
        font: { sz: 16, bold: true, color: { rgb: 'FF8500' } } // Beautiful BuildCalc Pro orange brand color
      };
      const titleSubStyle = {
        font: { sz: 12, bold: true, color: { rgb: '1A365D' } } // Elegant corporate blueprint blue
      };
      const titleMetadataStyle = {
        font: { sz: 9.5, italic: true, color: { rgb: '64748B' } }
      };

      const prjHeaderStyle = {
        fill: { patternType: "solid", fgColor: { rgb: "FF8500" } }, // orange section header accent
        font: { sz: 11, bold: true, color: { rgb: "FFFFFF" } },
        alignment: { vertical: "center" },
        border: {
          bottom: { style: "medium", color: { rgb: "FFB300" } } // orange-amber line accent under header!
        }
      };

      const colHeaderStyleLeft = {
        fill: { patternType: "solid", fgColor: { rgb: "1E293B" } }, // slate-900 / dark grey background
        font: { sz: 10, bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          bottom: { style: "thin", color: { rgb: "FFC000" } } // thin gold/yellow line accent!
        }
      };

      const colHeaderStyleRight = {
        fill: { patternType: "solid", fgColor: { rgb: "1E293B" } },
        font: { sz: 10, bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: {
          bottom: { style: "thin", color: { rgb: "FFC000" } } // thin gold/yellow line accent!
        }
      };

      const inputItemStyle = {
        font: { sz: 10.5, color: { rgb: "334155" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          bottom: { style: "thin", color: { rgb: "E2E8F0" } }
        }
      };

      const inputValueStyleText = {
        font: { sz: 10.5, bold: true, color: { rgb: "0F172A" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: {
          bottom: { style: "thin", color: { rgb: "E2E8F0" } }
        }
      };

      const inputValueStyleNum = {
        font: { sz: 10.5, bold: true, color: { rgb: "0F172A" } },
        alignment: { horizontal: "right", vertical: "center" },
        border: {
          bottom: { style: "thin", color: { rgb: "E2E8F0" } }
        }
      };

      // Outputs highlighted fields (yellow solid highlights & double golden lines)
      const calcOutputItemStyle = {
        fill: { patternType: "solid", fgColor: { rgb: "FFFDF0" } }, // very soft warm yellow cream background row label
        font: { sz: 10.5, bold: true, color: { rgb: "1E293B" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          bottom: { style: "thin", color: { rgb: "FDE047" } } // thin soft yellow line under keys
        }
      };

      const calcOutputValueStyle = {
        fill: { patternType: "solid", fgColor: { rgb: "FEF08A" } }, // rich yellow-200 background highlight!
        font: { sz: 11, bold: true, color: { rgb: "B45309" } }, // amber-700 font color
        alignment: { horizontal: "right", vertical: "center" },
        border: {
          bottom: { style: "double", color: { rgb: "D97706" } }, // accounting double orange/yellow bottom line!
          left: { style: "thin", color: { rgb: "FDE047" } },
          right: { style: "thin", color: { rgb: "FDE047" } },
          top: { style: "thin", color: { rgb: "FDE047" } }
        }
      };

      // Exact layout mimicking the screenshot structure
      rows.push([createCell('BuildCalc Pro', titleMainStyle)]);
      rows.push([createCell(calcDef?.name || 'Simulator', titleSubStyle)]);
      rows.push([createCell(formatGenerationDate(), titleMetadataStyle)]);
      rows.push([]); // blank spacing row

      // Section 1: Project Inputs
      rows.push([
        createCell('Project Inputs', prjHeaderStyle),
        createCell('', prjHeaderStyle)
      ]);
      rows.push([
        createCell('Item', colHeaderStyleLeft),
        createCell('Value', colHeaderStyleRight)
      ]);

      const activeKeys = getActiveInputKeys();
      activeKeys.forEach((key) => {
        if (!(key in inputs)) return;
        const value = inputs[key];
        if (key === 'materialIdx' || key === 'supportType' || key === 'loadType') return;
        const label = getExcelInputLabel(key, unitSystem);
        const cleanVal = cleanNumericValue(value);

        if (typeof cleanVal === 'number') {
          let numFormat = '0.00';
          if (String(value).endsWith('%')) {
            numFormat = '0.00%';
          } else if (Number.isInteger(cleanVal)) {
            numFormat = '#,##0';
          }
          rows.push([
            createCell(label, inputItemStyle, 's'),
            createCell(cleanVal, inputValueStyleNum, 'n', numFormat)
          ]);
        } else {
          rows.push([
            createCell(label, inputItemStyle, 's'),
            createCell(String(value), inputValueStyleText, 's')
          ]);
        }
      });

      rows.push([]); // separation spacer
      rows.push([]); // separation spacer

      // Section 2: Calculated Quantities (exact name matched to screenshot)
      rows.push([
        createCell('Calculated Quantities', prjHeaderStyle),
        createCell('', prjHeaderStyle)
      ]);
      rows.push([
        createCell('Item', colHeaderStyleLeft),
        createCell('Value', colHeaderStyleRight)
      ]);

      const formattedOutputs = getFormattedOutputs();
      formattedOutputs.forEach((item) => {
        let valueStr = `${item.value} ${item.unit}`;
        if (item.unit === currency || item.unit === 'USD') {
          valueStr = `${currencySymbol}${item.value}`;
        } else if (item.unit === 'Ratio' || item.unit === 'Status' || item.unit === 'Factor' || item.unit === 'Coefficient' || item.unit === 'Standard spacing') {
          valueStr = String(item.value);
        }

        const numericVal = cleanNumericValue(item.value);
        if (typeof numericVal === 'number') {
          let numFormat = '#,##0.00';
          if (item.unit === currency || item.unit === 'USD' || item.unit === 'LKR') {
            numFormat = `"${currencySymbol}"#,##0.00`;
          } else if (item.unit === 'nos' || item.unit === 'bags') {
            numFormat = `#,##0" ${item.unit}"`;
          } else {
            numFormat = `#,##0.00" ${item.unit}"`;
          }
          rows.push([
            createCell(item.label, calcOutputItemStyle, 's'),
            createCell(numericVal, calcOutputValueStyle, 'n', numFormat)
          ]);
        } else {
          rows.push([
            createCell(item.label, calcOutputItemStyle, 's'),
            createCell(valueStr, calcOutputValueStyle, 's')
          ]);
        }
      });

      // SECTION 2.5: Leveling Field Book Sheet (Only for Surveying HI)
      if (calculatorId === 'survey-hi') {
        rows.push([]);
        rows.push([]);
        rows.push([
          createCell('Leveling Field Book Sheet', prjHeaderStyle),
          createCell('', prjHeaderStyle),
          createCell('', prjHeaderStyle),
          createCell('', prjHeaderStyle),
          createCell('', prjHeaderStyle),
          createCell('', prjHeaderStyle),
          createCell('', prjHeaderStyle),
          createCell('', prjHeaderStyle)
        ]);

        const levelHeaderStyle = {
          fill: { patternType: "solid", fgColor: { rgb: "1E293B" } }, // slate-900 / dark grey background
          font: { sz: 9.5, bold: true, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            bottom: { style: "medium", color: { rgb: "0A84FF" } }, // blue line accent
            left: { style: "thin", color: { rgb: "475569" } },
            right: { style: "thin", color: { rgb: "475569" } },
            top: { style: "thin", color: { rgb: "475569" } }
          }
        };

        const levelRowStyleEven = {
          fill: { patternType: "solid", fgColor: { rgb: "F8FAFC" } }, // slate-50
          font: { sz: 9.5, color: { rgb: "0F172A" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left: { style: "thin", color: { rgb: "E2E8F0" } },
            right: { style: "thin", color: { rgb: "E2E8F0" } }
          }
        };

        const levelRowStyleOdd = {
          fill: { patternType: "solid", fgColor: { rgb: "FFFFFF" } }, // white
          font: { sz: 9.5, color: { rgb: "0F172A" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            bottom: { style: "thin", color: { rgb: "E2E8F0" } },
            left: { style: "thin", color: { rgb: "E2E8F0" } },
            right: { style: "thin", color: { rgb: "E2E8F0" } }
          }
        };

        // Special highlight style for HI and RL columns to make them pop!
        const levelHiStyle = {
          fill: { patternType: "solid", fgColor: { rgb: "F1F5F9" } }, // light slate
          font: { sz: 9.5, bold: true, color: { rgb: "1E3A8A" } }, // dark blue text
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            bottom: { style: "thin", color: { rgb: "CBD5E1" } },
            left: { style: "thin", color: { rgb: "CBD5E1" } },
            right: { style: "thin", color: { rgb: "CBD5E1" } }
          }
        };

        const levelRlStyle = {
          fill: { patternType: "solid", fgColor: { rgb: "ECFDF5" } }, // emerald 50
          font: { sz: 9.5, bold: true, color: { rgb: "047857" } }, // emerald-70
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            bottom: { style: "thin", color: { rgb: "A7F3D0" } },
            left: { style: "thin", color: { rgb: "A7F3D0" } },
            right: { style: "thin", color: { rgb: "A7F3D0" } }
          }
        };

        rows.push([
          createCell('Station', levelHeaderStyle),
          createCell(`Distance (${isMetric ? 'm' : 'ft'})`, levelHeaderStyle),
          createCell('Backsight BS (+)', levelHeaderStyle),
          createCell('Height of Inst HI (Calc)', levelHeaderStyle),
          createCell('Intermediate IS', levelHeaderStyle),
          createCell('Foresight FS (-)', levelHeaderStyle),
          createCell('Reduced Level RL (Calc)', levelHeaderStyle),
          createCell('Remarks', levelHeaderStyle)
        ]);

        surveyRows.forEach((row, idx) => {
          const calculatedRow = outputs.rows?.[idx];
          const rowStyle = idx % 2 === 0 ? levelRowStyleEven : levelRowStyleOdd;
          
          rows.push([
            createCell(row.station || `Stn ${idx + 1}`, rowStyle, 's'),
            createCell(row.distance, rowStyle, 'n', '0.00'),
            createCell(row.bs !== null ? row.bs : '-', rowStyle, row.bs !== null ? 'n' : 's', row.bs !== null ? '0.000' : undefined),
            createCell(calculatedRow?.hi !== undefined && calculatedRow.hi !== null ? calculatedRow.hi : '-', levelHiStyle, calculatedRow?.hi !== undefined ? 'n' : 's', calculatedRow?.hi !== undefined ? '0.000' : undefined),
            createCell(row.is !== null ? row.is : '-', rowStyle, row.is !== null ? 'n' : 's', row.is !== null ? '0.000' : undefined),
            createCell(row.fs !== null ? row.fs : '-', rowStyle, row.fs !== null ? 'n' : 's', row.fs !== null ? '0.000' : undefined),
            createCell(calculatedRow?.rl !== undefined && calculatedRow.rl !== null ? calculatedRow.rl : '-', levelRlStyle, calculatedRow?.rl !== undefined ? 'n' : 's', calculatedRow?.rl !== undefined ? '0.000' : undefined),
            createCell(row.remarks || '-', rowStyle, 's')
          ]);
        });
      }

      // Section 3: Optional Alternate Dual Conversions
      const dualUnits = getExcelDualUnits().filter(item => item.calculatorId === calculatorId);
      if (dualUnits.length > 0) {
        rows.push([]);
        rows.push([]);

        const altHeaderStyle = {
          fill: { patternType: "solid", fgColor: { rgb: "57534E" } }, // clean stone-dark header style
          font: { sz: 12, bold: true, color: { rgb: "FFFFFF" } },
          alignment: { vertical: "center" },
          border: {
            bottom: { style: "medium", color: { rgb: "FFB300" } }
          }
        };

        rows.push([
          createCell('Alternative Conversions', altHeaderStyle),
          createCell('', altHeaderStyle)
        ]);
        rows.push([
          createCell('Item', colHeaderStyleLeft),
          createCell('Value', colHeaderStyleRight)
        ]);

        const altItemStyle = {
          font: { sz: 10, color: { rgb: "4B5563" } },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            bottom: { style: "thin", color: { rgb: "E5E7EB" } }
          }
        };

        const altValStyle = {
          font: { sz: 10, bold: true, color: { rgb: "1F2937" } },
          alignment: { horizontal: "right", vertical: "center" },
          border: {
            bottom: { style: "thin", color: { rgb: "E5E7EB" } }
          }
        };

        dualUnits.forEach((du) => {
          rows.push([
            createCell(du.name, altItemStyle, 's'),
            createCell(du.val, altValStyle, 's')
          ]);
        });
      }

      // Build sheet & workbook with sheet tab name 'Summary'
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Summary');

      // Autofit Column widths
      if (calculatorId === 'survey-hi') {
        ws['!cols'] = [
          { wch: 15 }, // Station
          { wch: 16 }, // Distance
          { wch: 18 }, // Backsight BS
          { wch: 22 }, // HI
          { wch: 18 }, // Intermediate IS
          { wch: 18 }, // Foresight FS
          { wch: 22 }, // Reduced Level RL
          { wch: 25 }  // Remarks
        ];
      } else {
        ws['!cols'] = [
          { wch: 45 }, // Item column
          { wch: 28 }  // Value column
        ];
      }

      XLSX.writeFile(wb, `${calculatorId}_calculation_${Date.now()}.xlsx`);
    } catch (e: any) {
      console.error('Excel creation error:', e);
      alert('Could not export to Excel sheet.');
    }
  };


  if (calculatorId.startsWith('bbs-')) {
    return (
      <motion.div
        key={calculatorId}
        initial={{ opacity: 0, scale: 0.99, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: -12 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <UniversalBBSCalculator
          calculatorId={calculatorId}
          unitSystem={unitSystem}
          setUnitSystem={setUnitSystem}
          onSaveCalculation={onSaveCalculation}
          savedCalculations={savedCalculations}
          loadedCalculation={loadedCalculation}
          currency={currency}
          isPrintPreviewMode={isPrintPreviewMode}
          setIsPrintPreviewMode={setIsPrintPreviewMode}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      key={calculatorId}
      initial={{ opacity: 0, scale: 0.99, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.99, y: -12 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col space-y-6 w-full ${isPrintPreviewMode ? 'print-preview-mode' : ''}`}
    >
      {isPrintPreviewMode && (
        <div className="bg-blue-600 dark:bg-blue-800 text-white p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between shadow-lg border border-blue-500/30 gap-3 mb-2 print-hide z-50">
          <div className="flex items-center space-x-2.5">
            <Printer className="w-5 h-5 text-white animate-pulse" />
            <div className="text-left">
              <p className="text-xs font-bold font-sans">Print Preview Mode Active</p>
              <p className="text-[10px] text-blue-100 dark:text-blue-200 font-mono">
                The worksheet is styled for printing. Sidebars, assistant panels, and interactive elements are hidden.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => {
                try {
                  window.focus();
                  window.print();
                } catch (e) {
                  alert("Please use the 'Open in New Tab' button in the top right, as browser rules can limit print modals inside preview iframes.");
                }
              }}
              className="px-3 py-1.5 bg-white text-blue-600 hover:bg-blue-50 text-[10px] font-bold font-mono rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Print Now
            </button>
            <button
              onClick={() => setIsPrintPreviewMode(false)}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-900 text-[10px] font-bold font-mono rounded-xl text-white transition-colors cursor-pointer border border-blue-600"
            >
              Exit Preview
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start w-full">
      
      {/* LEFT: Inputs Form */}
      <div className={`${
        calculatorId === 'survey-hi'
          ? 'md:col-span-12 lg:col-span-8 w-full'
          : calculatorId === 'utility-convert'
          ? 'col-span-12 lg:col-span-6 w-full'
          : 'col-span-12 lg:col-span-7 xl:col-span-8 w-full'
      } bg-white/70 border border-slate-200 rounded-3xl p-4 sm:p-5 backdrop-blur-xl flex flex-col justify-between shadow-xs text-left`} id="tour-input-panel">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DCE3F5]/60 dark:border-[#2A3350]">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-[#4C5FE0]/12 text-[#4C5FE0] rounded-xl border border-[#4C5FE0]/20 shadow-2xs">
                {calculatorId === 'concrete-volume' ? <Box className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#161A2C] dark:text-[#E7EAF7] font-sans tracking-tight">
                  {calculatorId === 'concrete-volume' ? 'Enter Dimensions' : 'Inputs'}
                </h3>
                <p className="text-[9.5px] font-mono font-medium text-[#7C88B8] dark:text-[#8891B0]">
                  {calculatorId === 'concrete-volume' ? 'MODEL: RECTANGULAR · PRECISION: 0.01' : 'STATE CONTROL PARAMETERS'}
                </p>
              </div>
            </div>

            {/* Undo button */}
            {inputHistory.length > 0 && (
              <button 
                onClick={handleUndo}
                className="p-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-mono text-slate-600 border border-slate-200 flex items-center space-x-1 cursor-pointer"
                title="Undo last change"
              >
                <Undo2 className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}
          </div>

          {/* WORKSPACE VIEW CONTROL BAR */}
          <div id="workspace-customize-bar" className="bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 flex items-center justify-between mb-3.5 text-[10px] font-mono shadow-xs gap-2 flex-wrap text-left">
            <span className="text-slate-550 font-bold uppercase tracking-wider pl-1 font-sans text-[9px] flex items-center">
              <Layout className="w-3.5 h-3.5 text-[#0A84FF] mr-1" />
              <span>CUSTOMIZE WORKSPACE:</span>
            </span>
            <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs gap-1 flex-wrap">
              <button
                type="button"
                onClick={onToggleSidebar}
                className={`px-2 py-1 rounded-md cursor-pointer transition-all text-[9.5px] font-bold ${
                  isSidebarCollapsed
                    ? 'bg-amber-400 text-white font-extrabold shadow-3xs'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-[#0F172A]'
                }`}
                title="Open calculation modules menu"
              >
                Open Modules
              </button>
              <button
                type="button"
                onClick={() => setIsPrintPreviewMode(p => !p)}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-all text-[9.5px] font-bold flex items-center space-x-1 ${
                  isPrintPreviewMode
                    ? 'bg-[#0A84FF] text-white font-extrabold shadow-3xs hover:bg-blue-650'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-[#0F172A]'
                }`}
                title="Toggle high-fidelity Print Preview state"
              >
                <Printer className="w-3 h-3" />
                <span>{isPrintPreviewMode ? "Exit Print Mode" : "Print Mode"}</span>
              </button>
            </div>
          </div>

          {/* QUICK LOCAL UNIT TOGGLE BAR */}
          <div id="workspace-units-bar" className="bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 flex items-center justify-between mb-4 text-[10px] font-mono shadow-xs">
            <span className="text-slate-500 font-semibold uppercase tracking-wider pl-1.5 flex items-center space-x-1">
              <RefreshCw className="w-3 h-3 text-[#0A84FF] animate-spin-slow" />
              <span>Active units:</span>
            </span>
            <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={() => setUnitSystem('metric')}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                  unitSystem === 'metric'
                    ? 'bg-[#0A84FF] font-bold text-white shadow-xs'
                    : 'text-slate-550 hover:text-slate-800'
                }`}
              >
                METRIC (SI)
              </button>
              <button
                onClick={() => setUnitSystem('imperial')}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-all ${
                  unitSystem === 'imperial'
                    ? 'bg-[#0A84FF] font-bold text-white shadow-xs'
                    : 'text-slate-550 hover:text-[#0f172a]'
                }`}
              >
                IMPERIAL (US)
              </button>
            </div>
          </div>

          {/* DYNAMIC FORM RENDERING */}
          <div className="space-y-3 text-xs font-mono">
            {calculatorId === 'concrete-volume' && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="length-input" className="text-slate-600 font-semibold">Slab Length</label>
                    <select
                      value={paramUnits.length || (unitSystem === 'metric' ? 'm' : 'ft')}
                      onChange={(e) => handleUnitChange('length', e.target.value)}
                      className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 outline-none focus:border-blue-500 cursor-pointer h-6 font-mono"
                    >
                      <option value="m">meter (m)</option>
                      <option value="cm">centimeter (cm)</option>
                      <option value="mm">millimeter (mm)</option>
                      <option value="ft">feet (ft)</option>
                      <option value="in">inch (in)</option>
                    </select>
                  </div>
                  <div className="relative flex items-center">
                    <NumericInput 
                      key={`${calculatorId}-length`}
                      id="length-input" 
                      value={inputs.length ?? ''} 
                      onChange={(raw, num) => handleInputChange('length', num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                    />
                    <span className="absolute right-3 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
                      {paramUnits.length || (unitSystem === 'metric' ? 'm' : 'ft')}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="width-input" className="text-slate-600 font-semibold">Slab Width</label>
                    <select
                      key={`${calculatorId}-width-unit`}
                      value={paramUnits.width || (unitSystem === 'metric' ? 'm' : 'ft')}
                      onChange={(e) => handleUnitChange('width', e.target.value)}
                      className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 outline-none focus:border-blue-500 cursor-pointer h-6 font-mono"
                    >
                      <option value="m">meter (m)</option>
                      <option value="cm">centimeter (cm)</option>
                      <option value="mm">millimeter (mm)</option>
                      <option value="ft">feet (ft)</option>
                      <option value="in">inch (in)</option>
                    </select>
                  </div>
                  <div className="relative flex items-center">
                    <NumericInput 
                      key={`${calculatorId}-width`}
                      id="width-input" 
                      value={inputs.width ?? ''} 
                      onChange={(raw, num) => handleInputChange('width', num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                    />
                    <span className="absolute right-3 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
                      {paramUnits.width || (unitSystem === 'metric' ? 'm' : 'ft')}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="thickness-input" className="text-slate-600 font-semibold">Slab Thickness</label>
                    <select
                      key={`${calculatorId}-thickness-unit`}
                      value={paramUnits.thickness || (unitSystem === 'metric' ? 'mm' : 'in')}
                      onChange={(e) => handleUnitChange('thickness', e.target.value)}
                      className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 outline-none focus:border-blue-500 cursor-pointer h-6 font-mono"
                    >
                      <option value="m">meter (m)</option>
                      <option value="cm">centimeter (cm)</option>
                      <option value="mm">millimeter (mm)</option>
                      <option value="ft">feet (ft)</option>
                      <option value="in">inch (in)</option>
                    </select>
                  </div>
                  <div className="relative flex items-center">
                    <NumericInput 
                      key={`${calculatorId}-thickness`}
                      id="thickness-input" 
                      value={inputs.thickness ?? ''} 
                      onChange={(raw, num) => handleInputChange('thickness', num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                    />
                    <span className="absolute right-3 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
                      {paramUnits.thickness || (unitSystem === 'metric' ? 'mm' : 'in')}
                    </span>
                  </div>
                </div>
                <div>
                  <label htmlFor="mix-type-select" className="text-slate-600 mb-1 block font-semibold">Concrete Mix Grade / Ratio</label>
                  <select 
                    id="mix-type-select"
                    value={inputs.mixType ?? 'M20'}
                    onChange={e => handleMixTypeChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-805 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs font-sans text-xs"
                  >
                    <option value="M5">M5 (1 : 5 : 10) — Mass lean concrete</option>
                    <option value="M7.5">M7.5 (1 : 4 : 8) — Mass foundation</option>
                    <option value="M10">M10 (1 : 3 : 6) — Plain/pavement</option>
                    <option value="M15">M15 (1 : 2 : 4) — ordinary structural slabs</option>
                    <option value="M20">M20 (1 : 1.5 : 3) — standard reinforced beams & columns</option>
                    <option value="M25">M25 (1 : 1 : 2) — heavy high-strength structural</option>
                    <option value="custom">Custom Mix Ratio...</option>
                  </select>
                </div>

                {inputs.mixType === 'custom' && (
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 text-[10px] uppercase tracking-wider font-bold">Custom Volume Proportions</span>
                      <span className="font-mono text-emerald-600 font-bold text-xs bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                        {inputs.cementRatio ?? 1} : {inputs.sandRatio ?? 1.5} : {inputs.aggregateRatio ?? 3}
                      </span>
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[
                        { label: '1:1.5:3 (M20)', c: 1, s: 1.5, a: 3, wc: 0.50 },
                        { label: '1:2:4 (M15)', c: 1, s: 2, a: 4, wc: 0.50 },
                        { label: '1:1:2 (M25)', c: 1, s: 1, a: 2, wc: 0.45 },
                        { label: '1:3:6 (M10)', c: 1, s: 3, a: 6, wc: 0.55 },
                        { label: '1:4:8 (M7.5)', c: 1, s: 4, a: 8, wc: 0.55 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setInputs(prev => ({
                              ...prev,
                              cementRatio: preset.c,
                              sandRatio: preset.s,
                              aggregateRatio: preset.a,
                              waterCementRatio: preset.wc,
                              customMixString: `${preset.c}:${preset.s}:${preset.a}`
                            }));
                          }}
                          className="px-2 py-1 rounded-lg bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-[10px] font-mono text-slate-700 font-semibold cursor-pointer transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Direct Ratio String Input */}
                    <div>
                      <label htmlFor="custom-ratio-str" className="text-slate-600 block mb-1 text-[10px] font-semibold">
                        Ratio String (Cement : Sand : Aggregates)
                      </label>
                      <input
                        id="custom-ratio-str"
                        type="text"
                        placeholder="e.g. 1:2:4 or 1:1.5:3"
                        value={inputs.customMixString ?? `${inputs.cementRatio ?? 1}:${inputs.sandRatio ?? 1.5}:${inputs.aggregateRatio ?? 3}`}
                        onChange={e => handleCustomMixStringChange(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] font-mono text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label htmlFor="custom-cement-input" className="text-slate-600 block mb-1 text-[10px] font-semibold">Cement Part (C)</label>
                        <NumericInput
                          id="custom-cement-input"
                          step="0.1"
                          min="0.1"
                          value={inputs.cementRatio ?? 1}
                          onChange={(raw, num) => {
                            const val = num > 0 ? num : (raw === '' ? '' : num);
                            handleInputChange('cementRatio', val);
                          }}
                          variant="calcCenter"
                        />
                      </div>
                      <div>
                        <label htmlFor="custom-sand-input" className="text-slate-600 block mb-1 text-[10px] font-semibold">Sand Part (S)</label>
                        <NumericInput
                          id="custom-sand-input"
                          step="0.1"
                          min="0"
                          value={inputs.sandRatio ?? 1.5}
                          onChange={(raw, num) => {
                            const val = raw === '' ? '' : num;
                            handleInputChange('sandRatio', val);
                          }}
                          variant="calcCenter"
                        />
                      </div>
                      <div>
                        <label htmlFor="custom-aggregate-input" className="text-slate-600 block mb-1 text-[10px] font-semibold">Agg. Part (A)</label>
                        <NumericInput
                          id="custom-aggregate-input"
                          step="0.1"
                          min="0"
                          value={inputs.aggregateRatio ?? 3}
                          onChange={(raw, num) => {
                            const val = raw === '' ? '' : num;
                            handleInputChange('aggregateRatio', val);
                          }}
                          variant="calcCenter"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="custom-wc-ratio" className="text-slate-600 text-[10px] font-semibold">Water-Cement Ratio (w/c)</label>
                        <span className="text-[9px] text-slate-400 font-mono">Typically 0.40 – 0.60</span>
                      </div>
                      <NumericInput
                        id="custom-wc-ratio"
                        step="0.05"
                        min="0.3"
                        max="0.8"
                        value={inputs.waterCementRatio ?? 0.50}
                        onChange={(raw, num) => handleInputChange('waterCementRatio', raw === '' ? '' : num)}
                        variant="none"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 outline-none focus:border-[#0A84FF] text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="shrinkage-input" className="truncate font-semibold text-slate-705 text-xs">Shrinkage Factor</label>
                      <select
                        value={inputs.shrinkageInputType || 'percentage'}
                        onChange={e => handleInputChange('shrinkageInputType', e.target.value)}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-[9px] font-sans font-bold rounded-md border border-slate-200 px-1 py-0.5 outline-hidden cursor-pointer"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="multiplier">Multiplier (x)</option>
                      </select>
                    </div>
                    { (inputs.shrinkageInputType || 'percentage') === 'multiplier' ? (
                      <>
                        <div className="relative">
                          <NumericInput 
                            key={`${calculatorId}-shrinkageMultiplier`}
                            id="shrinkage-input" 
                            step="0.01"
                            value={inputs.shrinkageMultiplier ?? ''} 
                            onChange={(raw, num) => {
                              const val = num;
                              handleInputChange('shrinkageMultiplier', isNaN(val) ? 0 : val);
                            }}
                            variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-[13px] text-slate-800 outline-hidden focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-xs"
                            title="Dry Volume multiplier factor of concrete when converting wet volume to dry mix (usually 1.54)."
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold font-mono">x</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">Multiplier Factor (Std 1.54)</p>
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <NumericInput 
                            key={`${calculatorId}-shrinkagePercent`}
                            id="shrinkage-input" 
                            value={inputs.shrinkagePercent ?? ''} 
                            onChange={(raw, num) => {
                              const val = num;
                              handleInputChange('shrinkagePercent', isNaN(val) ? 0 : val);
                            }}
                            variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-[13px] text-slate-800 outline-hidden focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-xs"
                            title="Shrinkage factor of concrete when converting wet volume to dry mix (usually 54%)."
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold font-mono">%</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">Wet-to-dry (Std 54%)</p>
                      </>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="wastepercent-input" className="truncate font-semibold">Wastage Ratio</label>
                      <span className="text-slate-500">%</span>
                    </div>
                    <NumericInput 
                      key={`${calculatorId}-wastePercent`}
                      id="wastepercent-input" 
                      value={inputs.wastePercent ?? ''} 
                      onChange={(raw, num) => handleInputChange('wastePercent', num)}
                      variant="calc"
                      title="Wastage during casting on-site (Std 10%)."
                    />
                    <p className="text-[9px] text-slate-400 mt-1">Site waste (Std 10%)</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <label htmlFor="unitcost-input">Unit Cost</label>
                    <span className="text-slate-500">{currencySymbol} / {unitSystem === 'metric' ? 'm³' : 'yd³'}</span>
                  </div>
                  <NumericInput 
                    key={`${calculatorId}-unitCost`}
                    id="unitcost-input" 
                    value={inputs.unitCost ?? ''} 
                    onChange={(raw, num) => handleInputChange('unitCost', num)}
                    variant="none" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-emerald-600 font-bold outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                  />
                </div>

                {/* Calculate & Reset Controls */}
                <div className="flex items-center gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('calculator-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#4C5FE0] hover:bg-[#3B47B8] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Calculate</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetToDefaults}
                    className="py-2.5 px-4 rounded-xl backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] hover:border-[#7C88B8] text-[#161A2C] dark:text-[#E7EAF7] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#7C88B8]" />
                    <span>Reset</span>
                  </button>
                </div>
              </>
            )}

            {(calculatorId === 'structural-beam' || calculatorId === 'structural-deflection') && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="span-input" className="text-slate-600 font-semibold">Beam Span (Length)</label>
                    <select
                      key={`${calculatorId}-span-unit`}
                      value={paramUnits.span || (unitSystem === 'metric' ? 'm' : 'ft')}
                      onChange={(e) => handleUnitChange('span', e.target.value)}
                      className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 outline-none focus:border-blue-500 cursor-pointer h-6 font-mono"
                    >
                      <option value="m">meter (m)</option>
                      <option value="cm">centimeter (cm)</option>
                      <option value="mm">millimeter (mm)</option>
                      <option value="ft">feet (ft)</option>
                      <option value="in">inch (in)</option>
                    </select>
                  </div>
                  <div className="relative flex items-center">
                    <NumericInput 
                      key={`${calculatorId}-span`}
                      id="span-input" 
                      value={inputs.span ?? ''} 
                      onChange={(raw, num) => handleInputChange('span', num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                    />
                    <span className="absolute right-3 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
                      {paramUnits.span || (unitSystem === 'metric' ? 'm' : 'ft')}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <label htmlFor="load-input">Applied Load</label>
                    <span className="text-slate-500">{inputs.loadType === 'udl' ? (unitSystem === 'metric' ? 'kN/m' : 'klf') : (unitSystem === 'metric' ? 'kN' : 'kips')}</span>
                  </div>
                  <NumericInput 
                    key={`${calculatorId}-load`}
                    id="load-input" 
                    value={inputs.load ?? ''} 
                    onChange={(raw, num) => handleInputChange('load', num)}
                    variant="calc"
                  />
                </div>
                <div>
                  <span className="text-slate-600 mb-1 block">Load Arrangement</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      key={`${calculatorId}-loadType-udl`}
                      onClick={() => handleInputChange('loadType', 'udl')}
                      className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${inputs.loadType === 'udl' ? 'border-[#0A84FF] bg-[#0A84FF]/10 text-[#0A84FF] font-semibold' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'}`}
                    >
                      Uniform UDL
                    </button>
                    <button 
                      key={`${calculatorId}-loadType-point`}
                      onClick={() => handleInputChange('loadType', 'point')}
                      className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${inputs.loadType === 'point' ? 'border-[#0A84FF] bg-[#0A84FF]/10 text-[#0A84FF] font-semibold' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'}`}
                    >
                      Center Point
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 mb-1 block">Steel / Concrete Material</span>
                  <select 
                    key={`${calculatorId}-materialIdx`}
                    value={inputs.materialIdx ?? 0}
                    onChange={e => handleInputChange('materialIdx', parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                  >
                    {(unitSystem === 'metric' ? METRIC_MATERIALS : IMPERIAL_MATERIALS).map((mat, i) => (
                      <option key={i} value={i}>{mat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <label htmlFor="inertia-input">Moment of Inertia (I)</label>
                    <span className="text-slate-500">{unitSystem === 'metric' ? 'cm⁴' : 'in⁴'}</span>
                  </div>
                  <NumericInput 
                    key={`${calculatorId}-inertia`} 
                    value={inputs.inertia ?? ''} 
                    onChange={(raw, num) => handleInputChange('inertia', num || 1)}
                    variant="calc"
                  />
                </div>
              </>
            )}

            {calculatorId === 'structural-column' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="width-input-col" className="text-slate-600 font-semibold truncate">Width (b)</label>
                      <select
                        key={`${calculatorId}-width-unit`}
                        value={paramUnits.width || (unitSystem === 'metric' ? 'mm' : 'in')}
                        onChange={(e) => handleUnitChange('width', e.target.value)}
                        className="text-[9px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 outline-none focus:border-blue-500 cursor-pointer font-mono"
                      >
                        <option value="m">m</option>
                        <option value="cm">cm</option>
                        <option value="mm">mm</option>
                        <option value="ft">ft</option>
                        <option value="in">in</option>
                      </select>
                    </div>
                    <div className="relative flex items-center">
                      <NumericInput 
                        key={`${calculatorId}-width`}
                        id="width-input-col" 
                        value={inputs.width ?? ''} 
                        onChange={(raw, num) => handleInputChange('width', num)}
                        variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                      />
                      <span className="absolute right-2 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
                        {paramUnits.width || (unitSystem === 'metric' ? 'mm' : 'in')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="depth-input-col" className="text-slate-600 font-semibold truncate">Depth (h)</label>
                      <select
                        key={`${calculatorId}-depth-unit`}
                        value={paramUnits.depth || (unitSystem === 'metric' ? 'mm' : 'in')}
                        onChange={(e) => handleUnitChange('depth', e.target.value)}
                        className="text-[9px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 outline-none focus:border-blue-500 cursor-pointer font-mono"
                      >
                        <option value="m">m</option>
                        <option value="cm">cm</option>
                        <option value="mm">mm</option>
                        <option value="ft">ft</option>
                        <option value="in">in</option>
                      </select>
                    </div>
                    <div className="relative flex items-center">
                      <NumericInput 
                        key={`${calculatorId}-depth`}
                        id="depth-input-col" 
                        value={inputs.depth ?? ''} 
                        onChange={(raw, num) => handleInputChange('depth', num)}
                        variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                      />
                      <span className="absolute right-2 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
                        {paramUnits.depth || (unitSystem === 'metric' ? 'mm' : 'in')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="fc-input" className="text-slate-600 mb-1 block">Concrete f'c ({unitSystem === 'metric' ? 'MPa' : 'psi'})</label>
                    <NumericInput 
                      key={`${calculatorId}-fc`}
                      id="fc-input" 
                      value={inputs.fc ?? ''} 
                      onChange={(raw, num) => handleInputChange('fc', num)}
                      variant="calc"
                    />
                  </div>
                  <div>
                    <label htmlFor="fy-input" className="text-slate-600 mb-1 block">Rebar Yield fy ({unitSystem === 'metric' ? 'MPa' : 'psi'})</label>
                    <NumericInput 
                      key={`${calculatorId}-fy`}
                      id="fy-input" 
                      value={inputs.fy ?? ''} 
                      onChange={(raw, num) => handleInputChange('fy', num)}
                      variant="calc"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 mb-1 block">Longitudinal Bars count</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[4, 6, 8].map(count => (
                      <button 
                        key={`${calculatorId}-barCount-${count}`}
                        onClick={() => handleInputChange('barCount', count)}
                        className={`py-1.5 rounded-xl border text-center transition-all cursor-pointer ${inputs.barCount === count ? 'border-emerald-500 bg-emerald-50 text-emerald-600 font-bold' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800 shadow-2xs'}`}
                      >
                        {count} Bars
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="bardiameter-input" className="text-slate-600 font-semibold">Bar Diameter (db)</label>
                    <select
                      key={`${calculatorId}-barDiameter-unit`}
                      value={paramUnits.barDiameter || (unitSystem === 'metric' ? 'mm' : 'in')}
                      onChange={(e) => handleUnitChange('barDiameter', e.target.value)}
                      className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 outline-none focus:border-blue-500 cursor-pointer h-6 font-mono"
                    >
                      <option value="m">meter (m)</option>
                      <option value="cm">centimeter (cm)</option>
                      <option value="mm">millimeter (mm)</option>
                      <option value="ft">feet (ft)</option>
                      <option value="in">inch (in)</option>
                    </select>
                  </div>
                  <div className="relative flex items-center">
                    <NumericInput 
                      key={`${calculatorId}-barDiameter`}
                      id="bardiameter-input" 
                      step="any"
                      value={inputs.barDiameter ?? ''} 
                      onChange={(raw, num) => handleInputChange('barDiameter', num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                    />
                    <span className="absolute right-3 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
                      {paramUnits.barDiameter || (unitSystem === 'metric' ? 'mm' : 'in')}
                    </span>
                  </div>
                </div>
              </>
            )}

            {calculatorId === 'structural-slab' && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="span-input-slab" className="text-slate-600 font-semibold">Longest Span</label>
                    <select
                      key={`${calculatorId}-span-unit`}
                      value={paramUnits.span || (unitSystem === 'metric' ? 'm' : 'ft')}
                      onChange={(e) => handleUnitChange('span', e.target.value)}
                      className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 outline-none focus:border-blue-500 cursor-pointer h-6 font-mono"
                    >
                      <option value="m">meter (m)</option>
                      <option value="cm">centimeter (cm)</option>
                      <option value="mm">millimeter (mm)</option>
                      <option value="ft">feet (ft)</option>
                      <option value="in">inch (in)</option>
                    </select>
                  </div>
                  <div className="relative flex items-center">
                    <NumericInput 
                      key={`${calculatorId}-span`}
                      id="span-input-slab" 
                      value={inputs.span ?? ''} 
                      onChange={(raw, num) => handleInputChange('span', num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                    />
                    <span className="absolute right-3 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
                      {paramUnits.span || (unitSystem === 'metric' ? 'm' : 'ft')}
                    </span>
                  </div>
                </div>
                <div>
                  <label htmlFor="slab-support-select" className="text-slate-600 mb-1 block font-semibold">Boundary Continuity</label>
                  <select 
                    id="slab-support-select"
                    key={`${calculatorId}-supportType`}
                    value={inputs.supportType ?? 'simple'}
                    onChange={e => handleInputChange('supportType', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                  >
                    <option value="simple">Simply Supported (Flat Deck)</option>
                    <option value="one-continuous">One End Continuous</option>
                    <option value="both-continuous">Both Ends Continuous</option>
                    <option value="cantilever">Cantilever Edge</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <label htmlFor="fy-slab-input" className="font-semibold">Steel yield fy ({unitSystem === 'metric' ? 'MPa' : 'psi'})</label>
                  </div>
                  <NumericInput 
                    key={`${calculatorId}-fy`}
                    id="fy-slab-input" 
                    value={inputs.fy ?? ''} 
                    onChange={(raw, num) => handleInputChange('fy', num || 420)}
                    variant="calc"
                  />
                </div>
              </>
            )}

            {calculatorId === 'geotech-bearing' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="bg-input" className="text-slate-600 font-semibold truncate">Footing B</label>
                      <select
                        key={`${calculatorId}-bg-unit`}
                        value={paramUnits.bg || (unitSystem === 'metric' ? 'm' : 'ft')}
                        onChange={(e) => handleUnitChange('bg', e.target.value)}
                        className="text-[9px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 outline-none focus:border-blue-500 cursor-pointer font-mono"
                      >
                        <option value="m">m</option>
                        <option value="cm">cm</option>
                        <option value="mm">mm</option>
                        <option value="ft">ft</option>
                        <option value="in">in</option>
                      </select>
                    </div>
                    <div className="relative flex items-center">
                      <NumericInput 
                        key={`${calculatorId}-bg`}
                        id="bg-input" 
                        value={inputs.bg ?? ''} 
                        onChange={(raw, num) => handleInputChange('bg', num || 1.0)}
                        variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                      />
                      <span className="absolute right-2 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
                        {paramUnits.bg || (unitSystem === 'metric' ? 'm' : 'ft')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="lg-input" className="text-slate-600 font-semibold truncate">Footing L</label>
                      <select
                        key={`${calculatorId}-lg-unit`}
                        value={paramUnits.lg || (unitSystem === 'metric' ? 'm' : 'ft')}
                        onChange={(e) => handleUnitChange('lg', e.target.value)}
                        className="text-[9px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 outline-none focus:border-blue-500 cursor-pointer font-mono"
                      >
                        <option value="m">m</option>
                        <option value="cm">cm</option>
                        <option value="mm">mm</option>
                        <option value="ft">ft</option>
                        <option value="in">in</option>
                      </select>
                    </div>
                    <div className="relative flex items-center">
                      <NumericInput 
                        key={`${calculatorId}-lg`}
                        id="lg-input" 
                        value={inputs.lg ?? ''} 
                        onChange={(raw, num) => handleInputChange('lg', num || 1.0)}
                        variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                      />
                      <span className="absolute right-2 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
                        {paramUnits.lg || (unitSystem === 'metric' ? 'm' : 'ft')}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="df-input" className="text-slate-600 font-semibold">Foundation Depth Df</label>
                    <select
                      key={`${calculatorId}-df-unit`}
                      value={paramUnits.df || (unitSystem === 'metric' ? 'm' : 'ft')}
                      onChange={(e) => handleUnitChange('df', e.target.value)}
                      className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 outline-none focus:border-blue-500 cursor-pointer h-6 font-mono"
                    >
                      <option value="m">meter (m)</option>
                      <option value="cm">centimeter (cm)</option>
                      <option value="mm">millimeter (mm)</option>
                      <option value="ft">feet (ft)</option>
                      <option value="in">inch (in)</option>
                    </select>
                  </div>
                  <div className="relative flex items-center">
                    <NumericInput 
                      key={`${calculatorId}-df`}
                      id="df-input" 
                      value={inputs.df ?? ''} 
                      onChange={(raw, num) => handleInputChange('df', num || 0.0)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                    />
                    <span className="absolute right-3 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
                      {paramUnits.df || (unitSystem === 'metric' ? 'm' : 'ft')}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="cohesion-input" className="text-slate-600 mb-1 block">Cohesion c ({unitSystem === 'metric' ? 'kPa' : 'psf'})</label>
                    <NumericInput 
                      key={`${calculatorId}-cohesion`}
                      id="cohesion-input" 
                      value={inputs.cohesion ?? ''} 
                      onChange={(raw, num) => handleInputChange('cohesion', num)}
                      variant="calc"
                    />
                  </div>
                  <div>
                    <label htmlFor="phi-input" className="text-slate-600 mb-1 block">Friction Angle (deg)</label>
                    <NumericInput 
                      key={`${calculatorId}-phi`}
                      id="phi-input" 
                      value={inputs.phi ?? ''} 
                      max="48"
                      onChange={(raw, num) => handleInputChange('phi', num)}
                      variant="calc"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="unitweight-input" className="text-slate-600 mb-1 block">Soil Gamma ({unitSystem === 'metric' ? 'kN/m³' : 'pcf'})</label>
                    <NumericInput 
                      key={`${calculatorId}-unitWeight`}
                      id="unitweight-input" 
                      value={inputs.unitWeight ?? ''} 
                      onChange={(raw, num) => handleInputChange('unitWeight', num)}
                      variant="calc"
                    />
                  </div>
                  <div>
                    <label htmlFor="safetyfactor-input" className="text-slate-600 mb-1 block">Safety Factor FS</label>
                    <NumericInput 
                      key={`${calculatorId}-safetyFactor`}
                      id="safetyfactor-input" 
                      step="0.1"
                      value={inputs.safetyFactor ?? 3.0} 
                      onChange={(raw, num) => handleInputChange('safetyFactor', num || 3.0)}
                      variant="calc"
                    />
                  </div>
                </div>
              </>
            )}

            {calculatorId === 'geotech-retaining' && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="height-wall-input" className="text-slate-600 font-semibold">Wall Height (H)</label>
                    <select
                      key={`${calculatorId}-height-unit`}
                      value={paramUnits.height || (unitSystem === 'metric' ? 'm' : 'ft')}
                      onChange={(e) => handleUnitChange('height', e.target.value)}
                      className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 outline-none focus:border-blue-500 cursor-pointer h-6 font-mono"
                    >
                      <option value="m">meter (m)</option>
                      <option value="cm">centimeter (cm)</option>
                      <option value="mm">millimeter (mm)</option>
                      <option value="ft">feet (ft)</option>
                      <option value="in">inch (in)</option>
                    </select>
                  </div>
                  <div className="relative flex items-center">
                    <NumericInput 
                      key={`${calculatorId}-height`}
                      id="height-wall-input" 
                      value={inputs.height ?? ''} 
                      onChange={(raw, num) => handleInputChange('height', num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                    />
                    <span className="absolute right-3 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
                      {paramUnits.height || (unitSystem === 'metric' ? 'm' : 'ft')}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <label htmlFor="frictionangle-wall-input">Soil Friction (phi)</label>
                    <span className="text-slate-500 font-sans">Degrees</span>
                  </div>
                  <NumericInput 
                    key={`${calculatorId}-frictionAngle`}
                    id="frictionangle-wall-input" 
                    value={inputs.frictionAngle ?? ''} 
                    onChange={(raw, num) => handleInputChange('frictionAngle', num)}
                    variant="calc"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <label htmlFor="unitweight-wall-input">Soil Unit Weight Gamma</label>
                    <span className="text-slate-500">{unitSystem === 'metric' ? 'kN/m³' : 'lb/ft³'}</span>
                  </div>
                  <NumericInput 
                    key={`${calculatorId}-unitWeight`}
                    id="unitweight-wall-input" 
                    value={inputs.unitWeight ?? ''} 
                    onChange={(raw, num) => handleInputChange('unitWeight', num)}
                    variant="calc"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <label htmlFor="backfillslope-input">Backfill Slope angle</label>
                    <span className="text-slate-500 font-sans">Degrees (Normally 0)</span>
                  </div>
                  <NumericInput 
                    key={`${calculatorId}-backfillSlope`}
                    id="backfillslope-input" 
                    value={inputs.backfillSlope ?? 0} 
                    onChange={(raw, num) => handleInputChange('backfillSlope', num)}
                    variant="calc"
                  />
                </div>
              </>
            )}

            {calculatorId === 'survey-hi' && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-3xs">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="starting-rl-input" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Starting BM Elevation (Reference RL)</label>
                    <span className="text-[10px] text-[#0A84FF] font-sans font-bold bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                      {unitSystem === 'metric' ? 'meters (m)' : 'feet (ft)'}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <NumericInput 
                      id="starting-rl-input" 
                      step="0.001"
                      value={startingRL} 
                      onChange={(raw, num) => setStartingRL(num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] font-mono text-sm font-semibold"
                    />
                    <span className="absolute right-3 text-[10px] uppercase text-slate-400 pointer-events-none font-bold">
                      {unitSystem === 'metric' ? 'm' : 'ft'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Initial Reduced Level elevation (e.g. from known Benchmark monument BM_A).</p>
                </div>

                {/* DUAL VIEW LAYOUT SWITCHER & RESET CONTROLS */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-100/80 p-3 rounded-xl border border-slate-200 gap-3.5 shadow-3xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-extrabold text-slate-500 font-mono">View Layout:</span>
                    <div className="flex bg-white border border-slate-150 rounded-lg p-0.5 shadow-3xs gap-1">
                      <button
                        type="button"
                        onClick={() => setSurveyViewMode('table')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${surveyViewMode === 'table' ? 'bg-[#0A84FF] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <FileSpreadsheet className="w-3 h-3" /> Tabular Grid
                      </button>
                      <button
                        type="button"
                        onClick={() => setSurveyViewMode('cards')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${surveyViewMode === 'cards' ? 'bg-[#0A84FF] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Layers className="w-3 h-3" /> Stacked Cards
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setStartingRL(520.455);
                        setSurveyRows([
                          { station: 'A', distance: 0, bs: 0.585, is: null, fs: null, remarks: 'Mark' },
                          { station: '', distance: 30, bs: null, is: 0.936, fs: null, remarks: '' },
                          { station: '', distance: 60, bs: null, is: 1.953, fs: null, remarks: '' },
                          { station: '', distance: 90, bs: null, is: 2.846, fs: null, remarks: '' },
                          { station: '', distance: 120, bs: null, is: 3.644, fs: null, remarks: '' },
                          { station: '', distance: 150, bs: 0.962, is: null, fs: 3.938, remarks: 'CP1' },
                          { station: '', distance: 180, bs: null, is: 1.035, fs: null, remarks: '' },
                          { station: '', distance: 210, bs: null, is: 1.689, fs: null, remarks: '' },
                          { station: '', distance: 240, bs: null, is: 2.534, fs: null, remarks: '' },
                          { station: '', distance: 270, bs: 0.956, is: null, fs: 3.844, remarks: 'CP2' },
                          { station: '', distance: 300, bs: null, is: 1.589, fs: null, remarks: '' },
                          { station: 'B', distance: 330, bs: null, is: null, fs: 3.016, remarks: '' },
                        ]);
                      }}
                      className="text-[10px] bg-white border border-slate-250 hover:bg-slate-50 transition-all font-bold rounded-lg px-3 py-1.5 text-slate-705 shadow-3xs cursor-pointer"
                    >
                      Reset to Image Example
                    </button>
                  </div>
                </div>

                {/* VIEW 1: TABULAR SURVEY FIELD BOOK */}
                {surveyViewMode === 'table' && (
                  <div className="space-y-1.5 animate-fade-in">
                    {/* Responsive Swipe Helper indicator */}
                    <div className="xl:hidden flex items-center justify-between gap-2 text-[10px] font-mono text-slate-450 py-1.5 px-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        <span>Responsive Table</span>
                      </span>
                      <span>Swipe horizontally ⇄ to edit all columns</span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200/80 rounded-xl shadow-2xs bg-white scrollbar-thin">
                      <table className="w-full text-left border-collapse table-fixed min-w-[720px] sm:min-w-[780px]">
                        <thead>
                          <tr className="bg-[#FFFF33] text-slate-900 border-b border-slate-200">
                            <th className="p-2 py-2.5 text-center text-[10px] font-extrabold uppercase w-[10%]">Station</th>
                            <th className="p-2 py-2.5 text-center text-[10px] font-extrabold uppercase w-[10%]">Dist ({unitSystem === 'metric' ? 'm' : 'ft'})</th>
                            <th className="p-2 py-2.5 text-center text-[10px] font-extrabold uppercase w-[11%] border-l border-slate-200 border-r text-blue-800">BS (+)</th>
                            <th className="p-2 py-2.5 text-center text-[10px] font-extrabold uppercase w-[12%] border-r text-slate-700 bg-slate-100/50 font-mono">HI (CALC)</th>
                            <th className="p-2 py-2.5 text-center text-[10px] font-extrabold uppercase w-[11%] border-r">IS</th>
                            <th className="p-2 py-2.5 text-center text-[10px] font-extrabold uppercase w-[11%] border-r text-red-800">FS (-)</th>
                            <th className="p-2 py-2.5 text-center text-[10px] font-extrabold uppercase w-[12%] border-r text-emerald-850 bg-emerald-100/30 font-mono">RL (CALC)</th>
                            <th className="p-2 py-2.5 text-center text-[10px] font-extrabold uppercase w-[15%]">Remarks</th>
                            <th className="p-2 py-2.5 text-center text-[10px] font-extrabold uppercase w-[8%]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {surveyRows.map((row, idx) => {
                            const calculatedRow = outputs.rows?.[idx];
                            return (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="p-1 px-1.5">
                                  <input 
                                    type="text"
                                    value={row.station}
                                    onChange={e => handleUpdateSurveyRow(idx, 'station', e.target.value)}
                                    placeholder="stn"
                                    className="w-full bg-transparent p-1 py-1.5 focus:bg-slate-100 rounded text-center font-bold text-slate-800 outline-none text-xs border border-transparent focus:border-slate-300"
                                  />
                                </td>
                                <td className="p-1 px-1.5">
                                  <NumericInput
                                    value={row.distance}
                                    onChange={(raw, num) => handleUpdateSurveyRow(idx, 'distance', raw === '' ? '' : num)}
                                    variant="none" className="w-full bg-transparent p-1 py-1.5 focus:bg-slate-100 rounded text-center text-slate-700 outline-none text-xs font-mono border border-transparent focus:border-slate-300"
                                  />
                                </td>
                                <td className="p-1 px-1.5 bg-blue-50/10 border-l border-slate-100 border-r">
                                  <NumericInput
                                    step="0.001"
                                    value={row.bs === null ? '' : row.bs}
                                    onChange={(raw, num) => handleUpdateSurveyRow(idx, 'bs', raw !== '' ? num : null)}
                                    placeholder="-"
                                    variant="none" className="w-full bg-transparent p-1 py-1.5 focus:bg-blue-50 rounded text-center text-blue-700 font-bold outline-none text-xs font-mono border border-transparent focus:border-slate-300"
                                  />
                                </td>
                                {/* HI column (Calculated) */}
                                <td className="p-1 px-1.5 bg-slate-50 border-r text-center font-mono text-xs font-bold text-slate-650 bg-slate-100/30">
                                  {calculatedRow?.hi !== undefined && calculatedRow.hi !== null ? calculatedRow.hi.toFixed(3) : '-'}
                                </td>
                                <td className="p-1 px-1.5 border-r">
                                  <NumericInput
                                    step="0.001"
                                    value={row.is === null ? '' : row.is}
                                    onChange={(raw, num) => handleUpdateSurveyRow(idx, 'is', raw !== '' ? num : null)}
                                    placeholder="-"
                                    variant="none" className="w-full bg-transparent p-1 py-1.5 focus:bg-slate-100 rounded text-center text-slate-700 outline-none text-xs font-mono border border-transparent focus:border-slate-300"
                                  />
                                </td>
                                <td className="p-1 px-1.5 border-r bg-red-50/10">
                                  <NumericInput
                                    step="0.001"
                                    value={row.fs === null ? '' : row.fs}
                                    onChange={(raw, num) => handleUpdateSurveyRow(idx, 'fs', raw !== '' ? num : null)}
                                    placeholder="-"
                                    variant="none" className="w-full bg-transparent p-1 py-1.5 focus:bg-red-50 rounded text-center text-red-650 font-bold outline-none text-xs font-mono border border-transparent focus:border-slate-300"
                                  />
                                </td>
                                {/* RL column (Calculated) */}
                                <td className="p-1 px-1.5 bg-emerald-50/60 border-r text-center font-mono text-xs font-bold text-emerald-800">
                                  {calculatedRow?.rl !== undefined && calculatedRow.rl !== null ? calculatedRow.rl.toFixed(3) : '-'}
                                </td>
                                <td className="p-1 px-1.5">
                                  <input 
                                    type="text"
                                    value={row.remarks}
                                    onChange={e => handleUpdateSurveyRow(idx, 'remarks', e.target.value)}
                                    placeholder="..."
                                    className="w-full bg-transparent p-1 py-1.5 focus:bg-slate-100 rounded text-slate-800 outline-none text-xs border border-transparent focus:border-slate-300"
                                  />
                                </td>
                                <td className="p-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSurveyRow(idx)}
                                    disabled={surveyRows.length <= 1}
                                    className="text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400 p-1.5 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* VIEW 2: STACKED CARDS FOR MOBILE VIEWS */}
                {surveyViewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    {surveyRows.map((row, idx) => {
                      const calculatedRow = outputs.rows?.[idx];
                      return (
                        <div key={idx} className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 shadow-3xs space-y-3 relative overflow-hidden transition-all hover:border-blue-300">
                          {/* Card Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-mono font-black flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Stn:</span>
                                <input 
                                  type="text"
                                  value={row.station}
                                  onChange={e => handleUpdateSurveyRow(idx, 'station', e.target.value)}
                                  placeholder="e.g. A"
                                  className="bg-slate-50 rounded px-2 py-0.5 font-sans font-bold text-slate-800 outline-none text-xs border border-transparent focus:border-slate-300 focus:bg-white w-20"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSurveyRow(idx)}
                              disabled={surveyRows.length <= 1}
                              className="text-slate-400 hover:text-red-500 disabled:opacity-30 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Delete station row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Distance & Remarks Row */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-[9.5px] uppercase font-bold text-slate-450 block mb-1 font-sans">Distance ({unitSystem === 'metric' ? 'm' : 'ft'})</span>
                              <NumericInput
                                value={row.distance}
                                onChange={(raw, num) => handleUpdateSurveyRow(idx, 'distance', raw === '' ? '' : num)}
                                variant="none" className="w-full bg-slate-50 border border-slate-205 rounded-lg p-1.5 px-2.5 outline-none font-semibold text-slate-700 font-mono text-xs focus:border-[#0A84FF] focus:bg-white"
                              />
                            </div>
                            <div>
                              <span className="text-[9.5px] uppercase font-bold text-slate-455 block mb-1 font-sans">Remarks</span>
                              <input 
                                type="text"
                                value={row.remarks}
                                onChange={e => handleUpdateSurveyRow(idx, 'remarks', e.target.value)}
                                placeholder="Station notes..."
                                className="w-full bg-slate-50 border border-slate-205 rounded-lg p-1.5 px-2.5 outline-none text-slate-700 text-xs focus:border-[#0A84FF] focus:bg-white"
                              />
                            </div>
                          </div>

                          {/* Rod Readings grid (BS, IS, FS) */}
                          <div className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 grid grid-cols-3 gap-2 text-center">
                            <div>
                              <span className="text-[9px] uppercase font-extrabold text-blue-700 block mb-1 font-mono">BS (+)</span>
                              <NumericInput
                                step="0.001"
                                value={row.bs === null ? '' : row.bs}
                                onChange={(raw, num) => handleUpdateSurveyRow(idx, 'bs', raw !== '' ? num : null)}
                                placeholder="-"
                                variant="none" className="w-full bg-white border border-slate-200 rounded-lg py-1 px-1 text-center font-bold text-blue-800 font-mono text-xs outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-extrabold text-slate-500 block mb-1 font-mono">IS</span>
                              <NumericInput
                                step="0.001"
                                value={row.is === null ? '' : row.is}
                                onChange={(raw, num) => handleUpdateSurveyRow(idx, 'is', raw !== '' ? num : null)}
                                placeholder="-"
                                variant="none" className="w-full bg-white border border-slate-200 rounded-lg py-1 px-1 text-center font-bold text-slate-700 font-mono text-xs outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-extrabold text-red-700 block mb-1 font-mono">FS (-)</span>
                              <NumericInput
                                step="0.001"
                                value={row.fs === null ? '' : row.fs}
                                onChange={(raw, num) => handleUpdateSurveyRow(idx, 'fs', raw !== '' ? num : null)}
                                placeholder="-"
                                variant="none" className="w-full bg-white border border-slate-200 rounded-lg py-1 px-1 text-center font-bold text-red-650 font-mono text-xs outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          {/* Output calculations (HI & RL) */}
                          <div className="bg-slate-900 text-white rounded-xl p-2.5 px-3 flex justify-between items-center text-[10.5px] font-mono border border-slate-800 shadow-sm leading-tight">
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">HI (CALCULATED)</span>
                              <span className="font-bold text-[#FFFF33] text-xs">
                                {calculatedRow?.hi !== undefined && calculatedRow.hi !== null ? calculatedRow.hi.toFixed(3) : 'No HI'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-slate-400 uppercase font-black tracking-wider block">RL (REDUCED LEVEL)</span>
                              <span className="font-bold text-emerald-400 text-xs">
                                {calculatedRow?.rl !== undefined && calculatedRow.rl !== null ? calculatedRow.rl.toFixed(3) : 'No RL'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ADD / REMOVE SETUP ROW BLOCK ACTIONS */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddSurveyRow}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#0A84FF] hover:bg-[#0070E0] text-white rounded-xl py-3 font-bold text-xs transition-all shadow-md shadow-blue-500/15 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Station Setup Row
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSurveyRows(prev => prev.map(r => ({ ...r, bs: null, is: null, fs: null })));
                    }}
                    className="bg-slate-100 border border-slate-200 hover:bg-slate-150 text-slate-700 font-bold rounded-xl px-5 py-3 text-xs transition-all cursor-pointer"
                  >
                    Clear Readings
                  </button>
                </div>
              </div>
            )}

            {calculatorId === 'utility-convert' && (
              <>
                <div>
                  <label htmlFor="conv-cat-select" className="text-slate-600 mb-1 block">Category</label>
                  <select 
                    key={`${calculatorId}-convCategory`}
                    id="conv-cat-select"
                    value={convCategory}
                    onChange={e => handleConvCategoryChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] shadow-2xs"
                  >
                    {Object.keys(UNIT_CONVERSIONS).map((catKey) => (
                      <option key={catKey} value={catKey}>{UNIT_CONVERSIONS[catKey].name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <label htmlFor="convvalue-input">Input Value</label>
                  </div>
                  <NumericInput 
                    key={`${calculatorId}-convValue`}
                    id="convvalue-input" 
                    value={convValue ?? ''} 
                    onChange={(raw, num) => setConvValue(num)}
                    variant="calc"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="convfrom-select" className="text-slate-600 mb-1 block">Convert From</label>
                    <select 
                      key={`${calculatorId}-convFrom-${convCategory}`}
                      id="convfrom-select"
                      value={convFrom}
                      onChange={e => setConvFrom(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-slate-800 outline-none"
                    >
                      {UNIT_CONVERSIONS[convCategory].units.map((u) => (
                        <option key={u.symbol} value={u.symbol}>{u.name} ({u.symbol})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="convto-select" className="text-slate-600 mb-1 block">Convert To</label>
                    <select 
                      key={`${calculatorId}-convTo-${convCategory}`}
                      id="convto-select"
                      value={convTo}
                      onChange={e => setConvTo(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-slate-800 outline-none"
                    >
                      {UNIT_CONVERSIONS[convCategory].units.map((u) => (
                        <option key={u.symbol} value={u.symbol}>{u.name} ({u.symbol})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {calculatorId === 'survey-coordinate' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="nc-start-n">Start Northing (N₀)</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'm' : 'ft'}</span>
                    </div>
                    <NumericInput 
                      id="nc-start-n" 
                      value={inputs.startNorthing ?? ''} 
                      onChange={(raw, num) => handleInputChange('startNorthing', raw === '' ? '' : num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="nc-start-e">Start Easting (E₀)</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'm' : 'ft'}</span>
                    </div>
                    <NumericInput 
                      id="nc-start-e" 
                      value={inputs.startEasting ?? ''} 
                      onChange={(raw, num) => handleInputChange('startEasting', raw === '' ? '' : num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <label htmlFor="nc-start-z">Start Elevation (Z₀)</label>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'm' : 'ft'}</span>
                  </div>
                  <NumericInput 
                    id="nc-start-z" 
                    value={inputs.startElevation ?? ''} 
                    onChange={(raw, num) => handleInputChange('startElevation', raw === '' ? '' : num)}
                    variant="none" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <label htmlFor="nc-dist">Measured Distance (S)</label>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'm' : 'ft'}</span>
                  </div>
                  <NumericInput 
                    id="nc-dist" 
                    value={inputs.distance ?? ''} 
                    onChange={(raw, num) => handleInputChange('distance', raw === '' ? '' : num)}
                    variant="none" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="nc-bearing">Azimuth Bearing (θ)</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">deg</span>
                    </div>
                    <NumericInput 
                      id="nc-bearing" 
                      min="0"
                      max="360"
                      value={inputs.bearingDeg ?? ''} 
                      onChange={(raw, num) => handleInputChange('bearingDeg', raw === '' ? '' : num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="nc-vert-ang">Vertical Slope (α)</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">deg</span>
                    </div>
                    <NumericInput 
                      id="nc-vert-ang" 
                      min="-90"
                      max="90"
                      step="0.01"
                      value={inputs.verticalAngle ?? ''} 
                      onChange={(raw, num) => handleInputChange('verticalAngle', raw === '' ? '' : num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
                    />
                  </div>
                </div>
              </>
            )}

            {calculatorId === 'steel-calculator' && (
              <>
                <div>
                  <label htmlFor="sc-shape" className="text-slate-600 mb-1 block">Structural Steel Section</label>
                  <select 
                    id="sc-shape"
                    value={inputs.steelShape ?? 'plate'}
                    onChange={e => handleInputChange('steelShape', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
                  >
                    <option value="plate">Plate Member</option>
                    <option value="round">Solid Circular Rod</option>
                    <option value="pipe">Hollow Pipe Tube</option>
                    <option value="hbeam">Wide Flange / H-Beam</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="sc-len">Segment Length</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'm' : 'ft'}</span>
                    </div>
                    <NumericInput 
                      id="sc-len" 
                      value={inputs.length ?? ''} 
                      onChange={(raw, num) => handleInputChange('length', raw === '' ? '' : num)}
                      variant="calcMono"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="sc-wid">
                        {inputs.steelShape === 'plate' ? 'Plate Width' : inputs.steelShape === 'round' ? 'Rod Diameter' : inputs.steelShape === 'pipe' ? 'Outer Dia (OD)' : 'Flange Width (bf)'}
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                        {inputs.steelShape === 'plate' ? (unitSystem === 'metric' ? 'm' : 'ft') : (unitSystem === 'metric' ? 'mm' : 'in')}
                      </span>
                    </div>
                    <NumericInput 
                      id="sc-wid" 
                      value={inputs.width ?? ''} 
                      onChange={(raw, num) => handleInputChange('width', raw === '' ? '' : num)}
                      variant="calcMono"
                    />
                  </div>
                </div>

                {inputs.steelShape !== 'round' && (
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="sc-thick">
                        {inputs.steelShape === 'plate' ? 'Plate Thickness (t)' : inputs.steelShape === 'pipe' ? 'Wall Thickness (t)' : 'Flange Thickness (tf)'}
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'mm' : 'in'}</span>
                    </div>
                    <NumericInput 
                      id="sc-thick" 
                      value={inputs.thickness ?? ''} 
                      onChange={(raw, num) => handleInputChange('thickness', raw === '' ? '' : num)}
                      variant="calcMono"
                    />
                  </div>
                )}

                {inputs.steelShape === 'hbeam' && (
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="sc-depth">Total Web Depth (d)</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'mm' : 'in'}</span>
                    </div>
                    <NumericInput 
                      id="sc-depth" 
                      value={inputs.depth ?? ''} 
                      onChange={(raw, num) => handleInputChange('depth', raw === '' ? '' : num)}
                      variant="calcMono"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <label htmlFor="sc-qty">Batch Quantity</label>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">pcs</span>
                  </div>
                  <NumericInput 
                    id="sc-qty" 
                    value={inputs.quantity ?? ''} 
                    onChange={(raw, num) => handleInputChange('quantity', raw === '' ? '' : parseInt(raw))}
                    variant="calcPlain"
                  />
                </div>
              </>
            )}

            {calculatorId === 'rebar-calculator' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="rc-len">Concrete Length</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'm' : 'ft'}</span>
                    </div>
                    <NumericInput 
                      id="rc-len" 
                      value={inputs.elementLength ?? ''} 
                      onChange={(raw, num) => handleInputChange('elementLength', raw === '' ? '' : num)}
                      variant="calcPlain"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="rc-wid">Concrete Width</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'm' : 'ft'}</span>
                    </div>
                    <NumericInput 
                      id="rc-wid" 
                      value={inputs.elementWidth ?? ''} 
                      onChange={(raw, num) => handleInputChange('elementWidth', raw === '' ? '' : num)}
                      variant="calcPlain"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="rc-bar" className="text-slate-600 mb-1 block">Rebar Diameter</label>
                    {unitSystem === 'metric' ? (
                      <select 
                        id="rc-bar"
                        value={inputs.barSize ?? 12}
                        onChange={e => handleInputChange('barSize', parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                      >
                        <option value="10">Ø10 mm</option>
                        <option value="12">Ø12 mm</option>
                        <option value="16">Ø16 mm</option>
                        <option value="20">Ø20 mm</option>
                        <option value="25">Ø25 mm</option>
                        <option value="32">Ø32 mm</option>
                      </select>
                    ) : (
                      <select 
                        id="rc-bar"
                        value={inputs.barSize ?? 4}
                        onChange={e => handleInputChange('barSize', parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                      >
                        <option value="3">#3 (3/8")</option>
                        <option value="4">#4 (1/2")</option>
                        <option value="5">#5 (5/8")</option>
                        <option value="6">#6 (3/4")</option>
                        <option value="7">#7 (7/8")</option>
                        <option value="8">#8 (1")</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="rc-spacing">Grid Spacing</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'mm' : 'in'}</span>
                    </div>
                    <NumericInput 
                      id="rc-spacing" 
                      value={inputs.spacing ?? ''} 
                      onChange={(raw, num) => handleInputChange('spacing', raw === '' ? '' : num)}
                      variant="calcPlain"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="rc-lap">Lap Splice</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">dia</span>
                    </div>
                    <NumericInput 
                      id="rc-lap" 
                      value={inputs.lapSplice ?? 40} 
                      onChange={(raw, num) => handleInputChange('lapSplice', raw === '' ? '' : parseInt(raw))}
                      variant="calcPlain"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="rc-cover">Clear Cover</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'mm' : 'in'}</span>
                    </div>
                    <NumericInput 
                      id="rc-cover" 
                      value={inputs.concreteCover ?? ''} 
                      onChange={(raw, num) => handleInputChange('concreteCover', raw === '' ? '' : num)}
                      variant="calcPlain"
                    />
                  </div>
                </div>
              </>
            )}

            {calculatorId === 'brick-calculator' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="bc-wall-len">Wall Length</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'm' : 'ft'}</span>
                    </div>
                    <NumericInput 
                      id="bc-wall-len" 
                      value={inputs.wallLength ?? ''} 
                      onChange={(raw, num) => handleInputChange('wallLength', raw === '' ? '' : num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="bc-wall-hei">Wall Height</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'm' : 'ft'}</span>
                    </div>
                    <NumericInput 
                      id="bc-wall-hei" 
                      value={inputs.wallHeight ?? ''} 
                      onChange={(raw, num) => handleInputChange('wallHeight', raw === '' ? '' : num)}
                      variant="none" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <label htmlFor="bc-wall-thick">Wall Thickness</label>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'mm' : 'in'}</span>
                  </div>
                  <NumericInput 
                    id="bc-wall-thick" 
                    value={inputs.wallThickness ?? ''} 
                    onChange={(raw, num) => handleInputChange('wallThickness', raw === '' ? '' : num)}
                    variant="none" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none text-xs font-mono font-bold"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-3">
                  <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider block font-sans">Masonry unit (Brick) dimension</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="flex justify-between text-slate-500 mb-0.5">
                        <label htmlFor="bc-length" className="text-[9.5px]">Length</label>
                        <span className="text-[8px] font-mono leading-tight">{unitSystem === 'metric' ? 'mm' : 'in'}</span>
                      </div>
                      <NumericInput 
                        id="bc-length" 
                        value={inputs.brickLength ?? ''} 
                        onChange={(raw, num) => handleInputChange('brickLength', raw === '' ? '' : num)}
                        variant="calcXs"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-500 mb-0.5">
                        <label htmlFor="bc-width" className="text-[9.5px]">Width</label>
                        <span className="text-[8px] font-mono leading-tight">{unitSystem === 'metric' ? 'mm' : 'in'}</span>
                      </div>
                      <NumericInput 
                        id="bc-width" 
                        value={inputs.brickWidth ?? ''} 
                        onChange={(raw, num) => handleInputChange('brickWidth', raw === '' ? '' : num)}
                        variant="calcXs"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-505 mb-0.5">
                        <label htmlFor="bc-height" className="text-[9.5px]">Height</label>
                        <span className="text-[8px] font-mono leading-tight">{unitSystem === 'metric' ? 'mm' : 'in'}</span>
                      </div>
                      <NumericInput 
                        id="bc-height" 
                        value={inputs.brickHeight ?? ''} 
                        onChange={(raw, num) => handleInputChange('brickHeight', raw === '' ? '' : num)}
                        variant="calcXs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <label htmlFor="bc-joint">Mortar Joint</label>
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{unitSystem === 'metric' ? 'mm' : 'in'}</span>
                    </div>
                    <NumericInput 
                      id="bc-joint" 
                      step="0.1"
                      value={inputs.mortarJoint ?? ''} 
                      onChange={(raw, num) => handleInputChange('mortarJoint', raw === '' ? '' : num)}
                      variant="calcPlain"
                    />
                  </div>
                  <div>
                    <label htmlFor="bc-ratio" className="text-slate-600 mb-1 block">Mix Ratio (C:S)</label>
                    <select 
                      id="bc-ratio"
                      value={inputs.mixRatio ?? '1:4'}
                      onChange={e => handleInputChange('mixRatio', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-slate-800 outline-none text-xs"
                    >
                      <option value="1:3">1:3 (Rich Mix)</option>
                      <option value="1:4">1:4 (Standard)</option>
                      <option value="1:5">1:5 (Medium)</option>
                      <option value="1:6">1:6 (Lean Mix)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <label htmlFor="bc-waste">Brick/Mortar Waste</label>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">%</span>
                  </div>
                  <NumericInput 
                    id="bc-waste" 
                    value={inputs.wastePercent ?? 10} 
                    onChange={(raw, num) => handleInputChange('wastePercent', raw === '' ? '' : parseInt(raw))}
                    variant="calcPlain"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* BOTTOM: Action CTA Cards */}
        <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
          <button 
            id="tour-save-btn"
            onClick={handleSaveWorkspace}
            className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-slate-800 text-white font-sans text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-sm"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Saved to Dashboard!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#0A84FF]" />
                <span>Save Analysis Sheet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT: Results Display */}
      <div className={`${
        calculatorId === 'survey-hi'
          ? 'md:col-span-12 lg:col-span-4 w-full'
          : calculatorId === 'utility-convert'
          ? 'col-span-12 lg:col-span-6 w-full'
          : 'col-span-12 lg:col-span-5 xl:col-span-4 w-full'
      } bg-white/70 border border-slate-200 rounded-3xl p-4 sm:p-5 backdrop-blur-xl flex flex-col justify-between shadow-xs`} id="calculator-results">
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-2xs">
                <FileText className="w-4 h-4 text-emerald-600" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 font-sans tracking-tight">Report Results</h3>
                <p className="text-[10px] font-mono text-slate-500">COMPUTED LIMIT MATRIX</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {calculatorId !== 'survey-hi' && calculatorId !== 'utility-convert' && (
                <button
                  id="toggle-3d-visual-btn"
                  type="button"
                  onClick={() => setIsVisualPreviewHidden(!isVisualPreviewHidden)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-sans font-bold flex items-center space-x-1.5 transition-all cursor-pointer select-none hover:scale-[1.02] active:scale-[0.98] ${
                    !isVisualPreviewHidden 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs shadow-blue-500/20' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-650'
                  }`}
                  title="Toggle live interactive 3D/2D CAD Drafting Canvas"
                >
                  <Compass className="w-3 h-3" />
                  <span>{!isVisualPreviewHidden ? 'HIDE 3D' : 'SHOW 3D'}</span>
                </button>
              )}

              <button
                id="expand-formulas-toggle-btn"
                onClick={() => setIsFormulasExpanded(!isFormulasExpanded)}
                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer select-none hover:scale-[1.02] active:scale-[0.98] ${
                  isFormulasExpanded 
                    ? 'bg-amber-500 border-amber-500 text-white shadow-xs shadow-amber-500/20' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-650'
                }`}
                title="Reveal formulas with active input values"
              >
                <Code className="w-3 h-3" />
                <span>{isFormulasExpanded ? 'FORMULAS' : 'EXPAND FORMULAS'}</span>
              </button>
            </div>
          </div>
          
          {calculatorId === 'survey-hi' && (
            <div className="mb-4 h-[240px] relative rounded-2xl bg-slate-900 border border-slate-950 overflow-hidden shadow-inner print-hide">
              <Visual3DPreview 
                calculatorId={calculatorId}
                inputs={inputs}
                outputs={outputs}
                unitSystem={unitSystem}
              />
            </div>
          )}

          {calculatorId !== 'survey-hi' && calculatorId !== 'utility-convert' && !isVisualPreviewHidden && (
            <div className="mb-5 h-[300px] relative rounded-2xl bg-slate-900 border border-slate-950 overflow-hidden shadow-inner print-hide">
              <Visual3DPreview 
                calculatorId={calculatorId}
                inputs={inputs}
                outputs={outputs}
                unitSystem={unitSystem}
              />
            </div>
          )}

          {/* DYNAMIC RESULTS SPECIFICS */}
          <div className="space-y-3">
            
            {calculatorId === 'concrete-volume' && (
              <div className="space-y-4 font-sans text-left">
                {/* WIDE CALCULATION RESULT CARD */}
                <div className="p-5 rounded-3xl backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#141826]/70 border border-[#DCE3F5] dark:border-[#2A3350] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7C88B8]">Calculation Result</span>
                    <span className="px-2.5 py-1 rounded-full bg-[#4C5FE0]/15 text-[#3B47B8] dark:text-[#9AA3C4] text-[10.5px] font-bold">
                      ✓ Calculation complete
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mt-2">
                    <div>
                      <div className="text-4xl sm:text-5xl font-black text-[#161A2C] dark:text-[#E7EAF7] tracking-tight">
                        {outputs.volumeRaw !== undefined ? Number(outputs.volumeRaw).toFixed(2) : '3.00'} <span className="text-xl sm:text-2xl font-bold text-[#7C88B8]">{unitSystem === 'metric' ? 'm³' : 'yd³'}</span>
                      </div>
                      <span className="text-[11px] text-[#7B8978] font-medium block mt-0.5">
                        Net Casting Volume • Dry Volume: <span className="font-bold text-[#20231F] dark:text-[#EAE7E0]">{outputs.volumeDry ?? 0} {unitSystem === 'metric' ? 'm³' : 'yd³'}</span>
                      </span>
                    </div>

                    <div className="flex flex-col font-mono text-xs text-[#4A5578] dark:text-[#9AA3C4] space-y-1">
                      <div><span className="text-[#7C88B8]">Formula:</span> <span className="font-bold text-[#161A2C] dark:text-[#E7EAF7]">V = L × W × D</span></div>
                      <div><span className="text-[#7C88B8]">Calculation:</span> <span className="font-semibold text-[#161A2C] dark:text-[#E7EAF7]">{Number(inputs.length ?? 5).toFixed(2)} × {Number(inputs.width ?? 4).toFixed(2)} × {Number(inputs.thickness ?? 0.15).toFixed(2)}</span></div>
                    </div>
                  </div>

                  {/* Actions: Copy Result, Download PDF, Export Excel */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3.5 border-t border-[#DCE3F5]/60 dark:border-[#262E42]">
                    <button
                      type="button"
                      onClick={() => {
                        const cVal = getMaterialValueAndUnit('cement', cementOutputUnit);
                        const sVal = getMaterialValueAndUnit('sand', sandOutputUnit);
                        const aVal = getMaterialValueAndUnit('aggregate', aggregateOutputUnit);
                        const wVal = getMaterialValueAndUnit('water', waterOutputUnit);
                        const mixStr = inputs.mixType === 'custom' 
                          ? `${inputs.cementRatio ?? 1}:${inputs.sandRatio ?? 1.5}:${inputs.aggregateRatio ?? 3}` 
                          : `${inputs.mixType ?? 'M20'}`;
                        const val = `Concrete: ${Number(outputs.volumeRaw ?? 3).toFixed(2)} ${unitSystem === 'metric' ? 'm³' : 'yd³'} (Dry: ${outputs.volumeDry ?? 0}) | Mix: ${mixStr} | Cement: ${cVal.value} ${cVal.label} | Sand: ${sVal.value} ${sVal.label} | Aggregates: ${aVal.value} ${aVal.label} | Water: ${wVal.value} ${wVal.label}`;
                        navigator.clipboard.writeText(val);
                        setShareToast(true);
                        setTimeout(() => setShareToast(false), 2000);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1D2438] border border-[#DCE3F5] dark:border-[#2A3350] text-xs font-bold text-[#161A2C] dark:text-[#E7EAF7] hover:border-[#7C88B8] transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#7C88B8]" />
                      <span>{shareToast ? 'Copied!' : 'Copy Result'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsExportModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1D2438] border border-[#DCE3F5] dark:border-[#2A3350] text-xs font-bold text-[#161A2C] dark:text-[#E7EAF7] hover:border-[#7C88B8] transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#7C88B8]" />
                      <span>Download PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadExcel}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1D2438] border border-[#DCE3F5] dark:border-[#2A3350] text-xs font-bold text-[#161A2C] dark:text-[#E7EAF7] hover:border-[#7C88B8] transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#7C88B8]" />
                      <span>Export Excel</span>
                    </button>
                  </div>
                </div>

                {/* LOWER CONTENT: Formula Explanation & Example Calculation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Formula Explanation */}
                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#171C2C] border border-[#DCE3F5] dark:border-[#2A3350] shadow-2xs">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-5 h-5 rounded-md bg-[#4C5FE0]/15 text-[#3B47B8] flex items-center justify-center">
                        <BookOpen className="w-3 h-3" />
                      </div>
                      <h4 className="text-xs font-bold text-[#161A2C] dark:text-[#E7EAF7]">Formula Explanation</h4>
                    </div>
                    <div className="p-2 rounded-lg backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#0B0D16] border border-[#DCE3F5]/70 dark:border-[#262E42] font-mono text-xs font-bold text-[#161A2C] dark:text-[#E7EAF7] mb-2.5">
                      V = L × W × D
                    </div>
                    <div className="space-y-0.5 text-[11px] text-[#4A5578] dark:text-[#9AA3C4] font-mono">
                      <div><span className="font-bold text-[#161A2C] dark:text-[#E7EAF7]">V</span> = Volume of concrete ({unitSystem === 'metric' ? 'm³' : 'yd³'})</div>
                      <div><span className="font-bold text-[#161A2C] dark:text-[#E7EAF7]">L</span> = Length ({unitSystem === 'metric' ? 'm' : 'ft'})</div>
                      <div><span className="font-bold text-[#161A2C] dark:text-[#E7EAF7]">W</span> = Width ({unitSystem === 'metric' ? 'm' : 'ft'})</div>
                      <div><span className="font-bold text-[#161A2C] dark:text-[#E7EAF7]">D</span> = Depth ({unitSystem === 'metric' ? 'm' : 'ft'})</div>
                    </div>
                  </div>

                  {/* Example Calculation */}
                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#171C2C] border border-[#DCE3F5] dark:border-[#2A3350] shadow-2xs">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-5 h-5 rounded-md bg-[#9A8062]/15 text-[#735F48] flex items-center justify-center">
                        <Calculator className="w-3 h-3" />
                      </div>
                      <h4 className="text-xs font-bold text-[#161A2C] dark:text-[#E7EAF7]">Example Calculation</h4>
                    </div>
                    <div className="space-y-0.5 text-[11px] text-[#4A5578] dark:text-[#9AA3C4] font-mono mb-2.5">
                      <div>Length = 5.00 m</div>
                      <div>Width = 4.00 m</div>
                      <div>Depth = 0.15 m</div>
                    </div>
                    <div className="p-2 rounded-lg backdrop-blur-xl backdrop-saturate-150 bg-[#F7F9FF]/70 dark:bg-[#0B0D16] border border-[#DCE3F5]/70 dark:border-[#262E42] font-mono text-[11.5px] font-bold text-[#161A2C] dark:text-[#E7EAF7]">
                      5.00 × 4.00 × 0.15 = 3.00 m³
                    </div>
                  </div>
                </div>

                {/* Net, Dry, and Mix Breakdown Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/80 dark:bg-[#171C2C] p-3 rounded-2xl border border-[#DCE3F5] dark:border-[#2A3350] shadow-2xs">
                    <span className="text-[10px] text-[#7C88B8] block uppercase font-bold">Dry Volume</span>
                    <span className="text-base font-bold text-[#161A2C] dark:text-[#E7EAF7]">{outputs.volumeDry ?? 0}</span>
                    <span className="text-[10px] text-[#7C88B8] ml-1">{unitSystem === 'metric' ? 'm³' : 'yd³'}</span>
                  </div>
                  <div className="bg-[#4C5FE0]/10 p-3 rounded-2xl border border-[#4C5FE0]/30">
                    <span className="text-[10px] text-[#3B47B8] dark:text-[#9AA3C4] block uppercase font-bold">Total Ordered</span>
                    <span className="text-base font-bold text-[#3B47B8] dark:text-[#9AA3C4]">{outputs.volumeTotal ?? 0}</span>
                    <span className="text-[10px] text-[#4C5FE0] ml-1">{unitSystem === 'metric' ? 'm³' : 'yd³'}</span>
                  </div>
                </div>
                
                <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2 text-[11px]">
                  <div className="flex justify-between border-b border-slate-200/50 pb-1.5 mb-1.5 font-sans">
                    <span className="text-slate-500">Concrete Ratio (C:S:A):</span>
                    <span className="text-slate-800 font-bold">
                      {inputs.mixType === 'custom' 
                        ? `${inputs.cementRatio ?? 1}:${inputs.sandRatio ?? 1.5}:${inputs.aggregateRatio ?? 3} (custom)` 
                        : `${inputs.mixType ?? 'M20'} (1:${inputs.mixType === 'M5' ? '5:10' : inputs.mixType === 'M7.5' ? '4:8' : inputs.mixType === 'M10' ? '3:6' : inputs.mixType === 'M15' ? '2:4' : inputs.mixType === 'M25' ? '1:2' : '1.5:3'})`
                      }
                    </span>
                  </div>
                  
                  {/* Cement Row */}
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-200/30">
                    <span className="text-slate-500 font-sans">Cement:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-800 font-bold">
                        {getMaterialValueAndUnit('cement', cementOutputUnit).value}
                      </span>
                      <select 
                        value={cementOutputUnit}
                        onChange={(e) => setCementOutputUnit(e.target.value)}
                        className="bg-white hover:bg-slate-100 text-slate-700 text-[9px] font-sans font-semibold rounded-md border border-slate-200 px-1.5 py-0.5 outline-hidden cursor-pointer"
                      >
                        <option value="Bags">{unitSystem === 'metric' ? 'Bags (50kg)' : 'Bags (94lb)'}</option>
                        <option value="m³">m³ (Vol)</option>
                        <option value="ft³">ft³ (Vol)</option>
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                  </div>

                  {/* Sand Row */}
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-200/30">
                    <span className="text-slate-500 font-sans">Sand:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-800 font-bold">
                        {getMaterialValueAndUnit('sand', sandOutputUnit).value}
                      </span>
                      <select 
                        value={sandOutputUnit}
                        onChange={(e) => setSandOutputUnit(e.target.value)}
                        className="bg-white hover:bg-slate-100 text-slate-700 text-[9px] font-sans font-semibold rounded-md border border-slate-200 px-1.5 py-0.5 outline-hidden cursor-pointer"
                      >
                        <option value="Tons">{unitSystem === 'metric' ? 'Tons (Metric)' : 'Tons (Short)'}</option>
                        <option value="m³">m³ (Vol)</option>
                        <option value="ft³">ft³ (Vol)</option>
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                  </div>

                  {/* Aggregate Row */}
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-200/30">
                    <span className="text-slate-500 font-sans">Aggregates:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-800 font-bold">
                        {getMaterialValueAndUnit('aggregate', aggregateOutputUnit).value}
                      </span>
                      <select 
                        value={aggregateOutputUnit}
                        onChange={(e) => setAggregateOutputUnit(e.target.value)}
                        className="bg-white hover:bg-slate-100 text-slate-700 text-[9px] font-sans font-semibold rounded-md border border-slate-200 px-1.5 py-0.5 outline-hidden cursor-pointer"
                      >
                        <option value="Tons">{unitSystem === 'metric' ? 'Tons (Metric)' : 'Tons (Short)'}</option>
                        <option value="m³">m³ (Vol)</option>
                        <option value="ft³">ft³ (Vol)</option>
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                  </div>

                  {/* Water Row */}
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500 font-sans">Water:</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-800 font-bold">
                        {getMaterialValueAndUnit('water', waterOutputUnit).value}
                      </span>
                      <select 
                        value={waterOutputUnit}
                        onChange={(e) => setWaterOutputUnit(e.target.value)}
                        className="bg-white hover:bg-slate-100 text-slate-700 text-[9px] font-sans font-semibold rounded-md border border-slate-200 px-1.5 py-0.5 outline-hidden cursor-pointer"
                      >
                        <option value="Liters">{unitSystem === 'metric' ? 'Liters' : 'Gallons'}</option>
                        <option value="Gallons">{unitSystem === 'metric' ? 'Gallons' : 'Liters'}</option>
                        <option value="m³">m³ (Vol)</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-130 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-emerald-600 block uppercase font-bold">Estimated Material Cost</span>
                    <span className="text-md font-bold text-emerald-600">{currencySymbol}{outputs.totalCost ?? 0}</span>
                  </div>
                  <span className="text-[10px] font-sans text-emerald-500 font-semibold">{currency}</span>
                </div>
              </div>
            )}

            {(calculatorId === 'structural-beam' || calculatorId === 'structural-deflection') && (
              <div className="space-y-4 font-mono text-left">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase">Max Shear (V_max)</span>
                  <span className="text-md font-bold text-slate-800">{outputs.maxShear ?? 0}</span>
                  <span className="text-[10px] text-slate-400 ml-1">{unitSystem === 'metric' ? 'kN' : 'kips'}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase">Max Bending Moment (M_max)</span>
                  <span className="text-md font-bold text-slate-800">{outputs.maxMoment ?? 0}</span>
                  <span className="text-[10px] text-slate-400 ml-1">{unitSystem === 'metric' ? 'kN·m' : 'kip·ft'}</span>
                </div>
                <div className={`p-3 rounded-xl border ${outputs.isDeflectionOk ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <span className="text-[10px] text-slate-650 block uppercase font-bold">Actual Deflection (Δ)</span>
                  <span className={`text-lg font-black ${outputs.isDeflectionOk ? 'text-emerald-600' : 'text-red-600'}`}>
                    {outputs.maxDeflection ?? 0} {unitSystem === 'metric' ? 'mm' : 'in'}
                  </span>
                  <div className="mt-1 border-t border-slate-200/50 pt-1 flex justify-between text-[11px] text-slate-500">
                    <span>L/240 Limit:</span>
                    <span className="text-slate-700 font-bold">{outputs.deflectionLimit} {unitSystem === 'metric' ? 'mm' : 'in'}</span>
                  </div>
                </div>

                {/* Real-time SFD/BMD Station Solver */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-3 shadow-3xs">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">SFD / BMD Station Solver</span>
                    <span className="text-[9px] font-mono bg-blue-500/10 text-blue-600 border border-blue-500/20 px-1.5 py-0.5 rounded">
                      INTERACTIVE
                    </span>
                  </div>
                  <div>
                    {(() => {
                      const sp = Number(inputs.span) || 6;
                      const isM = unitSystem === 'metric';
                      const currentStationX = beamStationX !== null && beamStationX <= sp ? beamStationX : sp / 2;
                      const stats = getBeamValuesAtX(currentStationX);
                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[11px] text-slate-600">
                            <span>Position x (from left pin)</span>
                            <span className="font-bold text-[#0A84FF]">{currentStationX.toFixed(2)} {isM ? 'm' : 'ft'}</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max={sp}
                            step="0.05"
                            value={currentStationX}
                            onChange={(e) => setBeamStationX(parseFloat(e.target.value))}
                            className="w-full accent-[#0A84FF] h-1 bg-slate-200 rounded-lg cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                            <span>0.00 {isM ? 'm' : 'ft'}</span>
                            <span>{sp.toFixed(2)} {isM ? 'm' : 'ft'}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 pt-1.5">
                            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-3xs text-center">
                              <span className="text-[9px] text-slate-400 uppercase font-semibold block scale-90">Shear V(x)</span>
                              <span className="text-xs font-bold text-slate-800">{stats.sf}</span>
                              <span className="text-[8px] text-slate-400 ml-0.5 block scale-90">{isM ? 'kN' : 'kips'}</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-3xs text-center">
                              <span className="text-[9px] text-slate-400 uppercase font-semibold block scale-90">Moment M(x)</span>
                              <span className="text-xs font-bold text-slate-800">{stats.bm}</span>
                              <span className="text-[8px] text-slate-400 ml-0.5 block scale-90">{isM ? 'kN·m' : 'kip·ft'}</span>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-3xs text-center">
                              <span className="text-[9px] text-slate-400 uppercase font-semibold block scale-90">Deflection</span>
                              <span className="text-xs font-bold text-[#0A84FF]">{stats.def}</span>
                              <span className="text-[8px] text-slate-400 ml-0.5 block scale-90">{isM ? 'mm' : 'in'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Numerical Station Grid */}
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 shadow-3xs">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight block mb-2 text-left">
                    L/10 Numerical Station Grid
                  </span>
                  <div className="overflow-x-auto max-h-[190px] overflow-y-auto pr-1">
                    <table className="w-full text-left font-mono text-[9px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-450">
                          <th className="py-1 font-semibold">x ({unitSystem === 'metric' ? 'm' : 'ft'})</th>
                          <th className="py-1 font-semibold">Shear V</th>
                          <th className="py-1 font-semibold">Moment M</th>
                          <th className="py-1 font-semibold">Deflect Δ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {Array.from({ length: 11 }).map((_, idx) => {
                          const sp = Number(inputs.span) || 6;
                          const xVal = (sp * idx) / 10;
                          const stats = getBeamValuesAtX(xVal);
                          return (
                            <tr key={idx} className="hover:bg-slate-100/50">
                              <td className="py-1">{idx * 10}% L ({xVal.toFixed(2)})</td>
                              <td className={`py-1 font-semibold ${stats.sf > 0 ? 'text-emerald-600' : stats.sf < 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                {stats.sf}
                              </td>
                              <td className="py-1 text-slate-800 font-bold">{stats.bm}</td>
                              <td className="py-1 text-blue-600">{stats.def}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {calculatorId === 'structural-column' && (
              <div className="space-y-3 font-mono">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-500 uppercase">Gross Concrete Area</span>
                    <span className="text-[9px] text-slate-400 font-bold">Ag</span>
                  </div>
                  <span className="text-md font-bold text-slate-800">{outputs.grossArea ?? 0}</span>
                  <span className="text-[10px] text-slate-400 ml-1">{unitSystem === 'metric' ? 'mm²' : 'in²'}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-500 uppercase">Reinforcement Area</span>
                    <span className="text-[9px] text-slate-400 font-bold">Ast</span>
                  </div>
                  <span className="text-md font-bold text-slate-800">{outputs.steelArea ?? 0}</span>
                  <span className="text-[10px] text-slate-400 ml-1">{unitSystem === 'metric' ? 'mm²' : 'in²'}</span>
                </div>
                <div className={`p-3 rounded-xl border ${outputs.minRebarWarning || outputs.maxRebarWarning ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100 shadow-2xs'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-500 uppercase">Steel Ratio (ρ_s)</span>
                  </div>
                  <span className={`text-md font-black ${outputs.minRebarWarning || outputs.maxRebarWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {outputs.steelRatio ?? 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">of Area</span>
                  {(outputs.minRebarWarning || outputs.maxRebarWarning) && (
                    <div className="mt-1 text-[10px] text-amber-600 leading-tight">
                      {outputs.minRebarWarning ? 'ACI: reinforcing steel ratio must be >= 1.0%.' : 'ACI: reinforcing steel ratio exceeds 8.0% congestion limit.'}
                    </div>
                  )}
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-emerald-600 block uppercase font-bold">Design Capacity (φPn)</span>
                    <span className="text-md font-bold text-emerald-600">{outputs.factoredCapacityPhiPn ?? 0}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">{unitSystem === 'metric' ? 'kN' : 'kips'}</span>
                </div>
              </div>
            )}

            {calculatorId === 'structural-slab' && (
              <div className="space-y-3 font-mono">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase">Min Thickness Boundary</span>
                  <span className="text-md font-bold text-slate-800">{outputs.minThickness ?? 0}</span>
                  <span className="text-[10px] text-slate-400 ml-1">{unitSystem === 'metric' ? 'mm' : 'in'}</span>
                </div>
                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-blue-600 block uppercase font-bold">Recommended Thickness</span>
                  <span className="text-lg font-black text-blue-600">{outputs.recommendedThickness ?? 0}</span>
                  <span className="text-[10px] text-blue-500 ml-1">{unitSystem === 'metric' ? 'mm (rounded)' : 'in (rounded)'}</span>
                  <p className="text-[10px] mt-2 text-slate-500 leading-tight font-sans">Rounded up to typical structural framing increments for builders.</p>
                </div>
              </div>
            )}

            {calculatorId === 'geotech-bearing' && (
              <div className="space-y-2 font-mono text-xs">
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-900 space-y-1.5">
                  <div className="text-[9px] text-slate-500 uppercase">Terzaghi Factors:</div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Cohesion Factor Nc:</span>
                    <span className="text-slate-800 font-bold">{outputs.nc}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Surcharge Factor Nq:</span>
                    <span className="text-slate-800 font-bold">{outputs.nq}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Unit Weight Factor Nγ:</span>
                    <span className="text-slate-800 font-bold">{outputs.ngg}</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase">Ultimate bearing (q_ult)</span>
                  <span className="text-md font-bold text-slate-800">{outputs.ultimateCapacity ?? 0}</span>
                  <span className="text-[10px] text-slate-400 ml-1">{unitSystem === 'metric' ? 'kPa' : 'psf'}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-600 block uppercase font-bold">Allowable Bearing (q_allow)</span>
                  <span className="text-lg font-bold text-emerald-600">{outputs.allowableCapacity ?? 0}</span>
                  <span className="text-[10px] text-emerald-500 ml-1">{unitSystem === 'metric' ? 'kPa' : 'psf'}</span>
                  <span className="block text-[9px] text-slate-500 mt-1 font-sans">Divided by Factor of Safety (FS = {inputs.safetyFactor}).</span>
                </div>
              </div>
            )}

            {calculatorId === 'geotech-retaining' && (
              <div className="space-y-3 font-mono">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Rankine active Coeff (Ka)</span>
                  <span className="text-md font-bold text-teal-600">{outputs.ka ?? 0}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase">Active Thrust (Pa)</span>
                  <span className="text-md font-bold text-slate-800">{outputs.lateralMoistureThrust ?? 0}</span>
                  <span className="text-[10px] text-slate-400 ml-1">{unitSystem === 'metric' ? 'kN/m' : 'lbs/ft'}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                  <span className="text-[10px] text-amber-700 block uppercase font-bold">Overturning Moment (M_over)</span>
                  <span className="text-md font-extrabold text-amber-700">{outputs.overturningMoment ?? 0}</span>
                  <span className="text-[10px] text-amber-600 ml-1">{unitSystem === 'metric' ? 'kN·m/m' : 'lb-ft/ft'}</span>
                </div>
              </div>
            )}

            {calculatorId === 'survey-hi' && (
              <div className="space-y-3 font-mono text-xs">
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${outputs.isCheckPassed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-[10px] uppercase font-extrabold ${outputs.isCheckPassed ? 'text-emerald-700' : 'text-red-700'}`}>Arithmetic Level Loop Check</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${outputs.isCheckPassed ? 'bg-emerald-100/80 text-emerald-800' : 'bg-red-100/80 text-red-800'}`}>
                      {outputs.isCheckPassed ? 'PASSED' : 'CHECK ERROR'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-black ${outputs.isCheckPassed ? 'text-emerald-800' : 'text-red-800'}`}>
                      {outputs.isCheckPassed ? '✓ Balanced' : '✗ Misclosure'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans leading-relaxed mt-2.5">
                    {outputs.isCheckPassed 
                      ? 'The sum of backsights minus foresights matches the difference between last and first reduced levels exactly.' 
                      : 'Closing check error detected! Double-check the Backsight and Foresight rod entries.'}
                  </p>
                </div>
                
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs text-left space-y-2">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Levelling Close Calculations</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-slate-500 block text-[9px] uppercase">Σ Backsights (BS)</span>
                      <span className="text-sm font-bold text-slate-800">{outputs.sumBS ?? 0}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-slate-500 block text-[9px] uppercase">Σ Foresights (FS)</span>
                      <span className="text-sm font-bold text-slate-800">{outputs.sumFS ?? 0}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Σ BS - Σ FS:</span>
                      <span className="font-bold text-slate-800 font-mono">{outputs.bsFsDifference ?? 0} {unitSystem === 'metric' ? 'm' : 'ft'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans font-medium">Last RL - First RL:</span>
                      <span className="font-bold text-slate-800 font-mono">{outputs.firstLastRlDifference ?? 0} {unitSystem === 'metric' ? 'm' : 'ft'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs text-left">
                    <span className="text-[10px] text-slate-500 block uppercase">Total Setup Runs</span>
                    <span className="text-lg font-bold text-slate-800 block mt-0.5">{outputs.activeSetupsCount ?? 0}</span>
                    <span className="text-[9px] text-slate-400">Inst. Placements</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs text-left">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Distance</span>
                    <span className="text-lg font-bold text-slate-800 block mt-0.5">{outputs.totalDistance ?? 0}</span>
                    <span className="text-[9px] text-slate-400">{unitSystem === 'metric' ? 'meters' : 'feet'} run</span>
                  </div>
                </div>
              </div>
            )}

            {calculatorId === 'utility-convert' && (
              <div className="space-y-3 font-mono">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-110 text-center py-6 shadow-2xs">
                  <span className="text-[10px] text-emerald-600 block uppercase font-bold mb-2">CONVERTED VALUE OUTPUT</span>
                  <span className="text-2xl font-black text-emerald-600 break-words">{outputs.convertedValue ?? 0}</span>
                  <span className="text-xs text-slate-500 ml-1 font-bold">{convTo}</span>
                </div>
              </div>
            )}
            
            {/* CROSS-SYSTEM DUAL-UNIT DIFFERENCES CARD */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 mt-4 text-left font-mono">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center">
                <RefreshCw className="w-3.5 h-3.5 text-[#0A84FF] mr-1.5" />
                Dual-Unit equivalents
              </span>
              <p className="text-[9px] text-slate-450 leading-relaxed font-sans">
                Real-time equivalents calculated in the alternative unit system for cross-border alignment and compliance verification:
              </p>
              
              <div className="space-y-1.5 text-[10px] pt-1.5 border-t border-slate-200/60 leading-none">
                {calculatorId === 'concrete-volume' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Net Volume:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric' 
                          ? `${((outputs.volumeRaw || 0) * 1.30795).toFixed(2)} yd³` 
                          : `${((outputs.volumeRaw || 0) / 1.30795).toFixed(2)} m³`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Dry Volume:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric' 
                          ? `${((outputs.volumeDry || 0) * 1.30795).toFixed(2)} yd³` 
                          : `${((outputs.volumeDry || 0) / 1.30795).toFixed(2)} m³`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Total Ordered:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric' 
                          ? `${((outputs.volumeTotal || 0) * 1.30795).toFixed(2)} yd³` 
                          : `${((outputs.volumeTotal || 0) / 1.30795).toFixed(2)} m³`
                        }
                      </span>
                    </div>
                  </>
                )}

                {(calculatorId === 'structural-beam' || calculatorId === 'structural-deflection') && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Span Length:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric' 
                          ? `${((inputs.span || 0) * 3.28084).toFixed(2)} ft` 
                          : `${((inputs.span || 0) / 3.28084).toFixed(2)} m`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Max Shear V_max:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric' 
                          ? `${((outputs.maxShear || 0) * 0.224809).toFixed(2)} kips` 
                          : `${((outputs.maxShear || 0) / 0.224809).toFixed(2)} kN`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Max Moment M_max:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric' 
                          ? `${((outputs.maxMoment || 0) * 0.73756).toFixed(2)} kip·ft` 
                          : `${((outputs.maxMoment || 0) / 0.73756).toFixed(2)} kN·m`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Max Deflection Δ:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric' 
                          ? `${((outputs.maxDeflection || 0) / 25.4).toFixed(3)} in` 
                          : `${((outputs.maxDeflection || 0) * 25.4).toFixed(1)} mm`
                        }
                      </span>
                    </div>
                  </>
                )}

                {calculatorId === 'structural-column' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Section Size:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric'
                          ? `${((inputs.width || 0) / 25.4).toFixed(1)}×${((inputs.depth || 0) / 25.4).toFixed(1)} in`
                          : `${Math.round((inputs.width || 0) * 25.4)}×${Math.round((inputs.depth || 0) * 25.4)} mm`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Concrete f'c:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric'
                          ? `${Math.round((inputs.fc || 0) * 145.038)} psi`
                          : `${((inputs.fc || 0) / 145.038).toFixed(1)} MPa`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Rebar Yield fy:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric'
                          ? `${Math.round((inputs.fy || 0) * 145.038 / 1000)} ksi`
                          : `${((inputs.fy || 0) / 145.038).toFixed(1)} MPa`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Design Capacity φPn:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric'
                          ? `${((outputs.factoredCapacityPhiPn || 0) * 0.224809).toFixed(1)} kips`
                          : `${((outputs.factoredCapacityPhiPn || 0) / 0.224809).toFixed(1)} kN`
                        }
                      </span>
                    </div>
                  </>
                )}

                {calculatorId === 'structural-slab' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Span Length:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric' 
                          ? `${((inputs.span || 0) * 3.28084).toFixed(2)} ft` 
                          : `${((inputs.span || 0) / 3.28084).toFixed(2)} m`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Min Thickness:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric'
                          ? `${((outputs.minThickness || 0) / 25.4).toFixed(2)} in`
                          : `${((outputs.minThickness || 0) * 25.4).toFixed(1)} mm`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Recommended:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric'
                          ? `${((outputs.recommendedThickness || 0) / 25.4).toFixed(1)} in`
                          : `${((outputs.recommendedThickness || 0) * 25.4).toFixed(1)} mm`
                        }
                      </span>
                    </div>
                  </>
                )}

                {calculatorId === 'geotech-bearing' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Footing B×L:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric'
                          ? `${((inputs.bg || 0) * 3.28084).toFixed(1)}×${((inputs.lg || 0) * 3.28084).toFixed(1)} ft`
                          : `${((inputs.bg || 0) / 3.28084).toFixed(2)}×${((inputs.lg || 0) / 3.28084).toFixed(2)} m`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Cohesion force c:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric'
                          ? `${((inputs.cohesion || 0) * 20.8854).toFixed(1)} psf`
                          : `${((inputs.cohesion || 0) / 20.8854).toFixed(1)} kPa`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Allowable q_allow:</span>
                      <span className="text-emerald-600 font-bold">
                        {unitSystem === 'metric'
                          ? `${((outputs.allowableCapacity || 0) * 20.8854).toFixed(0)} psf`
                          : `${((outputs.allowableCapacity || 0) / 20.8854).toFixed(1)} kPa`
                        }
                      </span>
                    </div>
                  </>
                )}

                {calculatorId === 'geotech-retaining' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Wall Height H:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric' 
                          ? `${((inputs.height || 0) * 3.28084).toFixed(2)} ft` 
                          : `${((inputs.height || 0) / 3.28084).toFixed(2)} m`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Active Thrust Pa:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric' 
                          ? `${((outputs.lateralMoistureThrust || 0) * 68.5218).toFixed(1)} lbs/ft` 
                          : `${((outputs.lateralMoistureThrust || 0) / 68.5218).toFixed(1)} kN/m`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Overturning Moment:</span>
                      <span className="text-amber-600 font-bold">
                        {unitSystem === 'metric' 
                          ? `${((outputs.overturningMoment || 0) * 224.809).toFixed(0)} lb-ft/ft` 
                          : `${((outputs.overturningMoment || 0) / 224.809).toFixed(1)} kN·m/m`
                        }
                      </span>
                    </div>
                  </>
                )}

                {calculatorId === 'survey-hi' && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">HI Line of Sight:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric' 
                          ? `${((outputs.heightOfInstrument || 0) * 3.28084).toFixed(3)} ft` 
                          : `${((outputs.heightOfInstrument || 0) / 3.28084).toFixed(3)} m`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Foresight RL_FS:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric' 
                          ? `${((outputs.foresightRL || 0) * 3.28084).toFixed(3)} ft` 
                          : `${((outputs.foresightRL || 0) / 3.28084).toFixed(3)} m`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Elevation Change:</span>
                      <span className="text-[#0F172A] font-bold">
                        {unitSystem === 'metric' 
                          ? `${((outputs.elevationDelta || 0) * 3.28084).toFixed(3)} ft` 
                          : `${((outputs.elevationDelta || 0) / 3.28084).toFixed(3)} m`
                        }
                      </span>
                    </div>
                  </>
                )}

                {calculatorId === 'utility-convert' && (
                  <div className="text-center text-[9px] text-slate-400 font-sans py-0.5">
                    Direct conversion preset.
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* ACTION ROW: Share + Export */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {/* Export & Share buttons */}
          <div id="print-actions-row" className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
            <button 
              id="tour-export-pdf"
              onClick={() => setIsExportModalOpen(true)}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs font-semibold"
            >
              <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="truncate">Official PDF</span>
            </button>
            
            <button 
              id="tour-export-excel"
              onClick={handleDownloadExcel}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Excel Sheet</span>
            </button>

            <button 
              onClick={handleShareCalculation}
              className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs font-semibold"
            >
              <Share2 className="w-3.5 h-3.5 text-[#f97316] shrink-0" />
              <span className="truncate">{shareToast ? 'Copied!' : 'Share Link'}</span>
            </button>

            <button 
              onClick={() => {
                try {
                  window.focus();
                  window.print();
                } catch (e) {
                  console.error("Native print failed:", e);
                }
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-white flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md font-semibold"
            >
              <Printer className="w-3.5 h-3.5 text-slate-200 shrink-0" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Branded Export Modal */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          calculatorTitle={calcDef?.name || 'Calculation'}
          calculatorId={calculatorId}
          onConfirmPDF={handleDownloadPDF}
          shareUrl={encodeCalculationToUrl(inputs, unitSystem)}
        />
      </div>

      </div>

      {/* FULL WIDTH BOTTOM: Premium AI Expert Panel */}
      <div className="w-full bg-white/80 border border-slate-200 rounded-3xl p-6 shadow-sm" id="ai-assistant-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-slate-100 space-y-3 md:space-y-0">
          <div className="flex items-center space-x-3">
            <span className="p-3 bg-blue-50 text-[#0A84FF] rounded-2xl border border-blue-100 shadow-2xs">
              <Sparkles className="w-5 h-5 text-[#0A84FF] animate-pulse" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 font-sans tracking-tight">Engineering AI Assistant</h3>
                <span className="text-[9px] font-mono bg-[#4C5FE0]/15 text-[#3B47B8] dark:text-[#9AA3C4] px-2 py-0.5 rounded-full border border-[#4C5FE0]/25 font-bold uppercase tracking-wider">Analysis Active</span>
              </div>
              <p className="text-xs text-slate-500 font-mono">PROMPT PRINCIPAL STRUCTURAL REVIEW & CODE AUDITING LOGS</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleExplainWithAi("Analyze this sheet state specifically looking for critical failure risk points.")}
              disabled={isAiLoading}
              className="py-2 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-xs font-mono text-white border border-transparent flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs font-semibold"
            >
              Analyze Risks
            </button>
            <button
              onClick={() => handleExplainWithAi("Provide alternative structural dimensions and materials for a higher safety factor.")}
              disabled={isAiLoading}
              className="py-2 px-4 rounded-xl bg-white hover:bg-slate-50 text-xs font-mono text-slate-800 border border-slate-200 flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs font-semibold"
            >
              Optimize Design
            </button>
          </div>
        </div>

        {/* AI CONSOLE CONTENT */}
        <AnimatePresence>
          {showAiConsole && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              {isAiLoading && (
                <div className="bg-slate-50/50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center space-y-3 font-mono text-xs shadow-inner">
                  <div className="w-10 h-10 border-4 border-[#0A84FF] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-600 animate-pulse text-center tracking-wider max-w-md">{aiStatusMessage}</p>
                </div>
              )}

              {aiResult && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 font-mono text-xs">
                  
                  {/* Explanation (Col 6) */}
                  <div className="md:col-span-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-2xs">
                    <div>
                      <span className="text-[#0A84FF] font-bold text-[10px] block mb-2 uppercase tracking-wider">🔬 PRINCIPAL REVIEW STATUS</span>
                      <p className="text-slate-700 leading-relaxed text-xs">
                        {aiResult.explanation}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-205 text-[10px] text-slate-500">
                      Calculations parsed: {calculatorId}@{unitSystem}
                    </div>
                  </div>

                  {/* Recommendations (Col 3) */}
                  <div className="md:col-span-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-[#22C55E] font-bold text-[10px] block mb-2 uppercase tracking-wider font-mono">📐 RECOMMENDED DESIGN PATHS</span>
                    <ul className="space-y-2 text-slate-700 font-sans">
                      {(aiResult.recommendations || []).map((rec: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <Check className="w-3.5 h-3.5 text-[#22C55E] mr-1.5 flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Safety & Standards (Col 3) */}
                  <div className="md:col-span-3 bg-red-50 p-4 rounded-2xl border border-red-200">
                    <span className="text-red-700 font-bold text-[10px] block mb-2 uppercase tracking-wider flex items-center font-mono">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-650 animate-pulse" /> CODE COMPLIANCE METRICS
                    </span>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {aiResult.safetyNotes}
                    </p>
                  </div>

                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* INPUT PROMPT GROUP */}
        <div className="flex items-center space-x-2 bg-white rounded-2xl p-2 border border-slate-200 focus-within:border-[#0A84FF] focus-within:ring-1 focus-within:ring-[#0A84FF] transition-all shadow-xs">
          <input 
            type="text"
            placeholder="Ask a custom question (e.g. 'How does soil friction angle impact footing slide resilience?')"
            value={customQuestion}
            onChange={e => setCustomQuestion(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleExplainWithAi();
              }
            }}
            className="flex-1 bg-transparent border-none outline-none py-2 px-3 text-xs text-slate-800 placeholder-slate-400 font-mono"
          />
          <button
            onClick={() => handleExplainWithAi()}
            disabled={isAiLoading || !customQuestion.trim()}
            className="p-2 px-4 rounded-xl bg-[#0A84FF] hover:bg-blue-600 text-xs font-sans font-semibold text-white flex items-center space-x-1.5 transition-colors disabled:opacity-30 cursor-pointer shadow-2xs"
          >
            <span>Query Expert</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* EXPAND FORMULAS SLIDE-OVER ENGINEERING PANEL */}
      <AnimatePresence>
        {isFormulasExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormulasExpanded(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-40 cursor-pointer"
            />
            
            {/* Slide-over Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 210 }}
              className="absolute inset-y-0 right-0 w-full sm:w-[480px] max-w-full bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl overflow-hidden text-left"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 shadow-inner">
                    <Code className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Engineering Logic Trace</h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{calcDef?.name || 'MATHEMATICAL MODEL'}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsFormulasExpanded(false)}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/50 transition-all cursor-pointer font-bold text-xs px-2.5"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-slate-900/40">
                {/* Core Specification Card */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-amber-500 font-mono text-[9px] uppercase tracking-widest block font-bold">LITERAL CORE FORMULA</span>
                  <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-lg text-center">
                    <span className="text-emerald-400 font-sans text-sm md:text-md font-bold tracking-wider drop-shadow-sm select-all">
                      {formulaRef?.latex || 'V = L × W × H'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    {formulaRef?.explanation || 'Active dimensional formulas utilized for rigorous structural alignment.'}
                  </p>
                </div>

                {/* Live Substitutions and Parameter Trace */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">INTEGRATED CALCULATION TRACE</span>
                    <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">LIVE SUBSTITUTIONS</span>
                  </div>
                  <div className="space-y-4">
                    {renderDynamicMathematicalDerivation()}
                  </div>
                </div>

                {/* References and Standards compliance */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-slate-500 font-mono text-[9px] uppercase tracking-widest block font-bold">ENGINEERING REGULATORY CODES</span>
                  <div className="text-[10px] text-slate-400 font-sans leading-relaxed space-y-1.5">
                    <p>• <strong className="text-slate-350">Concrete Castings & Slabs:</strong> Designed in compliance with ACI 318 - Building Code Requirements for Structural Concrete.</p>
                    <p>• <strong className="text-slate-350">Beam and Flexure:</strong> Formulated using Euler-Bernoulli Elastic Flexure theory and standard SLS serviceability limits.</p>
                    <p>• <strong className="text-slate-350">Geotechnical Foundations:</strong> Based on the classical Terzaghi-Prandtl continuous footing bearing capacity coefficients.</p>
                    <p>• <strong className="text-slate-350">Retaining Structures:</strong> Governed by Rankine's lateral earth pressure active thrust coefficient theorem.</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-500 uppercase">CivilMath v1.4.2 Engine</span>
                <button
                  onClick={() => setIsFormulasExpanded(false)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-sans font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md shadow-amber-500/10"
                >
                  Close Trace
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
    </motion.div>
  );
}
