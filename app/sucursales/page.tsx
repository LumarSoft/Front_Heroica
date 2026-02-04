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
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header Mejorado */}
      <header className="bg-white border-b border-[#E0E0E0] shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-[#002868]">HEROICA</h1>
              <div className="h-6 w-px bg-[#E0E0E0] hidden sm:block"></div>
              <span className="text-sm text-[#666666] hidden sm:block">
                Sistema de Contabilidad
              </span>
            </div>

            {/* User Section */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  {user?.nombre}
                </p>
                <p className="text-xs text-[#666666]">{user?.rol}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 sm:mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-[#002868] mb-2">
            Sucursales
          </h2>
          <p className="text-[#666666] text-lg">
            Selecciona una sucursal para gestionar su tesorería
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 animate-in fade-in slide-in-from-top-2">
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
                className="group border-[#E0E0E0] hover:border-[#002868] bg-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
                onClick={() => handleSucursalClick(sucursal.id)}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-[#002868] text-xl font-bold group-hover:text-[#003d8f] transition-colors">
                    {sucursal.nombre}
                  </CardTitle>
                  <CardDescription className="text-[#666666] text-sm">
                    {sucursal.razon_social}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#002868]/10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4 text-[#002868]"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#666666] font-semibold uppercase tracking-wide">
                        CUIT
                      </p>
                      <p className="text-sm text-[#1A1A1A] font-medium">
                        {sucursal.cuit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#002868]/10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4 text-[#002868]"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#666666] font-semibold uppercase tracking-wide">
                        Dirección
                      </p>
                      <p className="text-sm text-[#1A1A1A] truncate">
                        {sucursal.direccion}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E0E0E0]">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${sucursal.activo
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${sucursal.activo ? "bg-green-500" : "bg-red-500"
                          }`}
                      ></span>
                      {sucursal.activo ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </CardContent>

                {/* Botón de eliminar - esquina inferior derecha */}
                <button
                  onClick={(e) => handleDeleteClick(e, sucursal)}
                  className="absolute bottom-4 right-4 w-9 h-9 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center justify-center shadow-sm hover:shadow-md opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
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
              </Card>
            ))}
          </div>
        )}

        {!isLoading && sucursales.length === 0 && (
          <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed border-[#E0E0E0]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-16 h-16 mx-auto text-[#E0E0E0] mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
              />
            </svg>
            <p className="text-[#666666] text-lg font-medium">
              No hay sucursales registradas
            </p>
            <p className="text-[#999999] text-sm mt-1">
              Haz clic en el botón + para crear una nueva sucursal
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
                className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#666666] cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
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
              className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#666666] cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
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
