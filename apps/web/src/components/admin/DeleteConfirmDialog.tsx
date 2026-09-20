import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  memberName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  memberName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
            Remove {memberName || 'Family Member'}?
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            This will sever associated spouse and descendant links in the active view hierarchy.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md transition-colors"
          >
            Confirm Remove
          </button>
        </div>
      </div>
    </div>
  );
};
