'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Trash2, Building2, ChevronDown, ChevronUp } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'

interface Usuario {
  id: number
  email: string
  nombre: string
  rol: string
  rol_id: number
  activo: boolean
  must_change_password?: boolean
  two_factor_enabled?: boolean
}

interface Rol {
  id: number
  nombre: string
  descripcion: string | null
}

interface Sucursal {
  id: number
  nombre: string
  two_factor_enabled?: boolean
}

interface UsuarioForm {
  email: string
  password: string
  nombre: string
  rol_id: number | ''
  sucursal_ids: number[]
  must_change_password: boolean
}

const DEFAULT_FORM: UsuarioForm = {
  email: '',
  password: '',
  nombre: '',
  rol_id: '',
  sucursal_ids: [],
  must_change_password: true,
}

function getInitials(nombre: string) {
  return nombre
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const ROL_BADGE_COLORS: Record<string, string> = {
  superadmin: 'bg-purple-50 text-purple-700 border border-purple-200',
  admin: 'bg-blue-50 text-blue-700 border border-blue-200',
  directivo: 'bg-amber-50 text-amber-700 border border-amber-200',
  gerente: 'bg-green-50 text-green-700 border border-green-200',
}

function getRolBadgeClass(rolNombre: string) {
  return ROL_BADGE_COLORS[rolNombre?.toLowerCase()] || 'bg-gray-50 text-gray-700 border border-gray-200'
}

function getRolLabel(rolNombre: string) {
  const labels: Record<string, string> = {
    superadmin: 'Super Admin',
    admin: 'Administrador',
    directivo: 'Directivo',
    gerente: 'Gerente',
  }
  return labels[rolNombre?.toLowerCase()] || rolNombre
}

export function UsuariosSection() {
  const canGestionarUsuarios = useAuthStore(state => state.canGestionarUsuarios())
  const currentUser = useAuthStore(state => state.user)

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState<UsuarioForm>(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [showSucursales, setShowSucursales] = useState(false)

  // Sucursales dialog (editar sucursales de usuario existente)
  const [sucursalesDialogOpen, setSucursalesDialogOpen] = useState(false)
  const [editingSucursalesUser, setEditingSucursalesUser] = useState<Usuario | null>(null)
  const [sucursalesSeleccionadas, setSucursalesSeleccionadas] = useState<number[]>([])
  const [isSavingSucursales, setIsSavingSucursales] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reset 2FA dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [usuarioToReset, setUsuarioToReset] = useState<Usuario | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const [resUsuarios, resRoles, resSucursales] = await Promise.all([
        apiFetch(API_ENDPOINTS.CONFIGURACION.USUARIOS.GET_ALL),
        apiFetch(API_ENDPOINTS.CONFIGURACION.ROLES.GET_ALL),
        apiFetch(API_ENDPOINTS.SUCURSALES.GET_ALL),
      ])
      const [dataU, dataR, dataS] = await Promise.all([resUsuarios.json(), resRoles.json(), resSucursales.json()])
      if (dataU.success) setUsuarios(dataU.data)
      if (dataR.success) setRoles(dataR.data)
      if (dataS.success) setSucursales(dataS.data)
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!form.email || !form.password || !form.nombre || !form.rol_id) {
      setFormError('Todos los campos obligatorios son requeridos')
      return
    }
    if (form.password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setIsSaving(true)
    setFormError('')
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.USUARIOS.CREATE, {
        method: 'POST',
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          nombre: form.nombre,
          rol_id: Number(form.rol_id),
          sucursal_ids: form.sucursal_ids,
          must_change_password: form.must_change_password,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setIsCreateOpen(false)
        setForm(DEFAULT_FORM)
        await fetchAll()
      } else {
        setFormError(data.message)
      }
    } catch {
      setFormError('Error al crear usuario')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangeRol = async (userId: number, nuevoRolId: number) => {
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.USUARIOS.UPDATE_ROL(userId), {
        method: 'PUT',
        body: JSON.stringify({ rol_id: nuevoRolId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Rol actualizado')
        await fetchAll()
      } else {
        toast.error(data.message || 'Error al actualizar rol')
      }
    } catch {
      toast.error('Error al actualizar rol del usuario')
    }
  }

  const handleToggleActivo = async (userId: number) => {
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.USUARIOS.TOGGLE_ACTIVO(userId), { method: 'PUT' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        await fetchAll()
      } else {
        toast.error(data.message || 'Error al cambiar estado')
      }
    } catch {
      toast.error('Error al cambiar estado del usuario')
    }
  }

  const handleDeleteClick = (usuario: Usuario) => {
    setUsuarioToDelete(usuario)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!usuarioToDelete) return
    setIsDeleting(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.USUARIOS.DELETE(usuarioToDelete.id), { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Usuario eliminado correctamente')
        setUsuarios(prev => prev.filter(u => u.id !== usuarioToDelete.id))
        setDeleteDialogOpen(false)
        setUsuarioToDelete(null)
      } else {
        toast.error(data.message || 'Error al eliminar usuario')
      }
    } catch {
      toast.error('Error al eliminar usuario')
    } finally {
      setIsDeleting(false)
    }
  }

  const openSucursalesDialog = async (usuario: Usuario) => {
    setEditingSucursalesUser(usuario)
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.USUARIOS.GET_SUCURSALES(usuario.id))
      const data = await res.json()
      if (data.success) {
        setSucursalesSeleccionadas(data.data.map((s: Sucursal) => s.id))
      }
    } catch {
      setSucursalesSeleccionadas([])
    }
    setSucursalesDialogOpen(true)
  }

  const handleSaveSucursales = async () => {
    if (!editingSucursalesUser) return
    setIsSavingSucursales(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.USUARIOS.UPDATE_SUCURSALES(editingSucursalesUser.id), {
        method: 'PUT',
        body: JSON.stringify({ sucursal_ids: sucursalesSeleccionadas }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Sucursales actualizadas')
        setSucursalesDialogOpen(false)
      } else {
        toast.error(data.message || 'Error al actualizar sucursales')
      }
    } catch {
      toast.error('Error al actualizar sucursales')
    } finally {
      setIsSavingSucursales(false)
    }
  }

  const toggleSucursalForm = (id: number) => {
    setForm(prev => ({
      ...prev,
      sucursal_ids: prev.sucursal_ids.includes(id)
        ? prev.sucursal_ids.filter(s => s !== id)
        : [...prev.sucursal_ids, id],
    }))
  }

  const toggleSucursalEdit = (id: number) => {
    setSucursalesSeleccionadas(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]))
  }

  const handleResetClick = (usuario: Usuario) => {
    setUsuarioToReset(usuario)
    setResetDialogOpen(true)
  }

  const handleConfirmReset = async () => {
    if (!usuarioToReset) return
    setIsResetting(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.AUTH.RESET_2FA, {
        method: 'POST',
        body: JSON.stringify({ userId: usuarioToReset.id }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setResetDialogOpen(false)
        setUsuarioToReset(null)
        await fetchAll()
      } else {
        toast.error(data.message || 'Error al resetear 2FA')
      }
    } catch {
      toast.error('Error al resetear 2FA')
    } finally {
      setIsResetting(false)
    }
  }

  const isMainAdmin = (email: string) => email === 'admin@heroica.com'

  if (isLoading) {
    return (
      <Card className="border-[#E0E0E0]">
        <CardContent className="py-10">
          <p className="text-center text-[#666666]">Cargando usuarios...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-[#E0E0E0] shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#F0F0F0]">
          <div>
            <CardTitle className="text-[#002868]">Usuarios y Roles</CardTitle>
            <p className="text-sm text-[#666666] mt-0.5">
              {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
            </p>
          </div>
          {canGestionarUsuarios && (
            <Button
              id="btn-nuevo-usuario"
              onClick={() => {
                setForm(DEFAULT_FORM)
                setFormError('')
                setShowSucursales(false)
                setIsCreateOpen(true)
              }}
              className="bg-[#002868] hover:bg-[#003d8f] text-white"
            >
              + Nuevo Usuario
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {usuarios.length === 0 ? (
            <p className="text-center text-[#666666] py-10">No hay usuarios registrados</p>
          ) : (
            <div className="divide-y divide-[#F0F0F0]">
              {usuarios.map(usuario => {
                const isProtected = isMainAdmin(usuario.email)
                const badgeClass = getRolBadgeClass(usuario.rol)
                const badgeLabel = getRolLabel(usuario.rol)
                const isSelf = currentUser?.id === usuario.id
                return (
                  <div
                    key={usuario.id}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors ${usuario.activo ? 'hover:bg-gray-50/80' : 'bg-gray-50/50'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 select-none ${
                        usuario.activo ? 'bg-[#002868]/10 text-[#002868]' : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {getInitials(usuario.nombre)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#1A1A1A] truncate">{usuario.nombre}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                        {usuario.two_factor_enabled && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            2FA
                          </span>
                        )}
                        {usuario.two_factor_enabled && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            2FA
                          </span>
                        )}
                        {!usuario.activo && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                            Inactivo
                          </span>
                        )}
                        {isProtected && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Protegido
                          </span>
                        )}
                        {usuario.must_change_password && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                            Debe cambiar clave
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#666666] truncate mt-0.5">{usuario.email}</p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isProtected ? (
                        <span className="text-xs text-[#999999] italic px-2">No editable</span>
                      ) : isSelf ? (
                        <span className="text-xs text-[#999999] italic px-2">Sesión actual</span>
                      ) : !canGestionarUsuarios ? (
                        <span className="text-xs text-[#999999] italic px-2">Solo lectura</span>
                      ) : (
                        <>
                          {/* Selector de rol dinámico */}
                          <Select
                            value={usuario.rol_id.toString()}
                            onValueChange={value => handleChangeRol(usuario.id, parseInt(value))}
                          >
                            <SelectTrigger className="w-[160px] h-9 text-sm border-[#E0E0E0] bg-white text-[#1A1A1A]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map(rol => (
                                <SelectItem key={rol.id} value={rol.id.toString()}>
                                  {getRolLabel(rol.nombre)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Botón sucursales */}
                          <button
                            id={`btn-sucursales-${usuario.id}`}
                            onClick={() => openSucursalesDialog(usuario)}
                            title="Gestionar sucursales"
                            className="w-8 h-8 flex items-center justify-center rounded-md text-[#555] hover:text-[#002868] hover:bg-[#EEF2FF] transition-colors cursor-pointer"
                          >
                            <Building2 className="w-4 h-4" />
                          </button>

                          {/* Toggle activo */}
                          <div className="flex items-center gap-1.5">
                            <Switch
                              id={`activo-${usuario.id}`}
                              checked={usuario.activo}
                              onCheckedChange={() => handleToggleActivo(usuario.id)}
                              className="data-[state=checked]:bg-[#002868]"
                            />
                            <Label
                              htmlFor={`activo-${usuario.id}`}
                              className="text-xs text-[#666666] cursor-pointer w-12 select-none"
                            >
                              {usuario.activo ? 'Activo' : 'Inactivo'}
                            </Label>
                          </div>

                          {/* Eliminar */}
                          <button
                            id={`btn-eliminar-usuario-${usuario.id}`}
                            onClick={() => handleDeleteClick(usuario)}
                            title="Eliminar usuario"
                            className="w-8 h-8 flex items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {usuario.two_factor_enabled && (
                            <Button
                              onClick={() => handleResetClick(usuario)}
                              variant="outline"
                              size="sm"
                              className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 h-8 text-xs"
                            >
                              Resetear 2FA
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Crear usuario */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0] flex-shrink-0">
            <DialogHeader className="p-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A]">Nuevo Usuario</DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                Creá un nuevo usuario y asignale un rol y sucursales
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-8 py-6 space-y-4 overflow-y-auto flex-1">
            {/* Nombre */}
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                Nombre *
              </Label>
              <Input
                id="nuevo-usuario-nombre"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="h-10 border-[#E0E0E0] text-[#1A1A1A]"
              />
            </div>

            {/* Email */}
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                Email *
              </Label>
              <Input
                id="nuevo-usuario-email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="ejemplo@correo.com"
                className="h-10 border-[#E0E0E0] text-[#1A1A1A]"
              />
            </div>

            {/* Contraseña */}
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                Contraseña inicial *
              </Label>
              <Input
                id="nuevo-usuario-password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="h-10 border-[#E0E0E0] text-[#1A1A1A]"
              />
            </div>

            {/* Rol */}
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">Rol *</Label>
              <Select
                value={form.rol_id.toString()}
                onValueChange={value => setForm({ ...form, rol_id: parseInt(value) })}
              >
                <SelectTrigger className="h-10 border-[#E0E0E0] text-[#1A1A1A]">
                  <SelectValue placeholder="Seleccioná un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(rol => (
                    <SelectItem key={rol.id} value={rol.id.toString()}>
                      {getRolLabel(rol.nombre)}
                      {rol.descripcion && <span className="text-xs text-[#999] ml-2">— {rol.descripcion}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Forzar cambio de contraseña */}
            <div className="flex items-center gap-3 p-3 bg-[#F8F9FA] rounded-lg border border-[#E8E8E8]">
              <Checkbox
                id="must-change-password"
                checked={form.must_change_password}
                onCheckedChange={checked => setForm({ ...form, must_change_password: Boolean(checked) })}
                className="border-[#C0C0C0] data-[state=checked]:bg-[#002868] data-[state=checked]:border-[#002868]"
              />
              <div>
                <Label htmlFor="must-change-password" className="text-sm font-medium text-[#333] cursor-pointer">
                  Forzar cambio de contraseña
                </Label>
                <p className="text-xs text-[#999] mt-0.5">El usuario deberá cambiarla al ingresar por primera vez</p>
              </div>
            </div>

            {/* Sucursales — colapsable */}
            <div>
              <button
                type="button"
                onClick={() => setShowSucursales(!showSucursales)}
                className="flex items-center gap-2 w-full text-left"
              >
                <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider cursor-pointer">
                  Sucursales asignadas
                </Label>
                <span className="text-xs text-[#002868] ml-auto flex items-center gap-1 font-medium">
                  {form.sucursal_ids.length > 0
                    ? `${form.sucursal_ids.length} seleccionada${form.sucursal_ids.length !== 1 ? 's' : ''}`
                    : 'Todas'}
                  {showSucursales ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>

              {showSucursales && (
                <div className="mt-2 border border-[#E0E0E0] rounded-lg overflow-hidden">
                  <div className="p-2 bg-[#F8F9FA] border-b border-[#E8E8E8]">
                    <p className="text-xs text-[#777]">Sin selección = acceso a todas. Seleccioná para restringir.</p>
                  </div>
                  <div className="max-h-36 overflow-y-auto divide-y divide-[#F5F5F5]">
                    {sucursales.map(s => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#F8F9FA] cursor-pointer"
                        onClick={() => toggleSucursalForm(s.id)}
                      >
                        <Checkbox
                          id={`suc-form-${s.id}`}
                          checked={form.sucursal_ids.includes(s.id)}
                          onCheckedChange={() => toggleSucursalForm(s.id)}
                          className="border-[#C0C0C0] data-[state=checked]:bg-[#002868] data-[state=checked]:border-[#002868]"
                        />
                        <span className="text-sm text-[#1A1A1A]">{s.nombre}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {formError && <p className="text-sm text-rose-600">{formError}</p>}
          </div>

          <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC] flex-shrink-0">
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSaving}
                className="border-[#E0E0E0] text-[#5A6070] hover:bg-[#F0F0F0] hover:text-[#1A1A1A]"
              >
                Cancelar
              </Button>
              <Button
                id="btn-crear-usuario"
                onClick={handleSave}
                disabled={isSaving || !form.email || !form.password || !form.nombre || !form.rol_id}
                className="bg-[#002868] hover:bg-[#003d8f] text-white"
              >
                {isSaving ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Gestionar sucursales de usuario existente */}
      <Dialog open={sucursalesDialogOpen} onOpenChange={setSucursalesDialogOpen}>
        <DialogContent className="sm:max-w-[440px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-7 pt-7 pb-4 border-b border-[#F0F0F0]">
            <DialogHeader className="p-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A]">
                Sucursales de {editingSucursalesUser?.nombre}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                Seleccioná las sucursales a las que puede acceder. Sin selección = acceso a todas.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-7 py-5">
            <div className="border border-[#E0E0E0] rounded-lg overflow-hidden divide-y divide-[#F5F5F5]">
              {sucursales.map(s => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F9FA] cursor-pointer transition-colors"
                  onClick={() => toggleSucursalEdit(s.id)}
                >
                  <Checkbox
                    id={`suc-edit-${s.id}`}
                    checked={sucursalesSeleccionadas.includes(s.id)}
                    onCheckedChange={() => toggleSucursalEdit(s.id)}
                    className="border-[#C0C0C0] data-[state=checked]:bg-[#002868] data-[state=checked]:border-[#002868]"
                  />
                  <span className="text-sm text-[#1A1A1A]">{s.nombre}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#999] mt-2 text-center">
              {sucursalesSeleccionadas.length > 0
                ? `${sucursalesSeleccionadas.length} sucursal${sucursalesSeleccionadas.length !== 1 ? 'es' : ''} seleccionada${sucursalesSeleccionadas.length !== 1 ? 's' : ''}`
                : 'Acceso a todas las sucursales'}
            </p>
          </div>

          <div className="px-7 py-4 border-t border-[#F0F0F0] bg-[#FAFBFC]">
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setSucursalesDialogOpen(false)}
                disabled={isSavingSucursales}
                className="border-[#E0E0E0] text-[#5A6070]"
              >
                Cancelar
              </Button>
              <Button
                id="btn-guardar-sucursales"
                onClick={handleSaveSucursales}
                disabled={isSavingSucursales}
                className="bg-[#002868] hover:bg-[#003d8f] text-white"
              >
                {isSavingSucursales ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Eliminar Usuario</DialogTitle>
            <DialogDescription className="text-[#666666]">
              Esta acción no se puede deshacer. ¿Estás seguro?
            </DialogDescription>
          </DialogHeader>

          {usuarioToDelete && (
            <div className="py-3">
              <div className="flex items-center gap-3 p-4 bg-[#F5F5F5] rounded-lg border border-[#E0E0E0]">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {getInitials(usuarioToDelete.nombre)}
                </div>
                <div>
                  <p className="font-semibold text-[#1A1A1A]">{usuarioToDelete.nombre}</p>
                  <p className="text-sm text-[#666666]">{usuarioToDelete.email}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]"
            >
              Cancelar
            </Button>
            <Button
              id="btn-confirmar-eliminar-usuario"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Eliminando...</span>
                </div>
              ) : (
                'Eliminar Usuario'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Resetear 2FA */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-orange-600">Resetear Autenticación 2FA</DialogTitle>
            <DialogDescription className="text-[#666666]">
              El usuario deberá configurar nuevamente su 2FA en el próximo inicio de sesión
            </DialogDescription>
          </DialogHeader>

          {usuarioToReset && (
            <div className="py-3">
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {getInitials(usuarioToReset.nombre)}
                </div>
                <div>
                  <p className="font-semibold text-[#1A1A1A]">{usuarioToReset.nombre}</p>
                  <p className="text-sm text-[#666666]">{usuarioToReset.email}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
              disabled={isResetting}
              className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmReset}
              disabled={isResetting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isResetting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Reseteando...</span>
                </div>
              ) : (
                'Resetear 2FA'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
