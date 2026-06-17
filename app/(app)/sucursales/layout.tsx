'use client'

import { ModuleGuard } from '@/components/ModuleGuard'
import { MODULOS } from '@/lib/constants'

export default function SucursalesLayout({ children }: { children: React.ReactNode }) {
  return <ModuleGuard modulo={MODULOS.TESORERIA}>{children}</ModuleGuard>
}
