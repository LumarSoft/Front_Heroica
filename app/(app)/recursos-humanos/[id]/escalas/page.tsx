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
import { EscalasTable } from '@/components/escalas/EscalasTable'
import { EscalaFormDialog } from '@/components/escalas/EscalaFormDialog'
import { EscalaDeleteDialog } from '@/components/escalas/EscalaDeleteDialog'
import type { EscalaSalarial } from '@/lib/types'

const now = new Date()

export default function EscalasSalarialesPage() {
  const router = useRouter()
  const params = useParams()
  const sucursalId = Number(params.id)

  const [filterMes, setFilterMes] = useState(now.getMonth() + 1)
  const [filterAnio, setFilterAnio] = useState(now.getFullYear())

  const [escalas, setEscalas] = useState<EscalaSalarial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EscalaSalarial | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<EscalaSalarial | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchEscalas = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.ESCALAS_SALARIALES.GET_ALL)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al cargar escalas salariales')
      setEscalas(data.data ?? data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar escalas salariales')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchEscalas() }, [])

  const prevMonth = () => {
    if (filterMes === 1) { setFilterMes(12); setFilterAnio(a => a - 1) }
    else setFilterMes(m => m - 1)
  }
  const nextMonth = () => {
    if (filterMes === 12) { setFilterMes(1); setFilterAnio(a => a + 1) }
    else setFilterMes(m => m + 1)
  }

  const openCreate = () => { setEditTarget(null); setFormOpen(true) }
  const openEdit = (escala: EscalaSalarial) => { setEditTarget(escala); setFormOpen(true) }

  const handleSave = async (body: Omit<EscalaSalarial, 'id' | 'puesto_nombre'>) => {
    setSaving(true)
    try {
      const isEdit = editTarget !== null
      const res = await apiFetch(
        isEdit
          ? API_ENDPOINTS.ESCALAS_SALARIALES.UPDATE(editTarget.id)
          : API_ENDPOINTS.ESCALAS_SALARIALES.CREATE,
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al guardar escala')
      toast.success(isEdit ? 'Escala salarial actualizada' : 'Escala salarial creada')
      setFormOpen(false)
      fetchEscalas()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar escala')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.ESCALAS_SALARIALES.DELETE(deleteTarget.id), {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al eliminar escala')
      toast.success('Escala salarial eliminada')
      setDeleteTarget(null)
      fetchEscalas()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar escala')
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
                Escalas Salariales
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ErrorBanner error={error} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold text-[#002868]">Escalas Salariales</h2>
            <p className="text-xs sm:text-sm text-[#666666] mt-1">
              Categorías y referencias de sueldos base por puesto.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white font-semibold px-5 py-2.5 flex items-center gap-2 shadow-sm hover:shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Crear Escala
          </Button>
        </div>

        <EscalasTable
          escalas={escalas}
          filterMes={filterMes}
          filterAnio={filterAnio}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      </main>

      <EscalaFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        saving={saving}
        initial={editTarget}
        defaultMes={filterMes}
        defaultAnio={filterAnio}
        sucursalId={sucursalId}
      />

      <EscalaDeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  )
}
