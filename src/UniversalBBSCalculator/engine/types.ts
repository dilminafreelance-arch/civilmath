export type DesignStandard = 'ACI 318' | 'BS 8110' | 'Eurocode 2' | 'IS 456';

export interface StandardFormulas {
  code: DesignStandard;
  label: string;
  /** Hook length as multiple of bar diameter */
  hookLength: (diaMm: number, type: '90deg' | '135deg' | '180deg') => number;
  /** Bend deduction per bend type */
  bendDeduction: (bendAngle: number, diaMm: number) => number;
  /** Bend allowance (additive length for a bend) */
  bendAllowance: (bendAngle: number, diaMm: number) => number;
  /** Development length Ld */
  developmentLength: (diaMm: number, fy: number, fck: number, isTension: boolean) => number;
  /** Lap length */
  lapLength: (diaMm: number, fy: number, fck: number, lapClass: 'tension' | 'compression') => number;
  /** Minimum concrete cover based on exposure */
  minCover: (exposureClass: string, elementType: string) => number;
  /** Maximum spacing of reinforcement */
  maxSpacing: (elementType: string, isMain: boolean) => number;
  /** Minimum reinforcement ratio */
  minReinfRatio: (elementType: string) => number;
  /** Maximum reinforcement ratio */
  maxReinfRatio: (elementType: string) => number;
  /** Minimum bar spacing */
  minBarSpacing: (diaMm: number, aggSize: number) => number;
  /** Anchorage length */
  anchorageLength: (diaMm: number, fy: number, fck: number, hook: boolean) => number;
  /** Bend radius for a given bar diameter */
  bendRadius: (diaMm: number) => number;
  /** Steel yield strength used in calculations */
  fy: number;
  /** Concrete compressive strength used in calculations */
  fck: number;
  /** Concrete density */
  concreteDensity: number;
  /** Steel density */
  steelDensity: number;
}

export interface CalcStep {
  step: number;
  description: string;
  formula: string;
  calculation: string;
  result: string;
}

export interface FormulaDetail {
  parameter: string;
  value: string;
  unit: string;
  formula: string;
  steps: CalcStep[];
  codeRef: string;
  note: string;
}

export interface ValidationRule {
  field: string;
  label: string;
  severity: 'error' | 'warning';
  message: string;
  limit: string;
  actual: string;
  condition: string;
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationRule[];
  warnings: ValidationRule[];
}

export interface ShapeCodeDef {
  code: string;
  name: string;
  sketch: string;
  formula: string;
  params: string[];
}
