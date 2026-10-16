import { useMemo, useState } from 'react';
import CalculatorPageTemplate from '../../components/CalculatorPageTemplate';
import { CALCULATOR_FAQS } from '../../data/calculatorFaqs';
import DownloadResultsPdf from '../../components/DownloadResultsPdf';
import NewsletterSignup from '../../components/NewsletterSignup';
import { NumericInput } from '../../components/NumericInput';
import { Button, Card } from '../../components/ui';
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

interface CalcInputs {
  units: UnitSystem;
  barSize: string;
  diaMm: string;
  count: number;
  length: number;
  price: number;
  waste: number;
}

export default function RebarWeightCostPage() {
  const [units, setUnits] = useState<UnitSystem>('imperial');
  const [barSize, setBarSize] = useState('#4');
  const [diaMm, setDiaMm] = useState('12');
  const [count, setCount] = useState(20);
  const [length, setLength] = useState(20);
  const [price, setPrice] = useState(0.65);
  const [waste, setWaste] = useState(5);
  const [submitted, setSubmitted] = useState<CalcInputs | null>(null);
  const [popKey, setPopKey] = useState(0);

  const handleCalculate = () => {
    setSubmitted({ units, barSize, diaMm, count, length, price, waste });
    setPopKey((k) => k + 1);
  };

  const result = useMemo(() => {
    if (!submitted) return null;
    const { units: u, count: c, length: len, price: p, waste: w } = submitted;
    if (!(c > 0) || !(len > 0) || !(p > 0) || w < 0) return null;
    const imperial = u === 'imperial';
    const barLabel = imperial
      ? (() => {
          const bar = IMPERIAL_BARS.find((b) => b.size === submitted.barSize) ?? IMPERIAL_BARS[1];
          return { text: `${bar.size} (${bar.diaIn.toFixed(3)} in dia)`, unit: `${bar.wtLbFt.toFixed(3)} lb/ft`, wt: bar.wtLbFt };
        })()
      : (() => {
          const d = Number(submitted.diaMm) || 12;
          return { text: `${d} mm diameter`, unit: `${metricUnitWeight(d).toFixed(3)} kg/m`, wt: metricUnitWeight(d) };
        })();
    const totalLength = c * len;
    const totalWeight = totalLength * barLabel.wt * (1 + w / 100);
    const totalCost = totalWeight * p;
    return {
      barText: barLabel.text,
      unitWeightLabel: barLabel.unit,
      totalLengthLabel: `${totalLength.toFixed(1)} ${imperial ? 'ft' : 'm'}`,
      totalWeightLabel: `${totalWeight.toFixed(1)} ${imperial ? 'lb' : 'kg'}`,
      totalCost,
      perBarLabel: `${usd.format(c > 0 ? totalCost / c : 0)} / bar`,
      wasteNote: `Includes ${w}% cutting waste`,
      imperial,
    };
  }, [submitted]);

  const lenUnit = units === 'imperial' ? 'ft' : 'm';
  const priceUnit = units === 'imperial' ? '$/lb' : '$/kg';

  return (
    <CalculatorPageTemplate
      title={TITLE}
      description={DESC}
      category="structural"
      path="/rebar/weight-cost"
      breadcrumbLabel="Rebar Weight & Cost"
      faqs={CALCULATOR_FAQS['/rebar/weight-cost']}
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

        <div className="mt-5">
          <Button
            variant="primary"
            size="lg"
            icon={Calculator}
            onClick={handleCalculate}
            className="w-full sm:w-auto"
          >
            Calculate
          </Button>
        </div>
      </Card>

      <Card elevation="blueprint" className="mt-4 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-ink">Estimate</h2>
          {result && (
            <DownloadResultsPdf
              title="Rebar Weight & Cost — Estimate"
              fileName="civilmath-rebar-estimate.pdf"
              inputs={[
                { label: 'Bar', value: result.barText, sub: `Unit weight ${result.unitWeightLabel}` },
                { label: 'Bars × length', value: `${submitted?.count} × ${submitted?.length} ${result.imperial ? 'ft' : 'm'}` },
                { label: 'Steel price', value: `${usd.format(submitted?.price ?? 0)} / ${result.imperial ? 'lb' : 'kg'}` },
                { label: 'Waste margin', value: `${submitted?.waste}%` },
              ]}
              results={[
                { label: 'Total bar length', value: result.totalLengthLabel },
                { label: 'Total steel weight', value: result.totalWeightLabel, sub: result.wasteNote },
                { label: 'Estimated material cost', value: usd.format(result.totalCost), sub: result.perBarLabel },
              ]}
              notes={[
                'Straight bars of uniform size assumed.',
                'Add lap splice lengths and hooks to bar lengths per project specifications.',
                'Excludes cutting/bending labor, delivery, and taxes.',
              ]}
            />
          )}
        </div>
        {result ? (
          <dl key={popKey} className="animate-bounce-in grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-1 p-4">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Total bar length</dt>
              <dd className="mt-1 text-xl font-bold text-ink">{result.totalLengthLabel}</dd>
              <dd className="text-[10px] text-ink-muted">{result.barText} · {result.unitWeightLabel}</dd>
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
            {submitted
              ? 'Enter valid bar count, length, and price, then press Calculate.'
              : 'Enter your bars and price, then press Calculate to see the estimate.'}
          </p>
        )}
      </Card>

      <Card elevation="flat" className="mt-4 p-5">
        <NewsletterSignup source="rebar" />
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
