import { useMemo, useState } from 'react';
import CalculatorPageTemplate from '../../components/CalculatorPageTemplate';
import { NumericInput } from '../../components/NumericInput';
import { Card } from '../../components/ui';
import { AlertTriangle, Calculator, Info } from 'lucide-react';

const TITLE = 'Concrete Step Calculator';
const DESC =
  'Free concrete step calculator. Enter riser height, tread depth, number of steps, and stair width to estimate concrete volume (yd³), waist slab, landing, and material cost. Imperial and metric units.';

type UnitSystem = 'imperial' | 'metric';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

interface FieldProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  unit: string;
  min?: number;
  hint?: string;
  step?: number;
}

function Field({ label, value, onChange, unit, min = 0, hint, step }: FieldProps) {
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

export default function ConcreteStepsPage() {
  const [units, setUnits] = useState<UnitSystem>('imperial');
  const [steps, setSteps] = useState(4);
  const [riser, setRiser] = useState(7);
  const [tread, setTread] = useState(11);
  const [width, setWidth] = useState(4);
  const [waist, setWaist] = useState(0);
  const [landingLen, setLandingLen] = useState(0);
  const [landingThick, setLandingThick] = useState(4);
  const [price, setPrice] = useState(150);
  const [waste, setWaste] = useState(7);

  const result = useMemo(() => {
    const n = Math.max(1, Math.round(steps));
    const valid =
      Number.isFinite(n) &&
      riser > 0 &&
      tread > 0 &&
      width > 0 &&
      waist >= 0 &&
      landingLen >= 0 &&
      landingThick >= 0 &&
      price > 0 &&
      waste >= 0;
    if (!valid) return null;

    if (units === 'imperial') {
      const r = riser / 12; // ft
      const t = tread / 12; // ft
      const b = waist / 12; // ft
      const lLen = landingLen; // ft
      const lThick = landingThick / 12; // ft

      const totalRise = n * r;
      const totalRun = n * t;
      const stepsFt3 = n * r * t * width;
      const slopeLen = Math.sqrt(totalRise * totalRise + totalRun * totalRun);
      const waistFt3 = b * slopeLen * width;
      const landingFt3 = lLen * width * lThick;

      const totalFt3 = stepsFt3 + waistFt3 + landingFt3;
      const totalYd3 = totalFt3 / 27;
      const orderYd3 = totalYd3 * (1 + waste / 100);
      const totalCost = orderYd3 * price;

      return {
        n,
        totalRiseLabel: `${(n * riser).toFixed(1)} in`,
        totalRunLabel: `${(n * tread).toFixed(1)} in (${((n * tread) / 12).toFixed(2)} ft)`,
        stepsLabel: `${(stepsFt3 / 27).toFixed(3)} yd³`,
        waistLabel: `${(waistFt3 / 27).toFixed(3)} yd³`,
        landingLabel: `${(landingFt3 / 27).toFixed(3)} yd³`,
        volumeLabel: `${totalYd3.toFixed(3)} yd³`,
        volumeOrderLabel: `${orderYd3.toFixed(3)} yd³`,
        totalCost,
        hasWaist: waist > 0,
        hasLanding: landingLen > 0,
      };
    }

    const r = riser / 100; // m
    const t = tread / 100; // m
    const b = waist / 100; // m
    const lLen = landingLen; // m
    const lThick = landingThick / 100; // m

    const totalRise = n * r;
    const totalRun = n * t;
    const stepsM3 = n * r * t * width;
    const slopeLen = Math.sqrt(totalRise * totalRise + totalRun * totalRun);
    const waistM3 = b * slopeLen * width;
    const landingM3 = lLen * width * lThick;

    const totalM3 = stepsM3 + waistM3 + landingM3;
    const orderM3 = totalM3 * (1 + waste / 100);
    const totalCost = orderM3 * price;

    return {
      n,
      totalRiseLabel: `${(n * riser).toFixed(1)} cm`,
      totalRunLabel: `${(n * tread).toFixed(1)} cm (${(n * t).toFixed(2)} m)`,
      stepsLabel: `${stepsM3.toFixed(3)} m³`,
      waistLabel: `${waistM3.toFixed(3)} m³`,
      landingLabel: `${landingM3.toFixed(3)} m³`,
      volumeLabel: `${totalM3.toFixed(3)} m³`,
      volumeOrderLabel: `${orderM3.toFixed(3)} m³`,
      totalCost,
      hasWaist: waist > 0,
      hasLanding: landingLen > 0,
    };
  }, [units, steps, riser, tread, width, waist, landingLen, landingThick, price, waste]);

  const codeWarning = useMemo(() => {
    if (units === 'imperial') {
      if (riser > 7.75) return 'Riser is above the common residential maximum of 7¾ in (IRC R311.7) — verify against your local code.';
      if (tread < 10) return 'Tread is below the common residential minimum of 10 in (IRC R311.7) — verify against your local code.';
      return null;
    }
    if (riser > 19.7) return 'Riser is above the common residential maximum of ~197 mm (IRC R311.7: 7¾ in) — verify against your local code.';
    if (tread < 25.4) return 'Tread is below the common residential minimum of ~254 mm (IRC R311.7: 10 in) — verify against your local code.';
    return null;
  }, [units, riser, tread]);

  const smallUnit = units === 'imperial' ? 'in' : 'cm';
  const lenUnit = units === 'imperial' ? 'ft' : 'm';
  const priceUnit = units === 'imperial' ? '$/yd³' : '$/m³';

  return (
    <CalculatorPageTemplate
      title={TITLE}
      description={DESC}
      category="concrete"
      path="/concrete/steps"
      breadcrumbLabel="Steps"
      faqs={[
        {
          question: 'How is the concrete volume for steps calculated?',
          answer:
            'Each step is treated as a rectangular block: riser height × tread depth × stair width, multiplied by the number of steps. If you enter a waist slab thickness, the sloped slab under the steps is added (thickness × slope length × width), and an optional top landing is added as length × width × thickness. A waste margin is then applied and the result is priced at your ready-mix rate.',
        },
        {
          question: 'What is the waist slab and do I need it?',
          answer:
            'The waist slab is the sloped concrete slab that the steps sit on, spanning the full incline of the staircase. Freestanding exterior stairs usually need one (typically 4–6 in thick). If your steps are built over solid compacted fill or sit on an existing slab, enter 0 and the calculator estimates the steps alone.',
        },
        {
          question: 'What riser and tread sizes should I use?',
          answer:
            'Common residential guidance (e.g., IRC R311.7) limits risers to about 7¾ in (197 mm) and requires treads of at least 10 in (254 mm). Many builders aim for a comfortable 7 in riser with an 11 in tread. Always verify against your local building code before construction — requirements vary by jurisdiction.',
        },
        {
          question: 'Does this include rebar, formwork, and labor?',
          answer:
            'No. This is a ready-mix material volume and cost estimate only. Reinforcement, formwork, subgrade preparation, placement labor, finishing, delivery and short-load fees are separate costs — get a written supplier quote before ordering.',
        },
      ]}
    >
      <Card elevation="raised" className="p-5 shadow-xs">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-bold text-ink">Stair dimensions</h2>
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
                {u === 'imperial' ? 'ft / in' : 'm / cm'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Number of steps"
            value={steps}
            onChange={(v) => setSteps(Math.max(1, Math.round(v)))}
            unit="steps"
            hint="Count every riser from grade to the top landing."
          />
          <Field
            label="Riser height"
            value={riser}
            onChange={setRiser}
            unit={smallUnit}
            hint={units === 'imperial' ? 'Typical residential: 7 in.' : 'Typical residential: 18 cm.'}
          />
          <Field
            label="Tread depth"
            value={tread}
            onChange={setTread}
            unit={smallUnit}
            hint={units === 'imperial' ? 'Typical residential: 11 in.' : 'Typical residential: 28 cm.'}
          />
          <Field
            label="Stair width"
            value={width}
            onChange={setWidth}
            unit={lenUnit}
            hint="Clear width of the steps."
          />
          <Field
            label="Waist slab thickness"
            value={waist}
            onChange={setWaist}
            unit={smallUnit}
            min={-1}
            hint="Sloped slab under the steps. Enter 0 for steps on solid fill."
          />
          <Field
            label="Landing length"
            value={landingLen}
            onChange={setLandingLen}
            unit={lenUnit}
            min={-1}
            hint="Top platform length. Enter 0 for no landing."
          />
          <Field
            label="Landing thickness"
            value={landingThick}
            onChange={setLandingThick}
            unit={smallUnit}
            min={-1}
            hint={units === 'imperial' ? 'Typical: 4 in.' : 'Typical: 10 cm.'}
          />
          <Field
            label="Ready-mix price"
            value={price}
            onChange={setPrice}
            unit={priceUnit}
            hint="Per cubic yard (or m³) from your supplier."
          />
          <Field
            label="Waste margin"
            value={waste}
            onChange={setWaste}
            unit="%"
            min={-1}
            hint="Spillage & over-excavation allowance (5–10% typical)."
          />
        </div>

        {codeWarning && (
          <Card elevation="flat" className="mt-4 flex gap-3 p-4">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-[11px] leading-relaxed text-ink-secondary">{codeWarning}</p>
          </Card>
        )}
      </Card>

      <Card elevation="blueprint" className="mt-4 p-5">
        <h2 className="mb-4 text-sm font-bold text-ink">Estimate</h2>
        {result ? (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-1 p-4">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Stair geometry</dt>
              <dd className="mt-1 text-xl font-bold text-ink">{result.n} steps</dd>
              <dd className="text-[10px] text-ink-muted">Total rise {result.totalRiseLabel} · total run {result.totalRunLabel}</dd>
            </div>
            <div className="rounded-xl bg-surface-1 p-4">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Steps concrete</dt>
              <dd className="mt-1 text-xl font-bold text-ink">{result.stepsLabel}</dd>
              {result.hasWaist && <dd className="text-[10px] text-ink-muted">Waist slab: {result.waistLabel}</dd>}
              {result.hasLanding && <dd className="text-[10px] text-ink-muted">Landing: {result.landingLabel}</dd>}
            </div>
            <div className="rounded-xl bg-surface-1 p-4">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Order with waste</dt>
              <dd className="mt-1 text-xl font-bold text-ink">{result.volumeOrderLabel}</dd>
              <dd className="text-[10px] text-ink-muted">Net volume {result.volumeLabel} · includes {waste}% waste</dd>
            </div>
            <div className="rounded-xl bg-brand/10 p-4">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Estimated material cost</dt>
              <dd className="mt-1 text-3xl font-bold text-brand">{usd.format(result.totalCost)}</dd>
              <dd className="text-[11px] font-semibold text-ink-secondary">At {usd.format(price)} per {units === 'imperial' ? 'yd³' : 'm³'}</dd>
            </div>
          </dl>
        ) : (
          <p role="status" className="text-xs text-ink-muted">
            Enter valid positive dimensions and price to see the estimate.
          </p>
        )}
      </Card>

      <section className="mt-8 max-w-4xl" aria-label="Method and assumptions">
        <h2 className="mb-3 text-sm font-bold text-ink">Method &amp; assumptions</h2>
        <Card elevation="raised" className="space-y-3 p-5 shadow-xs">
          <ol className="list-decimal space-y-1.5 pl-5 text-[11px] leading-relaxed text-ink-secondary">
            <li>Steps volume = number of steps × riser height × tread depth × stair width, converted to yd³ (÷ 27) or m³.</li>
            <li>Waist slab (if any) = thickness × slope length √(total rise² + total run²) × width.</li>
            <li>Landing (if any) = length × width × thickness.</li>
            <li>Order volume = total volume × (1 + waste %), covering spillage and formwork variation.</li>
            <li>Total cost = order volume × ready-mix unit price you enter.</li>
          </ol>
          <p className="text-[11px] leading-relaxed text-ink-muted">
            Assumes straight-run stairs with identical steps and a rectangular landing.
            Riser/tread guidance follows common residential practice (e.g., IRC R311.7)
            — always confirm with your local building code. Excludes reinforcement,
            formwork, subgrade prep, placement labor, finishing, delivery/short-load
            fees, and taxes — get a written supplier quote before ordering.
          </p>
        </Card>
      </section>

      <section className="mt-4 max-w-4xl" aria-label="Disclaimer">
        <Card elevation="flat" className="flex gap-3 p-4">
          <Info className="h-4 w-4 shrink-0 text-brand" />
          <p className="text-[11px] leading-relaxed text-ink-secondary">
            <strong className="text-ink">Estimate only, not a quote.</strong> Ready-mix
            prices vary by region, mix design, and delivery distance. Stair dimensions
            must comply with your local building code — this tool does not certify
            code compliance. Confirm quantities and pricing with your concrete
            supplier and a qualified engineer before construction.
          </p>
        </Card>
      </section>
    </CalculatorPageTemplate>
  );
}
