'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function SucursalError({ error, reset }: ErrorPageProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-800">Error al cargar la página</h2>
            <p className="text-sm text-slate-500">
              No se pudo cargar la información de esta sección. Por favor, intentá nuevamente.
            </p>
            {error.digest && <p className="text-xs text-slate-400 font-mono pt-1">Ref: {error.digest}</p>}
          </div>

          <div className="flex gap-3 justify-center pt-1">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <Button onClick={reset} className="bg-[#002868] hover:bg-[#003d8f] text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
