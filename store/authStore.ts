import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ROLES } from '@/lib/constants'

interface User {
  id: number
  email: string
  nombre: string
  rol: string
  rol_id: number
  must_change_password?: boolean
  permisos?: string[]
  two_factor_enabled?: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  isSuperAdmin: () => boolean
  hasPermiso: (clave: string) => boolean
  canVerConfiguracion: () => boolean
  canGestionarUsuarios: () => boolean
  canGestionarRoles: () => boolean
  canVerMovimientos: () => boolean
  canCrearMovimientos: () => boolean
  canEditarMovimientos: () => boolean
  canEliminarMovimientos: () => boolean
  canComentarMovimientos: () => boolean
  canAprobarMovimientos: () => boolean
  canVerPendientes: () => boolean
  canCargarPendientes: () => boolean
  canAprobarPendientes: () => boolean
  canVerReportes: () => boolean
  canVerSucursales: () => boolean
  canGestionarSucursales: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token: string, user: User) => {
        set({ token, user, isAuthenticated: true })
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      },

      // Superadmin siempre tiene acceso total (bypass de permisos)
      isSuperAdmin: () => {
        const { user } = get()
        return Number(user?.rol_id) === ROLES.SUPERADMIN.id
      },

      // Verifica un permiso específico. Superadmin siempre retorna true.
      hasPermiso: (clave: string) => {
        const { user } = get()
        if (!user) return false
        if (Number(user.rol_id) === ROLES.SUPERADMIN.id) return true
        return user.permisos?.includes(clave) ?? false
      },

      canVerConfiguracion: () => get().hasPermiso('ver_configuracion'),
      canGestionarUsuarios: () => get().hasPermiso('gestionar_usuarios'),
      canGestionarRoles: () => get().hasPermiso('gestionar_roles'),
      canVerMovimientos: () => get().hasPermiso('ver_movimientos'),
      canCrearMovimientos: () => get().hasPermiso('crear_movimientos'),
      canEditarMovimientos: () => get().hasPermiso('editar_movimientos'),
      canEliminarMovimientos: () => get().hasPermiso('eliminar_movimientos'),
      canComentarMovimientos: () => get().hasPermiso('agregar_comentarios'),
      canAprobarMovimientos: () => get().hasPermiso('aprobar_movimientos'),
      canVerPendientes: () => get().hasPermiso('ver_pendientes'),
      canCargarPendientes: () => get().hasPermiso('cargar_pendientes'),
      canAprobarPendientes: () => get().hasPermiso('aprobar_pendientes'),
      canVerReportes: () => get().hasPermiso('ver_reportes'),
      canVerSucursales: () => get().hasPermiso('ver_sucursales'),
      canGestionarSucursales: () => get().hasPermiso('gestionar_sucursales'),
    }),
    {
      name: 'auth-storage',
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
)
