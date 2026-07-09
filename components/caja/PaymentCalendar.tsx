'use client'

import { useMemo, useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  addMonths,
  subMonths,
  isSameMonth,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Minus, Wallet } from 'lucide-react'
import type { Transaction } from '@/lib/types'
import type { ColumnDef } from '@/components/caja/TransactionTable'
import { TransactionTable } from '@/components/caja/TransactionTable'
import { DayCell, WeekTotalsCell, type DayData, type WeekTotals } from '@/components/caja/PaymentCalendarCells'
import { formatMonto } from '@/lib/formatters'
import { cn } from '@/lib/utils'

// =============================================
// Tipos internos
// =============================================

interface PaymentCalendarProps {
  transactions: Transaction[]
  columns: ColumnDef[]
  onViewDetails: (t: Transaction) => void
  onChangeState?: (t: Transaction) => void
  onDelete?: (t: Transaction) => void
  onToggleDeuda?: (t: Transaction) => void
  onMove?: (t: Transaction) => void
  onBulkDelete?: (ids: number[]) => void
  onBulkMove?: (ids: number[]) => void
  isReadOnly?: boolean
  title: string
  description: string
  /**
   * Saldo real actual (suma de movimientos completados). Cuando se pasa, el calendario
   * cambia a modo "Saldo Necesario": por día/semana/mes muestra cuánto va a salir y lo
   * compara contra este saldo, mostrando cuánto sobra o cuánto falta para cubrirlo.
   */
  saldoRealActual?: number
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function getISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

// =============================================
// Componente principal
// =============================================

export function PaymentCalendar({
  transactions,
  columns,
  onViewDetails,
  onChangeState,
  onDelete,
  onToggleDeuda,
  onMove,
  onBulkDelete,
  onBulkMove,
  isReadOnly,
  title,
  description,
  saldoRealActual,
}: PaymentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDir, setTransitionDir] = useState<'in' | 'out'>('in')

  // Agrupar transactions por fecha ISO
  const dayMap = useMemo(() => {
    const map = new Map<string, DayData>()
    for (const t of transactions) {
      const datePart = t.fecha?.includes('T') ? t.fecha.split('T')[0] : t.fecha
      if (!datePart) continue
      const existing = map.get(datePart) ?? { egresos: 0, ingresos: 0, items: [] }
      const monto = typeof t.monto === 'string' ? parseFloat(t.monto) : (t.monto ?? 0)
      if (t.tipo === 'egreso') {
        existing.egresos += Math.abs(monto)
      } else {
        existing.ingresos += Math.abs(monto)
      }
      existing.items.push(t)
      map.set(datePart, existing)
    }
    return map
  }, [transactions])

  // Calcular semanas del mes actual
  const weeks = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })

    // getDay retorna 0=Dom..6=Sáb; necesitamos 0=Lun..6=Dom
    const firstDayOfWeek = (getDay(start) + 6) % 7

    // Rellenar días anteriores al primer día del mes
    const paddedDays: (Date | null)[] = [...Array(firstDayOfWeek).fill(null), ...days]

    // Rellenar hasta completar la última semana
    while (paddedDays.length % 7 !== 0) {
      paddedDays.push(null)
    }

    // Dividir en semanas de 7 días
    const result: (Date | null)[][] = []
    for (let i = 0; i < paddedDays.length; i += 7) {
      result.push(paddedDays.slice(i, i + 7))
    }
    return result
  }, [currentMonth])

  // Totales globales del mes
  const monthTotals = useMemo(() => {
    let egresos = 0
    let ingresos = 0
    const monthStart = getISODate(startOfMonth(currentMonth))
    const monthEnd = getISODate(endOfMonth(currentMonth))
    dayMap.forEach((data, dateStr) => {
      if (dateStr >= monthStart && dateStr <= monthEnd) {
        egresos += data.egresos
        ingresos += data.ingresos
      }
    })
    return { egresos, ingresos, neto: ingresos - egresos }
  }, [dayMap, currentMonth])

  // Transactions del día seleccionado
  const selectedDayTransactions = useMemo(() => {
    if (!selectedDay) return []
    return dayMap.get(getISODate(selectedDay))?.items ?? []
  }, [dayMap, selectedDay])

  function handleDayClick(date: Date) {
    setTransitionDir('in')
    setIsTransitioning(true)
    setTimeout(() => {
      setSelectedDay(date)
      setIsTransitioning(false)
    }, 150)
  }

  function handleBack() {
    setTransitionDir('out')
    setIsTransitioning(true)
    setTimeout(() => {
      setSelectedDay(null)
      setIsTransitioning(false)
    }, 150)
  }

  function handlePrevMonth() {
    setCurrentMonth(m => subMonths(m, 1))
  }

  function handleNextMonth() {
    setCurrentMonth(m => addMonths(m, 1))
  }

  // ====================================================
  // NIVEL 2: Vista de día seleccionado
  // ====================================================
  if (selectedDay) {
    const dayLabel = format(selectedDay, "EEEE d 'de' MMMM yyyy", { locale: es })
    const capitalDayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)
    const selectedDayData = dayMap.get(getISODate(selectedDay))
    const selectedDayNeto = selectedDayData ? selectedDayData.ingresos - selectedDayData.egresos : 0
    const selectedDayDiferencia = saldoRealActual !== undefined ? saldoRealActual - (selectedDayData?.egresos ?? 0) : 0

    return (
      <div
        className={cn(
          'transition-all duration-150',
          isTransitioning
            ? transitionDir === 'in'
              ? 'opacity-0 translate-x-4'
              : 'opacity-0 -translate-x-4'
            : 'opacity-100 translate-x-0',
        )}
      >
        {/* Botón Volver */}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-sm font-semibold text-[#002868] hover:text-[#002868]/70 transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver al mes
        </button>

        {/* Título del día */}
        <div className="mb-4 px-4 py-3 bg-[#F0F4FF] rounded-xl border border-[#002868]/10">
          <p className="text-xs font-bold text-[#002868]/60 uppercase tracking-wider mb-0.5">Detalle del día</p>
          <p className="text-base font-bold text-[#002868]">{capitalDayLabel}</p>
          {selectedDayTransactions.length > 0 && selectedDayData && saldoRealActual !== undefined && (
            <div className="flex flex-wrap gap-4 mt-2">
              {selectedDayData.egresos > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Sale {formatMonto(selectedDayData.egresos)}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs font-medium text-[#5A6070]">
                <Wallet className="w-3.5 h-3.5" />
                Real: {formatMonto(saldoRealActual)}
              </span>
              <span
                className={cn(
                  'flex items-center gap-1 text-xs font-bold',
                  selectedDayDiferencia >= 0 ? 'text-emerald-600' : 'text-rose-600',
                )}
              >
                {selectedDayDiferencia >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {selectedDayDiferencia >= 0
                  ? `Sobra ${formatMonto(selectedDayDiferencia)}`
                  : `Falta ${formatMonto(Math.abs(selectedDayDiferencia))}`}
              </span>
            </div>
          )}

          {selectedDayTransactions.length > 0 && selectedDayData && saldoRealActual === undefined && (
            <div className="flex flex-wrap gap-4 mt-2">
              {selectedDayData.egresos > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {formatMonto(selectedDayData.egresos)}
                </span>
              )}
              {selectedDayData.ingresos > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {formatMonto(selectedDayData.ingresos)}
                </span>
              )}
              <span
                className={cn(
                  'flex items-center gap-1 text-xs font-bold',
                  selectedDayNeto >= 0 ? 'text-[#002868]' : 'text-amber-600',
                )}
              >
                <Minus className="w-3.5 h-3.5" />
                Neto: {formatMonto(selectedDayNeto)}
              </span>
            </div>
          )}
        </div>

        {/* Tabla de transacciones del día */}
        <TransactionTable
          title={`${title} — ${format(selectedDay, 'd/MM/yyyy')}`}
          description={
            selectedDayTransactions.length > 0
              ? `${selectedDayTransactions.length} movimiento${selectedDayTransactions.length !== 1 ? 's' : ''} del día`
              : 'Sin movimientos para este día'
          }
          transactions={selectedDayTransactions}
          columns={columns}
          onViewDetails={onViewDetails}
          onChangeState={onChangeState}
          onDelete={onDelete}
          onToggleDeuda={onToggleDeuda}
          onMove={onMove}
          onBulkDelete={onBulkDelete}
          onBulkMove={onBulkMove}
          isReadOnly={isReadOnly}
        />
      </div>
    )
  }

  // ====================================================
  // NIVEL 1: Vista de mes
  // ====================================================
  return (
    <div
      className={cn(
        'transition-all duration-150',
        isTransitioning ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0',
      )}
    >
      {/* Card contenedor */}
      <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm overflow-hidden">
        {/* Header del calendario */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-[#E8EAED] bg-gradient-to-r from-[#F8F9FA] to-white">
          <div>
            <h2 className="text-base font-bold text-[#1A1A1A]">{title}</h2>
            <p className="text-xs text-[#5A6070] mt-0.5">{description}</p>
          </div>

          {/* Navegación de mes */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E0E0E0] bg-white hover:bg-[#F0F4FF] hover:border-[#002868]/40 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-[#5A6070]" />
            </button>
            <span className="text-sm font-bold text-[#1A1A1A] min-w-[140px] text-center capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E0E0E0] bg-white hover:bg-[#F0F4FF] hover:border-[#002868]/40 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-[#5A6070]" />
            </button>
          </div>

          {/* Totales del mes */}
          <div className="hidden lg:flex items-center gap-4 text-xs">
            {saldoRealActual !== undefined ? (
              <>
                {monthTotals.egresos > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-rose-600">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Sale {formatMonto(monthTotals.egresos)}
                  </span>
                )}
                <span className="flex items-center gap-1 font-medium text-[#5A6070]">
                  <Wallet className="w-3.5 h-3.5" />
                  Real: {formatMonto(saldoRealActual)}
                </span>
                <span
                  className={cn(
                    'flex items-center gap-1 font-bold',
                    saldoRealActual - monthTotals.egresos >= 0 ? 'text-emerald-600' : 'text-rose-600',
                  )}
                >
                  {saldoRealActual - monthTotals.egresos >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {saldoRealActual - monthTotals.egresos >= 0
                    ? `Sobra ${formatMonto(saldoRealActual - monthTotals.egresos)}`
                    : `Falta ${formatMonto(Math.abs(saldoRealActual - monthTotals.egresos))}`}
                </span>
              </>
            ) : (
              <>
                {monthTotals.egresos > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-rose-600">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {formatMonto(monthTotals.egresos)}
                  </span>
                )}
                {monthTotals.ingresos > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {formatMonto(monthTotals.ingresos)}
                  </span>
                )}
                <span
                  className={cn(
                    'flex items-center gap-1 font-bold',
                    monthTotals.neto >= 0 ? 'text-[#002868]' : 'text-amber-600',
                  )}
                >
                  <Minus className="w-3.5 h-3.5" />
                  {formatMonto(monthTotals.neto)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="p-4">
          {/* Headers de días de la semana */}
          <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: 'repeat(7, 1fr) 140px' }}>
            {DAY_NAMES.map(name => (
              <div
                key={name}
                className="text-center text-[10px] font-bold text-[#9AA0AC] uppercase tracking-wider py-1"
              >
                {name}
              </div>
            ))}
            <div className="hidden sm:block text-[10px] font-bold text-[#002868]/50 uppercase tracking-wider py-1 px-3 text-center">
              Total
            </div>
          </div>

          {/* Semanas */}
          <div className="space-y-1">
            {weeks.map((week, weekIdx) => {
              // Calcular totales de la semana
              const weekTotals: WeekTotals = { egresos: 0, ingresos: 0, neto: 0 }
              let weekHasData = false
              week.forEach(day => {
                if (!day || !isSameMonth(day, currentMonth)) return
                const data = dayMap.get(getISODate(day))
                if (data) {
                  weekTotals.egresos += data.egresos
                  weekTotals.ingresos += data.ingresos
                  weekHasData = true
                }
              })
              weekTotals.neto = weekTotals.ingresos - weekTotals.egresos

              return (
                <div
                  key={weekIdx}
                  className="grid gap-1 items-start"
                  style={{ gridTemplateColumns: 'repeat(7, 1fr) 140px' }}
                >
                  {week.map((day, dayIdx) => {
                    const globalIdx = weekIdx * 7 + dayIdx
                    if (!day) {
                      return (
                        <div
                          key={`empty-${weekIdx}-${dayIdx}`}
                          className="min-h-[110px] rounded-xl bg-[#F8F9FA]/50 border border-dashed border-[#E8EAED]"
                        />
                      )
                    }
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    return (
                      <DayCell
                        key={getISODate(day)}
                        date={day}
                        data={dayMap.get(getISODate(day))}
                        isCurrentMonth={isCurrentMonth}
                        onClick={handleDayClick}
                        animationDelay={globalIdx * 20}
                        saldoRealActual={saldoRealActual}
                      />
                    )
                  })}
                  {/* Columna totales semanales */}
                  <div className="flex items-stretch min-h-[110px]">
                    {weekHasData ? (
                      <WeekTotalsCell totals={weekTotals} saldoRealActual={saldoRealActual} />
                    ) : (
                      <div className="hidden sm:block min-h-[110px] rounded-xl bg-transparent" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Leyenda inferior */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-3 border-t border-[#E8EAED] bg-[#F8F9FA]">
          {saldoRealActual !== undefined ? (
            <>
              <div className="flex items-center gap-1.5 text-xs text-[#5A6070]">
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                <span>Sale</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#5A6070]">
                <Wallet className="w-3.5 h-3.5 text-[#7A93BB]" />
                <span>Saldo real actual</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#5A6070]">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>Sobra / Falta</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-xs text-[#5A6070]">
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                <span>Egresos</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#5A6070]">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>Ingresos</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#5A6070]">
                <Minus className="w-3.5 h-3.5 text-[#002868]" />
                <span>Neto</span>
              </div>
            </>
          )}
          <span className="text-xs text-[#9AA0AC] ml-auto">Hacé click en un día para ver el detalle</span>
        </div>
      </div>
    </div>
  )
}
