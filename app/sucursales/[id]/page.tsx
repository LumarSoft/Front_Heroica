"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API_ENDPOINTS } from "@/lib/config";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Sucursal {
  id: number;
  nombre: string;
  razon_social: string;
  cuit: string;
  direccion: string;
  activo: boolean;
}

export default function SucursalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    razon_social: "",
    cuit: "",
    direccion: "",
  });

  // Estados para totales de cajas
  const [totalesEfectivo, setTotalesEfectivo] = useState({ total_real: 0, total_necesario: 0 });
  const [totalesBanco, setTotalesBanco] = useState({ total_real: 0, total_necesario: 0 });
  const [loadingTotales, setLoadingTotales] = useState(true);

  // Esperar a que Zustand se hidrate desde localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    // Cargar datos de la sucursal
    const fetchSucursal = async () => {
      try {
        const response = await fetch(
          API_ENDPOINTS.SUCURSALES.GET_BY_ID(Number(params.id)),
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Error al cargar sucursal");
        }

        setSucursal(data.data);
        setFormData({
          nombre: data.data.nombre,
          razon_social: data.data.razon_social,
          cuit: data.data.cuit,
          direccion: data.data.direccion,
        });
      } catch (err: any) {
        console.error("Error al cargar sucursal:", err);
        setError(err.message || "Error al cargar sucursal");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSucursal();
    fetchTotales();
  }, [isAuthenticated, isHydrated, router, params.id]);

  // Función para cargar totales de las cajas
  const fetchTotales = async () => {
    try {
      setLoadingTotales(true);

      // Cargar totales de efectivo
      const resEfectivo = await fetch(
        API_ENDPOINTS.MOVIMIENTOS.GET_TOTALES(Number(params.id))
      );
      const dataEfectivo = await resEfectivo.json();
      if (resEfectivo.ok) {
        setTotalesEfectivo(dataEfectivo.data);
      }

      // Cargar totales de banco
      const resBanco = await fetch(
        API_ENDPOINTS.CAJA_BANCO.GET_TOTALES(Number(params.id))
      );
      const dataBanco = await resBanco.json();
      if (resBanco.ok) {
        setTotalesBanco(dataBanco.data);
      }
    } catch (err) {
      console.error('Error al cargar totales:', err);
    } finally {
      setLoadingTotales(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        API_ENDPOINTS.SUCURSALES.UPDATE(Number(params.id)),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al actualizar sucursal");
      }

      setSucursal(data.data);
      setSuccessMessage("Sucursal actualizada exitosamente");

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error al actualizar sucursal:", err);
      setError(err.message || "Error al actualizar sucursal");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!sucursal) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#1A1A1A] text-xl mb-4">Sucursal no encontrada</p>
          <Button
            onClick={() => router.push("/sucursales")}
            className="bg-[#002868] text-white hover:bg-[#003d8f]"
          >
            Volver a Sucursales
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED]">
      {/* Header Ultra-Minimalista */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E0E0E0]/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Botón Volver */}
              <Button
                onClick={() => router.push("/sucursales")}
                variant="outline"
                size="sm"
                className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#666666] cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 mr-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                Volver
              </Button>

              {/* Nombre de la Sucursal */}
              <h1 className="text-2xl font-bold text-[#002868]">
                {sucursal.nombre}
              </h1>
            </div>

            {/* Botón Ver Información */}
            <Button
              onClick={() => setIsInfoDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-[#002868] text-[#002868] hover:bg-[#002868] hover:text-white cursor-pointer transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
              Ver Información
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - LAS CAJAS SON LAS ESTRELLAS */}
      <main className="container mx-auto px-6 py-16">
        {/* Título Destacado */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#002868] mb-3">
            Gestión de Cajas
          </h2>
          <p className="text-lg text-[#666666]">
            Selecciona la caja que deseas gestionar
          </p>
        </div>

        {/* Las 3 Cajas - MUY GRANDES Y PROTAGONISTAS */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Caja en Efectivo */}
          <Card
            onClick={() => router.push(`/sucursales/${params.id}/caja-efectivo`)}
            className="border-2 border-[#E0E0E0] bg-white hover:border-[#002868] hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group overflow-hidden relative"
          >
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#002868]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

            <CardContent className="p-10 text-center relative z-10">
              <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#002868]/10 to-[#002868]/5 flex items-center justify-center group-hover:from-[#002868]/20 group-hover:to-[#002868]/10 transition-all duration-300 group-hover:scale-110">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-14 h-14 text-[#002868]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                  />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-[#002868] mb-3 group-hover:text-[#003d8f] transition-colors">
                Caja en Efectivo
              </h3>

              {/* Total de Saldo Real */}
              {loadingTotales ? (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-4 h-4 border-2 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
                  <p className="text-sm text-[#666666]">Cargando...</p>
                </div>
              ) : (
                <div className="mb-3">
                  <p className="text-xs text-[#666666] font-semibold uppercase tracking-wide mb-1">Saldo Real</p>
                  <p className={`text-2xl font-bold ${totalesEfectivo.total_real >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalesEfectivo.total_real)}
                  </p>
                </div>
              )}

              <p className="text-[#666666] text-base leading-relaxed">
                Gestiona los movimientos de efectivo de la sucursal
              </p>

              {/* Flecha decorativa */}
              <div className="mt-6 flex justify-center">
                <div className="w-8 h-8 rounded-full bg-[#002868]/10 flex items-center justify-center group-hover:bg-[#002868] transition-all">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 text-[#002868] group-hover:text-white group-hover:translate-x-1 transition-all"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Caja en Banco */}
          <Card
            onClick={() => router.push(`/sucursales/${params.id}/caja-banco`)}
            className="border-2 border-[#E0E0E0] bg-white hover:border-[#002868] hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group overflow-hidden relative"
          >
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#002868]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

            <CardContent className="p-10 text-center relative z-10">
              <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#002868]/10 to-[#002868]/5 flex items-center justify-center group-hover:from-[#002868]/20 group-hover:to-[#002868]/10 transition-all duration-300 group-hover:scale-110">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-14 h-14 text-[#002868]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
                  />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-[#002868] mb-3 group-hover:text-[#003d8f] transition-colors">
                Caja en Banco
              </h3>

              {/* Total de Saldo Real */}
              {loadingTotales ? (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-4 h-4 border-2 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
                  <p className="text-sm text-[#666666]">Cargando...</p>
                </div>
              ) : (
                <div className="mb-3">
                  <p className="text-xs text-[#666666] font-semibold uppercase tracking-wide mb-1">Saldo Real</p>
                  <p className={`text-2xl font-bold ${totalesBanco.total_real >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalesBanco.total_real)}
                  </p>
                </div>
              )}

              <p className="text-[#666666] text-base leading-relaxed">
                Administra cuentas y transacciones bancarias
              </p>

              {/* Flecha decorativa */}
              <div className="mt-6 flex justify-center">
                <div className="w-8 h-8 rounded-full bg-[#002868]/10 flex items-center justify-center group-hover:bg-[#002868] transition-all">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 text-[#002868] group-hover:text-white group-hover:translate-x-1 transition-all"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pagos Pendientes de Autorización */}
          <Card
            onClick={() => router.push(`/sucursales/${params.id}/pagos-pendientes`)}
            className="border-2 border-[#E0E0E0] bg-white hover:border-[#002868] hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group overflow-hidden relative"
          >
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#002868]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

            <CardContent className="p-10 text-center relative z-10">
              <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#002868]/10 to-[#002868]/5 flex items-center justify-center group-hover:from-[#002868]/20 group-hover:to-[#002868]/10 transition-all duration-300 group-hover:scale-110">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-14 h-14 text-[#002868]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-[#002868] mb-3 group-hover:text-[#003d8f] transition-colors">
                Pagos Pendientes
              </h3>
              <p className="text-[#666666] text-base leading-relaxed">
                Gestiona pagos pendientes de autorización
              </p>

              {/* Flecha decorativa */}
              <div className="mt-6 flex justify-center">
                <div className="w-8 h-8 rounded-full bg-[#002868]/10 flex items-center justify-center group-hover:bg-[#002868] transition-all">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 text-[#002868] group-hover:text-white group-hover:translate-x-1 transition-all"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de Información de la Sucursal */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#002868]">
              Información de la Sucursal
            </DialogTitle>
            <DialogDescription className="text-[#666666]">
              Consulta y edita los datos de la sucursal
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-600 font-medium">
                  ✓ {successMessage}
                </p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="nombre"
                    className="text-[#002868] font-semibold text-sm"
                  >
                    Nombre de la Sucursal *
                  </Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="razon_social"
                    className="text-[#002868] font-semibold text-sm"
                  >
                    Razón Social *
                  </Label>
                  <Input
                    id="razon_social"
                    name="razon_social"
                    value={formData.razon_social}
                    onChange={handleInputChange}
                    required
                    className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="cuit"
                    className="text-[#002868] font-semibold text-sm"
                  >
                    CUIT *
                  </Label>
                  <Input
                    id="cuit"
                    name="cuit"
                    value={formData.cuit}
                    onChange={handleInputChange}
                    required
                    className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="direccion"
                    className="text-[#002868] font-semibold text-sm"
                  >
                    Dirección *
                  </Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    required
                    className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
                >
                  {isSaving ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                      <span>Guardando...</span>
                    </div>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInfoDialogOpen(false)}
                  className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#1A1A1A] cursor-pointer"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
