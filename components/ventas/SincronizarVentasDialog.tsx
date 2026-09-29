'use client'

import { useMemo, useState } from 'react'
import { CalendarRange, CloudDownload, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { labelClasses, VENTAS_SELECT_CLASS } from '@/lib/dialog-styles'
import { toDateOnly } from '@/lib/downloadBlob'
import { formatRangoFechas, pluralDias } from '@/lib/formatters'
import { sincronizacionVentasSchema } from '@/lib/schemas'
import { cantidadDias, diasYaImportados, rangosRapidos, tiempoEstimado } from '@/lib/ventas-rangos'
import { cn } from '@/lib/utils'
import type { CoberturaVentas, EstadoIntegracionVentas } from '@/lib/types'

interface SincronizarVentasDialogProps {
  integracion: EstadoIntegracionVentas | null
  cobertura: CoberturaVentas | null
  /** Rango precargado (ej. al llegar desde "Traer esos días" del panel). */
  rangoInicial?: { desde: string; hasta: string } | null
  isSaving: boolean
  onClose: () => void
  onConfirm: (desde: string, hasta: string) => Promise<boolean>
}

export function SincronizarVentasDialog({
  integracion,
  cobertura,
  rangoInicial,
  isSaving,
  onClose,
  onConfirm,
}: SincronizarVentasDialogProps) {
  const rangos = useMemo(() => rangosRapidos(cobertura), [cobertura])
  const inicial = rangoInicial ?? rangos[0] ?? null
  const [seleccion, setSeleccion] = useState<string>(() =>
    rangoInicial ? 'personalizado' : (rangos[0]?.id ?? 'personalizado'),
  )
  const [desde, setDesde] = useState(() => inicial?.desde ?? toDateOnly(new Date()))
  const [hasta, setHasta] = useState(() => inicial?.hasta ?? toDateOnly(new Date()))
  const [error, setError] = useState('')

  const dias = cantidadDias(desde, hasta)
  const yaImportados = diasYaImportados(cobertura, desde, hasta)
  const nuevos = dias - yaImportados

  const elegirRango = (id: string) => {
    setSeleccion(id)
    setError('')
    const rango = rangos.find(r => r.id === id)
    if (rango) {
      setDesde(rango.desde)
      setHasta(rango.hasta)
    }
  }

  const confirmar = async () => {
    const validacion = sincronizacionVentasSchema.safeParse({ desde, hasta, hoy: toDateOnly(new Date()) })
    if (!validacion.success) {
      setError(validacion.error.issues[0]?.message ?? 'Rango inválido')
      return
    }
    setError('')
    if (await onConfirm(desde, hasta)) onClose()
  }

  return (
    <Dialog open={integracion !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] bg-white border-[#E0E0E0] shadow-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-[#F0F0F0] bg-[#F8F9FA]/50">
          <DialogTitle className="text-xl font-bold text-[#002868] flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#002868]/10 flex items-center justify-center">
              <CloudDownload className="w-5 h-5 text-[#002868]" />
            </span>
            Traer ventas de {integracion?.nombre}
          </DialogTitle>
          <DialogDescription className="text-[#666666] mt-2">Elegí qué días querés importar.</DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            {[...rangos, { id: 'personalizado', label: 'Elegir fechas' }].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => elegirRango(r.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-sm font-medium transition-colors cursor-pointer',
                  seleccion === r.id
                    ? 'bg-[#002868] border-[#002868] text-white'
                    : 'bg-white border-[#D8E3F8] text-[#002868] hover:border-[#002868]',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className={labelClasses}>Desde</span>
              <input
                type="date"
                value={desde}
                max={hasta || undefined}
                onChange={e => {
                  setSeleccion('personalizado')
                  setDesde(e.target.value)
                }}
                className={VENTAS_SELECT_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClasses}>Hasta</span>
              <input
                type="date"
                value={hasta}
                min={desde || undefined}
                max={toDateOnly(new Date())}
                onChange={e => {
                  setSeleccion('personalizado')
                  setHasta(e.target.value)
                }}
                className={VENTAS_SELECT_CLASS}
              />
            </label>
          </div>

          {dias > 0 && (
            <div className="rounded-xl border border-[#D8E3F8] bg-[#F8FAFF] p-4 space-y-1.5">
              <p className="flex items-center gap-2 text-sm text-[#1E293B]">
                <CalendarRange className="w-4 h-4 text-[#002868]" />
                Se van a traer las ventas <strong>{formatRangoFechas(desde, hasta)}</strong> ({pluralDias(dias)}).
              </p>
              <p className="pl-6 text-sm text-[#5A6B8C]">
                {yaImportados === 0
                  ? 'Todos son días nuevos.'
                  : nuevos === 0
                    ? `Todos ya estaban importados: se van a actualizar con lo último de Bistrosoft (no se duplica nada).`
                    : `${pluralDias(nuevos)} ${nuevos === 1 ? 'nuevo' : 'nuevos'} · ${pluralDias(yaImportados)} ya ${yaImportados === 1 ? 'importado se actualiza' : 'importados se actualizan'} (no se duplica nada).`}
              </p>
              <p className="flex items-start gap-2 text-xs text-[#5A6B8C]">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                Tarda {tiempoEstimado(dias)} (Bistrosoft admite pocas consultas por minuto). Avanza mientras esta
                pantalla esté abierta; si la cerrás, sigue la próxima vez que alguien abra Ventas.
              </p>
            </div>
          )}
          {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-[#F0F0F0] bg-[#F8F9FA]/50">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="cursor-pointer">
            Cancelar
          </Button>
          <Button
            onClick={confirmar}
            disabled={isSaving || dias === 0}
            className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white flex items-center gap-2"
          >
            {isSaving ? <LoadingSpinner className="w-4 h-4 border-2" /> : <CloudDownload className="w-4 h-4" />}
            Traer {dias > 0 ? pluralDias(dias) : 'ventas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
