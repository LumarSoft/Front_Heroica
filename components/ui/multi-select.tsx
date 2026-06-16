'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Seleccioná...',
  emptyMessage = 'Sin opciones disponibles',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }

  function removeTag(value: string, e: React.MouseEvent) {
    e.stopPropagation()
    onChange(selected.filter(v => v !== value))
  }

  const selectedOptions = options.filter(o => selected.includes(o.value))

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(prev => !prev)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpen(prev => !prev)}
        className={cn(
          'flex min-h-9 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          open && 'border-ring ring-ring/50 ring-[3px]',
        )}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          selectedOptions.map(opt => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 rounded-md bg-[#EAF0FF] px-2 py-0.5 text-xs font-medium text-[#002868]"
            >
              {opt.label}
              <button
                type="button"
                onClick={e => removeTag(opt.value, e)}
                className="ml-0.5 opacity-60 hover:opacity-100"
                aria-label={`Quitar ${opt.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-input bg-white shadow-md">
          {options.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>
          ) : (
            options.map(option => {
              const isSelected = selected.includes(option.value)
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggle(option.value)}
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#F8FAFF]"
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-300 transition-colors',
                      isSelected && 'border-[#002868] bg-[#002868]',
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>
                  <span>{option.label}</span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
