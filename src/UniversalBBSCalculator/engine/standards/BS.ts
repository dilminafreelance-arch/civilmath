import { StandardFormulas } from '../types';

export const BS_FORMULAS: StandardFormulas = {
  code: 'BS 8110',
  label: 'BS 8110:1997',

  fy: 460,   // grade 460
  fck: 30,   // C30 concrete
  concreteDensity: 2400,
  steelDensity: 7850,

  hookLength: (diaMm: number, type: '90deg' | '135deg' | '180deg') => {
    const dB = Math.max(diaMm, 8);
    if (type === '180deg') return 4 * dB;
    if (type === '135deg') return 4 * dB;
    return Math.max(4 * dB, 12 * dB);
  },

  bendDeduction: (bendAngle: number, diaMm: number) => {
    if (bendAngle === 45) return 0.5 * diaMm;
    if (bendAngle === 90) return 2 * diaMm;
    if (bendAngle === 135) return 2.5 * diaMm;
    if (bendAngle === 180) return 3 * diaMm;
    return 0;
  },

  bendAllowance: (bendAngle: number, diaMm: number) => {
    const r = Math.max(2 * diaMm, 12);
    if (bendAngle === 90) return Math.PI * (r + diaMm) / 2;
    if (bendAngle === 135) return 3 * Math.PI * (r + diaMm) / 4;
    if (bendAngle === 180) return Math.PI * (r + diaMm);
    return 0;
  },

  developmentLength: (diaMm: number, fy: number, fck: number, isTension: boolean) => {
    const fb = 0.5 * Math.sqrt(fck);
    if (isTension) {
      return Math.max((fy * diaMm) / (4 * fb), 300);
    }
    return Math.max((fy * diaMm) / (5 * fb), 200);
  },

  lapLength: (diaMm: number, fy: number, fck: number, lapClass: 'tension' | 'compression') => {
    const ld = BS_FORMULAS.developmentLength(diaMm, fy, fck, true);
    if (lapClass === 'tension') return Math.max(1.4 * ld, 300);
    return Math.max(0.9 * ld, 250);
  },

  minCover: (exposureClass: string, elementType: string) => {
    if (exposureClass === 'X0') return 25;
    if (exposureClass === 'XC1') return 30;
    if (exposureClass === 'XC2') return 35;
    if (exposureClass === 'XC3' || exposureClass === 'XC4') return 50;
    return 40;
  },

  maxSpacing: (elementType: string, isMain: boolean) => {
    if (elementType === 'slab') return isMain ? 400 : 600;
    if (elementType === 'wall') return isMain ? 400 : 400;
    return isMain ? 300 : 600;
  },

  minReinfRatio: (elementType: string) => {
    if (elementType === 'slab') return 0.0013;
    if (elementType === 'wall') return 0.0013;
    return 0.008;
  },

  maxReinfRatio: (elementType: string) => {
    if (elementType === 'beam') return 0.04;
    if (elementType === 'column') return 0.06;
    if (elementType === 'slab') return 0.04;
    return 0.08;
  },

  minBarSpacing: (diaMm: number, aggSize: number) => {
    return Math.max(diaMm, aggSize + 5, 25);
  },

  anchorageLength: (diaMm: number, fy: number, fck: number, hook: boolean) => {
    const ld = BS_FORMULAS.developmentLength(diaMm, fy, fck, true);
    if (hook) return Math.max(0.7 * ld, 150);
    return ld;
  },

  bendRadius: (diaMm: number) => {
    if (diaMm <= 16) return 2 * diaMm;
    if (diaMm <= 25) return 2.5 * diaMm;
    return 3 * diaMm;
  },
};
