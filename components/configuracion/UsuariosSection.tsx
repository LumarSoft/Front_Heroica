"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import { ROLES } from "@/lib/constants";
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
  rol_id: ROLES.GERENTE.id,
};

const ROLES_LIST = [
  { id: ROLES.GERENTE.id, nombre: ROLES.GERENTE.nombre, label: "Gerente" },
  { id: ROLES.ADMIN.id, nombre: ROLES.ADMIN.nombre, label: "Administrador" },
  { id: ROLES.SUPERADMIN.id, nombre: ROLES.SUPERADMIN.nombre, label: "Super Administrador" },
];

export function UsuariosSection() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<UsuarioForm>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.USUARIOS.GET_ALL);
      const data = await res.json();
      if (data.success) {
        setUsuarios(data.data);
      }
    } catch (error) {
      toast.error("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNew = () => {
    setForm(DEFAULT_FORM);
    setError("");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.email || !form.password || !form.nombre || !form.rol_id) {
      setError("Todos los campos son requeridos");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.USUARIOS.CREATE, {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setIsDialogOpen(false);
        await fetchUsuarios();
      } else {
        setError(data.message);
      }
    } catch {
      setError("Error al crear usuario");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeRol = async (userId: number, nuevoRolId: number) => {
    try {
      const res = await apiFetch(
        API_ENDPOINTS.CONFIGURACION.USUARIOS.UPDATE_ROL(userId),
        {
          method: "PUT",
          body: JSON.stringify({ rol_id: nuevoRolId }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Rol actualizado correctamente");
        await fetchUsuarios();
      } else {
        toast.error(data.message || "Error al actualizar rol");
      }
    } catch (error) {
      toast.error("Error al actualizar rol del usuario");
    }
  };

  const handleToggleActivo = async (userId: number) => {
    try {
      const res = await apiFetch(
        API_ENDPOINTS.CONFIGURACION.USUARIOS.TOGGLE_ACTIVO(userId),
        {
          method: "PUT",
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        await fetchUsuarios();
      } else {
        toast.error(data.message || "Error al cambiar estado del usuario");
      }
    } catch (error) {
      toast.error("Error al cambiar estado del usuario");
    }
  };

  const getRolLabel = (rolId: number) => {
    return ROLES_LIST.find((r) => r.id === rolId)?.label || "Desconocido";
  };

  const getRolBadgeColor = (rolId: number) => {
    switch (rolId) {
      case ROLES.SUPERADMIN.id:
        return "bg-purple-100 text-purple-800";
      case ROLES.ADMIN.id:
        return "bg-blue-100 text-blue-800";
      case ROLES.GERENTE.id:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isMainAdmin = (email: string) => email === "admin@heroica.com";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-[#666666]">Cargando usuarios...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Usuarios y Roles</CardTitle>
          <Button onClick={handleOpenNew} className="bg-[#002868] hover:bg-[#003d8f]">
            + Nuevo Usuario
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {usuarios.length === 0 ? (
              <p className="text-center text-[#666666] py-4">No hay usuarios registrados</p>
            ) : (
              usuarios.map((usuario) => {
                const isProtected = isMainAdmin(usuario.email);
                return (
                  <div
                    key={usuario.id}
                    className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg ${
                      usuario.activo ? "hover:bg-gray-50" : "bg-gray-50 opacity-60"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#002868]">{usuario.nombre}</h3>
                        {!usuario.activo && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#666666]">{usuario.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${getRolBadgeColor(
                          usuario.rol_id
                        )}`}
                      >
                        {getRolLabel(usuario.rol_id)}
                      </span>
                      {isProtected ? (
                        <div className="w-[180px] text-center">
                          <span className="text-xs text-[#666666] italic">No editable</span>
                        </div>
                      ) : (
                        <Select
                          value={usuario.rol_id.toString()}
                          onValueChange={(value) =>
                            handleChangeRol(usuario.id, parseInt(value))
                          }
                        >
                          <SelectTrigger className="w-[180px] h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm">
                            <SelectValue placeholder="Cambiar rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES_LIST.map((rol) => (
                              <SelectItem key={rol.id} value={rol.id.toString()}>
                                {rol.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`activo-${usuario.id}`}
                          className="text-xs text-[#666666] cursor-pointer"
                        >
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </Label>
                        <Switch
                          id={`activo-${usuario.id}`}
                          checked={usuario.activo}
                          onCheckedChange={() => handleToggleActivo(usuario.id)}
                          disabled={isProtected}
                          className="data-[state=checked]:bg-[#002868]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
            <DialogHeader className="p-0 border-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                Nuevo Usuario
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                Crea un nuevo usuario en el sistema
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <Label
                htmlFor="usuario-nombre"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Nombre *
              </Label>
              <Input
                id="usuario-nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label
                htmlFor="usuario-email"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Email *
              </Label>
              <Input
                id="usuario-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ejemplo@correo.com"
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label
                htmlFor="usuario-password"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Contraseña *
              </Label>
              <Input
                id="usuario-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label
                htmlFor="usuario-rol"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Rol *
              </Label>
              <Select
                value={form.rol_id.toString()}
                onValueChange={(value) =>
                  setForm({ ...form, rol_id: parseInt(value) })
                }
              >
                <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]">
                  <SelectValue placeholder="Seleccione el rol" />
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
                disabled={isSaving || !form.email || !form.password || !form.nombre}
                className="h-10 px-6 rounded-lg bg-[#002868] text-white font-semibold hover:bg-[#003d8f] shadow-sm transition-all"
              >
                {isSaving ? "Creando..." : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
