import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '', ...props }: GlassCardProps) {
  return (
    <div 
      className={`bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-2xl shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
