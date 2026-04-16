'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Shield, ShieldCheck, Lock } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'

interface Permiso {
  id: number
  clave: string
  descripcion: string
  categoria: string
}

interface Rol {
  id: number
  nombre: string
  descripcion: string | null
  es_sistema: boolean
  permisos_ids: number[]
  permisos_claves: string[]
}

interface RolForm {
  nombre: string
  descripcion: string
  permiso_ids: number[]
}

const DEFAULT_FORM: RolForm = { nombre: '', descripcion: '', permiso_ids: [] }

const ROL_BADGE_COLORS: Record<string, string> = {
  superadmin: 'bg-purple-50 text-purple-700 border-purple-200',
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  directivo: 'bg-amber-50 text-amber-700 border-amber-200',
  gerente: 'bg-green-50 text-green-700 border-green-200',
}

function getBadgeClass(nombre: string) {
  return ROL_BADGE_COLORS[nombre.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200'
}

export function RolesSection() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [permisos, setPermisos] = useState<Permiso[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog crear/editar
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRol, setEditingRol] = useState<Rol | null>(null)
  const [form, setForm] = useState<RolForm>(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Dialog eliminar
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [rolToDelete, setRolToDelete] = useState<Rol | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [resRoles, resPermisos] = await Promise.all([
        apiFetch(API_ENDPOINTS.CONFIGURACION.ROLES.GET_ALL),
        apiFetch(API_ENDPOINTS.CONFIGURACION.PERMISOS.GET_ALL),
      ])
      const dataRoles = await resRoles.json()
      const dataPermisos = await resPermisos.json()
      if (dataRoles.success) setRoles(dataRoles.data)
      if (dataPermisos.success) setPermisos(dataPermisos.data)
    } catch {
      toast.error('Error al cargar roles y permisos')
    } finally {
      setIsLoading(false)
    }
  }

  // Agrupar permisos por categoría
  const permisosAgrupados = permisos.reduce<Record<string, Permiso[]>>((acc, p) => {
    const cat = p.categoria || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const openCreate = () => {
    setEditingRol(null)
    setForm(DEFAULT_FORM)
    setFormError('')
    setDialogOpen(true)
  }

  const openEdit = (rol: Rol) => {
    setEditingRol(rol)
    setForm({
      nombre: rol.nombre,
      descripcion: rol.descripcion || '',
      permiso_ids: [...rol.permisos_ids],
    })
    setFormError('')
    setDialogOpen(true)
  }

  const togglePermiso = (permisoId: number) => {
    setForm(prev => ({
      ...prev,
      permiso_ids: prev.permiso_ids.includes(permisoId)
        ? prev.permiso_ids.filter(id => id !== permisoId)
        : [...prev.permiso_ids, permisoId],
    }))
  }

  const toggleCategoria = (categoria: string) => {
    const ids = (permisosAgrupados[categoria] || []).map(p => p.id)
    const allSelected = ids.every(id => form.permiso_ids.includes(id))
    if (allSelected) {
      setForm(prev => ({
        ...prev,
        permiso_ids: prev.permiso_ids.filter(id => !ids.includes(id)),
      }))
    } else {
      setForm(prev => ({
        ...prev,
        permiso_ids: [...new Set([...prev.permiso_ids, ...ids])],
      }))
    }
  }

  const handleSave = async () => {
    setFormError('')
    if (!form.nombre.trim()) {
      setFormError('El nombre del rol es requerido')
      return
    }
    setIsSaving(true)
    try {
      const isEdit = Boolean(editingRol)
      const url = isEdit
        ? API_ENDPOINTS.CONFIGURACION.ROLES.UPDATE(editingRol!.id)
        : API_ENDPOINTS.CONFIGURACION.ROLES.CREATE

      const res = await apiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          permiso_ids: form.permiso_ids,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(isEdit ? 'Rol actualizado' : 'Rol creado')
        setDialogOpen(false)
        await fetchData()
      } else {
        setFormError(data.message || 'Error al guardar rol')
      }
    } catch {
      setFormError('Error de conexión')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (rol: Rol) => {
    setRolToDelete(rol)
    setDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!rolToDelete) return
    setIsDeleting(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.ROLES.DELETE(rolToDelete.id), { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Rol eliminado')
        setDeleteOpen(false)
        setRolToDelete(null)
        await fetchData()
      } else {
        toast.error(data.message || 'Error al eliminar rol')
      }
    } catch {
      toast.error('Error al eliminar rol')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-[#E0E0E0]">
        <CardContent className="py-10">
          <p className="text-center text-[#666666]">Cargando roles...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-[#E0E0E0] shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#F0F0F0]">
          <div>
            <CardTitle className="text-[#002868]">Roles y Permisos</CardTitle>
            <p className="text-sm text-[#666666] mt-0.5">Gestioná los roles y sus permisos en el sistema</p>
          </div>
          <Button id="btn-nuevo-rol" onClick={openCreate} className="bg-[#002868] hover:bg-[#003d8f] text-white">
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Rol
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {roles.length === 0 ? (
            <p className="text-center text-[#666666] py-10">No hay roles registrados</p>
          ) : (
            <div className="divide-y divide-[#F0F0F0]">
              {roles.map(rol => (
                <div key={rol.id} className="px-6 py-4 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#002868]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {rol.es_sistema ? (
                          <ShieldCheck className="w-4 h-4 text-[#002868]" />
                        ) : (
                          <Shield className="w-4 h-4 text-[#002868]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getBadgeClass(rol.nombre)}`}
                          >
                            {rol.nombre}
                          </span>
                          {rol.es_sistema && (
                            <span className="flex items-center gap-1 text-xs text-[#999] bg-[#F5F5F5] px-2 py-0.5 rounded-full border border-[#E8E8E8]">
                              <Lock className="w-2.5 h-2.5" /> Sistema
                            </span>
                          )}
                        </div>
                        {rol.descripcion && <p className="text-sm text-[#555] mt-1">{rol.descripcion}</p>}
                        {/* Chips de permisos */}
                        {rol.permisos_claves.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {rol.permisos_claves.slice(0, 6).map(c => (
                              <span key={c} className="text-xs bg-[#EEF2FF] text-[#3730A3] px-2 py-0.5 rounded-md">
                                {c.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {rol.permisos_claves.length > 6 && (
                              <span className="text-xs text-[#999] px-1 py-0.5">
                                +{rol.permisos_claves.length - 6} más
                              </span>
                            )}
                          </div>
                        )}
                        {rol.permisos_claves.length === 0 && (
                          <p className="text-xs text-[#999] mt-1 italic">Sin permisos asignados</p>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        id={`btn-editar-rol-${rol.id}`}
                        onClick={() => openEdit(rol)}
                        title="Editar rol"
                        className="w-8 h-8 flex items-center justify-center rounded-md text-[#555] hover:text-[#002868] hover:bg-[#EEF2FF] transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {!rol.es_sistema && (
                        <button
                          id={`btn-eliminar-rol-${rol.id}`}
                          onClick={() => handleDeleteClick(rol)}
                          title="Eliminar rol"
                          className="w-8 h-8 flex items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Crear / Editar Rol */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0] flex-shrink-0">
            <DialogHeader className="p-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A]">
                {editingRol ? 'Editar Rol' : 'Nuevo Rol'}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                {editingRol
                  ? 'Modificá el nombre, descripción y permisos del rol'
                  : 'Creá un nuevo rol y asignale los permisos correspondientes'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-8 py-6 space-y-5 overflow-y-auto flex-1">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">Nombre *</Label>
              <Input
                id="rol-nombre"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: contador"
                className="h-10 border-[#E0E0E0] text-[#1A1A1A]"
                disabled={Boolean(editingRol?.es_sistema)}
              />
              {editingRol?.es_sistema && (
                <p className="text-xs text-[#999] flex items-center gap-1">
                  <Lock className="w-3 h-3" /> El nombre de un rol del sistema no se puede cambiar
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">Descripción</Label>
              <Input
                id="rol-descripcion"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Descripción breve del rol"
                className="h-10 border-[#E0E0E0] text-[#1A1A1A]"
              />
            </div>

            {/* Matriz de permisos */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">Permisos</Label>
              <div className="border border-[#E0E0E0] rounded-xl overflow-hidden">
                {Object.entries(permisosAgrupados).map(([categoria, permsCategoria], idx) => {
                  const catIds = permsCategoria.map(p => p.id)
                  const allSelected = catIds.every(id => form.permiso_ids.includes(id))
                  const someSelected = catIds.some(id => form.permiso_ids.includes(id))

                  return (
                    <div key={categoria} className={idx > 0 ? 'border-t border-[#F0F0F0]' : ''}>
                      {/* Cabecera de categoría */}
                      <div
                        className="flex items-center gap-2.5 px-4 py-2.5 bg-[#F8F9FA] cursor-pointer hover:bg-[#F0F2F5] transition-colors"
                        onClick={() => toggleCategoria(categoria)}
                      >
                        <Checkbox
                          id={`cat-${categoria}`}
                          checked={allSelected}
                          data-state={someSelected && !allSelected ? 'indeterminate' : undefined}
                          className={`border-[#C0C0C0] data-[state=checked]:bg-[#002868] data-[state=checked]:border-[#002868] ${
                            someSelected && !allSelected ? 'opacity-60' : ''
                          }`}
                          onCheckedChange={() => toggleCategoria(categoria)}
                        />
                        <span className="text-xs font-bold text-[#333] uppercase tracking-wide">{categoria}</span>
                        <span className="text-xs text-[#999] ml-auto">
                          {catIds.filter(id => form.permiso_ids.includes(id)).length}/{catIds.length}
                        </span>
                      </div>

                      {/* Permisos de la categoría */}
                      <div className="px-4 py-2 space-y-1.5 bg-white">
                        {permsCategoria.map(permiso => (
                          <div
                            key={permiso.id}
                            className="flex items-center gap-2.5 py-1 cursor-pointer group"
                            onClick={() => togglePermiso(permiso.id)}
                          >
                            <Checkbox
                              id={`perm-${permiso.id}`}
                              checked={form.permiso_ids.includes(permiso.id)}
                              className="border-[#C0C0C0] data-[state=checked]:bg-[#002868] data-[state=checked]:border-[#002868]"
                              onCheckedChange={() => togglePermiso(permiso.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#1A1A1A] group-hover:text-[#002868] transition-colors">
                                {permiso.descripcion}
                              </p>
                              <p className="text-xs text-[#999] font-mono">{permiso.clave}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-[#999]">
                {form.permiso_ids.length} de {permisos.length} permisos seleccionados
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}
          </div>

          <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC] flex-shrink-0">
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
                className="border-[#E0E0E0] text-[#5A6070] hover:bg-[#F0F0F0] hover:text-[#1A1A1A]"
              >
                Cancelar
              </Button>
              <Button
                id="btn-guardar-rol"
                onClick={handleSave}
                disabled={isSaving || !form.nombre.trim()}
                className="bg-[#002868] hover:bg-[#003d8f] text-white"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : editingRol ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Rol'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Eliminar Rol</DialogTitle>
            <DialogDescription className="text-[#666666]">
              Esta acción no se puede deshacer. ¿Estás seguro?
            </DialogDescription>
          </DialogHeader>
          {rolToDelete && (
            <div className="py-3">
              <div className="p-4 bg-[#F5F5F5] rounded-lg border border-[#E0E0E0]">
                <p className="font-semibold text-[#1A1A1A]">{rolToDelete.nombre}</p>
                {rolToDelete.descripcion && <p className="text-sm text-[#666666] mt-0.5">{rolToDelete.descripcion}</p>}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
              className="border-[#E0E0E0] text-[#666666]"
            >
              Cancelar
            </Button>
            <Button
              id="btn-confirmar-eliminar-rol"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
