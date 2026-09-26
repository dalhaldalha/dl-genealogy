import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, X, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export const AdminLoginModal: React.FC = () => {
  const { isAdminModalOpen, setIsAdminModalOpen, setRole } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdminModalOpen) {
      setUsername('');
      setPassword('');
      setError(null);
      setShowPassword(false);
      // Focus after mount animation
      setTimeout(() => {
        usernameInputRef.current?.focus();
      }, 100);
    }
  }, [isAdminModalOpen]);

  if (!isAdminModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Default curator credentials
    const isUserValid = cleanUser === 'admin';
    const isPassValid = 
      cleanPass === 'password' || 
      cleanPass === 'admin' || 
      cleanPass === 'admin123' || 
      cleanPass === 'dlgenealogy' ||
      cleanPass === 'dl-genealogy' ||
      cleanPass === 'vance1892';

    if (isUserValid && isPassValid) {
      setRole('admin');
      setIsAdminModalOpen(false);
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  const handleClose = () => {
    setIsAdminModalOpen(false);
    setError(null);
  };

  return (
    <div 
      className="fixed inset-0 z-[70] bg-zinc-950/75 backdrop-blur-md flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="glass-panel w-full max-w-sm rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xl p-5 sm:p-6 relative space-y-4 max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-heritage-gold/10 text-heritage-gold border border-heritage-gold/25 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100 tracking-wide">
            DL-Genealogy Authentication
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
            Provide DL-Genealogy archive credentials to unlock administrative editing privileges.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={usernameInputRef}
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter username (admin)"
                required
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-heritage-gold/50 focus:border-heritage-gold transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter password (password)"
                required
                className="w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-heritage-gold/50 focus:border-heritage-gold transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="pt-1 text-[11px] text-zinc-500 text-center">
            Hint: <span className="font-mono text-zinc-400">admin</span> / <span className="font-mono text-zinc-400">password</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-heritage-gold hover:bg-heritage-goldHover text-zinc-950 text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Unlock Admin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
