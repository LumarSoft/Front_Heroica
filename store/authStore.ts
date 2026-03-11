import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ROLES } from "@/lib/constants";

interface User {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  rol_id: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token: string, user: User) => {
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },
      isSuperAdmin: () => {
        const { user } = get();
        return user?.rol_id === ROLES.SUPERADMIN.id;
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      skipHydration: false,
    }
  )
);
