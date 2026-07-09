'use client'

import { useRef, useState } from 'react'
import { Combobox } from '@/components/ui/combobox'
import { parseInputMonto } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { Pencil, Loader2 } from 'lucide-react'
import type { EditFieldType, EditOption } from '@/lib/caja-inline-edit'
import type { NavDir } from '@/hooks/use-grid-edit'

interface EditableCellProps {
  editing: boolean
  saving: boolean
  type: EditFieldType
  /** Render de sólo lectura (reutiliza el render de la columna: badges, colores, etc.) */
  display: React.ReactNode
  /** Valor crudo actual para inicializar el editor */
  raw: string
  options?: EditOption[]
  align?: 'left' | 'center' | 'right'
  placeholder?: string
  onStart: () => void
  onCommit: (value: string, dir: NavDir) => void
  onCancel: () => void
}

const alignClass = {
  left: 'justify-start text-left',
  center: 'justify-center text-center',
  right: 'justify-end text-right',
}

export function EditableCell({
  editing,
  saving,
  type,
  display,
  raw,
  options,
  align = 'left',
  placeholder,
  onStart,
  onCommit,
  onCancel,
}: EditableCellProps) {
  if (editing) {
    return (
      <CellEditor
        type={type}
        raw={raw}
        options={options}
        align={align}
        placeholder={placeholder}
        onCommit={onCommit}
        onCancel={onCancel}
      />
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onStart}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === 'F2') {
          e.preventDefault()
          onStart()
        }
      }}
      title="Clic para editar"
      className={cn(
        'group/cell relative flex min-h-[34px] w-full items-center rounded-md px-1.5 outline-none transition-colors cursor-text',
        'hover:bg-[#EEF3FF]/80 hover:ring-1 hover:ring-[#002868]/15',
        'focus-visible:bg-[#EEF3FF] focus-visible:ring-2 focus-visible:ring-[#002868]/40',
        alignClass[align],
      )}
    >
      <div className="min-w-0 flex-1">{display}</div>
      {saving ? (
        <Loader2 className="ml-1 h-3 w-3 shrink-0 animate-spin text-[#002868]" />
      ) : (
        <Pencil className="pointer-events-none ml-1 h-3 w-3 shrink-0 text-[#002868]/45 opacity-0 transition-opacity group-hover/cell:opacity-100" />
      )}
    </div>
  )
}

// =============================================
// Editor interno (se monta al entrar en edición → estado sembrado desde `raw`)
// =============================================

interface CellEditorProps {
  type: EditFieldType
  raw: string
  options?: EditOption[]
  align: 'left' | 'center' | 'right'
  placeholder?: string
  onCommit: (value: string, dir: NavDir) => void
  onCancel: () => void
}

function CellEditor({ type, raw, options, align, placeholder, onCommit, onCancel }: CellEditorProps) {
  const [value, setValue] = useState(raw)
  const inputRef = useRef<HTMLInputElement>(null)
  // Evita el doble commit del onBlur cuando ya se confirmó/canceló por teclado
  const settledRef = useRef(false)

  const settle = (fn: () => void) => {
    if (settledRef.current) return
    settledRef.current = true
    fn()
  }

  // --- Selects (categoría, descripción, banco, medio de pago) ---
  if (type === 'select') {
    return (
      <div className="w-full" onMouseDown={e => e.stopPropagation()}>
        <Combobox
          options={options || []}
          value={value}
          autoOpen
          overlay
          placeholder={placeholder}
          searchPlaceholder="Buscar..."
          className="h-9 border-2 border-[#002868] shadow-sm ring-2 ring-[#002868]/15"
          // Al elegir: confirma y cierra (sin auto-avanzar para no abrir otro menú)
          onChange={v => {
            setValue(v)
            settle(() => onCommit(v, null))
          }}
          onClose={() => settle(onCancel)}
        />
      </div>
    )
  }

  // --- Inputs de texto (fecha, monto) ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      settle(() => onCommit(value, 'down'))
    } else if (e.key === 'Tab') {
      e.preventDefault()
      settle(() => onCommit(value, e.shiftKey ? 'left' : 'right'))
    } else if (e.key === 'Escape') {
      e.preventDefault()
      settle(onCancel)
    }
  }

  return (
    <input
      ref={inputRef}
      autoFocus
      type={type === 'date' ? 'date' : 'text'}
      inputMode={type === 'monto' ? 'decimal' : undefined}
      value={value}
      placeholder={placeholder}
      // .select() sólo aplica a inputs de texto (en type=date lanza excepción)
      onFocus={e => {
        if (type === 'monto') e.currentTarget.select()
      }}
      onChange={e => setValue(type === 'monto' ? parseInputMonto(e.target.value) : e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => settle(() => onCommit(value, null))}
      onMouseDown={e => e.stopPropagation()}
      className={cn(
        'h-9 w-full rounded-md border-2 border-[#002868] bg-white px-2 text-sm text-[#1A1A1A] shadow-sm outline-none ring-2 ring-[#002868]/15',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
      )}
    />
  )
}
