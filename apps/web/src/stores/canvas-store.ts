import { create } from 'zustand';

interface CanvasState {
  translateX: number;
  translateY: number;
  scale: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
}

interface CanvasActions {
  zoomAtPoint: (delta: number, cursorX: number, cursorY: number) => void;
  panTo: (dx: number, dy: number) => void;
  centerOnNode: (
    nodeX: number,
    nodeY: number,
    nodeW: number,
    nodeH: number,
    viewportW: number,
    viewportH: number,
    drawerWidth: number
  ) => void;
  setDragging: (val: boolean) => void;
  setDragStart: (x: number, y: number) => void;
  resetView: () => void;
}

export const useCanvasStore = create<CanvasState & CanvasActions>((set, get) => ({
  translateX: 80,
  translateY: 20,
  scale: 0.85,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,

  zoomAtPoint: (delta: number, cursorX: number, cursorY: number) => {
    const { scale, translateX, translateY } = get();
    const newScale = Math.min(Math.max(0.3, scale + delta), 2.0);
    
    // Cursor-anchored zoom formula
    const newTranslateX = cursorX - (cursorX - translateX) * (newScale / scale);
    const newTranslateY = cursorY - (cursorY - translateY) * (newScale / scale);

    set({ scale: newScale, translateX: newTranslateX, translateY: newTranslateY });
  },

  panTo: (dx: number, dy: number) => {
    set((state) => ({
      translateX: state.translateX + dx,
      translateY: state.translateY + dy,
    }));
  },

  centerOnNode: (
    nodeX: number,
    nodeY: number,
    nodeW: number,
    nodeH: number,
    viewportW: number,
    viewportH: number,
    drawerWidth: number
  ) => {
    const targetScale = 1.05;
    // Center node in the available space (viewport minus drawer)
    const targetX = (viewportW - drawerWidth) / 2 - (nodeX + nodeW / 2) * targetScale;
    const targetY = viewportH / 2 - (nodeY + nodeH / 2) * targetScale;
    
    set({ translateX: targetX, translateY: targetY, scale: targetScale });
  },

  setDragging: (val: boolean) => set({ isDragging: val }),
  
  setDragStart: (x: number, y: number) => set({ dragStartX: x, dragStartY: y }),

  resetView: () => set({ translateX: 80, translateY: 20, scale: 0.85 }),
}));
