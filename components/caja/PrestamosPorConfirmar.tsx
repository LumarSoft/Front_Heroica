'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { API_ENDPOINTS } from '@/lib/config'
import { formatFechaHora, formatMonto } from '@/lib/formatters'
import type { CajaPrestamo, SelectOption } from '@/lib/types'
import type { PrestamosCajaState } from '@/hooks/use-prestamos-caja'
import { PrestamoResolverForm, type ResolucionAceptar } from './PrestamoResolverForm'

interface Props {
  prestamos: PrestamosCajaState
  cajaTipo: CajaPrestamo
  moneda: 'ARS' | 'USD'
  bancos: SelectOption[]
  puedeResolver: boolean
  onResuelto: () => void
}

type Abierto = { clave: string; modo: 'aceptar' | 'rechazar' } | null

/** Pedidos de préstamo y devoluciones que esperan que esta sucursal los acepte, en esta caja */
export function PrestamosPorConfirmar({ prestamos, cajaTipo, moneda, bancos, puedeResolver, onResuelto }: Props) {
  const { porConfirmar, accion, enCurso } = prestamos
  const [abierto, setAbierto] = useState<Abierto>(null)

  const resolver = async (clave: string, url: string, body: object) => {
    if (await accion(clave, url, body)) {
      setAbierto(null)
      onResuelto()
    }
  }
  const aceptarBody = (r: ResolucionAceptar, campoBanco: string) => ({
    fecha: r.fecha,
    ...(cajaTipo === 'banco' ? { [campoBanco]: Number(r.bancoId) } : {}),
  })

  if (porConfirmar.pedidos.length === 0 && porConfirmar.devoluciones.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#E0E0E0] bg-[#FAFBFC] p-6 text-center text-sm text-[#5A6070]">
        No hay préstamos ni devoluciones esperando confirmación en esta caja.
      </p>
    )
  }

  const acciones = (clave: string) =>
    puedeResolver &&
    abierto?.clave !== clave && (
      <div className="flex gap-2">
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setAbierto({ clave, modo: 'aceptar' })}
        >
          Aceptar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-rose-600"
          onClick={() => setAbierto({ clave, modo: 'rechazar' })}
        >
          Rechazar
        </Button>
      </div>
    )

  return (
    <div className="space-y-3">
      {porConfirmar.pedidos.map(p => {
        const clave = `p-${p.id}`
        return (
          <div key={clave} className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Pedido de préstamo</p>
                <p className="text-sm text-[#1A1A1A]">
                  <span className="font-semibold">{p.sucursal_recibe_nombre}</span> te pide{' '}
                  <span className="font-bold">{formatMonto(p.monto, moneda)}</span>
                </p>
                <p className="text-xs text-[#5A6070]">
                  Sale de: {p.caja_salida === 'banco' ? (p.banco_salida_nombre ?? 'Banco') : 'Efectivo'} · Pedido el{' '}
                  {formatFechaHora(p.fecha_solicitud)} por {p.usuario_solicita_nombre ?? '—'}
                </p>
                {p.descripcion && <p className="text-xs text-[#5A6070]">{p.descripcion}</p>}
              </div>
              {acciones(clave)}
            </div>
            {abierto?.clave === clave && (
              <PrestamoResolverForm
                modo={abierto.modo}
                caja={cajaTipo}
                bancoInicial={p.banco_salida_id}
                bancos={bancos}
                isSaving={enCurso === clave}
                onCancelar={() => setAbierto(null)}
                onAceptar={r =>
                  resolver(clave, API_ENDPOINTS.PRESTAMOS.ACEPTAR(p.id), aceptarBody(r, 'banco_salida_id'))
                }
                onRechazar={motivo => resolver(clave, API_ENDPOINTS.PRESTAMOS.RECHAZAR(p.id), { motivo })}
              />
            )}
          </div>
        )
      })}

      {porConfirmar.devoluciones.map(d => {
        const clave = `d-${d.id}`
        return (
          <div key={clave} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Devolución</p>
                <p className="text-sm text-[#1A1A1A]">
                  <span className="font-semibold">{d.sucursal_recibe_nombre}</span> te devuelve{' '}
                  <span className="font-bold">{formatMonto(d.monto, moneda)}</span> de un préstamo de{' '}
                  {formatMonto(d.prestamo_monto, moneda)}
                </p>
                <p className="text-xs text-[#5A6070]">
                  Entra en: {d.caja_entrada === 'banco' ? (d.banco_entrada_nombre ?? 'Banco') : 'Efectivo'} · Cargada
                  por {d.usuario_solicita_nombre ?? '—'}
                </p>
                {d.prestamo_descripcion && <p className="text-xs text-[#5A6070]">{d.prestamo_descripcion}</p>}
              </div>
              {acciones(clave)}
            </div>
            {abierto?.clave === clave && (
              <PrestamoResolverForm
                modo={abierto.modo}
                caja={cajaTipo}
                bancoInicial={d.banco_entrada_id}
                bancos={bancos}
                isSaving={enCurso === clave}
                onCancelar={() => setAbierto(null)}
                onAceptar={r =>
                  resolver(
                    clave,
                    API_ENDPOINTS.PRESTAMOS.CONFIRMAR_DEVOLUCION(d.id),
                    aceptarBody(r, 'banco_entrada_id'),
                  )
                }
                onRechazar={motivo => resolver(clave, API_ENDPOINTS.PRESTAMOS.RECHAZAR_DEVOLUCION(d.id), { motivo })}
              />
            )}
          </div>
        )
      })}

      {!puedeResolver && (
        <p className="text-xs text-[#8A8F9C]">Para aceptar o rechazar necesitás el permiso de aprobar movimientos.</p>
      )}
    </div>
  )
}
