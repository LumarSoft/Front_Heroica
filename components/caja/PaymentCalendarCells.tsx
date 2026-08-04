'use client'

import { format, isToday } from 'date-fns'
import { TrendingDown, TrendingUp, Minus, Wallet, History } from 'lucide-react'
import type { Transaction } from '@/lib/types'
import { formatMonto } from '@/lib/formatters'
import { cn } from '@/lib/utils'

// =============================================
// Tipos compartidos con PaymentCalendar
// =============================================

export interface DayData {
  egresos: number
  ingresos: number
  items: Transaction[]
  /**
   * Movimientos que vencieron antes de hoy y siguen impagos, arrastrados a este día.
   * Solo se completa en el calendario de saldo necesario.
   */
  arrastrados?: number
  montoArrastrado?: number
}

export interface WeekTotals {
  egresos: number
  ingresos: number
  neto: number
}

// =============================================
// Sub-componente: celda de día
// =============================================

interface DayCellProps {
  date: Date
  data: DayData | undefined
  isCurrentMonth: boolean
  onClick: (date: Date) => void
  animationDelay: number
  saldoRealActual?: number
}

export function DayCell({ date, data, isCurrentMonth, onClick, animationDelay, saldoRealActual }: DayCellProps) {
  const today = isToday(date)
  const hasData = data && data.items.length > 0
  const neto = hasData ? data.ingresos - data.egresos : 0
  const esModoNecesario = saldoRealActual !== undefined
  const diferencia = esModoNecesario ? saldoRealActual - (data?.egresos ?? 0) : 0

  return (
    <div
      onClick={() => isCurrentMonth && onClick(date)}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={cn(
        'relative min-h-[110px] p-2.5 border border-[#E8EAED] rounded-xl transition-all duration-200 calendar-cell-enter',
        isCurrentMonth
          ? 'bg-white cursor-pointer hover:border-[#002868]/40 hover:shadow-md hover:-translate-y-0.5'
          : 'bg-[#F8F9FA] opacity-40 cursor-default',
        today && isCurrentMonth && 'ring-2 ring-[#002868] ring-offset-1',
      )}
    >
      {/*
        Número del día, cantidad de movimientos y —si corresponde— el indicador de
        vencidos arrastrados.

        El indicador va DENTRO de esta fila y no como bloque aparte: la grilla del
        calendario usa `items-start`, así que cada celda toma su altura natural y
        cualquier elemento extra hace que ese día quede más alto que el resto y
        desalinee la semana. Acá no suma altura.
      */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span
          className={cn(
            'text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0',
            today && isCurrentMonth ? 'bg-[#002868] text-white' : 'text-[#5A6070]',
          )}
        >
          {format(date, 'd')}
        </span>

        {hasData && (
          <span className="flex items-center gap-1 min-w-0">
            {(data.arrastrados ?? 0) > 0 && (
              <span
                className="flex items-center gap-0.5 px-1 py-px rounded bg-amber-100 text-amber-700 flex-shrink-0"
                title={
                  `${data.arrastrados} compromiso(s) con fecha anterior que siguen impagos y se ` +
                  `acumulan en el día de hoy. La plata queda reservada hasta que el pago se efectivice.`
                }
              >
                <History className="w-2.5 h-2.5" />
                <span className="text-[10px] font-bold leading-none">{data.arrastrados}</span>
              </span>
            )}
            <span className="text-[11px] text-[#9AA0AC] font-medium truncate">{data.items.length} mov.</span>
          </span>
        )}
      </div>

      {/* Datos financieros */}
      {hasData && esModoNecesario && (
        <div className="space-y-1 mt-1.5">
          {data.egresos > 0 && (
            <div className="flex items-center gap-1 min-w-0">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-rose-600 truncate">Sale {formatMonto(data.egresos)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 min-w-0">
            <Wallet className="w-3.5 h-3.5 text-[#7A93BB] flex-shrink-0" />
            <span className="text-[11px] font-medium text-[#5A6070] truncate">
              Real {formatMonto(saldoRealActual!)}
            </span>
          </div>
          <div className="flex items-center gap-1 pt-1 border-t border-[#E8EAED] min-w-0">
            {diferencia >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            )}
            <span className={cn('text-xs font-bold truncate', diferencia >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {diferencia >= 0 ? `Sobra ${formatMonto(diferencia)}` : `Falta ${formatMonto(Math.abs(diferencia))}`}
            </span>
          </div>
        </div>
      )}

      {hasData && !esModoNecesario && (
        <div className="space-y-1 mt-1.5">
          {data.egresos > 0 && (
            <div className="flex items-center gap-1 min-w-0">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-rose-600 truncate">{formatMonto(data.egresos)}</span>
            </div>
          )}
          {data.ingresos > 0 && (
            <div className="flex items-center gap-1 min-w-0">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-emerald-600 truncate">{formatMonto(data.ingresos)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 pt-1 border-t border-[#E8EAED] min-w-0">
            <Minus className="w-3.5 h-3.5 text-[#002868] flex-shrink-0" />
            <span className={cn('text-xs font-bold truncate', neto >= 0 ? 'text-[#002868]' : 'text-amber-600')}>
              {formatMonto(neto)}
            </span>
          </div>
        </div>
      )}

      {!hasData && isCurrentMonth && (
        <div className="flex items-center justify-center h-12 opacity-20">
          <Minus className="w-4 h-4 text-[#9AA0AC]" />
        </div>
      )}
    </div>
  )
}

// =============================================
// Sub-componente: columna de totales semanales
// =============================================

export function WeekTotalsCell({ totals, saldoRealActual }: { totals: WeekTotals; saldoRealActual?: number }) {
  if (saldoRealActual !== undefined) {
    const diferencia = saldoRealActual - totals.egresos
    return (
      <div className="hidden sm:flex flex-col justify-center gap-1 px-3 py-2 bg-[#F0F4FF] rounded-xl border border-[#002868]/10 w-full overflow-hidden">
        <p className="text-[9px] font-bold text-[#002868]/60 uppercase tracking-wider mb-0.5">Semana</p>
        {totals.egresos > 0 && (
          <div className="flex items-center gap-1 min-w-0">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-rose-600 truncate">Sale {formatMonto(totals.egresos)}</span>
          </div>
        )}
        <div className="flex items-center gap-1 min-w-0">
          <Wallet className="w-3.5 h-3.5 text-[#7A93BB] flex-shrink-0" />
          <span className="text-[11px] font-medium text-[#5A6070] truncate">Real {formatMonto(saldoRealActual)}</span>
        </div>
        <div className="flex items-center gap-1 pt-0.5 border-t border-[#002868]/10 min-w-0">
          {diferencia >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
          )}
          <span className={cn('text-xs font-bold truncate', diferencia >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
            {diferencia >= 0 ? `Sobra ${formatMonto(diferencia)}` : `Falta ${formatMonto(Math.abs(diferencia))}`}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="hidden sm:flex flex-col justify-center gap-1 px-3 py-2 bg-[#F0F4FF] rounded-xl border border-[#002868]/10 w-full overflow-hidden">
      <p className="text-[9px] font-bold text-[#002868]/60 uppercase tracking-wider mb-0.5">Semana</p>
      {totals.egresos > 0 && (
        <div className="flex items-center gap-1 min-w-0">
          <TrendingDown className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-rose-600 truncate">{formatMonto(totals.egresos)}</span>
        </div>
      )}
      {totals.ingresos > 0 && (
        <div className="flex items-center gap-1 min-w-0">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-emerald-600 truncate">{formatMonto(totals.ingresos)}</span>
        </div>
      )}
      <div className="flex items-center gap-1 pt-0.5 border-t border-[#002868]/10 min-w-0">
        <Minus className="w-3.5 h-3.5 text-[#002868] flex-shrink-0" />
        <span className={cn('text-xs font-bold truncate', totals.neto >= 0 ? 'text-[#002868]' : 'text-amber-600')}>
          {formatMonto(totals.neto)}
        </span>
      </div>
    </div>
  )
}
