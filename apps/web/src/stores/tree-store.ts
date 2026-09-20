import { create } from 'zustand';
import type { FamilyMember, ParentChild, Union } from '@kinfolk/shared';

export interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TreeState {
  members: FamilyMember[];
  parentChildEdges: ParentChild[];
  unions: Union[];
  activeBranchFilter: 'all' | 'paternal' | 'maternal';
  nodePositions: Map<string, NodePosition>;
}

interface TreeActions {
  setTreeData: (data: { members: FamilyMember[]; parentChildEdges: ParentChild[]; unions: Union[] }) => void;
  setBranchFilter: (filter: 'all' | 'paternal' | 'maternal') => void;
  setNodePositions: (positions: Map<string, NodePosition>) => void;
}

export const useTreeStore = create<TreeState & TreeActions>((set) => ({
  members: [],
  parentChildEdges: [],
  unions: [],
  activeBranchFilter: 'all',
  nodePositions: new Map(),

  setTreeData: (data) => set({
    members: data.members,
    parentChildEdges: data.parentChildEdges,
    unions: data.unions
  }),
  
  setBranchFilter: (filter) => set({ activeBranchFilter: filter }),
  
  setNodePositions: (positions) => set({ nodePositions: positions }),
}));
