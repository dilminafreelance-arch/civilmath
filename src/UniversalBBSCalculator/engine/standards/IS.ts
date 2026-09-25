import { StandardFormulas } from '../types';

export const IS_FORMULAS: StandardFormulas = {
  code: 'IS 456',
  label: 'IS 456:2000',

  fy: 500,   // Fe500
  fck: 25,   // M25
  concreteDensity: 2500,
  steelDensity: 7850,

  hookLength: (diaMm: number, type: '90deg' | '135deg' | '180deg') => {
    const dB = Math.max(diaMm, 8);
    if (type === '180deg') return 4 * dB;
    if (type === '135deg') return 4.5 * dB;
    return 9 * dB;
  },

  bendDeduction: (bendAngle: number, diaMm: number) => {
    if (bendAngle === 45) return 1 * diaMm;
    if (bendAngle === 90) return 2 * diaMm;
    if (bendAngle === 135) return 3 * diaMm;
    if (bendAngle === 180) return 4 * diaMm;
    return 0;
  },

  bendAllowance: (bendAngle: number, diaMm: number) => {
    const r = Math.max(2 * diaMm, 12);
    if (bendAngle === 90) return Math.PI * (r + diaMm) / 2;
    if (bendAngle === 135) return 3 * Math.PI * (r + diaMm) / 4;
    if (bendAngle === 180) return Math.PI * (r + diaMm);
    return 0;
  },

  // Design bond stress τ_bd (MPa) from IS 456:2000 Table 26.2.1.1
  // For deformed bars, values are increased by 60% per Cl. 26.2.1.2.
  developmentLength: (diaMm: number, fy: number, fck: number, isTension: boolean) => {
    // Base bond stress (MPa) for plain bars in tension (Table 26.2.1.1)
    const baseTauBd =
      fck >= 35 ? 1.6 :
      fck >= 30 ? 1.5 :
      fck >= 25 ? 1.4 :
      fck >= 20 ? 1.2 : 1.0;
    // Deformed bars → 60% increase
    const tauBd = baseTauBd * 1.6;
    if (isTension) {
      return Math.max((0.87 * fy * diaMm) / (4 * tauBd), 300);
    }
    return Math.max((0.87 * fy * diaMm) / (5 * tauBd), 200);
  },

  lapLength: (diaMm: number, fy: number, fck: number, lapClass: 'tension' | 'compression') => {
    if (lapClass === 'tension') {
      const ld = IS_FORMULAS.developmentLength(diaMm, fy, fck, true);
      return Math.max(1.5 * ld, 300);
    }
    return Math.max(24 * diaMm, 200);
  },

  minCover: (exposureClass: string, elementType: string) => {
    if (exposureClass === 'mild') return 20;
    if (exposureClass === 'moderate') return 30;
    if (exposureClass === 'severe') return 45;
    if (exposureClass === 'very severe') return 50;
    return 75;
  },

  maxSpacing: (elementType: string, isMain: boolean) => {
    if (elementType === 'slab') return isMain ? 300 : 450;
    if (elementType === 'wall') return isMain ? 450 : 450;
    return isMain ? 300 : 600;
  },

  minReinfRatio: (elementType: string) => {
    if (elementType === 'slab') return 0.0015;
    if (elementType === 'wall') return 0.0012;
    if (elementType === 'beam') return 0.002;
    return 0.008;
  },

  maxReinfRatio: (elementType: string) => {
    if (elementType === 'beam') return 0.04;
    if (elementType === 'column') return 0.06;
    if (elementType === 'slab') return 0.04;
    return 0.06;
  },

  minBarSpacing: (diaMm: number, aggSize: number) => {
    return Math.max(diaMm, aggSize + 5, 25);
  },

  anchorageLength: (diaMm: number, fy: number, fck: number, hook: boolean) => {
    const ld = IS_FORMULAS.developmentLength(diaMm, fy, fck, true);
    if (hook) return Math.max(0.8 * ld, 150);
    return ld;
  },

  bendRadius: (diaMm: number) => {
    if (diaMm <= 16) return 2 * diaMm;
    if (diaMm <= 25) return 2.5 * diaMm;
    return 3 * diaMm;
  },
};
