'use client'

import { FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ETIQUETA_TERCEROS, FILTRO_SUCURSAL_TERCEROS, FILTRO_SUCURSAL_TODAS, type FiltroTipoDeuda } from '@/lib/deudas'

interface DeudasFiltrosProps {
  fechaInicio: string
  fechaFin: string
  onFechaInicioChange: (fecha: string) => void
  onFechaFinChange: (fecha: string) => void
  tipo: FiltroTipoDeuda
  onTipoChange: (tipo: FiltroTipoDeuda) => void
  sucursal: string
  onSucursalChange: (sucursal: string) => void
  sucursales: string[]
  incluirTerceros: boolean
  isLoading: boolean
  onActualizar: () => void
  puedeExportar: boolean
  isExportando: boolean
  onExportar: () => void
}

const OPCIONES_TIPO: { value: FiltroTipoDeuda; label: string }[] = [
  { value: 'todos', label: 'Deudas y préstamos' },
  { value: 'deudas', label: 'Solo deudas' },
  { value: 'prestamos', label: 'Solo préstamos' },
]

function esFiltroTipo(value: string): value is FiltroTipoDeuda {
  return OPCIONES_TIPO.some(opcion => opcion.value === value)
}

export function DeudasFiltros({
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange,
  tipo,
  onTipoChange,
  sucursal,
  onSucursalChange,
  sucursales,
  incluirTerceros,
  isLoading,
  onActualizar,
  puedeExportar,
  isExportando,
  onExportar,
}: DeudasFiltrosProps) {
  return (
    <div className="px-7 py-4 border-b border-dashed flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase">Desde</Label>
        <Input type="date" value={fechaInicio} onChange={e => onFechaInicioChange(e.target.value)} className="h-9" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase">Hasta</Label>
        <Input type="date" value={fechaFin} onChange={e => onFechaFinChange(e.target.value)} className="h-9" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase">Mostrar</Label>
        <Select value={tipo} onValueChange={value => esFiltroTipo(value) && onTipoChange(value)}>
          <SelectTrigger className="h-9 w-[190px] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPCIONES_TIPO.map(opcion => (
              <SelectItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase">Relacionadas con</Label>
        <Select value={sucursal} onValueChange={onSucursalChange}>
          <SelectTrigger className="h-9 w-[220px] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTRO_SUCURSAL_TODAS}>Todas las sucursales</SelectItem>
            {incluirTerceros && <SelectItem value={FILTRO_SUCURSAL_TERCEROS}>{ETIQUETA_TERCEROS}</SelectItem>}
            {sucursales.length > 0 && <SelectSeparator />}
            {sucursales.map(nombre => (
              <SelectItem key={nombre} value={nombre}>
                {nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Juntos en un bloque para que al hacer wrap no se separen */}
      <div className="flex items-end gap-2">
        <Button onClick={onActualizar} disabled={isLoading} className="h-9 bg-[#002868] hover:bg-[#003d8f]">
          {isLoading ? 'Cargando...' : 'Actualizar'}
        </Button>
        <Button
          variant="outline"
          onClick={onExportar}
          disabled={!puedeExportar || isExportando || isLoading}
          className="h-9 border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {isExportando ? 'Exportando...' : 'Exportar Excel'}
        </Button>
      </div>
    </div>
  )
}
