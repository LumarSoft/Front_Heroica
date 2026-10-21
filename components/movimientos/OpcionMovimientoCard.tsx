'use client'
import { Checkbox } from '@/components/ui/checkbox'

interface Props {
  id: string
  activa: boolean
  titulo: string
  detalle: string
  onToggle: (activa: boolean) => void
}

/** Tarjeta con check para elegir una operación especial en Nuevo Movimiento (transferencia, préstamo) */
export function OpcionMovimientoCard({ id, activa, titulo, detalle, onToggle }: Props) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer select-none transition-all ${
        activa ? 'border-[#002868] bg-[#EEF3FF]' : 'border-[#E0E0E0] bg-[#FAFAFA] hover:border-[#002868]/40'
      }`}
      onClick={() => onToggle(!activa)}
    >
      <Checkbox id={id} checked={activa} onCheckedChange={v => onToggle(Boolean(v))} className="pointer-events-none" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-[#002868]">{titulo}</span>
        <span className="text-xs text-[#8A8F9C]">{detalle}</span>
      </div>
    </div>
  )
}
