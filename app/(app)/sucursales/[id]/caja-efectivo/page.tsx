'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCajaData } from '@/hooks/use-caja-data'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { calcularTotal } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/caja/PageHeader'
import { ContentLoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorBanner } from '@/components/ui/error-banner'
import { AccessDenied } from '@/components/ui/access-denied'
import { useAuthStore } from '@/store/authStore'
import { useSidebarStore } from '@/store/sidebarStore'
import { CajaTabs, TabsContent } from '@/components/caja/CajaTabs'
import { TransactionTable, getEfectivoColumns, getCompactColumns } from '@/components/caja/TransactionTable'
import { InlineMovimientoRow } from '@/components/caja/InlineMovimientoRow'
import { EndDateFilter } from '@/components/caja/EndDateFilter'
import type { CajaViewMode } from '@/lib/caja-reorder'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { downloadBlob, toDateOnly } from '@/lib/downloadBlob'
import type { ExportExcelOpciones } from '@/lib/types'

const NuevoMovimientoDialog = dynamic(() => import('@/components/NuevoMovimientoDialog'))
const CompraVentaDivisasDialog = dynamic(() =>
  import('@/components/caja/CompraVentaDivisasDialog').then(module => module.CompraVentaDivisasDialog),
)
const ExportExcelDialog = dynamic(() =>
  import('@/components/caja/ExportExcelDialog').then(module => module.ExportExcelDialog),
)
const PaymentCalendar = dynamic(() =>
  import('@/components/caja/PaymentCalendar').then(module => module.PaymentCalendar),
)
const DualSaldoBoard = dynamic(() => import('@/components/caja/DualSaldoBoard').then(module => module.DualSaldoBoard))
const DetailsDialog = dynamic(() => import('@/components/caja/TransactionDialogs').then(module => module.DetailsDialog))
const StateDialog = dynamic(() => import('@/components/caja/TransactionDialogs').then(module => module.StateDialog))
const DeleteDialog = dynamic(() => import('@/components/caja/TransactionDialogs').then(module => module.DeleteDialog))
const DeudaDialog = dynamic(() => import('@/components/caja/TransactionDialogs').then(module => module.DeudaDialog))
const MoverMovimientoDialog = dynamic(() =>
  import('@/components/caja/MoverMovimientoDialog').then(module => module.MoverMovimientoDialog),
)
const BulkMoverDialog = dynamic(() =>
  import('@/components/caja/BulkMoverDialog').then(module => module.BulkMoverDialog),
)

const columns = getEfectivoColumns()
const compactColumns = getCompactColumns()

export default function CajaEfectivoPage() {
  const params = useParams()
  const router = useRouter()
  const user = useAuthStore(state => state.user)
  const searchParams = useSearchParams()
  const moneda = (searchParams.get('moneda') as 'ARS' | 'USD') || 'ARS'
  const caja = useCajaData('efectivo', moneda)
  const [activeTab, setActiveTab] = useState('real')
  const [viewMode, setViewMode] = useState<CajaViewMode>('tabla')
  const [sucursalActiva, setSucursalActiva] = useState<boolean | null>(null)
  const [sucursalNombre, setSucursalNombre] = useState('')
  const [isCompraVentaDialogOpen, setIsCompraVentaDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isBulkMoverDialogOpen, setIsBulkMoverDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [bulkSelectedIds, setBulkSelectedIds] = useState<number[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [highlightId, setHighlightId] = useState<number | null>(null)

  // Identifica la sucursal en la pestaña (útil con varias ventanas abiertas)
  useDocumentTitle(sucursalNombre ? `${sucursalNombre} · Caja Efectivo` : '')

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

  const handleExportConfirm = async (opciones: ExportExcelOpciones) => {
    setIsExportDialogOpen(false)
    setIsExporting(true)
    try {
      const qp = new URLSearchParams({ moneda })
      if (caja.dateRange?.from) qp.set('fechaInicio', toDateOnly(caja.dateRange.from))
      if (caja.dateRange?.to) qp.set('fechaFin', toDateOnly(caja.dateRange.to))
      if (caja.searchText) qp.set('searchText', caja.searchText)
      if (caja.filtroDeuda !== 'todos') qp.set('filtroDeuda', caja.filtroDeuda)
      if (opciones.tipo !== 'todos') qp.set('tipoMovimiento', opciones.tipo === 'ingresos' ? 'ingreso' : 'egreso')
      if (opciones.saldo !== 'todos') qp.set('tipoSaldo', opciones.saldo)
      if (opciones.caja === 'ambas') qp.set('caja', 'ambas')

      const url = `${API_ENDPOINTS.MOVIMIENTOS.EXPORT_EXCEL(Number(params.id))}?${qp.toString()}`
      const res = await apiFetch(url)
      if (!res.ok) throw new Error('Error en la respuesta del servidor')
      const blob = await res.blob()
      const sufijo = opciones.caja === 'ambas' ? ' - Efectivo + Banco' : ''
      downloadBlob(blob, `${sucursalNombre}${sufijo}.xlsx`)
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

  // Edición de celdas en línea (estilo Excel) — requiere permiso de edición
  const inlineEdit = canEditInfo
    ? {
        context: {
          categorias: caja.categorias,
          descripciones: caja.descripciones,
          bancos: caja.bancos,
          mediosPago: caja.mediosPago,
        },
        onSave: caja.updateMovimientoInline,
      }
    : undefined

  // Creación de movimientos en línea (solo ARS; USD requiere tipo de cambio)
  const canInlineCreate = canCrear && moneda === 'ARS'
  const renderInlineForm =
    (estado: 'completado' | 'aprobado') =>
    ({ defaultFecha, orden, onClose }: { defaultFecha: string; orden: number; onClose: () => void }) => (
      <InlineMovimientoRow
        cajaTipo="efectivo"
        moneda={moneda}
        sucursalId={caja.sucursalId}
        userId={user?.id}
        estado={estado}
        defaultFecha={defaultFecha}
        orden={orden}
        categorias={caja.categorias}
        descripciones={caja.descripciones}
        bancos={caja.bancos}
        mediosPago={caja.mediosPago}
        onCancel={onClose}
        onCreated={(createdId: number) => {
          caja.fetchMovimientos()
          caja.fetchDescripciones()
          setHighlightId(createdId)
          onClose()
        }}
      />
    )

  const { initialize } = caja
  useEffect(() => {
    if (user?.rol === 'empleado') return
    initialize()
  }, [user?.rol, initialize])

  // Al abrir la vista Dual, colapsar la sidebar para ganar ancho (los dos paneles lado a lado)
  const setSidebarCollapsed = useSidebarStore(state => state.setCollapsed)
  useEffect(() => {
    if (viewMode === 'dual') setSidebarCollapsed(true)
  }, [viewMode, setSidebarCollapsed])

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

      <main
        className={cn(
          'px-4 sm:px-6 py-6 sm:py-8 flex flex-col h-full',
          viewMode === 'dual' ? 'w-full' : 'container mx-auto',
        )}
      >
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
              moneda={moneda}
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
                  onFiltroDeudeChange={viewMode !== 'dual' && activeTab === 'real' ? undefined : caja.setFiltroDeuda}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                {viewMode === 'dual' ? (
                  <DualSaldoBoard
                    real={caja.saldoRealFiltrado}
                    necesario={caja.saldoNecesarioFiltrado}
                    columns={compactColumns}
                    realTotal={calcularTotal(caja.saldoRealFiltrado)}
                    necesarioTotal={
                      calcularTotal(caja.saldoRealFiltrado) + calcularTotal(caja.saldoNecesarioSinDeudaFiltrado)
                    }
                    onViewDetails={caja.handleOpenDetails}
                    onChangeState={canChangeState ? caja.handleOpenStateChange : undefined}
                    onDelete={canDelete ? caja.handleOpenDelete : undefined}
                    onToggleDeuda={canToggleDeuda ? caja.handleOpenDeuda : undefined}
                    onMove={canCrear ? caja.handleOpenMover : undefined}
                    isReadOnly={isStrictlyReadOnly}
                    inlineEdit={inlineEdit}
                    onReorder={caja.reorderMovimiento}
                    onChangeEstado={caja.cambiarEstadoMovimiento}
                    canInlineCreate={canInlineCreate}
                    renderInlineCreateFormReal={renderInlineForm('completado')}
                    renderInlineCreateFormNecesario={renderInlineForm('aprobado')}
                    highlightId={highlightId}
                  />
                ) : (
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
                          canInlineCreate={canInlineCreate}
                          renderInlineCreateForm={renderInlineForm('completado')}
                          highlightId={highlightId}
                          onReorder={caja.reorderMovimiento}
                          inlineEdit={inlineEdit}
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
                          saldoRealActual={calcularTotal(caja.saldoRealFiltrado)}
                          acumularVencidosEnHoy
                        />
                      ) : (
                        <TransactionTable
                          title="Saldo Necesario"
                          description="Pagos y compromisos en efectivo programados."
                          transactions={caja.saldoNecesarioFiltrado}
                          customTotal={
                            calcularTotal(caja.saldoReal) + calcularTotal(caja.saldoNecesarioSinDeudaFiltrado)
                          }
                          columns={columns}
                          onViewDetails={caja.handleOpenDetails}
                          onChangeState={canChangeState ? caja.handleOpenStateChange : undefined}
                          onDelete={canDelete ? caja.handleOpenDelete : undefined}
                          onToggleDeuda={canToggleDeuda ? caja.handleOpenDeuda : undefined}
                          onMove={canCrear ? caja.handleOpenMover : undefined}
                          onBulkDelete={canDelete ? handleBulkDelete : undefined}
                          onBulkMove={canCrear ? handleBulkMove : undefined}
                          isReadOnly={isStrictlyReadOnly}
                          canInlineCreate={canInlineCreate}
                          renderInlineCreateForm={renderInlineForm('aprobado')}
                          highlightId={highlightId}
                          onReorder={caja.reorderMovimiento}
                          inlineEdit={inlineEdit}
                        />
                      )}
                    </TabsContent>
                  </CajaTabs>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Dialogs */}
      {caja.isDetailsDialogOpen && (
        <DetailsDialog
          open
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
      )}

      {caja.isStateDialogOpen && (
        <StateDialog
          open
          onOpenChange={caja.setIsStateDialogOpen}
          nuevoEstado={caja.nuevoEstado}
          onEstadoChange={caja.setNuevoEstado}
          onSave={caja.handleSaveStateChange}
          isSaving={caja.isSaving}
        />
      )}

      {caja.isDeleteDialogOpen && (
        <DeleteDialog
          open
          onOpenChange={caja.setIsDeleteDialogOpen}
          onConfirm={caja.handleDelete}
          isSaving={caja.isSaving}
        />
      )}

      {isBulkDeleteDialogOpen && (
        <DeleteDialog
          open
          onOpenChange={setIsBulkDeleteDialogOpen}
          onConfirm={handleBulkDeleteConfirm}
          isSaving={isBulkDeleting}
          count={bulkSelectedIds.length}
        />
      )}

      {caja.isDeudaDialogOpen && (
        <DeudaDialog
          open
          onOpenChange={caja.setIsDeudaDialogOpen}
          transaction={caja.selectedTransaction}
          onSave={caja.handleSaveDeuda}
          isSaving={caja.isSaving}
        />
      )}

      {caja.isNuevoMovimientoDialogOpen && (
        <NuevoMovimientoDialog
          isOpen
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
      )}

      {caja.isMoverMovimientoDialogOpen && (
        <MoverMovimientoDialog
          open
          onOpenChange={caja.setIsMoverMovimientoDialogOpen}
          transaction={caja.selectedTransaction}
          currentSucursalId={caja.sucursalId}
          onSuccess={caja.fetchMovimientos}
          bancosExternos={caja.bancos}
          mediosPagoExternos={caja.mediosPago}
        />
      )}

      {isCompraVentaDialogOpen && (
        <CompraVentaDivisasDialog
          isOpen
          onClose={() => setIsCompraVentaDialogOpen(false)}
          sucursalId={caja.sucursalId}
          onSuccess={caja.fetchMovimientos}
        />
      )}

      {isBulkMoverDialogOpen && (
        <BulkMoverDialog
          open
          onOpenChange={setIsBulkMoverDialogOpen}
          selectedIds={bulkSelectedIds}
          currentSucursalId={caja.sucursalId}
          cajaTipo="efectivo"
          onSuccess={caja.fetchMovimientos}
          bancosExternos={caja.bancos}
          mediosPagoExternos={caja.mediosPago}
        />
      )}

      {/* Dialog de opciones de exportación */}
      {isExportDialogOpen && (
        <ExportExcelDialog
          open
          onOpenChange={setIsExportDialogOpen}
          cajaActual="efectivo"
          onConfirm={handleExportConfirm}
        />
      )}
    </div>
  )
}
