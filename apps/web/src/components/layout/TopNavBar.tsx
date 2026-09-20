import React, { useState } from 'react';
import { Search, Minus, Plus, Maximize, Moon, Sun, Eye, Shield, X } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvas-store';
import { useAuthStore } from '@/stores/auth-store';
import { SearchBar } from '@/components/search/SearchBar';
import { BranchFilter } from '@/components/filters/BranchFilter';
import type { FamilyMember } from '@kinfolk/shared';

interface TopNavBarProps {
  treeTitle?: string;
  treeSubtitle?: string;
  recordCount?: number;
  members: FamilyMember[];
  activeBranch: 'all' | 'paternal' | 'maternal';
  onFilterChange: (branch: 'all' | 'paternal' | 'maternal') => void;
  onSelectMember: (id: string) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  treeTitle = 'DL-GENEALOGY',
  recordCount = 14,
  members,
  activeBranch,
  onFilterChange,
  onSelectMember,
}) => {
  const { scale, zoomAtPoint, resetView } = useCanvasStore();
  const { role, setRole, theme, toggleTheme, isAdminToggleVisible, setIsAdminModalOpen } = useAuthStore();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleZoomIn = () => {
    zoomAtPoint(0.15, window.innerWidth / 2, window.innerHeight / 2);
  };

  const handleZoomOut = () => {
    zoomAtPoint(-0.15, window.innerWidth / 2, window.innerHeight / 2);
  };

  const zoomPercent = Math.round(scale * 100);

  return (
    <header className="relative z-30 flex flex-col border-b border-zinc-200/80 dark:border-zinc-800/80 glass-panel shadow-sm shrink-0">
      <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3.5 gap-2 sm:gap-4">
        {/* Brand & Family Crest */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-heritage-gold to-amber-200 p-[1px] shadow-sm flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full bg-zinc-900 rounded-[9px] sm:rounded-[11px] flex items-center justify-center text-heritage-gold font-serif font-bold text-xs sm:text-sm tracking-wider">
              DL
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif tracking-wider font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-50">
                {treeTitle}
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Archive Est. 1892
              </span>
            </div>
            <p className="hidden md:block text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Heritage Lineage · 4 Generations · {recordCount} Records
            </p>
          </div>
        </div>

        {/* Center Search & Generation Filters (Desktop) */}
        <div className="hidden md:flex items-center gap-3 max-w-xl w-full mx-4">
          <SearchBar members={members} onSelect={onSelectMember} />
          <BranchFilter activeBranch={activeBranch} onFilterChange={onFilterChange} />
        </div>

        {/* Controls & Admin Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile Search Toggle */}
          <button
            className={`p-1.5 sm:p-2 rounded-xl border transition-all md:hidden ${
              isMobileSearchOpen
                ? 'bg-heritage-gold/20 text-heritage-gold border-heritage-gold/40'
                : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300'
            }`}
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            title="Search Ancestors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Mobile Re-center Canvas View */}
          <button
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 transition-all md:hidden"
            onClick={resetView}
            title="Center Tree View"
          >
            <Maximize className="w-4 h-4" />
          </button>

          {/* Canvas View Controls (Desktop only) */}
          <div className="hidden md:flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 text-xs">
            <button
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all"
              onClick={handleZoomOut}
              title="Zoom Out (Ctrl -)"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 min-w-[42px] text-center">
              {zoomPercent}%
            </span>
            <button
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all"
              onClick={handleZoomIn}
              title="Zoom In (Ctrl +)"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
            <button
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all"
              onClick={resetView}
              title="Fit Tree To Center"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            className="p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 transition-all"
            onClick={toggleTheme}
            title="Toggle Color Theme"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Role Switcher (Viewer vs Admin) */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-0.5 sm:p-1 text-xs">
            <button
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all ${
                role === 'viewer'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              onClick={() => setRole('viewer')}
              title="Viewer Mode"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[11px] sm:text-xs">Viewer</span>
            </button>
            
            {(isAdminToggleVisible || role === 'admin') && (
              <button
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all animate-fadeIn ${
                  role === 'admin'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                onClick={() => {
                  if (role !== 'admin') {
                    setIsAdminModalOpen(true);
                  }
                }}
                title="Admin Mode"
              >
                <Shield className="w-3.5 h-3.5 text-heritage-gold" />
                <span className="text-[11px] sm:text-xs">Admin</span>
              </button>
            )}
          </div>

          {/* User Profile Avatar (Desktop/Tablet) */}
          <div className="hidden sm:block relative pl-1">
            <button className="flex items-center gap-2 focus:outline-none" title="Curator Profile">
              <img
                alt="Curator Profile"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-heritage-gold/50 shadow-sm"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=260"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Search & Filter Tray */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-3.5 pb-3 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-2.5 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar
                members={members}
                onSelect={(id) => {
                  onSelectMember(id);
                  setIsMobileSearchOpen(false);
                }}
              />
            </div>
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-100 shrink-0"
              title="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Branch Filter Selector */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-xs">
            {(['all', 'paternal', 'maternal'] as const).map((branchId) => {
              const labels: Record<string, string> = { all: 'All Branches', paternal: 'Paternal', maternal: 'Maternal' };
              const isActive = activeBranch === branchId;
              return (
                <button
                  key={branchId}
                  onClick={() => onFilterChange(branchId)}
                  className={`flex-1 py-1 text-center rounded-lg text-xs transition-all ${
                    isActive
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {labels[branchId]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
