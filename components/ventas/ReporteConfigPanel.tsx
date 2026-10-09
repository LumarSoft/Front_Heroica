'use client'

import { useMemo } from 'react'
import { Search } from 'lucide-react'
import { MultiSelect } from '@/components/ui/multi-select'
import { labelClasses, VENTAS_CARD_CLASS, VENTAS_SELECT_CLASS } from '@/lib/dialog-styles'
import { toDateOnly } from '@/lib/downloadBlob'
import { DIMENSIONES_REPORTE, METRICAS_REPORTE, PERIODOS_REPORTE } from '@/lib/ventas-reportes'
import { cn } from '@/lib/utils'
import type {
  ComparacionReporte,
  ConfigReporteVentas,
  DimensionReporte,
  FiltrosReporteVentas,
  MetricaReporte,
  OpcionesFiltrosVentas,
} from '@/lib/types'
import { VentasSegmentedControl } from './VentasSegmentedControl'
import { VentasSelectFiltro } from './VentasSelectFiltro'

interface ReporteConfigPanelProps {
  config: ConfigReporteVentas
  opciones: OpcionesFiltrosVentas
  onChange: (config: ConfigReporteVentas) => void
}

const MAX_DIMENSIONES = 3
const GRUPOS = ['Tiempo', 'Dónde y quién', 'Qué', 'Cómo'] as const

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className={labelClasses}>{titulo}</p>
      {children}
    </div>
  )
}

export function ReporteConfigPanel({ config, opciones, onChange }: ReporteConfigPanelProps) {
  const hoy = toDateOnly(new Date())
  const set = <K extends keyof ConfigReporteVentas>(clave: K, valor: ConfigReporteVentas[K]) =>
    onChange({ ...config, [clave]: valor })
  const setFiltro = <K extends keyof FiltrosReporteVentas>(clave: K, valor: FiltrosReporteVentas[K]) =>
    set('filtros', { ...config.filtros, [clave]: valor || undefined })

  const conPago = config.dimensiones.includes('medio_pago')
  const conProducto = config.dimensiones.some(d => d === 'producto' || d === 'categoria')
  const opcionesSucursales = useMemo(
    () => opciones.sucursales.map(s => ({ value: String(s.id), label: s.nombre })),
    [opciones.sucursales],
  )

  const toggleDimension = (d: DimensionReporte) => {
    const actual = config.dimensiones
    const dimensiones = actual.includes(d) ? actual.filter(x => x !== d) : [...actual, d].slice(-MAX_DIMENSIONES)
    const ordenValido = [...dimensiones, ...config.metricas].includes(config.orden.campo as never)
    onChange({
      ...config,
      dimensiones,
      orden: ordenValido ? config.orden : { campo: config.metricas[0] ?? 'facturacion', direccion: 'desc' },
    })
  }

  const toggleMetrica = (m: MetricaReporte) => {
    const metricas = config.metricas.includes(m) ? config.metricas.filter(x => x !== m) : [...config.metricas, m]
    if (metricas.length === 0) return
    const ordenMetricas = METRICAS_REPORTE.map(x => x.clave).filter(x => metricas.includes(x))
    const ordenValido = [...config.dimensiones, ...ordenMetricas].includes(config.orden.campo as never)
    onChange({
      ...config,
      metricas: ordenMetricas,
      orden: ordenValido ? config.orden : { campo: ordenMetricas[0], direccion: 'desc' },
    })
  }

  const periodoValor = config.periodo.tipo === 'fijo' ? 'personalizado' : config.periodo.clave

  return (
    <div className={`${VENTAS_CARD_CLASS} p-5 space-y-5`}>
      <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#002868]">Armá tu reporte</h3>

      <Seccion titulo="Período">
        <select
          value={periodoValor}
          onChange={e =>
            set(
              'periodo',
              e.target.value === 'personalizado'
                ? { tipo: 'fijo', desde: toDateOnly(new Date(Date.now() - 29 * 86_400_000)), hasta: hoy }
                : { tipo: 'relativo', clave: e.target.value as never },
            )
          }
          className={`${VENTAS_SELECT_CLASS} w-full`}
        >
          {PERIODOS_REPORTE.map(p => (
            <option key={p.clave} value={p.clave}>
              {p.etiqueta}
            </option>
          ))}
          <option value="personalizado">Elegir fechas…</option>
        </select>
        {config.periodo.tipo === 'fijo' && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={config.periodo.desde}
              max={config.periodo.hasta}
              onChange={e =>
                config.periodo.tipo === 'fijo' && set('periodo', { ...config.periodo, desde: e.target.value })
              }
              className={VENTAS_SELECT_CLASS}
            />
            <input
              type="date"
              value={config.periodo.hasta}
              min={config.periodo.desde}
              max={hoy}
              onChange={e =>
                config.periodo.tipo === 'fijo' && set('periodo', { ...config.periodo, hasta: e.target.value })
              }
              className={VENTAS_SELECT_CLASS}
            />
          </div>
        )}
        {config.periodo.tipo === 'relativo' && (
          <p className="text-[11px] text-[#9AAACC]">
            Relativo: si lo guardás, cada vez muestra el período actualizado.
          </p>
        )}
      </Seccion>

      <Seccion titulo="Comparar con">
        <VentasSegmentedControl<ComparacionReporte>
          ariaLabel="Comparar con"
          valor={config.comparacion}
          onChange={v => set('comparacion', v)}
          opciones={[
            { valor: 'ninguna', label: 'Nada' },
            { valor: 'periodo_anterior', label: 'Período ant.' },
            { valor: 'anio_anterior', label: 'Año ant.' },
          ]}
        />
      </Seccion>

      <Seccion titulo={`Agrupar por (hasta ${MAX_DIMENSIONES}, en orden)`}>
        <div className="space-y-2">
          {GRUPOS.map(grupo => (
            <div key={grupo} className="flex flex-wrap gap-1.5">
              <span className="w-full text-[11px] text-[#9AAACC]">{grupo}</span>
              {DIMENSIONES_REPORTE.filter(d => d.grupo === grupo).map(d => {
                const indice = config.dimensiones.indexOf(d.clave)
                const bloqueada = (d.soloPago && conProducto) || (d.deProducto && conPago)
                return (
                  <button
                    key={d.clave}
                    type="button"
                    disabled={bloqueada && indice < 0}
                    title={
                      bloqueada ? 'El medio de pago es por ticket: no se cruza con producto ni familia' : undefined
                    }
                    onClick={() => toggleDimension(d.clave)}
                    className={cn(
                      'px-2.5 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40',
                      indice >= 0
                        ? 'bg-[#002868] border-[#002868] text-white'
                        : 'bg-white border-[#D8E3F8] text-[#002868] hover:border-[#002868]',
                    )}
                  >
                    {indice >= 0 && <span className="mr-1 font-bold">{indice + 1}.</span>}
                    {d.etiqueta}
                  </button>
                )
              })}
            </div>
          ))}
          {config.dimensiones.length === 0 && (
            <p className="text-[11px] text-[#9AAACC]">Sin agrupar: muestra solo el total.</p>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Qué medir">
        <div className="grid grid-cols-1 gap-1">
          {METRICAS_REPORTE.map(m => {
            const sinDatos = m.deProducto && conPago
            return (
              <label
                key={m.clave}
                title={m.ayuda}
                className={cn(
                  'flex items-center gap-2 text-sm cursor-pointer',
                  sinDatos ? 'text-[#9AAACC]' : 'text-[#1E293B]',
                )}
              >
                <input
                  type="checkbox"
                  checked={config.metricas.includes(m.clave)}
                  onChange={() => toggleMetrica(m.clave)}
                />
                {m.etiqueta}
                {sinDatos && <span className="text-[10px]">(no aplica por medio de pago)</span>}
              </label>
            )
          })}
        </div>
      </Seccion>

      <Seccion titulo="Filtros">
        <div className="space-y-2">
          <MultiSelect
            options={opcionesSucursales}
            selected={(config.filtros.sucursal_ids ?? []).map(String)}
            onChange={v => setFiltro('sucursal_ids', v.map(Number))}
            placeholder="Todas las sucursales"
          />
          <span className="relative block">
            <Search className="w-4 h-4 text-[#7A93BB] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={config.filtros.producto ?? ''}
              onChange={e => setFiltro('producto', e.target.value)}
              placeholder="Producto (nombre o código)"
              className={`${VENTAS_SELECT_CLASS} w-full pl-9`}
            />
          </span>
          <div className="grid grid-cols-2 gap-2">
            <VentasSelectFiltro
              label="Familia"
              value={config.filtros.categoria ?? ''}
              opciones={opciones.categorias}
              onChange={v => setFiltro('categoria', v)}
            />
            <VentasSelectFiltro
              label="Medio de pago"
              value={config.filtros.medio_pago ?? ''}
              opciones={opciones.mediosPago}
              onChange={v => setFiltro('medio_pago', v)}
            />
            {opciones.canales.length > 0 && (
              <VentasSelectFiltro
                label="Canal"
                value={config.filtros.canal ?? ''}
                opciones={opciones.canales}
                onChange={v => setFiltro('canal', v)}
              />
            )}
            {opciones.vendedores.length > 0 && (
              <VentasSelectFiltro
                label="Vendedor"
                value={config.filtros.vendedor ?? ''}
                opciones={opciones.vendedores}
                onChange={v => setFiltro('vendedor', v)}
              />
            )}
            {opciones.cajas.length > 0 && (
              <VentasSelectFiltro
                label="Caja"
                value={config.filtros.caja ?? ''}
                opciones={opciones.cajas}
                onChange={v => setFiltro('caja', v)}
              />
            )}
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Orden y cantidad">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <select
            value={config.orden.campo}
            onChange={e => set('orden', { ...config.orden, campo: e.target.value })}
            className={VENTAS_SELECT_CLASS}
          >
            {config.dimensiones.map(d => (
              <option key={d} value={d}>
                {DIMENSIONES_REPORTE.find(x => x.clave === d)?.etiqueta}
              </option>
            ))}
            {config.metricas.map(m => (
              <option key={m} value={m}>
                {METRICAS_REPORTE.find(x => x.clave === m)?.etiqueta}
              </option>
            ))}
          </select>
          <select
            value={config.orden.direccion}
            onChange={e => set('orden', { ...config.orden, direccion: e.target.value as 'asc' | 'desc' })}
            className={VENTAS_SELECT_CLASS}
            aria-label="Dirección"
          >
            <option value="desc">Mayor a menor</option>
            <option value="asc">Menor a mayor</option>
          </select>
          <select
            value={config.limite}
            onChange={e => set('limite', Number(e.target.value))}
            className={VENTAS_SELECT_CLASS}
            aria-label="Filas"
          >
            {[10, 25, 50, 100, 500, 1000, 5000].map(n => (
              <option key={n} value={n}>
                {n} filas
              </option>
            ))}
          </select>
        </div>
      </Seccion>
    </div>
  )
}
