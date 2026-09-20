import React from 'react';
import { Eye, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export const RoleSwitcher: React.FC = () => {
  const { role, setRole, isAdminToggleVisible, setIsAdminModalOpen } = useAuthStore();

  return (
    <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 text-xs">
      <button
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
          role === 'viewer'
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
        }`}
        onClick={() => setRole('viewer')}
        title="Viewer Mode"
      >
        <Eye className="w-3.5 h-3.5 text-zinc-400" />
        <span>Viewer</span>
      </button>
      
      {(isAdminToggleVisible || role === 'admin') && (
        <button
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
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
          <span>Admin</span>
        </button>
      )}
    </div>
  );
};
