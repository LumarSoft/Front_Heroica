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
import type { Area, Puesto } from '@/lib/types'

interface PuestoForm {
  id: number
  nombre: string
  area_id: number | ''
}

const DEFAULT_FORM: PuestoForm = { id: 0, nombre: '', area_id: '' }

export function PuestosSection() {
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState<PuestoForm>(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nombre: string } | null>(null)

  useEffect(() => {
    fetchPuestos()
    fetchAreas()
  }, [])

  const fetchPuestos = async () => {
    const res = await apiFetch(API_ENDPOINTS.PUESTOS.GET_ALL)
    const data = await res.json()
    if (data.success) setPuestos(data.data)
  }

  const fetchAreas = async () => {
    const res = await apiFetch(API_ENDPOINTS.AREAS.GET_ACTIVAS)
    const data = await res.json()
    if (data.success) setAreas(data.data)
  }

  const handleOpenNew = () => {
    setForm(DEFAULT_FORM)
    setError('')
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (puesto: Puesto) => {
    setForm({ id: puesto.id, nombre: puesto.nombre, area_id: puesto.area_id })
    setError('')
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim() || form.area_id === '') {
      setError('Nombre y área son requeridos')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      const url = form.id
        ? API_ENDPOINTS.PUESTOS.UPDATE(form.id)
        : API_ENDPOINTS.PUESTOS.CREATE
      const res = await apiFetch(url, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify({ nombre: form.nombre.trim(), area_id: form.area_id }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(form.id ? 'Puesto actualizado' : 'Puesto creado')
        setIsDialogOpen(false)
        await fetchPuestos()
      } else {
        setError(data.message)
      }
    } catch {
      setError('Error al guardar puesto')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(API_ENDPOINTS.PUESTOS.DELETE(deleteTarget.id), { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Puesto eliminado')
        await fetchPuestos()
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Error al eliminar puesto')
    } finally {
      setDeleteTarget(null)
    }
  }

  // Agrupar puestos por área para mejor visualización
  const puestosPorArea = areas.reduce<Record<number, { area: Area; puestos: Puesto[] }>>(
    (acc, area) => {
      acc[area.id] = { area, puestos: puestos.filter(p => p.area_id === area.id) }
      return acc
    },
    {},
  )
  const sinArea = puestos.filter(p => !areas.some(a => a.id === p.area_id))

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#F0F0F0]">
          <CardTitle>Puestos</CardTitle>
          <Button
            onClick={handleOpenNew}
            disabled={areas.length === 0}
            title={areas.length === 0 ? 'Primero creá al menos un área' : undefined}
            className="bg-[#002868] hover:bg-[#003d8f] text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 disabled:opacity-50"
          >
            + Nuevo Puesto
          </Button>
        </CardHeader>
        <CardContent>
          {areas.length === 0 ? (
            <p className="text-sm text-[#9AA0AC] text-center py-8">
              Primero creá al menos un área en la sección "Áreas".
            </p>
          ) : (
            <div className="space-y-5 pt-4">
              {Object.values(puestosPorArea).map(({ area, puestos: ps }) => (
                <div key={area.id}>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9AA0AC] mb-2">
                    {area.nombre}
                  </p>
                  {ps.length === 0 ? (
                    <p className="text-sm text-[#C0C5D0] pl-1">Sin puestos en esta área.</p>
                  ) : (
                    <div className="space-y-2">
                      {ps.map(puesto => (
                        <div
                          key={puesto.id}
                          className="flex items-center justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-semibold text-[#002868]">{puesto.nombre}</span>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <Button
                              onClick={() => handleOpenEdit(puesto)}
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs border-[#E0E0E0] text-[#5A6070] hover:bg-[#EEF2FF] hover:border-[#002868] hover:text-[#002868]"
                            >
                              Editar
                            </Button>
                            <Button
                              onClick={() => setDeleteTarget({ id: puesto.id, nombre: puesto.nombre })}
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
                  )}
                </div>
              ))}
              {sinArea.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9AA0AC] mb-2">
                    Sin área asignada
                  </p>
                  <div className="space-y-2">
                    {sinArea.map(puesto => (
                      <div
                        key={puesto.id}
                        className="flex items-center justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-[#002868]">{puesto.nombre}</span>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Button
                            onClick={() => handleOpenEdit(puesto)}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs border-[#E0E0E0] text-[#5A6070] hover:bg-[#EEF2FF] hover:border-[#002868] hover:text-[#002868]"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => setDeleteTarget({ id: puesto.id, nombre: puesto.nombre })}
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
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
            <DialogHeader className="p-0 border-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                {form.id ? 'Editar Puesto' : 'Nuevo Puesto'}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                {form.id ? 'Modificá los datos del puesto' : 'Agregá un nuevo puesto a un área'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <Label
                htmlFor="puesto-area"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Área *
              </Label>
              <select
                id="puesto-area"
                value={form.area_id}
                onChange={e => setForm({ ...form, area_id: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A1A] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccioná un área...</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <Label
                htmlFor="puesto-nombre"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Nombre *
              </Label>
              <Input
                id="puesto-nombre"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Operario, Supervisor, Cajero..."
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
                disabled={isSaving || !form.nombre.trim() || form.area_id === ''}
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
