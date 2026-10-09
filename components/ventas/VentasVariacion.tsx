import { cn } from '@/lib/utils'

interface VentasVariacionProps {
  valor: number | null | undefined
  /** true cuando subir es malo. */
  invertir?: boolean
  className?: string
}

/** Variación % compacta (▲ 12,3% / ▼ 4,0%) para tablas. */
export function VentasVariacion({ valor, invertir = false, className }: VentasVariacionProps) {
  if (valor === null || valor === undefined) return <span className={cn('text-xs text-[#9AAACC]', className)}>—</span>
  const neutra = Math.abs(valor) < 0.05
  const buena = !neutra && valor > 0 !== invertir
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums whitespace-nowrap',
        neutra ? 'text-slate-500' : buena ? 'text-emerald-700' : 'text-rose-700',
        className,
      )}
    >
      {neutra ? '=' : valor > 0 ? '▲' : '▼'} {Math.abs(valor).toLocaleString('es-AR', { maximumFractionDigits: 1 })}%
    </span>
  )
}
