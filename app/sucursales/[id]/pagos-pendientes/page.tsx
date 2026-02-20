"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PagoPendiente {
  id: number;
  fecha: string;
  concepto: string;
  monto: number | string;
  descripcion?: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  prioridad: "baja" | "media" | "alta";
  tipo?: string;
}

export default function PagosPendientesPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [pagosPendientes, setPagosPendientes] = useState<PagoPendiente[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isAprobarDialogOpen, setIsAprobarDialogOpen] = useState(false);
  const [isRechazarDialogOpen, setIsRechazarDialogOpen] = useState(false);
  const [selectedPago, setSelectedPago] = useState<PagoPendiente | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [tipoCaja, setTipoCaja] = useState<"efectivo" | "banco">("efectivo");
  const [motivoRechazo, setMotivoRechazo] = useState("");

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    fetchPagosPendientes();
  }, [isAuthenticated, isHydrated, router, params.id]);

  const fetchPagosPendientes = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        API_ENDPOINTS.PAGOS_PENDIENTES.GET_BY_SUCURSAL(Number(params.id))
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar pagos pendientes");
      }

      setPagosPendientes(data.data || []);
    } catch (err: any) {
      console.error("Error al cargar pagos pendientes:", err);
      setError(err.message || "Error al cargar pagos pendientes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const formatFecha = (fechaISO: string) => {
    const date = new Date(fechaISO);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatMonto = (monto: number | string) => {
    const montoNum = typeof monto === "string" ? parseFloat(monto) : monto;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(montoNum);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-amber-100 text-amber-800";
      case "aprobado":
        return "bg-blue-100 text-blue-800";
      case "rechazado":
        return "bg-rose-100 text-rose-800";
      case "completado":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "alta":
        return "bg-rose-100 text-rose-800";
      case "media":
        return "bg-amber-100 text-amber-800";
      case "baja":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calcularTotal = (transactions: PagoPendiente[]) => {
    return transactions.reduce((sum, t) => {
      const monto = typeof t.monto === "string" ? parseFloat(t.monto) : t.monto;
      return sum + monto;
    }, 0);
  };

  const total = calcularTotal(pagosPendientes);

  const handleOpenAprobar = (pago: PagoPendiente) => {
    setSelectedPago(pago);
    setTipoCaja("efectivo");
    setIsAprobarDialogOpen(true);
  };

  const handleOpenRechazar = (pago: PagoPendiente) => {
    setSelectedPago(pago);
    setMotivoRechazo("");
    setIsRechazarDialogOpen(true);
  };

  const handleAprobar = async () => {
    if (!selectedPago || !user) return;

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(
        API_ENDPOINTS.PAGOS_PENDIENTES.APROBAR(selectedPago.id),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario_revisor_id: user.id,
            tipo_caja: tipoCaja,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al aprobar pago");
      }

      setSuccessMessage("Pago aprobado excitósamente. Revisa la caja correspondiente.");
      setIsAprobarDialogOpen(false);
      fetchPagosPendientes();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error al aprobar pago:", err);
      setError(err.message || "Error al aprobar pago");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRechazar = async () => {
    if (!selectedPago || !user || !motivoRechazo.trim()) {
      setError("Debe proporcionar un motivo de rechazo");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(
        API_ENDPOINTS.PAGOS_PENDIENTES.RECHAZAR(selectedPago.id),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario_revisor_id: user.id,
            motivo_rechazo: motivoRechazo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al rechazar pago");
      }

      setSuccessMessage("Pago rechazado exitosamente");
      setIsRechazarDialogOpen(false);
      fetchPagosPendientes();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error al rechazar pago:", err);
      setError(err.message || "Error al rechazar pago");
      setTimeout(() => setError(""), 3000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED]">
      <Navbar
        userName={user?.nombre}
        userRole={user?.rol}
        onLogout={handleLogout}
        showBackButton={true}
        backUrl={`/sucursales/${params.id}`}
      />

      <main className="container mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-600 font-medium">✓ {successMessage}</p>
          </div>
        )}

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
                    Movimientos esperando autorización
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#666666] font-medium mb-1">Total en Pendientes</p>
                  <div
                    className={`inline-flex items-center justify-center px-4 py-2 rounded-lg ${total >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}
                  >
                    <p
                      className={`text-2xl font-bold ${total >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                    >
                      {formatMonto(Math.abs(total))}
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
                      <TableHead className="font-bold text-[#002868] text-sm">Fecha</TableHead>
                      <TableHead className="font-bold text-[#002868] text-sm">Concepto</TableHead>
                      <TableHead className="font-bold text-[#002868] text-sm">Descripción</TableHead>
                      <TableHead className="font-bold text-[#002868] text-sm text-center">Tipo</TableHead>
                      <TableHead className="font-bold text-[#002868] text-sm text-right">Monto</TableHead>
                      <TableHead className="font-bold text-[#002868] text-sm text-center">Prioridad</TableHead>
                      <TableHead className="font-bold text-[#002868] text-sm text-center">Estado</TableHead>
                      <TableHead className="font-bold text-[#002868] text-sm text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagosPendientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-[#666666] py-12">
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-12 h-12 text-[#666666]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                            <p className="font-medium">No hay pagos pendientes</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagosPendientes.map((pago) => (
                        <TableRow key={pago.id} className="hover:bg-[#F8F9FA]/50 transition-colors border-b border-[#E0E0E0]/50">
                          <TableCell className="font-medium text-[#1A1A1A]">{formatFecha(pago.fecha)}</TableCell>
                          <TableCell className="text-[#1A1A1A]">{pago.concepto}</TableCell>
                          <TableCell className="text-[#666666]">{pago.descripcion || "-"}</TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pago.tipo === "egreso" || (!pago.tipo && Number(pago.monto) < 0)
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-100 text-emerald-800"
                              }`}>
                              {pago.tipo === "egreso" || (!pago.tipo && Number(pago.monto) < 0) ? "Egreso" : "Ingreso"}
                            </span>
                          </TableCell>
                          <TableCell className={`text-right font-bold text-base ${parseFloat(pago.monto.toString()) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {formatMonto(Math.abs(parseFloat(pago.monto.toString())))}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPrioridadColor(pago.prioridad)}`}>
                              {pago.prioridad.charAt(0).toUpperCase() + pago.prioridad.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(pago.estado)}`}>
                              {pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {pago.estado === "pendiente" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenAprobar(pago)}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white border-none cursor-pointer shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                                    title="Aprobar pago"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleOpenRechazar(pago)}
                                    className="bg-rose-500 hover:bg-rose-600 text-white border-none cursor-pointer shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                                    title="Rechazar pago"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </Button>
                                </>
                              )}
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

      <Dialog open={isAprobarDialogOpen} onOpenChange={setIsAprobarDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white border-[#E0E0E0] shadow-2xl">
          <DialogHeader className="border-b border-[#E0E0E0] pb-4">
            <DialogTitle className="text-2xl font-bold text-[#002868] flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Aprobar Pago
            </DialogTitle>
            <DialogDescription className="text-[#666666] mt-2">
              Seleccione la caja destino para este movimiento aprobado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipoCaja" className="text-[#002868] font-semibold">Caja Destino</Label>
              <select
                id="tipoCaja"
                value={tipoCaja}
                onChange={(e) => setTipoCaja(e.target.value as "efectivo" | "banco")}
                className="w-full rounded-md border border-[#E0E0E0] px-3 py-2 text-sm focus:border-[#002868] focus:outline-none focus:ring-1 focus:ring-[#002868]"
              >
                <option value="efectivo">Caja Efectivo</option>
                <option value="banco">Caja Banco</option>
              </select>
            </div>
            {selectedPago && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm flex justify-between">
                <span className="text-gray-600 font-medium">Monto a aprobar:</span>
                <span className="font-bold text-[#002868]">{formatMonto(parseFloat(selectedPago.monto.toString()))}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAprobarDialogOpen(false)}
              className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#1A1A1A] cursor-pointer"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAprobar}
              disabled={isSaving}
              className="bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
            >
              {isSaving ? "Aprobando..." : "Confirmar Aprobación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRechazarDialogOpen} onOpenChange={setIsRechazarDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white border-[#E0E0E0] shadow-2xl">
          <DialogHeader className="border-b border-[#E0E0E0] pb-4">
            <DialogTitle className="text-2xl font-bold text-[#002868] flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-rose-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Rechazar Pago
            </DialogTitle>
            <DialogDescription className="text-[#666666] mt-2">
              Por favor indique el motivo del rechazo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivoRechazo" className="text-[#002868] font-semibold">Motivo de Rechazo</Label>
              <Input
                id="motivoRechazo"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Ingrese un motivo..."
                className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRechazarDialogOpen(false)}
              className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#1A1A1A] cursor-pointer"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRechazar}
              disabled={isSaving || !motivoRechazo.trim()}
              className="bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
            >
              {isSaving ? "Rechazando..." : "Confirmar Rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
