'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import type { Area } from '@/lib/types'

interface AreaForm {
  id: number
  nombre: string
  descripcion: string
}

const DEFAULT_FORM: AreaForm = { id: 0, nombre: '', descripcion: '' }

export function AreasSection() {
  const [areas, setAreas] = useState<Area[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState<AreaForm>(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nombre: string } | null>(null)

  useEffect(() => { fetchAreas() }, [])

  const fetchAreas = async () => {
    const res = await apiFetch(API_ENDPOINTS.AREAS.GET_ALL)
    const data = await res.json()
    if (data.success) setAreas(data.data)
  }

  const handleOpenNew = () => {
    setForm(DEFAULT_FORM)
    setError('')
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (area: Area) => {
    setForm({ id: area.id, nombre: area.nombre, descripcion: area.descripcion ?? '' })
    setError('')
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es requerido')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      const url = form.id
        ? API_ENDPOINTS.AREAS.UPDATE(form.id)
        : API_ENDPOINTS.AREAS.CREATE
      const res = await apiFetch(url, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify({ nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(form.id ? 'Área actualizada' : 'Área creada')
        setIsDialogOpen(false)
        await fetchAreas()
      } else {
        setError(data.message)
      }
    } catch {
      setError('Error al guardar área')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(API_ENDPOINTS.AREAS.DELETE(deleteTarget.id), { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Área eliminada')
        await fetchAreas()
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Error al eliminar área')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#F0F0F0]">
          <CardTitle>Áreas</CardTitle>
          <Button
            onClick={handleOpenNew}
            className="bg-[#002868] hover:bg-[#003d8f] text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
          >
            + Nueva Área
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 pt-4">
            {areas.length === 0 && (
              <p className="text-sm text-[#9AA0AC] text-center py-8">No hay áreas cargadas.</p>
            )}
            {areas.map(area => (
              <div
                key={area.id}
                className="flex items-center justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-[#002868]">{area.nombre}</h3>
                  {area.descripcion && (
                    <p className="text-sm text-[#666666]">{area.descripcion}</p>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button
                    onClick={() => handleOpenEdit(area)}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs border-[#E0E0E0] text-[#5A6070] hover:bg-[#EEF2FF] hover:border-[#002868] hover:text-[#002868]"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => setDeleteTarget({ id: area.id, nombre: area.nombre })}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-600"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
            <DialogHeader className="p-0 border-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                {form.id ? 'Editar Área' : 'Nueva Área'}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                {form.id ? 'Modificá los datos del área' : 'Agregá una nueva área a la organización'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <Label
                htmlFor="area-nombre"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Nombre *
              </Label>
              <Input
                id="area-nombre"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Cocina, Salón, Administración..."
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
                autoFocus
              />
            </div>
            <div>
              <Label
                htmlFor="area-descripcion"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Descripción
              </Label>
              <Input
                id="area-descripcion"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Descripción opcional..."
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
          <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
            <DialogFooter className="sm:justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] font-medium hover:bg-[#F0F0F0] hover:text-[#1A1A1A] transition-all"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !form.nombre.trim()}
                className="h-10 px-6 rounded-lg bg-[#002868] text-white font-semibold hover:bg-[#003d8f] shadow-sm transition-all"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteTarget}
        nombre={deleteTarget?.nombre ?? ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
