import React from 'react';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function GlassPanel({ children, className = '', ...props }: GlassPanelProps) {
  return (
    <div 
      className={`bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
