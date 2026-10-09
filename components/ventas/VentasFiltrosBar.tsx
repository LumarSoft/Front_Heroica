'use client'

import { useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { MultiSelect } from '@/components/ui/multi-select'
import { labelClasses, VENTAS_CARD_CLASS, VENTAS_SELECT_CLASS } from '@/lib/dialog-styles'
import type { FiltrosVentas, OpcionesFiltrosVentas } from '@/lib/types'
import { VentasPeriodoRapido } from './VentasPeriodoRapido'
import { VentasSelectFiltro } from './VentasSelectFiltro'

interface VentasFiltrosBarProps {
  filtros: FiltrosVentas
  opciones: OpcionesFiltrosVentas
  onChange: <K extends keyof FiltrosVentas>(clave: K, valor: FiltrosVentas[K]) => void
  onLimpiar: () => void
}

export function VentasFiltrosBar({ filtros, opciones, onChange, onLimpiar }: VentasFiltrosBarProps) {
  const opcionesSucursales = useMemo(
    () => opciones.sucursales.map(s => ({ value: String(s.id), label: s.nombre })),
    [opciones.sucursales],
  )
  const seleccionadas = useMemo(() => filtros.sucursalIds.map(String), [filtros.sucursalIds])
  const rangoInvalido = Boolean(filtros.desde && filtros.hasta && filtros.desde > filtros.hasta)

  return (
    <div className={`${VENTAS_CARD_CLASS} p-4 mb-4 space-y-3`}>
      <VentasPeriodoRapido
        desde={filtros.desde}
        hasta={filtros.hasta}
        onElegir={(desde, hasta) => {
          onChange('desde', desde)
          onChange('hasta', hasta)
        }}
      />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className={labelClasses}>Desde</span>
          <input
            type="date"
            value={filtros.desde}
            max={filtros.hasta || undefined}
            onChange={e => onChange('desde', e.target.value)}
            className={VENTAS_SELECT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClasses}>Hasta</span>
          <input
            type="date"
            value={filtros.hasta}
            min={filtros.desde || undefined}
            onChange={e => onChange('hasta', e.target.value)}
            className={VENTAS_SELECT_CLASS}
          />
        </label>
        <div className="flex flex-col gap-1 min-w-[220px] flex-1">
          <span className={labelClasses}>Sucursales</span>
          <MultiSelect
            options={opcionesSucursales}
            selected={seleccionadas}
            onChange={valores => onChange('sucursalIds', valores.map(Number))}
            placeholder="Todas las sucursales"
            emptyMessage="No hay sucursales vinculadas a las integraciones"
          />
        </div>
        <label className="flex flex-col gap-1 min-w-[200px] flex-1">
          <span className={labelClasses}>Producto</span>
          <span className="relative">
            <Search className="w-4 h-4 text-[#7A93BB] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={filtros.producto}
              onChange={e => onChange('producto', e.target.value)}
              placeholder="Nombre o código"
              className={`${VENTAS_SELECT_CLASS} w-full pl-9`}
            />
          </span>
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <VentasSelectFiltro
          label="Categoría"
          value={filtros.categoria}
          opciones={opciones.categorias}
          onChange={v => onChange('categoria', v)}
        />
        <VentasSelectFiltro
          label="Medio de pago"
          value={filtros.medioPago}
          opciones={opciones.mediosPago}
          onChange={v => onChange('medioPago', v)}
        />
        <VentasSelectFiltro
          label="Canal"
          value={filtros.canal}
          opciones={opciones.canales}
          onChange={v => onChange('canal', v)}
        />
        {opciones.vendedores.length > 0 && (
          <VentasSelectFiltro
            label="Vendedor"
            value={filtros.vendedor}
            opciones={opciones.vendedores}
            onChange={v => onChange('vendedor', v)}
          />
        )}
        {opciones.cajas.length > 0 && (
          <VentasSelectFiltro
            label="Caja"
            value={filtros.caja}
            opciones={opciones.cajas}
            onChange={v => onChange('caja', v)}
          />
        )}
        <button
          type="button"
          onClick={onLimpiar}
          className="h-10 px-3 flex items-center gap-1.5 text-sm font-medium text-[#7A93BB] hover:text-[#002868] cursor-pointer"
        >
          <X className="w-4 h-4" />
          Limpiar filtros
        </button>
      </div>
      {rangoInvalido && (
        <p className="text-xs font-medium text-rose-600">La fecha desde no puede ser posterior a hasta.</p>
      )}
    </div>
  )
}
