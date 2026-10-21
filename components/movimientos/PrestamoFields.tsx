'use client'
import { cn } from '@/lib/utils'
import type { CajaPrestamo, ModoPrestamo, SelectOption } from '@/lib/types'
import type { PrestamoFormState } from '@/hooks/use-prestamo-form'
import { PedirPrestamoFields } from './PedirPrestamoFields'
import { DevolverPrestamoFields } from './DevolverPrestamoFields'

interface Props {
  form: PrestamoFormState
  bancos: SelectOption[]
  cajaTipo: CajaPrestamo
  moneda: 'ARS' | 'USD'
}

const MODOS: { value: ModoPrestamo; label: string }[] = [
  { value: 'pedir', label: 'Pedir préstamo' },
  { value: 'devolver', label: 'Devolver préstamo' },
]

/** Préstamo entre sucursales dentro de Nuevo Movimiento */
export function PrestamoFields({ form, bancos, cajaTipo, moneda }: Props) {
  return (
    <section className="space-y-4">
      <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
        <span className="w-1 h-4 bg-[#002868] rounded-full" />
        Préstamo entre sucursales
      </h4>

      <div className="grid grid-cols-2 gap-1 p-1 bg-[#F0F2F5] rounded-xl">
        {MODOS.map(m => (
          <button
            key={m.value}
            type="button"
            onClick={() => form.setModo(m.value)}
            className={cn(
              'h-9 rounded-lg text-sm font-semibold transition-all cursor-pointer',
              form.modo === m.value ? 'bg-white text-[#002868] shadow-sm' : 'text-[#5A6070] hover:text-[#002868]',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {form.modo === 'pedir' ? (
        <PedirPrestamoFields form={form} bancos={bancos} cajaTipo={cajaTipo} moneda={moneda} />
      ) : (
        <DevolverPrestamoFields form={form} bancos={bancos} cajaTipo={cajaTipo} moneda={moneda} />
      )}
    </section>
  )
}
