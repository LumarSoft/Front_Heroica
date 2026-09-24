'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { ErrorBanner } from '@/components/ui/error-banner'
import NuevoMovimientoDialog from '@/components/NuevoMovimientoDialog'
import { useAuthStore } from '@/store/authStore'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { calcularTotal } from '@/lib/formatters'
import { PagosPendientesTable } from '@/components/pagos-pendientes/PagosPendientesTable'
import { AprobarDialog } from '@/components/pagos-pendientes/AprobarDialog'
import { RechazarDialog } from '@/components/pagos-pendientes/RechazarDialog'
import { HistorialFiltros } from '@/components/pagos-pendientes/HistorialFiltros'
import { AprobarMasivoDialog } from '@/components/pagos-pendientes/AprobarMasivoDialog'
import { MisSolicitudesPanel } from '@/components/pagos-pendientes/MisSolicitudesPanel'
import { PagosPendientesHeader } from '@/components/pagos-pendientes/PagosPendientesHeader'
import { PagosPendientesNavigation } from '@/components/pagos-pendientes/PagosPendientesNavigation'
import { NotificarEventoDialog, type NotificarEventoData } from '@/components/notificaciones/NotificarEventoDialog'
import { useMisSolicitudes } from '@/hooks/use-mis-solicitudes'
import { usePagosPendientesActions } from '@/hooks/use-pagos-pendientes-actions'
import type { PagoPendiente, PagosPendientesTab } from '@/lib/types'

export default function PagosPendientesPage() {
  const params = useParams()
  const sucursalId = Number(params.id)
  const router = useRouter()
  const user = useAuthStore(state => state.user)
  const isEmployee = user?.rol === 'empleado'
  const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin'
  const searchParams = useSearchParams()
  const moneda = (searchParams.get('moneda') as 'ARS' | 'USD') || 'ARS'

  const [isLoading, setIsLoading] = useState(true)
  const [pagosPendientes, setPagosPendientes] = useState<PagoPendiente[]>([])
  const [historial, setHistorial] = useState<PagoPendiente[]>([])
  const [activeTab, setActiveTab] = useState<PagosPendientesTab>('pendientes')
  const [error, setError] = useState('')

  const [isNuevoMovimientoDialogOpen, setIsNuevoMovimientoDialogOpen] = useState(false)

  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'aprobado' | 'rechazado'>('todos')
  const [filtroUsuario, setFiltroUsuario] = useState<string>('')
  const [sucursalActiva, setSucursalActiva] = useState<boolean | null>(null)
  const [sucursalNombre, setSucursalNombre] = useState('')
  const [notifyData, setNotifyData] = useState<NotificarEventoData | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const visibleTab = isEmployee ? 'seguimiento' : activeTab

  useDocumentTitle(sucursalNombre ? `${sucursalNombre} · Pagos Pendientes` : '')

  const {
    solicitudes: misSolicitudes,
    isLoading: isSeguimientoLoading,
    error: seguimientoError,
    refresh: refreshMisSolicitudes,
  } = useMisSolicitudes({ sucursalId, moneda, enabled: visibleTab === 'seguimiento' })

  useEffect(() => {
    if (!params.id) return
    apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(sucursalId))
      .then(r => r.json())
      .then(d => {
        setSucursalActiva(Boolean(d.data?.activo))
        setSucursalNombre(d.data?.nombre || '')
      })
      .catch(() => setSucursalActiva(true))
  }, [sucursalId])

  const isReadOnly = sucursalActiva === false

  const fetchPagosPendientes = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await apiFetch(`${API_ENDPOINTS.PAGOS_PENDIENTES.GET_BY_SUCURSAL(sucursalId)}?moneda=${moneda}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al cargar pagos pendientes')
      setPagosPendientes(data.data || [])
      setSelectedIds(new Set())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar pagos pendientes')
    } finally {
      setIsLoading(false)
    }
  }, [sucursalId, moneda])

  const fetchHistorial = useCallback(async () => {
    if (!user) return
    try {
      setIsLoading(true)
      setError('')
      const response = await apiFetch(
        `${API_ENDPOINTS.PAGOS_PENDIENTES.GET_HISTORIAL(user.id)}?sucursal_id=${sucursalId}&moneda=${moneda}`,
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al cargar historial')
      setHistorial(data.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial')
    } finally {
      setIsLoading(false)
    }
  }, [sucursalId, user, moneda])

  useEffect(() => {
    if (visibleTab === 'pendientes') void fetchPagosPendientes()
    if (visibleTab === 'historial') void fetchHistorial()
  }, [visibleTab, fetchPagosPendientes, fetchHistorial])

  const handlePagoRechazado = useCallback((pagoId: number): void => {
    setNotifyData({ tipo: 'pago_pendiente_rechazado', entidadId: pagoId })
  }, [])

  const {
    actionError,
    isSaving,
    selectedPago,
    tipoCaja,
    motivoRechazo,
    isAprobarDialogOpen,
    isRechazarDialogOpen,
    isAprobacionMovimientoOpen,
    isAprobarMasivoOpen,
    setMotivoRechazo,
    setSelectedPago,
    setIsAprobarDialogOpen,
    setIsRechazarDialogOpen,
    setIsAprobacionMovimientoOpen,
    setIsAprobarMasivoOpen,
    openAprobar,
    selectCaja,
    openRechazar,
    openRechazoMasivo,
    rechazar,
    aprobarMasivo,
  } = usePagosPendientesActions({
    userId: user?.id,
    selectedIds,
    refreshPendientes: fetchPagosPendientes,
    refreshSeguimiento: refreshMisSolicitudes,
    onPagoRechazado: handlePagoRechazado,
  })

  const total = calcularTotal(pagosPendientes)
  const usuariosRevisores = Array.from(
    new Set(historial.map(p => p.usuario_revisor_nombre).filter((n): n is string => Boolean(n))),
  ).sort()

  const historialFiltrado = historial.filter(p => {
    if (filtroEstado !== 'todos') {
      if (filtroEstado === 'aprobado') {
        if (p.estado !== 'aprobado' && p.estado !== 'completado') return false
      } else if (p.estado !== filtroEstado) {
        return false
      }
    }
    if (filtroUsuario && p.usuario_revisor_nombre !== filtroUsuario) return false
    return true
  })

  const displayData = visibleTab === 'pendientes' ? pagosPendientes : isAdmin ? historialFiltrado : historial

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED]">
      <PagosPendientesHeader
        sucursalNombre={sucursalNombre}
        isReadOnly={isReadOnly}
        onBack={() => router.push(`/sucursales/${sucursalId}?moneda=${moneda}`)}
        onNuevoMovimiento={() => setIsNuevoMovimientoDialogOpen(true)}
      />

      <main className="container mx-auto px-4 pb-8 sm:px-6">
        {visibleTab !== 'seguimiento' && <ErrorBanner error={error || actionError} />}

        <PagosPendientesNavigation
          activeTab={visibleTab}
          isEmployee={Boolean(isEmployee)}
          onTabChange={setActiveTab}
          onPendientesSelect={() => {
            setFiltroEstado('todos')
            setFiltroUsuario('')
          }}
        />

        {visibleTab === 'historial' && isAdmin && (
          <HistorialFiltros
            filtroEstado={filtroEstado}
            onFiltroEstadoChange={setFiltroEstado}
            filtroUsuario={filtroUsuario}
            onFiltroUsuarioChange={setFiltroUsuario}
            usuariosRevisores={usuariosRevisores}
            resultadosCount={historialFiltrado.length}
            totalCount={historial.length}
          />
        )}

        {visibleTab === 'seguimiento' ? (
          <MisSolicitudesPanel solicitudes={misSolicitudes} isLoading={isSeguimientoLoading} error={seguimientoError} />
        ) : (
          <PagosPendientesTable
            displayData={displayData}
            activeTab={visibleTab}
            userRole={user?.rol}
            isReadOnly={isReadOnly}
            total={total}
            isLoading={isLoading}
            onAprobar={openAprobar}
            onRechazar={openRechazar}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onAprobarSeleccionados={() => setIsAprobarMasivoOpen(true)}
            onRechazarSeleccionados={openRechazoMasivo}
          />
        )}
      </main>

      <AprobarDialog
        open={isAprobarDialogOpen}
        onOpenChange={setIsAprobarDialogOpen}
        selectedPago={selectedPago}
        onSelectCaja={selectCaja}
      />

      <RechazarDialog
        open={isRechazarDialogOpen}
        onOpenChange={setIsRechazarDialogOpen}
        motivoRechazo={motivoRechazo}
        onMotivoChange={setMotivoRechazo}
        onConfirm={rechazar}
        isSaving={isSaving}
      />

      <AprobarMasivoDialog
        open={isAprobarMasivoOpen}
        onOpenChange={setIsAprobarMasivoOpen}
        cantidad={selectedIds.size}
        isSaving={isSaving}
        onConfirm={aprobarMasivo}
      />

      <NuevoMovimientoDialog
        isOpen={isNuevoMovimientoDialogOpen}
        onClose={() => setIsNuevoMovimientoDialogOpen(false)}
        sucursalId={sucursalId}
        moneda={moneda}
        isPagoPendiente={true}
        onSuccess={notify => {
          toast.success('Solicitud de movimiento creada correctamente')
          if (visibleTab === 'pendientes') void fetchPagosPendientes()
          if (visibleTab === 'historial') void fetchHistorial()
          void refreshMisSolicitudes()
          if (notify) setNotifyData(notify)
        }}
      />

      {selectedPago && (
        <NuevoMovimientoDialog
          isOpen={isAprobacionMovimientoOpen}
          onClose={() => {
            setIsAprobacionMovimientoOpen(false)
            setSelectedPago(null)
          }}
          sucursalId={sucursalId}
          moneda={moneda}
          cajaTipo={tipoCaja}
          pagoIdToApprove={selectedPago.id}
          usuarioRevisorId={user?.id}
          initialValues={{
            concepto: selectedPago.concepto,
            monto: Math.abs(parseFloat(selectedPago.monto.toString())).toString(),
            comentarios: selectedPago.comentarios ?? '',
            fecha: selectedPago.fecha
              ? selectedPago.fecha.includes('T')
                ? selectedPago.fecha.split('T')[0]
                : selectedPago.fecha.substring(0, 10)
              : undefined,
            prioridad: selectedPago.prioridad as 'baja' | 'media' | 'alta' | undefined,
            categoria_id: selectedPago.categoria_id != null ? String(selectedPago.categoria_id) : undefined,
            subcategoria_id: selectedPago.subcategoria_id != null ? String(selectedPago.subcategoria_id) : undefined,
            descripcion_id: selectedPago.descripcion_id != null ? String(selectedPago.descripcion_id) : undefined,
            proveedor_id: selectedPago.proveedor_id != null ? String(selectedPago.proveedor_id) : undefined,
          }}
          onSuccess={notify => {
            toast.success('Pago aprobado y movimiento registrado correctamente')
            setIsAprobacionMovimientoOpen(false)
            setSelectedPago(null)
            fetchPagosPendientes()
            void refreshMisSolicitudes()
            if (notify) setNotifyData(notify)
          }}
        />
      )}

      <NotificarEventoDialog data={notifyData} onClose={() => setNotifyData(null)} />
    </div>
  )
}
