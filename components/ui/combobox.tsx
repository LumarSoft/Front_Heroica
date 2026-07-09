'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronsUpDown, Search, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  /** Si se provee, muestra una opción "Crear X" cuando el texto no tiene match exacto */
  onCreateOption?: (label: string) => void
  /** Texto a mostrar en el trigger cuando hay un valor pendiente de creación (sin ID aún) */
  pendingLabel?: string
  /**
   * Si es true, el menú se despliega como overlay flotante (portal, posición fija) en
   * lugar de expandirse en el flujo del documento. Evita que empuje el layout hacia abajo
   * y que sea recortado por contenedores con overflow (p. ej. tablas).
   */
  overlay?: boolean
  /** Abre el menú automáticamente al montar (útil para edición en línea estilo Excel). */
  autoOpen?: boolean
  /** Se dispara cuando el menú se cierra (por Escape, click afuera o selección). */
  onClose?: () => void
}

interface MenuCoords {
  top: number
  left: number
  width: number
}

/** Ancho mínimo del menú desplegable en modo overlay (px) */
const MENU_MIN_WIDTH = 240

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Seleccione una opción',
  searchPlaceholder = 'Buscar...',
  emptyText = 'Sin resultados',
  disabled = false,
  className,
  onCreateOption,
  pendingLabel,
  overlay = false,
  autoOpen = false,
  onClose,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const [coords, setCoords] = React.useState<MenuCoords | null>(null)

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  const selected = options.find(o => o.value === value)

  // Mostrar "Crear X" solo si hay texto y no existe un match exacto
  const trimmedSearch = search.trim()
  const hasExactMatch = options.some(o => o.label.toLowerCase() === trimmedSearch.toLowerCase())
  const showCreate = onCreateOption && trimmedSearch.length > 0 && !hasExactMatch

  const recomputeCoords = React.useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    // El menú nunca es más angosto que MENU_MIN_WIDTH (evita dropdowns diminutos en
    // celdas de tabla estrechas). Además se reubica para no salirse del viewport.
    const menuWidth = Math.max(rect.width, MENU_MIN_WIDTH)
    const maxLeft = window.innerWidth - menuWidth - 8
    const left = Math.max(8, Math.min(rect.left, maxLeft))
    setCoords({ top: rect.bottom + 4, left, width: menuWidth })
  }, [])

  const handleOpen = () => {
    if (disabled) return
    if (overlay) recomputeCoords()
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 20)
  }

  const closeMenu = React.useCallback(() => {
    setOpen(false)
    setSearch('')
    onClose?.()
  }, [onClose])

  // Apertura automática al montar (edición en línea)
  const didAutoOpen = React.useRef(false)
  React.useEffect(() => {
    if (!autoOpen || didAutoOpen.current) return
    didAutoOpen.current = true
    if (overlay) recomputeCoords()
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 20)
  }, [autoOpen, overlay, recomputeCoords])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue === value ? '' : optionValue)
    closeMenu()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    closeMenu()
  }

  const handleCreate = () => {
    if (!onCreateOption || !trimmedSearch) return
    onCreateOption(trimmedSearch)
    closeMenu()
  }

  // Teclado del input de búsqueda: Escape cierra, Enter elige la 1ra coincidencia
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeMenu()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered.length > 0) handleSelect(filtered[0].value)
      else if (showCreate) handleCreate()
    }
  }

  // Reposicionar/cerrar el overlay ante scroll o resize
  React.useEffect(() => {
    if (!open || !overlay) return
    recomputeCoords()
    const onScroll = () => recomputeCoords()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, overlay, recomputeCoords, closeMenu])

  // Contenido del menú (input de búsqueda + lista), reutilizado en ambos modos
  const menu = (
    <>
      <div className="flex items-center gap-2 px-3 h-10 border-b border-[#E0E0E0]">
        <Search className="h-4 w-4 text-[#8A8F9C] shrink-0" />
        <input
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={searchPlaceholder}
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#8A8F9C] text-[#1A1A1A]"
        />
        <button type="button" onClick={closeMenu} className="text-[#8A8F9C] hover:text-[#1A1A1A] transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto py-1">
        {filtered.length === 0 && !showCreate ? (
          <p className="py-4 text-center text-sm text-[#8A8F9C]">{emptyText}</p>
        ) : (
          filtered.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors cursor-pointer',
                'hover:bg-[#EEF3FF] hover:text-[#002868]',
                value === option.value && 'bg-[#EEF3FF] text-[#002868] font-medium',
              )}
            >
              <Check
                className={cn('h-4 w-4 shrink-0', value === option.value ? 'opacity-100 text-[#002868]' : 'opacity-0')}
              />
              <span className="truncate">{option.label}</span>
            </button>
          ))
        )}

        {showCreate && (
          <button
            type="button"
            onClick={handleCreate}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors cursor-pointer border-t border-dashed border-[#E0E0E0] mt-1 pt-2 text-[#002868] hover:bg-[#EEF3FF] font-medium"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="truncate">Crear &quot;{trimmedSearch}&quot;</span>
          </button>
        )}
      </div>
    </>
  )

  // Modo inline (comportamiento original): el menú reemplaza al trigger en el flujo
  if (open && !overlay) {
    return (
      <div
        className={cn(
          'rounded-lg border border-[#002868] ring-2 ring-[#002868]/20 bg-white overflow-hidden',
          className,
        )}
      >
        {menu}
      </div>
    )
  }

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      disabled={disabled}
      onClick={handleOpen}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-sm transition-colors',
        'hover:border-[#002868] focus:outline-none focus:ring-2 focus:ring-[#002868]/20 focus:border-[#002868]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-[#FAFAFA]',
        open && 'border-[#002868] ring-2 ring-[#002868]/20',
        selected ? 'text-[#1A1A1A]' : 'text-[#8A8F9C]',
        className,
      )}
    >
      <span className={cn('truncate', selected || pendingLabel ? 'text-[#1A1A1A]' : 'text-[#8A8F9C]')}>
        {selected ? (
          selected.label
        ) : pendingLabel ? (
          <>
            <span className="text-[#002868] font-semibold text-xs mr-1.5 bg-[#EEF3FF] px-1.5 py-0.5 rounded">
              Nueva
            </span>
            {pendingLabel}
          </>
        ) : (
          placeholder
        )}
      </span>
      <div className="flex items-center gap-1 ml-2 shrink-0">
        {selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={e => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
            className="text-[#8A8F9C] hover:text-[#1A1A1A] transition-colors rounded p-0.5 hover:bg-gray-100"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronsUpDown className="h-4 w-4 text-[#8A8F9C]" />
      </div>
    </button>
  )

  return (
    <>
      {trigger}
      {open &&
        overlay &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Backdrop para capturar clicks fuera */}
            <div className="fixed inset-0 z-[60]" onMouseDown={closeMenu} />
            <div
              className="fixed z-[61] rounded-lg border border-[#002868] bg-white shadow-xl ring-2 ring-[#002868]/20 overflow-hidden"
              style={{ top: coords.top, left: coords.left, width: coords.width }}
              onMouseDown={e => e.stopPropagation()}
            >
              {menu}
            </div>
          </>,
          document.body,
        )}
    </>
  )
}
