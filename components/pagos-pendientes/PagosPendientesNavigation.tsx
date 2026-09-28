'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PagosPendientesTab } from '@/lib/types'

interface PagosPendientesNavigationProps {
  activeTab: PagosPendientesTab
  isEmployee: boolean
  onTabChange: (tab: PagosPendientesTab) => void
  onPendientesSelect: () => void
}

export function PagosPendientesNavigation({
  activeTab,
  isEmployee,
  onTabChange,
  onPendientesSelect,
}: PagosPendientesNavigationProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={value => {
        if (value === 'pendientes' || value === 'seguimiento' || value === 'historial') onTabChange(value)
      }}
      className="mb-5"
    >
      <TabsList className="h-auto flex-wrap border border-[#E0E0E0] bg-white/70 p-1">
        {!isEmployee && (
          <TabsTrigger
            value="pendientes"
            onClick={onPendientesSelect}
            className="px-4 py-2 font-bold data-[state=active]:bg-[#002868] data-[state=active]:text-white sm:px-6"
          >
            Por aprobar
          </TabsTrigger>
        )}
        <TabsTrigger
          value="seguimiento"
          className="px-4 py-2 font-bold data-[state=active]:bg-[#002868] data-[state=active]:text-white sm:px-6"
        >
          Mi seguimiento
        </TabsTrigger>
        {!isEmployee && (
          <TabsTrigger
            value="historial"
            className="px-4 py-2 font-bold data-[state=active]:bg-[#002868] data-[state=active]:text-white sm:px-6"
          >
            Historial general
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  )
}
