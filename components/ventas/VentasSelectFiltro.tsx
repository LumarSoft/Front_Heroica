import { labelClasses, VENTAS_SELECT_CLASS } from '@/lib/dialog-styles'

interface VentasSelectFiltroProps {
  label: string
  value: string
  opciones: string[]
  onChange: (valor: string) => void
}

export function VentasSelectFiltro({ label, value, opciones, onChange }: VentasSelectFiltroProps) {
  return (
    <label className="flex flex-col gap-1 min-w-[150px] flex-1">
      <span className={labelClasses}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className={VENTAS_SELECT_CLASS}>
        <option value="">Todos</option>
        {opciones.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}
