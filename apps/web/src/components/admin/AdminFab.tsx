import React from 'react';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface AdminFabProps {
  onClick: () => void;
}

export const AdminFab: React.FC<AdminFabProps> = ({ onClick }) => {
  const { role } = useAuthStore();

  if (role !== 'admin') return null;

  return (
    <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-20 flex flex-col items-end gap-3" id="adminFabContainer">
      <button
        onClick={onClick}
        className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-full bg-gradient-to-r from-heritage-gold to-amber-600 hover:from-amber-600 hover:to-heritage-gold text-zinc-950 font-semibold shadow-xl hover:shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm"
      >
        <UserPlus className="w-4 h-4" />
        <span className="hidden sm:inline">Add Family Member</span>
        <span className="sm:hidden">Add</span>
      </button>
    </div>
  );
};
