'use client'

import { X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface HistorialFiltrosProps {
  filtroEstado: 'todos' | 'aprobado' | 'rechazado'
  onFiltroEstadoChange: (value: 'todos' | 'aprobado' | 'rechazado') => void
  filtroUsuario: string
  onFiltroUsuarioChange: (value: string) => void
  usuariosRevisores: string[]
  resultadosCount: number
  totalCount: number
}

export function HistorialFiltros({
  filtroEstado,
  onFiltroEstadoChange,
  filtroUsuario,
  onFiltroUsuarioChange,
  usuariosRevisores,
  resultadosCount,
  totalCount,
}: HistorialFiltrosProps) {
  const hayFiltrosActivos = filtroEstado !== 'todos' || filtroUsuario !== ''

  const handleLimpiar = () => {
    onFiltroEstadoChange('todos')
    onFiltroUsuarioChange('')
  }

  return (
    <div className="mb-6 p-4 bg-white rounded-xl border border-[#E0E0E0] shadow-sm flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-[#5A6070] uppercase tracking-wider mr-1">Estado:</span>
        {(['todos', 'aprobado', 'rechazado'] as const).map(est => (
          <button
            key={est}
            onClick={() => onFiltroEstadoChange(est)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              filtroEstado === est
                ? est === 'todos'
                  ? 'bg-[#002868] text-white border-[#002868]'
                  : est === 'aprobado'
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-rose-500 text-white border-rose-500'
                : 'bg-white text-[#666666] border-[#E0E0E0] hover:border-[#B0B0B0]'
            }`}
          >
            {est === 'todos' ? 'Todos' : est === 'aprobado' ? 'Aprobados' : 'Rechazados'}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-[#E0E0E0]" />

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#5A6070] uppercase tracking-wider">Revisado por:</span>
        <Select value={filtroUsuario || '_all_'} onValueChange={v => onFiltroUsuarioChange(v === '_all_' ? '' : v)}>
          <SelectTrigger className="h-8 rounded-lg border-[#E0E0E0] text-sm text-[#1A1A1A] min-w-[160px] focus:ring-[#002868]/20">
            <SelectValue placeholder="Todos los usuarios" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all_">Todos los usuarios</SelectItem>
            {usuariosRevisores.map(nombre => (
              <SelectItem key={nombre} value={nombre}>
                {nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hayFiltrosActivos && (
        <>
          <div className="h-5 w-px bg-[#E0E0E0]" />
          <button
            onClick={handleLimpiar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#666666] bg-[#F5F5F5] hover:bg-[#ECECEC] border border-[#E0E0E0] transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </>
      )}

      <div className="ml-auto">
        <span className="text-xs text-[#8A8F9C]">
          {resultadosCount} resultado{resultadosCount !== 1 ? 's' : ''}
          {hayFiltrosActivos && ` de ${totalCount}`}
        </span>
      </div>
    </div>
  )
}
