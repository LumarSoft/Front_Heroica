'use client'

import { useRouter } from 'next/navigation'
import { Building2, Users, ArrowRight, DollarSign, BarChart2, FileCheck, Briefcase, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

// ─── Module cards ─────────────────────────────────────────────────────────────

const MODULES = [
  {
    id: 'tesoreria',
    label: 'Tesorería',
    description: 'Gestión de sucursales, cajas, pagos y reportes financieros.',
    icon: Building2,
    href: '/sucursales',
    available: true,
    color: '#002868',
    lightBg: '#EAF0FF',
    features: [
      { icon: DollarSign, text: 'Caja efectivo y banco' },
      { icon: FileCheck, text: 'Pagos pendientes' },
      { icon: BarChart2, text: 'Reportes financieros' },
    ],
  },
  {
    id: 'recursos-humanos',
    label: 'Recursos Humanos',
    description: 'Gestión de empleados, nómina y liquidaciones de personal.',
    icon: Users,
    href: '/recursos-humanos',
    available: true,
    color: '#4F7FE0',
    lightBg: '#EEF3FF',
    features: [
      { icon: Users, text: 'Gestión de empleados' },
      { icon: Briefcase, text: 'Nómina y recibos' },
      { icon: TrendingUp, text: 'Reportes de RRHH' },
    ],
  },
]

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()
  const user = useAuthStore(state => state.user)

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-br from-[#F0F5FF] via-[#F8FAFF] to-white">

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-14">

        {/* Greeting */}
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-[#7A93BB] mb-1 tracking-wide">
            {getGreeting()},
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#002868] mb-3 tracking-tight">
            {user?.nombre?.split(' ')[0] ?? 'Bienvenido'}
          </h1>
          <p className="text-[#7A93BB] text-base max-w-sm mx-auto leading-relaxed">
            Seleccioná el módulo con el que deseas trabajar hoy.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
          {MODULES.map(mod => {
            const Icon = mod.icon
            return (
              <button
                key={mod.id}
                onClick={() => router.push(mod.href)}
                className={cn(
                  'group relative bg-white rounded-3xl p-7 text-left',
                  'border border-[#E2ECF8] shadow-sm',
                  'transition-all duration-300 ease-out',
                  mod.available
                    ? 'hover:shadow-xl hover:border-[#C0D0F0] hover:-translate-y-1.5 cursor-pointer'
                    : 'hover:shadow-md hover:border-[#D8E4F8] hover:-translate-y-0.5 cursor-pointer',
                )}
              >
                {/* "Próximamente" badge */}
                {!mod.available && (
                  <span className="absolute top-5 right-5 text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                    Próximamente
                  </span>
                )}

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: mod.lightBg }}
                >
                  <Icon className="w-7 h-7" style={{ color: mod.color }} />
                </div>

                {/* Title & description */}
                <h2 className="text-lg font-bold text-[#1E293B] mb-1.5">
                  {mod.label}
                </h2>
                <p className="text-sm text-[#7A93BB] leading-relaxed mb-5">
                  {mod.description}
                </p>

                {/* Features */}
                <ul className="space-y-1.5 mb-6">
                  {mod.features.map(f => {
                    const FIcon = f.icon
                    return (
                      <li key={f.text} className="flex items-center gap-2 text-xs text-[#8BA3C4]">
                        <FIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: mod.color, opacity: 0.6 }} />
                        {f.text}
                      </li>
                    )
                  })}
                </ul>

                {/* CTA */}
                <div
                  className="flex items-center gap-1.5 text-sm font-semibold transition-all duration-200"
                  style={{ color: mod.available ? mod.color : '#94A3B8' }}
                >
                  {mod.available ? 'Ingresar' : 'Ver estado'}
                  <ArrowRight
                    className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                  />
                </div>

                {/* Hover glow for available */}
                {mod.available && (
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 20% 0%, ${mod.lightBg}80 0%, transparent 60%)`,
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-5 text-center">
        <p className="text-xs text-[#B0C0D8]">
          Developed with ❤️ by{' '}
          <a
            href="https://lumarsoft.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#002868] font-semibold hover:underline"
          >
            Lumarsoft
          </a>
        </p>
      </footer>

    </div>
  )
}
