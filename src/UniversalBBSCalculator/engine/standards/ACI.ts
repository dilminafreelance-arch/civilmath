import { StandardFormulas } from '../types';

export const ACI_FORMULAS: StandardFormulas = {
  code: 'ACI 318',
  label: 'ACI 318-19',

  fy: 420,   // Grade 60 in MPa
  fck: 28,   // 4000 psi in MPa
  concreteDensity: 2400,
  steelDensity: 7850,

  hookLength: (diaMm: number, type: '90deg' | '135deg' | '180deg') => {
    const dB = Math.max(diaMm, 10);
    if (type === '180deg') return Math.max(4 * dB, 6.25 * dB);
    if (type === '135deg') return Math.max(4 * dB, 5 * dB);
    return Math.max(4 * dB, 12 * dB);
  },

  bendDeduction: (bendAngle: number, diaMm: number) => {
    const r = Math.max(2 * diaMm, 12);
    const k = 1; // k factor for mild steel
    if (bendAngle === 45) return (Math.PI * (r + k * diaMm) / 4 - 2 * diaMm) * 0;
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

  developmentLength: (diaMm: number, fy: number, fck: number, isTension: boolean) => {
    if (isTension) {
      return Math.max((fy * diaMm) / (1.7 * Math.sqrt(fck)), 300);
    }
    return Math.max((fy * diaMm) / (4 * Math.sqrt(fck)), 200);
  },

  lapLength: (diaMm: number, fy: number, fck: number, lapClass: 'tension' | 'compression') => {
    const ld = ACI_FORMULAS.developmentLength(diaMm, fy, fck, true);
    if (lapClass === 'tension') return Math.max(1.3 * ld, 300);
    return Math.max(0.85 * ld, 200);
  },

  minCover: (exposureClass: string, elementType: string) => {
    if (exposureClass === 'severe' || exposureClass === 'X0') return 50;
    if (exposureClass === 'moderate' || exposureClass === 'XC') return 40;
    return 20;
  },

  maxSpacing: (elementType: string, isMain: boolean) => {
    if (elementType === 'slab') return isMain ? 450 : 600;
    if (elementType === 'wall') return isMain ? 450 : 450;
    return isMain ? 300 : 600;
  },

  minReinfRatio: (elementType: string) => {
    if (elementType === 'slab') return 0.0018;
    if (elementType === 'wall') return 0.0012;
    return 0.01;
  },

  maxReinfRatio: (elementType: string) => {
    if (elementType === 'beam') return 0.025;
    if (elementType === 'column') return 0.08;
    if (elementType === 'slab') return 0.04;
    return 0.06;
  },

  minBarSpacing: (diaMm: number, aggSize: number) => {
    return Math.max(diaMm, aggSize + 5, 25);
  },

  anchorageLength: (diaMm: number, fy: number, fck: number, hook: boolean) => {
    const ld = ACI_FORMULAS.developmentLength(diaMm, fy, fck, true);
    if (hook) return Math.max(0.7 * ld, 150);
    return ld;
  },

  bendRadius: (diaMm: number) => {
    if (diaMm <= 16) return 2 * diaMm;
    if (diaMm <= 25) return 2.5 * diaMm;
    return 3 * diaMm;
  },
};
