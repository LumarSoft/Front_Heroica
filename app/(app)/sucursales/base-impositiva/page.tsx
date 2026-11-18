'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Landmark } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { downloadBlob, toDateOnly } from '@/lib/downloadBlob'
import { generarExcelBaseImpositiva } from '@/lib/base-impositiva'
import { useAuthStore } from '@/store/authStore'
import { useBaseImpositiva } from '@/hooks/use-base-impositiva'
import { ErrorBanner } from '@/components/ui/error-banner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { BaseImpositivaFiltros } from '@/components/base-impositiva/BaseImpositivaFiltros'
import { BaseImpositivaTotales } from '@/components/base-impositiva/BaseImpositivaTotales'
import { BaseImpositivaTabla } from '@/components/base-impositiva/BaseImpositivaTabla'
import { MarcarPagadoDialog } from '@/components/base-impositiva/MarcarPagadoDialog'
import type { ApiRespuesta, MovimientoImpositivo, SelectOption, Sucursal } from '@/lib/types'

/**
 * Base impositiva: SUSS, Anticipo de Ganancias, DReI, ETUR, Sindicato, Ingresos Brutos y
 * Convenio Multilateral de todas las sucursales (o una), por período, con lo pendiente y lo pagado.
 */
export default function BaseImpositivaPage() {
  const bi = useBaseImpositiva()
  const puedeMarcarPagado = useAuthStore(state => state.canAprobarMovimientos())
  const [sucursales, setSucursales] = useState<SelectOption[]>([])
  const [aConfirmar, setAConfirmar] = useState<MovimientoImpositivo | null>(null)
  const [isExportando, setIsExportando] = useState(false)

  useEffect(() => {
    apiFetch(API_ENDPOINTS.SUCURSALES.GET_ALL)
      .then(r => r.json())
      .then((d: ApiRespuesta<Sucursal[]>) =>
        setSucursales((d.data ?? []).filter(s => s.activo).map(s => ({ id: s.id, nombre: s.nombre }))),
      )
      .catch(() => setSucursales([]))
  }, [])

  const exportar = async () => {
    setIsExportando(true)
    try {
      const blob = await generarExcelBaseImpositiva(bi.items)
      downloadBlob(blob, `Base impositiva ${toDateOnly(new Date())}.xlsx`)
    } catch {
      toast.error('Error al exportar el Excel.')
    } finally {
      setIsExportando(false)
    }
  }

  const confirmar = () => {
    if (!aConfirmar) return
    const m = aConfirmar
    setAConfirmar(null)
    void bi.marcarPagado(m)
  }

  let contenido: React.ReactNode = null
  if (bi.isLoading && bi.items.length === 0) {
    contenido = (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  } else if (bi.items.length === 0) {
    if (!bi.error) {
      contenido = (
        <p className="py-12 text-center text-sm text-[#8A8F9C]">No hay impuestos cargados con estos filtros.</p>
      )
    }
  } else {
    contenido = (
      <>
        <div className="grid gap-4 lg:grid-cols-2">
          <BaseImpositivaTotales titulo="Por sucursal" totales={bi.totalesSucursal} />
          <BaseImpositivaTotales titulo="Por período" totales={bi.totalesPeriodo} />
        </div>
        <BaseImpositivaTabla
          items={bi.items}
          puedeMarcarPagado={puedeMarcarPagado}
          marcandoId={bi.marcandoId}
          onMarcarPagado={setAConfirmar}
        />
      </>
    )
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="space-y-1">
        <Link href="/sucursales" className="inline-flex items-center gap-1 text-sm text-[#5A6070] hover:text-[#002868]">
          <ArrowLeft className="h-4 w-4" />
          Sucursales
        </Link>
        <h1 className="text-xl sm:text-3xl font-bold text-[#002868] flex items-center gap-3">
          <Landmark className="h-7 w-7" />
          Base impositiva
        </h1>
        <p className="text-sm text-[#666666]">
          Impuestos por sucursal y período. Pendiente: en Saldo necesario o en pagos pendientes. Pagado: en Saldo real.
          Un egreso se marca con su impuesto al cargarlo o desde &quot;Ver detalles&quot;.
        </p>
      </div>

      <BaseImpositivaFiltros
        filtros={bi.filtros}
        onChange={bi.setFiltros}
        sucursales={sucursales}
        isLoading={bi.isLoading}
        onActualizar={() => void bi.cargar()}
        puedeExportar={bi.items.length > 0}
        isExportando={isExportando}
        onExportar={() => void exportar()}
      />

      {bi.error && <ErrorBanner error={bi.error} />}

      {contenido}

      <MarcarPagadoDialog movimiento={aConfirmar} onConfirm={confirmar} onCancel={() => setAConfirmar(null)} />
    </div>
  )
}
