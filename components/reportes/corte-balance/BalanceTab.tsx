import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MontoInput } from '@/components/ui/monto-input'
import { corteCardClasses, labelClasses } from '@/lib/dialog-styles'
import { formatearImporte } from '@/lib/corte-balance/valores'
import type { BalanceCalculado, BorradorCorteBalance, SeccionCalculada } from '@/lib/types'

interface BalanceTabProps {
  balance: BalanceCalculado
  borrador: BorradorCorteBalance
  secciones: SeccionCalculada[]
  ventasTotales: number | null
  operatividadPorDefecto: number
  moneda: 'ARS' | 'USD'
  onBalanceChange: (cambios: Partial<BorradorCorteBalance['balance']>) => void
}

const BLOQUES = [
  { clave: 'ingresos', etiqueta: 'Ingresos', clase: 'bg-[#9AE07A]/50' },
  { clave: 'egresos', etiqueta: 'Egresos', clase: 'bg-[#FF5A5A]/30' },
  { clave: 'resultadoParcial', etiqueta: 'Resultado parcial', clase: 'bg-[#FFDE59]/50' },
  { clave: 'operatividad', etiqueta: 'Operatividad', clase: 'bg-white' },
  { clave: 'resultadoFinal', etiqueta: 'Resultado final', clase: 'bg-[#9CC3FF]/50' },
] as const

export function BalanceTab({
  balance,
  borrador,
  secciones,
  ventasTotales,
  operatividadPorDefecto,
  moneda,
  onBalanceChange,
}: BalanceTabProps) {
  const m = (n: number) => formatearImporte(n, moneda)
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <section className={`${corteCardClasses} space-y-4`}>
        <div className="space-y-1">
          <Label className={labelClasses}>Ingresos del período</Label>
          <MontoInput
            value={borrador.balance.ingresos}
            onChange={ingresos => onBalanceChange({ ingresos })}
            placeholder={
              ventasTotales !== null ? `Auto: ${m(ventasTotales)} (Ventas Totales)` : 'Cargá Ventas Totales o un valor'
            }
          />
          <p className="text-xs text-[#9AA0AC]">
            Si lo dejás vacío se usa &quot;Ventas Totales&quot; del Anexo Ingresos (datos de Hiopos cargados a mano).
          </p>
        </div>
        <div className="space-y-1">
          <Label className={labelClasses}>Operatividad (%)</Label>
          <Input
            value={borrador.balance.operatividadPct}
            inputMode="decimal"
            onChange={e => onBalanceChange({ operatividadPct: e.target.value })}
            placeholder={`${operatividadPorDefecto} (de la plantilla)`}
            className="max-w-[200px]"
          />
          <p className="text-xs text-[#9AA0AC]">Se descuenta del resultado parcial cuando es positivo.</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#1A1A1A]">
          {BLOQUES.map(b => (
            <div
              key={b.clave}
              className={`flex items-center justify-between border-b border-[#1A1A1A] px-4 py-3 last:border-b-0 ${b.clase}`}
            >
              <span className="text-sm font-semibold">
                {b.etiqueta}
                {b.clave === 'operatividad' ? ` (${balance.operatividadPct}%)` : ''}
              </span>
              <span className="text-base font-bold">{m(balance[b.clave])}</span>
            </div>
          ))}
        </div>
      </section>
      <section className={corteCardClasses}>
        <h3 className="mb-3 text-sm font-bold text-[#002868]">Egresos por sección</h3>
        {secciones.map(s => (
          <div key={s.id} className="flex justify-between border-t border-[#EEF0F3] py-2 text-sm first:border-t-0">
            <span>{s.nombre}</span>
            <span className="font-semibold">{m(s.total)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t-2 border-[#002868] pt-2 text-sm font-bold text-[#002868]">
          <span>Total egresos</span>
          <span>{m(balance.egresos)}</span>
        </div>
      </section>
    </div>
  )
}
