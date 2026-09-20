import React, { useMemo } from 'react';

interface CanvasState {
  translateX: number;
  translateY: number;
  scale: number;
}

interface ContainerSize {
  width: number;
  height: number;
}

interface MemberPosition {
  id: string;
  x: number;
  y: number;
}

interface RadarMiniMapProps {
  members: MemberPosition[];
  canvasState: CanvasState;
  containerSize: ContainerSize;
  spotlightId: string | null;
}

export const RadarMiniMap: React.FC<RadarMiniMapProps> = ({
  members,
  canvasState,
  containerSize,
  spotlightId,
}) => {
  // World bounds from prototype: 4200 x 3200 or dynamic with padding
  const bounds = useMemo(() => {
    const defaultWorldW = 2400;
    const defaultWorldH = 2000;
    if (members.length === 0) {
      return { worldW: defaultWorldW, worldH: defaultWorldH };
    }
    const maxX = Math.max(...members.map((m) => m.x + 270), defaultWorldW);
    const maxY = Math.max(...members.map((m) => m.y + 160), defaultWorldH);
    return {
      worldW: Math.max(maxX, 2400),
      worldH: Math.max(maxY, 2000),
    };
  }, [members]);

  // Mini map dimensions (inner container)
  const mapW = 172; // w-48 minus padding
  const mapH = 112; // h-28 = 112px

  const { worldW, worldH } = bounds;
  const { translateX, translateY, scale } = canvasState;

  // Viewport window calculation matching prototype
  const winW = (containerSize.width / (worldW * scale)) * mapW;
  const winH = (containerSize.height / (worldH * scale)) * mapH;
  const winX = (-translateX / (worldW * scale)) * mapW;
  const winY = (-translateY / (worldH * scale)) * mapH;

  const boundedWinW = Math.min(winW, mapW);
  const boundedWinH = Math.min(winH, mapH);
  const boundedWinX = Math.max(0, Math.min(winX, mapW - boundedWinW));
  const boundedWinY = Math.max(0, Math.min(winY, mapH - boundedWinH));

  return (
    <div className="glass-panel p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl w-48 transition-all select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
          Radar Navigation
        </span>
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      </div>

      <div
        className="relative w-full h-28 bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800"
        id="miniMap"
      >
        {/* Mini-map dots */}
        <div className="absolute inset-0">
          {members.map((member) => {
            const dotX = (member.x / worldW) * mapW;
            const dotY = (member.y / worldH) * mapH;
            const isSpotlight = spotlightId === member.id;

            return (
              <div
                key={member.id}
                className={`absolute rounded-full transition-all duration-300 ${
                  isSpotlight
                    ? 'w-2 h-2 bg-heritage-gold z-10 -ml-0.5 -mt-0.5 shadow-sm'
                    : 'w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-600'
                }`}
                style={{
                  left: `${dotX}px`,
                  top: `${dotY}px`,
                }}
              />
            );
          })}
        </div>

        {/* Viewport indicator window */}
        <div
          className="absolute border-2 border-heritage-gold bg-heritage-gold/20 rounded pointer-events-none transition-all duration-75"
          style={{
            left: `${boundedWinX}px`,
            top: `${boundedWinY}px`,
            width: `${boundedWinW}px`,
            height: `${boundedWinH}px`,
          }}
        />
      </div>
    </div>
  );
};
