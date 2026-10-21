'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inputClasses, labelClasses } from '@/lib/dialog-styles'
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

/** Pedirle plata a otra sucursal: entra en esta caja cuando la otra sucursal lo acepta */
export function PedirPrestamoFields({ form, bancos, cajaTipo, moneda }: Props) {
  const { pedir, setPedir, sucursales } = form
  const opcionesBancos = bancos.map(b => ({ value: String(b.id), label: b.nombre }))
  const set = (cambios: Partial<typeof pedir>) => setPedir(prev => ({ ...prev, ...cambios }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="prestamo_fecha" className={labelClasses}>
            Fecha
          </Label>
          <Input
            id="prestamo_fecha"
            type="date"
            value={pedir.fecha}
            onChange={e => set({ fecha: e.target.value })}
            className={inputClasses}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prestamo_monto" className={labelClasses}>
            Monto *
          </Label>
          <PrestamoMontoInput
            id="prestamo_monto"
            value={pedir.monto}
            moneda={moneda}
            onChange={monto => set({ monto })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="prestamo_descripcion" className={labelClasses}>
          Descripción
        </Label>
        <Input
          id="prestamo_descripcion"
          placeholder="Ej: para pagar a proveedores (opcional)"
          value={pedir.descripcion}
          onChange={e => set({ descripcion: e.target.value })}
          className={inputClasses}
        />
      </div>

      <div className="rounded-xl border border-[#E0E0E0] bg-[#FAFBFC] p-4 space-y-4">
        <p className="text-xs font-bold text-[#002868] uppercase tracking-widest">Sale de</p>
        <div className="space-y-1.5">
          <Label htmlFor="prestamo_sucursal" className={labelClasses}>
            Sucursal que presta *
          </Label>
          <MovimientoSelect
            id="prestamo_sucursal"
            value={pedir.sucursal_presta_id}
            onValueChange={v => set({ sucursal_presta_id: v })}
            options={sucursales.map(s => ({ value: String(s.id), label: s.nombre }))}
            placeholder="Seleccioná la sucursal"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prestamo_caja_salida" className={labelClasses}>
              Caja
            </Label>
            <MovimientoSelect
              id="prestamo_caja_salida"
              allowEmpty={false}
              value={pedir.caja_salida}
              onValueChange={v => set({ caja_salida: v === 'efectivo' ? 'efectivo' : 'banco', banco_salida_id: '' })}
              options={[
                { value: 'banco', label: 'Banco' },
                { value: 'efectivo', label: 'Efectivo' },
              ]}
              placeholder="Seleccioná"
            />
          </div>
          {pedir.caja_salida === 'banco' && (
            <div className="space-y-1.5">
              <Label htmlFor="prestamo_banco_salida" className={labelClasses}>
                Banco *
              </Label>
              <MovimientoSelect
                id="prestamo_banco_salida"
                value={pedir.banco_salida_id}
                onValueChange={v => set({ banco_salida_id: v })}
                options={opcionesBancos}
                placeholder="Seleccioná el banco"
              />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-4">
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
          Entra en esta caja ({cajaTipo === 'banco' ? 'banco' : 'efectivo'})
        </p>
        {cajaTipo === 'banco' ? (
          <div className="space-y-1.5">
            <Label htmlFor="prestamo_banco_entrada" className={labelClasses}>
              Banco *
            </Label>
            <MovimientoSelect
              id="prestamo_banco_entrada"
              value={pedir.banco_entrada_id}
              onValueChange={v => set({ banco_entrada_id: v })}
              options={opcionesBancos}
              placeholder="Seleccioná el banco"
            />
          </div>
        ) : (
          <p className="text-xs text-[#5A6070]">La plata entra en la caja de efectivo de esta sucursal.</p>
        )}
      </div>

      <p className="text-xs text-[#8A8F9C]">
        Si la otra sucursal tiene que aceptarlo, el préstamo queda pedido y no mueve saldos hasta que lo acepte.
      </p>
    </div>
  )
}
