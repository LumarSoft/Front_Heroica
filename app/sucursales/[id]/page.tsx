"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API_ENDPOINTS } from "@/lib/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  
  const [formData, setFormData] = useState({
    nombre: "",
    razon_social: "",
    cuit: "",
    direccion: ""
  });

  // Esperar a que Zustand se hidrate desde localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    // Cargar datos de la sucursal
    const fetchSucursal = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(Number(params.id)));
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error al cargar sucursal');
        }

        setSucursal(data.data);
        setFormData({
          nombre: data.data.nombre,
          razon_social: data.data.razon_social,
          cuit: data.data.cuit,
          direccion: data.data.direccion
        });
      } catch (err: any) {
        console.error('Error al cargar sucursal:', err);
        setError(err.message || 'Error al cargar sucursal');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSucursal();
  }, [isAuthenticated, isHydrated, router, params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(API_ENDPOINTS.SUCURSALES.UPDATE(Number(params.id)), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar sucursal');
      }

      setSucursal(data.data);
      setSuccessMessage("Sucursal actualizada exitosamente");
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (err: any) {
      console.error('Error al actualizar sucursal:', err);
      setError(err.message || 'Error al actualizar sucursal');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D4C92] via-[#2E7DDF] to-[#0D4C92] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D4C92] via-[#2E7DDF] to-[#0D4C92] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!sucursal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D4C92] via-[#2E7DDF] to-[#0D4C92] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Sucursal no encontrada</p>
          <Button onClick={() => router.push('/sucursales')} className="bg-white text-[#0D4C92]">
            Volver a Sucursales
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D4C92] via-[#2E7DDF] to-[#0D4C92]">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/sucursales')}
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{sucursal.nombre}</h1>
              <p className="text-sm text-white/80">{sucursal.razon_social}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de la Sucursal */}
          <Card className="border-white/20 bg-white/95 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-[#0D4C92]">
                Información de la Sucursal
              </CardTitle>
              <CardDescription className="text-[#A5A5A5]">
                Edita los datos de la sucursal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
                </div>
              )}
              
              {successMessage && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-600 font-medium">✓ {successMessage}</p>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-[#0D4C92] font-semibold">
                    Nombre de la Sucursal *
                  </Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="border-[#A5A5A5]/30 focus:border-[#2E7DDF] focus:ring-[#2E7DDF]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razon_social" className="text-[#0D4C92] font-semibold">
                    Razón Social *
                  </Label>
                  <Input
                    id="razon_social"
                    name="razon_social"
                    value={formData.razon_social}
                    onChange={handleInputChange}
                    required
                    className="border-[#A5A5A5]/30 focus:border-[#2E7DDF] focus:ring-[#2E7DDF]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuit" className="text-[#0D4C92] font-semibold">
                    CUIT *
                  </Label>
                  <Input
                    id="cuit"
                    name="cuit"
                    value={formData.cuit}
                    onChange={handleInputChange}
                    required
                    className="border-[#A5A5A5]/30 focus:border-[#2E7DDF] focus:ring-[#2E7DDF]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion" className="text-[#0D4C92] font-semibold">
                    Dirección *
                  </Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    required
                    className="border-[#A5A5A5]/30 focus:border-[#2E7DDF] focus:ring-[#2E7DDF]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-[#0D4C92] to-[#2E7DDF] hover:from-[#0D4C92]/90 hover:to-[#2E7DDF]/90 text-white"
                >
                  {isSaving ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Guardando...</span>
                    </div>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Gestión de Cajas */}
          <div className="space-y-6">
            <Card className="border-white/20 bg-white/95 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-[#0D4C92]">
                  Gestión de Cajas
                </CardTitle>
                <CardDescription className="text-[#A5A5A5]">
                  Administra las cajas de la sucursal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Botón Caja en Efectivo */}
                <button
                  onClick={() => router.push(`/sucursales/${params.id}/caja-efectivo`)}
                  className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0D4C92] to-[#2E7DDF] p-6 text-left shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02]"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-white">Caja en Efectivo</h3>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white/80">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                      </svg>
                    </div>
                    <p className="text-white/90 text-sm">
                      Gestiona los movimientos de efectivo de la sucursal
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all"></div>
                </button>

                {/* Botón Caja en Banco */}
                <button
                  onClick={() => router.push(`/sucursales/${params.id}/caja-banco`)}
                  className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#2E7DDF] to-[#0D4C92] p-6 text-left shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02]"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-white">Caja en Banco</h3>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white/80">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                      </svg>
                    </div>
                    <p className="text-white/90 text-sm">
                      Administra las cuentas bancarias y transacciones
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all"></div>
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
