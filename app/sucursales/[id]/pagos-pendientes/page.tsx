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

  // Función para obtener el color del badge de estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "aprobado":
        return "bg-green-100 text-green-800";
      case "rechazado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Función para obtener el color del badge de prioridad
  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return "bg-red-100 text-red-800";
      case "media":
        return "bg-orange-100 text-orange-800";
      case "baja":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-[#E0E0E0] shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push(`/sucursales/${params.id}`)}
              variant="outline"
              className="bg-[#002868] border-[#002868] text-white hover:bg-[#003d8f]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 mr-2"
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
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
          </div>
        ) : (
          <Card className="border-[#E0E0E0] bg-white shadow-lg">
            <CardHeader>
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
                  <p className="text-sm text-[#666666] font-medium">
                    Total de pagos
                  </p>
                  <p className="text-2xl font-bold text-[#002868]">
                    {pagosPendientes.length}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-[#E0E0E0]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F5F5F5] hover:bg-[#F5F5F5]">
                      <TableHead className="font-bold text-[#002868]">
                        Fecha
                      </TableHead>
                      <TableHead className="font-bold text-[#002868]">
                        Concepto
                      </TableHead>
                      <TableHead className="font-bold text-[#002868]">
                        Proveedor
                      </TableHead>
                      <TableHead className="font-bold text-[#002868] text-right">
                        Monto
                      </TableHead>
                      <TableHead className="font-bold text-[#002868] text-center">
                        Prioridad
                      </TableHead>
                      <TableHead className="font-bold text-[#002868] text-center">
                        Estado
                      </TableHead>
                      <TableHead className="font-bold text-[#002868] text-center">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagosPendientes.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-[#666666] py-8"
                        >
                          No hay pagos pendientes
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagosPendientes.map((pago) => (
                        <TableRow
                          key={pago.id}
                          className="hover:bg-[#F5F5F5] transition-colors"
                        >
                          <TableCell className="font-medium">
                            {formatFecha(pago.fecha)}
                          </TableCell>
                          <TableCell>{pago.concepto}</TableCell>
                          <TableCell>{pago.proveedor}</TableCell>
                          <TableCell className="text-right font-semibold text-[#002868]">
                            {formatMonto(pago.monto)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPrioridadColor(pago.prioridad)}`}
                            >
                              {pago.prioridad.charAt(0).toUpperCase() +
                                pago.prioridad.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(pago.estado)}`}
                            >
                              {pago.estado.charAt(0).toUpperCase() +
                                pago.estado.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-500 text-white hover:bg-green-600 border-none cursor-pointer"
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
                                    d="M4.5 12.75l6 6 9-13.5"
                                  />
                                </svg>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-500 text-white hover:bg-red-600 border-none cursor-pointer"
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
