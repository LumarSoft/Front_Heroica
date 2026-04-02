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
      /**
       * Almacenamiento del token en localStorage.
       * Riesgo XSS: si un atacante inyecta script, podría leer el token.
       * Mitigaciones: (1) Sanitizar toda entrada de usuario; (2) CSP restrictivo;
       * (3) Evitar dangerouslySetInnerHTML; (4) Evaluar migrar a cookies httpOnly
       * gestionadas por el servidor para mayor seguridad.
       */
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
