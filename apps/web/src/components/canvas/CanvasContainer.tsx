import React, { useRef } from 'react';
import { useCanvasGestures } from '@/hooks/useCanvasGestures';
import { CanvasViewport } from './CanvasViewport';

interface CanvasContainerProps {
  children?: React.ReactNode;
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useCanvasGestures(containerRef);

  return (
    <div
      ref={containerRef}
      className="canvas-dot-grid w-full h-full overflow-hidden cursor-grab active:cursor-grabbing relative select-none"
      style={{ touchAction: 'none' }}
    >
      <CanvasViewport>{children}</CanvasViewport>
    </div>
  );
};
