import { ShoppingBag } from 'lucide-react'
import { VentasNav } from './VentasNav'

interface VentasPageHeaderProps {
  title: string
  subtitle: string
  /** Acciones a la derecha del título (exportar, sincronizar…). */
  children?: React.ReactNode
}

export function VentasPageHeader({ title, subtitle, children }: VentasPageHeaderProps) {
  return (
    <div className="mb-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#002868] flex items-center justify-center flex-shrink-0 shadow-sm">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A93BB] mb-1">Ventas</p>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#002868]">{title}</h1>
            <p className="text-[#666666] text-sm sm:text-base mt-1">{subtitle}</p>
          </div>
        </div>
        {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
      </div>
      <VentasNav />
    </div>
  )
}
