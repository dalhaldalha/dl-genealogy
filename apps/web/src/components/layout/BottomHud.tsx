import React from 'react';
import { Heart, Users } from 'lucide-react';
import { MobileCanvasControls } from '@/components/canvas/MobileCanvasControls';

interface BottomHudProps {
  miniMap?: React.ReactNode;
  adminFab?: React.ReactNode;
  onKinshipClick?: () => void;
}

export const BottomHud: React.FC<BottomHudProps> = ({ miniMap, adminFab, onKinshipClick }) => {
  return (
    <>
      {/* Bottom-Left: Mini Map Navigator */}
      <div className="absolute bottom-6 left-6 z-20 hidden md:block pointer-events-auto">
        {miniMap}
      </div>

      {/* Floating Canvas Controls on Mobile (Zoom In, Out, Center) */}
      <div className="absolute bottom-16 right-3 sm:bottom-20 sm:right-6 z-20 pointer-events-auto">
        <MobileCanvasControls />
      </div>

      {/* Bottom-Center: Legend & Stats Banner */}
      <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-1/2 sm:-translate-x-1/2 z-20 pointer-events-auto max-w-[calc(100vw-6.5rem)] sm:max-w-[calc(100vw-1.5rem)]">
        <div className="glass-panel px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-zinc-200/80 dark:border-zinc-800 shadow-lg flex items-center gap-1.5 sm:gap-4 text-[10px] sm:text-xs whitespace-nowrap overflow-x-auto">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-zinc-600 dark:text-zinc-300">Living</span>
          </div>
          <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700" />
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
            <span className="text-zinc-600 dark:text-zinc-300">Deceased</span>
          </div>
          <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700" />
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20 shrink-0" />
            <span className="text-zinc-600 dark:text-zinc-300">Marriage</span>
          </div>
          <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
          <span className="text-zinc-400 text-[11px] hidden sm:inline">Tap card to Spotlight • Drag to Pan</span>
          
          {onKinshipClick && (
            <>
              <div className="w-px h-3 bg-zinc-300 dark:bg-zinc-700 hidden sm:block" />
              <button
                onClick={onKinshipClick}
                className="flex items-center gap-1.5 text-heritage-gold hover:text-amber-500 transition-colors font-medium hover:bg-heritage-gold/10 px-2 py-0.5 rounded-md"
              >
                <Users className="w-3.5 h-3.5" />
                <span>How Are We Related?</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom-Right: Admin Quick Action FAB */}
      <div className="pointer-events-auto">
        {adminFab}
      </div>
    </>
  );
};
