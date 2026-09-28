import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#002868]/8">
        <Icon className="size-7 text-[#002868]" />
      </div>
      <h3 className="text-base font-semibold text-[#1A1A1A]">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-[#666666]">{description}</p>
    </div>
  )
}
