import { DesignStandard, StandardFormulas } from '../types';
import { ACI_FORMULAS } from './ACI';
import { BS_FORMULAS } from './BS';
import { EUROCODE_FORMULAS } from './Eurocode';
import { IS_FORMULAS } from './IS';

export const STANDARDS: Record<DesignStandard, StandardFormulas> = {
  'ACI 318': ACI_FORMULAS,
  'BS 8110': BS_FORMULAS,
  'Eurocode 2': EUROCODE_FORMULAS,
  'IS 456': IS_FORMULAS,
};

export const STANDARD_OPTIONS: { value: DesignStandard; label: string }[] = [
  { value: 'ACI 318', label: 'ACI 318-19 (American)' },
  { value: 'BS 8110', label: 'BS 8110:1997 (British)' },
  { value: 'Eurocode 2', label: 'EN 1992-1-1 (European)' },
  { value: 'IS 456', label: 'IS 456:2000 (Indian)' },
];

export function getStandard(code: DesignStandard): StandardFormulas {
  return STANDARDS[code];
}

export { ACI_FORMULAS, BS_FORMULAS, EUROCODE_FORMULAS, IS_FORMULAS };
