import { UnitSystem } from '../types';

// Preset materials for Beam
export interface MaterialPreset {
  name: string;
  eValue: number; // in Pa (Metric) or psi (Imperial)
}

export const METRIC_MATERIALS: MaterialPreset[] = [
  { name: 'Structural Steel (A36)', eValue: 200e9 }, // 200 GPa
  { name: 'Concrete (C30/37)', eValue: 32e9 },     // 32 GPa
  { name: 'Douglas Fir (Timber)', eValue: 12e9 },   // 12 GPa
  { name: 'Aluminum (6061-T6)', eValue: 69e9 }      // 69 GPa
];

export const IMPERIAL_MATERIALS: MaterialPreset[] = [
  { name: 'Structural Steel (A36)', eValue: 29e6 }, // 29 x 10^6 psi
  { name: 'Concrete (4000 psi)', eValue: 3.6e6 },   // 3.6 x 10^6 psi
  { name: 'Douglas Fir (Timber)', eValue: 1.7e6 },  // 1.7 x 10^6 psi
  { name: 'Aluminum (6061-T6)', eValue: 10e6 }      // 10 x 10^6 psi
];

/**
 * Concrete Volume Calculator
 */
export interface ConcreteVolumeInput {
  length: number;
  width: number;
  thickness: number; // m or in
  wastePercent: number;
  shrinkagePercent?: number;
  unitCost: number; // cost per m³ or yd³
  cementRatio?: number;
  sandRatio?: number;
  aggregateRatio?: number;
  waterCementRatio?: number;
}

export interface ConcreteVolumeOutput {
  volumeRaw: number;
  volumeTotal: number; // with waste
  volumeDry: number;   // dry volume
  cementBags: number;  // 50kg bags (Metric) or 94lb bags (Imperial)
  sandWeight: number;  // tons
  aggregateWeight: number; // tons
  sandTons?: number;   // alias for sandWeight
  aggregateTons?: number; // alias for aggregateWeight
  waterLiters?: number;   // Liters
  waterGallons?: number;  // US Gallons
  totalCost: number;
}

export function calculateConcreteVolume(input: ConcreteVolumeInput, system: UnitSystem): ConcreteVolumeOutput {
  const { length, width, thickness, wastePercent, unitCost } = input;
  const shrinkagePercent = typeof input.shrinkagePercent === 'number' ? input.shrinkagePercent : 54;
  const dryMultiplier = 1 + shrinkagePercent / 100;
  
  let thicknessFtOrM = thickness;
  if (system === 'imperial') {
    // Thickness is given in inches. Convert to feet.
    thicknessFtOrM = thickness / 12;
  }
  
  // Calculate base volume (Wet Concrete Volume)
  const volumeBase = length * width * thicknessFtOrM; // m³ (SI) or ft³ (US)
  
  let volRaw = volumeBase;
  let volTotal = volumeBase * (1 + wastePercent / 100);
  
  if (system === 'imperial') {
    // Convert ft³ to cubic yards
    volRaw = volumeBase / 27;
    volTotal = (volumeBase * (1 + wastePercent / 100)) / 27;
  }

  // Get concrete mix ratios
  const cement = typeof input.cementRatio === 'number' && input.cementRatio > 0 ? input.cementRatio : 1;
  const sand = typeof input.sandRatio === 'number' && input.sandRatio >= 0 ? input.sandRatio : 1.5;
  const aggregate = typeof input.aggregateRatio === 'number' && input.aggregateRatio >= 0 ? input.aggregateRatio : 3;
  const totalParts = cement + sand + aggregate;
  const totalPartsSafe = totalParts > 0 ? totalParts : 5.5;

  // Wet concrete volume in m³ for material estimations (to never apply wastage to materials)
  let wetVolM3 = volumeBase;
  if (system === 'imperial') {
    // Convert ft³ to m³ (1 ft³ = 0.028316846592 m³)
    wetVolM3 = volumeBase * 0.028316846592;
  }

  // Calculate Dry Volume (m³) using user-defined shrinkage% (Default 54%)
  // "Never apply wastage to material quantities"
  const dryVolM3 = wetVolM3 * dryMultiplier;

  // Material Volumes in m³
  const cementVol = dryVolM3 * (cement / totalPartsSafe);
  const sandVol = dryVolM3 * (sand / totalPartsSafe);
  const aggregateVol = dryVolM3 * (aggregate / totalPartsSafe);

  // Cement Bags:
  // Metric: One 50 kg cement bag = 0.0347 m³
  // Imperial: One 94 lb cement bag = 1 ft³ = 0.0283168 m³
  const bagVol = system === 'metric' ? 0.0347 : 0.0283168;
  const cementBags = Math.ceil(cementVol / bagVol);

  // Material Weights (using fixed engineering densities):
  // Sand: 1600 kg/m³, Aggregate: 1550 kg/m³
  // Sand Weight (tons) = Sand Volume × 1600 / 1000
  // Aggregate Weight (tons) = Aggregate Volume × 1550 / 1000
  let sandWeight = (sandVol * 1600) / 1000;
  let aggregateWeight = (aggregateVol * 1550) / 1000;

  if (system === 'imperial') {
    // For Imperial system, output in Short Tons (1 short ton = 2000 lbs ≈ 0.90718 tonnes)
    sandWeight = sandWeight * 1.10231131;
    aggregateWeight = aggregateWeight * 1.10231131;
  }

  // Water requirement based on standard water-cement ratio
  const wcRatio = typeof input.waterCementRatio === 'number' && input.waterCementRatio > 0
    ? input.waterCementRatio
    : 0.50;
  const cementMassKg = cementVol * 1440;
  const waterLiters = cementMassKg * wcRatio;
  const waterGallons = waterLiters * 0.264172;

  // Total Cost = Ordered Concrete × Unit Cost
  const totalCost = volTotal * unitCost;

  const volDry = volRaw * dryMultiplier;

  return {
    volumeRaw: parseFloat(volRaw.toFixed(3)),
    volumeTotal: parseFloat(volTotal.toFixed(3)),
    volumeDry: parseFloat(volDry.toFixed(3)),
    cementBags,
    sandWeight: parseFloat(sandWeight.toFixed(3)),
    aggregateWeight: parseFloat(aggregateWeight.toFixed(3)),
    sandTons: parseFloat(sandWeight.toFixed(3)),
    aggregateTons: parseFloat(aggregateWeight.toFixed(3)),
    waterLiters: parseFloat(waterLiters.toFixed(1)),
    waterGallons: parseFloat(waterGallons.toFixed(1)),
    totalCost: parseFloat(totalCost.toFixed(2)),
  };
}

/**
 * Beam Load, Shear, Moment and Deflection Calculator
 */
export interface BeamInput {
  span: number;       // m or ft
  load: number;       // kN/m or klip/ft (or lbs/ft depending on labels)
  loadType: 'udl' | 'point'; // Uniformly Distributed vs Center Point Load
  eValue: number;     // Pa or psi
  inertia: number;    // cm^4 or in^4
}

export interface BeamOutput {
  maxMoment: number;      // kNm or kip-ft
  maxShear: number;       // kN or kips
  maxDeflection: number;  // mm or in
  isDeflectionOk: boolean;
  deflectionLimit: number; // L/240 serviceability limit
  sfPoints?: { x: number; val: number }[];
  bmPoints?: { x: number; val: number }[];
}

export function calculateBeam(input: BeamInput, system: UnitSystem): BeamOutput {
  const { span, load, loadType, eValue, inertia } = input;
  
  // Guard against zero inputs
  if (span <= 0 || load <= 0 || eValue <= 0 || inertia <= 0) {
    return { maxMoment: 0, maxShear: 0, maxDeflection: 0, isDeflectionOk: false, deflectionLimit: 0, sfPoints: [], bmPoints: [] };
  }

  // Generate SF & BM diagram points along the beam span
  const sfPoints: { x: number; val: number }[] = [];
  const bmPoints: { x: number; val: number }[] = [];
  const segments = 100;
  for (let i = 0; i <= segments; i++) {
    const x = (span * i) / segments;
    let sf = 0;
    let bm = 0;
    
    if (loadType === 'udl') {
      sf = load * (span / 2 - x);
      bm = (load * x * (span - x)) / 2;
    } else {
      const p = load;
      if (x < span / 2) {
        sf = p / 2;
        bm = (p * x) / 2;
      } else if (Math.abs(x - span / 2) < 0.00001) {
        sf = 0;
        bm = (p * span) / 4;
      } else {
        sf = -p / 2;
        bm = (p * (span - x)) / 2;
      }
    }
    sfPoints.push({ x: parseFloat(x.toFixed(3)), val: parseFloat(sf.toFixed(3)) });
    bmPoints.push({ x: parseFloat(x.toFixed(3)), val: parseFloat(bm.toFixed(3)) });
  }

  let maxMoment = 0;
  let maxShear = 0;
  let maxDeflection = 0;

  if (system === 'metric') {
    // Inputs: span (m), load (kN/m or kN), inertia (cm^4), eValue (Pa)
    // Convert inertia cm^4 to m^4: 1 cm^4 = 1e-8 m^4
    const I = inertia * 1e-8;
    const E = eValue;
    const L = span;
    const w = load * 1000; // convert kN to N or kN/m to N/m

    if (loadType === 'udl') {
      maxMoment = (w * L * L) / 8; // N-m
      maxShear = (w * L) / 2;     // N
      maxDeflection = (5 * w * Math.pow(L, 4)) / (384 * E * I); // m
    } else {
      maxMoment = (w * L) / 4;    // N-m
      maxShear = w / 2;           // N
      maxDeflection = (w * Math.pow(L, 3)) / (48 * E * I); // m
    }

    // Convert outputs back to standard civil units
    maxMoment = parseFloat((maxMoment / 1000).toFixed(2)); // kNm
    maxShear = parseFloat((maxShear / 1000).toFixed(2));   // kN
    maxDeflection = parseFloat((maxDeflection * 1000).toFixed(2)); // mm
    
    // Standard serviceability deflection limit: L/240
    // L in m to mm: L * 1000
    const limit = parseFloat(((L * 1000) / 240).toFixed(2));
    return {
      maxMoment,
      maxShear,
      maxDeflection,
      deflectionLimit: limit,
      isDeflectionOk: maxDeflection <= limit,
      sfPoints,
      bmPoints
    };
  } else {
    // Imperial Mode: span (ft), load (klf or kips), inertia (in^4), E (psi)
    // Convert span ft to inches for deflection calculations
    const L_in = span * 12;
    const I = inertia; // in^4
    const E = eValue;  // psi
    const w = load * 1000; // Convert kips/ft to lbs/ft, or kips to lbs

    if (loadType === 'udl') {
      // Moment: M = wL^2/8 where w is lbs/ft, L is ft. Output is lb-ft. Divide by 1000 for kip-ft
      maxMoment = (w * span * span) / 8 / 1000; 
      maxShear = (w * span) / 2 / 1000; // kips
      
      // Deflection: D = 5 w_in L_in^4 / (384 E I)
      // w_in = w_ft / 12 (lbs/inch)
      const w_in = w / 12;
      maxDeflection = (5 * w_in * Math.pow(L_in, 4)) / (384 * E * I); // inches
    } else {
      // Point load P = w (in lbs)
      maxMoment = (w * span) / 4 / 1000; // kip-ft
      maxShear = w / 2 / 1000; // kips
      maxDeflection = (w * Math.pow(L_in, 3)) / (48 * E * I); // inches
    }

    maxMoment = parseFloat(maxMoment.toFixed(2));
    maxShear = parseFloat(maxShear.toFixed(2));
    maxDeflection = parseFloat(maxDeflection.toFixed(3));

    const limit = parseFloat((L_in / 240).toFixed(3));
    return {
      maxMoment,
      maxShear,
      maxDeflection,
      deflectionLimit: limit,
      isDeflectionOk: maxDeflection <= limit,
      sfPoints,
      bmPoints
    };
  }
}

/**
 * Concrete Short Column Design Capacity (ACI 318)
 */
export interface ColumnInput {
  width: number;       // mm or inches
  depth: number;       // mm or inches
  fc: number;          // MPa or psi
  fy: number;          // MPa or psi
  barCount: number;
  barDiameter: number; // mm or inches
}

export interface ColumnOutput {
  grossArea: number;   // mm² or in²
  steelArea: number;   // mm² or in²
  steelRatio: number;  // % (normally 1-8%)
  nominalCapacityPn: number; // kN or kips
  factoredCapacityPhiPn: number; // kN or kips
  minRebarWarning: boolean;
  maxRebarWarning: boolean;
}

export function calculateColumn(input: ColumnInput, system: UnitSystem): ColumnOutput {
  const { width, depth, fc, fy, barCount, barDiameter } = input;

  if (width <= 0 || depth <= 0 || fc <= 0 || fy <= 0 || barCount <= 0 || barDiameter <= 0) {
    return { grossArea: 0, steelArea: 0, steelRatio: 0, nominalCapacityPn: 0, factoredCapacityPhiPn: 0, minRebarWarning: false, maxRebarWarning: false };
  }

  const grossArea = width * depth;
  let rebarAreaSingle = 0;

  if (system === 'metric') {
    // Bar diameter in mm
    rebarAreaSingle = (Math.PI * Math.pow(barDiameter, 2)) / 4;
  } else {
    // Bar size is diameter in inches
    rebarAreaSingle = (Math.PI * Math.pow(barDiameter, 2)) / 4;
  }

  const steelArea = barCount * rebarAreaSingle;
  const steelRatio = (steelArea / grossArea) * 100;

  let nominalCapacityPn = 0;
  let factoredCapacityPhiPn = 0;

  if (system === 'metric') {
    // fc, fy in MPa (N/mm²), grossArea & steelArea in mm².
    // Pn (N) = 0.85·fc·(Ag − Ast) + fy·Ast   (ACI 318 Eq. 22.4.2.2)
    // The outer 0.85 factor is NOT applied here — it is already baked into the concrete term 0.85·fc.
    // φPn = 0.65 × 0.80 × Pn  (tied column, ACI 318 Table 21.2.2 + 22.4.2.1)
    const Pn_N = 0.85 * fc * (grossArea - steelArea) + fy * steelArea;
    nominalCapacityPn = Pn_N / 1000; // kN
    
    // Factored design load (tied column): Phi = 0.65, reduction factor = 0.80 for accidential eccentricity
    factoredCapacityPhiPn = 0.65 * 0.80 * nominalCapacityPn; // kN
  } else {
    // fc, fy in psi. Ag, Ast in in².
    // Pn (lbs) = 0.85·fc·(Ag − Ast) + fy·Ast
    const Pn_lbs = 0.85 * fc * (grossArea - steelArea) + fy * steelArea;
    nominalCapacityPn = Pn_lbs / 1000; // kips (thousand lbs)
    factoredCapacityPhiPn = 0.65 * 0.80 * nominalCapacityPn; // kips
  }

  return {
    grossArea: parseFloat(grossArea.toFixed(1)),
    steelArea: parseFloat(steelArea.toFixed(2)),
    steelRatio: parseFloat(steelRatio.toFixed(2)),
    nominalCapacityPn: parseFloat(nominalCapacityPn.toFixed(1)),
    factoredCapacityPhiPn: parseFloat(factoredCapacityPhiPn.toFixed(1)),
    minRebarWarning: steelRatio < 1.0,
    maxRebarWarning: steelRatio > 8.0,
  };
}

/**
 * Slab Thickness Estimator (ACI 318 Simplified)
 */
export interface SlabInput {
  span: number; // m or ft
  supportType: 'simple' | 'one-continuous' | 'both-continuous' | 'cantilever';
  fy: number;   // MPa or psi
}

export interface SlabOutput {
  minThickness: number; // mm or inches
  recommendedThickness: number; // mm or inches (normally rounded up to nearest 10mm or 0.5in)
}

export function calculateSlabThickness(input: SlabInput, system: UnitSystem): SlabOutput {
  const { span, supportType, fy } = input;
  if (span <= 0) {
    return { minThickness: 0, recommendedThickness: 0 };
  }

  // Span limit factors for deflection control
  let factor = 20; // default simply supported
  if (supportType === 'one-continuous') factor = 24;
  else if (supportType === 'both-continuous') factor = 28;
  else if (supportType === 'cantilever') factor = 10;

  let minThickness = 0;

  if (system === 'metric') {
    // span is in m, convert to mm for output
    const span_mm = span * 1000;
    minThickness = span_mm / factor;
    
    // Modification for fy other than 420 MPa
    if (fy !== 420 && fy > 0) {
      minThickness = minThickness * (0.4 + fy / 700);
    }
    
    // Round up to nearest 10mm
    const rec = Math.ceil(minThickness / 10) * 10;
    return {
      minThickness: parseFloat(minThickness.toFixed(1)),
      recommendedThickness: Math.max(rec, 100) // minimum standard slab thickness 100mm
    };
  } else {
    // span is in feet, convert to inches
    const span_in = span * 12;
    minThickness = span_in / factor;

    // Modification for fy other than 60,000 psi
    const fy_ksi = fy / 1000;
    if (fy_ksi !== 60 && fy_ksi > 0) {
      minThickness = minThickness * (0.4 + fy_ksi / 100);
    }

    // Round up to nearest 0.5 inches
    const rec = Math.ceil(minThickness * 2) / 2;
    return {
      minThickness: parseFloat(minThickness.toFixed(2)),
      recommendedThickness: Math.max(rec, 4.0) // minimum standard structural slab 4.0 inches
    };
  }
}

/**
 * Geotechnical Footing Bearing Capacity (Terzaghi Theory)
 */
export interface GeotechFootingInput {
  bg: number;          // Width of Footing B (m or ft)
  lg: number;          // Length of Footing L (m or ft)
  df: number;          // Depth of Foundation Df (m or ft)
  cohesion: number;    // c (kPa or psf)
  phi: number;         // Angle of internal friction (degrees)
  unitWeight: number;  // Gamma (kN/m³ or lb/ft³)
  safetyFactor: number; // FS
}

export interface GeotechFootingOutput {
  nc: number;
  nq: number;
  ngg: number; // N_gamma
  ultimateCapacity: number; // kPa or psf
  allowableCapacity: number; // kPa or psf
}

export function calculateBearingCapacity(input: GeotechFootingInput, system: UnitSystem): GeotechFootingOutput {
  const { bg, lg, df, cohesion, phi, unitWeight, safetyFactor } = input;

  if (bg <= 0 || lg <= 0 || safetyFactor <= 0) {
    return { nc: 0, nq: 0, ngg: 0, ultimateCapacity: 0, allowableCapacity: 0 };
  }

  // Convert phi to radians
  const phiRad = (phi * Math.PI) / 180;

  let nq = 0;
  let nc = 0;
  let ngg = 0;

  if (phi === 0) {
    nq = 1;
    nc = 5.7;
    ngg = 0;
  } else {
    // Terzaghi bearing capacity coefficients
    const a = Math.exp(((3 * Math.PI) / 4 - phiRad / 2) * Math.tan(phiRad));
    nq = Math.pow(a, 2) / (2 * Math.pow(Math.cos(Math.PI / 4 + phiRad / 2), 2));
    nc = (nq - 1) / Math.tan(phiRad);
    // Terzaghi N_gamma approximation
    ngg = (nq - 1) * Math.tan(1.4 * phiRad);
  }

  // Surcharge pressure q at base level
  const surchargeQ = unitWeight * df;

  // Shape correction factors (for rectangular footing)
  // Term 1 (c term): s_c = 1 + 0.3 * B/L
  // Term 3 (gamma B term): s_gamma = 1 - 0.2 * B/L
  const sc = 1 + 0.3 * (bg / lg);
  const sq = 1; // Terzaghi shape factor for surcharge term
  const sg = 1 - 0.2 * (bg / lg);

  // Terzaghi ultimate capacity formula
  // q_ult = c * Nc * sc + q * Nq * sq + 0.5 * gamma * B * N_gamma * sg
  const part1 = cohesion * nc * sc;
  const part2 = surchargeQ * nq * sq;
  const part3 = 0.5 * unitWeight * bg * ngg * sg;

  const ultimateCapacity = part1 + part2 + part3;
  const allowableCapacity = ultimateCapacity / safetyFactor;

  return {
    nc: parseFloat(nc.toFixed(2)),
    nq: parseFloat(nq.toFixed(2)),
    ngg: parseFloat(ngg.toFixed(2)),
    ultimateCapacity: parseFloat(ultimateCapacity.toFixed(1)),
    allowableCapacity: parseFloat(allowableCapacity.toFixed(1)),
  };
}

/**
 * Retaining Wall Stability / Lateral Pressure (Rankine Theory)
 */
export interface RetainingWallInput {
  height: number;      // m or ft
  frictionAngle: number; // phi (degrees)
  unitWeight: number;  // kN/m³ or lb/ft³
  backfillSlope: number; // beta (normally 0 for flat backfill)
}

export interface RetainingWallOutput {
  ka: number; // Rankine coefficient of active pressure
  lateralMoistureThrust: number; // kN/m or lbs/ft
  overturningMoment: number;   // kNm/m or lb-ft/ft
}

export function calculateRetainingWall(input: RetainingWallInput, system: UnitSystem): RetainingWallOutput {
  const { height, frictionAngle, unitWeight, backfillSlope } = input;
  
  if (height <= 0 || frictionAngle <= 0 || unitWeight <= 0) {
    return { ka: 0, lateralMoistureThrust: 0, overturningMoment: 0 };
  }

  // Active lateral earth pressure coefficient for dynamic backfill angle beta
  // Let's implement active Rankine coefficient
  const phiRad = (frictionAngle * Math.PI) / 180;
  const betaRad = (backfillSlope * Math.PI) / 180;

  let ka = 0;
  if (backfillSlope === 0) {
    // Standard flat Rankine formula: (1-sin phi)/(1+sin phi)
    ka = (1 - Math.sin(phiRad)) / (1 + Math.sin(phiRad));
  } else {
    // Rankine sloping backfill formula
    const num = Math.cos(betaRad) - Math.sqrt(Math.pow(Math.cos(betaRad), 2) - Math.pow(Math.cos(phiRad), 2));
    const den = Math.cos(betaRad) + Math.sqrt(Math.pow(Math.cos(betaRad), 2) - Math.pow(Math.cos(phiRad), 2));
    ka = Math.cos(betaRad) * (num / den);
  }

  // Lateral earth pressure force P_a = 0.5 * ka * gamma * H^2
  const thrust = 0.5 * ka * unitWeight * Math.pow(height, 2);
  
  // Overturning moment at base: M_over = P_a * (H / 3) (distributed load peak at base)
  const moment = thrust * (height / 3);

  return {
    ka: parseFloat(ka.toFixed(4)),
    lateralMoistureThrust: parseFloat(thrust.toFixed(1)),
    overturningMoment: parseFloat(moment.toFixed(1)),
  };
}

/**
 * Height of Instrument (HI) Method in levelling
 */
export interface HeightOfInstrumentInput {
  startingRL: number; // Reference starting benchmark RL
  rows: {
    station: string;
    distance: number;
    bs: number | null;
    is: number | null;
    fs: number | null;
    remarks: string;
  }[];
}

export interface HeightOfInstrumentOutput {
  rows: {
    station: string;
    distance: number;
    bs: number | null;
    is: number | null;
    fs: number | null;
    remarks: string;
    hi?: number;
    rl?: number;
  }[];
  sumBS: number;
  sumFS: number;
  bsFsDifference: number;
  firstLastRlDifference: number;
  isCheckPassed: boolean;
  totalDistance: number;
  activeSetupsCount: number;
}

export function calculateHeightOfInstrument(input: HeightOfInstrumentInput): HeightOfInstrumentOutput {
  const calculatedRows = input.rows.map(r => ({
    ...r,
    hi: undefined as number | undefined,
    rl: undefined as number | undefined
  }));

  if (calculatedRows.length === 0) {
    return {
      rows: [],
      sumBS: 0,
      sumFS: 0,
      bsFsDifference: 0,
      firstLastRlDifference: 0,
      isCheckPassed: true,
      totalDistance: 0,
      activeSetupsCount: 0
    };
  }

  // Row 0 has the starting RL
  calculatedRows[0].rl = input.startingRL;
  
  let currentHI: number | undefined = undefined;
  let activeSetupsCount = 0;

  for (let i = 0; i < calculatedRows.length; i++) {
    const row = calculatedRows[i];
    
    // If there is an active HI from prior setup and this is a subsequent row with IS or FS
    if (i > 0) {
      if (currentHI !== undefined) {
        if (row.fs !== null) {
          row.rl = currentHI - row.fs;
        } else if (row.is !== null) {
          row.rl = currentHI - row.is;
        } else {
          row.rl = calculatedRows[i - 1].rl;
        }
      } else {
        row.rl = calculatedRows[i - 1].rl ?? input.startingRL;
      }
    }

    // Now check if this row establishes/updates the HI (backsight BS is present)
    if (row.bs !== null) {
      row.hi = (row.rl ?? input.startingRL) + row.bs;
      currentHI = row.hi;
      activeSetupsCount++;
    }
    
    if (row.hi !== undefined) row.hi = parseFloat(row.hi.toFixed(6));
    if (row.rl !== undefined) row.rl = parseFloat(row.rl.toFixed(6));
  }

  // Totals & checks
  let sumBS = 0;
  let sumFS = 0;
  calculatedRows.forEach(r => {
    if (r.bs !== null) sumBS += r.bs;
    if (r.fs !== null) sumFS += r.fs;
  });

  const firstRL = input.startingRL;
  const lastRL = calculatedRows[calculatedRows.length - 1].rl ?? firstRL;
  const bsFsDifference = sumBS - sumFS;
  const firstLastRlDifference = lastRL - firstRL;

  const checkValBSFS = parseFloat(bsFsDifference.toFixed(4));
  const checkValRL = parseFloat(firstLastRlDifference.toFixed(4));
  const isCheckPassed = Math.abs(checkValBSFS - checkValRL) < 0.0001;

  const totalDistance = calculatedRows[calculatedRows.length - 1].distance || 0;

  return {
    rows: calculatedRows.map(r => ({
      ...r,
      hi: r.hi !== undefined ? parseFloat(r.hi.toFixed(4)) : undefined,
      rl: r.rl !== undefined ? parseFloat(r.rl.toFixed(4)) : undefined,
    })),
    sumBS: parseFloat(sumBS.toFixed(4)),
    sumFS: parseFloat(sumFS.toFixed(4)),
    bsFsDifference: parseFloat(bsFsDifference.toFixed(4)),
    firstLastRlDifference: parseFloat(firstLastRlDifference.toFixed(4)),
    isCheckPassed,
    totalDistance,
    activeSetupsCount
  };
}

/**
 * Coordinate Area & Perimeter Solver (Shoelace Formula)
 */
export interface Coordinate {
  x: number;
  y: number;
}

export function calculateCoordinateGeometry(coords: Coordinate[]): { area: number; perimeter: number } {
  const n = coords.length;
  if (n < 3) return { area: 0, perimeter: 0 };

  // Area Shoelace Formula
  let areaSum = 0;
  let perimeter = 0;

  for (let i = 0; i < n; i++) {
    const current = coords[i];
    const next = coords[(i + 1) % n];

    areaSum += current.x * next.y - next.x * current.y;
    
    // Distance formula for perimeter
    const dist = Math.sqrt(Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2));
    perimeter += dist;
  }

  const area = Math.abs(areaSum) / 2;

  return {
    area: parseFloat(area.toFixed(2)),
    perimeter: parseFloat(perimeter.toFixed(2)),
  };
}

/**
 * Standard Unit Converter Helper
 */
export interface UnitCategory {
  name: string;
  units: { name: string; symbol: string; factor: number }[]; // factors relative to base unit
}

export const UNIT_CONVERSIONS: Record<string, UnitCategory> = {
  length: {
    name: 'Length',
    units: [
      { name: 'Meters', symbol: 'm', factor: 1.0 },
      { name: 'Millimeters', symbol: 'mm', factor: 0.001 },
      { name: 'Feet', symbol: 'ft', factor: 0.3048 },
      { name: 'Inches', symbol: 'in', factor: 0.0254 },
      { name: 'Yards', symbol: 'yd', factor: 0.9144 },
    ]
  },
  force: {
    name: 'Force / Load',
    units: [
      { name: 'Kilonewtons', symbol: 'kN', factor: 1.0 },
      { name: 'Newtons', symbol: 'N', factor: 0.001 },
      { name: 'Kip', symbol: 'kip', factor: 4.44822 },
      { name: 'Pounds', symbol: 'lbs', factor: 0.00444822 },
    ]
  },
  pressure: {
    name: 'Pressure / Stress',
    units: [
      { name: 'Megapascals', symbol: 'MPa', factor: 1000.0 }, // kilonewtons/sq m related
      { name: 'Kilopascals', symbol: 'kPa', factor: 1.0 },
      { name: 'Pounds per Sq. Inch', symbol: 'psi', factor: 6.89476 },
      { name: 'Kips per Sq. Inch', symbol: 'ksi', factor: 6894.76 },
      { name: 'Pounds per Sq. Foot', symbol: 'psf', factor: 0.04788 },
    ]
  },
  volume: {
    name: 'Volume',
    units: [
      { name: 'Cubic Meters', symbol: 'm³', factor: 1.0 },
      { name: 'Cubic Yards', symbol: 'yd³', factor: 0.764555 },
      { name: 'Cubic Feet', symbol: 'ft³', factor: 0.0283168 },
      { name: 'Liters', symbol: 'L', factor: 0.001 },
    ]
  }
};

export function convertUnits(value: number, fromSymbol: string, toSymbol: string, category: string): number {
  const cat = UNIT_CONVERSIONS[category];
  if (!cat) return value;

  const fromUnit = cat.units.find(u => u.symbol === fromSymbol);
  const toUnit = cat.units.find(u => u.symbol === toSymbol);

  if (!fromUnit || !toUnit) return value;

  // Convert to base, then to target
  const baseValue = value * fromUnit.factor;
  return parseFloat((baseValue / toUnit.factor).toFixed(4));
}

/**
 * Coordinate Traverse Compass Solver (Survey)
 */
export interface SurveyTraverseInput {
  startNorthing: number;
  startEasting: number;
  startElevation: number;
  distance: number;
  bearingDeg: number;
  verticalAngle: number;
}

export interface SurveyTraverseOutput {
  horizontalDistance: number;
  verticalDistance: number;
  deltaNorthing: number;
  deltaEasting: number;
  endNorthing: number;
  endEasting: number;
  endElevation: number;
}

export function calculateTraverseCompass(input: SurveyTraverseInput): SurveyTraverseOutput {
  const { startNorthing, startEasting, startElevation, distance, bearingDeg, verticalAngle } = input;
  
  const bearingRad = (bearingDeg * Math.PI) / 180;
  const vertAngleRad = (verticalAngle * Math.PI) / 180;
  
  const horizontalDistance = distance * Math.cos(vertAngleRad);
  const verticalDistance = distance * Math.sin(vertAngleRad);
  
  const deltaNorthing = horizontalDistance * Math.cos(bearingRad);
  const deltaEasting = horizontalDistance * Math.sin(bearingRad);
  
  const endNorthing = startNorthing + deltaNorthing;
  const endEasting = startEasting + deltaEasting;
  const endElevation = startElevation + verticalDistance;
  
  return {
    horizontalDistance: parseFloat(horizontalDistance.toFixed(4)),
    verticalDistance: parseFloat(verticalDistance.toFixed(4)),
    deltaNorthing: parseFloat(deltaNorthing.toFixed(4)),
    deltaEasting: parseFloat(deltaEasting.toFixed(4)),
    endNorthing: parseFloat(endNorthing.toFixed(4)),
    endEasting: parseFloat(endEasting.toFixed(4)),
    endElevation: parseFloat(endElevation.toFixed(4))
  };
}

/**
 * Steel Section Weight Estimator
 */
export interface SteelWeightInput {
  steelShape: string; // 'plate' | 'round' | 'pipe' | 'hbeam'
  length: number;      // m or ft
  width: number;       // m or ft (or plate width, pipe outer dia, beam flange bg)
  thickness: number;   // mm or inches (thickness)
  depth: number;       // mm or inches (for profiles like beams)
  quantity: number;
}

export interface SteelWeightOutput {
  sectionalArea: number;   // mm² or in²
  volumePerUnit: number;   // m³ or in³
  weightPerUnit: number;   // kg or lbs
  totalWeight: number;     // kg or lbs
  surfaceAreaPerUnit: number; // m² or ft²
}

export function calculateSteelWeight(input: SteelWeightInput, system: UnitSystem): SteelWeightOutput {
  const { steelShape, length, width, thickness, depth, quantity } = input;
  
  let sectionalArea = 0; // mm² (metric) or in² (imperial)
  let volumePerUnit = 0; // m³ (metric) or in³ (imperial)
  let weightPerUnit = 0; // kg (metric) or lbs (imperial)
  let surfaceAreaPerUnit = 0; // m² (metric) or ft² (imperial)
  
  const isMetric = system === 'metric';
  // Standard Carbon Steel Densities
  // Metric: 7850 kg/m³
  // Imperial: 0.28356 lbs/in³ (490 lbs/ft³)
  
  if (steelShape === 'plate') {
    if (isMetric) {
      // Plate dimensions: length (m), width (m), thickness (mm)
      const thickM = thickness / 1000;
      sectionalArea = width * 1000 * thickness; // mm²
      volumePerUnit = length * width * thickM; // m³
      weightPerUnit = volumePerUnit * 7850; // kg
      surfaceAreaPerUnit = 2 * (width * length + width * thickM + length * thickM); // m²
    } else {
      // Plate dimensions: length (ft), width (ft), thickness (in)
      const widthIn = width * 12;
      const lengthIn = length * 12;
      sectionalArea = widthIn * thickness; // in²
      volumePerUnit = lengthIn * widthIn * thickness; // in³
      weightPerUnit = volumePerUnit * 0.28356; // lbs
      surfaceAreaPerUnit = 2 * (width * length + (width * (thickness / 12)) + (length * (thickness / 12))); // ft²
    }
  } else if (steelShape === 'round') {
    if (isMetric) {
      // Solid Round Bar: width represents Diameter in mm, length in m
      const diaM = width / 1000;
      sectionalArea = (Math.PI * Math.pow(width, 2)) / 4; // mm²
      volumePerUnit = (sectionalArea / 1e6) * length; // m³
      weightPerUnit = volumePerUnit * 7850; // kg
      surfaceAreaPerUnit = (Math.PI * diaM * length) + (2 * (Math.PI * Math.pow(diaM, 2)) / 4); // m²
    } else {
      // Solid Round Bar: width represents Diameter in inches, length in ft
      const lengthIn = length * 12;
      sectionalArea = (Math.PI * Math.pow(width, 2)) / 4; // in²
      volumePerUnit = sectionalArea * lengthIn; // in³
      weightPerUnit = volumePerUnit * 0.28356; // lbs
      surfaceAreaPerUnit = (Math.PI * (width / 12) * length) + (2 * (Math.PI * Math.pow(width / 12, 2)) / 4); // ft²
    }
  } else if (steelShape === 'pipe') {
    // Hollow Pipe Tube: width is Outer Diameter (OD), thickness is wall thickness (t)
    if (isMetric) {
      // OD in mm, t in mm, length in m
      const od = width;
      const t = thickness;
      const id = od - 2 * t;
      sectionalArea = (Math.PI * (Math.pow(od, 2) - Math.pow(id, 2))) / 4; // mm²
      volumePerUnit = (sectionalArea / 1e6) * length; // m³
      weightPerUnit = volumePerUnit * 7850; // kg
      surfaceAreaPerUnit = Math.PI * (od / 1000) * length; // m² (outer surface)
    } else {
      // OD in inches, t in inches, length in ft
      const od = width;
      const t = thickness;
      const id = od - 2 * t;
      const lengthIn = length * 12;
      sectionalArea = (Math.PI * (Math.pow(od, 2) - Math.pow(id, 2))) / 4; // in²
      volumePerUnit = sectionalArea * lengthIn; // in³
      weightPerUnit = volumePerUnit * 0.28356; // lbs
      surfaceAreaPerUnit = Math.PI * (od / 12) * length; // ft² (outer surface)
    }
  } else if (steelShape === 'hbeam') {
    // H-Beam structure: width is flange width (bf) in mm or in, depth is section height (d) in mm or in, thickness is flange thickness (tf) in mm or in
    const bf = width;
    const d = depth;
    const tf = thickness;
    const tw = tf * 0.6; // Web thickness is typically around 60% of flange thickness
    
    if (isMetric) {
      // All transverse dimensions in mm, length in m
      // Area = 2 * flange_area + web_area
      sectionalArea = (2 * bf * tf) + ((d - 2 * tf) * tw); // mm²
      volumePerUnit = (sectionalArea / 1e6) * length; // m³
      weightPerUnit = volumePerUnit * 7850; // kg
      surfaceAreaPerUnit = (4 * bf + 2 * d) * length / 1000; // m² approximation
    } else {
      // All transverse dimensions in inches, length in ft
      const lengthIn = length * 12;
      sectionalArea = (2 * bf * tf) + ((d - 2 * tf) * tw); // in²
      volumePerUnit = sectionalArea * lengthIn; // in³
      weightPerUnit = volumePerUnit * 0.28356; // lbs
      surfaceAreaPerUnit = (4 * bf + 2 * d) * length / 12; // ft² approximation
    }
  }
  
  const totalWeight = weightPerUnit * quantity;
  
  return {
    sectionalArea: parseFloat(sectionalArea.toFixed(2)),
    volumePerUnit: parseFloat(volumePerUnit.toFixed(5)),
    weightPerUnit: parseFloat(weightPerUnit.toFixed(2)),
    totalWeight: parseFloat(totalWeight.toFixed(2)),
    surfaceAreaPerUnit: parseFloat(surfaceAreaPerUnit.toFixed(3))
  };
}

/**
 * Rebar Quantity and Estimation Solver (Reinforced Concrete)
 */
export interface RebarQuantityInput {
  elementLength: number; // m or ft
  elementWidth: number;  // m or ft
  barSize: number;       // metric: bar diameter (mm) | imperial: ASTM US bar index (e.g. 4 for #4, 5 for #5)
  spacing: number;       // spacing (mm or inches)
  lapSplice: number;     // bar diameter multiplier (e.g. 40 or 50)
  concreteCover: number; // mm or inches
}

export interface RebarQuantityOutput {
  barsAlongLengthCount: number;
  barsAlongWidthCount: number;
  totalBarsCount: number;
  singleBarLenL: number;
  singleBarLenW: number;
  totalLength: number;
  unitWeight: number; // kg/m or lbs/ft
  totalWeight: number; // kg or lbs
}

export function calculateRebarQuantity(input: RebarQuantityInput, system: UnitSystem): RebarQuantityOutput {
  const { elementLength, elementWidth, barSize, spacing, lapSplice, concreteCover } = input;
  
  const isMetric = system === 'metric';
  
  // 1. Establish clear cover and spacing factors
  const coverUnit = isMetric ? concreteCover / 1000 : concreteCover / 12; // m or ft
  const spacingUnit = isMetric ? spacing / 1000 : spacing / 12; // m or ft
  
  // Net grid dimensions inside cover
  const lNet = elementLength - 2 * coverUnit;
  const wNet = elementWidth - 2 * coverUnit;
  
  if (lNet <= 0 || wNet <= 0 || spacingUnit <= 0) {
    return {
      barsAlongLengthCount: 0,
      barsAlongWidthCount: 0,
      totalBarsCount: 0,
      singleBarLenL: 0,
      singleBarLenW: 0,
      totalLength: 0,
      unitWeight: 0,
      totalWeight: 0
    };
  }
  
  // 2. Bar Count = (net space / spacing) + 1 starter bar
  const barsAlongLengthCount = Math.ceil(wNet / spacingUnit) + 1; // longitudinal bars (parallel to length, spaced along width)
  const barsAlongWidthCount = Math.ceil(lNet / spacingUnit) + 1;  // transverse bars (parallel to width, spaced along length)
  const totalBarsCount = barsAlongLengthCount + barsAlongWidthCount;
  
  // 3. Rebar dimension specifics
  // Metric: barSize represents exact diameter in mm (e.g., 12mm)
  // Imperial: barSize represents ASTM standard bar number (e.g., 4 is #4 = 4/8 in = 0.5 in)
  const barDiaUnit = isMetric ? barSize / 1000 : (barSize / 8) / 12; // m or ft
  
  // Lap Splice length
  const spliceLen = lapSplice * barDiaUnit; // m or ft
  
  // Regular civil reinforcing limits max transport lengths (typically 12m or 40ft)
  const transportLimit = isMetric ? 12.0 : 40.0;
  
  // Number of lap joints required
  const lapsL = Math.max(0, Math.floor(lNet / transportLimit));
  const lapsW = Math.max(0, Math.floor(wNet / transportLimit));
  
  // Single bar hook/anchor additions (generally 2 hooks of 12D each)
  const anchors = 2 * (12 * barDiaUnit);
  
  const singleBarLenL = lNet + (lapsL * spliceLen) + anchors;
  const singleBarLenW = wNet + (lapsW * spliceLen) + anchors;
  
  const totalLength = (barsAlongLengthCount * singleBarLenL) + (barsAlongWidthCount * singleBarLenW);
  
  // Calculate material unit weight
  let unitWeight = 0; // kg/m or lbs/ft
  if (isMetric) {
    // Theoretical unit weight (kg/m) = d² / 162.2 (where d is diameter in mm)
    unitWeight = (barSize * barSize) / 162.2;
  } else {
    // Nominal unit weight (lbs/ft) = ASTM standard ≈ #_index² / 24 (or exact standard profile weights)
    // We can compute roughly d_inches^2 * 3.4 lbs/ft
    const dInches = barSize / 8;
    unitWeight = Math.pow(dInches, 2) * 2.67; // closer ASTM standard weight
  }
  
  const totalWeight = totalLength * unitWeight;
  
  return {
    barsAlongLengthCount,
    barsAlongWidthCount,
    totalBarsCount,
    singleBarLenL: parseFloat(singleBarLenL.toFixed(3)),
    singleBarLenW: parseFloat(singleBarLenW.toFixed(3)),
    totalLength: parseFloat(totalLength.toFixed(2)),
    unitWeight: parseFloat(unitWeight.toFixed(3)),
    totalWeight: parseFloat(totalWeight.toFixed(2))
  };
}

export interface BrickOpening {
  id: string;
  type: 'door' | 'window' | 'custom';
  length: number; // m or ft
  height: number; // m or ft
  x: number;      // m or ft (from left)
  y: number;      // m or ft (from bottom)
}

export interface BrickMasonryInput {
  wallLength: number;     // m or ft
  wallHeight: number;     // m or ft
  wallThickness: number;  // mm or inches
  brickLength: number;    // mm or inches
  brickWidth: number;     // mm or inches
  brickHeight: number;    // mm or inches
  mortarJoint: number;    // mm or inches
  mixRatio: string;       // e.g. "1:3", "1:4", "1:5", "1:6" or custom "1:x"
  wastePercent: number;
  bondType: string;       // stretcher, header, english, flemish, stack, rat-trap, etc.
  openings: BrickOpening[];
  
  // Cost inputs
  brickPrice?: number;
  cementPrice?: number;
  sandPrice?: number;
  labourCost?: number;
  transportCost?: number;
}

export interface BrickMasonryOutput {
  wallVolumeGross: number;      // m³ or ft³
  wallVolumeNet: number;        // m³ or ft³
  wallAreaGross: number;        // m² or ft²
  wallAreaNet: number;          // m² or ft²
  netBricksCount: number;       // total raw bricks equivalent
  totalBricksWithWaste: number; // including wastage
  fullBricksCount: number;      // actual full bricks placed
  halfBricksCount: number;      // count of bricks cut to half
  cutBricksCount: number;       // count of other cut bricks
  mortarVolumeWet: number;      // m³ or ft³
  mortarVolumeDry: number;      // m³ or ft³
  cementBagsRequired: number;   // count
  sandVolumeRequired: number;   // m³ or ft³
  sandWeightRequired: number;   // kg or lbs
  waterRequired: number;        // Liters or Gallons
  
  // Cost breakdowns
  materialCost: number;
  labourCost: number;
  grandTotal: number;
  costPerArea: number;          // per m² or ft²
  costPerVolume: number;        // per m³ or ft³
}

export function generateBricksList(
  L: number,
  H: number,
  T: number,
  bl: number,
  bw: number,
  bh: number,
  j: number,
  bondType: string,
  openings: BrickOpening[]
): {
  bricks: Array<{ x: number; y: number; z: number; w: number; h: number; d: number; isHeader: boolean }>;
  cavityVolume: number;
} {
  const bricks: Array<{ x: number; y: number; z: number; w: number; h: number; d: number; isHeader: boolean }> = [];
  let cavityVolume = 0;
  
  const ch = bh + j;
  const num_courses = Math.max(1, Math.floor((H - bh) / ch) + 1);

  // Helper to add a brick, checking openings
  const addBrick = (x: number, y: number, z: number, w: number, h: number, d: number, isHeader: boolean) => {
    let xStart = x;
    let xEnd = x + w;
    const yStart = y;
    const yEnd = y + h;

    let fullyContained = false;
    for (const op of openings) {
      const opXStart = op.x;
      const opXEnd = op.x + op.length;
      const opYStart = op.y;
      const opYEnd = op.y + op.height;

      // Check overlap in XY plane
      if (xStart < opXEnd && xEnd > opXStart && yStart < opYEnd && yEnd > opYStart) {
        // If the brick is fully inside the opening, discard it
        if (xStart >= opXStart && xEnd <= opXEnd && yStart >= opYStart && yEnd <= opYEnd) {
          fullyContained = true;
          break;
        }

        // Cut from right
        if (xStart < opXStart && xEnd > opXStart) {
          xEnd = Math.min(xEnd, opXStart);
        }
        // Cut from left
        if (xStart < opXEnd && xEnd > opXEnd) {
          xStart = Math.max(xStart, opXEnd);
        }
      }
    }

    if (fullyContained) return;

    const finalWidth = xEnd - xStart;
    if (finalWidth > 0.005) { // at least 5mm
      bricks.push({
        x: xStart,
        y: y,
        z: z,
        w: finalWidth,
        h: h,
        d: d,
        isHeader
      });
    }
  };

  for (let r = 0; r < num_courses; r++) {
    const y = r * ch;
    
    if (bondType === 'stretcher') {
      const numSkins = Math.max(1, Math.round(T / bw));
      const offset = (r % 2) * 0.5 * (bl + j);
      const brickLen = bl + j;
      const startX = -offset;
      
      for (let s = 0; s < numSkins; s++) {
        const z = s * (bw + j);
        let currX = startX;
        while (currX < L) {
          addBrick(currX, y, z, bl, bh, bw, false);
          currX += brickLen;
        }
      }
    }
    else if (bondType === 'header') {
      const numSkins = Math.max(1, Math.round(T / bl));
      const offset = (r % 2) * 0.5 * (bw + j);
      const brickLen = bw + j;
      const startX = -offset;
      
      for (let s = 0; s < numSkins; s++) {
        const z = s * (bl + j);
        let currX = startX;
        while (currX < L) {
          addBrick(currX, y, z, bw, bh, bl, true);
          currX += brickLen;
        }
      }
    }
    else if (bondType === 'english') {
      const isHeaderCourse = (r % 2 === 1);
      if (isHeaderCourse) {
        const numSkins = Math.max(1, Math.round(T / bl));
        const offset = (r % 2) * 0.5 * (bw + j);
        const brickLen = bw + j;
        const startX = -offset;
        for (let s = 0; s < numSkins; s++) {
          const z = s * (bl + j);
          let currX = startX;
          while (currX < L) {
            addBrick(currX, y, z, bw, bh, bl, true);
            currX += brickLen;
          }
        }
      } else {
        const numSkins = Math.max(1, Math.round(T / bw));
        const offset = (r % 2) * 0.5 * (bl + j);
        const brickLen = bl + j;
        const startX = -offset;
        for (let s = 0; s < numSkins; s++) {
          const z = s * (bw + j);
          let currX = startX;
          while (currX < L) {
            addBrick(currX, y, z, bl, bh, bw, false);
            currX += brickLen;
          }
        }
      }
    }
    else if (bondType === 'flemish') {
      const offset = (r % 2) * 0.5 * (bl + j);
      const numSkins = Math.max(1, Math.round(T / bw));
      
      for (let s = 0; s < numSkins; s++) {
        const z = s * (bw + j);
        let currX = -offset;
        let toggle = (s % 2 === 0) ? (r % 2 === 0) : (r % 2 === 1);
        while (currX < L) {
          if (toggle) {
            addBrick(currX, y, z, bw, bh, bl, true);
            currX += bw + j;
          } else {
            addBrick(currX, y, z, bl, bh, bw, false);
            currX += bl + j;
          }
          toggle = !toggle;
        }
      }
    }
    else if (bondType === 'english-garden' || bondType === 'garden-wall') {
      const stretchersCount = bondType === 'english-garden' ? 3 : 5;
      const isHeaderCourse = (r % (stretchersCount + 1) === stretchersCount);
      if (isHeaderCourse) {
        const numSkins = Math.max(1, Math.round(T / bl));
        const offset = (r % 2) * 0.5 * (bw + j);
        const startX = -offset;
        for (let s = 0; s < numSkins; s++) {
          const z = s * (bl + j);
          let currX = startX;
          while (currX < L) {
            addBrick(currX, y, z, bw, bh, bl, true);
            currX += bw + j;
          }
        }
      } else {
        const numSkins = Math.max(1, Math.round(T / bw));
        const offset = ((r % (stretchersCount + 1)) % 2) * 0.5 * (bl + j);
        const startX = -offset;
        for (let s = 0; s < numSkins; s++) {
          const z = s * (bw + j);
          let currX = startX;
          while (currX < L) {
            addBrick(currX, y, z, bl, bh, bw, false);
            currX += bl + j;
          }
        }
      }
    }
    else if (bondType === 'flemish-garden') {
      const offset = (r % 2) * 0.5 * (bl + j);
      const numSkins = Math.max(1, Math.round(T / bw));
      for (let s = 0; s < numSkins; s++) {
        const z = s * (bw + j);
        let currX = -offset;
        let counter = (r % 2 === 0) ? 0 : 2;
        while (currX < L) {
          if (counter % 4 === 3) {
            addBrick(currX, y, z, bw, bh, bl, true);
            currX += bw + j;
          } else {
            addBrick(currX, y, z, bl, bh, bw, false);
            currX += bl + j;
          }
          counter++;
        }
      }
    }
    else if (bondType === 'dutch') {
      const isHeaderCourse = (r % 2 === 1);
      if (isHeaderCourse) {
        const numSkins = Math.max(1, Math.round(T / bl));
        const offset = (r % 2) * 0.5 * (bw + j);
        for (let s = 0; s < numSkins; s++) {
          const z = s * (bl + j);
          let currX = -offset;
          while (currX < L) {
            addBrick(currX, y, z, bw, bh, bl, true);
            currX += bw + j;
          }
        }
      } else {
        const alternateStretcherShift = ((Math.floor(r / 2)) % 2 === 1);
        const offset = alternateStretcherShift ? 0.5 * bl : 0;
        const numSkins = Math.max(1, Math.round(T / bw));
        for (let s = 0; s < numSkins; s++) {
          const z = s * (bw + j);
          let currX = -offset;
          while (currX < L) {
            addBrick(currX, y, z, bl, bh, bw, false);
            currX += bl + j;
          }
        }
      }
    }
    else if (bondType === 'monk') {
      const offset = (r % 2) * 0.5 * (bl + j);
      const numSkins = Math.max(1, Math.round(T / bw));
      for (let s = 0; s < numSkins; s++) {
        const z = s * (bw + j);
        let currX = -offset;
        let counter = (r % 2 === 0) ? 0 : 1;
        while (currX < L) {
          if (counter % 3 === 2) {
            addBrick(currX, y, z, bw, bh, bl, true);
            currX += bw + j;
          } else {
            addBrick(currX, y, z, bl, bh, bw, false);
            currX += bl + j;
          }
          counter++;
        }
      }
    }
    else if (bondType === 'stack') {
      const numSkins = Math.max(1, Math.round(T / bw));
      for (let s = 0; s < numSkins; s++) {
        const z = s * (bw + j);
        let currX = 0;
        while (currX < L) {
          addBrick(currX, y, z, bl, bh, bw, false);
          currX += bl + j;
        }
      }
    }
    else if (bondType === 'rat-trap') {
      const offset = (r % 2) * 0.5 * (bl + j);
      let currX = -offset;
      let toggle = false;
      const sh = bw; // laid on edge, height becomes width
      const sd = bh; // Z depth
      
      while (currX < L) {
        if (toggle) {
          addBrick(currX, y, 0, sd, sh, T, true); // Header on edge spans full thickness
          currX += sd + j;
        } else {
          addBrick(currX, y, 0, bl, sh, sd, false); // Front face skin
          if (T > sd) {
            addBrick(currX, y, T - sd, bl, sh, sd, false); // Back face skin
            // Count empty cavity volume in this stretcher segment
            const xOverlapL = Math.max(0, currX);
            const xOverlapR = Math.min(L, currX + bl);
            if (xOverlapR > xOverlapL) {
              const segLen = xOverlapR - xOverlapL;
              cavityVolume += segLen * sh * (T - 2 * sd);
            }
          }
          currX += bl + j;
        }
        toggle = !toggle;
      }
    }
    else if (bondType === 'facing') {
      const numSkins = Math.max(1, Math.round(T / bw));
      const offset = (r % 2) * 0.5 * (bl + j);
      const brickLen = bl + j;
      const startX = -offset;
      
      for (let s = 0; s < numSkins; s++) {
        const z = s * (bw + j);
        let currX = startX;
        while (currX < L) {
          addBrick(currX, y, z, bl, bh, bw, false);
          currX += brickLen;
        }
      }
    }
    else if (bondType === 'herringbone') {
      const brickLen = bl + j;
      const brickWid = bw + j;
      let currX = 0;
      let colIdx = 0;
      while (currX < L) {
        let currZ = 0;
        let rowIdx = 0;
        while (currZ < T) {
          const orientation = (colIdx + rowIdx) % 2 === 0;
          if (orientation) {
            addBrick(currX, y, currZ, bl, bh, bw, false);
            currZ += brickWid;
          } else {
            addBrick(currX, y, currZ, bw, bh, bl, true);
            currZ += brickLen;
          }
          rowIdx++;
        }
        currX += brickLen;
        colIdx++;
      }
    }
    else if (bondType === 'basket-weave') {
      let currX = 0;
      let blockToggle = (r % 2 === 0);
      while (currX < L) {
        if (blockToggle) {
          addBrick(currX, y, 0, bl, bh, bw, false);
          addBrick(currX, y + bh + j, 0, bl, bh, bw, false);
          currX += bl + j;
        } else {
          addBrick(currX, y, 0, bw, bh, bl, true);
          addBrick(currX + bw + j, y, 0, bw, bh, bl, true);
          currX += 2 * (bw + j);
        }
        blockToggle = !blockToggle;
      }
    }
  }

  return { bricks, cavityVolume };
}

export function calculateBrickMasonry(input: BrickMasonryInput, system: UnitSystem): BrickMasonryOutput {
  const { 
    wallLength, 
    wallHeight, 
    wallThickness, 
    brickLength, 
    brickWidth, 
    brickHeight, 
    mortarJoint, 
    mixRatio, 
    wastePercent,
    bondType = 'stretcher',
    openings = [],
    brickPrice = 0,
    cementPrice = 0,
    sandPrice = 0,
    labourCost = 0,
    transportCost = 0
  } = input;
  
  const isMetric = system === 'metric';
  
  // 1. Compute dimensions in standard base units (meters or feet)
  const T = isMetric ? wallThickness / 1000 : wallThickness / 12;
  const bl = isMetric ? brickLength / 1000 : brickLength / 12;
  const bw = isMetric ? brickWidth / 1000 : brickWidth / 12;
  const bh = isMetric ? brickHeight / 1000 : brickHeight / 12;
  const j = isMetric ? mortarJoint / 1000 : mortarJoint / 12;
  
  const wallAreaGross = wallLength * wallHeight;
  const wallVolumeGross = wallAreaGross * T;
  
  // Deduct openings
  let totalOpeningsArea = 0;
  let totalOpeningsVolume = 0;
  
  const processedOpenings = openings.map(op => {
    const opW = Number(op.length) || 0;
    const opH = Number(op.height) || 0;
    const opX = Number(op.x) || 0;
    const opY = Number(op.y) || 0;
    
    totalOpeningsArea += opW * opH;
    totalOpeningsVolume += opW * opH * T;
    
    return {
      id: op.id,
      type: op.type,
      length: opW,
      height: opH,
      x: opX,
      y: opY
    };
  });
  
  const wallAreaNet = Math.max(0, wallAreaGross - totalOpeningsArea);
  const wallVolumeNet = Math.max(0, wallVolumeGross - totalOpeningsVolume);
  
  if (wallVolumeNet <= 0 || bl <= 0 || bw <= 0 || bh <= 0) {
    return {
      wallVolumeGross: parseFloat(wallVolumeGross.toFixed(3)),
      wallVolumeNet: 0,
      wallAreaGross: parseFloat(wallAreaGross.toFixed(2)),
      wallAreaNet: 0,
      netBricksCount: 0,
      totalBricksWithWaste: 0,
      fullBricksCount: 0,
      halfBricksCount: 0,
      cutBricksCount: 0,
      mortarVolumeWet: 0,
      mortarVolumeDry: 0,
      cementBagsRequired: 0,
      sandVolumeRequired: 0,
      sandWeightRequired: 0,
      waterRequired: 0,
      materialCost: 0,
      labourCost: 0,
      grandTotal: 0,
      costPerArea: 0,
      costPerVolume: 0
    };
  }
  
  // 2. Perform placement simulation to count bricks, half-bricks, cut bricks and cavity volumes
  const { bricks, cavityVolume } = generateBricksList(
    wallLength,
    wallHeight,
    T,
    bl,
    bw,
    bh,
    j,
    bondType,
    processedOpenings
  );
  
  let fullBricksCount = 0;
  let halfBricksCount = 0;
  let cutBricksCount = 0;
  let totalSolidBrickVolume = 0;
  
  for (const b of bricks) {
    let expectedW = bl;
    if (b.isHeader) {
      expectedW = (bondType === 'rat-trap') ? bh : bw;
    }
    
    const ratio = b.w / expectedW;
    
    if (ratio > 0.95) {
      fullBricksCount++;
    } else if (ratio >= 0.45 && ratio <= 0.55) {
      halfBricksCount++;
    } else {
      cutBricksCount++;
    }
    
    totalSolidBrickVolume += b.w * b.h * b.d;
  }
  
  const netBricksCount = fullBricksCount + Math.ceil(halfBricksCount / 2) + cutBricksCount;
  const totalBricksWithWaste = Math.ceil(netBricksCount * (1 + wastePercent / 100));
  
  // 3. Mortar Volume calculations
  let mortarVolumeWet = wallVolumeNet - totalSolidBrickVolume - cavityVolume;
  
  const minMortarRatio = bondType === 'rat-trap' ? 0.08 : 0.15;
  const maxMortarRatio = bondType === 'rat-trap' ? 0.20 : 0.38;
  
  if (mortarVolumeWet < wallVolumeNet * minMortarRatio || mortarVolumeWet > wallVolumeNet * maxMortarRatio) {
    mortarVolumeWet = wallVolumeNet * (bondType === 'rat-trap' ? 0.12 : 0.26);
  }
  
  const mortarVolumeDry = mortarVolumeWet * 1.27;
  
  const parts = mixRatio.split(':').map(Number);
  const sandParts = parts[1] || 4;
  const totalParts = 1 + sandParts;
  
  const cementVol = mortarVolumeDry / totalParts;
  const sandVol = cementVol * sandParts;
  
  let cementBagsRequired = 0;
  let sandWeightRequired = 0;
  
  if (isMetric) {
    const cementWeightKg = cementVol * 1440;
    cementBagsRequired = Math.ceil(cementWeightKg / 50);
    sandWeightRequired = sandVol * 1600;
  } else {
    const cementWeightLbs = cementVol * 90;
    cementBagsRequired = Math.ceil(cementWeightLbs / 94);
    sandWeightRequired = sandVol * 100;
  }
  
  const waterRequired = cementBagsRequired * (isMetric ? 25 : 6.6);
  
  // 4. Cost Calculations
  const materialCost = (totalBricksWithWaste * brickPrice) + 
                       (cementBagsRequired * cementPrice) + 
                       (sandVol * sandPrice);
                       
  const calculatedLabour = wallVolumeNet * labourCost;
  const grandTotal = materialCost + calculatedLabour + transportCost;
  
  const costPerArea = wallAreaNet > 0 ? grandTotal / wallAreaNet : 0;
  const costPerVolume = wallVolumeNet > 0 ? grandTotal / wallVolumeNet : 0;
  
  return {
    wallVolumeGross: parseFloat(wallVolumeGross.toFixed(3)),
    wallVolumeNet: parseFloat(wallVolumeNet.toFixed(3)),
    wallAreaGross: parseFloat(wallAreaGross.toFixed(2)),
    wallAreaNet: parseFloat(wallAreaNet.toFixed(2)),
    netBricksCount,
    totalBricksWithWaste,
    fullBricksCount,
    halfBricksCount,
    cutBricksCount,
    mortarVolumeWet: parseFloat(mortarVolumeWet.toFixed(4)),
    mortarVolumeDry: parseFloat(mortarVolumeDry.toFixed(4)),
    cementBagsRequired,
    sandVolumeRequired: parseFloat(sandVol.toFixed(3)),
    sandWeightRequired: parseFloat(sandWeightRequired.toFixed(1)),
    waterRequired: parseFloat(waterRequired.toFixed(1)),
    materialCost: parseFloat(materialCost.toFixed(2)),
    labourCost: parseFloat(calculatedLabour.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
    costPerArea: parseFloat(costPerArea.toFixed(2)),
    costPerVolume: parseFloat(costPerVolume.toFixed(2))
  };
}
