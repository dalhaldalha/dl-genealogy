import React from 'react';
import { Plus, Minus, Maximize } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvas-store';

export const MobileCanvasControls: React.FC = () => {
  const { scale, zoomAtPoint, resetView } = useCanvasStore();

  const handleZoomIn = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    zoomAtPoint(0.15, window.innerWidth / 2, window.innerHeight / 2);
  };

  const handleZoomOut = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    zoomAtPoint(-0.15, window.innerWidth / 2, window.innerHeight / 2);
  };

  const handleReset = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    resetView();
  };

  const zoomPercent = Math.round(scale * 100);

  return (
    <div
      className="md:hidden flex flex-col items-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl shadow-xl p-1 gap-1 select-none pointer-events-auto"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Zoom In Button */}
      <button
        type="button"
        onClick={handleZoomIn}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-200 active:bg-zinc-200 dark:active:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Zoom In"
        aria-label="Zoom In"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Current Zoom Percentage */}
      <span className="font-mono text-[10px] font-bold text-zinc-500 dark:text-zinc-400 py-0.5 px-1 min-w-[34px] text-center select-none">
        {zoomPercent}%
      </span>

      {/* Zoom Out Button */}
      <button
        type="button"
        onClick={handleZoomOut}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-200 active:bg-zinc-200 dark:active:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-6 h-px bg-zinc-200 dark:bg-zinc-800 my-0.5" />

      {/* Re-center / Fit View Button */}
      <button
        type="button"
        onClick={handleReset}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-heritage-gold active:bg-heritage-gold/20 hover:bg-heritage-gold/10 transition-colors"
        title="Reset & Center View"
        aria-label="Reset & Center View"
      >
        <Maximize className="w-4 h-4" />
      </button>
    </div>
  );
};
