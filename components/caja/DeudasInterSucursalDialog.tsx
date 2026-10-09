'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleDollarSign, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
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

interface DeudasInterSucursalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sucursalId: number
}

export function DeudasInterSucursalDialog({ open, onOpenChange, sucursalId }: DeudasInterSucursalDialogProps) {
  const hoy = new Date().toISOString().split('T')[0]
  const haceTreintaDias = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const [fechaInicio, setFechaInicio] = useState(haceTreintaDias)
  const [fechaFin, setFechaFin] = useState(hoy)
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoDeuda>('todos')
  const [filtroSucursal, setFiltroSucursal] = useState(FILTRO_SUCURSAL_TODAS)
  const [deudas, setDeudas] = useState<DeudaInterSucursal[]>([])
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
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

  useEffect(() => {
    if (open) void fetchDeudas()
  }, [open, fetchDeudas])

  const toggleGrupo = (key: string) => {
    setAbiertas(actual => {
      const siguiente = new Set(actual)
      if (siguiente.has(key)) siguiente.delete(key)
      else siguiente.add(key)
      return siguiente
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[960px] max-h-[90vh] bg-white rounded-2xl p-0 gap-0 overflow-hidden flex flex-col">
        <div className="px-7 pt-7 pb-5 border-b border-[#F0F0F0]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1A1A1A] flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <CircleDollarSign className="w-5 h-5 text-orange-600" />
              </span>
              Deudas y préstamos
            </DialogTitle>
            <DialogDescription>
              Deudas pendientes con otras sucursales o terceros, y préstamos otorgados a otras sucursales. Abrí una fila
              para ver el detalle.
            </DialogDescription>
          </DialogHeader>
        </div>
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
        />
        <div className="flex-1 overflow-y-auto p-7 space-y-3">
          {error && <p className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}
          {!isLoading && grupos.length === 0 && (
            <div className="h-32 flex flex-col items-center justify-center text-[#8A8F9C] gap-2">
              <Landmark className="w-8 h-8" />
              <span className="text-sm">No hay deudas ni préstamos pendientes con estos filtros</span>
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
        <div className="px-7 py-4 border-t bg-[#FAFBFC] flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
