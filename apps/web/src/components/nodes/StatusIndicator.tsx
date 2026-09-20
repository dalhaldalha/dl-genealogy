import React from 'react';

export interface StatusIndicatorProps {
  isDeceased: boolean;
}

export function StatusIndicator({ isDeceased }: StatusIndicatorProps) {
  if (isDeceased) {
    return (
      <div
        className="w-3.5 h-3.5 rounded-full bg-zinc-400 dark:bg-zinc-500 border-2 border-white dark:border-zinc-950 shadow-sm"
        title="Deceased"
      />
    );
  }

  return (
    <div
      className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
      title="Living"
    />
  );
}
