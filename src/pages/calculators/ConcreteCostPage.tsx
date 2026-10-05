import { useMemo, useState } from 'react';
import CalculatorPageTemplate from '../../components/CalculatorPageTemplate';
import { NumericInput } from '../../components/NumericInput';
import { Card } from '../../components/ui';
import { AlertTriangle, Calculator } from 'lucide-react';

const TITLE = 'Concrete Slab Cost Calculator';
const DESC =
  'Free concrete slab cost calculator. Enter slab dimensions and your local ready-mix price to estimate concrete volume (yd³), total material cost, and price per square foot. Imperial and metric units.';

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

export default function ConcreteCostPage() {
  const [units, setUnits] = useState<UnitSystem>('imperial');
  const [length, setLength] = useState(20);
  const [width, setWidth] = useState(12);
  const [thickness, setThickness] = useState(4);
  const [price, setPrice] = useState(150);
  const [waste, setWaste] = useState(7);

  const result = useMemo(() => {
    if (!(length > 0) || !(width > 0) || !(thickness > 0) || !(price > 0) || waste < 0) {
      return null;
    }
    if (units === 'imperial') {
      const volumeFt3 = length * width * (thickness / 12);
      const volumeYd3 = volumeFt3 / 27;
      const volumeOrder = volumeYd3 * (1 + waste / 100);
      const totalCost = volumeOrder * price;
      const areaFt2 = length * width;
      return {
        volumeLabel: `${volumeYd3.toFixed(2)} yd³`,
        volumeOrderLabel: `${volumeOrder.toFixed(2)} yd³`,
        totalCost,
        unitCostLabel: `${usd.format(areaFt2 > 0 ? totalCost / areaFt2 : 0)} / ft²`,
        areaLabel: `${areaFt2.toFixed(0)} ft²`,
      };
    }
    const volumeM3 = length * width * (thickness / 100);
    const volumeOrder = volumeM3 * (1 + waste / 100);
    const totalCost = volumeOrder * price;
    const areaM2 = length * width;
    return {
      volumeLabel: `${volumeM3.toFixed(2)} m³`,
      volumeOrderLabel: `${volumeOrder.toFixed(2)} m³`,
      totalCost,
      unitCostLabel: `${usd.format(areaM2 > 0 ? totalCost / areaM2 : 0)} / m²`,
      areaLabel: `${areaM2.toFixed(1)} m²`,
    };
  }, [units, length, width, thickness, price, waste]);

  const lenUnit = units === 'imperial' ? 'ft' : 'm';
  const thickUnit = units === 'imperial' ? 'in' : 'cm';
  const priceUnit = units === 'imperial' ? '$/yd³' : '$/m³';

  return (
    <CalculatorPageTemplate
      title={TITLE}
      description={DESC}
      category="concrete"
      path="/concrete/cost"
      breadcrumbLabel="Slab Cost"
      faqs={[
        {
          question: 'How is the concrete slab cost calculated?',
          answer:
            'The calculator finds the slab volume (length × width × thickness), converts it to cubic yards (or cubic metres), adds your waste margin for spillage and over-excavation, then multiplies by the ready-mix price you enter. It also shows the price per square foot (or square metre) so you can compare quotes.',
        },
        {
          question: 'What ready-mix price should I enter?',
          answer:
            'Enter the price your local supplier quotes per cubic yard (US typical range is roughly $120–$180/yd³ depending on region, mix strength, and delivery distance). Prices move with fuel and cement costs, so confirm with a supplier before ordering. Delivery, short-load, and weekend fees are not included.',
        },
        {
          question: 'Does this include labor, forms, and rebar?',
          answer:
            'No. This is a ready-mix material cost estimate only. Formwork, reinforcement, subgrade preparation, placement labor, and finishing are separate costs — typically they exceed the concrete material cost on residential slabs.',
        },
      ]}
    >
      <Card elevation="raised" className="p-5 shadow-xs">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-bold text-ink">Slab dimensions &amp; price</h2>
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
          <Field label="Length" value={length} onChange={setLength} unit={lenUnit} />
          <Field label="Width" value={width} onChange={setWidth} unit={lenUnit} />
          <Field
            label="Thickness"
            value={thickness}
            onChange={setThickness}
            unit={thickUnit}
            hint={units === 'imperial' ? 'Typical residential slab: 4 in.' : 'Typical residential slab: 10 cm.'}
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
      </Card>

      <Card elevation="blueprint" className="mt-4 p-5">
        <h2 className="mb-4 text-sm font-bold text-ink">Estimate</h2>
        {result ? (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-1 p-4">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Concrete volume</dt>
              <dd className="mt-1 text-xl font-bold text-ink">{result.volumeLabel}</dd>
              <dd className="text-[10px] text-ink-muted">Slab area: {result.areaLabel}</dd>
            </div>
            <div className="rounded-xl bg-surface-1 p-4">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Order with waste</dt>
              <dd className="mt-1 text-xl font-bold text-ink">{result.volumeOrderLabel}</dd>
              <dd className="text-[10px] text-ink-muted">Includes {waste}% waste margin</dd>
            </div>
            <div className="rounded-xl bg-brand/10 p-4 sm:col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">Estimated material cost</dt>
              <dd className="mt-1 text-3xl font-bold text-brand">{usd.format(result.totalCost)}</dd>
              <dd className="text-[11px] font-semibold text-ink-secondary">{result.unitCostLabel}</dd>
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
            <li>Volume = length × width × thickness, converted to yd³ (÷ 27) or m³.</li>
            <li>Order volume = volume × (1 + waste %), covering spillage and subgrade variation.</li>
            <li>Total cost = order volume × ready-mix unit price you enter.</li>
            <li>Price per ft² (or m²) = total cost ÷ slab area, for quote comparison.</li>
          </ol>
          <p className="text-[11px] leading-relaxed text-ink-muted">
            Assumes a rectangular slab/pad of uniform thickness and a single ready-mix
            strength. Excludes reinforcement, formwork, subgrade prep, placement labor,
            finishing, delivery/short-load fees, and taxes — get a written supplier quote
            before ordering.
          </p>
        </Card>
      </section>

      <section className="mt-4 max-w-4xl" aria-label="Disclaimer">
        <Card elevation="flat" className="flex gap-3 p-4">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] leading-relaxed text-ink-secondary">
            <strong className="text-ink">Estimate only, not a quote.</strong> Ready-mix
            prices vary by region, mix design, and delivery distance. This tool is for
            planning and budgeting — confirm quantities and pricing with your concrete
            supplier and a qualified engineer before construction.
          </p>
        </Card>
      </section>
    </CalculatorPageTemplate>
  );
}
