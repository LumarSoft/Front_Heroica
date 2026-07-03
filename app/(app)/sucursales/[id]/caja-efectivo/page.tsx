'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import NuevoMovimientoDialog from '@/components/NuevoMovimientoDialog'
import { CompraVentaDivisasDialog } from '@/components/caja/CompraVentaDivisasDialog'
import { useCajaData } from '@/hooks/use-caja-data'
import { calcularTotal } from '@/lib/formatters'
import { PageHeader } from '@/components/caja/PageHeader'
import { ContentLoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorBanner } from '@/components/ui/error-banner'
import { AccessDenied } from '@/components/ui/access-denied'
import { useAuthStore } from '@/store/authStore'
import { CajaTabs, TabsContent } from '@/components/caja/CajaTabs'
import { TransactionTable, getEfectivoColumns } from '@/components/caja/TransactionTable'
import { PaymentCalendar } from '@/components/caja/PaymentCalendar'
import { EndDateFilter } from '@/components/caja/EndDateFilter'
import { DetailsDialog, StateDialog, DeleteDialog, DeudaDialog } from '@/components/caja/TransactionDialogs'
import { MoverMovimientoDialog } from '@/components/caja/MoverMovimientoDialog'
import { BulkMoverDialog } from '@/components/caja/BulkMoverDialog'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { downloadBlob, toDateOnly } from '@/lib/downloadBlob'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const columns = getEfectivoColumns()

export default function CajaEfectivoPage() {
  const params = useParams()
  const router = useRouter()
  const user = useAuthStore(state => state.user)
  const searchParams = useSearchParams()
  const moneda = (searchParams.get('moneda') as 'ARS' | 'USD') || 'ARS'
  const caja = useCajaData('efectivo', moneda)
  const [activeTab, setActiveTab] = useState('real')
  const [viewMode, setViewMode] = useState<'tabla' | 'calendario'>('tabla')
  const [sucursalActiva, setSucursalActiva] = useState<boolean | null>(null)
  const [sucursalNombre, setSucursalNombre] = useState('')
  const [isCompraVentaDialogOpen, setIsCompraVentaDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportTipo, setExportTipo] = useState<'todos' | 'ingresos' | 'egresos'>('todos')
  const [isBulkMoverDialogOpen, setIsBulkMoverDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [bulkSelectedIds, setBulkSelectedIds] = useState<number[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const handleBulkDelete = (ids: number[]) => {
    setBulkSelectedIds(ids)
    setIsBulkDeleteDialogOpen(true)
  }

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.MOVIMIENTOS.BULK_DELETE, {
        method: 'DELETE',
        body: JSON.stringify({ ids: bulkSelectedIds }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        caja.fetchMovimientos()
        setIsBulkDeleteDialogOpen(false)
      } else {
        toast.error(data.message || 'Error al eliminar.')
      }
    } catch {
      toast.error('Error de red al eliminar.')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkMove = (ids: number[]) => {
    setBulkSelectedIds(ids)
    setIsBulkMoverDialogOpen(true)
  }

  const handleExportConfirm = async () => {
    setIsExportDialogOpen(false)
    setIsExporting(true)
    try {
      const qp = new URLSearchParams({ moneda })
      if (caja.dateRange?.from) qp.set('fechaInicio', toDateOnly(caja.dateRange.from))
      if (caja.dateRange?.to) qp.set('fechaFin', toDateOnly(caja.dateRange.to))
      if (caja.searchText) qp.set('searchText', caja.searchText)
      if (caja.filtroDeuda !== 'todos') qp.set('filtroDeuda', caja.filtroDeuda)
      if (exportTipo !== 'todos') qp.set('tipoMovimiento', exportTipo === 'ingresos' ? 'ingreso' : 'egreso')

      const url = `${API_ENDPOINTS.MOVIMIENTOS.EXPORT_EXCEL(Number(params.id))}?${qp.toString()}`
      const res = await apiFetch(url)
      if (!res.ok) throw new Error('Error en la respuesta del servidor')
      const blob = await res.blob()
      downloadBlob(blob, `${sucursalNombre}.xlsx`)
    } catch {
      toast.error('Error al exportar el Excel.')
    } finally {
      setIsExporting(false)
    }
  }

  // Verificar si la sucursal está activa
  useEffect(() => {
    if (!params.id) return
    apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(Number(params.id)))
      .then(r => r.json())
      .then(d => {
        setSucursalActiva(Boolean(d.data?.activo))
        setSucursalNombre(d.data?.nombre || '')
      })
      .catch(() => setSucursalActiva(true))
  }, [params.id])

  const { hasPermiso } = useAuthStore()
  const isGlobalReadOnly = sucursalActiva === false

  const canCrear = !isGlobalReadOnly && hasPermiso('crear_movimientos')
  const canEditInfo = !isGlobalReadOnly && hasPermiso('editar_movimientos')
  const canAddComment = !isGlobalReadOnly && hasPermiso('agregar_comentarios')
  const canDelete = !isGlobalReadOnly && hasPermiso('eliminar_movimientos')
  const canChangeState = !isGlobalReadOnly && hasPermiso('aprobar_movimientos')
  const canToggleDeuda = canCrear // because creating mirror debt acts as "crear"

  const isStrictlyReadOnly = isGlobalReadOnly || (!canEditInfo && !canAddComment)

  const { initialize } = caja
  useEffect(() => {
    if (user?.rol === 'empleado') return
    initialize()
  }, [user?.rol, initialize])

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED]">
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-3">
            <Button
              onClick={() => router.push(`/sucursales/${params.id}?moneda=${moneda}`)}
              variant="ghost"
              size="icon"
              className="w-9 h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 cursor-pointer rounded-lg"
              aria-label="Volver a la sucursal"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-1">
                Sucursal
              </p>
              <h2 className="text-sm sm:text-base font-semibold text-[#002868] truncate leading-none">
                {sucursalNombre || 'Cargando...'}
              </h2>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col h-full">
        {user?.rol === 'empleado' ? (
          <AccessDenied resource="la caja de efectivo" backUrl={`/sucursales/${params.id}`} />
        ) : (
          <div className="flex flex-col space-y-6 flex-grow">
            {/* Mensajes */}
            <ErrorBanner error={caja.error} />

            {isStrictlyReadOnly && !isGlobalReadOnly && (
              <div className="mb-4 p-4 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <p className="text-sm text-indigo-800 font-medium">
                  Modo lectura. Solo puedes visualizar los movimientos.
                </p>
              </div>
            )}

            {/* Cabecera */}
            <PageHeader
              title={`Caja Efectivo — ${moneda}`}
              subtitle={`Gestión de saldos y movimientos en efectivo (${moneda})`}
              onNewMovimiento={() => caja.setIsNuevoMovimientoDialogOpen(true)}
              onCompraVentaDivisas={() => setIsCompraVentaDialogOpen(true)}
              onExport={() => setIsExportDialogOpen(true)}
              isExporting={isExporting}
              isReadOnly={!canCrear}
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
                  searchText={caja.searchText}
                  onSearchTextChange={caja.setSearchText}
                  filtroDeuda={caja.filtroDeuda}
                  onFiltroDeudeChange={caja.setFiltroDeuda}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                <CajaTabs
                  saldoReal={caja.saldoRealFiltrado}
                  saldoNecesario={caja.saldoNecesarioSinDeudaFiltrado}
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
                  <TabsContent value="real" className="mt-0 outline-none flex-grow">
                    {viewMode === 'calendario' ? (
                      <PaymentCalendar
                        title="Saldo Real"
                        description="Movimientos de efectivo confirmados."
                        transactions={caja.saldoRealFiltrado}
                        columns={columns}
                        onViewDetails={caja.handleOpenDetails}
                        onChangeState={caja.handleOpenStateChange}
                        onDelete={canDelete ? caja.handleOpenDelete : undefined}
                        onMove={canCrear ? caja.handleOpenMover : undefined}
                        onBulkDelete={canDelete ? handleBulkDelete : undefined}
                        onBulkMove={canCrear ? handleBulkMove : undefined}
                        isReadOnly={isStrictlyReadOnly}
                      />
                    ) : (
                      <TransactionTable
                        title="Saldo Real"
                        description="Movimientos de efectivo confirmados para el periodo actual."
                        transactions={caja.saldoRealFiltrado}
                        columns={columns}
                        onViewDetails={caja.handleOpenDetails}
                        onChangeState={caja.handleOpenStateChange}
                        onDelete={canDelete ? caja.handleOpenDelete : undefined}
                        onMove={canCrear ? caja.handleOpenMover : undefined}
                        onBulkDelete={canDelete ? handleBulkDelete : undefined}
                        onBulkMove={canCrear ? handleBulkMove : undefined}
                        isReadOnly={isStrictlyReadOnly}
                      />
                    )}
                  </TabsContent>
                  <TabsContent value="necesario" className="mt-0 outline-none flex-grow">
                    {viewMode === 'calendario' ? (
                      <PaymentCalendar
                        title="Saldo Necesario"
                        description="Pagos y compromisos en efectivo programados."
                        transactions={caja.saldoNecesarioFiltrado}
                        columns={columns}
                        onViewDetails={caja.handleOpenDetails}
                        onChangeState={canChangeState ? caja.handleOpenStateChange : undefined}
                        onDelete={canDelete ? caja.handleOpenDelete : undefined}
                        onToggleDeuda={canToggleDeuda ? caja.handleOpenDeuda : undefined}
                        onMove={canCrear ? caja.handleOpenMover : undefined}
                        onBulkDelete={canDelete ? handleBulkDelete : undefined}
                        onBulkMove={canCrear ? handleBulkMove : undefined}
                        isReadOnly={isStrictlyReadOnly}
                      />
                    ) : (
                      <TransactionTable
                        title="Saldo Necesario"
                        description="Pagos y compromisos en efectivo programados."
                        transactions={caja.saldoNecesarioFiltrado}
                        customTotal={calcularTotal(caja.saldoReal) + calcularTotal(caja.saldoNecesarioSinDeudaFiltrado)}
                        columns={columns}
                        onViewDetails={caja.handleOpenDetails}
                        onChangeState={canChangeState ? caja.handleOpenStateChange : undefined}
                        onDelete={canDelete ? caja.handleOpenDelete : undefined}
                        onToggleDeuda={canToggleDeuda ? caja.handleOpenDeuda : undefined}
                        onMove={canCrear ? caja.handleOpenMover : undefined}
                        onBulkDelete={canDelete ? handleBulkDelete : undefined}
                        onBulkMove={canCrear ? handleBulkMove : undefined}
                        isReadOnly={isStrictlyReadOnly}
                      />
                    )}
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
        descripciones={caja.descripciones}
        proveedores={caja.proveedores}
        showBancoFields={false}
        isReadOnly={isStrictlyReadOnly}
        canEditInfo={canEditInfo}
        canEditComment={canAddComment}
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
        onSuccess={() => {
          caja.fetchMovimientos()
          caja.fetchDescripciones()
        }}
        cajaTipo="efectivo"
        moneda={moneda}
        categoriasExternas={caja.categorias}
        descripcionesExternas={caja.descripciones}
        proveedoresExternas={caja.proveedores}
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

      <BulkMoverDialog
        open={isBulkMoverDialogOpen}
        onOpenChange={setIsBulkMoverDialogOpen}
        selectedIds={bulkSelectedIds}
        currentSucursalId={caja.sucursalId}
        cajaTipo="efectivo"
        onSuccess={caja.fetchMovimientos}
        bancosExternos={caja.bancos}
        mediosPagoExternos={caja.mediosPago}
      />

      {/* Dialog de opciones de exportación */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#002868] text-xl">Exportar Excel</DialogTitle>
            <DialogDescription>Elegí qué movimientos exportar</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(['todos', 'ingresos', 'egresos'] as const).map(opcion => (
              <label
                key={opcion}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${exportTipo === opcion ? 'border-[#002868] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <input
                  type="radio"
                  name="exportTipo"
                  value={opcion}
                  checked={exportTipo === opcion}
                  onChange={() => setExportTipo(opcion)}
                  className="accent-[#002868]"
                />
                <span className="font-medium capitalize text-sm text-gray-700">
                  {opcion === 'todos' ? 'Todo' : opcion === 'ingresos' ? 'Solo Ingresos' : 'Solo Egresos'}
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExportConfirm} className="bg-[#002868] hover:bg-[#003d8f] text-white">
              Exportar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
