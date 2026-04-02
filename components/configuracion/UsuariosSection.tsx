"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  rol_id: number;
  activo: boolean;
  two_factor_enabled: boolean;
}

interface UsuarioForm {
  email: string;
  password: string;
  nombre: string;
  rol_id: number;
}

const DEFAULT_FORM: UsuarioForm = {
  email: "",
  password: "",
  nombre: "",
  rol_id: ROLES.ADMIN.id,
};

const ROLES_LIST = [
  { id: ROLES.ADMIN.id, label: "Administrador" },
  { id: ROLES.SUPERADMIN.id, label: "Super Administrador" },
];

function getInitials(nombre: string) {
  return nombre
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getRolBadge(rolId: number) {
  if (rolId === ROLES.SUPERADMIN.id) {
    return {
      label: "Super Admin",
      classes: "bg-purple-50 text-purple-700 border border-purple-200",
    };
  }
  return {
    label: "Administrador",
    classes: "bg-blue-50 text-blue-700 border border-blue-200",
  };
}

export function UsuariosSection() {
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin());
  const currentUser = useAuthStore((state) => state.user);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<UsuarioForm>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset 2FA dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [usuarioToReset, setUsuarioToReset] = useState<Usuario | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.USUARIOS.GET_ALL);
      const data = await res.json();
      if (data.success) setUsuarios(data.data);
    } catch {
      toast.error("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.email || !form.password || !form.nombre || !form.rol_id) {
      setFormError("Todos los campos son requeridos");
      return;
    }
    if (form.password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setIsSaving(true);
    setFormError("");
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.USUARIOS.CREATE, {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setIsCreateOpen(false);
        setForm(DEFAULT_FORM);
        await fetchUsuarios();
      } else {
        setFormError(data.message);
      }
    } catch {
      setFormError("Error al crear usuario");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeRol = async (userId: number, nuevoRolId: number) => {
    try {
      const res = await apiFetch(
        API_ENDPOINTS.CONFIGURACION.USUARIOS.UPDATE_ROL(userId),
        { method: "PUT", body: JSON.stringify({ rol_id: nuevoRolId }) },
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Rol actualizado");
        await fetchUsuarios();
      } else {
        toast.error(data.message || "Error al actualizar rol");
      }
    } catch {
      toast.error("Error al actualizar rol del usuario");
    }
  };

  const handleToggleActivo = async (userId: number) => {
    try {
      const res = await apiFetch(
        API_ENDPOINTS.CONFIGURACION.USUARIOS.TOGGLE_ACTIVO(userId),
        { method: "PUT" },
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        await fetchUsuarios();
      } else {
        toast.error(data.message || "Error al cambiar estado");
      }
    } catch {
      toast.error("Error al cambiar estado del usuario");
    }
  };

  const handleDeleteClick = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!usuarioToDelete) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(
        API_ENDPOINTS.CONFIGURACION.USUARIOS.DELETE(usuarioToDelete.id),
        { method: "DELETE" },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Usuario eliminado correctamente");
        setUsuarios((prev) => prev.filter((u) => u.id !== usuarioToDelete.id));
        setDeleteDialogOpen(false);
        setUsuarioToDelete(null);
      } else {
        toast.error(data.message || "Error al eliminar usuario");
      }
    } catch {
      toast.error("Error al eliminar usuario");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetClick = (usuario: Usuario) => {
    setUsuarioToReset(usuario);
    setResetDialogOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!usuarioToReset) return;
    setIsResetting(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.AUTH.RESET_2FA, {
        method: "POST",
        body: JSON.stringify({ userId: usuarioToReset.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setResetDialogOpen(false);
        setUsuarioToReset(null);
        await fetchUsuarios();
      } else {
        toast.error(data.message || "Error al resetear 2FA");
      }
    } catch {
      toast.error("Error al resetear 2FA");
    } finally {
      setIsResetting(false);
    }
  };

  const isMainAdmin = (email: string) => email === "admin@heroica.com";

  if (isLoading) {
    return (
      <Card className="border-[#E0E0E0]">
        <CardContent className="py-10">
          <p className="text-center text-[#666666]">Cargando usuarios...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-[#E0E0E0] shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#F0F0F0]">
          <div>
            <CardTitle className="text-[#002868]">Usuarios y Roles</CardTitle>
            <p className="text-sm text-[#666666] mt-0.5">
              {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""}{" "}
              registrado{usuarios.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isSuperAdmin && (
            <Button
              onClick={() => {
                setForm(DEFAULT_FORM);
                setFormError("");
                setIsCreateOpen(true);
              }}
              className="bg-[#002868] hover:bg-[#003d8f] text-white"
            >
              + Nuevo Usuario
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {usuarios.length === 0 ? (
            <p className="text-center text-[#666666] py-10">
              No hay usuarios registrados
            </p>
          ) : (
            <div className="divide-y divide-[#F0F0F0]">
              {usuarios.map((usuario) => {
                const isProtected = isMainAdmin(usuario.email);
                const badge = getRolBadge(usuario.rol_id);
                const isSelf = currentUser?.id === usuario.id;
                return (
                  <div
                    key={usuario.id}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                      usuario.activo ? "hover:bg-gray-50/80" : "bg-gray-50/50"
                    }`}
                  >
                    {/* Avatar con iniciales */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 select-none ${
                        usuario.activo
                          ? "bg-[#002868]/10 text-[#002868]"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {getInitials(usuario.nombre)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#1A1A1A] truncate">
                          {usuario.nombre}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                        {usuario.two_factor_enabled && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
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
                      </div>
                      <p className="text-sm text-[#666666] truncate mt-0.5">
                        {usuario.email}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {isProtected ? (
                        <span className="text-xs text-[#999999] italic px-2">
                          No editable
                        </span>
                      ) : isSelf ? (
                        <span className="text-xs text-[#999999] italic px-2">
                          Sesión actual
                        </span>
                      ) : !isSuperAdmin ? (
                        <span className="text-xs text-[#999999] italic px-2">
                          Solo lectura
                        </span>
                      ) : (
                        <>
                          <Select
                            value={usuario.rol_id.toString()}
                            onValueChange={(value) =>
                              handleChangeRol(usuario.id, parseInt(value))
                            }
                          >
                            <SelectTrigger className="w-[170px] h-9 text-sm border-[#E0E0E0] bg-white text-[#1A1A1A]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES_LIST.map((rol) => (
                                <SelectItem
                                  key={rol.id}
                                  value={rol.id.toString()}
                                >
                                  {rol.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="flex items-center gap-2">
                            <Switch
                              id={`activo-${usuario.id}`}
                              checked={usuario.activo}
                              onCheckedChange={() =>
                                handleToggleActivo(usuario.id)
                              }
                              className="data-[state=checked]:bg-[#002868]"
                            />
                            <Label
                              htmlFor={`activo-${usuario.id}`}
                              className="text-xs text-[#666666] cursor-pointer w-12 select-none"
                            >
                              {usuario.activo ? "Activo" : "Inactivo"}
                            </Label>
                          </div>

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

                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteClick(usuario)}
                              title="Eliminar usuario"
                              className="w-8 h-8 flex items-center justify-center rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Crear usuario */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
            <DialogHeader className="p-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A]">
                Nuevo Usuario
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                Crea un nuevo usuario en el sistema
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-8 py-6 space-y-4">
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                Nombre *
              </Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="h-10 border-[#E0E0E0] text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                Email *
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ejemplo@correo.com"
                className="h-10 border-[#E0E0E0] text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                Contraseña *
              </Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="h-10 border-[#E0E0E0] text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                Rol *
              </Label>
              <Select
                value={form.rol_id.toString()}
                onValueChange={(value) =>
                  setForm({ ...form, rol_id: parseInt(value) })
                }
              >
                <SelectTrigger className="h-10 border-[#E0E0E0] text-[#1A1A1A]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_LIST.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id.toString()}>
                      {rol.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formError && <p className="text-sm text-rose-600">{formError}</p>}
          </div>

          <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
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
                onClick={handleSave}
                disabled={
                  isSaving || !form.email || !form.password || !form.nombre
                }
                className="bg-[#002868] hover:bg-[#003d8f] text-white"
              >
                {isSaving ? "Creando..." : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">
              Eliminar Usuario
            </DialogTitle>
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
                  <p className="font-semibold text-[#1A1A1A]">
                    {usuarioToDelete.nombre}
                  </p>
                  <p className="text-sm text-[#666666]">
                    {usuarioToDelete.email}
                  </p>
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
                "Eliminar Usuario"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Resetear 2FA */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-orange-600">
              Resetear Autenticación 2FA
            </DialogTitle>
            <DialogDescription className="text-[#666666]">
              El usuario deberá configurar nuevamente su 2FA en el próximo
              inicio de sesión
            </DialogDescription>
          </DialogHeader>

          {usuarioToReset && (
            <div className="py-3">
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {getInitials(usuarioToReset.nombre)}
                </div>
                <div>
                  <p className="font-semibold text-[#1A1A1A]">
                    {usuarioToReset.nombre}
                  </p>
                  <p className="text-sm text-[#666666]">
                    {usuarioToReset.email}
                  </p>
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
                "Resetear 2FA"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
