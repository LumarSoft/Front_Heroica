'use client'

import { ModuleGuard } from '@/components/ModuleGuard'
import { MODULOS } from '@/lib/constants'

export default function VentasLayout({ children }: { children: React.ReactNode }) {
  return <ModuleGuard modulo={MODULOS.VENTAS}>{children}</ModuleGuard>
}
