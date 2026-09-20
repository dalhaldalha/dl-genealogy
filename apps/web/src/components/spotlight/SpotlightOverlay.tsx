import React from 'react';

export interface SpotlightOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpotlightOverlay({ isOpen, onClose }: SpotlightOverlayProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-40 transition-opacity"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}
