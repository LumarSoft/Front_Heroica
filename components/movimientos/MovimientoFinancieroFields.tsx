'use client'
import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inputClasses, labelClasses } from '@/lib/dialog-styles'
import { formatInputMonto } from '@/lib/formatters'
import type { NuevoMovimientoContext } from '@/lib/types'
import { MovimientoSelect } from './MovimientoSelect'
import { isMedioPagoChequeLike, tieneNumeroChequeCargado } from '@/lib/cheque'
interface Props {
  context: NuevoMovimientoContext
}
export function MovimientoFinancieroFields({ context }: Props) {
  const { formData, handleInputChange, cajaTipo, moneda, bancos, mediosPago } = context
  const muestraCamposBanco = cajaTipo === 'banco' || formData.tipo_movimiento === 'banco'
  const selectedMedioForm = useMemo(
    () => mediosPago.find(m => m.id.toString() === formData.medio_pago_id),
    [mediosPago, formData.medio_pago_id],
  )
  const formMedioEsCheque = muestraCamposBanco && isMedioPagoChequeLike(selectedMedioForm?.nombre)
  const formChequeConNumero = formMedioEsCheque && tieneNumeroChequeCargado(formData.numero_cheque)
  const formChequePendienteSinNumero = formMedioEsCheque && !tieneNumeroChequeCargado(formData.numero_cheque)
  return (
    <section className="space-y-4">
      <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
        <span className="w-1 h-4 bg-[#002868] rounded-full" />
        Detalles financieros
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="monto" className={labelClasses}>
            Monto *
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8A8F9C] select-none pointer-events-none">
              {moneda === 'USD' ? 'US$' : '$'}
            </span>
            <Input
              id="monto"
              name="monto"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={formatInputMonto(formData.monto)}
              onChange={handleInputChange}
              className={`${inputClasses} ${moneda === 'USD' ? 'pl-12' : 'pl-8'}`}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prioridad" className={labelClasses}>
            Prioridad
          </Label>
          <MovimientoSelect
            id="prioridad"
            allowEmpty={false}
            value={formData.prioridad}
            onValueChange={value => handleInputChange({ target: { name: 'prioridad', value } })}
            options={[
              { value: 'baja', label: 'Baja' },
              { value: 'media', label: 'Media' },
              { value: 'alta', label: 'Alta' },
            ]}
            placeholder="Seleccione"
            disabled={false}
          />
        </div>
      </div>

      {moneda === 'USD' && (
        <div className="space-y-1.5">
          <Label htmlFor="tipo_cambio" className={labelClasses}>
            Tipo de Cambio *
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8A8F9C] select-none pointer-events-none">
              $
            </span>
            <Input
              id="tipo_cambio"
              name="tipo_cambio"
              type="text"
              inputMode="decimal"
              placeholder="Ej: 1.050,00"
              value={formatInputMonto(formData.tipo_cambio)}
              onChange={handleInputChange}
              className={`${inputClasses} pl-8`}
            />
          </div>
          <p className="text-xs text-[#8A8F9C]">Cotización del dólar al momento de la operación</p>
        </div>
      )}

      {(cajaTipo === 'banco' || formData.tipo_movimiento === 'banco') && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="comprobante" className={labelClasses}>
              N° Comprobante
            </Label>
            <Input
              id="comprobante"
              name="comprobante"
              placeholder="Ej: 0001-00012345"
              value={formData.comprobante}
              onChange={handleInputChange}
              className={inputClasses}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="banco_id" className={labelClasses}>
                Banco
              </Label>
              <MovimientoSelect
                id="banco_id"
                value={formData.banco_id}
                onValueChange={value => handleInputChange({ target: { name: 'banco_id', value } })}
                options={bancos.map(b => ({ value: String(b.id), label: b.nombre }))}
                placeholder="Seleccione un banco"
                disabled={false}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="medio_pago_id" className={labelClasses}>
                Medio de Pago
              </Label>
              <MovimientoSelect
                id="medio_pago_id"
                className={
                  formMedioEsCheque ? (formChequeConNumero ? 'ring-2 ring-emerald-200' : 'ring-2 ring-amber-200') : ''
                }
                value={formData.medio_pago_id}
                onValueChange={value => handleInputChange({ target: { name: 'medio_pago_id', value } })}
                options={mediosPago.map(m => ({ value: String(m.id), label: m.nombre }))}
                placeholder="Seleccione medio de pago"
                disabled={false}
              />
            </div>
          </div>
          {formMedioEsCheque ? (
            <div className="space-y-1.5">
              <Label htmlFor="numero_cheque" className={labelClasses}>
                N° de Cheque <span className="font-normal text-[#8A8F9C]">(opcional hasta emitir)</span>
              </Label>
              <Input
                id="numero_cheque"
                name="numero_cheque"
                placeholder="Ej: 00012345 — cargalo cuando lo tengas del banco"
                value={formData.numero_cheque}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
          ) : null}
          {formChequePendienteSinNumero ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Podés confirmar sin N°. En el listado, el medio de pago se verá en <strong>amarillo</strong> hasta que
              cargues el número; después pasará a <strong>verde</strong>.
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
