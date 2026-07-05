'use client'

import { Lock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ChatContainer } from '@/components/heroicai/ChatContainer'

export default function HeroicaiPage() {
  const user = useAuthStore(state => state.user)
  const canUsarHeroicai = useAuthStore(state => state.canUsarHeroicai())

  // Guard por permiso (defensa en profundidad; la API valida con requirePermission).
  if (user && !canUsarHeroicai) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#F8FAFF] px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Lock className="h-6 w-6 text-slate-400" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-700">Sin acceso a HeroicAI</h2>
        <p className="mt-1.5 max-w-sm text-sm text-slate-500">
          No tenés permiso para usar el asistente. Pedile a un administrador que te habilite el acceso.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full">
      <ChatContainer />
    </div>
  )
}
