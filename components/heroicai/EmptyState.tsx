import { Sparkles, Wallet, Users, ClipboardList } from 'lucide-react'

interface Sugerencia {
  icon: React.ComponentType<{ className?: string }>
  texto: string
}

const SUGERENCIAS: Sugerencia[] = [
  { icon: Wallet, texto: '¿Cuánto gasté este mes en la sucursal?' },
  { icon: Users, texto: '¿Cuántos empleados están en período de prueba?' },
  { icon: ClipboardList, texto: '¿Qué solicitudes de RRHH están pendientes?' },
  { icon: Sparkles, texto: '¿Qué tareas tengo pendientes?' },
]

export function EmptyState({ onPick }: { onPick: (texto: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center animate-in fade-in duration-500">
      <div className="relative mb-5">
        <div className="heroicai-glow absolute inset-0 rounded-3xl bg-blue-500/25 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#002868] to-[#2563eb] shadow-lg shadow-blue-900/25">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-slate-800">HeroicAI</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        Tu asistente para consultar los datos del sistema. Preguntá en lenguaje natural sobre tesorería, recursos
        humanos o tareas.
      </p>

      <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGERENCIAS.map((s, i) => {
          const Icon = s.icon
          return (
            <button
              key={i}
              onClick={() => onPick(s.texto)}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md hover:shadow-blue-900/5 cursor-pointer"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563eb] transition-colors group-hover:bg-blue-100">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[13px] font-medium leading-snug text-slate-600">{s.texto}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
