'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inputClasses, labelClasses } from '@/lib/dialog-styles'
import { formatMonto } from '@/lib/formatters'
import type { CajaPrestamo, SelectOption } from '@/lib/types'
import type { PrestamoFormState } from '@/hooks/use-prestamo-form'
import { MovimientoSelect } from './MovimientoSelect'
import { PrestamoMontoInput } from './PrestamoMontoInput'

interface Props {
  form: PrestamoFormState
  bancos: SelectOption[]
  cajaTipo: CajaPrestamo
  moneda: 'ARS' | 'USD'
}

/** Devolver un préstamo (total o parcial): la plata sale de esta caja */
export function DevolverPrestamoFields({ form, bancos, cajaTipo, moneda }: Props) {
  const { devolver, setDevolver, pendientes, elegirPrestamo, prestamoElegido, disponible } = form
  const opcionesBancos = bancos.map(b => ({ value: String(b.id), label: b.nombre }))
  const set = (cambios: Partial<typeof devolver>) => setDevolver(prev => ({ ...prev, ...cambios }))

  if (pendientes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#E0E0E0] bg-[#FAFBFC] p-4 text-sm text-[#5A6070]">
        Esta sucursal no tiene préstamos en {moneda} pendientes de devolver.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="devolver_prestamo" className={labelClasses}>
          Préstamo a devolver *
        </Label>
        <MovimientoSelect
          id="devolver_prestamo"
          value={devolver.prestamo_id}
          onValueChange={elegirPrestamo}
          options={pendientes.map(p => ({
            value: String(p.id),
            label: `${p.sucursal_presta_nombre} · ${formatMonto(p.monto, moneda)} · queda ${formatMonto(p.disponible ?? p.pendiente, moneda)}`,
          }))}
          placeholder="Seleccioná el préstamo"
        />
        {prestamoElegido?.descripcion && <p className="text-xs text-[#8A8F9C]">{prestamoElegido.descripcion}</p>}
      </div>

      {prestamoElegido && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="devolver_tipo" className={labelClasses}>
                Devolución
              </Label>
              <MovimientoSelect
                id="devolver_tipo"
                allowEmpty={false}
                value={devolver.total ? 'total' : 'parcial'}
                onValueChange={v => set({ total: v === 'total', monto: v === 'total' ? String(disponible) : '' })}
                options={[
                  { value: 'total', label: `Total (${formatMonto(disponible, moneda)})` },
                  { value: 'parcial', label: 'Parcial' },
                ]}
                placeholder="Seleccioná"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="devolver_fecha" className={labelClasses}>
                Fecha
              </Label>
              <Input
                id="devolver_fecha"
                type="date"
                value={devolver.fecha}
                onChange={e => set({ fecha: e.target.value })}
                className={inputClasses}
              />
            </div>
          </div>

          {!devolver.total && (
            <div className="space-y-1.5">
              <Label htmlFor="devolver_monto" className={labelClasses}>
                Monto a devolver *
              </Label>
              <PrestamoMontoInput
                id="devolver_monto"
                value={devolver.monto}
                moneda={moneda}
                onChange={monto => set({ monto })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#E0E0E0] bg-[#FAFBFC] p-4 space-y-3">
              <p className="text-xs font-bold text-[#002868] uppercase tracking-widest">Sale de esta caja</p>
              {cajaTipo === 'banco' ? (
                <MovimientoSelect
                  id="devolver_banco_salida"
                  value={devolver.banco_salida_id}
                  onValueChange={v => set({ banco_salida_id: v })}
                  options={opcionesBancos}
                  placeholder="Banco"
                />
              ) : (
                <p className="text-xs text-[#5A6070]">Efectivo</p>
              )}
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                Entra en {prestamoElegido.sucursal_presta_nombre}
              </p>
              <MovimientoSelect
                id="devolver_caja_entrada"
                allowEmpty={false}
                value={devolver.caja_entrada}
                onValueChange={v =>
                  set({ caja_entrada: v === 'efectivo' ? 'efectivo' : 'banco', banco_entrada_id: '' })
                }
                options={[
                  { value: 'banco', label: 'Banco' },
                  { value: 'efectivo', label: 'Efectivo' },
                ]}
                placeholder="Caja"
              />
              {devolver.caja_entrada === 'banco' && (
                <MovimientoSelect
                  id="devolver_banco_entrada"
                  value={devolver.banco_entrada_id}
                  onValueChange={v => set({ banco_entrada_id: v })}
                  options={opcionesBancos}
                  placeholder="Banco"
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
