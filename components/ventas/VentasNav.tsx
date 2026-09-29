'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, ListOrdered, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/ventas', label: 'Panel', icon: BarChart3, permiso: 'ver' },
  { href: '/ventas/operaciones', label: 'Operaciones', icon: ListOrdered, permiso: 'ver' },
  { href: '/ventas/integraciones', label: 'Integraciones', icon: RefreshCw, permiso: 'integraciones' },
] as const

export function VentasNav() {
  const pathname = usePathname()
  const canVer = useAuthStore(state => state.canVerVentas())
  const canIntegraciones = useAuthStore(state => state.canSincronizarVentas() || state.canConfigurarVentas())

  const visibles = TABS.filter(t => (t.permiso === 'ver' ? canVer : canIntegraciones))

  return (
    <nav className="flex gap-1 p-1 rounded-xl bg-white border border-[#E6EDF9] w-fit max-w-full overflow-x-auto">
      {visibles.map(({ href, label, icon: Icon }) => {
        const activo = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap',
              activo ? 'bg-[#002868] text-white' : 'text-[#5A6B8C] hover:bg-[#EEF3FF] hover:text-[#002868]',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
