'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, ChevronDown, Clock, FilterX, Landmark, LayoutList, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { SelectOption } from '@/lib/types'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'

interface EndDateFilterProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  onLimpiar: () => void
  hayFiltro: boolean
  bancos?: SelectOption[]
  bancosSeleccionados?: string[]
  onBancosChange?: (ids: string[]) => void
  searchText?: string
  onSearchTextChange?: (text: string) => void
  viewMode?: 'tabla' | 'calendario'
  onViewModeChange?: (mode: 'tabla' | 'calendario') => void
  filtroDeuda?: 'todos' | 'solo_deudas' | 'sin_deudas'
  onFiltroDeudeChange?: (v: 'todos' | 'solo_deudas' | 'sin_deudas') => void
}

export function EndDateFilter({
  dateRange,
  onDateRangeChange,
  onLimpiar,
  hayFiltro,
  bancos,
  bancosSeleccionados = [],
  onBancosChange,
  searchText = '',
  onSearchTextChange,
  viewMode = 'tabla',
  onViewModeChange,
  filtroDeuda = 'todos',
  onFiltroDeudeChange,
}: EndDateFilterProps) {
  const showBancoFilter = Boolean(bancos?.length && onBancosChange)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const bancosSeleccionadosSet = useMemo(() => new Set(bancosSeleccionados), [bancosSeleccionados])

  const handleFromSelect = (day: Date | undefined) => {
    const to = dateRange?.to
    // Si el 'desde' es posterior al 'hasta', resetear hasta
    if (day && to && day > to) {
      onDateRangeChange({ from: day, to: undefined })
    } else {
      onDateRangeChange({ from: day, to })
    }
  }

  const handleToSelect = (day: Date | undefined) => {
    onDateRangeChange({ from: dateRange?.from, to: day })
  }

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const toggleBanco = (id: string) => {
    if (!onBancosChange) return
    const next = new Set(bancosSeleccionados)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onBancosChange(Array.from(next))
  }

  const bancosLabel = useMemo(() => {
    if (!bancos?.length || bancosSeleccionadosSet.size === 0) return 'Todos los bancos'
    const names = bancos.filter(b => bancosSeleccionadosSet.has(b.id.toString())).map(b => b.nombre)
    if (names.length <= 2) return names.join(', ')
    return `${names.length} seleccionados`
  }, [bancos, bancosSeleccionadosSet])

  const triggerClass = cn(
    'h-9 min-w-[150px] justify-start text-left font-normal rounded-lg border border-[#E0E0E0] bg-[#F8F9FA] px-3 text-sm flex items-center gap-2 transition-all hover:bg-white hover:border-[#002868]/60 hover:shadow-sm cursor-pointer',
  )

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 bg-white rounded-xl border border-[#E0E0E0] shadow-sm mb-6">
      {/* Row 1: Date range + banco filter + view toggle */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Date range — always on one line */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold text-[#5A6070] uppercase tracking-wide whitespace-nowrap hidden xs:block">Desde</span>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className={cn(triggerClass, 'flex-1 min-w-0 max-w-[140px] sm:max-w-[160px]')}>
                <CalendarDays className="w-4 h-4 text-[#002868] flex-shrink-0" />
                <span className={cn('truncate text-xs sm:text-sm', dateRange?.from ? 'text-[#1A1A1A] font-medium' : 'text-[#9AA0AC]')}>
                  {dateRange?.from ? format(dateRange.from, 'd MMM yy', { locale: es }) : 'Desde'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange?.from}
                onSelect={handleFromSelect}
                disabled={date => (dateRange?.to ? date > dateRange.to : false)}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>

          <span className="text-[#D0D0D0] text-base font-light select-none flex-shrink-0">→</span>

          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className={cn(triggerClass, 'flex-1 min-w-0 max-w-[140px] sm:max-w-[160px]')}>
                <CalendarDays className="w-4 h-4 text-[#002868] flex-shrink-0" />
                <span className={cn('truncate text-xs sm:text-sm', dateRange?.to ? 'text-[#1A1A1A] font-medium' : 'text-[#9AA0AC]')}>
                  {dateRange?.to ? format(dateRange.to, 'd MMM yy', { locale: es }) : 'Hasta'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange?.to}
                onSelect={handleToSelect}
                disabled={date => (dateRange?.from ? date < dateRange.from : false)}
                defaultMonth={dateRange?.from ?? dateRange?.to}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Filtro Banco */}
        {showBancoFilter && (
          <div ref={containerRef} className="relative flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-[#002868] flex-shrink-0" />
            <button
              type="button"
              onClick={() => setIsOpen(p => !p)}
              className="h-9 min-w-[120px] sm:min-w-[150px] rounded-lg border border-[#E0E0E0] bg-[#F8F9FA] hover:bg-white px-3 text-sm text-[#1A1A1A] flex items-center justify-between gap-2 cursor-pointer transition-all hover:border-[#B0B0B0]"
            >
              <span className="truncate text-xs sm:text-sm">{bancosLabel}</span>
              <ChevronDown
                className={`w-4 h-4 text-[#5A6070] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="absolute top-full left-0 mt-2 w-full min-w-[220px] bg-white border border-[#E0E0E0] rounded-xl shadow-xl p-2 z-50">
                <div className="max-h-52 overflow-y-auto">
                  {bancos?.map(banco => {
                    const id = banco.id.toString()
                    return (
                      <label
                        key={banco.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F5F6F8] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={bancosSeleccionadosSet.has(id)}
                          onChange={() => toggleBanco(id)}
                          className="h-4 w-4 rounded border-[#E0E0E0] accent-[#002868] cursor-pointer"
                        />
                        <span className="text-sm font-medium text-[#1A1A1A] truncate">{banco.nombre}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toggle Tabla / Calendario */}
        {onViewModeChange && (
          <div className="flex items-center gap-0.5 p-0.5 bg-[#F0F4FF] rounded-lg border border-[#002868]/15 ml-auto">
            <button
              type="button"
              onClick={() => onViewModeChange('tabla')}
              className={cn(
                'flex items-center gap-1.5 h-7 px-2 sm:px-3 rounded-md text-xs font-semibold transition-all',
                viewMode === 'tabla'
                  ? 'bg-[#002868] text-white shadow-sm'
                  : 'text-[#5A6070] hover:text-[#002868] hover:bg-white/60',
              )}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('calendario')}
              className={cn(
                'flex items-center gap-1.5 h-7 px-2 sm:px-3 rounded-md text-xs font-semibold transition-all',
                viewMode === 'calendario'
                  ? 'bg-[#002868] text-white shadow-sm'
                  : 'text-[#5A6070] hover:text-[#002868] hover:bg-white/60',
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendario</span>
            </button>
          </div>
        )}
      </div>

      {/* Row 2: Search + filtro deuda + limpiar */}
      {(onSearchTextChange || onFiltroDeudeChange) && (
        <div className="flex flex-wrap items-center gap-2">
          {onSearchTextChange && (
            <div className="relative flex items-center flex-1 min-w-[160px]">
              <Search className="absolute left-3 w-4 h-4 text-[#9AA0AC] pointer-events-none" />
              <input
                type="text"
                value={searchText}
                onChange={e => onSearchTextChange(e.target.value)}
                placeholder="Buscar descripción, monto o #cheque..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E0E0E0] bg-[#F8F9FA] text-sm text-[#1A1A1A] placeholder:text-[#9AA0AC] outline-none focus:border-[#002868]/60 focus:bg-white transition-all"
              />
            </div>
          )}
          {onFiltroDeudeChange && (
            <div className="flex items-center gap-0.5 p-0.5 bg-[#FFF8F0] rounded-lg border border-orange-200 flex-shrink-0">
              {(
                [
                  { value: 'todos' as const, label: 'Todos', shortLabel: 'All', showIcon: false },
                  { value: 'solo_deudas' as const, label: 'Solo deudas', shortLabel: 'Deudas', showIcon: true },
                  { value: 'sin_deudas' as const, label: 'Sin deudas', shortLabel: 'S/D', showIcon: false },
                ]
              ).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onFiltroDeudeChange(opt.value)}
                  className={cn(
                    'flex items-center gap-1 h-7 px-2 sm:px-3 rounded-md text-xs font-semibold transition-all',
                    filtroDeuda === opt.value
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-orange-700 hover:text-orange-800 hover:bg-orange-100/60',
                  )}
                >
                  {opt.showIcon && <Clock className="w-3 h-3 flex-shrink-0" />}
                  <span className="hidden sm:inline">{opt.label}</span>
                  <span className="sm:hidden">{opt.shortLabel}</span>
                </button>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            onClick={onLimpiar}
            disabled={!hayFiltro}
            className={cn(
              'h-9 px-3 flex items-center gap-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex-shrink-0',
              hayFiltro
                ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                : 'text-transparent pointer-events-none select-none',
            )}
            aria-hidden={!hayFiltro}
          >
            <FilterX className="w-4 h-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </Button>
        </div>
      )}

      {/* Botón Limpiar (cuando no hay buscador ni filtro deuda) */}
      {!onSearchTextChange && !onFiltroDeudeChange && hayFiltro && (
        <Button
          variant="ghost"
          onClick={onLimpiar}
          className="h-9 px-4 text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-2 rounded-lg font-semibold transition-colors cursor-pointer self-start"
        >
          <FilterX className="w-4 h-4" />
          Limpiar
        </Button>
      )}
    </div>
  )
}
