'use client'

import * as React from 'react'
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
}

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
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  )
  const selected = options.find(o => o.value === value)

  // Mostrar "Crear X" solo si hay texto y no existe un match exacto
  const trimmedSearch = search.trim()
  const hasExactMatch = options.some(
    o => o.label.toLowerCase() === trimmedSearch.toLowerCase(),
  )
  const showCreate = onCreateOption && trimmedSearch.length > 0 && !hasExactMatch

  const handleOpen = () => {
    if (disabled) return
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 20)
  }

  const handleSelect = (optionValue: string) => {
    onChange(optionValue === value ? '' : optionValue)
    setOpen(false)
    setSearch('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setOpen(false)
    setSearch('')
  }

  const handleCreate = () => {
    if (!onCreateOption || !trimmedSearch) return
    onCreateOption(trimmedSearch)
    setOpen(false)
    setSearch('')
  }

  // Cerrar con Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setSearch('')
    }
  }

  if (open) {
    return (
      <div
        className={cn(
          'rounded-lg border border-[#002868] ring-2 ring-[#002868]/20 bg-white overflow-hidden',
          className,
        )}
      >
        {/* Input de búsqueda */}
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
          <button
            type="button"
            onClick={() => { setOpen(false); setSearch('') }}
            className="text-[#8A8F9C] hover:text-[#1A1A1A] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Lista */}
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
                  className={cn(
                    'h-4 w-4 shrink-0',
                    value === option.value ? 'opacity-100 text-[#002868]' : 'opacity-0',
                  )}
                />
                <span className="truncate">{option.label}</span>
              </button>
            ))
          )}

          {/* Opción "Crear X" */}
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
      </div>
    )
  }

  return (
    <button
      type="button"
      role="combobox"
      aria-expanded={false}
      aria-haspopup="listbox"
      disabled={disabled}
      onClick={handleOpen}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-sm transition-colors',
        'hover:border-[#002868] focus:outline-none focus:ring-2 focus:ring-[#002868]/20 focus:border-[#002868]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-[#FAFAFA]',
        selected ? 'text-[#1A1A1A]' : 'text-[#8A8F9C]',
        className,
      )}
    >
      <span className={cn('truncate', (selected || pendingLabel) ? 'text-[#1A1A1A]' : 'text-[#8A8F9C]')}>
        {selected
          ? selected.label
          : pendingLabel
            ? <><span className="text-[#002868] font-semibold text-xs mr-1.5 bg-[#EEF3FF] px-1.5 py-0.5 rounded">Nueva</span>{pendingLabel}</>
            : placeholder}
      </span>
      <div className="flex items-center gap-1 ml-2 shrink-0">
        {selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={e => e.key === 'Enter' && handleClear(e as any)}
            className="text-[#8A8F9C] hover:text-[#1A1A1A] transition-colors rounded p-0.5 hover:bg-gray-100"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronsUpDown className="h-4 w-4 text-[#8A8F9C]" />
      </div>
    </button>
  )
}
