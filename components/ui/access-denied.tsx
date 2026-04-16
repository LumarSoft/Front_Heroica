'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface AccessDeniedProps {
  /** Nombre del recurso al que se deniega acceso, ej: "caja de efectivo" */
  resource: string
  backUrl: string
}

/** Bloque de "Acceso Denegado" reutilizable para empleados sin permisos */
export function AccessDenied({ resource, backUrl }: AccessDeniedProps) {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-[#E0E0E0] shadow-sm flex-grow">
      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-10 h-10 text-rose-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-[#002868] mb-2">Acceso Denegado</h2>
      <p className="text-[#666666] text-center max-w-md">
        No tienes permisos para gestionar {resource}. Si crees que esto es un error, contacta con el administrador.
      </p>
      <Button onClick={() => router.push(backUrl)} className="mt-8 bg-[#002868] hover:bg-[#003d8f] text-white">
        Volver al inicio
      </Button>
    </div>
  )
}
