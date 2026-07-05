'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

/**
 * Etiquetas amigables por herramienta: describen en español qué está
 * consultando HeroicAI mientras "piensa". La clave es el nombre de la tool
 * del backend (`Api_Heroica/src/config/heroicai/tools.ts`).
 */
const TOOL_LABELS: Record<string, string> = {
  listar_sucursales: 'Revisando las sucursales',
  resumen_movimientos: 'Analizando los movimientos',
  buscar_movimientos: 'Buscando movimientos',
  pagos_pendientes: 'Revisando pagos pendientes',
  contar_personal: 'Contando el personal',
  buscar_empleados: 'Buscando empleados',
  solicitudes_rrhh: 'Revisando solicitudes de RRHH',
  escalas_salariales: 'Consultando escalas salariales',
  mis_tareas: 'Revisando tus tareas',
  buscar_tareas: 'Buscando tareas',
}

/** Frases genéricas que rotan cuando el modelo aún no eligió una herramienta. */
const FRASES_PENSANDO = ['Pensando', 'Analizando tu consulta', 'Conectando las ideas', 'Casi listo']

interface ThinkingIndicatorProps {
  /** Nombre de la herramienta que se está ejecutando (si hay alguna). */
  tool?: string | null
}

/**
 * Indicador de "pensando" de HeroicAI. Muestra un estado dinámico:
 * si el modelo está usando una herramienta, describe qué consulta;
 * si no, rota entre frases genéricas. Acompañado de un aura pulsante
 * y texto con efecto shimmer.
 */
export function ThinkingIndicator({ tool }: ThinkingIndicatorProps) {
  const [fraseIdx, setFraseIdx] = useState(0)

  // Rotar las frases genéricas cada 2.4s (solo cuando no hay herramienta activa).
  useEffect(() => {
    if (tool) return
    const t = setInterval(() => setFraseIdx(i => (i + 1) % FRASES_PENSANDO.length), 2400)
    return () => clearInterval(t)
  }, [tool])

  const label = tool ? (TOOL_LABELS[tool] ?? 'Consultando el sistema') : FRASES_PENSANDO[fraseIdx]

  return (
    <div className="flex w-full gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
      {/* Avatar con aura pulsante */}
      <div className="relative mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center">
        <span className="heroicai-aura absolute inset-0 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#002868]" />
        <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#002868] to-[#2563eb] shadow-sm shadow-blue-900/20">
          <Sparkles className="heroicai-spark h-4 w-4 text-white" />
        </span>
      </div>

      {/* Burbuja con estado dinámico */}
      <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="heroicai-dot h-1.5 w-1.5 rounded-full bg-blue-500/70"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        {/* key fuerza el fade-in al cambiar de texto */}
        <span key={label} className="heroicai-shimmer text-[13px] font-medium animate-in fade-in duration-500">
          {label}
          <span className="heroicai-ellipsis" />
        </span>
      </div>
    </div>
  )
}
