'use client'

import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { parseInputMonto } from '@/lib/formatters'
import type { Categoria, SelectOption, DescripcionOption } from '@/lib/types'
import { Check, X, Loader2 } from 'lucide-react'
import { useInlineMovimiento } from '@/hooks/use-inline-movimiento'

interface InlineMovimientoRowProps {
  cajaTipo: 'efectivo' | 'banco'
  moneda: 'ARS' | 'USD'
  sucursalId: number
  userId?: number
  /** 'completado' → pestaña Saldo Real; 'aprobado' → pestaña Saldo Necesario */
  estado: 'completado' | 'aprobado'
  /** Fecha heredada de la fila de referencia (YYYY-MM-DD) */
  defaultFecha: string
  /** Posición manual calculada (para insertar arriba/abajo de una fila) */
  orden: number
  categorias: Categoria[]
  descripciones: DescripcionOption[]
  bancos: SelectOption[]
  mediosPago: SelectOption[]
  onCancel: () => void
  onCreated: (createdId: number) => void
}

const labelClass = 'block text-[11px] font-semibold text-[#5A6070] mb-1'

export function InlineMovimientoRow({
  cajaTipo,
  moneda,
  sucursalId,
  userId,
  estado,
  defaultFecha,
  orden,
  categorias,
  descripciones,
  bancos,
  mediosPago,
  onCancel,
  onCreated,
}: InlineMovimientoRowProps) {
  const {
    isBanco,
    tipo,
    fecha,
    setFecha,
    categoriaId,
    subcategoriaId,
    setSubcategoriaId,
    descripcionId,
    monto,
    setMonto,
    prioridad,
    setPrioridad,
    bancoId,
    setBancoId,
    medioPagoId,
    setMedioPagoId,
    categoriaOptions,
    subcategoriaOptions,
    descripcionOptions,
    bancoOptions,
    medioPagoOptions,
    isSaving,
    handleTipoChange,
    handleCategoriaChange,
    handleDescripcionChange,
    handleGuardar,
    errorRing,
  } = useInlineMovimiento({
    cajaTipo,
    moneda,
    sucursalId,
    userId,
    estado,
    defaultFecha,
    orden,
    categorias,
    descripciones,
    bancos,
    mediosPago,
    onCreated,
  })

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Tipo ingreso/egreso */}
      <div className="flex items-center gap-2">
        {(['ingreso', 'egreso'] as const).map(op => (
          <button
            key={op}
            type="button"
            onClick={() => handleTipoChange(op)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              tipo === op
                ? op === 'ingreso'
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-rose-500 border-rose-500 text-white'
                : 'bg-white border-[#E0E0E0] text-[#5A6070] hover:border-[#002868]'
            }`}
          >
            {op === 'ingreso' ? 'Ingreso' : 'Egreso'}
          </button>
        ))}
        <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-800 text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Sin guardar
        </span>
      </div>

      {/* Campos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <div>
          <label className={labelClass}>Fecha *</label>
          <Input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className={`h-10 ${errorRing('fecha')}`}
          />
        </div>
        <div>
          <label className={labelClass}>Descripción *</label>
          <div className={errorRing('descripcion_id')}>
            <Combobox
              options={descripcionOptions}
              value={descripcionId}
              onChange={handleDescripcionChange}
              placeholder="Descripción"
              searchPlaceholder="Buscar descripción..."
              emptyText="Sin descripciones para este tipo"
              overlay
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Categoría *</label>
          <div className={errorRing('categoria_id')}>
            <Combobox
              options={categoriaOptions}
              value={categoriaId}
              onChange={handleCategoriaChange}
              placeholder="Categoría"
              searchPlaceholder="Buscar categoría..."
              overlay
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Subcategoría *</label>
          <div className={errorRing('subcategoria_id')}>
            <Combobox
              options={subcategoriaOptions}
              value={subcategoriaId}
              onChange={setSubcategoriaId}
              disabled={!categoriaId}
              placeholder="Subcategoría"
              searchPlaceholder="Buscar subcategoría..."
              overlay
            />
          </div>
        </div>
        {isBanco && (
          <>
            <div>
              <label className={labelClass}>Banco *</label>
              <div className={errorRing('banco_id')}>
                <Combobox
                  options={bancoOptions}
                  value={bancoId}
                  onChange={setBancoId}
                  placeholder="Banco"
                  searchPlaceholder="Buscar banco..."
                  overlay
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Medio de pago *</label>
              <div className={errorRing('medio_pago_id')}>
                <Combobox
                  options={medioPagoOptions}
                  value={medioPagoId}
                  onChange={setMedioPagoId}
                  placeholder="Medio de pago"
                  searchPlaceholder="Buscar medio..."
                  overlay
                />
              </div>
            </div>
          </>
        )}
        <div>
          <label className={labelClass}>Monto *</label>
          <Input
            inputMode="decimal"
            value={monto}
            onChange={e => setMonto(parseInputMonto(e.target.value))}
            placeholder="0,00"
            className={`h-10 ${errorRing('monto')}`}
          />
        </div>
        <div>
          <label className={labelClass}>Prioridad</label>
          <select
            value={prioridad}
            onChange={e => setPrioridad(e.target.value as 'baja' | 'media' | 'alta')}
            className="h-10 w-full rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#002868]/20 focus:border-[#002868]"
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="h-8 px-3 text-xs border-rose-300 text-rose-600 hover:bg-rose-50"
          title="Cancelar"
        >
          <X className="w-4 h-4 mr-1" />
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleGuardar}
          disabled={isSaving}
          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          title="Confirmar"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
          Confirmar
        </Button>
      </div>
    </div>
  )
}
