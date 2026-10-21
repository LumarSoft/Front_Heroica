'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inputClasses, labelClasses } from '@/lib/dialog-styles'
import { fechaHoyMovimiento } from '@/lib/movimiento-form'
import type { CajaPrestamo, SelectOption } from '@/lib/types'
import { MovimientoSelect } from '@/components/movimientos/MovimientoSelect'

export interface ResolucionAceptar {
  fecha: string
  bancoId: string
}

interface Props {
  modo: 'aceptar' | 'rechazar'
  /** Caja de esta sucursal por donde pasa la plata (si es banco se elige el banco) */
  caja: CajaPrestamo
  bancoInicial: number | null
  bancos: SelectOption[]
  isSaving: boolean
  onAceptar: (r: ResolucionAceptar) => void
  onRechazar: (motivo: string) => void
  onCancelar: () => void
}

/** Datos para aceptar (fecha y banco) o rechazar (motivo) un pedido o una devolución */
export function PrestamoResolverForm({
  modo,
  caja,
  bancoInicial,
  bancos,
  isSaving,
  onAceptar,
  onRechazar,
  onCancelar,
}: Props) {
  const [fecha, setFecha] = useState(fechaHoyMovimiento)
  const [bancoId, setBancoId] = useState(bancoInicial ? String(bancoInicial) : '')
  const [motivo, setMotivo] = useState('')
  const listo = modo === 'aceptar' ? caja === 'efectivo' || Boolean(bancoId) : motivo.trim().length > 0

  return (
    <div className="mt-3 rounded-lg border border-[#E0E0E0] bg-white p-3 space-y-3">
      {modo === 'aceptar' ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className={labelClasses}>Fecha</Label>
            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputClasses} />
          </div>
          {caja === 'banco' && (
            <div className="space-y-1.5">
              <Label className={labelClasses}>Banco</Label>
              <MovimientoSelect
                id="resolver_banco"
                value={bancoId}
                onValueChange={setBancoId}
                options={bancos.map(b => ({ value: String(b.id), label: b.nombre }))}
                placeholder="Seleccioná el banco"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className={labelClasses}>Motivo del rechazo *</Label>
          <Input
            value={motivo}
            maxLength={255}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: no hay saldo disponible"
            className={inputClasses}
          />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancelar} disabled={isSaving}>
          Volver
        </Button>
        <Button
          size="sm"
          disabled={!listo || isSaving}
          onClick={() => (modo === 'aceptar' ? onAceptar({ fecha, bancoId }) : onRechazar(motivo.trim()))}
          className={modo === 'aceptar' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
        >
          {isSaving ? 'Guardando…' : modo === 'aceptar' ? 'Confirmar' : 'Rechazar'}
        </Button>
      </div>
    </div>
  )
}
