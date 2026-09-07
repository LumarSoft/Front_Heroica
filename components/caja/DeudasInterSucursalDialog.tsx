'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, CircleDollarSign, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { formatFecha, formatMonto } from '@/lib/formatters'
import { agruparDeudas, type DeudaInterSucursal } from '@/lib/deudas'

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
  const [deudas, setDeudas] = useState<DeudaInterSucursal[]>([])
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const grupos = useMemo(() => agruparDeudas(deudas), [deudas])

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
              Deudas entre sucursales
            </DialogTitle>
            <DialogDescription>
              Resumen neto por sucursal. Abrí una fila para ver conceptos y movimientos.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-7 py-4 border-b border-dashed flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase">Desde</Label>
            <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase">Hasta</Label>
            <Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="h-9" />
          </div>
          <Button onClick={fetchDeudas} disabled={isLoading} className="h-9 bg-[#002868] hover:bg-[#003d8f]">
            {isLoading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-7 space-y-3">
          {error && <p className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}
          {!isLoading && grupos.length === 0 && (
            <div className="h-32 flex flex-col items-center justify-center text-[#8A8F9C] gap-2">
              <Landmark className="w-8 h-8" />
              <span className="text-sm">No hay deudas entre sucursales en este período</span>
            </div>
          )}
          {grupos.map(grupo => {
            const key = `${grupo.sucursal}-${grupo.moneda}`
            const abierta = abiertas.has(key)
            return (
              <div key={key} className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                <Button
                  variant="ghost"
                  onClick={() => toggleGrupo(key)}
                  className="w-full h-auto p-4 rounded-none flex justify-between hover:bg-[#F8F9FA]"
                >
                  <span className="flex items-center gap-2 font-bold text-[#002868]">
                    {abierta ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    {grupo.sucursal}
                    <span className="text-xs font-medium text-[#8A8F9C]">{grupo.moneda}</span>
                  </span>
                  <span className="flex gap-5 text-xs">
                    <span className="text-emerald-700">
                      A cobrar <b>{formatMonto(grupo.aCobrar, grupo.moneda)}</b>
                    </span>
                    <span className="text-rose-700">
                      A pagar <b>{formatMonto(grupo.aPagar, grupo.moneda)}</b>
                    </span>
                    <span className={grupo.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      Neto <b>{formatMonto(Math.abs(grupo.balance), grupo.moneda)}</b>
                    </span>
                  </span>
                </Button>
                {abierta && (
                  <div className="border-t bg-[#FAFBFC] overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs uppercase text-[#5A6070]">
                          <th className="text-left p-3">Fecha</th>
                          <th className="text-left p-3">Concepto</th>
                          <th className="text-left p-3">Situación</th>
                          <th className="text-right p-3">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.movimientos.map(deuda => (
                          <tr key={deuda.id} className="border-t border-[#ECEEF1]">
                            <td className="p-3 whitespace-nowrap">{formatFecha(deuda.fecha)}</td>
                            <td className="p-3">
                              <b>{deuda.concepto}</b>
                              {deuda.comentarios && (
                                <span className="block text-xs text-[#777]">{deuda.comentarios}</span>
                              )}
                            </td>
                            <td className="p-3">{deuda.tipo === 'ingreso' ? 'Nos debe' : 'Le debemos'}</td>
                            <td className="p-3 text-right font-bold">
                              {formatMonto(Math.abs(deuda.monto), grupo.moneda)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
