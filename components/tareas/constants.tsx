import { Bug, Sparkles, Rocket, Circle, Clock, Loader2, FlaskConical, CheckCheck } from 'lucide-react'
import type { Tipo, Prioridad, Estado } from './types'

export const TIPO_CONFIG: Record<Tipo, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  bug: { label: 'Bug', icon: <Bug className="w-3 h-3" />, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  mejora: {
    label: 'Mejora',
    icon: <Sparkles className="w-3 h-3" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
  },
  implementacion: {
    label: 'Implementación',
    icon: <Rocket className="w-3 h-3" />,
    color: 'text-violet-600',
    bg: 'bg-violet-50 border-violet-200',
  },
  otro: {
    label: 'Otro',
    icon: <Circle className="w-3 h-3" />,
    color: 'text-slate-500',
    bg: 'bg-slate-100 border-slate-200',
  },
}

export const PRIORIDAD_CONFIG: Record<
  Prioridad,
  { label: string; border: string; dot: string; badge: string; bar: string }
> = {
  alta: {
    label: 'Alta',
    border: 'border-l-rose-500',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    bar: 'bg-rose-500',
  },
  media: {
    label: 'Media',
    border: 'border-l-amber-400',
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    bar: 'bg-amber-400',
  },
  baja: {
    label: 'Baja',
    border: 'border-l-emerald-500',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bar: 'bg-emerald-500',
  },
}

export const ESTADO_CONFIG: Record<
  Estado,
  { label: string; columnBg: string; icon: React.ReactNode; count_bg: string; badge: string }
> = {
  pendiente: {
    label: 'Pendiente',
    columnBg: 'bg-slate-50',
    icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
    count_bg: 'bg-slate-200 text-slate-700',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  en_progreso: {
    label: 'En Progreso',
    columnBg: 'bg-blue-50/50',
    icon: <Loader2 className="w-3.5 h-3.5 text-blue-500" />,
    count_bg: 'bg-blue-100 text-blue-700',
    badge: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  en_pruebas: {
    label: 'En Pruebas',
    columnBg: 'bg-violet-50/50',
    icon: <FlaskConical className="w-3.5 h-3.5 text-violet-500" />,
    count_bg: 'bg-violet-100 text-violet-700',
    badge: 'bg-violet-50 text-violet-600 border-violet-200',
  },
  completado: {
    label: 'Completado',
    columnBg: 'bg-emerald-50/50',
    icon: <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />,
    count_bg: 'bg-emerald-100 text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
}

export const COLUMNAS: Estado[] = ['pendiente', 'en_progreso', 'en_pruebas', 'completado']

export const ESTADO_SIGUIENTE: Partial<Record<Estado, Estado>> = {
  pendiente: 'en_progreso',
  en_progreso: 'en_pruebas',
  en_pruebas: 'completado',
}

export const ESTADO_ANTERIOR: Partial<Record<Estado, Estado>> = {
  en_progreso: 'pendiente',
  en_pruebas: 'en_progreso',
  completado: 'en_pruebas',
}
