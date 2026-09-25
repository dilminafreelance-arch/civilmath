import { StructureType, BBSOutput } from '../types';
import { DesignStandard } from '../engine/types';

export type MemberCategory = 'footings' | 'columns' | 'beams' | 'slabs' | 'stairs' | 'retaining-walls' | 'foundation-mesh';

export interface IProjectMember {
  id: string;
  label: string;
  memberName: string;
  quantity: number;
  structureType: StructureType;
  category: MemberCategory;
  inputs: Record<string, any>;
  cover: number;
  concreteGrade: string;
  steelGrade: string;
  remarks: string;
  collapsed: boolean;
  order: number;
}

export interface IMemberOutput {
  memberId: string;
  label: string;
  quantity: number;
  output: BBSOutput;
  structureType: StructureType;
}

export const MEMBER_CATEGORIES: { key: MemberCategory; label: string; icon: string; types: StructureType[] }[] = [
  { key: 'footings', label: 'Footings', icon: 'Box', types: ['footing', 'combined-footing', 'strip-footing', 'raft-foundation'] },
  { key: 'columns', label: 'Columns', icon: 'Grid', types: ['column', 'pedestal'] },
  { key: 'beams', label: 'Beams', icon: 'GitCommit', types: ['beam', 'plinth-beam', 'tie-beam', 'lintel-beam'] },
  { key: 'slabs', label: 'Slabs', icon: 'Server', types: ['slab'] },
  { key: 'stairs', label: 'Staircases', icon: 'Trello', types: ['staircase'] },
  { key: 'retaining-walls', label: 'Retaining Walls', icon: 'Anchor', types: ['retaining-wall'] },
  { key: 'foundation-mesh', label: 'Foundation Mesh', icon: 'Layers', types: ['foundation-mesh'] },
];

export const STRUCTURE_TO_CATEGORY: Record<StructureType, MemberCategory> = {
  'footing': 'footings',
  'combined-footing': 'footings',
  'strip-footing': 'footings',
  'raft-foundation': 'footings',
  'beam': 'beams',
  'plinth-beam': 'beams',
  'tie-beam': 'beams',
  'lintel-beam': 'beams',
  'column': 'columns',
  'pedestal': 'columns',
  'slab': 'slabs',
  'staircase': 'stairs',
  'retaining-wall': 'retaining-walls',
  'foundation-mesh': 'foundation-mesh',
};

export interface MemberManagerProps {
  unitSystem: 'metric' | 'imperial';
  designStandard: DesignStandard;
  currency: string;
  steelPrice: number;
  concretePrice: number;
  projectName: string;
  onMembersChange?: (members: IProjectMember[]) => void;
  isPrintPreviewMode?: boolean;
}
