"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Tipos para los pagos pendientes
interface PagoPendiente {
  id: number;
  fecha: string;
  concepto: string;
  monto: number | string;
  proveedor: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  prioridad: "baja" | "media" | "alta";
}

export default function PagosPendientesPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Datos de ejemplo (temporal)
  const [pagosPendientes, setPagosPendientes] = useState<PagoPendiente[]>([
    {
      id: 1,
      fecha: "2026-02-05T03:00:00.000Z",
      concepto: "Factura #1234",
      monto: "15000.00",
      proveedor: "Proveedor ABC",
      estado: "pendiente",
      prioridad: "alta",
    },
    {
      id: 2,
      fecha: "2026-02-06T03:00:00.000Z",
      concepto: "Servicios de limpieza",
      monto: "8500.00",
      proveedor: "Limpieza SA",
      estado: "pendiente",
      prioridad: "media",
    },
    {
      id: 3,
      fecha: "2026-02-07T03:00:00.000Z",
      concepto: "Compra de insumos",
      monto: "12000.00",
      proveedor: "Distribuidora XYZ",
      estado: "pendiente",
      prioridad: "baja",
    },
  ]);

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

    // Simular carga de datos
    setTimeout(() => setIsLoading(false), 500);
  }, [isAuthenticated, isHydrated, router]);

  // Función para formatear fechas de ISO a dd/mm/aaaa
  const formatFecha = (fechaISO: string) => {
    const date = new Date(fechaISO);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Función para formatear montos
  const formatMonto = (monto: number | string) => {
    const montoNum = typeof monto === "string" ? parseFloat(monto) : monto;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(montoNum);
  };

  // Función para obtener el color del badge de estado (COLORES MEJORADOS)
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "aprobado":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "rechazado":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  // Función para obtener el color del badge de prioridad (COLORES MEJORADOS)
  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      case "media":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      case "baja":
        return "bg-[#002868]/5 text-[#002868] border border-[#002868]/20";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED]">
      {/* Header Premium con Glassmorphism */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E0E0E0]/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push(`/sucursales/${params.id}`)}
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
            <div>
              <h1 className="text-2xl font-bold text-[#002868]">
                Pagos Pendientes de Autorización
              </h1>
              <p className="text-sm text-[#666666]">
                Gestión de pagos pendientes de aprobación
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
          </div>
        ) : (
          <Card className="border-[#E0E0E0] bg-white shadow-lg">
            <CardHeader className="border-b border-[#E0E0E0]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-[#002868]">
                    Pagos Pendientes
                  </CardTitle>
                  <CardDescription className="text-[#666666]">
                    Lista de pagos que requieren autorización
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#666666] font-medium mb-1">
                    Total de pagos
                  </p>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#002868]/10 border-2 border-[#002868]/20">
                    <p className="text-xl font-bold text-[#002868]">
                      {pagosPendientes.length}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA] border-b-2 border-[#E0E0E0]">
                      <TableHead className="font-bold text-[#002868] text-sm">
                        Fecha
                      </TableHead>
                      <TableHead className="font-bold text-[#002868] text-sm">
                        Concepto
                      </TableHead>
                      <TableHead className="font-bold text-[#002868] text-sm">
                        Proveedor
                      </TableHead>
                      <TableHead className="font-bold text-[#002868] text-sm text-right">
                        Monto
                      </TableHead>
                      <TableHead className="font-bold text-[#002868] text-sm text-center">
                        Prioridad
                      </TableHead>
                      <TableHead className="font-bold text-[#002868] text-sm text-center">
                        Estado
                      </TableHead>
                      <TableHead className="font-bold text-[#002868] text-sm text-center">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagosPendientes.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-[#666666] py-12"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-12 h-12 text-[#666666]/50"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                              />
                            </svg>
                            <p className="font-medium">No hay pagos pendientes</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagosPendientes.map((pago, index) => (
                        <TableRow
                          key={pago.id}
                          className="hover:bg-[#F8F9FA]/50 transition-colors border-b border-[#E0E0E0]/50"
                        >
                          <TableCell className="font-medium text-[#1A1A1A]">
                            {formatFecha(pago.fecha)}
                          </TableCell>
                          <TableCell className="text-[#1A1A1A]">
                            {pago.concepto}
                          </TableCell>
                          <TableCell className="text-[#666666]">
                            {pago.proveedor}
                          </TableCell>
                          <TableCell className="text-right font-bold text-[#002868] text-base">
                            {formatMonto(pago.monto)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getPrioridadColor(pago.prioridad)}`}
                            >
                              {pago.prioridad.charAt(0).toUpperCase() +
                                pago.prioridad.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(pago.estado)}`}
                            >
                              {pago.estado.charAt(0).toUpperCase() +
                                pago.estado.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Botón Aprobar */}
                              <Button
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600 text-white border-none cursor-pointer shadow-sm hover:shadow-md transition-all"
                                title="Aprobar pago"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2.5}
                                  stroke="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 12.75l6 6 9-13.5"
                                  />
                                </svg>
                              </Button>
                              {/* Botón Rechazar */}
                              <Button
                                size="sm"
                                className="bg-rose-500 hover:bg-rose-600 text-white border-none cursor-pointer shadow-sm hover:shadow-md transition-all"
                                title="Rechazar pago"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2.5}
                                  stroke="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
