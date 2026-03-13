"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import { AlertTriangle } from "lucide-react";
import { PageLoadingSpinner, LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorBanner } from "@/components/ui/error-banner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import NuevoMovimientoDialog from "@/components/NuevoMovimientoDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { formatFecha, formatMonto, calcularTotal, ESTADO_COLOR_MAP, PRIORIDAD_COLOR_MAP } from "@/lib/formatters";
import { StatusBadge } from "@/components/caja/StatusBadge";
import type { PagoPendiente } from "@/lib/types";


export default function PagosPendientesPage() {
  const params = useParams();
  const { user, isGuardLoading, handleLogout } = useAuthGuard();

  const [isLoading, setIsLoading] = useState(true);
  const [pagosPendientes, setPagosPendientes] = useState<PagoPendiente[]>([]);
  const [historial, setHistorial] = useState<PagoPendiente[]>([]);
  const [activeTab, setActiveTab] = useState<"pendientes" | "historial">("pendientes");
  const [error, setError] = useState("");


  const [isAprobarDialogOpen, setIsAprobarDialogOpen] = useState(false);
  const [isRechazarDialogOpen, setIsRechazarDialogOpen] = useState(false);
  const [isAprobacionMovimientoOpen, setIsAprobacionMovimientoOpen] = useState(false);
  const [selectedPago, setSelectedPago] = useState<PagoPendiente | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [tipoCaja, setTipoCaja] = useState<"efectivo" | "banco">("efectivo");

  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [isNuevoMovimientoDialogOpen, setIsNuevoMovimientoDialogOpen] =
    useState(false);

  // Filtros del historial (solo admin)
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "aprobado" | "rechazado">("todos");
  const [filtroUsuario, setFiltroUsuario] = useState<string>("");
  const [sucursalActiva, setSucursalActiva] = useState<boolean | null>(null);

  // Verificar si la sucursal está activa
  useEffect(() => {
    if (!params.id) return;
    apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(Number(params.id)))
      .then((r) => r.json())
      .then((d) => setSucursalActiva(Boolean(d.data?.activo)))
      .catch(() => setSucursalActiva(true));
  }, [params.id]);

  const isReadOnly = sucursalActiva === false;

  // --- Fetchers ---
  const fetchPagosPendientes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await apiFetch(
        API_ENDPOINTS.PAGOS_PENDIENTES.GET_BY_SUCURSAL(Number(params.id))
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar pagos pendientes");
      }

      setPagosPendientes(data.data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al cargar pagos pendientes";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  const fetchHistorial = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setError("");

      const response = await apiFetch(
        `${API_ENDPOINTS.PAGOS_PENDIENTES.GET_HISTORIAL(user.id)}?sucursal_id=${params.id}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar historial");
      }

      setHistorial(data.data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al cargar historial";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, user]);

  useEffect(() => {
    if (!isGuardLoading) {
      if (activeTab === "pendientes") {
        fetchPagosPendientes();
      } else {
        fetchHistorial();
      }
    }
  }, [isGuardLoading, activeTab, fetchPagosPendientes, fetchHistorial]);

  const handleOpenAprobar = (pago: PagoPendiente) => {
    setSelectedPago(pago);
    setTipoCaja("efectivo");
    setIsAprobarDialogOpen(true);
  };

  const handleSelectCajaYContinuar = (caja: "efectivo" | "banco") => {
    setTipoCaja(caja);
    setIsAprobarDialogOpen(false);
    setIsAprobacionMovimientoOpen(true);
  };

  const handleOpenRechazar = (pago: PagoPendiente) => {
    setSelectedPago(pago);
    setMotivoRechazo("");
    setIsRechazarDialogOpen(true);
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

      const response = await apiFetch(
        API_ENDPOINTS.PAGOS_PENDIENTES.RECHAZAR(selectedPago.id),
        {
          method: "PUT",
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

      toast.success("Pago rechazado exitosamente");
      setIsRechazarDialogOpen(false);
      fetchPagosPendientes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al rechazar pago";
      setError(message);
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Guard de carga ---
  if (isGuardLoading) return <PageLoadingSpinner />;

  const total = calcularTotal(pagosPendientes);
  const isEmployee = user?.rol === "empleado";
  const isAdmin = user?.rol === "admin";

  // Usuarios revisores únicos del historial (para el filtro)
  const usuariosRevisores = Array.from(
    new Set(
      historial
        .map((p) => p.usuario_revisor_nombre)
        .filter((n): n is string => Boolean(n))
    )
  ).sort();

  // Historial filtrado
  const historialFiltrado = historial.filter((p) => {
    if (filtroEstado !== "todos" && p.estado !== filtroEstado) return false;
    if (filtroUsuario && p.usuario_revisor_nombre !== filtroUsuario) return false;
    return true;
  });

  const hayFiltrosActivos = filtroEstado !== "todos" || filtroUsuario !== "";

  const displayData = activeTab === "pendientes"
    ? pagosPendientes
    : (isAdmin ? historialFiltrado : historial);

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
        <ErrorBanner error={error} />

        {/* Header y Botón Nuevo */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#002868]">Pagos Pendientes</h1>
            <p className="text-[#666666] mt-1">Gestión y seguimiento de movimientos por autorizar</p>
          </div>

          <Button
            onClick={!isReadOnly ? () => setIsNuevoMovimientoDialogOpen(true) : undefined}
            disabled={isReadOnly}
            className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 self-end md:self-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Movimiento
          </Button>
        </div>

        {/* Banner solo lectura */}
        {isReadOnly && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              Esta sucursal está <strong>inactiva</strong>. Podés ver los datos pero no crear ni autorizar movimientos.
            </p>
          </div>
        )}

        {/* Tabs de Vistas */}
        <div className="flex mb-4 bg-white/50 p-1 rounded-xl border border-[#E0E0E0] w-fit">
          <button
            onClick={() => { setActiveTab("pendientes"); setFiltroEstado("todos"); setFiltroUsuario(""); }}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "pendientes"
              ? "bg-[#002868] text-white shadow-md"
              : "text-[#666666] hover:bg-[#F0F0F0]"
              }`}
          >
            {isEmployee ? "Mis Pendientes" : "Pendientes"}
          </button>
          <button
            onClick={() => setActiveTab("historial")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "historial"
              ? "bg-[#002868] text-white shadow-md"
              : "text-[#666666] hover:bg-[#F0F0F0]"
              }`}
          >
            {isEmployee ? "Mi Historial" : "Historial General"}
          </button>
        </div>

        {/* Barra de filtros — solo en historial y solo para admin */}
        {activeTab === "historial" && isAdmin && (
          <div className="mb-6 p-4 bg-white rounded-xl border border-[#E0E0E0] shadow-sm flex flex-wrap items-center gap-3">
            {/* Filtro Estado */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#5A6070] uppercase tracking-wider mr-1">Estado:</span>
              {(["todos", "aprobado", "rechazado"] as const).map((est) => (
                <button
                  key={est}
                  onClick={() => setFiltroEstado(est)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    filtroEstado === est
                      ? est === "todos"
                        ? "bg-[#002868] text-white border-[#002868]"
                        : est === "aprobado"
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-rose-500 text-white border-rose-500"
                      : "bg-white text-[#666666] border-[#E0E0E0] hover:border-[#B0B0B0]"
                  }`}
                >
                  {est === "todos" ? "Todos" : est === "aprobado" ? "Aprobados" : "Rechazados"}
                </button>
              ))}
            </div>

            {/* Separador */}
            <div className="h-5 w-px bg-[#E0E0E0]" />

            {/* Filtro por usuario revisor */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#5A6070] uppercase tracking-wider">Revisado por:</span>
              <Select value={filtroUsuario || "_all_"} onValueChange={(v) => setFiltroUsuario(v === "_all_" ? "" : v)}>
                <SelectTrigger className="h-8 rounded-lg border-[#E0E0E0] text-sm text-[#1A1A1A] min-w-[160px] focus:ring-[#002868]/20">
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">Todos los usuarios</SelectItem>
                  {usuariosRevisores.map((nombre) => (
                    <SelectItem key={nombre} value={nombre}>{nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Limpiar filtros */}
            {hayFiltrosActivos && (
              <>
                <div className="h-5 w-px bg-[#E0E0E0]" />
                <button
                  onClick={() => { setFiltroEstado("todos"); setFiltroUsuario(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#666666] bg-[#F5F5F5] hover:bg-[#ECECEC] border border-[#E0E0E0] transition-all cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpiar filtros
                </button>
              </>
            )}

            {/* Contador de resultados */}
            <div className="ml-auto">
              <span className="text-xs text-[#8A8F9C]">
                {historialFiltrado.length} resultado{historialFiltrado.length !== 1 ? "s" : ""}
                {hayFiltrosActivos && ` de ${historial.length}`}
              </span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <Card className="border-[#E0E0E0] bg-white shadow-lg overflow-hidden">
            <CardHeader className="border-b border-[#E0E0E0] bg-[#F8F9FA]/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-[#002868]">
                    {activeTab === "pendientes" ? "Pendientes de Autorización" : "Historial de Solicitudes"}
                  </CardTitle>
                  <CardDescription className="text-[#666666]">
                    {activeTab === "pendientes"
                      ? "Movimientos esperando revisión de un administrador"
                      : "Registro de movimientos procesados y su estado final"}
                  </CardDescription>
                </div>
                {activeTab === "pendientes" && (
                  <div className="text-right">
                    <p className="text-xs text-[#666666] font-bold uppercase tracking-wider mb-1">
                      Total Pendiente
                    </p>
                    <div
                      className={`inline-flex items-center justify-center px-4 py-1.5 rounded-lg ${total >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}
                    >
                      <p
                        className={`text-xl font-black ${total >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                      >
                        {formatMonto(Math.abs(total))}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA] border-b-2 border-[#E0E0E0]">
                      <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider">Fecha</TableHead>
                      <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider">Concepto</TableHead>
                      <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-right">Monto</TableHead>
                      <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center">Tipo</TableHead>
                      <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center">Prioridad</TableHead>
                      <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center">Estado</TableHead>
                      {activeTab === "historial" && (
                        <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider">Resolución</TableHead>
                      )}
                      {activeTab === "pendientes" && user?.rol !== "empleado" && (
                        <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center">Acciones</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6 + (activeTab === "historial" ? 1 : 0) + (activeTab === "pendientes" && user?.rol !== "empleado" ? 1 : 0)} className="text-center text-[#666666] py-16">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                              <svg className="w-8 h-8 text-[#666666]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                            </div>
                            <p className="font-medium">No se encontraron movimientos registrados</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayData.map((pago) => (
                        <TableRow key={pago.id} className="hover:bg-[#F8F9FA]/50 transition-colors border-b border-[#E0E0E0]/50">
                          <TableCell className="font-medium text-[#1A1A1A]">
                            {formatFecha(pago.fecha)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#1A1A1A]">{pago.concepto}</span>
                              {pago.descripcion && pago.descripcion.includes("[Nota del sistema:") ? (
                                <div className="flex flex-col gap-1.5 mt-1">
                                  {pago.descripcion.split("[Nota del sistema:")[0].trim() && (
                                    <span className="text-xs text-[#666666] max-w-[300px] whitespace-pre-wrap break-words inline-block">
                                      {pago.descripcion.split("[Nota del sistema:")[0].trim()}
                                    </span>
                                  )}
                                  <div className="bg-amber-50 text-amber-800 text-[11px] px-2.5 py-1.5 rounded-md border border-amber-200 flex items-start gap-1.5 w-fit max-w-sm mt-0.5">
                                    <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                    </svg>
                                    <span className="font-medium whitespace-normal break-words leading-snug">
                                      {pago.descripcion.split("[Nota del sistema:")[1].split("]")[0].trim()}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-[#666666] max-w-[300px] whitespace-pre-wrap break-words">{pago.descripcion || "-"}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right font-black text-sm ${parseFloat(pago.monto.toString()) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {formatMonto(Math.abs(parseFloat(pago.monto.toString())))}
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusBadge
                              value={pago.tipo === "egreso" || (!pago.tipo && Number(pago.monto) < 0) ? "egreso" : "ingreso"}
                              colorMap={{ egreso: "bg-rose-100 text-rose-800", ingreso: "bg-emerald-100 text-emerald-800" }}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusBadge value={pago.prioridad} colorMap={PRIORIDAD_COLOR_MAP} />
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusBadge value={pago.estado} colorMap={ESTADO_COLOR_MAP} />
                          </TableCell>
                          {activeTab === "historial" && (
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                {pago.estado === "aprobado" && (
                                  <span className="text-xs font-medium text-emerald-600">Aprobado por {pago.usuario_revisor_nombre || "Admin"}</span>
                                )}
                                {pago.estado === "rechazado" && (
                                  <>
                                    <span className="text-xs font-bold text-rose-600">Rechazado por {pago.usuario_revisor_nombre || "Admin"}</span>
                                    <span className="text-[11px] text-[#666666] italic leading-tight">
                                      "{pago.motivo_rechazo || "Sin motivo especificado"}"
                                    </span>
                                  </>
                                )}
                                {pago.estado === "pendiente" && (
                                  <span className="text-xs text-[#8A8F9C]">En revisión...</span>
                                )}
                              </div>
                            </TableCell>
                          )}
                          {activeTab === "pendientes" && user?.rol !== "empleado" && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                {pago.estado === "pendiente" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => !isReadOnly && handleOpenAprobar(pago)}
                                      disabled={isReadOnly}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm hover:shadow-md transition-all h-8 w-8 p-0 flex items-center justify-center rounded-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                      title={isReadOnly ? "Sucursal inactiva" : "Aprobar pago"}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                      </svg>
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => !isReadOnly && handleOpenRechazar(pago)}
                                      disabled={isReadOnly}
                                      className="bg-rose-500 hover:bg-rose-600 text-white border-none shadow-sm hover:shadow-md transition-all h-8 w-8 p-0 flex items-center justify-center rounded-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                      title={isReadOnly ? "Sucursal inactiva" : "Rechazar pago"}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          )}
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

      {/* Dialog Paso 1: Seleccionar caja destino */}
      <Dialog open={isAprobarDialogOpen} onOpenChange={setIsAprobarDialogOpen}>
        <DialogContent className="sm:max-w-[440px] bg-white border-[#E0E0E0] shadow-2xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-[#F0F0F0] bg-[#F8F9FA]/50">
            <DialogTitle className="text-xl font-bold text-[#002868] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              ¿Dónde registrar el pago?
            </DialogTitle>
            <DialogDescription className="text-[#666666] mt-2">
              Seleccioná la caja en la que se registrará el egreso.
              {selectedPago && (
                <span className="block mt-1 font-semibold text-[#1A1A1A]">
                  {selectedPago.concepto} · {formatMonto(Math.abs(parseFloat(selectedPago.monto.toString())))}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 grid grid-cols-2 gap-4">
            {/* Opción Efectivo */}
            <button
              onClick={() => handleSelectCajaYContinuar("efectivo")}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-[#E0E0E0] bg-white hover:border-[#002868] hover:bg-[#002868]/5 transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#002868]/10 flex items-center justify-center group-hover:bg-[#002868]/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-[#002868]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-bold text-[#002868] text-sm">Caja Efectivo</p>
                <p className="text-xs text-[#666666] mt-0.5">Dinero en sucursal</p>
              </div>
            </button>

            {/* Opción Banco */}
            <button
              onClick={() => handleSelectCajaYContinuar("banco")}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-[#E0E0E0] bg-white hover:border-[#002868] hover:bg-[#002868]/5 transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#002868]/10 flex items-center justify-center group-hover:bg-[#002868]/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-[#002868]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-bold text-[#002868] text-sm">Caja Banco</p>
                <p className="text-xs text-[#666666] mt-0.5">Transferencia / débito</p>
              </div>
            </button>
          </div>

          <div className="px-6 pb-6">
            <Button
              variant="outline"
              onClick={() => setIsAprobarDialogOpen(false)}
              className="w-full h-10 rounded-xl border-[#E0E0E0] text-[#5A6070] font-semibold hover:bg-[#F0F0F0] transition-all cursor-pointer"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Rechazar */}
      <Dialog open={isRechazarDialogOpen} onOpenChange={setIsRechazarDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white border-[#E0E0E0] shadow-2xl rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-[#F0F0F0] bg-[#F8F9FA]/50">
            <DialogTitle className="text-xl font-bold text-[#002868] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-rose-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Rechazar Movimiento
            </DialogTitle>
            <DialogDescription className="text-[#666666] mt-2">
              Explica brevemente por qué se rechaza esta solicitud.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="motivoRechazo" className="text-xs font-bold text-[#5A6070] uppercase tracking-wider">Justificación del rechazo</Label>
              <Textarea
                id="motivoRechazo"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Ej: Monto incorrecto o falta comprobante..."
                rows={3}
                className="rounded-xl border-[#E0E0E0] text-sm focus:border-rose-500 focus:ring-rose-500/10 resize-none"
              />
              <p className="text-[10px] text-[#8A8F9C]">Este mensaje será visible para el empleado en su historial.</p>
            </div>
          </div>
          <DialogFooter className="p-6 bg-[#F8F9FA]/50 border-t border-[#F0F0F0] sm:justify-end gap-3">
            <Button variant="outline" onClick={() => setIsRechazarDialogOpen(false)} className="h-11 px-6 rounded-xl border-[#E0E0E0] text-[#5A6070] font-semibold hover:bg-white transition-all cursor-pointer" disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleRechazar}
              disabled={isSaving || !motivoRechazo.trim()}
              className="h-11 px-8 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:shadow-none"
            >
              {isSaving ? "Rechazando..." : "Confirmar Rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Crear solicitud de pago pendiente (empleado) */}
      <NuevoMovimientoDialog
        isOpen={isNuevoMovimientoDialogOpen}
        onClose={() => setIsNuevoMovimientoDialogOpen(false)}
        sucursalId={Number(params.id)}
        isPagoPendiente={true}
        onSuccess={() => {
          toast.success("Solicitud de movimiento creada correctamente");
          if (activeTab === "pendientes") fetchPagosPendientes();
          else fetchHistorial();
        }}
      />

      {/* Dialog Paso 2: Formulario de movimiento para aprobar pago pendiente */}
      {selectedPago && (
        <NuevoMovimientoDialog
          isOpen={isAprobacionMovimientoOpen}
          onClose={() => {
            setIsAprobacionMovimientoOpen(false);
            setSelectedPago(null);
          }}
          sucursalId={Number(params.id)}
          cajaTipo={tipoCaja}
          pagoIdToApprove={selectedPago.id}
          usuarioRevisorId={user?.id}
          initialValues={{
            concepto: selectedPago.concepto,
            monto: Math.abs(parseFloat(selectedPago.monto.toString())).toString(),
            descripcion: selectedPago.descripcion ?? "",
            fecha: selectedPago.fecha
              ? (selectedPago.fecha.includes("T")
                  ? selectedPago.fecha.split("T")[0]
                  : selectedPago.fecha.substring(0, 10))
              : undefined,
            prioridad: selectedPago.prioridad as "baja" | "media" | "alta" | undefined,
          }}
          onSuccess={() => {
            toast.success("Pago aprobado y movimiento registrado correctamente");
            setIsAprobacionMovimientoOpen(false);
            setSelectedPago(null);
            fetchPagosPendientes();
          }}
        />
      )}
    </div>
  );
}

