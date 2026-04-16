'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { formatFecha, formatMonto } from '@/lib/formatters'

function extraerSucursalRelacionada(descripcion?: string): string {
  if (!descripcion) return '-'

  const patrones = [/hacia (.+)$/i, /recibida de (.+)$/i, /\) a (.+)$/i, /desde (.+)$/i]

  for (const patron of patrones) {
    const match = descripcion.match(patron)
    if (match) return match[1].trim()
  }

  return '-'
}

interface DeudaRow {
  id: number
  sucursal_id: number
  sucursal_nombre: string
  fecha: string
  concepto: string
  monto: number
  descripcion?: string
  tipo: 'ingreso' | 'egreso'
  tipo_movimiento: string
  estado: string
  moneda?: 'ARS' | 'USD'
}

interface DeudasInterSucursalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sucursalId: number
}

export function DeudasInterSucursalDialog({ open, onOpenChange, sucursalId }: DeudasInterSucursalDialogProps) {
  const hoy = new Date().toISOString().split('T')[0]
  const haceTreintaDias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [fechaInicio, setFechaInicio] = useState(haceTreintaDias)
  const [fechaFin, setFechaFin] = useState(hoy)
  const [deudas, setDeudas] = useState<DeudaRow[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchDeudas = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = API_ENDPOINTS.MOVIMIENTOS.GET_DEUDAS(sucursalId, fechaInicio, fechaFin)
      const res = await apiFetch(url)
      const data = await res.json()
      if (data.success) {
        setDeudas(data.data ?? [])
      }
    } catch (err) {
      console.error('Error al cargar deudas:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fechaInicio, fechaFin])

  useEffect(() => {
    if (open) fetchDeudas()
  }, [open, fetchDeudas])

  const totalAFavor = deudas.filter(d => d.tipo === 'ingreso').reduce((sum, d) => sum + Math.abs(d.monto), 0)

  const totalEnContra = deudas.filter(d => d.tipo === 'egreso').reduce((sum, d) => sum + Math.abs(d.monto), 0)

  const balance = totalAFavor - totalEnContra

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0] flex-shrink-0">
          <DialogHeader className="p-0 border-0">
            <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-orange-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              Deudas entre Sucursales
            </DialogTitle>
            <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
              Histórico de movimientos internos con deuda entre sucursales
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Filtros */}
        <div className="px-8 py-4 border-b border-dashed border-[#E8E8E8] flex-shrink-0">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">Desde</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="h-9 rounded-lg border-[#E0E0E0] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">Hasta</Label>
              <Input
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                className="h-9 rounded-lg border-[#E0E0E0] text-sm"
              />
            </div>
            <Button
              onClick={fetchDeudas}
              disabled={isLoading}
              className="h-9 px-5 bg-[#002868] hover:bg-[#003d8f] text-white text-sm font-medium cursor-pointer"
            >
              {isLoading ? 'Cargando...' : 'Filtrar'}
            </Button>
          </div>
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-[#8A8F9C] text-sm">Cargando deudas...</div>
          ) : !deudas?.length ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-[#8A8F9C]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
              <span className="text-sm">No hay deudas en el período seleccionado</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0F0F0]">
                  <th className="text-left py-2 px-3 text-xs font-bold text-[#5A6070] uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-[#5A6070] uppercase tracking-wider">
                    Sucursal relacionada
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-[#5A6070] uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-[#5A6070] uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-bold text-[#5A6070] uppercase tracking-wider">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody>
                {deudas.map(deuda => (
                  <tr key={deuda.id} className="border-b border-[#F8F8F8] hover:bg-[#FAFBFC] transition-colors">
                    <td className="py-2.5 px-3 text-[#5A6070] whitespace-nowrap">{formatFecha(deuda.fecha)}</td>
                    <td className="py-2.5 px-3 font-medium text-[#1A1A1A] whitespace-nowrap">
                      {extraerSucursalRelacionada(deuda.descripcion)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="block text-[#1A1A1A] font-medium">{deuda.concepto}</span>
                      {deuda.descripcion && (
                        <span className="block text-xs text-[#8A8F9C] mt-0.5">{deuda.descripcion}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold ${
                          deuda.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {deuda.tipo === 'ingreso' ? 'A cobrar' : 'A pagar'}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${
                        deuda.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatMonto(Math.abs(deuda.monto), deuda.moneda ?? 'ARS')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer con totales */}
        <div className="px-8 py-4 border-t border-[#F0F0F0] bg-[#FAFBFC] flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {!isLoading && deudas?.length > 0 ? (
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">A cobrar:</span>
                  <span className="text-sm font-bold text-emerald-600">{formatMonto(totalAFavor)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">A pagar:</span>
                  <span className="text-sm font-bold text-rose-600">{formatMonto(totalEnContra)}</span>
                </div>
                <div className="w-px h-5 bg-[#E0E0E0]" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">Balance:</span>
                  <span className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatMonto(balance)}
                  </span>
                </div>
              </div>
            ) : (
              <div />
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] font-medium hover:bg-[#F0F0F0] hover:text-[#1A1A1A] cursor-pointer"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
