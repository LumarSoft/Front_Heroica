'use client'
import { FileSpreadsheet, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MovimientoSelect } from '@/components/movimientos/MovimientoSelect'
import { labelClasses } from '@/lib/dialog-styles'
import { esImpuesto, OPCIONES_IMPUESTO } from '@/lib/impuestos'
import type { EstadoBaseImpositiva, FiltrosBaseImpositiva, SelectOption } from '@/lib/types'

interface Props {
  filtros: FiltrosBaseImpositiva
  onChange: (filtros: FiltrosBaseImpositiva) => void
  sucursales: SelectOption[]
  isLoading: boolean
  onActualizar: () => void
  puedeExportar: boolean
  isExportando: boolean
  onExportar: () => void
}

const OPCIONES_ESTADO: { value: EstadoBaseImpositiva; label: string }[] = [
  { value: 'todos', label: 'Pendientes y pagados' },
  { value: 'pendiente', label: 'Solo pendientes' },
  { value: 'pagado', label: 'Solo pagados' },
]

export function BaseImpositivaFiltros({
  filtros,
  onChange,
  sucursales,
  isLoading,
  onActualizar,
  puedeExportar,
  isExportando,
  onExportar,
}: Props) {
  const set = (cambios: Partial<FiltrosBaseImpositiva>) => onChange({ ...filtros, ...cambios })
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5 min-w-[200px]">
        <Label htmlFor="bi-sucursal" className={labelClasses}>
          Sucursal
        </Label>
        <MovimientoSelect
          id="bi-sucursal"
          value={filtros.sucursalId}
          onValueChange={sucursalId => set({ sucursalId })}
          options={sucursales.map(s => ({ value: String(s.id), label: s.nombre }))}
          placeholder="Todas las sucursales"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bi-desde" className={labelClasses}>
          Período desde
        </Label>
        <Input
          id="bi-desde"
          type="month"
          value={filtros.desde}
          onChange={e => set({ desde: e.target.value })}
          className="h-9 bg-white"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bi-hasta" className={labelClasses}>
          Hasta
        </Label>
        <Input
          id="bi-hasta"
          type="month"
          value={filtros.hasta}
          onChange={e => set({ hasta: e.target.value })}
          className="h-9 bg-white"
        />
      </div>
      <div className="space-y-1.5 min-w-[200px]">
        <Label htmlFor="bi-impuesto" className={labelClasses}>
          Impuesto
        </Label>
        <MovimientoSelect
          id="bi-impuesto"
          value={filtros.impuesto}
          onValueChange={v => set({ impuesto: esImpuesto(v) ? v : '' })}
          options={OPCIONES_IMPUESTO}
          placeholder="Todos los impuestos"
        />
      </div>
      <div className="space-y-1.5 min-w-[190px]">
        <Label htmlFor="bi-estado" className={labelClasses}>
          Estado
        </Label>
        <MovimientoSelect
          id="bi-estado"
          allowEmpty={false}
          value={filtros.estado}
          onValueChange={v => set({ estado: OPCIONES_ESTADO.find(o => o.value === v)?.value ?? 'todos' })}
          options={OPCIONES_ESTADO}
          placeholder="Estado"
        />
      </div>
      <Button variant="outline" onClick={onActualizar} disabled={isLoading} className="h-9 gap-2">
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Actualizar
      </Button>
      <Button
        variant="outline"
        onClick={onExportar}
        disabled={!puedeExportar || isExportando}
        className="h-9 gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
      >
        <FileSpreadsheet className="h-4 w-4" />
        {isExportando ? 'Exportando...' : 'Exportar Excel'}
      </Button>
    </div>
  )
}
