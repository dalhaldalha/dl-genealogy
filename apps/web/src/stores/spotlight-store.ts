import { create } from 'zustand';

type SpotlightState = 'idle' | 'focusing' | 'focused' | 'editing' | 'exiting';

interface SpotlightStoreState {
  spotlightState: SpotlightState;
  focusedMemberId: string | null;
  isDrawerOpen: boolean;
}

interface SpotlightActions {
  focusMember: (id: string) => void;
  closeFocus: () => void;
  startEditing: () => void;
  stopEditing: () => void;
}

export const useSpotlightStore = create<SpotlightStoreState & SpotlightActions>((set) => ({
  spotlightState: 'idle',
  focusedMemberId: null,
  isDrawerOpen: false,

  focusMember: (id: string) => set({
    spotlightState: 'focused',
    focusedMemberId: id,
    isDrawerOpen: true,
  }),

  closeFocus: () => set({
    spotlightState: 'idle',
    focusedMemberId: null,
    isDrawerOpen: false,
  }),

  startEditing: () => set((state) => ({
    spotlightState: 'editing',
  })),

  stopEditing: () => set((state) => ({
    spotlightState: 'focused',
  })),
}));
