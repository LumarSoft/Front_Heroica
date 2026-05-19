'use client'

import type { RhSolicitudTipo } from '@/lib/types'

interface SolicitudTiposGridProps {
  tipos: RhSolicitudTipo[]
  pendingCounts: Record<string, number>
  onSelect: (tipo: RhSolicitudTipo) => void
  showBadges: boolean
}

export function SolicitudTiposGrid({ tipos, pendingCounts, onSelect, showBadges }: SolicitudTiposGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
      {tipos.map(tipo => {
        const pending = pendingCounts[tipo] || 0
        const hasPending = pending > 0

        return (
          <div
            key={tipo}
            onClick={() => onSelect(tipo)}
            className={`relative p-6 border rounded-xl cursor-pointer shadow-sm transition-all group ${
              hasPending ? 'bg-[#FEF9C3] border-[#FDE047] hover:border-[#EAB308]' : 'bg-[#DCFCE7] border-[#BBF7D0] hover:border-[#22C55E]'
            }`}
          >
            {pending > 0 && showBadges && (
              <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
                {pending > 99 ? '99+' : pending}
              </div>
            )}
            <div className="flex flex-col h-full justify-center min-h-[60px]">
              <h3 className="font-semibold text-[#1A1A1A] leading-tight group-hover:scale-105 transition-transform origin-left">{tipo}</h3>
            </div>
          </div>
        )
      })}
    </div>
  )
}
