'use client'

import { AlertTriangle, ArrowRight, CheckCircle2, Merge, XCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { AltaExcelBase, BajaExcelBase, PreviewCatalogoExcel } from '@/lib/types'

interface Props<A extends AltaExcelBase, B extends BajaExcelBase> {
  preview: PreviewCatalogoExcel<A, B>
  nombreArchivo?: string
  detalleAlta: (a: A) => string
  detalleBaja: (b: B) => string
  /** Texto del check que confirma las bajas, según la cantidad */
  textoBajas: (cantidad: number) => string
  aceptaBajas: boolean
  onAceptaBajasChange: (acepta: boolean) => void
}

const vacio = (v: string) => v || '—'
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** Vista previa de una importación de catálogo: contadores, errores, altas, cambios, unificaciones y bajas */
export function CatalogoExcelPreview<A extends AltaExcelBase, B extends BajaExcelBase>({
  preview,
  nombreArchivo,
  detalleAlta,
  detalleBaja,
  textoBajas,
  aceptaBajas,
  onAceptaBajasChange,
}: Props<A, B>) {
  const r = preview.resumen
  const hayErrores = r.errores > 0
  const hayCambios = r.altas + r.modificaciones + r.bajas + r.unificaciones > 0

  return (
    <>
      <p className="text-xs text-[#8A8F9C]">
        {nombreArchivo} · {r.filas} filas
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        <Contador label="Altas" valor={r.altas} className="text-emerald-700 bg-emerald-50 border-emerald-200" />
        <Contador label="Cambios" valor={r.modificaciones} className="text-[#002868] bg-[#EEF2FF] border-[#C7D2FE]" />
        <Contador label="Unificar" valor={r.unificaciones} className="text-violet-700 bg-violet-50 border-violet-200" />
        <Contador label="Bajas" valor={r.bajas} className="text-rose-700 bg-rose-50 border-rose-200" />
        <Contador label="Sin cambios" valor={r.sin_cambios} className="text-[#5A6070] bg-gray-50 border-gray-200" />
        <Contador
          label="Errores"
          valor={r.errores}
          className={
            r.errores > 0 ? 'text-rose-700 bg-rose-50 border-rose-300' : 'text-[#5A6070] bg-gray-50 border-gray-200'
          }
        />
      </div>

      {hayErrores && (
        <Bloque
          titulo={`Errores (${r.errores}) — corregí el Excel y volvé a subirlo. No se aplicó nada.`}
          icono={<XCircle className="h-4 w-4 text-rose-600" />}
          className="border-rose-300 bg-rose-50"
        >
          {preview.errores.map((e, i) => (
            <li key={i} className="text-sm text-rose-900">
              {e.fila ? <span className="font-semibold">Fila {e.fila}: </span> : null}
              {e.mensaje}
            </li>
          ))}
        </Bloque>
      )}

      {preview.advertencias.length > 0 && (
        <Bloque
          titulo={`Advertencias (${preview.advertencias.length})`}
          icono={<AlertTriangle className="h-4 w-4 text-amber-600" />}
          className="border-amber-300 bg-amber-50"
        >
          {preview.advertencias.map((a, i) => (
            <li key={i} className="text-sm text-amber-900">
              {a.mensaje}
            </li>
          ))}
        </Bloque>
      )}

      {!hayErrores && !hayCambios && (
        <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm text-emerald-900">El archivo coincide con el sistema: no hay nada para aplicar.</p>
        </div>
      )}

      {preview.altas.length > 0 && (
        <Bloque titulo={`Altas (${preview.altas.length})`} className="border-emerald-200">
          {preview.altas.map(a => (
            <li key={a.fila} className="text-sm text-[#1A1A1A]">
              <span className="font-semibold">{a.nombre}</span>
              <span className="text-[#8A8F9C]"> · {detalleAlta(a)}</span>
            </li>
          ))}
        </Bloque>
      )}

      {preview.modificaciones.length > 0 && (
        <Bloque titulo={`Cambios (${preview.modificaciones.length})`} className="border-[#C7D2FE]">
          {preview.modificaciones.map(m => (
            <li key={m.id} className="text-sm text-[#1A1A1A]">
              <span className="font-semibold">{m.nombre}</span>
              <ul className="mt-0.5 space-y-0.5 pl-3">
                {m.cambios.map(c => (
                  <li key={c.campo} className="flex flex-wrap items-center gap-1 text-xs text-[#5A6070]">
                    <span className="font-medium">{c.campo}:</span>
                    <span className="line-through decoration-rose-400">{vacio(c.antes)}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-[#002868] font-medium">{vacio(c.despues)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </Bloque>
      )}

      {preview.unificaciones.length > 0 && (
        <Bloque
          titulo={`Unificar (${preview.unificaciones.length}) — sus movimientos pasan al que queda y el repetido se elimina`}
          icono={<Merge className="h-4 w-4 text-violet-600" />}
          className="border-violet-200"
        >
          {preview.unificaciones.map(u => (
            <li key={u.id} className="flex flex-wrap items-center gap-1 text-sm text-[#1A1A1A]">
              <span className="line-through decoration-violet-400">{u.nombre}</span>
              <ArrowRight className="h-3 w-3 text-violet-600" />
              <span className="font-semibold">{u.destino_nombre}</span>
              <span className="text-[#8A8F9C]">
                · ID {u.id} → {u.destino_id} · {plural(u.movimientos, 'movimiento', 'movimientos')}
              </span>
            </li>
          ))}
        </Bloque>
      )}

      {preview.bajas.length > 0 && (
        <Bloque
          titulo={`Bajas (${preview.bajas.length}) — no están en el archivo y se van a eliminar`}
          className="border-rose-200"
        >
          {preview.bajas.map(b => (
            <li key={b.id} className="text-sm text-[#1A1A1A]">
              <span className="font-semibold">{b.nombre}</span>
              <span className="text-[#8A8F9C]"> · {detalleBaja(b)}</span>
              {b.movimientos > 0 && (
                <span className="ml-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
                  {plural(b.movimientos, 'movimiento', 'movimientos')}
                </span>
              )}
            </li>
          ))}
        </Bloque>
      )}

      {!hayErrores && r.bajas > 0 && (
        <label className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/50 p-3 cursor-pointer">
          <Checkbox checked={aceptaBajas} onCheckedChange={v => onAceptaBajasChange(v === true)} className="mt-0.5" />
          <span className="text-sm text-rose-900">{textoBajas(r.bajas)}</span>
        </label>
      )}
    </>
  )
}

function Contador({ label, valor, className }: { label: string; valor: number; className: string }) {
  return (
    <div className={cn('rounded-lg border px-3 py-2', className)}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-xl font-bold">{valor}</p>
    </div>
  )
}

function Bloque({
  titulo,
  icono,
  className,
  children,
}: {
  titulo: string
  icono?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
        {icono}
        {titulo}
      </p>
      <ul className="max-h-56 overflow-y-auto space-y-1.5 pr-1">{children}</ul>
    </div>
  )
}
