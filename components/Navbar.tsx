'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, LogOut, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

interface NavbarProps {
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  showBackButton?: boolean;
  backUrl?: string;
  sucursalNombre?: string;
}

export default function Navbar({
  userName,
  userRole,
  onLogout,
  showBackButton = false,
  backUrl = '/sucursales',
  sucursalNombre,
}: NavbarProps) {
  const router = useRouter();
  const canVerConfiguracion = useAuthStore((state) =>
    state.canVerConfiguracion(),
  );

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  return (
    <header className="bg-white border-b border-[#E0E0E0] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo & Greeting */}
          <div className="flex items-center gap-4">
            {/* Back Button (if enabled) */}
            {showBackButton && (
              <>
                <Button
                  onClick={() => router.push(backUrl)}
                  variant="ghost"
                  size="icon"
                  className="text-[#002868] hover:bg-[#002868]/10 cursor-pointer"
                  aria-label="Volver"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="h-8 w-px bg-[#E0E0E0]"></div>
              </>
            )}

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src="/HEROICA.svg"
                  alt="Heroica"
                  width={80}
                  height={32}
                  className="h-8 w-auto"
                  priority
                />
              </div>
              <div className="h-8 w-px bg-[#E0E0E0] hidden sm:block"></div>
            </div>

            {/* Greeting / Sucursal */}
            <div className="hidden sm:flex flex-col">
              {sucursalNombre ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#5A6070]">
                    Sucursal
                  </p>
                  <p className="text-sm font-semibold text-[#002868]">
                    {sucursalNombre}
                  </p>
                </>
              ) : userName ? (
                <>
                  <p className="text-sm font-semibold text-[#002868]">
                    {greeting}, {userName.split(' ')[0]}
                  </p>
                  <p className="text-xs text-[#666666]">
                    Sistema de Contabilidad
                  </p>
                </>
              ) : (
                <p className="text-sm text-[#666666]">
                  Sistema de Contabilidad
                </p>
              )}
            </div>
          </div>

          {/* Right Section - User Info & Actions */}
          <div className="flex items-center gap-4">
            {/* User Badge (Desktop) */}
            {userName && userRole && (
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-[#F5F5F5] rounded-lg border border-[#E0E0E0]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#002868] to-[#003d8f] flex items-center justify-center text-white font-bold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#1A1A1A] leading-tight">
                    {userName}
                  </p>
                  <p className="text-xs text-[#666666] capitalize leading-tight">
                    {userRole}
                  </p>
                </div>
              </div>
            )}

            {/* Tareas Button */}
            <Button
              onClick={() => router.push('/tareas')}
              variant="outline"
              className="border-[#002868] text-[#002868] hover:bg-[#002868] hover:text-white transition-all cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Tareas</span>
            </Button>

            {/* Configuration Button */}
            {canVerConfiguracion && (
              <Button
                onClick={() => router.push('/configuracion')}
                variant="outline"
                className="border-[#002868] text-[#002868] hover:bg-[#002868] hover:text-white transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Configuración</span>
              </Button>
            )}

            {/* Logout Button */}
            {onLogout && (
              <Button
                onClick={onLogout}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile User Info */}
        {(userName || sucursalNombre) && (
          <div className="sm:hidden mt-3 pt-3 border-t border-[#E0E0E0] flex items-center justify-between">
            <div>
              {sucursalNombre ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#5A6070]">
                    Sucursal
                  </p>
                  <p className="text-sm font-semibold text-[#002868]">
                    {sucursalNombre}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#002868]">
                    {greeting}, {userName?.split(' ')[0]}
                  </p>
                  <p className="text-xs text-[#666666] capitalize">
                    {userRole}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
