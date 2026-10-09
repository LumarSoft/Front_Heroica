'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2, Upload } from 'lucide-react'
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
import type { Categoria, Subcategoria } from '@/lib/types'
import { selectClasses, labelClasses } from '@/lib/dialog-styles'
import { downloadBlob, toDateOnly } from '@/lib/downloadBlob'
import { DescripcionesExcelDialog } from './DescripcionesExcelDialog'
import { DescripcionesTabla, type FilaDescripcion } from './DescripcionesTabla'

interface DescripcionForm {
  nombre: string
  tipo: 'ingreso' | 'egreso' | ''
  categoria_id: string
  subcategoria_id: string
}

const DEFAULT_FORM: DescripcionForm = {
  nombre: '',
  tipo: '',
  categoria_id: '',
  subcategoria_id: '',
}

interface DescripcionApi {
  id: number
  nombre: string
  tipo: 'ingreso' | 'egreso' | null
  categoria_id: number | null
  subcategoria_id: number | null
  activo: number | boolean | null
}

function aFila(d: DescripcionApi): FilaDescripcion {
  return {
    id: Number(d.id),
    nombre: d.nombre ?? '',
    tipo: d.tipo === 'ingreso' || d.tipo === 'egreso' ? d.tipo : null,
    categoria_id: d.categoria_id ?? null,
    subcategoria_id: d.subcategoria_id ?? null,
    // MySQL devuelve 0/1; null (legacy) se toma como activa, igual que la API.
    activo: d.activo === null || d.activo === undefined ? true : Boolean(Number(d.activo)),
  }
}

export function DescripcionesSection() {
  const [items, setItems] = useState<FilaDescripcion[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState<DescripcionForm>(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<FilaDescripcion | null>(null)
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  // Todas las descripciones no eliminadas (activas e inactivas): la grilla
  // permite filtrar y reactivar.
  const fetchItems = useCallback(async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.GET_ALL)
      const data = await res.json()
      if (data.success) setItems((data.data as DescripcionApi[]).map(aFila))
    } catch {
      toast.error('Error al obtener descripciones')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchCatalogos = useCallback(async () => {
    try {
      const [resCat, resSub] = await Promise.all([
        apiFetch(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL),
        apiFetch(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_ALL),
      ])
      const [dataCat, dataSub] = await Promise.all([resCat.json(), resSub.json()])
      if (dataCat.success) setCategorias(dataCat.data || [])
      if (dataSub.success) setSubcategorias(dataSub.data || [])
    } catch {
      // No crítico: la grilla muestra "no disponible" si faltan nombres.
    }
  }, [])

  useEffect(() => {
    fetchItems()
    fetchCatalogos()
  }, [fetchItems, fetchCatalogos])

  const handleExportar = async () => {
    setIsExporting(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.EXPORTAR, { cache: 'no-store' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.message || 'No se pudo generar el Excel')
      }
      downloadBlob(await res.blob(), `Descripciones_${toDateOnly(new Date())}.xlsx`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo generar el Excel')
    } finally {
      setIsExporting(false)
    }
  }

  const handleOpenNew = () => {
    setForm(DEFAULT_FORM)
    setError('')
    setIsDialogOpen(true)
  }

  const handleCreate = async () => {
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
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.CREATE, {
        method: 'POST',
        body: JSON.stringify({
          nombre: form.nombre.trim(),
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
    const id = deleteTarget.id
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.DELETE(id), {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setDeletedIds(prev => [...prev, id])
        await fetchItems()
      } else {
        toast.error(data.message || 'Error al eliminar descripción')
      }
    } catch {
      toast.error('Error al eliminar descripción')
    } finally {
      setDeleteTarget(null)
    }
  }

  // Opciones del formulario de alta, filtradas por tipo y categoría elegidos.
  const categoriasFiltradas = form.tipo ? categorias.filter(c => !c.tipo || c.tipo === form.tipo) : categorias
  const subcategoriasForm = form.categoria_id
    ? subcategorias.filter(s => s.categoria_id === Number(form.categoria_id))
    : []

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F0F0F0]">
          <CardTitle>Descripciones (Clasificación de Movimientos)</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleExportar}
              disabled={isExporting}
              className="text-xs sm:text-sm h-8 sm:h-9 px-3 border-[#E0E0E0] text-[#5A6070] hover:bg-[#EEF2FF] hover:border-[#002868] hover:text-[#002868]"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exportar Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsImportOpen(true)}
              className="text-xs sm:text-sm h-8 sm:h-9 px-3 border-[#E0E0E0] text-[#5A6070] hover:bg-[#EEF2FF] hover:border-[#002868] hover:text-[#002868]"
            >
              <Upload className="h-4 w-4" />
              Importar Excel
            </Button>
            <Button
              onClick={handleOpenNew}
              className="bg-[#002868] hover:bg-[#003d8f] text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
            >
              + Nueva Descripción
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DescripcionesTabla
            items={items}
            categorias={categorias}
            subcategorias={subcategorias}
            isLoading={isLoading}
            onSaved={fetchItems}
            onDelete={setDeleteTarget}
            deletedIds={deletedIds}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
            <DialogHeader className="p-0 border-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">Nueva Descripción</DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                Agrega una nueva descripción al sistema
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
                onChange={e =>
                  setForm({
                    ...form,
                    tipo: e.target.value as 'ingreso' | 'egreso' | '',
                    categoria_id: '',
                    subcategoria_id: '',
                  })
                }
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
                {subcategoriasForm.map(s => (
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
                onClick={handleCreate}
                disabled={isSaving || !form.nombre.trim() || !form.tipo}
                className="h-10 px-6 rounded-lg bg-[#002868] text-white font-semibold hover:bg-[#003d8f] shadow-sm transition-all"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <DescripcionesExcelDialog open={isImportOpen} onOpenChange={setIsImportOpen} onImported={fetchItems} />

      <DeleteDialog
        open={!!deleteTarget}
        nombre={deleteTarget?.nombre ?? ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
