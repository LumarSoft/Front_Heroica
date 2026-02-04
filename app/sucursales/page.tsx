"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API_ENDPOINTS } from "@/lib/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import Image from "next/image";

interface Sucursal {
  id: number;
  nombre: string;
  razon_social: string;
  cuit: string;
  direccion: string;
  activo: boolean;
}

export default function SucursalesPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  // Estados para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    razon_social: "",
    cuit: "",
    direccion: "",
  });

  // Esperar a que Zustand se hidrate desde localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // No verificar autenticación hasta que se haya hidratado
    if (!isHydrated) return;

    // Verificar autenticación
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    // Cargar sucursales desde la API
    const fetchSucursales = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.SUCURSALES.GET_ALL);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Error al cargar sucursales");
        }

        setSucursales(data.data);
      } catch (err: any) {
        console.error("Error al cargar sucursales:", err);
        setError(err.message || "Error al cargar sucursales");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSucursales();
  }, [isAuthenticated, isHydrated, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSucursal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");

    try {
      const response = await fetch(API_ENDPOINTS.SUCURSALES.CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al crear sucursal");
      }

      // Agregar la nueva sucursal a la lista
      setSucursales((prev) => [...prev, { ...data.data, activo: true }]);

      // Cerrar modal y limpiar formulario
      setIsModalOpen(false);
      setFormData({
        nombre: "",
        razon_social: "",
        cuit: "",
        direccion: "",
      });
    } catch (err: any) {
      console.error("Error al crear sucursal:", err);
      setError(err.message || "Error al crear sucursal");
    } finally {
      setIsCreating(false);
    }
  };

  // Estados para el modal de eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sucursalToDelete, setSucursalToDelete] = useState<Sucursal | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, sucursal: Sucursal) => {
    e.stopPropagation(); // Evitar que se active el click de la tarjeta
    setSucursalToDelete(sucursal);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!sucursalToDelete) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(
        API_ENDPOINTS.SUCURSALES.DELETE(sucursalToDelete.id),
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al eliminar sucursal");
      }

      // Remover la sucursal de la lista
      setSucursales((prev) => prev.filter((s) => s.id !== sucursalToDelete.id));

      // Cerrar modal
      setDeleteModalOpen(false);
      setSucursalToDelete(null);
    } catch (err: any) {
      console.error("Error al eliminar sucursal:", err);
      setError(err.message || "Error al eliminar sucursal");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSucursalClick = (id: number) => {
    router.push(`/sucursales/${id}`);
  };

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-[#E0E0E0] shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-[#002868]">HEROICA</h1>
            <div>
              <p className="text-sm text-[#666666]">Sistema de Contabilidad</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-[#1A1A1A]">{user?.nombre}</p>
              <p className="text-xs text-[#666666]">{user?.rol}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-[#002868] border-[#002868] text-white hover:bg-[#003d8f]"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-[#002868] mb-2">Sucursales</h2>
          <p className="text-[#666666]">
            Selecciona una sucursal para continuar
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sucursales.map((sucursal) => (
              <Card
                key={sucursal.id}
                className="border-[#E0E0E0] bg-white shadow-lg hover:shadow-xl hover:border-[#002868] transition-all hover:scale-[1.02] cursor-pointer relative"
                onClick={() => handleSucursalClick(sucursal.id)}
              >
                {/* Botón de eliminar */}
                <button
                  onClick={(e) => handleDeleteClick(e, sucursal)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all flex items-center justify-center shadow-sm hover:shadow-md z-10 cursor-pointer"
                  aria-label="Eliminar sucursal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>

                <CardHeader>
                  <CardTitle className="text-[#002868] text-xl pr-8">
                    {sucursal.nombre}
                  </CardTitle>
                  <CardDescription className="text-[#666666]">
                    {sucursal.razon_social}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-[#666666] font-semibold uppercase">
                      CUIT
                    </p>
                    <p className="text-sm text-[#1A1A1A] font-medium">
                      {sucursal.cuit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#666666] font-semibold uppercase">
                      Dirección
                    </p>
                    <p className="text-sm text-[#1A1A1A]">
                      {sucursal.direccion}
                    </p>
                  </div>
                  <div className="pt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sucursal.activo
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                        }`}
                    >
                      {sucursal.activo ? "● Activa" : "● Inactiva"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && sucursales.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#666666] text-lg">
              No hay sucursales disponibles
            </p>
          </div>
        )}
      </main>

      {/* Botón flotante para agregar sucursal */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#002868] text-white rounded-full shadow-2xl hover:bg-[#003d8f] hover:scale-110 transition-all flex items-center justify-center group cursor-pointer"
        aria-label="Agregar sucursal"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-8 h-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </button>

      {/* Modal para crear sucursal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#002868]">
              Nueva Sucursal
            </DialogTitle>
            <DialogDescription className="text-[#666666]">
              Completa los datos para crear una nueva sucursal
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSucursal}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label
                  htmlFor="nombre"
                  className="text-[#002868] font-semibold"
                >
                  Nombre de la Sucursal *
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Ej: Heroica Centro"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="razon_social"
                  className="text-[#002868] font-semibold"
                >
                  Razón Social *
                </Label>
                <Input
                  id="razon_social"
                  name="razon_social"
                  placeholder="Ej: Heroica Bar S.A."
                  value={formData.razon_social}
                  onChange={handleInputChange}
                  required
                  className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuit" className="text-[#002868] font-semibold">
                  CUIT *
                </Label>
                <Input
                  id="cuit"
                  name="cuit"
                  placeholder="Ej: 20-12345678-9"
                  value={formData.cuit}
                  onChange={handleInputChange}
                  required
                  className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="direccion"
                  className="text-[#002868] font-semibold"
                >
                  Dirección *
                </Label>
                <Input
                  id="direccion"
                  name="direccion"
                  placeholder="Ej: Av. Principal 123, Centro"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  required
                  className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
                className="border-[#E0E0E0] text-[#1A1A1A] hover:bg-[#F5F5F5]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-[#002868] hover:bg-[#003d8f] text-white"
              >
                {isCreating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                    <span>Creando...</span>
                  </div>
                ) : (
                  "Crear Sucursal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600">
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-[#666666]">
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas
              eliminar esta sucursal?
            </DialogDescription>
          </DialogHeader>

          {sucursalToDelete && (
            <div className="py-4 space-y-2">
              <div className="p-4 bg-[#F5F5F5] rounded-lg border border-[#E0E0E0]">
                <p className="font-semibold text-[#002868]">
                  {sucursalToDelete.nombre}
                </p>
                <p className="text-sm text-[#666666]">
                  {sucursalToDelete.razon_social}
                </p>
                <p className="text-sm text-[#666666]">
                  CUIT: {sucursalToDelete.cuit}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
              className="border-[#E0E0E0] text-[#1A1A1A] hover:bg-[#F5F5F5]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Eliminando...</span>
                </div>
              ) : (
                "Eliminar Sucursal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
