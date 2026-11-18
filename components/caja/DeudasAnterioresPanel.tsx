'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Landmark } from 'lucide-react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { downloadBlob } from '@/lib/downloadBlob'
import {
  agruparDeudas,
  filtrarDeudas,
  hayDeudasConTerceros,
  sucursalesRelacionadas,
  FILTRO_SUCURSAL_TERCEROS,
  FILTRO_SUCURSAL_TODAS,
  type DeudaInterSucursal,
  type FiltroTipoDeuda,
} from '@/lib/deudas'
import { DeudasFiltros } from './DeudasFiltros'
import { DeudaGrupoItem } from './DeudaGrupoItem'

interface Props {
  /** La pestaña está visible: recién ahí se cargan las deudas */
  activo: boolean
  sucursalId: number
}

/**
 * Pestaña "Otras deudas" de Préstamos y deudas: lo marcado con "Marcar como deuda" (terceros) y
 * las deudas entre sucursales del sistema anterior que todavía no pasaron a préstamos.
 */
export function DeudasAnterioresPanel({ activo, sucursalId }: Props) {
  const hoy = new Date().toISOString().split('T')[0]
  // Sin "desde": son deudas pendientes y pueden ser viejas (el panel anterior mostraba solo 30 días)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState(hoy)
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoDeuda>('todos')
  const [filtroSucursal, setFiltroSucursal] = useState(FILTRO_SUCURSAL_TODAS)
  const [deudas, setDeudas] = useState<DeudaInterSucursal[]>([])
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isExportando, setIsExportando] = useState(false)
  const [error, setError] = useState('')

  const sucursales = useMemo(() => sucursalesRelacionadas(deudas), [deudas])
  const incluirTerceros = useMemo(() => hayDeudasConTerceros(deudas), [deudas])

  // Si al cambiar el período la sucursal elegida ya no tiene movimientos, se vuelve a "todas".
  const sucursalEfectiva =
    filtroSucursal === FILTRO_SUCURSAL_TODAS ||
    (filtroSucursal === FILTRO_SUCURSAL_TERCEROS && incluirTerceros) ||
    sucursales.includes(filtroSucursal)
      ? filtroSucursal
      : FILTRO_SUCURSAL_TODAS

  const grupos = useMemo(
    () => agruparDeudas(filtrarDeudas(deudas, { tipo: filtroTipo, sucursal: sucursalEfectiva })),
    [deudas, filtroTipo, sucursalEfectiva],
  )

  const fetchDeudas = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await apiFetch(API_ENDPOINTS.MOVIMIENTOS.GET_DEUDAS(sucursalId, fechaInicio, fechaFin))
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudieron cargar las deudas')
      setDeudas(data.data ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las deudas')
    } finally {
      setIsLoading(false)
    }
  }, [fechaFin, fechaInicio, sucursalId])

  // Exporta lo mismo que se ve: período, tipo y sucursal relacionada.
  const exportarExcel = useCallback(async () => {
    setIsExportando(true)
    try {
      const url = API_ENDPOINTS.MOVIMIENTOS.EXPORT_DEUDAS_SUCURSAL_EXCEL(sucursalId, {
        fechaInicio,
        fechaFin,
        tipo: filtroTipo,
        sucursal: sucursalEfectiva,
      })
      const res = await apiFetch(url)
      if (!res.ok) throw new Error('Error en la respuesta del servidor')
      const blob = await res.blob()
      downloadBlob(blob, `Otras deudas ${fechaInicio ? `${fechaInicio} a ` : 'hasta '}${fechaFin}.xlsx`)
    } catch {
      toast.error('Error al exportar el Excel.')
    } finally {
      setIsExportando(false)
    }
  }, [fechaFin, fechaInicio, filtroTipo, sucursalEfectiva, sucursalId])

  useEffect(() => {
    if (activo) void fetchDeudas()
  }, [activo, fetchDeudas])

  const toggleGrupo = (key: string) => {
    setAbiertas(actual => {
      const siguiente = new Set(actual)
      if (siguiente.has(key)) siguiente.delete(key)
      else siguiente.add(key)
      return siguiente
    })
  }

  return (
    <div className="-mx-6 border-t border-[#F0F0F0]">
      <DeudasFiltros
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        onFechaInicioChange={setFechaInicio}
        onFechaFinChange={setFechaFin}
        tipo={filtroTipo}
        onTipoChange={setFiltroTipo}
        sucursal={sucursalEfectiva}
        onSucursalChange={setFiltroSucursal}
        sucursales={sucursales}
        incluirTerceros={incluirTerceros}
        isLoading={isLoading}
        onActualizar={fetchDeudas}
        puedeExportar={grupos.length > 0}
        isExportando={isExportando}
        onExportar={exportarExcel}
      />
      <div className="space-y-3 px-6 pt-4">
        {error && <p className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}
        {!isLoading && grupos.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center text-[#8A8F9C] gap-2">
            <Landmark className="w-8 h-8" />
            <span className="text-sm">No hay deudas pendientes con estos filtros</span>
          </div>
        )}
        {grupos.map(grupo => {
          const key = `${grupo.esTercero ? 'ter' : 'suc'}-${grupo.sucursal}-${grupo.moneda}`
          return (
            <DeudaGrupoItem
              key={key}
              grupo={grupo}
              tipo={filtroTipo}
              abierta={abiertas.has(key)}
              onToggle={() => toggleGrupo(key)}
            />
          )
        })}
      </div>
    </div>
  )
}
