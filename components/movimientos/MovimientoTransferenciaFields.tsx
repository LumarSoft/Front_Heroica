'use client'
import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inputClasses, labelClasses } from '@/lib/dialog-styles'
import { parseInputMonto, formatInputMonto } from '@/lib/formatters'
import type { NuevoMovimientoContext } from '@/lib/types'
import { MovimientoSelect } from './MovimientoSelect'
import { AlertTriangle } from 'lucide-react'
interface Props {
  context: NuevoMovimientoContext
}
export function MovimientoTransferenciaFields({ context }: Props) {
  const { transferenciaData, setTransferenciaData, moneda, bancos, parcialesBancos } = context
  const parcial = useMemo(
    () => parcialesBancos.find(p => String(p.banco_id) === transferenciaData.banco_origen_id),
    [parcialesBancos, transferenciaData.banco_origen_id],
  )
  const saldoOrigen = Number(parcial?.total_real ?? 0),
    montoSolicitado = parseFloat(transferenciaData.monto) || 0
  const excede = montoSolicitado > 0 && montoSolicitado > saldoOrigen
  const colorBg = excede ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
  const colorText = excede ? 'text-rose-700' : 'text-emerald-700',
    colorLabel = excede ? 'text-rose-500' : 'text-emerald-500'
  return (
    <section className="space-y-4">
      <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
        <span className="w-1 h-4 bg-[#002868] rounded-full" />
        Movimiento entre bancos
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="transferencia_fecha" className={labelClasses}>
            Fecha
          </Label>
          <Input
            id="transferencia_fecha"
            type="date"
            value={transferenciaData.fecha}
            onChange={e =>
              setTransferenciaData(p => ({
                ...p,
                fecha: e.target.value,
              }))
            }
            className={inputClasses}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="transferencia_monto" className={labelClasses}>
            Monto *
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8A8F9C] select-none pointer-events-none">
              {moneda === 'USD' ? 'US$' : '$'}
            </span>
            <Input
              id="transferencia_monto"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={formatInputMonto(transferenciaData.monto)}
              onChange={e =>
                setTransferenciaData(p => ({
                  ...p,
                  monto: parseInputMonto(e.target.value),
                }))
              }
              className={`${inputClasses} ${moneda === 'USD' ? 'pl-12' : 'pl-8'}`}
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="transferencia_concepto" className={labelClasses}>
          Concepto
        </Label>
        <Input
          id="transferencia_concepto"
          placeholder="Ej: Transferencia Galicia → BBVA"
          value={transferenciaData.concepto}
          onChange={e =>
            setTransferenciaData(p => ({
              ...p,
              concepto: e.target.value,
            }))
          }
          className={inputClasses}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="transferencia_descripcion" className={labelClasses}>
          Descripción
        </Label>
        <Input
          id="transferencia_descripcion"
          placeholder="Detalles adicionales (opcional)"
          value={transferenciaData.descripcion}
          onChange={e =>
            setTransferenciaData(p => ({
              ...p,
              descripcion: e.target.value,
            }))
          }
          className={inputClasses}
        />
      </div>

      {/* Origen → Destino */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="transferencia_origen" className={labelClasses}>
            Banco Origen *
          </Label>
          <MovimientoSelect
            id="transferencia_origen"
            value={transferenciaData.banco_origen_id}
            onValueChange={value => setTransferenciaData(p => ({ ...p, banco_origen_id: value }))}
            options={bancos
              .filter(b => String(b.id) !== transferenciaData.banco_destino_id)
              .map(b => ({ value: String(b.id), label: b.nombre }))}
            placeholder="Seleccione banco origen"
            disabled={false}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="transferencia_destino" className={labelClasses}>
            Banco Destino *
          </Label>
          <MovimientoSelect
            id="transferencia_destino"
            value={transferenciaData.banco_destino_id}
            onValueChange={value => setTransferenciaData(p => ({ ...p, banco_destino_id: value }))}
            options={bancos
              .filter(b => String(b.id) !== transferenciaData.banco_origen_id)
              .map(b => ({ value: String(b.id), label: b.nombre }))}
            placeholder="Seleccione banco destino"
            disabled={false}
          />
        </div>
      </div>

      {/* Saldo real del banco origen */}
      {transferenciaData.banco_origen_id && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${colorBg} transition-all`}>
          <div className="flex items-center gap-2">
            {excede ? (
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-white" />
              </span>
            )}
            <span className={`text-xs font-semibold uppercase tracking-wide ${colorLabel}`}>Saldo real disponible</span>
          </div>
          <div className="text-right">
            <span className={`text-sm font-bold ${colorText}`}>
              {moneda === 'USD' ? 'US$' : '$'}{' '}
              {saldoOrigen.toLocaleString('es-AR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            {excede && (
              <p className="text-xs text-rose-500 mt-0.5">
                Faltan {moneda === 'USD' ? 'US$' : '$'}{' '}
                {(montoSolicitado - saldoOrigen).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Flecha visual */}
      {transferenciaData.banco_origen_id && transferenciaData.banco_destino_id && (
        <div className="flex items-center justify-center gap-2 py-2">
          <span className="text-sm font-bold text-[#002868]">
            {bancos.find(b => b.id.toString() === transferenciaData.banco_origen_id)?.nombre}
          </span>
          <span className="text-[#002868] text-lg">→</span>
          <span className="text-sm font-bold text-emerald-600">
            {bancos.find(b => b.id.toString() === transferenciaData.banco_destino_id)?.nombre}
          </span>
        </div>
      )}
    </section>
  )
}
