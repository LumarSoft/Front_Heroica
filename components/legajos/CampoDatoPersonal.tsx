import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface CampoDatoPersonalProps {
  label: string
  required?: boolean
  children: ReactNode
}

export function CampoDatoPersonal({ label, required, children }: CampoDatoPersonalProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold text-[#444]">
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </Label>
      {children}
    </div>
  )
}
