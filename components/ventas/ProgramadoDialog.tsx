'use client'

import { useEffect, useMemo, useState } from 'react'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MultiSelect } from '@/components/ui/multi-select'
import { labelClasses, VENTAS_SELECT_CLASS } from '@/lib/dialog-styles'
import type { DatosProgramado } from '@/hooks/use-ventas-programados'
import type { ReporteGuardadoVentas, ReporteProgramadoVentas } from '@/lib/types'

export const DIAS_SEMANA_ENVIO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface ProgramadoDialogProps {
  open: boolean
  programado: ReporteProgramadoVentas | null
  sucursales: Array<{ id: number; nombre: string }>
  reportes: ReporteGuardadoVentas[]
  onClose: () => void
  onGuardar: (datos: DatosProgramado) => Promise<boolean>
}

const VACIO: DatosProgramado = {
  nombre: 'Resumen diario de ventas',
  frecuencia: 'diaria',
  diaSemana: 1,
  hora: 8,
  destinatarios: '',
  sucursalIds: [],
  reporteGuardadoId: null,
  activo: true,
}

export function ProgramadoDialog({
  open,
  programado,
  sucursales,
  reportes,
  onClose,
  onGuardar,
}: ProgramadoDialogProps) {
  const [datos, setDatos] = useState<DatosProgramado>(VACIO)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!open) return
    setDatos(
      programado
        ? {
            nombre: programado.nombre,
            frecuencia: programado.frecuencia,
            diaSemana: programado.diaSemana ?? 1,
            hora: programado.hora,
            destinatarios: programado.destinatarios.join(', '),
            sucursalIds: programado.sucursalIds ?? [],
            reporteGuardadoId: programado.reporteGuardadoId,
            activo: programado.activo,
          }
        : VACIO,
    )
  }, [open, programado])

  const set = <K extends keyof DatosProgramado>(k: K, v: DatosProgramado[K]) => setDatos(d => ({ ...d, [k]: v }))
  const opcionesSucursales = useMemo(
    () => sucursales.map(s => ({ value: String(s.id), label: s.nombre })),
    [sucursales],
  )
  const periodo =
    datos.frecuencia === 'diaria'
      ? 'el día anterior'
      : datos.frecuencia === 'semanal'
        ? 'la semana anterior (lunes a domingo)'
        : 'el mes anterior'

  const guardar = async () => {
    setGuardando(true)
    try {
      if (await onGuardar(datos)) onClose()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-[560px] bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#002868] flex items-center gap-2">
            <Mail className="w-5 h-5" /> {programado ? 'Editar envío' : 'Nuevo envío por mail'}
          </DialogTitle>
          <DialogDescription>
            Manda un resumen de {periodo}: facturación, tickets, sucursales, top productos y medios de pago, comparado
            con el período anterior. Si elegís un reporte guardado, va incluido y adjunto en Excel.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Nombre</span>
            <input
              value={datos.nombre}
              maxLength={120}
              onChange={e => set('nombre', e.target.value)}
              className={`${VENTAS_SELECT_CLASS} w-full`}
            />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className={labelClasses}>Frecuencia</span>
              <select
                value={datos.frecuencia}
                onChange={e => set('frecuencia', e.target.value as DatosProgramado['frecuencia'])}
                className={VENTAS_SELECT_CLASS}
              >
                <option value="diaria">Diaria</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual (día 1)</option>
              </select>
            </label>
            {datos.frecuencia === 'semanal' ? (
              <label className="flex flex-col gap-1">
                <span className={labelClasses}>Día</span>
                <select
                  value={datos.diaSemana ?? 1}
                  onChange={e => set('diaSemana', Number(e.target.value))}
                  className={VENTAS_SELECT_CLASS}
                >
                  {DIAS_SEMANA_ENVIO.map((d, i) => (
                    <option key={d} value={i + 1}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div />
            )}
            <label className="flex flex-col gap-1">
              <span className={labelClasses}>Desde las</span>
              <select
                value={datos.hora}
                onChange={e => set('hora', Number(e.target.value))}
                className={VENTAS_SELECT_CLASS}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Destinatarios</span>
            <textarea
              value={datos.destinatarios}
              onChange={e => set('destinatarios', e.target.value)}
              placeholder="gerencia@heroica.com, encargado@heroica.com"
              rows={2}
              className="rounded-xl border border-[#D8E3F8] px-3 py-2 text-sm text-[#002868] focus:outline-none focus:ring-2 focus:ring-[#002868]/20"
            />
            <span className="text-[11px] text-[#9AAACC]">Separados por coma. Hasta 30.</span>
          </label>
          <div className="flex flex-col gap-1">
            <span className={labelClasses}>Sucursales</span>
            <MultiSelect
              options={opcionesSucursales}
              selected={datos.sucursalIds.map(String)}
              onChange={v => set('sucursalIds', v.map(Number))}
              placeholder="Todas las sucursales"
            />
          </div>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Reporte adjunto (opcional)</span>
            <select
              value={datos.reporteGuardadoId ?? ''}
              onChange={e => set('reporteGuardadoId', e.target.value ? Number(e.target.value) : null)}
              className={VENTAS_SELECT_CLASS}
            >
              <option value="">Solo el resumen</option>
              {reportes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-[#1E293B] cursor-pointer">
            <input type="checkbox" checked={datos.activo} onChange={e => set('activo', e.target.checked)} />
            Activo
          </label>
          <p className="text-[11px] text-[#9AAACC]">
            Se envía una sola vez por período, a partir de la hora indicada (hora de Argentina), cuando corre la
            sincronización de ventas.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={guardando} className="cursor-pointer">
            Cancelar
          </Button>
          <Button
            onClick={guardar}
            disabled={guardando || !datos.nombre.trim() || !datos.destinatarios.trim()}
            className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
