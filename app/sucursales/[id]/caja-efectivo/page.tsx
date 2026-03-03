"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import NuevoMovimientoDialog from "@/components/NuevoMovimientoDialog";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useCajaData } from "@/hooks/use-caja-data";
import { calcularTotal } from "@/lib/formatters";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/caja/PageHeader";
import { CajaTabs, TabsContent } from "@/components/caja/CajaTabs";
import {
  TransactionTable,
  getEfectivoColumns,
} from "@/components/caja/TransactionTable";
import { DateRangeFilter } from "@/components/caja/DateRangeFilter";
import {
  DetailsDialog,
  StateDialog,
  DeleteDialog,
  DeudaDialog,
} from "@/components/caja/TransactionDialogs";

const columns = getEfectivoColumns();

export default function CajaEfectivoPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isGuardLoading, handleLogout } = useAuthGuard();
  const caja = useCajaData("efectivo");
  const [activeTab, setActiveTab] = useState("real");

  // Inicializar datos al montar (solo si auth está lista)
  useEffect(() => {
    if (!isGuardLoading && user?.rol !== "empleado") {
      caja.initialize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuardLoading]);

  // --- Guard de carga ---
  if (isGuardLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin" />
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

      <main className="container mx-auto px-6 py-8 flex flex-col h-full">
        {/* Acceso denegado para empleados */}
        {user?.rol === "empleado" ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E0E0E0] shadow-sm flex-grow">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-rose-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#002868] mb-2">Acceso Denegado</h2>
            <p className="text-[#666666] text-center max-w-md">
              No tienes permisos para gestionar la caja de efectivo. Si crees que esto es un error, contacta con el administrador.
            </p>
            <Button
              onClick={() => router.push(`/sucursales/${params.id}`)}
              className="mt-8 bg-[#002868] hover:bg-[#003d8f] text-white"
            >
              Volver al inicio
            </Button>
          </div>
        ) : (
          <div className="flex flex-col space-y-6 flex-grow">
            {/* Mensajes */}
            {caja.error && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 font-medium flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> {caja.error}</p>
              </div>
            )}


            {/* Cabecera */}
            <PageHeader
              title="Caja Efectivo"
              subtitle="Gestión de saldos y movimientos en efectivo"
              onNewMovimiento={() => caja.setIsNuevoMovimientoDialogOpen(true)}
            />

            {caja.isLoading ? (
              <div className="flex items-center justify-center py-16 flex-grow">
                <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Filtro por fechas */}
                <DateRangeFilter
                  fechaHasta={caja.fechaHasta}
                  onHastaChange={caja.setFechaHasta}
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
                    />
                  </TabsContent>
                  <TabsContent value="necesario" className="mt-0 outline-none flex-grow">
                    <TransactionTable
                      title="Saldo Necesario"
                      description="Pagos y compromisos en efectivo programados."
                      transactions={caja.saldoNecesarioFiltrado}
                      customTotal={calcularTotal(caja.saldoRealFiltrado) - Math.abs(calcularTotal(caja.saldoNecesarioSinDeudaFiltrado))}
                      columns={columns}
                      onViewDetails={caja.handleOpenDetails}
                      onChangeState={caja.handleOpenStateChange}
                      onDelete={caja.handleOpenDelete}
                      onToggleDeuda={caja.handleOpenDeuda}
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
      />
    </div>
  );
}
