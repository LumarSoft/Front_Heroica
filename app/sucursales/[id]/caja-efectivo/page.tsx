"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

import Navbar from "@/components/Navbar";
import NuevoMovimientoDialog from "@/components/NuevoMovimientoDialog";
import { CompraVentaDivisasDialog } from "@/components/caja/CompraVentaDivisasDialog";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useCajaData } from "@/hooks/use-caja-data";
import { calcularTotal } from "@/lib/formatters";
import { PageHeader } from "@/components/caja/PageHeader";
import { PageLoadingSpinner, ContentLoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorBanner } from "@/components/ui/error-banner";
import { AccessDenied } from "@/components/ui/access-denied";
import { CajaTabs, TabsContent } from "@/components/caja/CajaTabs";
import {
  TransactionTable,
  getEfectivoColumns,
} from "@/components/caja/TransactionTable";
import { EndDateFilter } from "@/components/caja/EndDateFilter";
import {
  DetailsDialog,
  StateDialog,
  DeleteDialog,
  DeudaDialog,
} from "@/components/caja/TransactionDialogs";
import { MoverMovimientoDialog } from "@/components/caja/MoverMovimientoDialog";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import { AlertTriangle } from "lucide-react";

const columns = getEfectivoColumns();

export default function CajaEfectivoPage() {
  const params = useParams();
  const { user, isGuardLoading, handleLogout } = useAuthGuard();
  const searchParams = useSearchParams();
  const moneda = (searchParams.get("moneda") as "ARS" | "USD") || "ARS";
  const caja = useCajaData("efectivo", moneda);
  const [activeTab, setActiveTab] = useState("real");
  const [sucursalActiva, setSucursalActiva] = useState<boolean | null>(null);
  const [sucursalNombre, setSucursalNombre] = useState("");
  const [isCompraVentaDialogOpen, setIsCompraVentaDialogOpen] = useState(false);

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
          <AccessDenied resource="la caja de efectivo" backUrl={`/sucursales/${params.id}`} />
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
              title={`Caja Efectivo — ${moneda}`}
              subtitle={`Gestión de saldos y movimientos en efectivo (${moneda})`}
              onNewMovimiento={() => caja.setIsNuevoMovimientoDialogOpen(true)}
              onCompraVentaDivisas={() => setIsCompraVentaDialogOpen(true)}
              isReadOnly={isReadOnly}
              sucursalId={Number(params.id)}
            />

            {caja.isLoading ? (
              <ContentLoadingSpinner />
            ) : (
              <>
                {/* Filtro por fechas */}
                <EndDateFilter
                  dateRange={caja.dateRange}
                  onDateRangeChange={caja.setDateRange}
                  onLimpiar={caja.limpiarFiltros}
                  hayFiltro={caja.hayFiltroActivo}
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
                      description="Movimientos de efectivo confirmados para el periodo actual."
                      transactions={caja.saldoRealFiltrado}
                      columns={columns}
                      onViewDetails={caja.handleOpenDetails}
                      onChangeState={caja.handleOpenStateChange}
                      onDelete={caja.handleOpenDelete}
                      onMove={caja.handleOpenMover}
                      isReadOnly={isReadOnly}
                    />
                  </TabsContent>
                  <TabsContent value="necesario" className="mt-0 outline-none flex-grow">
                    <TransactionTable
                      title="Saldo Necesario"
                      description="Pagos y compromisos en efectivo programados."
                      transactions={caja.saldoNecesarioFiltrado}
                      customTotal={calcularTotal(caja.saldoReal) + calcularTotal(caja.saldoNecesarioSinDeudaFiltrado)}
                      columns={columns}
                      onViewDetails={caja.handleOpenDetails}
                      onChangeState={caja.handleOpenStateChange}
                      onDelete={caja.handleOpenDelete}
                      onToggleDeuda={caja.handleOpenDeuda}
                      onMove={caja.handleOpenMover}
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
        showBancoFields={false}
        isReadOnly={isReadOnly}
        movimientoId={caja.selectedTransaction?.id}
        cajaTipo="efectivo"
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
        cajaTipo="efectivo"
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

      <CompraVentaDivisasDialog
        isOpen={isCompraVentaDialogOpen}
        onClose={() => setIsCompraVentaDialogOpen(false)}
        sucursalId={caja.sucursalId}
        onSuccess={caja.fetchMovimientos}
      />
    </div>
  );
}
