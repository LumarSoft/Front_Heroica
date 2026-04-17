'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRightLeft } from 'lucide-react'
import { DeudasInterSucursalDialog } from './DeudasInterSucursalDialog'

interface PageHeaderProps {
  title: string
  subtitle: string
  onNewMovimiento: () => void
  onCompraVentaDivisas?: () => void
  isReadOnly?: boolean
  sucursalId: number
}

export function PageHeader({
  title,
  subtitle,
  onNewMovimiento,
  onCompraVentaDivisas,
  isReadOnly = false,
  sucursalId,
}: PageHeaderProps) {
  const [showDeudas, setShowDeudas] = useState(false)

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-[#002868] mb-1">{title}</h1>
          <p className="text-xs sm:text-sm text-[#666666]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
          <Button
            onClick={() => setShowDeudas(true)}
            variant="outline"
            className="cursor-pointer border-orange-300 bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-400 font-semibold px-3 sm:px-5 py-2 sm:py-3 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Deudas
          </Button>
          {onCompraVentaDivisas && (
            <Button
              onClick={!isReadOnly ? onCompraVentaDivisas : undefined}
              disabled={isReadOnly}
              variant="outline"
              className="cursor-pointer border-[#002868] text-[#002868] hover:bg-[#002868] hover:text-white font-semibold px-3 sm:px-5 py-2 sm:py-3 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Compra-Venta de Divisas</span>
              <span className="sm:hidden">Divisas</span>
            </Button>
          )}
          <Button
            onClick={!isReadOnly ? onNewMovimiento : undefined}
            disabled={isReadOnly}
            className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white font-semibold px-3 sm:px-6 py-2 sm:py-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">Nuevo Movimiento</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      <DeudasInterSucursalDialog open={showDeudas} onOpenChange={setShowDeudas} sucursalId={sucursalId} />
    </>
  )
}
