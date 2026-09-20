import React from 'react';
import type { FamilyMember } from '@kinfolk/shared';

interface SearchResultsProps {
  results: FamilyMember[];
  query: string;
  onSelect: (id: string) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, query, onSelect }) => {
  if (results.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-full mt-1.5 glass-panel rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1.5 z-50 max-h-72 overflow-y-auto">
        <div className="p-3 text-xs text-zinc-400 text-center">
          No ancestors found matching query
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 top-full mt-1.5 glass-panel rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-1.5 z-50 max-h-72 overflow-y-auto space-y-0.5">
      {results.map((m) => (
        <div
          key={m.id}
          onClick={() => onSelect(m.id)}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
        >
          <img
            src={m.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=260'}
            alt={`${m.firstName} ${m.lastName}`}
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate">
              {m.firstName} {m.lastName}
            </div>
            <div className="text-[10px] text-zinc-400 truncate">
              {m.profession || 'Family Member'} {m.residence ? `· ${m.residence}` : ''}
            </div>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shrink-0">
            Gen {m.generation}
          </span>
        </div>
      ))}
    </div>
  );
};
