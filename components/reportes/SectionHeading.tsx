// =============================================
// Encabezado numerado de sección para reportes
// =============================================

interface SectionHeadingProps {
  number: string
  title: string
  className?: string
}

export function SectionHeading({ number, title, className = '' }: SectionHeadingProps) {
  return (
    <h2 className={`text-lg font-bold text-slate-800 mb-4 flex items-center gap-2.5 ${className}`}>
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#002868] text-white text-xs font-bold">
        {number}
      </span>
      {title}
    </h2>
  )
}
