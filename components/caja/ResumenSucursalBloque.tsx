'use client'

import { formatMonto } from '@/lib/formatters'
import type { ResumenSaldos, ResumenSaldosCaja, ResumenSucursal } from '@/lib/types'

type Moneda = 'ARS' | 'USD'

const ETIQUETAS_DIAS = ['Ayer', 'Hoy', 'Mañana']

const colorSaldo = (monto: number) => (monto < 0 ? 'text-rose-700' : 'text-[#1A1A1A]')
const montoConSigno = (monto: number, moneda: Moneda) =>
  `${monto < 0 ? '−' : ''}${formatMonto(Math.abs(monto), moneda)}`

export function SaldosTabla({
  saldos,
  moneda,
  bancos = [],
}: {
  saldos: ResumenSaldos
  moneda: Moneda
  bancos?: ResumenSucursal['bancos']
}) {
  const fila = (nombre: string, valores: ResumenSaldosCaja, destacado = false) => (
    <tr className={destacado ? 'bg-[#F3F4F6] font-bold' : ''}>
      <td className="px-3 py-2 font-semibold">{nombre}</td>
      <td className={`px-3 py-2 text-right tabular-nums font-bold ${colorSaldo(valores.real)}`}>
        {montoConSigno(valores.real, moneda)}
      </td>
      <td className={`px-3 py-2 text-right tabular-nums ${colorSaldo(valores.necesario)}`}>
        {montoConSigno(valores.necesario, moneda)}
      </td>
    </tr>
  )
  return (
    <table className="w-full text-sm border border-[#E0E0E0] rounded-lg overflow-hidden">
      <thead className="bg-[#002868] text-white text-xs uppercase tracking-wide">
        <tr>
          <th className="px-3 py-2 text-left font-semibold">Caja</th>
          <th className="px-3 py-2 text-right font-semibold">Saldo real</th>
          <th className="px-3 py-2 text-right font-semibold">Saldo necesario</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#EEE]">
        {fila('Caja efectivo', saldos.efectivo)}
        {fila('Caja banco', saldos.banco)}
        {bancos
          .filter(banco => banco.real !== 0 || banco.necesario !== 0)
          .map(banco => (
            <tr key={banco.banco} className="text-xs text-[#666]">
              <td className="pl-7 pr-3 py-1.5">{banco.banco}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{montoConSigno(banco.real, moneda)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{montoConSigno(banco.necesario, moneda)}</td>
            </tr>
          ))}
        {fila('Total', saldos.total, true)}
      </tbody>
    </table>
  )
}

export function SucursalBloque({ sucursal, moneda }: { sucursal: ResumenSucursal; moneda: Moneda }) {
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-bold text-[#002868]">{sucursal.sucursal}</h3>
      <SaldosTabla saldos={sucursal.saldos} moneda={moneda} bancos={sucursal.bancos} />
      <div className="grid md:grid-cols-3 gap-3">
        {sucursal.dias.map((dia, indice) => {
          const neto = dia.ingresos - dia.egresos
          return (
            <div key={dia.fecha} className="rounded-xl border border-[#E0E0E0] overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 bg-[#EEF2FF] border-b">
                <span className="font-bold text-[#002868]">{ETIQUETAS_DIAS[indice]}</span>
                <span className="text-xs text-[#666]"> · {dia.fecha.split('-').reverse().join('/')}</span>
              </div>
              <div className="p-3 space-y-2 flex-1 max-h-64 overflow-y-auto">
                {dia.movimientos.length === 0 && <p className="text-sm text-[#999]">Sin movimientos</p>}
                {dia.movimientos.map(movimiento => (
                  <div key={movimiento.id} className="border-b pb-2 last:border-0">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="font-medium">{movimiento.descripcion || 'Sin descripción'}</span>
                      <b
                        className={`tabular-nums whitespace-nowrap ${movimiento.monto < 0 ? 'text-rose-700' : 'text-emerald-700'}`}
                      >
                        {movimiento.monto < 0 ? '−' : '+'}
                        {formatMonto(Math.abs(movimiento.monto), moneda)}
                      </b>
                    </div>
                    <span className="text-[11px] text-[#777]">
                      {movimiento.tipo_movimiento === 'efectivo'
                        ? 'Efectivo'
                        : `Banco${movimiento.banco ? ` · ${movimiento.banco}` : ''}`}
                      {' · '}
                      <span className={movimiento.estado === 'completado' ? 'text-emerald-700' : 'text-amber-700'}>
                        {movimiento.estado === 'completado' ? 'Realizado' : 'Programado'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 bg-[#F8F9FA] border-t text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Ingresos</span>
                  <b className="text-emerald-700">{formatMonto(dia.ingresos, moneda)}</b>
                </div>
                <div className="flex justify-between">
                  <span>Egresos</span>
                  <b className="text-rose-700">{formatMonto(dia.egresos, moneda)}</b>
                </div>
                <div className="flex justify-between pt-1 border-t text-sm">
                  <span>Neto del día</span>
                  <b className={colorSaldo(neto)}>{montoConSigno(neto, moneda)}</b>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
