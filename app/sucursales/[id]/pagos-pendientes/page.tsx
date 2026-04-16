'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { AlertTriangle, Plus } from 'lucide-react'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorBanner } from '@/components/ui/error-banner'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import NuevoMovimientoDialog from '@/components/NuevoMovimientoDialog'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { calcularTotal } from '@/lib/formatters'
import { PagosPendientesTable } from '@/components/pagos-pendientes/PagosPendientesTable'
import { AprobarDialog } from '@/components/pagos-pendientes/AprobarDialog'
import { RechazarDialog } from '@/components/pagos-pendientes/RechazarDialog'
import { HistorialFiltros } from '@/components/pagos-pendientes/HistorialFiltros'
import type { PagoPendiente } from '@/lib/types'

export default function PagosPendientesPage() {
  const params = useParams()
  const { user, isGuardLoading, handleLogout } = useAuthGuard()
  const searchParams = useSearchParams()
  const moneda = (searchParams.get('moneda') as 'ARS' | 'USD') || 'ARS'

  const [isLoading, setIsLoading] = useState(true)
  const [pagosPendientes, setPagosPendientes] = useState<PagoPendiente[]>([])
  const [historial, setHistorial] = useState<PagoPendiente[]>([])
  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes')
  const [error, setError] = useState('')

  const [isAprobarDialogOpen, setIsAprobarDialogOpen] = useState(false)
  const [isRechazarDialogOpen, setIsRechazarDialogOpen] = useState(false)
  const [isAprobacionMovimientoOpen, setIsAprobacionMovimientoOpen] = useState(false)
  const [selectedPago, setSelectedPago] = useState<PagoPendiente | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [tipoCaja, setTipoCaja] = useState<'efectivo' | 'banco'>('efectivo')
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [isNuevoMovimientoDialogOpen, setIsNuevoMovimientoDialogOpen] = useState(false)

  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'aprobado' | 'rechazado'>('todos')
  const [filtroUsuario, setFiltroUsuario] = useState<string>('')
  const [sucursalActiva, setSucursalActiva] = useState<boolean | null>(null)

  useEffect(() => {
    if (!params.id) return
    apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(Number(params.id)))
      .then(r => r.json())
      .then(d => setSucursalActiva(Boolean(d.data?.activo)))
      .catch(() => setSucursalActiva(true))
  }, [params.id])

  const isReadOnly = sucursalActiva === false

  const fetchPagosPendientes = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await apiFetch(
        `${API_ENDPOINTS.PAGOS_PENDIENTES.GET_BY_SUCURSAL(Number(params.id))}?moneda=${moneda}`,
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al cargar pagos pendientes')
      setPagosPendientes(data.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar pagos pendientes')
    } finally {
      setIsLoading(false)
    }
  }, [params.id, moneda])

  const fetchHistorial = useCallback(async () => {
    if (!user) return
    try {
      setIsLoading(true)
      setError('')
      const response = await apiFetch(
        `${API_ENDPOINTS.PAGOS_PENDIENTES.GET_HISTORIAL(user.id)}?sucursal_id=${params.id}&moneda=${moneda}`,
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al cargar historial')
      setHistorial(data.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial')
    } finally {
      setIsLoading(false)
    }
  }, [params.id, user, moneda])

  useEffect(() => {
    if (!isGuardLoading) {
      if (activeTab === 'pendientes') fetchPagosPendientes()
      else fetchHistorial()
    }
  }, [isGuardLoading, activeTab, fetchPagosPendientes, fetchHistorial])

  const handleOpenAprobar = (pago: PagoPendiente) => {
    setSelectedPago(pago)
    setTipoCaja('efectivo')
    setIsAprobarDialogOpen(true)
  }

  const handleSelectCajaYContinuar = (caja: 'efectivo' | 'banco') => {
    setTipoCaja(caja)
    setIsAprobarDialogOpen(false)
    setIsAprobacionMovimientoOpen(true)
  }

  const handleOpenRechazar = (pago: PagoPendiente) => {
    setSelectedPago(pago)
    setMotivoRechazo('')
    setIsRechazarDialogOpen(true)
  }

  const handleRechazar = async () => {
    if (!selectedPago || !user || !motivoRechazo.trim()) {
      setError('Debe proporcionar un motivo de rechazo')
      setTimeout(() => setError(''), 3000)
      return
    }
    try {
      setIsSaving(true)
      setError('')
      const response = await apiFetch(API_ENDPOINTS.PAGOS_PENDIENTES.RECHAZAR(selectedPago.id), {
        method: 'PUT',
        body: JSON.stringify({
          usuario_revisor_id: user.id,
          motivo_rechazo: motivoRechazo,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al rechazar pago')
      toast.success('Pago rechazado exitosamente')
      setIsRechazarDialogOpen(false)
      fetchPagosPendientes()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al rechazar pago'
      setError(message)
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  if (isGuardLoading) return <PageLoadingSpinner />

  const total = calcularTotal(pagosPendientes)
  const isEmployee = user?.rol === 'empleado'
  const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin'

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

  const hayFiltrosActivos = filtroEstado !== 'todos' || filtroUsuario !== ''
  const displayData = activeTab === 'pendientes' ? pagosPendientes : isAdmin ? historialFiltrado : historial

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED]">
      <Navbar
        userName={user?.nombre}
        userRole={user?.rol}
        onLogout={handleLogout}
        showBackButton={true}
        backUrl={`/sucursales/${params.id}?moneda=${moneda}`}
      />

      <main className="container mx-auto px-6 py-8">
        <ErrorBanner error={error} />

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
            <Plus className="w-5 h-5" strokeWidth={2} />
            Nuevo Movimiento
          </Button>
        </div>

        {isReadOnly && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              Esta sucursal está <strong>inactiva</strong>. Podés ver los datos pero no crear ni autorizar movimientos.
            </p>
          </div>
        )}

        <div className="flex mb-4 bg-white/50 p-1 rounded-xl border border-[#E0E0E0] w-fit">
          <button
            onClick={() => {
              setActiveTab('pendientes')
              setFiltroEstado('todos')
              setFiltroUsuario('')
            }}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'pendientes' ? 'bg-[#002868] text-white shadow-md' : 'text-[#666666] hover:bg-[#F0F0F0]'
            }`}
          >
            {isEmployee ? 'Mis Pendientes' : 'Pendientes'}
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'historial' ? 'bg-[#002868] text-white shadow-md' : 'text-[#666666] hover:bg-[#F0F0F0]'
            }`}
          >
            {isEmployee ? 'Mi Historial' : 'Historial General'}
          </button>
        </div>

        {activeTab === 'historial' && isAdmin && (
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

        <PagosPendientesTable
          displayData={displayData}
          activeTab={activeTab}
          userRole={user?.rol}
          isReadOnly={isReadOnly}
          total={total}
          isLoading={isLoading}
          onAprobar={handleOpenAprobar}
          onRechazar={handleOpenRechazar}
        />
      </main>

      <AprobarDialog
        open={isAprobarDialogOpen}
        onOpenChange={setIsAprobarDialogOpen}
        selectedPago={selectedPago}
        onSelectCaja={handleSelectCajaYContinuar}
      />

      <RechazarDialog
        open={isRechazarDialogOpen}
        onOpenChange={setIsRechazarDialogOpen}
        motivoRechazo={motivoRechazo}
        onMotivoChange={setMotivoRechazo}
        onConfirm={handleRechazar}
        isSaving={isSaving}
      />

      <NuevoMovimientoDialog
        isOpen={isNuevoMovimientoDialogOpen}
        onClose={() => setIsNuevoMovimientoDialogOpen(false)}
        sucursalId={Number(params.id)}
        moneda={moneda}
        isPagoPendiente={true}
        onSuccess={() => {
          toast.success('Solicitud de movimiento creada correctamente')
          if (activeTab === 'pendientes') fetchPagosPendientes()
          else fetchHistorial()
        }}
      />

      {selectedPago && (
        <NuevoMovimientoDialog
          isOpen={isAprobacionMovimientoOpen}
          onClose={() => {
            setIsAprobacionMovimientoOpen(false)
            setSelectedPago(null)
          }}
          sucursalId={Number(params.id)}
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
          }}
          onSuccess={() => {
            toast.success('Pago aprobado y movimiento registrado correctamente')
            setIsAprobacionMovimientoOpen(false)
            setSelectedPago(null)
            fetchPagosPendientes()
          }}
        />
      )}
    </div>
  )
}
