interface VentasEmptyChartProps {
  altura?: number
}

export function VentasEmptyChart({ altura = 260 }: VentasEmptyChartProps) {
  return (
    <div className="flex items-center justify-center text-sm text-[#7A93BB]" style={{ height: altura }}>
      Sin datos para los filtros seleccionados.
    </div>
  )
}
