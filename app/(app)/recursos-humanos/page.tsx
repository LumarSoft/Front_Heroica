'use client'

import { Users, Clock, Briefcase, TrendingUp } from 'lucide-react'

export default function RecursosHumanosPage() {
  return (
    <div className="min-h-full bg-[#F8F9FA]">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 max-w-4xl">

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#002868] flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#002868]">Recursos Humanos</h1>
              <p className="text-[#666666] text-sm">Gestión de personal y empleados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[#002868]/8 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-[#002868]/60" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3">Módulo en desarrollo</h2>
          <p className="text-[#666666] text-base max-w-md mx-auto leading-relaxed">
            El módulo de Recursos Humanos está siendo construido. Pronto tendrás acceso a toda la gestión de personal.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            {[
              { icon: Users, label: 'Gestión de empleados', desc: 'Altas, bajas y modificaciones' },
              { icon: Briefcase, label: 'Nómina y sueldos', desc: 'Liquidaciones y recibos de haberes' },
              { icon: TrendingUp, label: 'Reportes de RRHH', desc: 'Análisis y métricas de personal' },
            ].map(feature => (
              <div key={feature.label} className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E0E0E0]">
                <div className="w-8 h-8 rounded-lg bg-[#002868]/10 flex items-center justify-center mb-2">
                  <feature.icon className="w-4 h-4 text-[#002868]" />
                </div>
                <p className="text-sm font-semibold text-[#1A1A1A] mb-0.5">{feature.label}</p>
                <p className="text-xs text-[#9AA0AC]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
