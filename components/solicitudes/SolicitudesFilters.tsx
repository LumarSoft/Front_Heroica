'use client'

import { Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Personal, RhSolicitudEstado, Sucursal } from '@/lib/types'

export interface SolicitudesFilterState {
  estado: 'todos' | RhSolicitudEstado
  personalId: string
  sucursalId: string
  solicitante: string
  fechaDesde: string
  fechaHasta: string
}

interface SolicitudesFiltersProps {
  filters: SolicitudesFilterState
  onChange: (filters: SolicitudesFilterState) => void
  personal: Personal[]
  sucursales: Sucursal[]
  showSucursalFilter: boolean
}

export function SolicitudesFilters({ filters, onChange, personal, sucursales, showSucursalFilter }: SolicitudesFiltersProps) {
  const activeFilters = [filters.estado !== 'todos', filters.personalId !== 'todos', filters.sucursalId !== 'todas', Boolean(filters.solicitante), Boolean(filters.fechaDesde), Boolean(filters.fechaHasta)].some(Boolean)

  return (
    <div className="grid gap-3 mb-5 p-4 bg-white rounded-xl border border-[#E0E0E0] shadow-sm md:grid-cols-5">
      <div className="flex items-center gap-2 md:col-span-5">
        <Filter className="w-4 h-4 text-[#9AA0AC] flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[#9AA0AC]">Filtros avanzados</span>
        {activeFilters && (
          <button onClick={() => onChange({ estado: 'todos', personalId: 'todos', sucursalId: 'todas', solicitante: '', fechaDesde: '', fechaHasta: '' })} className="text-xs text-[#002868] underline underline-offset-2 hover:text-[#003d8f] ml-auto">
            Limpiar filtros
          </button>
        )}
      </div>

      <Select value={filters.estado} onValueChange={value => onChange({ ...filters, estado: value as SolicitudesFilterState['estado'] })}>
        <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los estados</SelectItem>
          <SelectItem value="Pendiente">Pendiente</SelectItem>
          <SelectItem value="Aprobada">Aprobada</SelectItem>
          <SelectItem value="Rechazada">Rechazada</SelectItem>
          <SelectItem value="Cancelada">Cancelada</SelectItem>
        </SelectContent>
      </Select>

      {showSucursalFilter && (
        <Select value={filters.sucursalId} onValueChange={value => onChange({ ...filters, sucursalId: value })}>
          <SelectTrigger><SelectValue placeholder="Sucursal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las sucursales</SelectItem>
            {sucursales.map(sucursal => (
              <SelectItem key={sucursal.id} value={sucursal.id.toString()}>
                {sucursal.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={filters.personalId} onValueChange={value => onChange({ ...filters, personalId: value })}>
        <SelectTrigger><SelectValue placeholder="Colaborador" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los colaboradores</SelectItem>
          {personal.map(colaborador => (
            <SelectItem key={colaborador.id} value={colaborador.id.toString()}>
              {colaborador.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input placeholder="Solicitante" value={filters.solicitante} onChange={event => onChange({ ...filters, solicitante: event.target.value })} />
      <Input type="date" value={filters.fechaDesde} onChange={event => onChange({ ...filters, fechaDesde: event.target.value })} />
      <Input type="date" value={filters.fechaHasta} onChange={event => onChange({ ...filters, fechaHasta: event.target.value })} />
    </div>
  )
}
