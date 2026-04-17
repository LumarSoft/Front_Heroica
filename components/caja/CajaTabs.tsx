'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { calcularTotal, formatMonto } from '@/lib/formatters'
import type { Transaction } from '@/lib/types'

const TRIGGER_CLASS =
  '!px-3 sm:!px-5 !py-2 sm:!py-2.5 !h-auto !rounded-[9px] !transition-all !duration-200 !border-none !outline-none !ring-0 !ring-offset-0 !shadow-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!border-none focus-visible:!outline-none data-[state=active]:!bg-white data-[state=active]:!text-[#002868] data-[state=active]:!shadow-[0_1px_3px_rgba(0,0,0,0.12)] data-[state=inactive]:!text-[#888888] data-[state=inactive]:hover:!text-[#002868]/70'

interface CajaTabsProps {
  saldoReal: Transaction[]
  saldoNecesario: Transaction[]
  children: React.ReactNode
  value?: string
  onValueChange?: (v: string) => void
}

export function CajaTabs({ saldoReal, saldoNecesario, children, value, onValueChange }: CajaTabsProps) {
  const totalReal = calcularTotal(saldoReal)
  const totalNecesario = calcularTotal(saldoNecesario)
  const diferenciaTotal = totalReal + totalNecesario

  const tabsProps = value !== undefined ? { value, onValueChange } : { defaultValue: 'real' }

  return (
    <Tabs {...tabsProps} className="w-full flex-grow flex flex-col">
      {/* Panel de resumen + tabs integrado */}
      <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm mb-6 px-4 sm:px-6 py-4">
        {/* Mini stats row — mobile only */}
        <div className="flex items-center justify-between gap-3 mb-3 sm:hidden">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999999] mb-0.5">Saldo Real</p>
            <p className={`text-lg font-bold tabular-nums truncate ${totalReal >= 0 ? 'text-[#002868]' : 'text-rose-600'}`}>
              {formatMonto(totalReal)}
            </p>
          </div>
          <div className="w-px h-8 bg-[#E0E0E0] flex-shrink-0" />
          <div className="flex-1 min-w-0 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#999999] mb-0.5">Necesario</p>
            <p className={`text-lg font-bold tabular-nums truncate ${diferenciaTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMonto(diferenciaTotal)}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Tabs tipo segmented pill */}
          <TabsList className="grid grid-cols-2 w-full sm:w-auto !bg-[#ECEEF1] !p-[3px] !rounded-xl !h-auto overflow-hidden">
            <TabsTrigger value="real" className={TRIGGER_CLASS}>
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-bold text-xs sm:text-sm">Saldo Real</span>
                <span className={`font-medium text-[10px] sm:text-xs tabular-nums hidden sm:block ${totalReal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatMonto(totalReal)}
                </span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="necesario" className={TRIGGER_CLASS}>
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-bold text-xs sm:text-sm">Saldo Necesario</span>
                <span className={`font-medium text-[10px] sm:text-xs tabular-nums hidden sm:block ${diferenciaTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatMonto(diferenciaTotal)}
                </span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Total prominente — desktop only */}
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#999999]">Total Saldo Real</p>
            <p className={`text-3xl font-bold tabular-nums ${totalReal >= 0 ? 'text-[#002868]' : 'text-rose-600'}`}>
              {formatMonto(totalReal)}
            </p>
          </div>
        </div>
      </div>

      {children}
    </Tabs>
  )
}

// Re-export TabsContent for convenience
export { TabsContent } from '@/components/ui/tabs'
