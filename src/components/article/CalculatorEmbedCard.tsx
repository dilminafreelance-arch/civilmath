import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface CalculatorEmbedCardProps {
  calculatorId: string;
  calculatorName?: string;
  description?: string;
  initialInputs?: Record<string, any>;
  showFullLink?: boolean;
}

export const EMBEDDABLE_CALCULATORS: Record<
  string,
  {
    name: string;
    url: string;
    description: string;
    category: string;
    defaultInputs: Record<string, number | string>;
    fields: { key: string; label: string; unit: string; step?: string; defaultValue: number | string }[];
  }
> = {
  'concrete-volume': {
    name: 'Concrete Volume Calculator',
    url: '/concrete/volume',
    description: 'Calculate neat geometric concrete volume, dry volume factor 1.54, cement bags, sand, and aggregate.',
    category: 'Concrete',
    defaultInputs: { length: 5, width: 3, thickness: 0.15 },
    fields: [
      { key: 'length', label: 'Length', unit: 'm', step: '0.1', defaultValue: 5 },
      { key: 'width', label: 'Width', unit: 'm', step: '0.1', defaultValue: 3 },
      { key: 'thickness', label: 'Height / Thickness', unit: 'm', step: '0.01', defaultValue: 0.15 },
    ],
  },
  'concrete-mix': {
    name: 'Concrete Mix Calculator',
    url: '/concrete/volume',
    description: 'Estimate cement bags, fine aggregate, and coarse aggregate for M15, M20, M25 concrete grades.',
    category: 'Concrete',
    defaultInputs: { volume: 2.25, grade: 'M20 (1:1.5:3)' },
    fields: [
      { key: 'volume', label: 'Wet Volume', unit: 'm³', step: '0.1', defaultValue: 2.25 },
    ],
  },
  'rebar-calculator': {
    name: 'Rebar Weight & Quantity Calculator',
    url: '/concrete/rebar',
    description: 'Calculate unit and total rebar weight using the standard D²/162 formula.',
    category: 'Concrete',
    defaultInputs: { diameter: 12, length: 12, count: 10 },
    fields: [
      { key: 'diameter', label: 'Bar Diameter', unit: 'mm', step: '1', defaultValue: 12 },
      { key: 'length', label: 'Cut Length', unit: 'm', step: '0.1', defaultValue: 12 },
      { key: 'count', label: 'Number of Bars', unit: 'nos', step: '1', defaultValue: 10 },
    ],
  },
  'steel-calculator': {
    name: 'Structural Steel Weight Calculator',
    url: '/structural/steel-weight',
    description: 'Compute theoretical section weight for beams, angles, channels, and plates.',
    category: 'Structural',
    defaultInputs: { weightPerMeter: 37.1, length: 6 },
    fields: [
      { key: 'weightPerMeter', label: 'Unit Weight', unit: 'kg/m', step: '0.1', defaultValue: 37.1 },
      { key: 'length', label: 'Member Length', unit: 'm', step: '0.1', defaultValue: 6 },
    ],
  },
  'brick-calculator': {
    name: 'Brick & Mortar Estimator',
    url: '/concrete/brick',
    description: 'Calculate standard bricks, wet and dry mortar volumes for 115mm and 230mm brickwork.',
    category: 'Concrete',
    defaultInputs: { length: 5, height: 3, thickness: 0.23 },
    fields: [
      { key: 'length', label: 'Wall Length', unit: 'm', step: '0.1', defaultValue: 5 },
      { key: 'height', label: 'Wall Height', unit: 'm', step: '0.1', defaultValue: 3 },
    ],
  },
  'structural-beam': {
    name: 'Simply Supported Beam Analysis',
    url: '/structural/beam',
    description: 'Calculate max bending moment (wL²/8) and shear force (wL/2) for uniform loads.',
    category: 'Structural',
    defaultInputs: { span: 6, udl: 15 },
    fields: [
      { key: 'span', label: 'Clear Span', unit: 'm', step: '0.1', defaultValue: 6 },
      { key: 'udl', label: 'Uniform Load (w)', unit: 'kN/m', step: '1', defaultValue: 15 },
    ],
  },
  'structural-column': {
    name: 'RCC Column Axial Capacity',
    url: '/structural/column',
    description: 'Estimate short tied column axial load capacity Pu based on ACI 318 / IS 456.',
    category: 'Structural',
    defaultInputs: { width: 300, depth: 450, fck: 25, fy: 500, rebarPct: 1.5 },
    fields: [
      { key: 'width', label: 'Column Width', unit: 'mm', step: '25', defaultValue: 300 },
      { key: 'depth', label: 'Column Depth', unit: 'mm', step: '25', defaultValue: 450 },
    ],
  },
  'bbs-footing': {
    name: 'Footing BBS Calculator',
    url: '/bbs/footing',
    description: 'Isolated footing mesh cutting length and bend deduction bar bending schedule.',
    category: 'BBS',
    defaultInputs: { length: 1800, width: 1800, depth: 450, cover: 50, dia: 12, spacing: 150 },
    fields: [
      { key: 'length', label: 'Footing Length', unit: 'mm', step: '50', defaultValue: 1800 },
      { key: 'width', label: 'Footing Width', unit: 'mm', step: '50', defaultValue: 1800 },
      { key: 'spacing', label: 'Bar Spacing', unit: 'mm', step: '25', defaultValue: 150 },
    ],
  },
};

export default function CalculatorEmbedCard({
  calculatorId = 'concrete-volume',
  calculatorName,
  description,
  initialInputs,
  showFullLink = true,
}: CalculatorEmbedCardProps) {
  const meta = EMBEDDABLE_CALCULATORS[calculatorId] || EMBEDDABLE_CALCULATORS['concrete-volume'];

  // Local state for interactive calculation
  const [inputs, setInputs] = useState<Record<string, any>>(() => ({
    ...meta.defaultInputs,
    ...initialInputs,
  }));

  const [calculated, setCalculated] = useState(true);

  const handleInputChange = (field: string, val: string) => {
    const num = parseFloat(val);
    setInputs((prev: Record<string, any>) => ({
      ...prev,
      [field]: isNaN(num) ? val : num,
    }));
  };

  // Compute live output based on calculator type
  const result = useMemo(() => {
    if (calculatorId === 'concrete-volume' || !calculatorId) {
      const L = Number(inputs.length) || 0;
      const W = Number(inputs.width) || 0;
      const H = Number(inputs.thickness) || 0;
      const volume = L * W * H;
      const dryVolume = volume * 1.54;
      // M20 (1:1.5:3 = 5.5 parts)
      const cementVolume = dryVolume * (1 / 5.5);
      const cementBags = Math.ceil(cementVolume / 0.035);
      const sandVolume = dryVolume * (1.5 / 5.5);
      const aggregateVolume = dryVolume * (3 / 5.5);

      return {
        mainValue: volume.toFixed(2),
        mainUnit: 'm³',
        summary: `Neat Volume: ${volume.toFixed(2)} m³`,
        details: [
          { label: 'Wet Concrete Volume', value: `${volume.toFixed(2)} m³` },
          { label: 'Dry Volume (1.54 Factor)', value: `${dryVolume.toFixed(2)} m³` },
          { label: 'Cement Required (M20)', value: `${cementBags} bags (50kg)` },
          { label: 'Sand (Fine Aggregate)', value: `${sandVolume.toFixed(2)} m³` },
          { label: 'Coarse Aggregate', value: `${aggregateVolume.toFixed(2)} m³` },
        ],
      };
    }

    if (calculatorId === 'rebar-calculator') {
      const dia = Number(inputs.diameter) || 12;
      const len = Number(inputs.length) || 12;
      const count = Number(inputs.count) || 1;
      const unitWeight = (dia * dia) / 162.28; // kg/m
      const totalWeight = unitWeight * len * count;

      return {
        mainValue: totalWeight.toFixed(2),
        mainUnit: 'kg',
        summary: `Total Steel: ${totalWeight.toFixed(2)} kg`,
        details: [
          { label: 'Unit Weight (D²/162)', value: `${unitWeight.toFixed(3)} kg/m` },
          { label: 'Total Rebar Length', value: `${(len * count).toFixed(1)} m` },
          { label: 'Total Weight', value: `${totalWeight.toFixed(2)} kg (${(totalWeight / 1000).toFixed(3)} tonnes)` },
        ],
      };
    }

    if (calculatorId === 'brick-calculator') {
      const L = Number(inputs.length) || 5;
      const H = Number(inputs.height) || 3;
      const area = L * H;
      const standardBricks = Math.ceil(area * 50); // 50 bricks per m2 for 115mm half brick wall
      const mortarVol = (area * 0.115 * 0.25).toFixed(2);

      return {
        mainValue: standardBricks.toString(),
        mainUnit: 'Bricks',
        summary: `Total Bricks: ${standardBricks}`,
        details: [
          { label: 'Wall Surface Area', value: `${area.toFixed(2)} m²` },
          { label: 'Standard Bricks (Modular)', value: `${standardBricks} nos (5% waste included)` },
          { label: 'Estimated Mortar Volume', value: `${mortarVol} m³` },
        ],
      };
    }

    if (calculatorId === 'structural-beam') {
      const L = Number(inputs.span) || 6;
      const w = Number(inputs.udl) || 15;
      const maxMoment = (w * L * L) / 8;
      const maxShear = (w * L) / 2;

      return {
        mainValue: maxMoment.toFixed(2),
        mainUnit: 'kN·m',
        summary: `Max Moment: ${maxMoment.toFixed(2)} kN·m`,
        details: [
          { label: 'Max Bending Moment (Mmax)', value: `${maxMoment.toFixed(2)} kN·m` },
          { label: 'Max Shear Force (Vmax)', value: `${maxShear.toFixed(2)} kN` },
        ],
      };
    }

    // Default fallback
    return {
      mainValue: 'Ready',
      mainUnit: '',
      summary: 'Interactive Calculation Ready',
      details: [],
    };
  }, [calculatorId, inputs]);

  return (
    <div className="my-8 rounded-2xl bg-[#F0F5F1] dark:bg-[#1A251E] border border-[#657565]/30 overflow-hidden shadow-xs">
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-white/70 dark:bg-[#1F2E24] border-b border-[#657565]/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2E6B56] text-white flex items-center justify-center shadow-xs">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-[#141A16] dark:text-[#ECF2EE]">
                {calculatorName || meta.name}
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2E6B56]/15 text-[#2E6B56] dark:text-[#4ADE80]">
                {meta.category}
              </span>
            </div>
            <p className="text-[11px] text-[#526058] dark:text-[#97A69E] m-0 line-clamp-1">
              {description || meta.description}
            </p>
          </div>
        </div>

        {showFullLink && (
          <Link
            to={meta.url}
            className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-[#2E6B56] dark:text-[#4ADE80] hover:underline no-underline shrink-0"
          >
            <span>Full Tool</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Interactive Input Form */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Dynamic Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {meta.fields.map(f => (
            <div key={f.key} className="space-y-1">
              <label className="text-[11px] font-bold text-[#20231F] dark:text-[#EAE7E0]">
                {f.label} ({f.unit})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={f.step || 'any'}
                  value={inputs[f.key] !== undefined ? inputs[f.key] : f.defaultValue}
                  onChange={e => handleInputChange(f.key, e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-white dark:bg-[#151C17] border border-[#657565]/30 rounded-xl text-[#20231F] dark:text-[#EAE7E0] outline-none focus:border-[#2E6B56]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#7B8978]">
                  {f.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Calculate button */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setCalculated(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2E6B56] hover:bg-[#245745] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculate {calculatorId === 'concrete-volume' ? 'Volume' : 'Result'}</span>
          </button>

          <button
            type="button"
            onClick={() => setInputs(meta.defaultInputs)}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-[#7B8978] hover:text-[#20231F] dark:hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Inputs</span>
          </button>
        </div>

        {/* Result Card */}
        {calculated && (
          <div className="p-4 rounded-xl bg-white dark:bg-[#141C16] border border-[#2E6B56]/30 shadow-xs space-y-3">
            <div className="flex items-baseline justify-between border-b border-[#E2E6E2] dark:border-white/10 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#526058] dark:text-[#97A69E]">
                Calculated Result:
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-[#2E6B56] dark:text-[#4ADE80] font-mono">
                  {result.mainValue}
                </span>
                <span className="text-sm font-bold text-[#526058] dark:text-[#97A69E]">
                  {result.mainUnit}
                </span>
              </div>
            </div>

            {/* Breakdown detail rows */}
            {result.details && result.details.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {result.details.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#F7F8F7] dark:bg-[#18221B]">
                    <span className="text-[#526058] dark:text-[#97A69E]">{d.label}:</span>
                    <strong className="text-[#141A16] dark:text-[#ECF2EE] font-mono">{d.value}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
