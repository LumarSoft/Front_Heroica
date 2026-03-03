"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

const columns = getBancoColumns();

export default function CajaBancoPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isGuardLoading, handleLogout } = useAuthGuard();
  const caja = useCajaData("banco");
  const [selectedBanco, setSelectedBanco] = useState<BancoParcial | null>(null);
  const [isBancoDialogOpen, setIsBancoDialogOpen] = useState(false);

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
              No tienes permisos para gestionar la caja de bancos. Si crees que esto es un error, contacta con el administrador.
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
                <p className="text-sm text-red-600 font-medium">⚠️ {caja.error}</p>
              </div>
            )}


            {/* Cabecera */}
            <PageHeader
              title="Caja Bancos"
              subtitle="Gestión de saldos y movimientos bancarios"
              onNewMovimiento={() => caja.setIsNuevoMovimientoDialogOpen(true)}
            />

            {caja.isLoading ? (
              <div className="flex items-center justify-center py-16 flex-grow">
                <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin" />
              </div>
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
                <CajaTabs saldoReal={caja.saldoReal} saldoNecesario={caja.saldoNecesarioSinDeuda}>
                  <TabsContent value="real" className="mt-0 outline-none flex-grow">
                    <TransactionTable
                      title="Saldo Real"
                      description="Movimientos de banco confirmados para el periodo actual."
                      transactions={caja.saldoReal}
                      columns={columns}
                      onViewDetails={caja.handleOpenDetails}
                      onChangeState={caja.handleOpenStateChange}
                      onDelete={caja.handleOpenDelete}
                    />
                  </TabsContent>
                  <TabsContent value="necesario" className="mt-0 outline-none flex-grow">
                    <TransactionTable
                      title="Saldo Necesario"
                      description="Pagos y compromisos bancarios programados."
                      transactions={caja.saldoNecesario}
                      customTotal={calcularTotal(caja.saldoReal) - Math.abs(calcularTotal(caja.saldoNecesarioSinDeuda))}
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
        showBancoFields={true}
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
        cajaTipo="banco"
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
            {(() => {
              const neto = Number(selectedBanco?.total_real ?? 0) + Number(selectedBanco?.total_necesario ?? 0);
              return (
                <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${neto >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                  <span className="text-sm font-bold text-[#333] uppercase tracking-wide">Saldo Necesario</span>
                  <span className={`text-lg font-bold ${neto >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {formatMonto(neto)}
                  </span>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
