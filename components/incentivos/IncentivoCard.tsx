'use client'

import { Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RhIncentivoPremio } from '@/lib/types'

interface IncentivoCardProps {
  incentivo: RhIncentivoPremio
  onEdit: (incentivo: RhIncentivoPremio) => void
  onDeactivate: (incentivo: RhIncentivoPremio) => void
  deactivatingId: number | null
}

function formatValor(incentivo: RhIncentivoPremio): string {
  const v = Number(incentivo.valor)
  if (incentivo.metodo_calculo === 'monto_fijo') {
    return v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
  }
  if (incentivo.metodo_calculo === 'porcentaje_escala') return `${v}% del sueldo base`
  return `${v}× valor/hora`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isActive(incentivo: RhIncentivoPremio) {
  return incentivo.activo === true || incentivo.activo === 1
}

export function IncentivoCard({ incentivo, onEdit, onDeactivate, deactivatingId }: IncentivoCardProps) {
  const active = isActive(incentivo)

  return (
    <article className="p-5 sm:p-6 hover:bg-[#F8FAFF] transition-colors">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex rounded-full border border-[#D8E3F8] bg-[#EAF0FF] px-3 py-1 text-xs font-bold text-[#002868]">
              {incentivo.tipo}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                active
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {active ? 'Activo' : 'Inactivo'}
            </span>
            {incentivo.area_id && incentivo.area_nombre && (
              <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                Área: {incentivo.area_nombre}
              </span>
            )}
            {incentivo.puesto_id && incentivo.puesto_nombre && (
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Puesto: {incentivo.puesto_nombre}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-[#002868]">{incentivo.nombre}</h3>
          <p className="text-sm text-[#666666] mt-1">Actualizado {formatDate(incentivo.fecha_ultima_actualizacion)}</p>
          {incentivo.descripcion && <p className="text-sm text-[#4B5563] mt-3">{incentivo.descripcion}</p>}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 xl:text-right">
          <div className="min-w-[180px]">
            <p className="text-xs font-bold uppercase tracking-wide text-[#9AA0AC] mb-1">Regla de cálculo</p>
            <p className="text-lg font-bold text-[#002868]">{formatValor(incentivo)}</p>
            <p className="text-xs text-[#9AA0AC] mt-0.5">Por empleado al liquidar</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => onEdit(incentivo)} aria-label="Editar incentivo">
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDeactivate(incentivo)}
              disabled={!active || deactivatingId === incentivo.id}
              className="text-rose-600 hover:text-rose-700"
              aria-label="Desactivar incentivo"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
