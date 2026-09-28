import type { ReactNode } from 'react'

interface DatoPersonalCardProps {
  label: string
  children: ReactNode
}

export function DatoPersonalCard({ label, children }: DatoPersonalCardProps) {
  return (
    <div className="flex min-h-[72px] flex-col justify-between rounded-xl border border-[#E5E9F0] bg-white p-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC]">{label}</p>
      <div>{children}</div>
    </div>
  )
}
