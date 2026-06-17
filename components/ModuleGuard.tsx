'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { MODULOS } from '@/lib/constants'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'

/** Destino por defecto de cada módulo (para redirigir a uno accesible). */
const MODULO_HOME: Record<string, string> = {
  [MODULOS.TESORERIA]: '/sucursales',
  [MODULOS.RECURSOS_HUMANOS]: '/recursos-humanos',
}

/**
 * Protege un subárbol por acceso a módulo (capa independiente del rol).
 * Si el usuario no tiene acceso, lo redirige a un módulo que sí pueda usar
 * (o a la home si no tiene ninguno). El superadmin siempre pasa.
 *
 * Defensa en profundidad: la API también valida con requireModule().
 */
export function ModuleGuard({ modulo, children }: { modulo: string; children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore(state => state.user)
  const canAccessModulo = useAuthStore(state => state.canAccessModulo)

  const allowed = canAccessModulo(modulo)

  useEffect(() => {
    if (!user) return
    if (allowed) return

    // Redirigir al primer módulo accesible, si existe
    const fallback = (user.modulos ?? []).map(m => MODULO_HOME[m]).find(Boolean)
    router.replace(fallback ?? '/configuracion')
  }, [user, allowed, router])

  if (!allowed) return <PageLoadingSpinner />

  return <>{children}</>
}
