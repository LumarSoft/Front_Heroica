'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, TableProperties } from 'lucide-react'
import { formatDimension, formatValorReporte } from '@/lib/ventas-reportes'
import { cn } from '@/lib/utils'
import type { ResultadoReporteVentas } from '@/lib/types'
import { VentasVariacion } from './VentasVariacion'

const TH = 'px-3 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#7A93BB] whitespace-nowrap'
const TD = 'px-3 py-2 text-sm text-[#1E293B] whitespace-nowrap'

/** Tabla del constructor: orden local por columna, totales y variación contra el período comparado. */
export function ReporteResultadoTable({ resultado }: { resultado: ResultadoReporteVentas }) {
  const [orden, setOrden] = useState<{ clave: string; asc: boolean } | null>(null)
  const metricas = resultado.columnas.filter(c => c.tipo !== 'dimension')
  const dimensiones = resultado.columnas.filter(c => c.tipo === 'dimension')
  const principal = metricas[0]
  const maximo = useMemo(
    () => Math.max(...resultado.filas.map(f => Math.abs(f.valores[principal?.clave] ?? 0)), 0),
    [resultado, principal],
  )
  const conVariacion = resultado.filas.some(f => f.variacion)

  const filas = useMemo(() => {
    if (!orden) return resultado.filas
    const esDimension = dimensiones.some(d => d.clave === orden.clave)
    return [...resultado.filas].sort((a, b) => {
      const r = esDimension
        ? (a.dimensiones[orden.clave] ?? '').localeCompare(b.dimensiones[orden.clave] ?? '', 'es', { numeric: true })
        : (a.valores[orden.clave] ?? -Infinity) - (b.valores[orden.clave] ?? -Infinity)
      return orden.asc ? r : -r
    })
  }, [resultado, orden, dimensiones])

  if (resultado.filas.length === 0) {
    return (
      <p className="py-14 text-center text-sm text-[#7A93BB] flex flex-col items-center gap-2">
        <TableProperties className="w-6 h-6" /> No hay ventas para esta combinación de período y filtros.
      </p>
    )
  }

  const encabezado = (clave: string, etiqueta: string, derecha: boolean) => (
    <th key={clave} className={cn(TH, derecha ? 'text-right' : 'text-left')}>
      <button
        type="button"
        onClick={() => setOrden(o => (o?.clave === clave ? { clave, asc: !o.asc } : { clave, asc: !derecha }))}
        className={cn(
          'inline-flex items-center gap-1 cursor-pointer hover:text-[#002868]',
          orden?.clave === clave && 'text-[#002868]',
        )}
      >
        {etiqueta}
        {orden?.clave === clave && (orden.asc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
      </button>
    </th>
  )

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full">
        <thead className="border-b border-[#EEF2FB] bg-[#F8FAFF]">
          <tr>
            {dimensiones.map(d => encabezado(d.clave, d.etiqueta, false))}
            {metricas.map(m => encabezado(m.clave, m.etiqueta, true))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2FB]">
          {filas.map((f, i) => (
            <tr key={i} className="hover:bg-[#F8FAFF]">
              {dimensiones.map((d, j) => (
                <td
                  key={d.clave}
                  className={cn(TD, j === 0 && 'font-medium', 'max-w-[280px] truncate')}
                  title={f.dimensiones[d.clave]}
                >
                  {formatDimension(d.clave, f.dimensiones[d.clave] ?? '')}
                  {j === dimensiones.length - 1 && principal && maximo > 0 && (
                    <div className="mt-1 h-1 rounded-full bg-[#EEF2FB] overflow-hidden max-w-[180px]">
                      <div
                        className="h-full bg-[#2F5BBD]"
                        style={{ width: `${(Math.abs(f.valores[principal.clave] ?? 0) / maximo) * 100}%` }}
                      />
                    </div>
                  )}
                </td>
              ))}
              {metricas.map(m => (
                <td key={m.clave} className={cn(TD, 'text-right tabular-nums', m === principal && 'font-semibold')}>
                  {formatValorReporte(m.tipo, f.valores[m.clave])}
                  {conVariacion && m.tipo !== 'porcentaje' && (
                    <span className="block">
                      <VentasVariacion valor={f.variacion?.[m.clave]} className="text-[11px]" />
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-[#D8E3F8] bg-[#EEF3FF]">
          <tr>
            {dimensiones.map((d, j) => (
              <td key={d.clave} className={cn(TD, 'font-bold text-[#002868]')}>
                {j === 0 ? 'Total' : ''}
              </td>
            ))}
            {metricas.map(m => (
              <td key={m.clave} className={cn(TD, 'text-right tabular-nums font-bold text-[#002868]')}>
                {formatValorReporte(m.tipo, resultado.totales[m.clave])}
                {resultado.variacionTotales && m.tipo !== 'porcentaje' && (
                  <span className="block">
                    <VentasVariacion valor={resultado.variacionTotales[m.clave]} className="text-[11px]" />
                  </span>
                )}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
