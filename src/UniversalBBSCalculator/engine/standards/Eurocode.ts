import { StandardFormulas } from '../types';

export const EUROCODE_FORMULAS: StandardFormulas = {
  code: 'Eurocode 2',
  label: 'EN 1992-1-1:2004',

  fy: 500,   // B500B
  fck: 30,   // C30/37
  concreteDensity: 2500,
  steelDensity: 7850,

  hookLength: (diaMm: number, type: '90deg' | '135deg' | '180deg') => {
    const r = Math.max(2.5 * diaMm, 12);
    if (type === '180deg') return 4.5 * diaMm;
    if (type === '135deg') return 5 * diaMm;
    return 12 * diaMm;
  },

  bendDeduction: (bendAngle: number, diaMm: number) => {
    const r = Math.max(2.5 * diaMm, 12);
    if (bendAngle === 45) return diaMm;
    if (bendAngle === 90) return 2.5 * diaMm;
    if (bendAngle === 135) return 3.5 * diaMm;
    if (bendAngle === 180) return 5 * diaMm;
    return 0;
  },

  bendAllowance: (bendAngle: number, diaMm: number) => {
    const r = Math.max(2.5 * diaMm, 12);
    if (bendAngle === 90) return Math.PI * (r + diaMm) / 2;
    if (bendAngle === 135) return 3 * Math.PI * (r + diaMm) / 4;
    if (bendAngle === 180) return Math.PI * (r + diaMm);
    return 0;
  },

  developmentLength: (diaMm: number, fy: number, fck: number, isTension: boolean) => {
    const fbd = 2.25 * 0.7 * 0.3 * Math.pow(fck, 2/3) / 1.5;
    const sigmaSd = fy / 1.15;
    if (isTension) {
      return Math.max((sigmaSd * diaMm) / (4 * fbd), 10 * diaMm, 100);
    }
    return Math.max((sigmaSd * 0.7 * diaMm) / (4 * fbd), 10 * diaMm, 100);
  },

  lapLength: (diaMm: number, fy: number, fck: number, lapClass: 'tension' | 'compression') => {
    const ld = EUROCODE_FORMULAS.developmentLength(diaMm, fy, fck, true);
    if (lapClass === 'tension') return Math.max(1.5 * ld, 15 * diaMm, 200);
    return Math.max(0.85 * ld, 10 * diaMm, 150);
  },

  minCover: (exposureClass: string, elementType: string) => {
    if (exposureClass === 'X0') return 15;
    if (exposureClass === 'XC1') return 20;
    if (exposureClass === 'XC2') return 30;
    if (exposureClass === 'XC3' || exposureClass === 'XC4') return 40;
    if (exposureClass === 'XD1' || exposureClass === 'XS1') return 50;
    return 55;
  },

  maxSpacing: (elementType: string, isMain: boolean) => {
    if (elementType === 'slab') return isMain ? 350 : 450;
    if (elementType === 'wall') return isMain ? 350 : 400;
    return isMain ? 300 : 500;
  },

  minReinfRatio: (elementType: string) => {
    if (elementType === 'slab') return 0.002;
    if (elementType === 'wall') return 0.001;
    return 0.01;
  },

  maxReinfRatio: (elementType: string) => {
    if (elementType === 'beam') return 0.04;
    if (elementType === 'column') return 0.08;
    if (elementType === 'slab') return 0.04;
    return 0.06;
  },

  minBarSpacing: (diaMm: number, aggSize: number) => {
    return Math.max(diaMm, aggSize + 5, 20);
  },

  anchorageLength: (diaMm: number, fy: number, fck: number, hook: boolean) => {
    const ld = EUROCODE_FORMULAS.developmentLength(diaMm, fy, fck, true);
    if (hook) return Math.max(0.7 * ld, 150);
    return ld;
  },

  bendRadius: (diaMm: number) => {
    if (diaMm <= 16) return 2.5 * diaMm;
    if (diaMm <= 25) return 3 * diaMm;
    return 4 * diaMm;
  },
};
