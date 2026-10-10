'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { MedioMovimiento, ReglaPlantilla, TipoReglaPlantilla } from '@/lib/types'

export type OpcionesReglas = Record<TipoReglaPlantilla, ComboboxOption[]>

interface ReglaSelectorProps {
  opciones: OpcionesReglas
  onAdd: (regla: ReglaPlantilla) => void
  onClose: () => void
}

const TIPOS: { value: TipoReglaPlantilla; label: string }[] = [
  { value: 'descripcion', label: 'Descripción' },
  { value: 'subcategoria', label: 'Subcategoría' },
  { value: 'categoria', label: 'Categoría' },
]

const esTipo = (v: string): v is TipoReglaPlantilla => TIPOS.some(t => t.value === v)
const MEDIO_TODOS = 'todos'

export function ReglaSelector({ opciones, onAdd, onClose }: ReglaSelectorProps) {
  const [tipo, setTipo] = useState<TipoReglaPlantilla>('descripcion')
  const [id, setId] = useState('')
  const [medio, setMedio] = useState<string>(MEDIO_TODOS)

  const agregar = () => {
    if (!id) return
    onAdd({ tipo, id: Number(id), medio: medio === MEDIO_TODOS ? null : (medio as MedioMovimiento) })
    setId('')
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-[#B0B8C8] bg-white p-2">
      <Select
        value={tipo}
        onValueChange={v => {
          if (!esTipo(v)) return
          setTipo(v)
          setId('')
        }}
      >
        <SelectTrigger className="h-8 w-[140px] bg-white text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIPOS.map(t => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Combobox
        options={opciones[tipo]}
        value={id}
        onChange={setId}
        placeholder="Elegí…"
        searchPlaceholder="Buscar…"
        className="min-w-[220px] flex-1"
        overlay
      />
      <Select value={medio} onValueChange={setMedio}>
        <SelectTrigger className="h-8 w-[130px] bg-white text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={MEDIO_TODOS}>Banco y efectivo</SelectItem>
          <SelectItem value="banco">Solo banco</SelectItem>
          <SelectItem value="efectivo">Solo efectivo</SelectItem>
        </SelectContent>
      </Select>
      <Button type="button" size="sm" onClick={agregar} disabled={!id}>
        <Plus className="h-3.5 w-3.5" /> Agregar
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} title="Cerrar">
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
