'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Tarea, Tipo, Prioridad, UsuarioBasico } from './types'

interface TareaDialogProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    titulo: string
    descripcion: string
    tipo: Tipo
    prioridad: Prioridad
    version: string
    asignado_a: number | null
  }) => Promise<void>
  saving: boolean
  initial?: Tarea | null
  usuarios: UsuarioBasico[]
}

export function TareaDialog({ open, onClose, onSave, saving, initial, usuarios }: TareaDialogProps) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [version, setVersion] = useState('')
  const [tipo, setTipo] = useState<Tipo>('otro')
  const [prioridad, setPrioridad] = useState<Prioridad>('media')
  const [asignadoA, setAsignadoA] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      setTitulo(initial?.titulo ?? '')
      setDescripcion(initial?.descripcion ?? '')
      setVersion(initial?.version ?? '')
      setTipo(initial?.tipo ?? 'otro')
      setPrioridad(initial?.prioridad ?? 'media')
      setAsignadoA(initial?.asignado_a ?? null)
    }
  }, [open, initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return
    await onSave({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      version: version.trim(),
      tipo,
      prioridad,
      asignado_a: asignadoA,
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#002868]">
            {initial ? 'Editar Tarea' : 'Nueva Tarea'}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {initial ? 'Modificá los datos de la tarea.' : 'Describí la mejora, bug o implementación.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="titulo" className="text-slate-700 font-semibold text-sm">
                  Título *
                </Label>
                <Input
                  id="titulo"
                  placeholder="Ej: Botón de guardar no responde"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  required
                  className="border-slate-200 focus:border-[#002868] focus:ring-[#002868] text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="version" className="text-slate-700 font-semibold text-sm">
                  Versión
                </Label>
                <Input
                  id="version"
                  placeholder="Ej: 2604"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  className="border-slate-200 focus:border-[#002868] focus:ring-[#002868] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold text-sm">Tipo *</Label>
                <Select value={tipo} onValueChange={v => setTipo(v as Tipo)}>
                  <SelectTrigger className="border-slate-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">🐛 Bug</SelectItem>
                    <SelectItem value="mejora">✨ Mejora</SelectItem>
                    <SelectItem value="implementacion">🚀 Implementación</SelectItem>
                    <SelectItem value="otro">○ Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold text-sm">Prioridad *</Label>
                <Select value={prioridad} onValueChange={v => setPrioridad(v as Prioridad)}>
                  <SelectTrigger className="border-slate-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">🔴 Alta</SelectItem>
                    <SelectItem value="media">🟡 Media</SelectItem>
                    <SelectItem value="baja">🟢 Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">Asignar a</Label>
              <Select
                value={asignadoA !== null ? String(asignadoA) : 'sin_asignar'}
                onValueChange={v => setAsignadoA(v === 'sin_asignar' ? null : Number(v))}
              >
                <SelectTrigger className="border-slate-200 text-sm">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                  {usuarios.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion" className="text-slate-700 font-semibold text-sm">
                Descripción
              </Label>
              <textarea
                id="descripcion"
                placeholder="Describí con más detalle el problema o la mejora..."
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-[#002868] focus:ring-1 focus:ring-[#002868] resize-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="cursor-pointer">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !titulo.trim()}
              className="bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : initial ? (
                'Guardar Cambios'
              ) : (
                'Crear Tarea'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
