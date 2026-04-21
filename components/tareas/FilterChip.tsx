import { cn } from '@/lib/utils'

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer',
        active
          ? 'bg-[#002868] text-white border-[#002868]'
          : 'bg-white text-slate-500 border-slate-200 hover:border-[#002868] hover:text-[#002868]',
      )}
    >
      {children}
    </button>
  )
}
