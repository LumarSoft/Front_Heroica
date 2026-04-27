'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ui/error-banner'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { PuestosTable } from '@/components/puestos/PuestosTable'
import { PuestoFormDialog } from '@/components/puestos/PuestoFormDialog'
import { PuestoDeleteDialog } from '@/components/puestos/PuestoDeleteDialog'
import type { Puesto } from '@/lib/types'

export default function PuestosPage() {
  const router = useRouter()
  const params = useParams()
  const sucursalId = Number(params.id)

  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Puesto | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Puesto | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchPuestos = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.PUESTOS.GET_BY_SUCURSAL(sucursalId))
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al cargar puestos')
      setPuestos(data.data ?? data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar puestos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchPuestos() }, [sucursalId])

  const openCreate = () => { setEditTarget(null); setFormOpen(true) }
  const openEdit = (puesto: Puesto) => { setEditTarget(puesto); setFormOpen(true) }

  const handleSave = async (nombre: string) => {
    setSaving(true)
    try {
      const isEdit = editTarget !== null
      const res = await apiFetch(
        isEdit
          ? API_ENDPOINTS.PUESTOS.UPDATE(editTarget.id)
          : API_ENDPOINTS.PUESTOS.CREATE,
        {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify(isEdit ? { nombre } : { nombre, sucursal_id: sucursalId }),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al guardar puesto')
      toast.success(isEdit ? 'Puesto actualizado' : 'Puesto creado')
      setFormOpen(false)
      fetchPuestos()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar puesto')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.PUESTOS.DELETE(deleteTarget.id), { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al eliminar puesto')
      toast.success('Puesto eliminado')
      setDeleteTarget(null)
      fetchPuestos()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar puesto')
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) return <PageLoadingSpinner />

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#EEF3FF]">
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-3">
            <Button
              onClick={() => router.push(`/recursos-humanos/${sucursalId}`)}
              variant="ghost"
              size="icon"
              className="w-9 h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 cursor-pointer rounded-lg"
              aria-label="Volver a recursos humanos"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-1">
                Recursos Humanos
              </p>
              <h1 className="text-sm sm:text-base font-semibold text-[#002868] truncate leading-none">
                Puestos
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ErrorBanner error={error} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold text-[#002868]">Puestos</h2>
            <p className="text-xs sm:text-sm text-[#666666] mt-1">
              Puestos de trabajo disponibles en esta sucursal.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white font-semibold px-5 py-2.5 flex items-center gap-2 shadow-sm hover:shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo Puesto
          </Button>
        </div>

        <PuestosTable
          puestos={puestos}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      </main>

      <PuestoFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        saving={saving}
        initial={editTarget}
      />

      <PuestoDeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  )
}
