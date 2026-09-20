import React from 'react';

interface GenerationBannerProps {
  generation: number;
  label: string;
  yOffset: number;
}

const ROMAN_NUMERALS: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
};

export const GenerationBanner: React.FC<GenerationBannerProps> = ({ generation, label, yOffset }) => {
  const roman = ROMAN_NUMERALS[generation] || String(generation);

  return (
    <div
      className="absolute left-16 pointer-events-none flex items-center gap-3 z-0 select-none"
      style={{ top: `${yOffset}px` }}
    >
      <span className="text-[11px] uppercase tracking-widest font-serif font-bold text-zinc-400 dark:text-zinc-600 bg-white/60 dark:bg-zinc-900/60 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm whitespace-nowrap">
        Generation {roman} · {label}
      </span>
      <div className="w-96 h-px bg-gradient-to-r from-zinc-300 dark:from-zinc-800 to-transparent" />
    </div>
  );
};
