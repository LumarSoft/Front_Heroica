"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

interface NavbarProps {
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  showBackButton?: boolean;
  backUrl?: string;
}

export default function Navbar({
  userName,
  userRole,
  onLogout,
  showBackButton = false,
  backUrl = "/sucursales",
}: NavbarProps) {
  const router = useRouter();
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin());

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
  };

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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                    />
                  </svg>
                </Button>
                <div className="h-8 w-px bg-[#E0E0E0]"></div>
              </>
            )}

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src="/HEROICA.svg" alt="Heroica" className="h-8 w-auto" />
              </div>
              <div className="h-8 w-px bg-[#E0E0E0] hidden sm:block"></div>
            </div>

            {/* Greeting & Subtitle */}
            <div className="hidden sm:flex flex-col">
              {userName ? (
                <>
                  <p className="text-sm font-semibold text-[#002868]">
                    {getGreeting()}, {userName.split(" ")[0]}
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

            {/* Configuration Button (Superadmin Only) */}
            {isSuperAdmin && (
              <Button
                onClick={() => router.push("/configuracion")}
                variant="outline"
                className="border-[#002868] text-[#002868] hover:bg-[#002868] hover:text-white transition-all cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 sm:mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 sm:mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile User Info */}
        {userName && (
          <div className="sm:hidden mt-3 pt-3 border-t border-[#E0E0E0] flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#002868]">
                {getGreeting()}, {userName.split(" ")[0]}
              </p>
              <p className="text-xs text-[#666666] capitalize">{userRole}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
