'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { bancoSchema } from '@/lib/schemas'
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

interface Banco {
  id: number
  nombre: string
  codigo: string
  activo: boolean
}

interface BancoForm {
  id: number
  nombre: string
  codigo: string
}

const DEFAULT_FORM: BancoForm = { id: 0, nombre: '', codigo: '' }

export function BancosSection() {
  const [bancos, setBancos] = useState<Banco[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState<BancoForm>(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number
    nombre: string
  } | null>(null)

  useEffect(() => {
    fetchBancos()
  }, [])

  const fetchBancos = async () => {
    const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.BANCOS.GET_ALL)
    const data = await res.json()
    if (data.success) setBancos(data.data)
  }

  const handleOpenNew = () => {
    setForm(DEFAULT_FORM)
    setError('')
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (banco: Banco) => {
    setForm(banco)
    setError('')
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const validation = bancoSchema.safeParse(form)
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Error de validación')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      const url = form.id
        ? API_ENDPOINTS.CONFIGURACION.BANCOS.UPDATE(form.id)
        : API_ENDPOINTS.CONFIGURACION.BANCOS.CREATE
      const res = await apiFetch(url, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setIsDialogOpen(false)
        await fetchBancos()
      } else {
        setError(data.message)
      }
    } catch {
      setError('Error al guardar banco')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.BANCOS.DELETE(deleteTarget.id), { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        await fetchBancos()
      }
    } catch {
      toast.error('Error al eliminar banco')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#F0F0F0]">
          <CardTitle>Bancos</CardTitle>
          <Button onClick={handleOpenNew} className="bg-[#002868] hover:bg-[#003d8f] text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4">
            + Nuevo Banco
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {bancos.map(banco => (
              <div
                key={banco.id}
                className="flex items-center justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-[#002868]">{banco.nombre}</h3>
                  {banco.codigo && <p className="text-sm text-[#666666]">Código: {banco.codigo}</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button
                    onClick={() => handleOpenEdit(banco)}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs border-[#E0E0E0] text-[#5A6070] hover:bg-[#EEF2FF] hover:border-[#002868] hover:text-[#002868]"
                  >
                    Editar
                  </Button>
                  <Button
                    onClick={() => setDeleteTarget({ id: banco.id, nombre: banco.nombre })}
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
                {form.id ? 'Editar Banco' : 'Nuevo Banco'}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                {form.id ? 'Modifica los detalles de este banco' : 'Agrega un nuevo banco al sistema'}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <Label
                htmlFor="banco-nombre"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Nombre *
              </Label>
              <Input
                id="banco-nombre"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Banco Galicia"
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label
                htmlFor="banco-codigo"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Código
              </Label>
              <Input
                id="banco-codigo"
                value={form.codigo}
                onChange={e => setForm({ ...form, codigo: e.target.value })}
                placeholder="Ej: GALI"
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
                disabled={isSaving || !form.nombre}
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
