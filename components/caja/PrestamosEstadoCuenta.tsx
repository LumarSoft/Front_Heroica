'use client'
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { API_ENDPOINTS } from '@/lib/config'
import { formatFecha, formatMonto } from '@/lib/formatters'
import type { EstadoPrestamo, Prestamo } from '@/lib/types'
import type { PrestamosCajaState } from '@/hooks/use-prestamos-caja'
import { PrestamoEstadoBadge, estadoVista } from './PrestamoEstadoBadge'

interface Props {
  prestamos: PrestamosCajaState
  sucursalId: number
  moneda: 'ARS' | 'USD'
  userId: number | undefined
  puedeAnular: boolean
  onCambio: () => void
}

interface Grupo {
  contraparte: string
  aCobrar: number
  aPagar: number
  /** Los que se muestran según el filtro; los totales igual se calculan sobre todos */
  items: Prestamo[]
}

/** Préstamos ya cerrados: pagados, rechazados o anulados. Se ocultan por defecto para que no se acumulen. */
const ESTADOS_SALDADOS: EstadoPrestamo[] = ['cancelado', 'rechazado', 'anulado']
const esSaldado = (p: Prestamo) => ESTADOS_SALDADOS.includes(p.estado)

/** Préstamos de la sucursal agrupados por la otra sucursal: lo que le deben, lo que debe y el neto */
export function PrestamosEstadoCuenta({ prestamos, sucursalId, moneda, userId, puedeAnular, onCambio }: Props) {
  const { estadoCuenta, isLoadingCuenta, accion, enCurso } = prestamos
  const [expandido, setExpandido] = useState<number | null>(null)
  const [mostrarSaldados, setMostrarSaldados] = useState(false)

  const cantidadSaldados = useMemo(() => estadoCuenta.filter(esSaldado).length, [estadoCuenta])

  const grupos = useMemo(() => {
    const mapa = new Map<string, Grupo>()
    for (const p of estadoCuenta) {
      const presto = p.sucursal_presta_id === sucursalId
      const contraparte = presto ? p.sucursal_recibe_nombre : p.sucursal_presta_nombre
      const g = mapa.get(contraparte) ?? { contraparte, aCobrar: 0, aPagar: 0, items: [] }
      if (presto) g.aCobrar += p.pendiente
      else g.aPagar += p.pendiente
      if (mostrarSaldados || !esSaldado(p)) g.items.push(p)
      mapa.set(contraparte, g)
    }
    return [...mapa.values()]
      .filter(g => g.items.length > 0)
      .sort((a, b) => b.aCobrar + b.aPagar - (a.aCobrar + a.aPagar))
  }, [estadoCuenta, sucursalId, mostrarSaldados])

  const ejecutar = async (clave: string, url: string) => {
    if (await accion(clave, url)) onCambio()
  }

  if (isLoadingCuenta && estadoCuenta.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    )
  }
  if (estadoCuenta.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#E0E0E0] bg-[#FAFBFC] p-6 text-center text-sm text-[#5A6070]">
        Esta sucursal no tiene préstamos en {moneda}.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {cantidadSaldados > 0 && (
        <label className="flex w-fit items-center gap-2 text-sm text-[#5A6070] cursor-pointer select-none">
          <Checkbox checked={mostrarSaldados} onCheckedChange={v => setMostrarSaldados(v === true)} />
          Mostrar saldados ({cantidadSaldados})
        </label>
      )}
      {grupos.length === 0 && (
        <p className="rounded-xl border border-dashed border-[#E0E0E0] bg-[#FAFBFC] p-6 text-center text-sm text-[#5A6070]">
          No hay préstamos pendientes en {moneda}.
        </p>
      )}
      {grupos.map(g => (
        <div key={g.contraparte} className="rounded-xl border border-[#E0E0E0] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F0F0] px-4 py-3">
            <p className="font-semibold text-[#1A1A1A]">{g.contraparte}</p>
            <div className="flex gap-4 text-xs">
              <span className="text-emerald-700">Te debe: {formatMonto(g.aCobrar, moneda)}</span>
              <span className="text-rose-700">Le debés: {formatMonto(g.aPagar, moneda)}</span>
              <span className="font-bold text-[#002868]">Neto: {formatMonto(g.aCobrar - g.aPagar, moneda)}</span>
            </div>
          </div>
          <div className="divide-y divide-[#F0F0F0]">
            {g.items.map(p => {
              const presto = p.sucursal_presta_id === sucursalId
              const abierto = expandido === p.id
              const devoluciones = p.devoluciones ?? []
              // Un saldo inicial no se anula (no tiene movimientos): se cancela devolviéndolo
              const anulable =
                p.estado === 'vigente' && !p.es_apertura && p.devuelto === 0 && p.por_confirmar === 0 && puedeAnular
              const cancelable = p.estado === 'solicitado' && p.user_solicita_id === userId
              return (
                <div key={p.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandido(abierto ? null : p.id)}
                      className="flex flex-1 min-w-[220px] items-center gap-2 text-left cursor-pointer"
                    >
                      {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="text-sm">
                        <span className={presto ? 'text-emerald-700' : 'text-rose-700'}>
                          {presto ? 'Prestaste' : 'Te prestaron'}
                        </span>{' '}
                        <span className="font-semibold">{formatMonto(p.monto, moneda)}</span>
                        <span className="text-[#8A8F9C]"> · {formatFecha(p.fecha ?? p.fecha_solicitud)}</span>
                        {p.es_apertura && <span className="text-[#8A8F9C]"> · saldo inicial</span>}
                      </span>
                    </button>
                    <span className="text-xs text-[#5A6070]">
                      Devuelto {formatMonto(p.devuelto, moneda)} · Queda {formatMonto(p.pendiente, moneda)}
                    </span>
                    <PrestamoEstadoBadge estado={estadoVista(p)} />
                    {cancelable && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={enCurso === `c-${p.id}`}
                        onClick={() => ejecutar(`c-${p.id}`, API_ENDPOINTS.PRESTAMOS.CANCELAR(p.id))}
                      >
                        Cancelar pedido
                      </Button>
                    )}
                    {anulable && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600"
                        disabled={enCurso === `a-${p.id}`}
                        onClick={() => ejecutar(`a-${p.id}`, API_ENDPOINTS.PRESTAMOS.ANULAR(p.id))}
                      >
                        Anular
                      </Button>
                    )}
                  </div>
                  {abierto && (
                    <div className="mt-2 ml-6 space-y-1 text-xs text-[#5A6070]">
                      {p.descripcion && <p>{p.descripcion}</p>}
                      {p.motivo_rechazo && <p className="text-rose-700">Motivo: {p.motivo_rechazo}</p>}
                      {devoluciones.length === 0 && <p>Sin devoluciones.</p>}
                      {devoluciones.map(d => (
                        <div key={d.id} className="flex flex-wrap items-center gap-2">
                          <span>
                            Devolución de {formatMonto(d.monto, moneda)} · {formatFecha(d.fecha ?? d.created_at)}
                          </span>
                          <PrestamoEstadoBadge estado={d.estado} />
                          {d.motivo_rechazo && <span className="text-rose-700">{d.motivo_rechazo}</span>}
                          {d.estado === 'confirmada' && puedeAnular && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-rose-600"
                              disabled={enCurso === `ad-${d.id}`}
                              onClick={() => ejecutar(`ad-${d.id}`, API_ENDPOINTS.PRESTAMOS.ANULAR_DEVOLUCION(d.id))}
                            >
                              Anular
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
