'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Bug,
  Sparkles,
  Rocket,
  Circle,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CheckCheck,
  Clock,
  Loader2,
  LayoutList,
  Search,
  X,
  CalendarDays,
  User,
  RefreshCw,
  FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/config';
import { apiFetch } from '@/lib/api';
import { PageLoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tipo = 'bug' | 'mejora' | 'implementacion' | 'otro';
type Prioridad = 'alta' | 'media' | 'baja';
type Estado = 'pendiente' | 'en_progreso' | 'en_pruebas' | 'completado';

interface Tarea {
  id: number;
  codigo: string;
  version: string | null;
  titulo: string;
  descripcion: string | null;
  tipo: Tipo;
  prioridad: Prioridad;
  estado: Estado;
  creado_por: number | null;
  creado_por_nombre: string | null;
  asignado_a: number | null;
  asignado_a_nombre: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface UsuarioBasico {
  id: number;
  nombre: string;
}

// ─── Static maps ──────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<
  Tipo,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  bug: {
    label: 'Bug',
    icon: <Bug className="w-3 h-3" />,
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
  },
  mejora: {
    label: 'Mejora',
    icon: <Sparkles className="w-3 h-3" />,
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
  },
  implementacion: {
    label: 'Implementación',
    icon: <Rocket className="w-3 h-3" />,
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
  },
  otro: {
    label: 'Otro',
    icon: <Circle className="w-3 h-3" />,
    color: 'text-gray-600',
    bg: 'bg-gray-100 border-gray-200',
  },
};

const PRIORIDAD_CONFIG: Record<
  Prioridad,
  { label: string; border: string; dot: string; badge: string }
> = {
  alta: {
    label: 'Alta',
    border: 'border-l-red-500',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
  },
  media: {
    label: 'Media',
    border: 'border-l-amber-400',
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  baja: {
    label: 'Baja',
    border: 'border-l-green-500',
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700 border-green-200',
  },
};

const ESTADO_CONFIG: Record<
  Estado,
  { label: string; header: string; icon: React.ReactNode; count_bg: string }
> = {
  pendiente: {
    label: 'Pendiente',
    header: 'bg-gray-50 border-gray-200',
    icon: <Clock className="w-4 h-4 text-gray-500" />,
    count_bg: 'bg-gray-200 text-gray-700',
  },
  en_progreso: {
    label: 'En Progreso',
    header: 'bg-blue-50 border-blue-200',
    icon: <Loader2 className="w-4 h-4 text-blue-500" />,
    count_bg: 'bg-blue-100 text-blue-700',
  },
  en_pruebas: {
    label: 'En Pruebas',
    header: 'bg-purple-50 border-purple-200',
    icon: <FlaskConical className="w-4 h-4 text-purple-500" />,
    count_bg: 'bg-purple-100 text-purple-700',
  },
  completado: {
    label: 'Completado',
    header: 'bg-green-50 border-green-200',
    icon: <CheckCheck className="w-4 h-4 text-green-600" />,
    count_bg: 'bg-green-100 text-green-700',
  },
};

const COLUMNAS: Estado[] = [
  'pendiente',
  'en_progreso',
  'en_pruebas',
  'completado',
];

const ESTADO_SIGUIENTE: Partial<Record<Estado, Estado>> = {
  pendiente: 'en_progreso',
  en_progreso: 'en_pruebas',
  en_pruebas: 'completado',
};

const ESTADO_ANTERIOR: Partial<Record<Estado, Estado>> = {
  en_progreso: 'pendiente',
  en_pruebas: 'en_progreso',
  completado: 'en_pruebas',
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Task Card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  tarea: Tarea;
  onViewDetail: (t: Tarea) => void;
  onEdit: (t: Tarea) => void;
  onDelete: (t: Tarea) => void;
  onMoveForward: (t: Tarea) => void;
  onMoveBack: (t: Tarea) => void;
  moving: boolean;
  searchQuery: string;
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi',
  );
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-200 text-[#1A1A1A] rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

function TaskCard({
  tarea,
  onViewDetail,
  onEdit,
  onDelete,
  onMoveForward,
  onMoveBack,
  moving,
  searchQuery,
}: TaskCardProps) {
  const tipo = TIPO_CONFIG[tarea.tipo];
  const prio = PRIORIDAD_CONFIG[tarea.prioridad];
  const canGoForward = !!ESTADO_SIGUIENTE[tarea.estado];
  const canGoBack = !!ESTADO_ANTERIOR[tarea.estado];
  const isDone = tarea.estado === 'completado';

  return (
    <div
      onClick={() => onViewDetail(tarea)}
      className={cn(
        'bg-white rounded-lg border border-[#E0E0E0] shadow-sm border-l-4 p-4 flex flex-col gap-3 transition-all hover:shadow-md cursor-pointer group',
        prio.border,
        isDone && 'opacity-70',
      )}
    >
      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#002868] text-white border border-[#002868]">
          {tarea.codigo}
        </span>
        {tarea.version && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-white text-[#002868] border border-[#002868]">
            v{tarea.version}
          </span>
        )}
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
            tipo.bg,
            tipo.color,
          )}
        >
          {tipo.icon}
          {tipo.label}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
            prio.badge,
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', prio.dot)} />
          {prio.label}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-[#1A1A1A] leading-snug group-hover:text-[#002868] transition-colors">
        {highlightText(tarea.titulo, searchQuery)}
      </p>

      {/* Description */}
      {tarea.descripcion && (
        <p className="text-xs text-[#666666] leading-relaxed line-clamp-3">
          {highlightText(tarea.descripcion, searchQuery)}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[#F0F0F0]">
        <span className="text-[10px] text-[#999] font-medium">
          {formatDate(tarea.created_at)}
        </span>
        <div className="flex items-center gap-2">
          {tarea.asignado_a_nombre && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#002868] font-semibold bg-[#002868]/8 px-1.5 py-0.5 rounded-full">
              <User className="w-2.5 h-2.5" />
              {tarea.asignado_a_nombre.split(' ')[0]}
            </span>
          )}
          {tarea.creado_por_nombre && (
            <span className="text-[10px] text-[#999]">
              {tarea.creado_por_nombre.split(' ')[0]}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-wrap">
        {canGoBack && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveBack(tarea);
            }}
            disabled={moving}
            title="Mover atrás"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#666] border border-[#E0E0E0] hover:bg-[#F5F5F5] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3 h-3" />
            Atrás
          </button>
        )}

        {canGoForward && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveForward(tarea);
            }}
            disabled={moving}
            title="Mover adelante"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white bg-[#002868] hover:bg-[#003d8f] disabled:opacity-40 transition-colors cursor-pointer"
          >
            Avanzar
            <ChevronRight className="w-3 h-3" />
          </button>
        )}

        {!isDone && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(tarea);
              }}
              title="Editar"
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#002868] border border-[#002868]/20 hover:bg-[#002868]/5 transition-colors cursor-pointer ml-auto"
            >
              <Pencil className="w-3 h-3" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(tarea);
              }}
              title="Eliminar"
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-red-600 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Empty Column Placeholder ──────────────────────────────────────────────────

function EmptyColumn() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-[#E8E8E8] rounded-lg">
      <LayoutList className="w-8 h-8 text-[#D0D0D0] mb-2" />
      <p className="text-xs text-[#BBBBBB] font-medium">Sin tareas</p>
    </div>
  );
}

// ─── Tarea Dialog ──────────────────────────────────────────────────────────────

interface TareaDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    titulo: string;
    descripcion: string;
    tipo: Tipo;
    prioridad: Prioridad;
    version: string;
    asignado_a: number | null;
  }) => Promise<void>;
  saving: boolean;
  initial?: Tarea | null;
  usuarios: UsuarioBasico[];
}

function TareaDialog({
  open,
  onClose,
  onSave,
  saving,
  initial,
  usuarios,
}: TareaDialogProps) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [version, setVersion] = useState('');
  const [tipo, setTipo] = useState<Tipo>('otro');
  const [prioridad, setPrioridad] = useState<Prioridad>('media');
  const [asignadoA, setAsignadoA] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setTitulo(initial?.titulo ?? '');
      setDescripcion(initial?.descripcion ?? '');
      setVersion(initial?.version ?? '');
      setTipo(initial?.tipo ?? 'otro');
      setPrioridad(initial?.prioridad ?? 'media');
      setAsignadoA(initial?.asignado_a ?? null);
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    await onSave({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      version: version.trim(),
      tipo,
      prioridad,
      asignado_a: asignadoA,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#002868]">
            {initial ? 'Editar Tarea' : 'Nueva Tarea'}
          </DialogTitle>
          <DialogDescription className="text-[#666666]">
            {initial
              ? 'Modificá los datos de la tarea.'
              : 'Describí la mejora, bug o implementación que quieras reportar.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Título */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="titulo"
                  className="text-[#002868] font-semibold"
                >
                  Título *
                </Label>
                <Input
                  id="titulo"
                  placeholder="Ej: El botón de guardar no responde"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="version"
                  className="text-[#002868] font-semibold"
                >
                  Versión
                </Label>
                <Input
                  id="version"
                  placeholder="Ej: 2604"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
                />
              </div>
            </div>

            {/* Tipo + Prioridad */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#002868] font-semibold">Tipo *</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
                  <SelectTrigger className="border-[#E0E0E0] focus:border-[#002868]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">🐛 Bug</SelectItem>
                    <SelectItem value="mejora">✨ Mejora</SelectItem>
                    <SelectItem value="implementacion">
                      🚀 Implementación
                    </SelectItem>
                    <SelectItem value="otro">○ Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[#002868] font-semibold">
                  Prioridad *
                </Label>
                <Select
                  value={prioridad}
                  onValueChange={(v) => setPrioridad(v as Prioridad)}
                >
                  <SelectTrigger className="border-[#E0E0E0] focus:border-[#002868]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">🔴 Alta</SelectItem>
                    <SelectItem value="media">🟡 Media</SelectItem>
                    <SelectItem value="baja">🟢 Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Asignar a */}
            <div className="space-y-2">
              <Label className="text-[#002868] font-semibold">Asignar a</Label>
              <Select
                value={asignadoA !== null ? String(asignadoA) : 'sin_asignar'}
                onValueChange={(v) =>
                  setAsignadoA(v === 'sin_asignar' ? null : Number(v))
                }
              >
                <SelectTrigger className="border-[#E0E0E0] focus:border-[#002868]">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label
                htmlFor="descripcion"
                className="text-[#002868] font-semibold"
              >
                Descripción
              </Label>
              <textarea
                id="descripcion"
                placeholder="Describí con más detalle el problema o la mejora solicitada..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-md focus:outline-none focus:border-[#002868] focus:ring-1 focus:ring-[#002868] resize-none placeholder:text-[#AAAAAA]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !titulo.trim()}
              className="bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : initial ? (
                'Guardar Cambios'
              ) : (
                'Crear Tarea'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteDialog({
  tarea,
  onClose,
  onConfirm,
  deleting,
}: {
  tarea: Tarea | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deleting: boolean;
}) {
  return (
    <Dialog open={!!tarea} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600">
            Eliminar Tarea
          </DialogTitle>
          <DialogDescription className="text-[#666666]">
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        {tarea && (
          <div className="py-2">
            <div className="p-4 bg-[#F5F5F5] rounded-lg border border-[#E0E0E0]">
              <p className="font-semibold text-[#002868] text-sm">
                {tarea.titulo}
              </p>
              {tarea.descripcion && (
                <p className="text-xs text-[#666] mt-1 line-clamp-2">
                  {tarea.descripcion}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleting}
            className="border-[#E0E0E0] text-[#666666] cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
          >
            {deleting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Eliminando...
              </span>
            ) : (
              'Eliminar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

interface DetailDialogProps {
  tarea: Tarea | null;
  onClose: () => void;
  onEdit: (t: Tarea) => void;
  onMoveForward: (t: Tarea) => void;
  onMoveBack: (t: Tarea) => void;
  moving: boolean;
}

function DetailDialog({
  tarea,
  onClose,
  onEdit,
  onMoveForward,
  onMoveBack,
  moving,
}: DetailDialogProps) {
  if (!tarea) return null;

  const tipo = TIPO_CONFIG[tarea.tipo];
  const prio = PRIORIDAD_CONFIG[tarea.prioridad];
  const estado = ESTADO_CONFIG[tarea.estado];
  const canGoForward = !!ESTADO_SIGUIENTE[tarea.estado];
  const canGoBack = !!ESTADO_ANTERIOR[tarea.estado];
  const isDone = tarea.estado === 'completado';

  return (
    <Dialog open={!!tarea} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
        {/* Colored top bar based on priority */}
        <div
          className={cn(
            'h-1.5 w-full',
            tarea.prioridad === 'alta' && 'bg-red-500',
            tarea.prioridad === 'media' && 'bg-amber-400',
            tarea.prioridad === 'baja' && 'bg-green-500',
          )}
        />

        <div className="p-6">
          <DialogHeader className="mb-4">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#002868] text-white border border-[#002868]">
                {tarea.codigo}
              </span>
              {tarea.version && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-white text-[#002868] border border-[#002868]">
                  v{tarea.version}
                </span>
              )}
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
                  tipo.bg,
                  tipo.color,
                )}
              >
                {tipo.icon}
                {tipo.label}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border',
                  prio.badge,
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', prio.dot)} />
                {prio.label}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border',
                  estado.header,
                )}
              >
                {estado.icon}
                {estado.label}
              </span>
            </div>

            <DialogTitle className="text-xl font-bold text-[#1A1A1A] text-left leading-snug">
              {tarea.titulo}
            </DialogTitle>
          </DialogHeader>

          {/* Description */}
          {tarea.descripcion ? (
            <div className="bg-[#F8F9FA] rounded-lg p-4 mb-5 border border-[#EBEBEB]">
              <p className="text-sm text-[#444] leading-relaxed whitespace-pre-wrap">
                {tarea.descripcion}
              </p>
            </div>
          ) : (
            <div className="bg-[#F8F9FA] rounded-lg p-4 mb-5 border border-dashed border-[#D8D8D8]">
              <p className="text-xs text-[#AAAAAA] italic">Sin descripción.</p>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="flex items-start gap-2">
              <CalendarDays className="w-3.5 h-3.5 text-[#999] mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">
                  Creada
                </p>
                <p className="text-xs text-[#444] font-medium">
                  {formatDate(tarea.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-[#999] mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">
                  Actualizada
                </p>
                <p className="text-xs text-[#444] font-medium">
                  {formatDate(tarea.updated_at)}
                </p>
              </div>
            </div>

            {tarea.creado_por_nombre && (
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-[#999] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">
                    Reportada por
                  </p>
                  <p className="text-xs text-[#444] font-medium">
                    {tarea.creado_por_nombre}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <User className="w-3.5 h-3.5 text-[#002868] mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">
                  Asignada a
                </p>
                <p className="text-xs text-[#444] font-medium">
                  {tarea.asignado_a_nombre ?? (
                    <span className="text-[#AAAAAA] italic">Sin asignar</span>
                  )}
                </p>
              </div>
            </div>

            {tarea.completed_at && (
              <div className="flex items-start gap-2">
                <CheckCheck className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#999]">
                    Completada
                  </p>
                  <p className="text-xs text-[#444] font-medium">
                    {formatDate(tarea.completed_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-[#E0E0E0] px-6 py-4 flex items-center justify-between gap-2 bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            {canGoBack && (
              <Button
                variant="outline"
                size="sm"
                disabled={moving}
                onClick={() => {
                  onMoveBack(tarea);
                  onClose();
                }}
                className="border-[#E0E0E0] text-[#555] hover:bg-[#F0F0F0] cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Mover atrás
              </Button>
            )}
            {canGoForward && (
              <Button
                size="sm"
                disabled={moving}
                onClick={() => {
                  onMoveForward(tarea);
                  onClose();
                }}
                className="bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
              >
                Avanzar
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
            {!isDone && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(tarea);
                }}
                className="border-[#002868]/20 text-[#002868] hover:bg-[#002868]/5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TareasPage() {
  const { user, isGuardLoading, handleLogout } = useAuthGuard();

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | Tipo>('all');
  const [filterPrioridad, setFilterPrioridad] = useState<'all' | Prioridad>('all');
  const [filterVersion, setFilterVersion] = useState<string>('all');

  // Detail view
  const [detailTarget, setDetailTarget] = useState<Tarea | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tarea | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Tarea | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [movingId, setMovingId] = useState<number | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isGuardLoading) return;
    fetchTareas();
    fetchUsuarios();
  }, [isGuardLoading]);

  async function fetchTareas() {
    try {
      const res = await apiFetch(API_ENDPOINTS.TAREAS.GET_ALL);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTareas(data.data);
    } catch {
      toast.error('Error al cargar las tareas');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUsuarios() {
    try {
      const res = await apiFetch(API_ENDPOINTS.TAREAS.GET_USUARIOS);
      const data = await res.json();
      if (res.ok) setUsuarios(data.data);
    } catch {
      // silencioso: no bloquea la carga principal
    }
  }

  // ─── Create / Update ────────────────────────────────────────────────────────

  async function handleSave(formData: {
    titulo: string;
    descripcion: string;
    tipo: Tipo;
    prioridad: Prioridad;
    version: string;
    asignado_a: number | null;
  }) {
    setSaving(true);
    try {
      if (editTarget) {
        const res = await apiFetch(API_ENDPOINTS.TAREAS.UPDATE(editTarget.id), {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setTareas((prev) =>
          prev.map((t) => (t.id === editTarget.id ? data.data : t)),
        );
        toast.success('Tarea actualizada');
      } else {
        const res = await apiFetch(API_ENDPOINTS.TAREAS.CREATE, {
          method: 'POST',
          body: JSON.stringify({ ...formData, creado_por: user?.id ?? null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setTareas((prev) => [data.data, ...prev]);
        toast.success('Tarea creada');
      }
      setDialogOpen(false);
      setEditTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  // ─── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.TAREAS.DELETE(deleteTarget.id), {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTareas((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success('Tarea eliminada');
      setDeleteTarget(null);
    } catch {
      toast.error('Error al eliminar la tarea');
    } finally {
      setDeleting(false);
    }
  }

  // ─── Estado change ──────────────────────────────────────────────────────────

  async function handleMoveEstado(tarea: Tarea, nuevoEstado: Estado) {
    setMovingId(tarea.id);
    try {
      const res = await apiFetch(API_ENDPOINTS.TAREAS.UPDATE_ESTADO(tarea.id), {
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTareas((prev) => prev.map((t) => (t.id === tarea.id ? data.data : t)));
      toast.success(`Tarea movida a "${ESTADO_CONFIG[nuevoEstado].label}"`);
    } catch {
      toast.error('Error al cambiar el estado');
    } finally {
      setMovingId(null);
    }
  }

  // ─── Filtered + grouped ──────────────────────────────────────────────────────

  const versionesDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const t of tareas) {
      if (t.version) set.add(t.version);
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [tareas]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tareas.filter((t) => {
      if (filterTipo !== 'all' && t.tipo !== filterTipo) return false;
      if (filterPrioridad !== 'all' && t.prioridad !== filterPrioridad) return false;
      if (filterVersion !== 'all') {
        if (filterVersion === 'sin_version') {
          if (t.version) return false;
        } else {
          if (t.version !== filterVersion) return false;
        }
      }
      if (q) {
        const inTitle = t.titulo.toLowerCase().includes(q);
        const inDesc = t.descripcion?.toLowerCase().includes(q) ?? false;
        if (!inTitle && !inDesc) return false;
      }
      return true;
    });
  }, [tareas, filterTipo, filterPrioridad, filterVersion, searchQuery]);

  const grouped = useMemo(() => {
    const map: Record<Estado, Tarea[]> = {
      pendiente: [],
      en_progreso: [],
      en_pruebas: [],
      completado: [],
    };
    for (const t of filtered) {
      map[t.estado].push(t);
    }
    return map;
  }, [filtered]);

  // ─── Stats ───────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = tareas.length;
    const pendientes = tareas.filter((t) => t.estado === 'pendiente').length;
    const enProgreso = tareas.filter((t) => t.estado === 'en_progreso').length;
    const enPruebas = tareas.filter((t) => t.estado === 'en_pruebas').length;
    const completados = tareas.filter((t) => t.estado === 'completado').length;
    return { total, pendientes, enProgreso, enPruebas, completados };
  }, [tareas]);

  // ─── Guard ───────────────────────────────────────────────────────────────────

  if (isGuardLoading) return <PageLoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <Navbar
        userName={user?.nombre}
        userRole={user?.rol}
        onLogout={handleLogout}
        showBackButton
        backUrl="/sucursales"
      />

      <main className="container mx-auto px-6 py-10 flex-1">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#002868] mb-1">
              Tablero de Tareas
            </h1>
            <p className="text-[#666666] text-base">
              Reportá bugs, mejoras e implementaciones para el equipo.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditTarget(null);
              setDialogOpen(true);
            }}
            className="bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </Button>
        </div>

        {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            {
              label: 'Total',
              value: stats.total,
              color: 'text-[#002868]',
              bg: 'bg-[#002868]/8',
            },
            {
              label: 'Pendientes',
              value: stats.pendientes,
              color: 'text-gray-600',
              bg: 'bg-gray-100',
            },
            {
              label: 'En Progreso',
              value: stats.enProgreso,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              label: 'En Pruebas',
              value: stats.enPruebas,
              color: 'text-purple-600',
              bg: 'bg-purple-50',
            },
            {
              label: 'Completadas',
              value: stats.completados,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
          ].map((s) => (
            <div
              key={s.label}
              className={cn(
                'rounded-xl p-4 border border-[#E0E0E0] bg-white flex flex-col gap-1 shadow-sm',
              )}
            >
              <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">
                {s.label}
              </span>
              <span className={cn('text-3xl font-bold', s.color)}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Filters ────────────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-sm p-4 mb-6 flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#002868] focus:ring-1 focus:ring-[#002868] placeholder:text-[#BBBBBB] bg-[#FAFAFA]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#555] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="border-t border-[#F0F0F0]" />

          {/* Tipo + Prioridad + Versión */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:divide-x sm:divide-[#E0E0E0]">
            {/* Tipo */}
            <div className="flex flex-col gap-2 sm:pr-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#999]">
                Tipo
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  ['all', 'bug', 'mejora', 'implementacion', 'otro'] as const
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterTipo(t)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer',
                      filterTipo === t
                        ? 'bg-[#002868] text-white border-[#002868]'
                        : 'bg-[#F5F5F5] text-[#555] border-transparent hover:border-[#002868] hover:text-[#002868]',
                    )}
                  >
                    {t === 'all' ? 'Todos' : TIPO_CONFIG[t as Tipo].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prioridad */}
            <div className="flex flex-col gap-2 sm:px-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#999]">
                Prioridad
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'alta', 'media', 'baja'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPrioridad(p)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer',
                      filterPrioridad === p
                        ? 'bg-[#002868] text-white border-[#002868]'
                        : 'bg-[#F5F5F5] text-[#555] border-transparent hover:border-[#002868] hover:text-[#002868]',
                    )}
                  >
                    {p === 'all'
                      ? 'Todas'
                      : PRIORIDAD_CONFIG[p as Prioridad].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Versión */}
            <div className="flex flex-col gap-2 sm:pl-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#999]">
                Versión
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setFilterVersion('all')}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer',
                    filterVersion === 'all'
                      ? 'bg-[#002868] text-white border-[#002868]'
                      : 'bg-[#F5F5F5] text-[#555] border-transparent hover:border-[#002868] hover:text-[#002868]',
                  )}
                >
                  Todas
                </button>
                {versionesDisponibles.map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilterVersion(v)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer',
                      filterVersion === v
                        ? 'bg-[#002868] text-white border-[#002868]'
                        : 'bg-[#F5F5F5] text-[#555] border-transparent hover:border-[#002868] hover:text-[#002868]',
                    )}
                  >
                    v{v}
                  </button>
                ))}
                <button
                  onClick={() => setFilterVersion('sin_version')}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer',
                    filterVersion === 'sin_version'
                      ? 'bg-[#002868] text-white border-[#002868]'
                      : 'bg-[#F5F5F5] text-[#555] border-transparent hover:border-[#002868] hover:text-[#002868]',
                  )}
                >
                  Sin versión
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Kanban Board ───────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-[#002868]/20 border-t-[#002868] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {COLUMNAS.map((estado) => {
              const cfg = ESTADO_CONFIG[estado];
              const cards = grouped[estado];

              return (
                <div key={estado} className="flex flex-col gap-3">
                  {/* Column Header */}
                  <div
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-xl border font-semibold',
                      cfg.header,
                    )}
                  >
                    <div className="flex items-center gap-2 text-[#333] text-sm">
                      {cfg.icon}
                      {cfg.label}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        cfg.count_bg,
                      )}
                    >
                      {cards.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-3 min-h-[120px]">
                    {cards.length === 0 ? (
                      <EmptyColumn />
                    ) : (
                      cards.map((t) => (
                        <TaskCard
                          key={t.id}
                          tarea={t}
                          moving={movingId === t.id}
                          searchQuery={searchQuery}
                          onViewDetail={setDetailTarget}
                          onEdit={(tarea) => {
                            setEditTarget(tarea);
                            setDialogOpen(true);
                          }}
                          onDelete={setDeleteTarget}
                          onMoveForward={(tarea) =>
                            handleMoveEstado(
                              tarea,
                              ESTADO_SIGUIENTE[tarea.estado]!,
                            )
                          }
                          onMoveBack={(tarea) =>
                            handleMoveEstado(
                              tarea,
                              ESTADO_ANTERIOR[tarea.estado]!,
                            )
                          }
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 mt-auto border-t border-[#E0E0E0] text-center text-[#666666] text-sm">
        Developed with ❤️ by{' '}
        <a
          href="https://lumarsoft.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#002868] hover:underline font-semibold"
        >
          Lumarsoft
        </a>
      </footer>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <TareaDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(null);
        }}
        onSave={handleSave}
        saving={saving}
        initial={editTarget}
        usuarios={usuarios}
      />

      <DeleteDialog
        tarea={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      <DetailDialog
        tarea={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={(t) => {
          setDetailTarget(null);
          setEditTarget(t);
          setDialogOpen(true);
        }}
        onMoveForward={(t) => handleMoveEstado(t, ESTADO_SIGUIENTE[t.estado]!)}
        onMoveBack={(t) => handleMoveEstado(t, ESTADO_ANTERIOR[t.estado]!)}
        moving={movingId === detailTarget?.id}
      />
    </div>
  );
}
