'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Columns3, FlaskConical, KeyRound, Save, Settings2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ui/error-banner'
import { ContentLoadingSpinner, LoadingSpinner } from '@/components/ui/loading-spinner'
import { useHioposConfig } from '@/hooks/use-hiopos-config'
import { labelClasses, VENTAS_SELECT_CLASS } from '@/lib/dialog-styles'
import { toDateOnly } from '@/lib/downloadBlob'
import { formatFechaHora, formatMonto } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { VentasChartCard } from './VentasChartCard'

interface HioposConfigCardProps {
  editable: boolean
}

function ayer(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toDateOnly(d)
}

/**
 * Configuración de la integración: dashboard de exportación de HiOffice, prueba de
 * conexión de punta a punta, mapeo de columnas y modo incremental.
 */
export function HioposConfigCard({ editable }: HioposConfigCardProps) {
  const { config, isLoading, error, isGuardando, isDiagnosticando, diagnostico, guardar, diagnosticar } =
    useHioposConfig(true)
  const [exportationId, setExportationId] = useState('')
  const [fechaPrueba, setFechaPrueba] = useState(ayer)
  const [mapeo, setMapeo] = useState<Record<string, string>>({})
  const [diasPorTramo, setDiasPorTramo] = useState(5)

  useEffect(() => {
    if (!config) return
    setExportationId(config.exportationIdOrigen === 'pantalla' ? (config.exportationId ?? '') : '')
    setMapeo(config.mapeo)
    setDiasPorTramo(config.diasPorTramo)
  }, [config])

  const columnas = useMemo(() => config?.columnasDetectadas ?? [], [config])
  const ejemplos = useMemo(() => new Map(columnas.map(c => [c.nombre, c.ejemplos])), [columnas])
  const filtrosFecha = useMemo(
    () =>
      (config?.filtrosDashboard ?? []).filter(
        f => f.type.toLowerCase() === 'datetime' && f.arithmeticOperator.toUpperCase() === 'BETWEEN',
      ),
    [config],
  )
  const mapeoCambiado = useMemo(() => JSON.stringify(mapeo) !== JSON.stringify(config?.mapeo ?? {}), [mapeo, config])

  if (isLoading) return <ContentLoadingSpinner />
  if (!config) return <ErrorBanner error={error} />

  return (
    <VentasChartCard
      title="Configuración de Hiopos"
      subtitle="Qué dashboard de HiOffice se usa, cómo se leen sus columnas y la prueba de conexión."
      acciones={<Settings2 className="w-5 h-5 text-[#7A93BB]" />}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#EEF2FB] bg-[#F8FAFF] p-4 space-y-2">
            <p className={`${labelClasses} flex items-center gap-1.5`}>
              <KeyRound className="w-3.5 h-3.5" /> Credenciales
            </p>
            {config.credenciales ? (
              <p className="text-sm text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Cargadas en el servidor (HIOPOS_EMAIL / HIOPOS_PASSWORD).
              </p>
            ) : (
              <p className="text-sm text-rose-700">
                Faltan HIOPOS_EMAIL y HIOPOS_PASSWORD en las variables de entorno del servidor. Por seguridad no se
                cargan desde esta pantalla.
              </p>
            )}
            {config.verificadoAt && (
              <p className="text-xs text-[#7A93BB]">Última prueba: {formatFechaHora(config.verificadoAt)}</p>
            )}
            {config.ultimoError && <p className="text-xs text-rose-700">Último error: {config.ultimoError}</p>}
          </div>

          <div className="rounded-xl border border-[#EEF2FB] bg-[#F8FAFF] p-4 space-y-2">
            <label className="flex flex-col gap-1">
              <span className={labelClasses}>Dashboard de exportación (GUID)</span>
              <input
                value={exportationId}
                onChange={e => setExportationId(e.target.value)}
                placeholder={
                  config.exportationIdOrigen === 'entorno'
                    ? `${config.exportationId} (del servidor)`
                    : 'xxxxxxxx-xxxx-…'
                }
                disabled={!editable}
                className={`${VENTAS_SELECT_CLASS} font-mono text-xs w-full`}
              />
            </label>
            <p className="text-xs text-[#7A93BB]">
              Lo da quien armó el dashboard en HiOffice. Vacío = usar HIOPOS_EXPORTATION_ID del servidor.
            </p>
            {editable && (
              <Button
                size="sm"
                onClick={() => guardar({ exportationId: exportationId.trim() || null })}
                disabled={isGuardando}
                className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Guardar dashboard
              </Button>
            )}
          </div>
        </div>

        {editable && (
          <div className="rounded-xl border border-[#D8E3F8] p-4 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <p className="text-sm font-semibold text-[#002868] flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" /> Probar conexión
                </p>
                <p className="text-xs text-[#7A93BB]">
                  Login, filtros del dashboard y export de un día con ventas. No importa nada.
                </p>
              </div>
              <input
                type="date"
                value={fechaPrueba}
                max={toDateOnly(new Date())}
                onChange={e => setFechaPrueba(e.target.value)}
                className={VENTAS_SELECT_CLASS}
              />
              <Button
                onClick={() => diagnosticar(fechaPrueba)}
                disabled={isDiagnosticando || !config.credenciales}
                variant="outline"
                className="cursor-pointer border-[#002868] text-[#002868] flex items-center gap-2"
              >
                {isDiagnosticando ? (
                  <LoadingSpinner className="w-4 h-4 border-2" />
                ) : (
                  <FlaskConical className="w-4 h-4" />
                )}
                Probar
              </Button>
            </div>

            {diagnostico && (
              <div className="space-y-3">
                <ul className="space-y-1.5">
                  {diagnostico.pasos.map(p => (
                    <li key={p.paso} className="flex gap-2 text-sm">
                      {p.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span>
                        <strong className="text-[#1E293B]">{p.paso}:</strong>{' '}
                        <span className="text-[#5A6B8C] break-words">{p.detalle}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {diagnostico.ejemplos.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-[#EEF2FB]">
                    <table className="w-full min-w-[640px] text-xs">
                      <thead className="bg-[#F8FAFF] text-[#7A93BB] uppercase tracking-wider">
                        <tr>
                          {['Hora', 'Local', 'Documento', 'Tipo', 'Producto / pago', 'Cant.', 'Importe'].map(h => (
                            <th key={h} className="px-3 py-2 text-left">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF2FB]">
                        {diagnostico.ejemplos.map((l, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5">{l.fechaHora?.slice(11, 16) ?? '—'}</td>
                            <td className="px-3 py-1.5">{l.localNombre ?? '—'}</td>
                            <td className="px-3 py-1.5 font-mono">{l.documento ?? l.transaccionId}</td>
                            <td className="px-3 py-1.5">{l.tipoLinea}</td>
                            <td className="px-3 py-1.5">{l.productoNombre ?? l.medioPago ?? '—'}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{l.cantidad}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{formatMonto(l.importe)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[#002868] flex items-center gap-2">
                <Columns3 className="w-4 h-4" /> Columnas del dashboard
              </p>
              <p className="text-xs text-[#7A93BB]">
                Se detectan solas por nombre. Si el dashboard cambia o alguna quedó mal, corregila acá.
              </p>
            </div>
            {editable && columnas.length > 0 && (
              <Button
                size="sm"
                onClick={() => guardar({ mapeo }, 'Columnas guardadas')}
                disabled={isGuardando || !mapeoCambiado}
                className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Guardar columnas
              </Button>
            )}
          </div>
          {config.faltantesMapeo.length > 0 && columnas.length > 0 && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {config.faltantesMapeo.join('. ')}.
            </p>
          )}
          {columnas.length === 0 ? (
            <p className="text-sm text-[#7A93BB]">
              Todavía no se vio ningún export. Usá “Probar conexión” con un día con ventas para ver las columnas.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {config.campos.map(c => {
                const elegida = mapeo[c.campo] ?? ''
                return (
                  <label key={c.campo} className="flex flex-col gap-1 rounded-xl border border-[#EEF2FB] p-3">
                    <span className="text-sm font-semibold text-[#1E293B]">
                      {c.etiqueta}
                      {c.requerido && <span className="text-rose-600"> *</span>}
                    </span>
                    <span className="text-xs text-[#7A93BB]">{c.ayuda}</span>
                    <select
                      value={elegida}
                      disabled={!editable}
                      onChange={e =>
                        setMapeo(prev => {
                          const nuevo = { ...prev }
                          if (e.target.value) nuevo[c.campo] = e.target.value
                          else delete nuevo[c.campo]
                          return nuevo
                        })
                      }
                      className={cn(VENTAS_SELECT_CLASS, 'w-full mt-1', !elegida && 'text-[#9AAACC]')}
                    >
                      <option value="">— No viene en el export —</option>
                      {columnas.map(col => (
                        <option key={col.nombre} value={col.nombre}>
                          {col.nombre}
                        </option>
                      ))}
                    </select>
                    {elegida && (ejemplos.get(elegida)?.length ?? 0) > 0 && (
                      <span className="text-[11px] text-[#5A6B8C] truncate" title={ejemplos.get(elegida)?.join(' · ')}>
                        Ej.: {ejemplos.get(elegida)?.join(' · ')}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#EEF2FB] p-4 space-y-2">
            <p className="text-sm font-semibold text-[#002868]">Traer solo lo nuevo o corregido</p>
            <p className="text-xs text-[#7A93BB]">
              Con el filtro “Fecha Modificado” del dashboard, cada 30 minutos se traen también los tickets que se
              corrigieron en HiOffice, aunque sean de días anteriores.
            </p>
            <select
              value={config.attrFechaModificado ?? ''}
              disabled={!editable || isGuardando}
              onChange={e =>
                guardar(
                  { attrFechaModificado: e.target.value ? Number(e.target.value) : null },
                  'Modo incremental actualizado',
                )
              }
              className={`${VENTAS_SELECT_CLASS} w-full`}
            >
              <option value="">No usar (solo por días)</option>
              {filtrosFecha.map(f => (
                <option key={f.attributeId} value={f.attributeId}>
                  Filtro {f.attributeId} ({f.type} {f.arithmeticOperator})
                </option>
              ))}
              {config.attrFechaModificado && !filtrosFecha.some(f => f.attributeId === config.attrFechaModificado) && (
                <option value={config.attrFechaModificado}>Filtro {config.attrFechaModificado}</option>
              )}
            </select>
            {config.watermark && (
              <p className="text-xs text-[#5A6B8C]">
                Cambios traídos hasta: {formatFechaHora(config.watermark)}
                {editable && (
                  <button
                    type="button"
                    onClick={() =>
                      guardar({ reiniciarMarca: true }, 'Se van a revisar de nuevo los cambios de las últimas 24 h')
                    }
                    className="ml-2 underline text-[#002868] cursor-pointer"
                  >
                    Revisar de nuevo
                  </button>
                )}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-[#EEF2FB] p-4 space-y-2">
            <p className="text-sm font-semibold text-[#002868]">Días por consulta</p>
            <p className="text-xs text-[#7A93BB]">
              Cuántos días de ventas se piden a Hiopos en cada llamada. Más días = importaciones más rápidas; si Hiopos
              tarda o corta, bajalo.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={31}
                value={diasPorTramo}
                disabled={!editable}
                onChange={e => setDiasPorTramo(Number(e.target.value))}
                className={`${VENTAS_SELECT_CLASS} w-24`}
              />
              {editable && diasPorTramo !== config.diasPorTramo && (
                <Button
                  size="sm"
                  onClick={() => guardar({ diasPorTramo })}
                  disabled={isGuardando || diasPorTramo < 1 || diasPorTramo > 31}
                  className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white"
                >
                  Guardar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </VentasChartCard>
  )
}
