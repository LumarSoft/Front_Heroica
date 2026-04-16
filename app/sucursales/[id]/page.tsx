'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { useEmployeeNotifications } from '@/hooks/use-employee-notifications'
import { formatMonto } from '@/lib/formatters'
import type { Sucursal, Documento, CuentaBancaria } from '@/lib/types'
import { Mail, Paperclip, ArrowLeft, Download, Trash2, AlertTriangle } from 'lucide-react'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorBanner } from '@/components/ui/error-banner'
import { useAuthStore } from '@/store/authStore'

export default function SucursalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const sucursalId = Number(params.id)
  const { user, isGuardLoading } = useAuthGuard()

  const canVerReportes = useAuthStore(state => state.canVerReportes())
  const canAprobarPendientes = useAuthStore(state => state.canAprobarPendientes())
  const canVerMovimientos = useAuthStore(state => state.canVerMovimientos())
  const canVerPendientes = useAuthStore(state => state.canVerPendientes())
  const canGestionarSucursales = useAuthStore(state => state.canGestionarSucursales())
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const dateInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [pendingCount, setPendingCount] = useState(0)
  const searchParams = useSearchParams()
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>((searchParams.get('moneda') as 'ARS' | 'USD') || 'ARS')

  const handleMonedaChange = (newMoneda: 'ARS' | 'USD') => {
    setMoneda(newMoneda)
    router.replace(`/sucursales/${params.id}?moneda=${newMoneda}`)
  }

  // Notificaciones para empleados (aprobaciones / rechazos de pagos pendientes)
  const isEmployee = user?.rol === 'empleado'
  const { unseenCount: employeeUnseenCount, clearUnseenCount } = useEmployeeNotifications(
    user?.id,
    sucursalId,
    isEmployee,
  )

  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    razon_social: '',
    cuit: '',
    direccion: '',
    email_correspondencia: '',
  })

  // Estados para totales de cajas
  const [totalesEfectivo, setTotalesEfectivo] = useState({
    total_real: 0,
    total_necesario: 0,
    ultima_actualizacion: null as string | null,
  })
  const [totalesBanco, setTotalesBanco] = useState({
    total_real: 0,
    total_necesario: 0,
    ultima_actualizacion: null as string | null,
  })
  const [loadingTotales, setLoadingTotales] = useState(true)

  // Estados para documentos (múltiples)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loadingDocumentos, setLoadingDocumentos] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docToDelete, setDocToDelete] = useState<{
    id: number
    nombre: string
  } | null>(null)
  const [isDeleteDocDialogOpen, setIsDeleteDocDialogOpen] = useState(false)

  // Estados para cuentas bancarias
  const [cuentaToDeleteId, setCuentaToDeleteId] = useState<number | null>(null)
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([])
  const [loadingCuentas, setLoadingCuentas] = useState(false)
  const [nuevaCuenta, setNuevaCuenta] = useState({
    cbu: '',
    alias: '',
    tipo_cuenta: '',
    banco: '',
  })
  const [isAddingCuenta, setIsAddingCuenta] = useState(false)
  const [isSavingCuenta, setIsSavingCuenta] = useState(false)

  // Funciones para manejo de documentos (múltiples)
  const fetchDocumentos = useCallback(async () => {
    try {
      setLoadingDocumentos(true)
      const response = await apiFetch(API_ENDPOINTS.SUCURSALES.GET_DOCUMENTOS(sucursalId))
      const data = await response.json()
      if (response.ok) setDocumentos(data.data || [])
    } catch {
    } finally {
      setLoadingDocumentos(false)
    }
  }, [sucursalId])

  const fetchCuentasBancarias = useCallback(async () => {
    try {
      setLoadingCuentas(true)
      const res = await apiFetch(API_ENDPOINTS.CUENTAS_BANCARIAS.GET_BY_SUCURSAL(sucursalId))
      const data = await res.json()
      if (res.ok) setCuentasBancarias(data.data || [])
    } catch {
    } finally {
      setLoadingCuentas(false)
    }
  }, [sucursalId])

  // Función para cargar totales de las cajas
  const fetchTotales = useCallback(async () => {
    try {
      setLoadingTotales(true)

      const resEfectivo = await apiFetch(API_ENDPOINTS.MOVIMIENTOS.GET_TOTALES(sucursalId, moneda))
      const dataEfectivo = await resEfectivo.json()
      if (resEfectivo.ok) setTotalesEfectivo(dataEfectivo.data)

      const resBanco = await apiFetch(API_ENDPOINTS.CAJA_BANCO.GET_TOTALES(sucursalId, moneda))
      const dataBanco = await resBanco.json()
      if (resBanco.ok) setTotalesBanco(dataBanco.data)
    } catch {
    } finally {
      setLoadingTotales(false)
    }
  }, [sucursalId, moneda])

  useEffect(() => {
    if (isGuardLoading) return

    // Cargar datos de la sucursal
    const fetchSucursal = async () => {
      try {
        const response = await apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(sucursalId))
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Error al cargar sucursal')
        }

        setSucursal(data.data)
        setFormData({
          nombre: data.data.nombre,
          razon_social: data.data.razon_social,
          cuit: data.data.cuit,
          direccion: data.data.direccion,
          email_correspondencia: data.data.email_correspondencia || '',
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar sucursal'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSucursal()
    fetchDocumentos()
    fetchTotales()
    fetchCuentasBancarias()
  }, [isGuardLoading, sucursalId, fetchDocumentos, fetchTotales, fetchCuentasBancarias])

  useEffect(() => {
    if (canAprobarPendientes) {
      const fetchPendingCount = async () => {
        try {
          const response = await apiFetch(API_ENDPOINTS.PAGOS_PENDIENTES.GET_BY_SUCURSAL(sucursalId))
          if (response.ok) {
            const data = await response.json()
            setPendingCount(data.data.length)
          }
        } catch {
          // Polling failure is non-critical; silently ignore
        }
      }

      fetchPendingCount()
      // Polling every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.rol])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target

    if (name === 'cuit') {
      const digits = value.replace(/\D/g, '')
      if (digits.length <= 11) {
        if (digits.length > 2 && digits.length <= 10) {
          value = `${digits.substring(0, 2)}-${digits.substring(2)}`
        } else if (digits.length > 10) {
          value = `${digits.substring(0, 2)}-${digits.substring(2, 10)}-${digits.substring(10, 11)}`
        } else {
          value = digits
        }
      } else {
        return // No permitir más de 11 dígitos
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const response = await apiFetch(API_ENDPOINTS.SUCURSALES.UPDATE(sucursalId), {
        method: 'PUT',
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar sucursal')
      }

      setSucursal(data.data)
      toast.success('Sucursal actualizada exitosamente')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar sucursal'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUploadDoc = async (tipoDoc: string, fechaVenc: string, file: File) => {
    setIsUploadingDoc(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tipo_documento', tipoDoc)
      formData.append('fecha_vencimiento', fechaVenc)

      const response = await apiFetch(API_ENDPOINTS.SUCURSALES.UPLOAD_DOCUMENTO(sucursalId), {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al subir documento')
      }

      toast.success('Documento subido exitosamente')
      await fetchDocumentos()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al subir documento'
      setError(message)
    } finally {
      setIsUploadingDoc(false)
    }
  }

  const handleAddCuenta = async () => {
    if (!nuevaCuenta.cbu) {
      setError('El CBU es obligatorio')
      return
    }
    if (nuevaCuenta.cbu.length !== 22) {
      setError(`El CBU debe tener exactamente 22 dígitos (actualmente tiene ${nuevaCuenta.cbu.length})`)
      return
    }
    setIsSavingCuenta(true)
    setError('')
    try {
      const response = await apiFetch(API_ENDPOINTS.CUENTAS_BANCARIAS.CREATE(sucursalId), {
        method: 'POST',
        body: JSON.stringify(nuevaCuenta),
      })
      if (!response.ok) throw new Error('Error al crear cuenta')
      toast.success('Cuenta agregada exitosamente')
      setNuevaCuenta({ cbu: '', alias: '', tipo_cuenta: '', banco: '' })
      setIsAddingCuenta(false)
      await fetchCuentasBancarias()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al agregar cuenta'
      setError(message)
    } finally {
      setIsSavingCuenta(false)
    }
  }

  const handleDeleteCuenta = (id: number) => {
    setCuentaToDeleteId(id)
  }

  const handleConfirmDeleteCuenta = async () => {
    if (!cuentaToDeleteId) return
    try {
      const response = await apiFetch(API_ENDPOINTS.CUENTAS_BANCARIAS.DELETE(cuentaToDeleteId), { method: 'DELETE' })
      if (!response.ok) throw new Error('Error al eliminar cuenta')
      toast.success('Cuenta eliminada')
      await fetchCuentasBancarias()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar'
      setError(message)
    } finally {
      setCuentaToDeleteId(null)
    }
  }

  const handleDownloadDoc = (docId: number) => {
    const url = API_ENDPOINTS.SUCURSALES.DOWNLOAD_DOCUMENTO(sucursalId, docId)
    window.open(url, '_blank')
  }

  const openDeleteDocDialog = (docId: number, nombreArchivo: string) => {
    setDocToDelete({ id: docId, nombre: nombreArchivo })
    setIsDeleteDocDialogOpen(true)
  }

  const handleDeleteDoc = async () => {
    if (!docToDelete) return

    setError('')

    try {
      const response = await apiFetch(API_ENDPOINTS.SUCURSALES.DELETE_DOCUMENTO(sucursalId, docToDelete.id), {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar documento')
      }

      toast.success('Documento eliminado exitosamente')
      await fetchDocumentos()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar documento'
      toast.error(message)
    } finally {
      setIsDeleteDocDialogOpen(false)
      setDocToDelete(null)
    }
  }

  const MANDATORY_DOC_TYPES = [
    'Constancia de CUIT',
    'Constancia de IIBB',
    'Certificado MyPyme',
    'Constancia de CBU',
    'Habilitación del local',
  ]

  const missingDocsCount = MANDATORY_DOC_TYPES.filter(tipo => !documentos.find(d => d.tipo_documento === tipo)).length

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expiredDocs = documentos.filter(d => {
    if (!d.fecha_vencimiento) return false
    const venc = new Date(d.fecha_vencimiento)
    venc.setHours(0, 0, 0, 0)
    return venc < today
  })
  const expiredDocsCount = expiredDocs.length

  const totalAlertCount = missingDocsCount + expiredDocsCount

  if (isGuardLoading || isLoading) return <PageLoadingSpinner />

  if (!sucursal) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#1A1A1A] text-xl mb-4">Sucursal no encontrada</p>
          <Button onClick={() => router.push('/sucursales')} className="bg-[#002868] text-white hover:bg-[#003d8f]">
            Volver a Sucursales
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED]">
      {/* Header Ultra-Minimalista */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E0E0E0]/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Botón Volver */}
              <Button
                onClick={() => router.push('/sucursales')}
                variant="outline"
                size="sm"
                className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#666666] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>

              {/* Nombre de la Sucursal */}
              <h1 className="text-2xl font-bold text-[#002868]">{sucursal.nombre}</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Botón Ver Información */}
              <Button
                onClick={() => setIsInfoDialogOpen(true)}
                variant="outline"
                size="sm"
                className="relative border-[#002868] text-[#002868] hover:bg-[#002868] hover:text-white cursor-pointer transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                  />
                </svg>
                Ver Información
                {!loadingDocumentos && totalAlertCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white shadow-md">
                    {totalAlertCount}
                  </span>
                )}
              </Button>

              {/* Botón Reportes */}
              {canVerReportes && (
                <Button
                  onClick={() => router.push(`/sucursales/${params.id}/reportes?moneda=${moneda}`)}
                  size="sm"
                  className="bg-[#002868] text-white hover:bg-[#003d8f] cursor-pointer transition-all shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 mr-2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                  Ver Reportes
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - LAS CAJAS SON LAS ESTRELLAS */}
      <main className="container mx-auto px-6 py-16">
        {/* Título Destacado */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#002868] mb-3">
            {canVerMovimientos ? 'Gestión de Cajas' : 'Gestión de Pagos'}
          </h2>
          <p className="text-lg text-[#666666] mb-6">
            {canVerMovimientos ? 'Selecciona la caja que deseas gestionar' : 'Gestiona tus solicitudes de pago'}
          </p>

          {/* Selector de Moneda */}
          {canVerMovimientos && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handleMonedaChange('ARS')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  moneda === 'ARS'
                    ? 'bg-[#002868] text-white shadow-md'
                    : 'bg-white text-[#666666] border border-[#E0E0E0] hover:border-[#002868] hover:text-[#002868]'
                }`}
              >
                ARS
              </button>
              <button
                onClick={() => handleMonedaChange('USD')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  moneda === 'USD'
                    ? 'bg-[#002868] text-white shadow-md'
                    : 'bg-white text-[#666666] border border-[#E0E0E0] hover:border-[#002868] hover:text-[#002868]'
                }`}
              >
                USD
              </button>
            </div>
          )}
        </div>

        {canVerMovimientos ? (
          /* Las 3 Cajas - MUY GRANDES Y PROTAGONISTAS */
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Caja en Efectivo */}
            <Card
              onClick={() => router.push(`/sucursales/${params.id}/caja-efectivo?moneda=${moneda}`)}
              className="border-2 border-[#E0E0E0] bg-white hover:border-[#002868] hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group overflow-hidden relative"
            >
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#002868]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

              <CardContent className="p-10 text-center relative z-10">
                <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#002868]/10 to-[#002868]/5 flex items-center justify-center group-hover:from-[#002868]/20 group-hover:to-[#002868]/10 transition-all duration-300 group-hover:scale-110">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-14 h-14 text-[#002868]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-[#002868] mb-3 group-hover:text-[#003d8f] transition-colors">
                  Caja en Efectivo
                </h3>

                {/* Total de Saldo Real */}
                {loadingTotales ? (
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-4 h-4 border-2 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
                    <p className="text-sm text-[#666666]">Cargando...</p>
                  </div>
                ) : (
                  <div className="mb-3">
                    <p className="text-xs text-[#666666] font-semibold uppercase tracking-wide mb-1">Saldo Real</p>
                    <p
                      className={`text-2xl font-bold ${
                        totalesEfectivo.total_real >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatMonto(totalesEfectivo.total_real, moneda)}
                    </p>
                    {totalesEfectivo.ultima_actualizacion && (
                      <p className="text-xs text-slate-400 mt-1">
                        Última act:{' '}
                        {new Date(totalesEfectivo.ultima_actualizacion).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                )}

                <p className="text-[#666666] text-base leading-relaxed">
                  Gestiona los movimientos de efectivo de la sucursal
                </p>

                {/* Flecha decorativa */}
                <div className="mt-6 flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#002868]/10 flex items-center justify-center group-hover:bg-[#002868] transition-all">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4 text-[#002868] group-hover:text-white group-hover:translate-x-1 transition-all"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Caja en Banco */}
            <Card
              onClick={() => router.push(`/sucursales/${params.id}/caja-banco?moneda=${moneda}`)}
              className="border-2 border-[#E0E0E0] bg-white hover:border-[#002868] hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group overflow-hidden relative"
            >
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#002868]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

              <CardContent className="p-10 text-center relative z-10">
                <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#002868]/10 to-[#002868]/5 flex items-center justify-center group-hover:from-[#002868]/20 group-hover:to-[#002868]/10 transition-all duration-300 group-hover:scale-110">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-14 h-14 text-[#002868]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-[#002868] mb-3 group-hover:text-[#003d8f] transition-colors">
                  Caja en Banco
                </h3>

                {/* Total de Saldo Real */}
                {loadingTotales ? (
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-4 h-4 border-2 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
                    <p className="text-sm text-[#666666]">Cargando...</p>
                  </div>
                ) : (
                  <div className="mb-3">
                    <p className="text-xs text-[#666666] font-semibold uppercase tracking-wide mb-1">Saldo Real</p>
                    <p
                      className={`text-2xl font-bold ${
                        totalesBanco.total_real >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatMonto(totalesBanco.total_real, moneda)}
                    </p>
                    {totalesBanco.ultima_actualizacion && (
                      <p className="text-xs text-slate-400 mt-1">
                        Última act:{' '}
                        {new Date(totalesBanco.ultima_actualizacion).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                )}

                <p className="text-[#666666] text-base leading-relaxed">Administra cuentas y transacciones bancarias</p>

                {/* Flecha decorativa */}
                <div className="mt-6 flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#002868]/10 flex items-center justify-center group-hover:bg-[#002868] transition-all">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4 text-[#002868] group-hover:text-white group-hover:translate-x-1 transition-all"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pagos Pendientes de Autorización */}
            <Card
              onClick={() => {
                clearUnseenCount()
                router.push(`/sucursales/${params.id}/pagos-pendientes?moneda=${moneda}`)
              }}
              className="border-2 border-[#E0E0E0] bg-white hover:border-[#002868] hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group overflow-hidden relative"
            >
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#002868]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

              <CardContent className="p-10 text-center relative z-10">
                <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#002868]/10 to-[#002868]/5 flex items-center justify-center group-hover:from-[#002868]/20 group-hover:to-[#002868]/10 transition-all duration-300 group-hover:scale-110">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-14 h-14 text-[#002868]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-[#002868] mb-3 group-hover:text-[#003d8f] transition-colors relative inline-block">
                  Pagos Pendientes
                  {canAprobarPendientes && pendingCount > 0 && (
                    <span className="absolute -top-3 -right-6 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white ring-2 ring-white shadow-lg animate-bounce">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                  {/* Badge empleado: nuevas aprobaciones/rechazos */}
                  {isEmployee && employeeUnseenCount > 0 && (
                    <span className="absolute -top-3 -right-6 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white ring-2 ring-white shadow-lg animate-bounce">
                      {employeeUnseenCount > 9 ? '9+' : employeeUnseenCount}
                    </span>
                  )}
                </h3>
                <p className="text-[#666666] text-base leading-relaxed">Gestiona pagos pendientes de autorización</p>

                {/* Flecha decorativa */}
                <div className="mt-6 flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#002868]/10 flex items-center justify-center group-hover:bg-[#002868] transition-all">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4 text-[#002868] group-hover:text-white group-hover:translate-x-1 transition-all"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Solo Pagos Pendientes para no-superadmin */
          <div className="max-w-md mx-auto">
            <Card
              onClick={() => {
                clearUnseenCount()
                router.push(`/sucursales/${params.id}/pagos-pendientes?moneda=${moneda}`)
              }}
              className="border-2 border-[#E0E0E0] bg-white hover:border-[#002868] hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group overflow-hidden relative"
            >
              {/* Decoración de fondo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#002868]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

              <CardContent className="p-10 text-center relative z-10">
                <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#002868]/10 to-[#002868]/5 flex items-center justify-center group-hover:from-[#002868]/20 group-hover:to-[#002868]/10 transition-all duration-300 group-hover:scale-110">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-14 h-14 text-[#002868]"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-[#002868] mb-3 group-hover:text-[#003d8f] transition-colors relative inline-block">
                  Pagos Pendientes
                  {/* Badge empleado: nuevas aprobaciones/rechazos */}
                  {isEmployee && employeeUnseenCount > 0 && (
                    <span className="absolute -top-3 -right-6 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white ring-2 ring-white shadow-lg animate-bounce">
                      {employeeUnseenCount > 9 ? '9+' : employeeUnseenCount}
                    </span>
                  )}
                </h3>
                <p className="text-[#666666] text-base leading-relaxed">Gestiona tus solicitudes de pago</p>

                {/* Flecha decorativa */}
                <div className="mt-6 flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#002868]/10 flex items-center justify-center group-hover:bg-[#002868] transition-all">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4 text-[#002868] group-hover:text-white group-hover:translate-x-1 transition-all"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Modal de Información de la Sucursal */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#002868]">Información de la Sucursal</DialogTitle>
            <DialogDescription className="text-[#666666]">Consulta y edita los datos de la sucursal</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {/* Banner de sucursal inactiva */}
            {sucursal && !sucursal.activo && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800 font-medium">
                  Sucursal <strong>inactiva</strong> — solo visualización, no se pueden editar datos.
                </p>
              </div>
            )}

            {/* Notificación de documentos faltantes */}
            {!loadingDocumentos && missingDocsCount > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700 font-semibold">
                    {missingDocsCount === 1
                      ? 'Falta 1 documento obligatorio por subir'
                      : `Faltan ${missingDocsCount} documentos obligatorios por subir`}
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Revisá la sección Documentación y completá los archivos pendientes.
                  </p>
                </div>
              </div>
            )}

            {/* Notificación de documentos vencidos */}
            {!loadingDocumentos && expiredDocsCount > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-orange-700 font-semibold">
                    {expiredDocsCount === 1
                      ? `1 documento vencido: ${expiredDocs[0].tipo_documento}`
                      : `${expiredDocsCount} documentos vencidos`}
                  </p>
                  <p className="text-xs text-orange-600 mt-0.5">
                    {expiredDocsCount > 1
                      ? expiredDocs.map(d => d.tipo_documento).join(', ')
                      : 'Actualizá el documento para mantener la documentación al día.'}
                  </p>
                </div>
              </div>
            )}

            <ErrorBanner error={error} />

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-[#002868] font-semibold text-sm">
                    Nombre de la Sucursal *
                  </Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    readOnly={!sucursal?.activo || !canGestionarSucursales}
                    className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razon_social" className="text-[#002868] font-semibold text-sm">
                    Razón Social *
                  </Label>
                  <Input
                    id="razon_social"
                    name="razon_social"
                    value={formData.razon_social}
                    onChange={handleInputChange}
                    required
                    readOnly={!sucursal?.activo || !canGestionarSucursales}
                    className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuit" className="text-[#002868] font-semibold text-sm">
                    CUIT *
                  </Label>
                  <Input
                    id="cuit"
                    name="cuit"
                    value={formData.cuit}
                    onChange={handleInputChange}
                    required
                    readOnly={!sucursal?.activo || !canGestionarSucursales}
                    className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion" className="text-[#002868] font-semibold text-sm">
                    Dirección *
                  </Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    required
                    readOnly={!sucursal?.activo || !canGestionarSucursales}
                    className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_correspondencia" className="text-[#002868] font-semibold text-sm">
                    <Mail className="w-4 h-4 inline mr-1" /> Email de Correspondencia
                  </Label>
                  <Input
                    id="email_correspondencia"
                    name="email_correspondencia"
                    type="email"
                    value={formData.email_correspondencia}
                    onChange={handleInputChange}
                    placeholder="correo@ejemplo.com"
                    readOnly={!sucursal?.activo || !canGestionarSucursales}
                    className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                  />
                </div>
              </div>

              {/* Sección de Documentación (Múltiples Archivos) */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-[#002868] mb-4">
                  <Paperclip className="w-5 h-5 inline mr-1" /> Documentación
                </h3>

                {loadingDocumentos ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {MANDATORY_DOC_TYPES.map(tipoDoc => {
                      const docSubido = documentos.find(d => d.tipo_documento === tipoDoc)
                      const isExpired = docSubido?.fecha_vencimiento
                        ? (() => {
                            const v = new Date(docSubido.fecha_vencimiento)
                            v.setHours(0, 0, 0, 0)
                            return v < today
                          })()
                        : false

                      return (
                        <div
                          key={tipoDoc}
                          className={`p-4 rounded-lg border ${
                            isExpired ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-[#002868] text-sm">{tipoDoc}</h4>
                            {docSubido ? (
                              isExpired ? (
                                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold border border-orange-300">
                                  ⚠ Vencido
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                  Subido
                                </span>
                              )
                            ) : (
                              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                                Pendiente
                              </span>
                            )}
                          </div>

                          {docSubido ? (
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                  className={`w-5 h-5 flex-shrink-0 ${
                                    isExpired ? 'text-orange-500' : 'text-green-600'
                                  }`}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <div className="min-w-0">
                                  <p className="text-sm truncate" title={docSubido.nombre_archivo}>
                                    {docSubido.nombre_archivo}
                                  </p>
                                  <p className={`text-xs font-medium ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                                    Vence:{' '}
                                    {docSubido.fecha_vencimiento
                                      ? new Date(docSubido.fecha_vencimiento).toLocaleDateString('es-AR', {
                                          timeZone: 'UTC',
                                        })
                                      : 'N/A'}
                                    {isExpired && ' — VENCIDO'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadDoc(docSubido.id)}
                                  className="h-8 px-2 border-[#002868]/30 hover:bg-[#002868] hover:text-white transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                {sucursal?.activo && canGestionarSucursales && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDeleteDocDialog(docSubido.id, docSubido.nombre_archivo)}
                                    className="h-8 px-2 border-red-200 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : sucursal?.activo && canGestionarSucursales ? (
                            <div className="flex flex-col gap-2 mt-2">
                              <div className="flex gap-2 items-center">
                                <Label className="text-xs text-gray-500 min-w-[120px]">Fecha Vencimiento:</Label>
                                <Input
                                  type="date"
                                  ref={el => {
                                    dateInputRefs.current[tipoDoc] = el
                                  }}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  type="file"
                                  ref={el => {
                                    fileInputRefs.current[tipoDoc] = el
                                  }}
                                  accept=".pdf,.jpg,.jpeg"
                                  className="h-8 text-sm flex-1"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={isUploadingDoc}
                                  className="h-8 bg-[#002868]"
                                  onClick={() => {
                                    const fileInput = fileInputRefs.current[tipoDoc]
                                    const dateInput = dateInputRefs.current[tipoDoc]
                                    if (!fileInput?.files?.[0] || !dateInput?.value) {
                                      toast.error('Selecciona archivo y fecha de vencimiento')
                                      return
                                    }
                                    handleUploadDoc(tipoDoc, dateInput.value, fileInput.files[0])
                                  }}
                                >
                                  Subir
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 mt-2 italic">No hay documento subido</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Sección de Cuentas Bancarias */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#002868]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 inline mr-1 -mt-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
                      />
                    </svg>
                    Datos Bancarios ({cuentasBancarias.length})
                  </h3>
                  {sucursal?.activo && canGestionarSucursales && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddingCuenta(!isAddingCuenta)}
                      className="text-[#002868] border-[#002868]"
                    >
                      {isAddingCuenta ? 'Cancelar' : '+ Agregar Cuenta'}
                    </Button>
                  )}
                </div>

                {isAddingCuenta && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Banco</Label>
                        <Input
                          value={nuevaCuenta.banco}
                          onChange={e =>
                            setNuevaCuenta({
                              ...nuevaCuenta,
                              banco: e.target.value,
                            })
                          }
                          className="h-8 text-sm"
                          placeholder="Ej: Galicia"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo de Cuenta</Label>
                        <Input
                          value={nuevaCuenta.tipo_cuenta}
                          onChange={e =>
                            setNuevaCuenta({
                              ...nuevaCuenta,
                              tipo_cuenta: e.target.value,
                            })
                          }
                          className="h-8 text-sm"
                          placeholder="CA $ / CC"
                        />
                        <Input
                          value={nuevaCuenta.tipo_cuenta}
                          onChange={e =>
                            setNuevaCuenta({
                              ...nuevaCuenta,
                              tipo_cuenta: e.target.value,
                            })
                          }
                          className="h-8 text-sm"
                          placeholder="CA $ / CC"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">CBU / CVU *</Label>
                        <Input
                          value={nuevaCuenta.cbu}
                          onChange={e =>
                            setNuevaCuenta({
                              ...nuevaCuenta,
                              cbu: e.target.value,
                            })
                          }
                          className="h-8 text-sm"
                          placeholder="22 dígitos"
                        />
                        <Input
                          value={nuevaCuenta.cbu}
                          onChange={e => {
                            const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 22)
                            setNuevaCuenta({ ...nuevaCuenta, cbu: onlyDigits })
                          }}
                          maxLength={22}
                          inputMode="numeric"
                          className={`h-8 text-sm ${
                            nuevaCuenta.cbu.length > 0 && nuevaCuenta.cbu.length !== 22
                              ? 'border-red-400 focus-visible:ring-red-400'
                              : nuevaCuenta.cbu.length === 22
                                ? 'border-green-400 focus-visible:ring-green-400'
                                : ''
                          }`}
                          placeholder="22 dígitos"
                        />
                        <p
                          className={`text-xs text-right ${
                            nuevaCuenta.cbu.length === 22
                              ? 'text-green-600'
                              : nuevaCuenta.cbu.length > 0
                                ? 'text-red-500'
                                : 'text-gray-400'
                          }`}
                        >
                          {nuevaCuenta.cbu.length}/22
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Alias</Label>
                        <Input
                          value={nuevaCuenta.alias}
                          onChange={e =>
                            setNuevaCuenta({
                              ...nuevaCuenta,
                              alias: e.target.value,
                            })
                          }
                          className="h-8 text-sm"
                          placeholder="JUAN.PEREZ"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCuenta}
                      disabled={nuevaCuenta.cbu.length !== 22 || isSavingCuenta}
                      className="w-full h-8 bg-[#002868] text-white"
                    >
                      Guardar Cuenta
                    </Button>
                  </div>
                )}

                {loadingCuentas ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cuentasBancarias.map(cuenta => (
                      <div
                        key={cuenta.id}
                        className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm flex justify-between items-center group hover:border-[#002868]"
                      >
                        <div>
                          <p className="font-semibold text-sm text-[#1A1A1A]">
                            {cuenta.banco} - {cuenta.tipo_cuenta}
                          </p>
                          <p className="text-xs text-gray-600">CBU: {cuenta.cbu}</p>
                          <p className="text-xs text-gray-500">Alias: {cuenta.alias || '-'}</p>
                        </div>
                        {sucursal?.activo && canGestionarSucursales && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCuenta(cuenta.id)}
                            className="text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {cuentasBancarias.length === 0 && !isAddingCuenta && (
                      <p className="text-sm text-gray-500 text-center py-2">No hay cuentas bancarias registradas</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving || !sucursal?.activo || !canGestionarSucursales}
                  className="flex-1 bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                      <span>Guardando...</span>
                    </div>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInfoDialogOpen(false)}
                  className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#1A1A1A] cursor-pointer"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación para Eliminar Cuenta Bancaria */}
      <Dialog
        open={!!cuentaToDeleteId}
        onOpenChange={open => {
          if (!open) setCuentaToDeleteId(null)
        }}
      >
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1A1A1A]">Eliminar Cuenta Bancaria</DialogTitle>
            <DialogDescription className="text-[#666666]">
              ¿Estás seguro de eliminar esta cuenta bancaria? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setCuentaToDeleteId(null)}
              className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] transition-colors"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteCuenta}
              className="bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación para Eliminar Documento */}
      <Dialog open={isDeleteDocDialogOpen} onOpenChange={setIsDeleteDocDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1A1A1A]">Confirmar Eliminación</DialogTitle>
            <DialogDescription className="text-[#666666]">
              ¿Estás seguro de que deseas eliminar el archivo{' '}
              <span className="font-semibold text-[#1A1A1A]">"{docToDelete?.nombre}"</span>? Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDocDialogOpen(false)}
              className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] transition-colors"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDoc}
              className="bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
