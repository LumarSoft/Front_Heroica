'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, LogOut, ClipboardList, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { useAuthStore } from '@/store/authStore'
import { useCalculatorStore } from '@/store/calculatorStore'

interface NavbarProps {
  userName?: string
  userRole?: string
  onLogout?: () => void
  showBackButton?: boolean
  backUrl?: string
  sucursalNombre?: string
}

export default function Navbar({
  userName,
  userRole,
  onLogout,
  showBackButton = false,
  backUrl = '/sucursales',
  sucursalNombre,
}: NavbarProps) {
  const router = useRouter()
  const canVerConfiguracion = useAuthStore(state => state.canVerConfiguracion())
  const { toggleCalculator, isOpen: isCalculatorOpen } = useCalculatorStore()

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 19) return 'Buenas tardes'
    return 'Buenas noches'
  })()

  return (
    <header className="bg-white border-b border-[#E0E0E0] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-6">
        <div className="flex items-center h-14 sm:h-16 gap-2 sm:gap-3">

          {/* Back Button */}
          {showBackButton && (
            <Button
              onClick={() => router.push(backUrl)}
              variant="ghost"
              size="icon"
              className="w-8 h-8 sm:w-9 sm:h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 flex-shrink-0 cursor-pointer"
              aria-label="Volver"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          )}

          {/* Logo */}
          <Image
            src="/HEROICA.svg"
            alt="Heroica"
            width={80}
            height={32}
            className="h-6 sm:h-8 w-auto flex-shrink-0"
            priority
          />

          {/* Divider */}
          <div className="h-6 sm:h-8 w-px bg-[#E0E0E0] flex-shrink-0" />

          {/* Context: sucursal or greeting — always visible */}
          <div className="flex flex-col justify-center min-w-0 flex-1 sm:flex-none">
            {sucursalNombre ? (
              <>
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-0.5">
                  Sucursal
                </p>
                <p className="text-xs sm:text-sm font-semibold text-[#002868] truncate leading-none">
                  {sucursalNombre}
                </p>
              </>
            ) : userName ? (
              <>
                <p className="text-xs sm:text-sm font-semibold text-[#1A1A1A] leading-none mb-0.5 truncate">
                  {greeting}, {userName.split(' ')[0]}
                </p>
                <p className="text-[9px] sm:text-[10px] text-[#9AA0AC] leading-none hidden sm:block">
                  Sistema de Contabilidad
                </p>
              </>
            ) : (
              <p className="text-xs sm:text-sm text-[#9AA0AC]">Sistema de Contabilidad</p>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1 hidden sm:block" />

          {/* User Badge — desktop */}
          {userName && userRole && (
            <div className="hidden md:flex items-center gap-2.5 pr-3 sm:pr-4 border-r border-[#E0E0E0] flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#002868] to-[#003d8f] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-[#1A1A1A] leading-tight">{userName}</p>
                <p className="text-xs text-[#9AA0AC] capitalize leading-tight">{userRole}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <TooltipProvider>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={toggleCalculator}
                    variant="ghost"
                    size="icon"
                    className={`w-8 h-8 sm:w-9 sm:h-9 transition-all cursor-pointer rounded-lg ${
                      isCalculatorOpen
                        ? 'bg-[#002868] text-white hover:bg-[#003d8f]'
                        : 'text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8'
                    }`}
                    aria-label="Calculadora"
                  >
                    <Calculator className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Calculadora <span className="opacity-60 ml-1">F1</span>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => router.push('/tareas')}
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 sm:w-9 sm:h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 transition-all cursor-pointer rounded-lg"
                    aria-label="Tareas"
                  >
                    <ClipboardList className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Tareas</TooltipContent>
              </Tooltip>

              {canVerConfiguracion && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => router.push('/configuracion')}
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 sm:w-9 sm:h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 transition-all cursor-pointer rounded-lg"
                      aria-label="Configuración"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Configuración</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Separator + Logout */}
            {onLogout && (
              <>
                <div className="h-6 sm:h-7 w-px bg-[#E0E0E0] flex-shrink-0" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onLogout}
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 sm:w-9 sm:h-9 text-[#9AA0AC] hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer rounded-lg flex-shrink-0"
                      aria-label="Cerrar Sesión"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Cerrar Sesión</TooltipContent>
                </Tooltip>
              </>
            )}
          </TooltipProvider>
        </div>
      </div>
    </header>
  )
}
