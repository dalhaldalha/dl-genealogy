import React from 'react';
import { AgeInfo } from '@kinfolk/shared';

export interface AgePillProps {
  ageInfo: AgeInfo;
}

export function AgePill({ ageInfo }: AgePillProps) {
  if (!ageInfo.isLiving) {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/50 whitespace-nowrap">
        {ageInfo.text}
      </span>
    );
  }

  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 whitespace-nowrap">
      {ageInfo.text}
    </span>
  );
}
