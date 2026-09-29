import { VENTAS_SEGMENT_BUTTON_CLASS } from '@/lib/dialog-styles'
import { cn } from '@/lib/utils'

interface VentasSegmentedControlProps<T extends string> {
  opciones: Array<{ valor: T; label: string }>
  valor: T
  onChange: (valor: T) => void
  ariaLabel: string
}

export function VentasSegmentedControl<T extends string>({
  opciones,
  valor,
  onChange,
  ariaLabel,
}: VentasSegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex gap-1 p-1 rounded-xl bg-[#F1F5FD]">
      {opciones.map(o => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={o.valor === valor}
          onClick={() => onChange(o.valor)}
          className={cn(
            VENTAS_SEGMENT_BUTTON_CLASS,
            o.valor === valor ? 'bg-white text-[#002868] shadow-sm' : 'text-[#6B7FA6] hover:text-[#002868]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
