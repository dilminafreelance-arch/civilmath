import React, { createContext, useContext, useReducer, useCallback, useMemo, type ReactNode } from 'react';
import {
  BOQState, BOQSection, ProjectInfo, FoundationBOQ, ColumnBOQ, BeamBOQ,
  SlabBOQ, StairBOQ, RetainingWallBOQ, BrickWallBOQ, MaterialPrices,
  BOQLineItem, BOQAggregate, SavedBOQProject, defaultBOQState,
  defaultMaterialPrices, defaultProjectInfo,
} from './types';

const STORAGE_KEY = 'civilmath_boq_projects';

type BOQAction =
  | { type: 'SET_SECTION'; section: BOQSection }
  | { type: 'SET_PROJECT_INFO'; info: Partial<ProjectInfo> }
  | { type: 'SET_MATERIAL_PRICES'; prices: Partial<MaterialPrices> }
  | { type: 'ADD_FOUNDATION'; item: FoundationBOQ }
  | { type: 'UPDATE_FOUNDATION'; id: string; item: Partial<FoundationBOQ> }
  | { type: 'REMOVE_FOUNDATION'; id: string }
  | { type: 'DUPLICATE_FOUNDATION'; id: string }
  | { type: 'ADD_COLUMN'; item: ColumnBOQ }
  | { type: 'UPDATE_COLUMN'; id: string; item: Partial<ColumnBOQ> }
  | { type: 'REMOVE_COLUMN'; id: string }
  | { type: 'DUPLICATE_COLUMN'; id: string }
  | { type: 'ADD_BEAM'; item: BeamBOQ }
  | { type: 'UPDATE_BEAM'; id: string; item: Partial<BeamBOQ> }
  | { type: 'REMOVE_BEAM'; id: string }
  | { type: 'DUPLICATE_BEAM'; id: string }
  | { type: 'ADD_SLAB'; item: SlabBOQ }
  | { type: 'UPDATE_SLAB'; id: string; item: Partial<SlabBOQ> }
  | { type: 'REMOVE_SLAB'; id: string }
  | { type: 'DUPLICATE_SLAB'; id: string }
  | { type: 'ADD_STAIR'; item: StairBOQ }
  | { type: 'UPDATE_STAIR'; id: string; item: Partial<StairBOQ> }
  | { type: 'REMOVE_STAIR'; id: string }
  | { type: 'ADD_RETAINING_WALL'; item: RetainingWallBOQ }
  | { type: 'UPDATE_RETAINING_WALL'; id: string; item: Partial<RetainingWallBOQ> }
  | { type: 'REMOVE_RETAINING_WALL'; id: string }
  | { type: 'ADD_BRICK_WALL'; item: BrickWallBOQ }
  | { type: 'UPDATE_BRICK_WALL'; id: string; item: Partial<BrickWallBOQ> }
  | { type: 'REMOVE_BRICK_WALL'; id: string }
  | { type: 'SAVE_PROJECT'; name: string }
  | { type: 'LOAD_PROJECT'; id: string }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'NEW_PROJECT' }
  | { type: 'MARK_SAVED' }
  | { type: 'LOAD_PROJECT_STATE'; state: Omit<BOQState, 'savedProjects' | 'activeSection' | 'isDirty'> };

function nextId(items: { id: string }[], prefix: string): string {
  const nums = items
    .map(i => parseInt(i.id.replace(prefix, ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefix}${max + 1}`;
}

function recalcFoundation(f: FoundationBOQ, isMetric: boolean, prices: MaterialPrices): FoundationBOQ {
  const vol = f.length * f.width * f.depth * f.count;
  const dryVol = vol * 1.54;
  const totalParts = 1 + 1.5 + 3;
  const cementVol = dryVol / totalParts;
  const cementBags = Math.ceil(cementVol / 0.0347);
  const sandVol = dryVol * 1.5 / totalParts;
  const aggVol = dryVol * 3 / totalParts;

  const dia = parseInt(f.botReinf.replace(/\D/g, ''), 10) || 12;
  const wPerM = isMetric ? (dia * dia) / 162 : (dia * dia) / 241;
  const totalLen = f.length * f.width / (f.spacing || 150) * f.count * 2;
  const steelWt = totalLen * wPerM;

  const tieWire = steelWt * 0.015;
  const cost = vol * prices.concretePerM3 + steelWt / 1000 * (prices.steelPerKg[String(dia)] || 0.8);

  return { ...f, concreteVolume: vol, cementBags, sandVolume: sandVol, aggregateVolume: aggVol, steelWeight: steelWt, tieWire, cost };
}

function recalcColumn(c: ColumnBOQ, isMetric: boolean, prices: MaterialPrices): ColumnBOQ {
  const vol = c.width / 1000 * c.depth / 1000 * c.height * c.count;
  const mainDia = parseInt(c.mainBars.replace(/\D/g, ''), 10) || 16;
  const mainWPerM = isMetric ? (mainDia * mainDia) / 162 : (mainDia * mainDia) / 241;
  const mainLen = c.height * c.cornerBars * c.count;
  const mainWt = mainLen * mainWPerM;

  const tieWPerM = isMetric ? (c.tieDia * c.tieDia) / 162 : (c.tieDia * c.tieDia) / 241;
  const perim = 2 * (c.width / 1000 + c.depth / 1000);
  const tieCount = Math.ceil(c.height / c.tieSpacing);
  const tieLen = perim * tieCount * c.count;
  const tieWt = tieLen * tieWPerM;

  const steelWt = mainWt + tieWt;
  const bindingWire = steelWt * 0.012;
  const cost = vol * prices.concretePerM3 + steelWt / 1000 * (prices.steelPerKg[String(mainDia)] || 0.8);

  return { ...c, concreteVolume: vol, verticalBarsWeight: mainWt, tieBarsWeight: tieWt, steelWeight: steelWt, bindingWire, cost };
}

function recalcBeam(b: BeamBOQ, isMetric: boolean, prices: MaterialPrices): BeamBOQ {
  const vol = b.width / 1000 * b.depth / 1000 * b.length * b.count;
  const mainDia = parseInt(b.bottomBars.replace(/\D/g, ''), 10) || 12;
  const wPerM = isMetric ? (mainDia * mainDia) / 162 : (mainDia * mainDia) / 241;
  const barCount = parseInt(b.bottomBars.match(/\d+/)?.[0] || '4', 10);
  const steelWt = b.length * barCount * wPerM * b.count;

  const stirrupWPerM = isMetric ? (b.stirrupDia * b.stirrupDia) / 162 : (b.stirrupDia * b.stirrupDia) / 241;
  const stirrupCount = Math.ceil(b.length / b.stirrupSpacing);
  const perim = 2 * (b.width / 1000 + b.depth / 1000 - 0.05);
  const stirrupWt = perim * stirrupCount * b.count * stirrupWPerM;

  const totalSteel = steelWt + stirrupWt;
  const formwork = (2 * b.depth / 1000 + b.width / 1000) * b.length * b.count;
  const bindingWire = totalSteel * 0.012;
  const cost = vol * prices.concretePerM3 + totalSteel / 1000 * (prices.steelPerKg[String(mainDia)] || 0.8) + formwork * prices.formworkPerM2;

  return { ...b, concreteVolume: vol, steelWeight: totalSteel, formworkArea: formwork, bindingWire, cost };
}

function recalcSlab(s: SlabBOQ, isMetric: boolean, prices: MaterialPrices): SlabBOQ {
  const vol = s.length * s.width * s.thickness / 1000 * s.count;
  const dia = parseInt(s.bottomMesh.replace(/\D/g, ''), 10) || 10;
  const wPerM = isMetric ? (dia * dia) / 162 : (dia * dia) / 241;
  const area = s.length * s.width;
  const spacing = 150;
  const barsPerDir = (s.length / spacing + s.width / spacing) * 1.1;
  const totalLen = barsPerDir * Math.max(s.length, s.width) * s.count;
  const steelWt = totalLen * wPerM;

  const cost = vol * prices.concretePerM3 + steelWt / 1000 * (prices.steelPerKg[String(dia)] || 0.8);

  return { ...s, concreteVolume: vol, steelWeight: steelWt, cost };
}

function recalcStair(s: StairBOQ, isMetric: boolean, prices: MaterialPrices): StairBOQ {
  const vol = s.width / 1000 * (s.flightLength + s.landingLength) * s.thickness / 1000 * s.count;
  const dia = parseInt(s.mainBars.replace(/\D/g, ''), 10) || 12;
  const wPerM = isMetric ? (dia * dia) / 162 : (dia * dia) / 241;
  const barCount = Math.ceil(s.width / 150);
  const totalLen = (s.flightLength + s.landingLength) * barCount * s.count;
  const steelWt = totalLen * wPerM;
  const cost = vol * prices.concretePerM3 + steelWt / 1000 * (prices.steelPerKg[String(dia)] || 0.8);

  return { ...s, concreteVolume: vol, steelWeight: steelWt, cost };
}

function recalcRetainingWall(r: RetainingWallBOQ, isMetric: boolean, prices: MaterialPrices): RetainingWallBOQ {
  const vol = (r.stemThickness / 1000 * r.stemHeight + r.baseWidth / 1000 * r.baseThickness) * r.length * r.count;
  const dia = parseInt(r.vertBars.replace(/\D/g, ''), 10) || 12;
  const wPerM = isMetric ? (dia * dia) / 162 : (dia * dia) / 241;
  const barSpacing = 150;
  const vertCount = Math.ceil(r.length / barSpacing);
  const horizCount = Math.ceil(r.stemHeight / barSpacing);
  const totalLen = (r.stemHeight * vertCount + r.length * horizCount) * r.count;
  const steelWt = totalLen * wPerM;
  const formwork = (r.stemHeight * 2 + r.baseWidth) * r.length * r.count;
  const cost = vol * prices.concretePerM3 + steelWt / 1000 * (prices.steelPerKg[String(dia)] || 0.8) + formwork * prices.formworkPerM2;

  return { ...r, concreteVolume: vol, steelWeight: steelWt, formworkArea: formwork, cost };
}

function recalcBrickWall(b: BrickWallBOQ, prices: MaterialPrices): BrickWallBOQ {
  const area = b.length * b.height * b.count;
  const brickCount = area * 60;
  const mortarVol = area * b.thickness / 1000 * 0.3;
  const cementBags = Math.ceil(mortarVol * 8);
  const sandVol = mortarVol * 1.2;
  const cost = brickCount / 1000 * prices.brickPer1000 + cementBags * prices.cementPerBag + sandVol * prices.sandPerM3;

  return { ...b, brickCount, mortarVolume: mortarVol, cementBags, sandVolume: sandVol, cost };
}

function boqReducer(state: BOQState, action: BOQAction): BOQState {
  const setItem = <T extends { id: string }>(
    items: T[], id: string, update: Partial<T>,
    recalc: (item: T) => T
  ): T[] => items.map(i => i.id === id ? recalc({ ...i, ...update }) : i);

  switch (action.type) {
    case 'SET_SECTION':
      return { ...state, activeSection: action.section };

    case 'SET_PROJECT_INFO':
      return { ...state, projectInfo: { ...state.projectInfo, ...action.info }, isDirty: true };

    case 'SET_MATERIAL_PRICES':
      return { ...state, materialPrices: { ...state.materialPrices, ...action.prices }, isDirty: true };

    case 'ADD_FOUNDATION': {
      const id = nextId(state.foundations, 'F');
      const item = recalcFoundation({ ...action.item, id }, true, state.materialPrices);
      return { ...state, foundations: [...state.foundations, item], isDirty: true };
    }
    case 'UPDATE_FOUNDATION':
      return { ...state, foundations: setItem(state.foundations, action.id, action.item, f => recalcFoundation(f, true, state.materialPrices)), isDirty: true };
    case 'REMOVE_FOUNDATION':
      return { ...state, foundations: state.foundations.filter(f => f.id !== action.id), isDirty: true };
    case 'DUPLICATE_FOUNDATION': {
      const src = state.foundations.find(f => f.id === action.id);
      if (!src) return state;
      const id = nextId(state.foundations, 'F');
      const item = recalcFoundation({ ...src, id }, true, state.materialPrices);
      return { ...state, foundations: [...state.foundations, item], isDirty: true };
    }

    case 'ADD_COLUMN': {
      const id = nextId(state.columns, 'C');
      const item = recalcColumn({ ...action.item, id }, true, state.materialPrices);
      return { ...state, columns: [...state.columns, item], isDirty: true };
    }
    case 'UPDATE_COLUMN':
      return { ...state, columns: setItem(state.columns, action.id, action.item, c => recalcColumn(c, true, state.materialPrices)), isDirty: true };
    case 'REMOVE_COLUMN':
      return { ...state, columns: state.columns.filter(c => c.id !== action.id), isDirty: true };
    case 'DUPLICATE_COLUMN': {
      const src = state.columns.find(c => c.id === action.id);
      if (!src) return state;
      const id = nextId(state.columns, 'C');
      const item = recalcColumn({ ...src, id }, true, state.materialPrices);
      return { ...state, columns: [...state.columns, item], isDirty: true };
    }

    case 'ADD_BEAM': {
      const id = nextId(state.beams, 'B');
      const item = recalcBeam({ ...action.item, id }, true, state.materialPrices);
      return { ...state, beams: [...state.beams, item], isDirty: true };
    }
    case 'UPDATE_BEAM':
      return { ...state, beams: setItem(state.beams, action.id, action.item, b => recalcBeam(b, true, state.materialPrices)), isDirty: true };
    case 'REMOVE_BEAM':
      return { ...state, beams: state.beams.filter(b => b.id !== action.id), isDirty: true };
    case 'DUPLICATE_BEAM': {
      const src = state.beams.find(b => b.id === action.id);
      if (!src) return state;
      const id = nextId(state.beams, 'B');
      const item = recalcBeam({ ...src, id }, true, state.materialPrices);
      return { ...state, beams: [...state.beams, item], isDirty: true };
    }

    case 'ADD_SLAB': {
      const id = nextId(state.slabs, 'S');
      const item = recalcSlab({ ...action.item, id }, true, state.materialPrices);
      return { ...state, slabs: [...state.slabs, item], isDirty: true };
    }
    case 'UPDATE_SLAB':
      return { ...state, slabs: setItem(state.slabs, action.id, action.item, s => recalcSlab(s, true, state.materialPrices)), isDirty: true };
    case 'REMOVE_SLAB':
      return { ...state, slabs: state.slabs.filter(s => s.id !== action.id), isDirty: true };
    case 'DUPLICATE_SLAB': {
      const src = state.slabs.find(s => s.id === action.id);
      if (!src) return state;
      const id = nextId(state.slabs, 'S');
      const item = recalcSlab({ ...src, id }, true, state.materialPrices);
      return { ...state, slabs: [...state.slabs, item], isDirty: true };
    }

    case 'ADD_STAIR': {
      const id = nextId(state.stairs, 'ST');
      const item = recalcStair({ ...action.item, id }, true, state.materialPrices);
      return { ...state, stairs: [...state.stairs, item], isDirty: true };
    }
    case 'UPDATE_STAIR':
      return { ...state, stairs: setItem(state.stairs, action.id, action.item, s => recalcStair(s, true, state.materialPrices)), isDirty: true };
    case 'REMOVE_STAIR':
      return { ...state, stairs: state.stairs.filter(s => s.id !== action.id), isDirty: true };

    case 'ADD_RETAINING_WALL': {
      const id = nextId(state.retainingWalls, 'RW');
      const item = recalcRetainingWall({ ...action.item, id }, true, state.materialPrices);
      return { ...state, retainingWalls: [...state.retainingWalls, item], isDirty: true };
    }
    case 'UPDATE_RETAINING_WALL':
      return { ...state, retainingWalls: setItem(state.retainingWalls, action.id, action.item, r => recalcRetainingWall(r, true, state.materialPrices)), isDirty: true };
    case 'REMOVE_RETAINING_WALL':
      return { ...state, retainingWalls: state.retainingWalls.filter(r => r.id !== action.id), isDirty: true };

    case 'ADD_BRICK_WALL': {
      const id = nextId(state.brickWalls, 'BW');
      const item = recalcBrickWall({ ...action.item, id }, state.materialPrices);
      return { ...state, brickWalls: [...state.brickWalls, item], isDirty: true };
    }
    case 'UPDATE_BRICK_WALL':
      return { ...state, brickWalls: setItem(state.brickWalls, action.id, action.item, b => recalcBrickWall(b, state.materialPrices)), isDirty: true };
    case 'REMOVE_BRICK_WALL':
      return { ...state, brickWalls: state.brickWalls.filter(b => b.id !== action.id), isDirty: true };

    case 'SAVE_PROJECT': {
      const projects: SavedBOQProject[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const existing = projects.findIndex(p => p.name === action.name);
      const saved: SavedBOQProject = {
        id: state.currentProjectId || `proj_${Date.now()}`,
        name: action.name,
        date: new Date().toISOString(),
        state: {
          projectInfo: state.projectInfo,
          foundations: state.foundations,
          columns: state.columns,
          beams: state.beams,
          slabs: state.slabs,
          stairs: state.stairs,
          retainingWalls: state.retainingWalls,
          brickWalls: state.brickWalls,
          materialPrices: state.materialPrices,
          currentProjectId: state.currentProjectId,
        },
      };
      if (existing >= 0) projects[existing] = saved;
      else projects.push(saved);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      return { ...state, savedProjects: projects, currentProjectId: saved.id, isDirty: false };
    }

    case 'LOAD_PROJECT': {
      const projects: SavedBOQProject[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const saved = projects.find(p => p.id === action.id);
      if (!saved) return state;
      return { ...state, ...saved.state, savedProjects: projects, activeSection: 'project-info', isDirty: false };
    }

    case 'DELETE_PROJECT': {
      const projects: SavedBOQProject[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const filtered = projects.filter(p => p.id !== action.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return { ...state, savedProjects: filtered, currentProjectId: state.currentProjectId === action.id ? null : state.currentProjectId };
    }

    case 'NEW_PROJECT':
      return { ...defaultBOQState(), savedProjects: state.savedProjects };

    case 'MARK_SAVED':
      return { ...state, isDirty: false };

    case 'LOAD_PROJECT_STATE':
      return { ...state, ...action.state, savedProjects: state.savedProjects, activeSection: 'project-info', isDirty: false };

    default:
      return state;
  }
}

interface BOQContextValue {
  state: BOQState;
  dispatch: React.Dispatch<BOQAction>;
  aggregate: BOQAggregate;
  boqLines: BOQLineItem[];
  setSection: (s: BOQSection) => void;
  updateProjectInfo: (info: Partial<ProjectInfo>) => void;
  updateMaterialPrices: (prices: Partial<MaterialPrices>) => void;
  addFoundation: (item?: Partial<FoundationBOQ>) => void;
  updateFoundation: (id: string, item: Partial<FoundationBOQ>) => void;
  removeFoundation: (id: string) => void;
  duplicateFoundation: (id: string) => void;
  addColumn: (item?: Partial<ColumnBOQ>) => void;
  updateColumn: (id: string, item: Partial<ColumnBOQ>) => void;
  removeColumn: (id: string) => void;
  duplicateColumn: (id: string) => void;
  addBeam: (item?: Partial<BeamBOQ>) => void;
  updateBeam: (id: string, item: Partial<BeamBOQ>) => void;
  removeBeam: (id: string) => void;
  duplicateBeam: (id: string) => void;
  addSlab: (item?: Partial<SlabBOQ>) => void;
  updateSlab: (id: string, item: Partial<SlabBOQ>) => void;
  removeSlab: (id: string) => void;
  duplicateSlab: (id: string) => void;
  addStair: (item?: Partial<StairBOQ>) => void;
  updateStair: (id: string, item: Partial<StairBOQ>) => void;
  removeStair: (id: string) => void;
  addRetainingWall: (item?: Partial<RetainingWallBOQ>) => void;
  updateRetainingWall: (id: string, item: Partial<RetainingWallBOQ>) => void;
  removeRetainingWall: (id: string) => void;
  addBrickWall: (item?: Partial<BrickWallBOQ>) => void;
  updateBrickWall: (id: string, item: Partial<BrickWallBOQ>) => void;
  removeBrickWall: (id: string) => void;
  saveProject: (name: string) => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  newProject: () => void;
  exportProject: () => string;
  importProject: (json: string) => void;
}

const BOQContext = createContext<BOQContextValue | null>(null);

export function BOQProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(boqReducer, null, () => {
    const saved: SavedBOQProject[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return { ...defaultBOQState(), savedProjects: saved };
  });

  const aggregate = useMemo<BOQAggregate>(() => {
    const fSum = state.foundations.reduce((a, f) => ({
      concrete: a.concrete + f.concreteVolume,
      cement: a.cement + f.cementBags,
      sand: a.sand + f.sandVolume,
      agg: a.agg + f.aggregateVolume,
      steel: a.steel + f.steelWeight,
      tieWire: a.tieWire + f.tieWire,
      cost: a.cost + f.cost,
    }), { concrete: 0, cement: 0, sand: 0, agg: 0, steel: 0, tieWire: 0, cost: 0 });

    const cSum = state.columns.reduce((a, c) => ({
      concrete: a.concrete + c.concreteVolume,
      cement: a.cement,
      sand: a.sand,
      agg: a.agg,
      steel: a.steel + c.steelWeight,
      tieWire: a.tieWire + c.bindingWire,
      cost: a.cost + c.cost,
    }), { concrete: 0, cement: 0, sand: 0, agg: 0, steel: 0, tieWire: 0, cost: 0 });

    const bSum = state.beams.reduce((a, b) => ({
      concrete: a.concrete + b.concreteVolume,
      cement: a.cement,
      sand: a.sand,
      agg: a.agg,
      steel: a.steel + b.steelWeight,
      formwork: a.formwork + b.formworkArea,
      tieWire: a.tieWire + b.bindingWire,
      cost: a.cost + b.cost,
    }), { concrete: 0, cement: 0, sand: 0, agg: 0, steel: 0, formwork: 0, tieWire: 0, cost: 0 });

    const sSum = state.slabs.reduce((a, s) => ({
      concrete: a.concrete + s.concreteVolume,
      steel: a.steel + s.steelWeight,
      cost: a.cost + s.cost,
    }), { concrete: 0, steel: 0, cost: 0 });

    const stSum = state.stairs.reduce((a, s) => ({
      concrete: a.concrete + s.concreteVolume,
      steel: a.steel + s.steelWeight,
      cost: a.cost + s.cost,
    }), { concrete: 0, steel: 0, cost: 0 });

    const rwSum = state.retainingWalls.reduce((a, r) => ({
      concrete: a.concrete + r.concreteVolume,
      steel: a.steel + r.steelWeight,
      formwork: a.formwork + r.formworkArea,
      cost: a.cost + r.cost,
    }), { concrete: 0, steel: 0, formwork: 0, cost: 0 });

    const bwSum = state.brickWalls.reduce((a, b) => ({
      bricks: a.bricks + b.brickCount,
      cement: a.cement + b.cementBags,
      sand: a.sand + b.sandVolume,
      cost: a.cost + b.cost,
    }), { bricks: 0, cement: 0, sand: 0, cost: 0 });

    const totalConcrete = fSum.concrete + cSum.concrete + bSum.concrete + sSum.concrete + stSum.concrete + rwSum.concrete;
    const totalSteel = fSum.steel + cSum.steel + bSum.steel + sSum.steel + stSum.steel + rwSum.steel;
    const totalCement = fSum.cement + bwSum.cement;
    const totalSand = fSum.sand + bwSum.sand;
    const totalFormwork = bSum.formwork + rwSum.formwork;
    const totalTieWire = fSum.tieWire + cSum.tieWire + bSum.tieWire;

    const matCost = (totalConcrete * state.materialPrices.concretePerM3
      + totalCement * state.materialPrices.cementPerBag
      + totalSand * state.materialPrices.sandPerM3
      + fSum.agg * state.materialPrices.aggregatePerM3
      + totalSteel / 1000 * 0.8
      + totalTieWire * state.materialPrices.tieWirePerKg
      + totalFormwork * state.materialPrices.formworkPerM2);

    const labour = state.materialPrices.labourPerDay * Math.ceil(totalConcrete * 0.5 + totalSteel / 500);
    const equip = state.materialPrices.equipment;
    const transport = state.materialPrices.transport;
    const profit = (matCost + labour + equip + transport) * state.materialPrices.contractorProfitPercent / 100;
    const sub = matCost + labour + equip + transport + profit;
    const vat = sub * state.materialPrices.vatPercent / 100;

    return {
      totalConcreteM3: Math.round(totalConcrete * 100) / 100,
      totalCementBags: Math.round(totalCement),
      totalSandM3: Math.round(totalSand * 100) / 100,
      totalAggregateM3: Math.round(fSum.agg * 100) / 100,
      totalSteelKg: Math.round(totalSteel * 100) / 100,
      totalTieWireKg: Math.round(totalTieWire * 100) / 100,
      totalFormworkM2: Math.round(totalFormwork * 100) / 100,
      totalBricks: Math.round(bwSum.bricks),
      materialCost: Math.round(matCost * 100) / 100,
      labourCost: Math.round(labour * 100) / 100,
      equipmentCost: Math.round(equip * 100) / 100,
      transportCost: Math.round(transport * 100) / 100,
      contractorProfit: Math.round(profit * 100) / 100,
      vat: Math.round(vat * 100) / 100,
      grandTotal: Math.round((sub + vat) * 100) / 100,
    };
  }, [state]);

  const boqLines = useMemo<BOQLineItem[]>(() => {
    const lines: BOQLineItem[] = [];
    let itemNo = 0;
    const addLine = (desc: string, unit: string, qty: number, rate: number, category: string, sourceId: string) => {
      if (qty <= 0) return;
      itemNo++;
      lines.push({ itemNo, description: desc, unit, quantity: Math.round(qty * 100) / 100, rate: Math.round(rate * 100) / 100, amount: Math.round(qty * rate * 100) / 100, category, sourceId });
    };
    state.foundations.forEach(f => {
      addLine(`Excavation for ${f.label} (${f.length}m × ${f.width}m × ${f.depth}m)`, 'm³', f.length * f.width * f.depth, 8, 'Excavation', f.id);
      addLine(`Concrete in ${f.label} (${f.concreteGrade})`, 'm³', f.concreteVolume, state.materialPrices.concretePerM3, 'Concrete', f.id);
      addLine(`Reinforcement in ${f.label}`, 'kg', f.steelWeight, 0.8, 'Steel', f.id);
    });
    state.columns.forEach(c => {
      addLine(`Concrete in ${c.label} (${c.concreteGrade})`, 'm³', c.concreteVolume, state.materialPrices.concretePerM3, 'Concrete', c.id);
      addLine(`Reinforcement in ${c.label}`, 'kg', c.steelWeight, 0.8, 'Steel', c.id);
      addLine(`Formwork for ${c.label}`, 'm²', 4 * (c.width / 1000) * c.height, state.materialPrices.formworkPerM2, 'Formwork', c.id);
    });
    state.beams.forEach(b => {
      addLine(`Concrete in ${b.label} (${b.concreteGrade})`, 'm³', b.concreteVolume, state.materialPrices.concretePerM3, 'Concrete', b.id);
      addLine(`Reinforcement in ${b.label}`, 'kg', b.steelWeight, 0.8, 'Steel', b.id);
      addLine(`Formwork for ${b.label}`, 'm²', b.formworkArea, state.materialPrices.formworkPerM2, 'Formwork', b.id);
    });
    state.slabs.forEach(s => {
      addLine(`Concrete in ${s.label} (${s.concreteGrade})`, 'm³', s.concreteVolume, state.materialPrices.concretePerM3, 'Concrete', s.id);
      addLine(`Reinforcement in ${s.label}`, 'kg', s.steelWeight, 0.8, 'Steel', s.id);
    });
    state.stairs.forEach(s => {
      addLine(`Concrete in ${s.label}`, 'm³', s.concreteVolume, state.materialPrices.concretePerM3, 'Concrete', s.id);
      addLine(`Reinforcement in ${s.label}`, 'kg', s.steelWeight, 0.8, 'Steel', s.id);
    });
    state.retainingWalls.forEach(r => {
      addLine(`Concrete in ${r.label} (${r.concreteGrade})`, 'm³', r.concreteVolume, state.materialPrices.concretePerM3, 'Concrete', r.id);
      addLine(`Reinforcement in ${r.label}`, 'kg', r.steelWeight, 0.8, 'Steel', r.id);
      addLine(`Formwork for ${r.label}`, 'm²', r.formworkArea, state.materialPrices.formworkPerM2, 'Formwork', r.id);
    });
    state.brickWalls.forEach(b => {
      addLine(`Brickwork in ${b.label} (${b.brickType})`, 'Nos', b.brickCount, state.materialPrices.brickPer1000 / 1000, 'Masonry', b.id);
      addLine(`Mortar for ${b.label}`, 'm³', b.mortarVolume, state.materialPrices.sandPerM3 * 1.5 + state.materialPrices.cementPerBag * 6, 'Masonry', b.id);
    });
    return lines;
  }, [state]);

  const setSection = useCallback((s: BOQSection) => dispatch({ type: 'SET_SECTION', section: s }), []);
  const updateProjectInfo = useCallback((info: Partial<ProjectInfo>) => dispatch({ type: 'SET_PROJECT_INFO', info }), []);
  const updateMaterialPrices = useCallback((prices: Partial<MaterialPrices>) => dispatch({ type: 'SET_MATERIAL_PRICES', prices }), []);

  const addFoundation = useCallback((item?: Partial<FoundationBOQ>) => {
    const def: FoundationBOQ = { id: '', label: 'Foundation', count: 1, length: 1, width: 1, depth: 0.3, concreteGrade: 'M25', topReinf: 'T10@150', botReinf: 'T10@150', starterBars: '4T12', cover: 50, spacing: 150, concreteVolume: 0, cementBags: 0, sandVolume: 0, aggregateVolume: 0, steelWeight: 0, tieWire: 0, cost: 0, ...item };
    dispatch({ type: 'ADD_FOUNDATION', item: def });
  }, []);
  const updateFoundation = useCallback((id: string, item: Partial<FoundationBOQ>) => dispatch({ type: 'UPDATE_FOUNDATION', id, item }), []);
  const removeFoundation = useCallback((id: string) => dispatch({ type: 'REMOVE_FOUNDATION', id }), []);
  const duplicateFoundation = useCallback((id: string) => dispatch({ type: 'DUPLICATE_FOUNDATION', id }), []);

  const addColumn = useCallback((item?: Partial<ColumnBOQ>) => {
    const def: ColumnBOQ = { id: '', label: 'Column', count: 1, width: 300, depth: 300, height: 3, mainBars: '8T16', cornerBars: 4, sideBars: 4, tieDia: 8, tieSpacing: 150, concreteGrade: 'M25', concreteVolume: 0, verticalBarsWeight: 0, tieBarsWeight: 0, steelWeight: 0, bindingWire: 0, cost: 0, ...item };
    dispatch({ type: 'ADD_COLUMN', item: def });
  }, []);
  const updateColumn = useCallback((id: string, item: Partial<ColumnBOQ>) => dispatch({ type: 'UPDATE_COLUMN', id, item }), []);
  const removeColumn = useCallback((id: string) => dispatch({ type: 'REMOVE_COLUMN', id }), []);
  const duplicateColumn = useCallback((id: string) => dispatch({ type: 'DUPLICATE_COLUMN', id }), []);

  const addBeam = useCallback((item?: Partial<BeamBOQ>) => {
    const def: BeamBOQ = { id: '', label: 'Beam', count: 1, length: 4, width: 230, depth: 450, topBars: '2T12', bottomBars: '3T16', extraBars: '2T12', stirrupDia: 8, stirrupSpacing: 150, concreteGrade: 'M25', concreteVolume: 0, steelWeight: 0, formworkArea: 0, bindingWire: 0, cost: 0, ...item };
    dispatch({ type: 'ADD_BEAM', item: def });
  }, []);
  const updateBeam = useCallback((id: string, item: Partial<BeamBOQ>) => dispatch({ type: 'UPDATE_BEAM', id, item }), []);
  const removeBeam = useCallback((id: string) => dispatch({ type: 'REMOVE_BEAM', id }), []);
  const duplicateBeam = useCallback((id: string) => dispatch({ type: 'DUPLICATE_BEAM', id }), []);

  const addSlab = useCallback((item?: Partial<SlabBOQ>) => {
    const def: SlabBOQ = { id: '', label: 'Slab', count: 1, length: 5, width: 4, thickness: 150, topMesh: 'T8@200', bottomMesh: 'T10@150', distBars: 'T8@200', concreteGrade: 'M25', concreteVolume: 0, steelWeight: 0, cost: 0, ...item };
    dispatch({ type: 'ADD_SLAB', item: def });
  }, []);
  const updateSlab = useCallback((id: string, item: Partial<SlabBOQ>) => dispatch({ type: 'UPDATE_SLAB', id, item }), []);
  const removeSlab = useCallback((id: string) => dispatch({ type: 'REMOVE_SLAB', id }), []);
  const duplicateSlab = useCallback((id: string) => dispatch({ type: 'DUPLICATE_SLAB', id }), []);

  const addStair = useCallback((item?: Partial<StairBOQ>) => {
    const def: StairBOQ = { id: '', label: 'Staircase', count: 1, width: 1200, flightLength: 3, landingLength: 1.5, thickness: 150, mainBars: 'T12@150', distBars: 'T8@200', concreteGrade: 'M25', concreteVolume: 0, steelWeight: 0, cost: 0, ...item };
    dispatch({ type: 'ADD_STAIR', item: def });
  }, []);
  const updateStair = useCallback((id: string, item: Partial<StairBOQ>) => dispatch({ type: 'UPDATE_STAIR', id, item }), []);
  const removeStair = useCallback((id: string) => dispatch({ type: 'REMOVE_STAIR', id }), []);

  const addRetainingWall = useCallback((item?: Partial<RetainingWallBOQ>) => {
    const def: RetainingWallBOQ = { id: '', label: 'Retaining Wall', count: 1, length: 10, stemHeight: 3, stemThickness: 200, baseWidth: 2, baseThickness: 300, vertBars: 'T12@150', horizBars: 'T10@200', concreteGrade: 'M25', concreteVolume: 0, steelWeight: 0, formworkArea: 0, cost: 0, ...item };
    dispatch({ type: 'ADD_RETAINING_WALL', item: def });
  }, []);
  const updateRetainingWall = useCallback((id: string, item: Partial<RetainingWallBOQ>) => dispatch({ type: 'UPDATE_RETAINING_WALL', id, item }), []);
  const removeRetainingWall = useCallback((id: string) => dispatch({ type: 'REMOVE_RETAINING_WALL', id }), []);

  const addBrickWall = useCallback((item?: Partial<BrickWallBOQ>) => {
    const def: BrickWallBOQ = { id: '', label: 'Brick Wall', count: 1, length: 5, height: 3, thickness: 230, brickType: 'Standard', mortarMix: '1:6', brickCount: 0, mortarVolume: 0, cementBags: 0, sandVolume: 0, cost: 0, ...item };
    dispatch({ type: 'ADD_BRICK_WALL', item: def });
  }, []);
  const updateBrickWall = useCallback((id: string, item: Partial<BrickWallBOQ>) => dispatch({ type: 'UPDATE_BRICK_WALL', id, item }), []);
  const removeBrickWall = useCallback((id: string) => dispatch({ type: 'REMOVE_BRICK_WALL', id }), []);

  const saveProject = useCallback((name: string) => dispatch({ type: 'SAVE_PROJECT', name }), []);
  const loadProject = useCallback((id: string) => dispatch({ type: 'LOAD_PROJECT', id }), []);
  const deleteProject = useCallback((id: string) => dispatch({ type: 'DELETE_PROJECT', id }), []);
  const newProject = useCallback(() => dispatch({ type: 'NEW_PROJECT' }), []);

  const exportProject = useCallback(() => {
    return JSON.stringify({ projectInfo: state.projectInfo, foundations: state.foundations, columns: state.columns, beams: state.beams, slabs: state.slabs, stairs: state.stairs, retainingWalls: state.retainingWalls, brickWalls: state.brickWalls, materialPrices: state.materialPrices });
  }, [state]);

  const importProject = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      dispatch({ type: 'LOAD_PROJECT_STATE', state: data });
    } catch { }
  }, []);

  const value = useMemo<BOQContextValue>(() => ({
    state, dispatch, aggregate, boqLines,
    setSection, updateProjectInfo, updateMaterialPrices,
    addFoundation, updateFoundation, removeFoundation, duplicateFoundation,
    addColumn, updateColumn, removeColumn, duplicateColumn,
    addBeam, updateBeam, removeBeam, duplicateBeam,
    addSlab, updateSlab, removeSlab, duplicateSlab,
    addStair, updateStair, removeStair,
    addRetainingWall, updateRetainingWall, removeRetainingWall,
    addBrickWall, updateBrickWall, removeBrickWall,
    saveProject, loadProject, deleteProject, newProject, exportProject, importProject,
  }), [state, aggregate, boqLines, setSection, updateProjectInfo, updateMaterialPrices,
      addFoundation, updateFoundation, removeFoundation, duplicateFoundation,
      addColumn, updateColumn, removeColumn, duplicateColumn,
      addBeam, updateBeam, removeBeam, duplicateBeam,
      addSlab, updateSlab, removeSlab, duplicateSlab,
      addStair, updateStair, removeStair,
      addRetainingWall, updateRetainingWall, removeRetainingWall,
      addBrickWall, updateBrickWall, removeBrickWall,
      saveProject, loadProject, deleteProject, newProject, exportProject, importProject,
    ]);

  return <BOQContext.Provider value={value}>{children}</BOQContext.Provider>;
}

export function useBOQ(): BOQContextValue {
  const ctx = useContext(BOQContext);
  if (!ctx) throw new Error('useBOQ must be used within BOQProvider');
  return ctx;
}
