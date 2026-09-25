import { UnitSystem } from '../types';
import { DesignStandard } from './engine/types';

// ============================================================
// Structure Types
// ============================================================

export type StructureType =
  | 'footing'
  | 'combined-footing'
  | 'strip-footing'
  | 'raft-foundation'
  | 'beam'
  | 'plinth-beam'
  | 'tie-beam'
  | 'lintel-beam'
  | 'column'
  | 'pedestal'
  | 'slab'
  | 'staircase'
  | 'retaining-wall'
  | 'foundation-mesh';

export type FootingSubType =
  | 'isolated-square'
  | 'rectangular'
  | 'circular'
  | 'stepped'
  | 'sloped'
  | 'combined'
  | 'strap'
  | 'continuous'
  | 'strip'
  | 'wall'
  | 'raft'
  | 'mat'
  | 'pile-cap'
  | 'pedestal-footing';

export type ColumnSubType =
  | 'square'
  | 'rectangular'
  | 'circular'
  | 'polygon'
  | 'short'
  | 'long'
  | 'with-starter'
  | 'with-splice'
  | 'pedestal-column';

export type TieArrangement =
  | 'single'
  | 'double'
  | 'cross'
  | 'diamond'
  | 'spiral'
  | 'variable';

export type BeamSubType =
  | 'rectangular-beam'
  | 't-beam'
  | 'l-beam'
  | 'inverted-beam'
  | 'plinth-beam'
  | 'tie-beam'
  | 'ground-beam'
  | 'lintel-beam'
  | 'transfer-beam'
  | 'deep-beam';

export type SlabSubType =
  | 'one-way'
  | 'two-way'
  | 'flat'
  | 'drop-panel'
  | 'cantilever'
  | 'waffle'
  | 'ribbed';

export type StairSubType =
  | 'waist-slab'
  | 'dog-leg'
  | 'open-well'
  | 'quarter-turn'
  | 'half-turn'
  | 'spiral'
  | 'cantilever-stair';

export type RetainingWallSubType =
  | 'cantilever-wall'
  | 'counterfort-wall'
  | 'buttressed-wall'
  | 'gravity-wall';

export type FoundationMeshSubType =
  | 'single-layer'
  | 'double-layer'
  | 'variable-spacing'
  | 'different-dia'
  | 'openings'
  | 'edge-reinf';

export type LayerPosition = 'top' | 'bottom' | 'left' | 'right' | 'inner' | 'outer';

export interface ReinfLayer {
  position: LayerPosition;
  dia: number;
  count: number;
  spacing: number;
  isMain: boolean;
  cover: number;
}

// ============================================================
// Core Interfaces
// ============================================================

export interface StructureDef {
  id: StructureType;
  label: string;
  icon: string;
  description: string;
}

export interface BBSRebarItem {
  mark: string;
  description: string;
  dia: number;
  shapeCode: string;
  dims: { a: number; b: number; c: number; d: number; e: number };
  numMembers: number;
  barsPerMember: number;
  totalBars: number;
  cuttingLength: number;
  totalLength: number;
  unitWeight: number;
  totalWeight: number;
  /** Formula steps for this bar */
  formulaSteps?: string[];
}

export interface BBSOutput {
  rebarList: BBSRebarItem[];
  concreteVolume: number;
  totalSteelWeight: number;
  steelWeightByDia: Record<string, number>;
}

export interface ProjectInfo {
  projectName: string;
  drawingNumber: string;
  engineer: string;
  client: string;
  revision: string;
  date: string;
  steelGrade: string;
  concreteGrade: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export interface CalcHistoryEntry {
  timestamp: number;
  totalSteel: number;
  concreteVol: number;
  totalCost: number;
  structureType: StructureType;
}

export interface ExportHandlers {
  handleExportPDF: () => void;
  handleExportExcel: () => void;
  handleExportCSV: () => void;
  handlePrint: () => void;
}

// ============================================================
// Structure Definitions
// ============================================================

export const STRUCTURES: StructureDef[] = [
  { id: 'footing', label: 'Footing', icon: 'Box', description: 'Isolated pad footing reinforcement' },
  { id: 'combined-footing', label: 'Combined Footing', icon: 'Box', description: 'Combined column footing reinforcement' },
  { id: 'strip-footing', label: 'Strip Footing', icon: 'Box', description: 'Continuous strip footing under walls' },
  { id: 'raft-foundation', label: 'Raft Foundation', icon: 'Box', description: 'Heavy raft / mat foundation' },
  { id: 'beam', label: 'Beam', icon: 'GitCommit', description: 'Structural beam with stirrups' },
  { id: 'plinth-beam', label: 'Plinth Beam', icon: 'GitCommit', description: 'Plinth beam at ground level' },
  { id: 'tie-beam', label: 'Tie Beam', icon: 'GitCommit', description: 'Tie beam connecting foundations' },
  { id: 'lintel-beam', label: 'Lintel Beam', icon: 'GitCommit', description: 'Lintel beam over openings' },
  { id: 'column', label: 'Column', icon: 'Grid', description: 'Reinforced concrete column' },
  { id: 'pedestal', label: 'Pedestal', icon: 'Grid', description: 'Column pedestal with starter bars' },
  { id: 'slab', label: 'Slab', icon: 'Server', description: 'One-way / two-way slab' },
  { id: 'staircase', label: 'Staircase', icon: 'Trello', description: 'Waist slab staircase' },
  { id: 'retaining-wall', label: 'Retaining Wall', icon: 'Anchor', description: 'Cantilever retaining wall' },
  { id: 'foundation-mesh', label: 'Foundation Mesh', icon: 'Layers', description: 'Foundation mesh reinforcement' },
];

export const STRUCTURE_TO_CALCULATOR_ID: Record<StructureType, string> = {
  'footing': 'bbs-footing',
  'combined-footing': 'bbs-combined-footing',
  'strip-footing': 'bbs-strip-footing',
  'raft-foundation': 'bbs-raft-foundation',
  'beam': 'bbs-beam',
  'plinth-beam': 'bbs-plinth-beam',
  'tie-beam': 'bbs-tie-beam',
  'lintel-beam': 'bbs-lintel-beam',
  'column': 'bbs-column',
  'pedestal': 'bbs-pedestal',
  'slab': 'bbs-slab',
  'staircase': 'bbs-stair',
  'retaining-wall': 'bbs-retaining-wall',
  'foundation-mesh': 'bbs-foundation',
};
