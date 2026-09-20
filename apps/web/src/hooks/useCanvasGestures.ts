import { useGesture } from '@use-gesture/react';
import { useCanvasStore } from '@/stores/canvas-store';
import React from 'react';

export function useCanvasGestures(containerRef: React.RefObject<HTMLDivElement | null>) {
  const { zoomAtPoint, panTo, setDragging } = useCanvasStore();

  useGesture(
    {
      onDragStart: () => {
        setDragging(true);
      },
      onDragEnd: () => {
        setDragging(false);
      },
      onDrag: ({ delta: [dx, dy] }) => {
        if (dx !== 0 || dy !== 0) {
          panTo(dx, dy);
        }
      },
      onWheel: ({ event, delta: [, dy] }) => {
        event.preventDefault();
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const cursorX = event.clientX - rect.left;
        const cursorY = event.clientY - rect.top;

        // Smooth zoom factor
        const zoomDelta = -dy * 0.0015;
        zoomAtPoint(zoomDelta, cursorX, cursorY);
      },
      onPinch: ({ event, delta: [d], origin: [ox, oy] }) => {
        event.preventDefault();
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const cursorX = ox - rect.left;
        const cursorY = oy - rect.top;
        zoomAtPoint(d * 0.01, cursorX, cursorY);
      },
    },
    {
      target: containerRef,
      eventOptions: { passive: false },
      drag: { filterTaps: true },
      wheel: { eventOptions: { passive: false } },
      pinch: { eventOptions: { passive: false } },
    }
  );
}
