import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EgresoLineaRow } from '@/components/reportes/corte-balance/EgresoLineaRow'
import { corteCardClasses, labelClasses } from '@/lib/dialog-styles'
import { formatearImporte } from '@/lib/corte-balance/valores'
import type { AjusteLineaCorte, SeccionCalculada } from '@/lib/types'

interface EgresosSeccionCardProps {
  seccion: SeccionCalculada
  ajustes: Record<string, AjusteLineaCorte>
  detalle: string
  moneda: 'ARS' | 'USD'
  onAjusteChange: (lineaId: string, cambios: Partial<AjusteLineaCorte>) => void
  onDetalleChange: (seccionId: string, texto: string) => void
}

export function EgresosSeccionCard({
  seccion,
  ajustes,
  detalle,
  moneda,
  onAjusteChange,
  onDetalleChange,
}: EgresosSeccionCardProps) {
  return (
    <section className={corteCardClasses}>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-[#002868]">{seccion.nombre}</h3>
        <p className="text-sm text-[#5A6070]">
          Total <span className="font-bold text-[#002868]">{formatearImporte(seccion.total, moneda)}</span>
        </p>
      </header>
      <div className="hidden grid-cols-[minmax(0,1.3fr)_150px_170px_minmax(0,1fr)_120px] gap-2 border-b border-[#EEF0F3] pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] md:grid">
        <span>Línea</span>
        <span className="text-right pr-2">Sistema</span>
        <span>Ajuste manual</span>
        <span>Nota</span>
        <span className="text-right">En el reporte</span>
      </div>
      {seccion.lineas.map(linea => (
        <EgresoLineaRow
          key={linea.id}
          linea={linea}
          ajuste={ajustes[linea.id]}
          moneda={moneda}
          onAjusteChange={onAjusteChange}
        />
      ))}
      <div className="mt-3 space-y-1">
        <Label className={labelClasses}>Detalle de la sección (opcional)</Label>
        <Textarea
          value={detalle}
          onChange={e => onDetalleChange(seccion.id, e.target.value)}
          placeholder="Texto explicativo que aparece debajo de la tabla en la presentación"
          className="min-h-[60px] text-sm"
        />
      </div>
    </section>
  )
}
