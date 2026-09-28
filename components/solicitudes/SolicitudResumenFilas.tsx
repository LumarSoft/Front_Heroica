interface SolicitudResumenFilasProps {
  rows: Array<{ label: string; value: string }>
}

export function SolicitudResumenFilas({ rows }: SolicitudResumenFilasProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map(row => (
        <div key={row.label} className="rounded-lg border border-[#E0E0E0] bg-[#FAFBFC] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">{row.label}</p>
          <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap break-words">{row.value}</p>
        </div>
      ))}
    </div>
  )
}
