'use client'

import { ModuleGuard } from '@/components/ModuleGuard'
import { MODULOS } from '@/lib/constants'

export default function RecursosHumanosLayout({ children }: { children: React.ReactNode }) {
  return <ModuleGuard modulo={MODULOS.RECURSOS_HUMANOS}>{children}</ModuleGuard>
}
