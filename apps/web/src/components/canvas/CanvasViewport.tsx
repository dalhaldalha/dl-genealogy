import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';

interface CanvasViewportProps {
  children?: React.ReactNode;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({ children }) => {
  const { translateX, translateY, scale } = useCanvasStore();

  return (
    <div
      className="will-change-transform origin-top-left absolute top-0 left-0"
      style={{
        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
        transition: 'transform 200ms cubic-bezier(0.1, 0.7, 0.1, 1)'
      }}
    >
      {children}
    </div>
  );
};
