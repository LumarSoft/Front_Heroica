'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { DeleteDialog } from '@/components/ui/delete-dialog'
import type { Categoria, Subcategoria, DescripcionOption } from '@/lib/types'
import { selectClasses, labelClasses } from '@/lib/dialog-styles'

interface DescripcionForm {
  id: number
  nombre: string
  tipo: 'ingreso' | 'egreso' | ''
  categoria_id: string
  subcategoria_id: string
}

const DEFAULT_FORM: DescripcionForm = {
  id: 0,
  nombre: '',
  tipo: '',
  categoria_id: '',
  subcategoria_id: '',
}

const TIPO_LABELS: Record<string, string> = {
  ingreso: 'Ingreso',
  egreso: 'Egreso',
}

export function DescripcionesSection() {
  const [items, setItems] = useState<DescripcionOption[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState<DescripcionForm>(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number
    nombre: string
  } | null>(null)

  useEffect(() => {
    fetchItems()
    fetchCategorias()
  }, [])

  // Recargar subcategorías cuando cambia la categoría en el form
  useEffect(() => {
    if (form.categoria_id) {
      fetchSubcategorias(Number(form.categoria_id))
    } else {
      setSubcategorias([])
    }
  }, [form.categoria_id])

  const fetchItems = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.GET_ACTIVE)
      const data = await res.json()
      if (data.success) setItems(data.data)
    } catch {
      toast.error('Error al obtener descripciones')
    }
  }

  const fetchCategorias = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL)
      const data = await res.json()
      if (data.success) setCategorias(data.data || [])
    } catch {
      // Non-critical
    }
  }

  const fetchSubcategorias = async (categoriaId: number) => {
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_BY_CATEGORIA(categoriaId))
      const data = await res.json()
      if (res.ok) setSubcategorias(data.data || [])
    } catch {
      // Non-critical
    }
  }

  const handleOpenNew = () => {
    setForm(DEFAULT_FORM)
    setSubcategorias([])
    setError('')
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (item: DescripcionOption) => {
    setForm({
      id: item.id,
      nombre: item.nombre,
      tipo: (item.tipo as 'ingreso' | 'egreso') ?? '',
      categoria_id: item.categoria_id?.toString() ?? '',
      subcategoria_id: item.subcategoria_id?.toString() ?? '',
    })
    setError('')
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es requerido')
      return
    }
    if (!form.tipo) {
      setError('El tipo es requerido')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      const url = form.id
        ? API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.UPDATE(form.id)
        : API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.CREATE
      const res = await apiFetch(url, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify({
          nombre: form.nombre,
          tipo: form.tipo,
          categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
          subcategoria_id: form.subcategoria_id ? Number(form.subcategoria_id) : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setIsDialogOpen(false)
        await fetchItems()
      } else {
        setError(data.message)
      }
    } catch {
      setError('Error al guardar descripción')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.DELETE(deleteTarget.id), {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        await fetchItems()
      }
    } catch {
      toast.error('Error al eliminar descripción')
    } finally {
      setDeleteTarget(null)
    }
  }

  // Categorías filtradas según el tipo elegido en el form
  const categoriasFiltradas = form.tipo
    ? categorias.filter(c => !c.tipo || c.tipo === form.tipo)
    : categorias

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#F0F0F0]">
          <CardTitle>Descripciones (Clasificación de Movimientos)</CardTitle>
          <Button onClick={handleOpenNew} className="bg-[#002868] hover:bg-[#003d8f] text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4">
            + Nueva Descripción
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 pt-4">
            {items.length === 0 && (
              <p className="text-sm text-[#8A8F9C] text-center py-6">No hay descripciones configuradas.</p>
            )}
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#002868]">{item.nombre}</h3>
                    {item.tipo && (
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          item.tipo === 'ingreso'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {TIPO_LABELS[item.tipo]}
                      </span>
                    )}
                  </div>
                  {(item.categoria_nombre || item.subcategoria_nombre) && (
                    <p className="text-xs text-[#8A8F9C]">
                      {item.categoria_nombre}
                      {item.subcategoria_nombre && ` › ${item.subcategoria_nombre}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button
                    onClick={() => handleOpenEdit(item)}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs border-[#E0E0E0] text-[#5A6070] hover:bg-[#EEF2FF] hover:border-[#002868] hover:text-[#002868]"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => setDeleteTarget({ id: item.id, nombre: item.nombre })}
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
                {form.id ? 'Editar Descripción' : 'Nueva Descripción'}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                {form.id ? 'Modifica los detalles de esta descripción' : 'Agrega una nueva descripción al sistema'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 space-y-4">
            {/* Nombre */}
            <div>
              <Label
                htmlFor="desc-nombre"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Nombre *
              </Label>
              <Input
                id="desc-nombre"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Pago de alquiler"
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>

            {/* Tipo */}
            <div>
              <Label htmlFor="desc-tipo" className={labelClasses}>
                Tipo de movimiento *
              </Label>
              <select
                id="desc-tipo"
                value={form.tipo}
                onChange={e => {
                  setForm({ ...form, tipo: e.target.value as 'ingreso' | 'egreso' | '', categoria_id: '', subcategoria_id: '' })
                  setSubcategorias([])
                }}
                className={selectClasses}
              >
                <option value="">Seleccione tipo</option>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>

            {/* Categoría */}
            <div>
              <Label htmlFor="desc-categoria" className={labelClasses}>
                Categoría sugerida
              </Label>
              <select
                id="desc-categoria"
                value={form.categoria_id}
                onChange={e => setForm({ ...form, categoria_id: e.target.value, subcategoria_id: '' })}
                disabled={!form.tipo}
                className={`${selectClasses} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <option value="">Sin categoría</option>
                {categoriasFiltradas.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategoría */}
            <div>
              <Label htmlFor="desc-subcategoria" className={labelClasses}>
                Subcategoría sugerida
              </Label>
              <select
                id="desc-subcategoria"
                value={form.subcategoria_id}
                onChange={e => setForm({ ...form, subcategoria_id: e.target.value })}
                disabled={!form.categoria_id}
                className={`${selectClasses} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <option value="">Sin subcategoría</option>
                {subcategorias.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
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
                disabled={isSaving || !form.nombre.trim() || !form.tipo}
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
