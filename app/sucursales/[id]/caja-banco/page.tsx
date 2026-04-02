"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import NuevoMovimientoDialog from "@/components/NuevoMovimientoDialog";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useCajaData } from "@/hooks/use-caja-data";
import { formatMonto, calcularTotal } from "@/lib/formatters";
import { PageLoadingSpinner, ContentLoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { AccessDenied } from "@/components/ui/access-denied";
import { BancoParcial } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/caja/PageHeader";
import { CajaTabs, TabsContent } from "@/components/caja/CajaTabs";
import {
  TransactionTable,
  getBancoColumns,
} from "@/components/caja/TransactionTable";
import {
  DetailsDialog,
  StateDialog,
  DeleteDialog,
  DeudaDialog,
} from "@/components/caja/TransactionDialogs";
import { MoverMovimientoDialog } from "@/components/caja/MoverMovimientoDialog";
import { BulkMoverDialog } from "@/components/caja/BulkMoverDialog";
import { EndDateFilter } from "@/components/caja/EndDateFilter";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const columns = getBancoColumns();

export default function CajaBancoPage() {
  const params = useParams();
  const { user, isGuardLoading, handleLogout } = useAuthGuard();
  const searchParams = useSearchParams();
  const moneda = (searchParams.get("moneda") as "ARS" | "USD") || "ARS";
  const caja = useCajaData("banco", moneda);
  const [selectedBanco, setSelectedBanco] = useState<BancoParcial | null>(null);
  const [isBancoDialogOpen, setIsBancoDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("real");
  const [sucursalActiva, setSucursalActiva] = useState<boolean | null>(null);
  const [sucursalNombre, setSucursalNombre] = useState("");
  const [isBulkMoverDialogOpen, setIsBulkMoverDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleBulkDelete = (ids: number[]) => {
    setBulkSelectedIds(ids);
    setIsBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.CAJA_BANCO.BULK_DELETE, {
        method: "DELETE",
        body: JSON.stringify({ ids: bulkSelectedIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        caja.fetchMovimientos();
        setIsBulkDeleteDialogOpen(false);
      } else {
        toast.error(data.message || "Error al eliminar.");
      }
    } catch {
      toast.error("Error de red al eliminar.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkMove = (ids: number[]) => {
    setBulkSelectedIds(ids);
    setIsBulkMoverDialogOpen(true);
  };

  // Verificar si la sucursal está activa
  useEffect(() => {
    if (!params.id) return;
    apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(Number(params.id)))
      .then((r) => r.json())
      .then((d) => {
        setSucursalActiva(Boolean(d.data?.activo));
        setSucursalNombre(d.data?.nombre || "");
      })
      .catch(() => setSucursalActiva(true));
  }, [params.id]);

  const isReadOnly = sucursalActiva === false;

  const { initialize } = caja;
  useEffect(() => {
    if (!isGuardLoading && user?.rol !== "empleado") {
      initialize();
    }
  }, [isGuardLoading, user?.rol, initialize]);

  if (isGuardLoading) return <PageLoadingSpinner />;

  const bancoNeto =
    Number(selectedBanco?.total_real ?? 0) +
    Number(selectedBanco?.total_necesario ?? 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED]">
      <Navbar
        userName={user?.nombre}
        userRole={user?.rol}
        onLogout={handleLogout}
        showBackButton={true}
        backUrl={`/sucursales/${params.id}?moneda=${moneda}`}
        sucursalNombre={sucursalNombre ? `${sucursalNombre} — ${moneda}` : ""}
      />

      <main className="container mx-auto px-6 py-8 flex flex-col h-full">
        {user?.rol === "empleado" ? (
          <AccessDenied resource="la caja de bancos" backUrl={`/sucursales/${params.id}`} />
        ) : (
          <div className="flex flex-col space-y-6 flex-grow">
            {/* Mensajes */}
            <ErrorBanner error={caja.error} />


            {/* Banner solo lectura */}
            {isReadOnly && (
              <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800 font-medium">
                  Esta sucursal está <strong>inactiva</strong>. Podés ver los datos pero no crear ni modificar movimientos.
                </p>
              </div>
            )}

            {/* Cabecera */}
            <PageHeader
              title={`Caja Bancos — ${moneda}`}
              subtitle={`Gestión de saldos y movimientos bancarios (${moneda})`}
              onNewMovimiento={() => caja.setIsNuevoMovimientoDialogOpen(true)}
              isReadOnly={isReadOnly}
              sucursalId={Number(params.id)}
            />

            {caja.isLoading ? (
              <ContentLoadingSpinner />
            ) : (
              <>
                {/* Parciales por Banco */}
                {caja.parciales.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-[#002868] mb-3">Parciales por Banco</h3>
                    <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:overflow-x-auto pb-2">
                      {caja.parciales.map((p) => (
                        <Card
                          key={p.banco_id || "otros"}
                          className="border-[#E0E0E0] shadow-sm hover:shadow-lg hover:border-[#002868]/40 transition-all cursor-pointer min-w-[140px] flex-1 group"
                          onClick={() => {
                            setSelectedBanco(p);
                            setIsBancoDialogOpen(true);
                          }}
                        >
                          <CardContent className="p-4 flex items-center justify-center">
                            <span className="text-sm font-bold text-[#002868] group-hover:text-[#003d8f] transition-colors truncate" title={p.banco_nombre || "OTROS"}>
                              {p.banco_nombre || "OTROS"}
                            </span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabs + Tablas */}
                <EndDateFilter
                  dateRange={caja.dateRange}
                  onDateRangeChange={caja.setDateRange}
                  onLimpiar={caja.limpiarFiltros}
                  hayFiltro={caja.hayFiltroActivo}
                  bancos={caja.bancos}
                  bancosSeleccionados={caja.bancosFiltro}
                  onBancosChange={caja.setBancosFiltro}
                  searchText={caja.searchText}
                  onSearchTextChange={caja.setSearchText}
                />
                <CajaTabs
                  saldoReal={caja.saldoRealFiltrado}
                  saldoNecesario={caja.saldoNecesarioSinDeudaFiltrado}
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
                  <TabsContent value="real" className="mt-0 outline-none flex-grow">
                    <TransactionTable
                      title="Saldo Real"
                      description="Movimientos de banco confirmados para el periodo actual."
                      transactions={caja.saldoRealFiltrado}
                      columns={columns}
                      onViewDetails={caja.handleOpenDetails}
                      onChangeState={caja.handleOpenStateChange}
                      onDelete={caja.handleOpenDelete}
                      onMove={caja.handleOpenMover}
                      onBulkDelete={!isReadOnly ? handleBulkDelete : undefined}
                      onBulkMove={!isReadOnly ? handleBulkMove : undefined}
                      isReadOnly={isReadOnly}
                    />
                  </TabsContent>
                  <TabsContent value="necesario" className="mt-0 outline-none flex-grow">
                    <TransactionTable
                      title="Saldo Necesario"
                      description="Pagos y compromisos bancarios programados."
                      transactions={caja.saldoNecesarioFiltrado}
                      customTotal={calcularTotal(caja.saldoRealFiltrado) + calcularTotal(caja.saldoNecesarioSinDeudaFiltrado)}
                      columns={columns}
                      onViewDetails={caja.handleOpenDetails}
                      onChangeState={caja.handleOpenStateChange}
                      onDelete={caja.handleOpenDelete}
                      onToggleDeuda={caja.handleOpenDeuda}
                      onMove={caja.handleOpenMover}
                      onBulkDelete={!isReadOnly ? handleBulkDelete : undefined}
                      onBulkMove={!isReadOnly ? handleBulkMove : undefined}
                      isReadOnly={isReadOnly}
                    />
                  </TabsContent>
                </CajaTabs>
              </>
            )}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <DetailsDialog
        open={caja.isDetailsDialogOpen}
        onOpenChange={caja.setIsDetailsDialogOpen}
        formData={caja.formData}
        onInputChange={caja.handleInputChange}
        onSave={caja.handleSaveDetails}
        isSaving={caja.isSaving}
        categorias={caja.categorias}
        subcategorias={caja.subcategorias}
        bancos={caja.bancos}
        mediosPago={caja.mediosPago}
        showBancoFields={true}
        isReadOnly={isReadOnly}
        movimientoId={caja.selectedTransaction?.id}
        cajaTipo="banco"
      />

      <StateDialog
        open={caja.isStateDialogOpen}
        onOpenChange={caja.setIsStateDialogOpen}
        nuevoEstado={caja.nuevoEstado}
        onEstadoChange={caja.setNuevoEstado}
        onSave={caja.handleSaveStateChange}
        isSaving={caja.isSaving}
      />

      <DeleteDialog
        open={caja.isDeleteDialogOpen}
        onOpenChange={caja.setIsDeleteDialogOpen}
        onConfirm={caja.handleDelete}
        isSaving={caja.isSaving}
      />

      <DeleteDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        onConfirm={handleBulkDeleteConfirm}
        isSaving={isBulkDeleting}
        count={bulkSelectedIds.length}
      />

      <DeudaDialog
        open={caja.isDeudaDialogOpen}
        onOpenChange={caja.setIsDeudaDialogOpen}
        transaction={caja.selectedTransaction}
        onSave={caja.handleSaveDeuda}
        isSaving={caja.isSaving}
      />

      <NuevoMovimientoDialog
        isOpen={caja.isNuevoMovimientoDialogOpen}
        onClose={() => caja.setIsNuevoMovimientoDialogOpen(false)}
        sucursalId={caja.sucursalId}
        onSuccess={caja.fetchMovimientos}
        cajaTipo="banco"
        moneda={moneda}
        categoriasExternas={caja.categorias}
        bancosExternos={caja.bancos}
        mediosPagoExternos={caja.mediosPago}
      />

      <MoverMovimientoDialog
        open={caja.isMoverMovimientoDialogOpen}
        onOpenChange={caja.setIsMoverMovimientoDialogOpen}
        transaction={caja.selectedTransaction}
        currentSucursalId={caja.sucursalId}
        onSuccess={caja.fetchMovimientos}
        bancosExternos={caja.bancos}
        mediosPagoExternos={caja.mediosPago}
      />

      <BulkMoverDialog
        open={isBulkMoverDialogOpen}
        onOpenChange={setIsBulkMoverDialogOpen}
        selectedIds={bulkSelectedIds}
        currentSucursalId={caja.sucursalId}
        cajaTipo="banco"
        onSuccess={caja.fetchMovimientos}
        bancosExternos={caja.bancos}
        mediosPagoExternos={caja.mediosPago}
      />

      {/* Dialog de detalle de banco */}
      <Dialog open={isBancoDialogOpen} onOpenChange={setIsBancoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#002868] text-xl">
              {selectedBanco?.banco_nombre || "OTROS"}
            </DialogTitle>
            <DialogDescription>
              Detalle de saldos del banco
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Saldo Real */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-sm font-medium text-[#666666] uppercase tracking-wide">Saldo Real</span>
              <span className={`text-lg font-bold ${Number(selectedBanco?.total_real) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatMonto(selectedBanco?.total_real ?? 0)}
              </span>
            </div>
            {/* Compromisos pendientes */}
            <div className="flex items-center justify-between px-4 py-2 rounded-xl border border-dashed border-[#E0E0E0]">
              <span className="text-xs font-medium text-[#888888] uppercase tracking-wide">Compromisos pendientes</span>
              <span className={`text-sm font-semibold ${Number(selectedBanco?.total_necesario) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatMonto(selectedBanco?.total_necesario ?? 0)}
              </span>
            </div>
            {/* Saldo proyectado = real + necesario (ya negativos los egresos) */}
            <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${bancoNeto >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
              <span className="text-sm font-bold text-[#333] uppercase tracking-wide">Saldo Necesario</span>
              <span className={`text-lg font-bold ${bancoNeto >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {formatMonto(bancoNeto)}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
