import { VENTAS_CARD_CLASS } from '@/lib/dialog-styles'

interface VentasChartCardProps {
  title: string
  subtitle?: string
  /** Controles a la derecha del título (toggles). */
  acciones?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function VentasChartCard({ title, subtitle, acciones, className = '', children }: VentasChartCardProps) {
  return (
    <section className={`${VENTAS_CARD_CLASS} p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#002868]">{title}</h3>
          {subtitle && <p className="text-xs text-[#7A93BB] mt-0.5">{subtitle}</p>}
        </div>
        {acciones}
      </div>
      {children}
    </section>
  )
}
