import React from 'react';

interface BranchFilterProps {
  activeBranch: 'all' | 'paternal' | 'maternal';
  onFilterChange: (branch: 'all' | 'paternal' | 'maternal') => void;
}

export const BranchFilter: React.FC<BranchFilterProps> = ({ activeBranch, onFilterChange }) => {
  const branches = [
    { id: 'all', label: 'All Branches' },
    { id: 'paternal', label: 'Paternal' },
    { id: 'maternal', label: 'Maternal' },
  ] as const;

  return (
    <div className="hidden lg:flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium shrink-0">
      {branches.map((b) => {
        const isActive = activeBranch === b.id;
        return (
          <button
            key={b.id}
            onClick={() => onFilterChange(b.id)}
            className={`branch-filter-btn px-3 py-1 rounded-lg transition-all ${
              isActive
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
};
