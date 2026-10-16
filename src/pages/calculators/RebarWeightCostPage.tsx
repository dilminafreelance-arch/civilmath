import { useMemo, useState } from 'react';
import CalculatorPageTemplate from '../../components/CalculatorPageTemplate';
import { NumericInput } from '../../components/NumericInput';
import { Card } from '../../components/ui';
import { AlertTriangle, Calculator } from 'lucide-react';

const TITLE = 'Rebar Weight & Cost Calculator';
const DESC =
  'Free rebar weight and cost calculator. Select ASTM bar size (#3–#11) or metric diameter, enter bar count, length, and your steel price to estimate total rebar weight and material cost. Imperial and metric units.';

type UnitSystem = 'imperial' | 'metric';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

interface ImperialBar {
  size: string;
  diaIn: number;
  wtLbFt: number;
}

// ASTM A615 standard unit weights (lb/ft)
const IMPERIAL_BARS: ImperialBar[] = [
  { size: '#3', diaIn: 0.375, wtLbFt: 0.376 },
  { size: '#4', diaIn: 0.5, wtLbFt: 0.668 },
  { size: '#5', diaIn: 0.625, wtLbFt: 1.043 },
  { size: '#6', diaIn: 0.75, wtLbFt: 1.502 },
  { size: '#7', diaIn: 0.875, wtLbFt: 2.044 },
  { size: '#8', diaIn: 1.0, wtLbFt: 2.67 },
  { size: '#9', diaIn: 1.128, wtLbFt: 3.4 },
  { size: '#10', diaIn: 1.27, wtLbFt: 4.303 },
  { size: '#11', diaIn: 1.41, wtLbFt: 5.313 },
];

const METRIC_DIAMETERS = [8, 10, 12, 16, 20, 25, 32, 40];

// kg/m from steel density 7850 kg/m^3: w = pi/4 * (d/1000)^2 * 7850 = d^2 / 162.2
const metricUnitWeight = (dMm: number) => (dMm * dMm) / 162.2;

interface FieldProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  unit: string;
  min?: number;
  hint?: string;
}

function Field({ label, value, onChange, unit, min = 0, hint }: FieldProps) {
  const invalid = !(value > min);
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-ink-muted">
        {label}
      </span>
      <span className="relative block">
        <NumericInput
          value={value}
          onChange={(_raw, num) => onChange(num)}
          suffix={unit}
          aria-label={`${label} in ${unit}`}
          aria-invalid={invalid}
          className="w-full"
        />
      </span>
      {hint && <span className="mt-1 block text-[10px] text-ink-muted">{hint}</span>}
      {invalid && (
        <span role="alert" className="mt-1 block text-[10px] font-semibold text-red-600 dark:text-red-400">
          Enter a value greater than {min}.
        </span>
      )}
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}

function SelectField({ label, value, onChange, options, hint }: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-ink-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="w-full rounded-xl border border-border-subtle bg-surface-1 px-3 py-2.5 text-sm font-semibold text-ink shadow-xs outline-none transition-colors focus:border-brand"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="mt-1 block text-[10px] text-ink-muted">{hint}</span>}
    </label>
  );
}

export default function RebarWeightCostPage() {
  const [units, setUnits] = useState<UnitSystem>('imperial');
  const [barSize, setBarSize] = useState('#4');
  const [diaMm, setDiaMm] = useState('12');
  const [count, setCount] = useState(20);
  const [length, setLength] = useState(20);
  const [price, setPrice] = useState(0.65);
  const [waste, setWaste] = useState(5);

  const result = useMemo(() => {
    if (!(count > 0) || !(length > 0) || !(price > 0) || waste < 0) return null;
    if (units === 'imperial') {
      const bar = IMPERIAL_BARS.find((b) => b.size === barSize) ?? IMPERIAL_BARS[1];
      const totalLengthFt = count * length;
      const totalWeightLb = totalLengthFt * bar.wtLbFt * (1 + waste / 100);
      const totalCost = totalWeightLb * price;
      return {
        barLabel: `${bar.size} (${bar.diaIn.toFixed(3)} in dia)`,
        unitWeightLabel: `${bar.wtLbFt.toFixed(3)} lb/ft`,
        totalLengthLabel: `${totalLengthFt.toFixed(1)} ft`,
        totalWeightLabel: `${totalWeightLb.toFixed(1)} lb`,
        totalCost,
        perBarLabel: `${usd.format(count > 0 ? totalCost / count : 0)} / bar`,
        wasteNote: `Includes ${waste}% cutting waste`,
      };
    }
    const d = Number(diaMm) || 12;
    const wtKgM = metricUnitWeight(d);
    const totalLengthM = count * length;
    const totalWeightKg = totalLengthM * wtKgM * (1 + waste / 100);
    const totalCost = totalWeightKg * price;
    return {
      barLabel: `${d} mm diameter`,
      unitWeightLabel: `${wtKgM.toFixed(3)} kg/m`,
      totalLengthLabel: `${totalLengthM.toFixed(1)} m`,
      totalWeightLabel: `${totalWeightKg.toFixed(1)} kg`,
      totalCost,
      perBarLabel: `${usd.format(count > 0 ? totalCost / count : 0)} / bar`,
      wasteNote: `Includes ${waste}% cutting waste`,
    };
  }, [units, barSize, diaMm, count, length, price, waste]);

  const lenUnit = units === 'imperial' ? 'ft' : 'm';
  const priceUnit = units === 'imperial' ? '$/lb' : '$/kg';

  return (
    <CalculatorPageTemplate
      title={TITLE}
      description={DESC}
      category="structural"
      path="/rebar/weight-cost"
      breadcrumbLabel="Rebar Weight & Cost"
      faqs={[
        {
          question: 'How is rebar weight calculated?',
          answer:
            'Imperial: total weight = number of bars × length per bar × the ASTM A615 standard unit weight for the selected bar size (#3–#11), e.g. #4 bar weighs 0.668 lb/ft. Metric: unit weight (kg/m) = diameter² ÷ 162.2, where diameter is in mm — this comes from the steel density of 7850 kg/m³. Your waste margin is added on top.',
        },
        {
          question: 'What steel price should I enter?',
          answer:
            'Enter the price your local supplier quotes per pound (US) or per kilogram. US retail rebar is often roughly $0.50–$0.90/lb depending on region, bar size, and quantity, and prices move with steel markets — confirm with a supplier before budgeting. Delivery, cutting, bending, tax, and lap-splice extras are not included.',
        },
        {
          question: 'Does this include lap splices and hooks?',
          answer:
            'No. Lap splice lengths and hooks must be added to your bar lengths before calculating — check the project drawings and specifications for the required lap lengths. The waste margin covers cutting waste only, not splices.',
        },
      ]}
    >
      <Card elevation="raised" className="p-5 shadow-xs">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-bold text-ink">Bars &amp; price</h2>
          </div>
          <div className="flex rounded-xl border border-border-subtle bg-surface-2 p-0.5" role="group" aria-label="Unit system">
            {(['imperial', 'metric'] as UnitSystem[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnits(u)}
                aria-pressed={units === u}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold capitalize transition-colors ${
                  units === u
                    ? 'bg-surface-1 text-ink shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {u === 'imperial' ? 'ft / lb' : 'm / kg'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {units === 'imperial' ? (
            <SelectField
              label="Bar size"
              value={barSize}
              onChange={setBarSize}
              options={IMPERIAL_BARS.map((b) => ({
                value: b.size,
                label: `${b.size} — ${b.diaIn.toFixed(3)} in dia, ${b.wtLbFt.toFixed(3)} lb/ft`,
              }))}
              hint="ASTM A615 standard bar sizes."
            />
          ) : (
            <SelectField
              label="Bar diameter"
              value={diaMm}
              onChange={setDiaMm}
              options={METRIC_DIAMETERS.map((d) => ({
                value: String(d),
                label: `${d} mm — ${metricUnitWeight(d).toFixed(3)} kg/m`,
              }))}
              hint="Standard metric diameters."
            />
          )}
          <Field label="Number of bars" value={count} onChange={setCount} unit="bars" />
          <Field
            label="Length per bar"
            value={length}
            onChange={setLength}
            unit={lenUnit}
            hint={units === 'imperial' ? 'Standard US bar length: 20 ft or 40 ft.' : 'Standard mill length: 6 m or 12 m.'}
          />
          <Field
            label="Steel price"
            value={price}
            onChange={setPrice}
            unit={priceUnit}
            hint="Your supplier's price per pound (or kg)."
          />
          <Field
            label="Waste margin"
            value={waste}
            onChange={setWaste}
            unit="%"
            min={-1}
            hint="Cutting waste allowance (3–5% typical)."
          />
        </div>
      </Card>

      <Card elevation="blueprint" className="mt-4 p-5">
        <h2 className="mb-4 text-sm font-bold text-ink">Estimate</h2>
        {result ? (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-1 p-4">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Total bar length</dt>
              <dd className="mt-1 text-xl font-bold text-ink">{result.totalLengthLabel}</dd>
              <dd className="text-[10px] text-ink-muted">{result.barLabel} · {result.unitWeightLabel}</dd>
            </div>
            <div className="rounded-xl bg-surface-1 p-4">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Total steel weight</dt>
              <dd className="mt-1 text-xl font-bold text-ink">{result.totalWeightLabel}</dd>
              <dd className="text-[10px] text-ink-muted">{result.wasteNote}</dd>
            </div>
            <div className="rounded-xl bg-brand/10 p-4 sm:col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Estimated material cost</dt>
              <dd className="mt-1 text-3xl font-bold text-brand">{usd.format(result.totalCost)}</dd>
              <dd className="text-[11px] font-semibold text-ink-secondary">{result.perBarLabel}</dd>
            </div>
          </dl>
        ) : (
          <p role="status" className="text-xs text-ink-muted">
            Enter valid bar count, length, and price to see the estimate.
          </p>
        )}
      </Card>

      <section className="mt-8 max-w-4xl" aria-label="Method and assumptions">
        <h2 className="mb-3 text-sm font-bold text-ink">Method &amp; assumptions</h2>
        <Card elevation="raised" className="space-y-3 p-5 shadow-xs">
          <ol className="list-decimal space-y-1.5 pl-5 text-[11px] leading-relaxed text-ink-secondary">
            <li>Total length = number of bars × length per bar.</li>
            <li>Unit weight: ASTM A615 standard lb/ft per bar size (imperial), or d²/162.2 kg/m from 7850 kg/m³ steel density (metric).</li>
            <li>Total weight = total length × unit weight × (1 + waste %).</li>
            <li>Total cost = total weight × the steel unit price you enter.</li>
          </ol>
          <p className="text-[11px] leading-relaxed text-ink-muted">
            Assumes straight bars of uniform size. Excludes lap splices, hooks, chairs,
            tying wire, cutting/bending labor, delivery, and taxes — add splice lengths to
            bar lengths per the project specifications, and confirm pricing with your
            steel supplier.
          </p>
        </Card>
      </section>

      <section className="mt-4 max-w-4xl" aria-label="Disclaimer">
        <Card elevation="flat" className="flex gap-3 p-4">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] leading-relaxed text-ink-secondary">
            <strong className="text-ink">Estimate only, not a quote.</strong> Steel prices
            vary by region, bar size, and order quantity. This tool is for planning and
            budgeting — confirm quantities and pricing with your supplier and have
            reinforcement detailed by a qualified engineer before construction.
          </p>
        </Card>
      </section>
    </CalculatorPageTemplate>
  );
}
