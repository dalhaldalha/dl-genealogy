import { create } from 'zustand';

type Role = 'viewer' | 'admin';
type Theme = 'dark' | 'light';

interface AuthState {
  role: Role;
  theme: Theme;
  isAdminToggleVisible: boolean;
  isAdminModalOpen: boolean;
}

interface AuthActions {
  setRole: (role: Role) => void;
  toggleTheme: () => void;
  setIsAdminToggleVisible: (visible: boolean) => void;
  setIsAdminModalOpen: (open: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  role: 'viewer',
  theme: 'dark',
  isAdminToggleVisible: false,
  isAdminModalOpen: false,

  setRole: (role: Role) => set({ role }),
  setIsAdminToggleVisible: (visible: boolean) => set({ isAdminToggleVisible: visible }),
  setIsAdminModalOpen: (open: boolean) => set({ isAdminModalOpen: open }),
  
  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    set({ theme: newTheme });
  },
}));
