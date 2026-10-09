'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { cn } from '@/lib/utils'
import type { Categoria, Subcategoria } from '@/lib/types'

/**
 * Grilla editable de descripciones.
 *
 * - Se edita directo en la celda. Los cambios quedan en `drafts` (por id) y se
 *   marcan en ámbar; se guardan todos juntos con "Guardar cambios" (todo o nada).
 * - El buscador, los filtros y el orden usan los valores GUARDADOS, no los que se
 *   están editando: así una fila no salta de lugar ni desaparece mientras se tipea.
 * - El orden alfabético ignora mayúsculas, tildes y espacios de más, así las
 *   descripciones repetidas quedan una debajo de la otra.
 */

type Tipo = 'ingreso' | 'egreso'

export interface FilaDescripcion {
  id: number
  nombre: string
  tipo: Tipo | null
  categoria_id: number | null
  subcategoria_id: number | null
  activo: boolean
}

type SortKey = 'nombre' | 'tipo' | 'categoria' | 'subcategoria' | 'activo'
type SortDir = 'asc' | 'desc'

interface Props {
  items: FilaDescripcion[]
  categorias: Categoria[]
  subcategorias: Subcategoria[]
  isLoading: boolean
  onSaved: () => void | Promise<void>
  onDelete: (fila: FilaDescripcion) => void
  /** Ids eliminados desde afuera: se descartan sus borradores. */
  deletedIds?: number[]
}

const TIPO_LABEL: Record<Tipo, string> = { ingreso: 'Ingreso', egreso: 'Egreso' }
const PAGE_SIZES = [50, 100, 200]

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true })
const limpiar = (s: string) => s.replace(/\s+/g, ' ').trim()
const normalizar = (s: string) => limpiar(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function iguales(a: FilaDescripcion, b: FilaDescripcion) {
  return (
    a.nombre === b.nombre &&
    a.tipo === b.tipo &&
    a.categoria_id === b.categoria_id &&
    a.subcategoria_id === b.subcategoria_id &&
    a.activo === b.activo
  )
}

const cellBase =
  'w-full h-8 rounded-md border bg-white px-2 text-sm text-[#1A1A1A] transition-colors focus:border-[#002868] focus:outline-none focus:ring-2 focus:ring-[#002868]/20 disabled:opacity-40 disabled:cursor-not-allowed'
const cellNormal = 'border-transparent hover:border-[#E0E0E0]'
const cellDirty = 'border-amber-300 bg-amber-50'

export function DescripcionesTabla({
  items,
  categorias,
  subcategorias,
  isLoading,
  onSaved,
  onDelete,
  deletedIds,
}: Props) {
  const [drafts, setDrafts] = useState<Record<number, FilaDescripcion>>({})
  const [errores, setErrores] = useState<Record<number, string[]>>({})
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | Tipo>('todos')
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'activas' | 'inactivas'>('todas')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'nombre', dir: 'asc' })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])
  const [isSaving, setIsSaving] = useState(false)

  const categoriasPorId = useMemo(() => new Map(categorias.map(c => [c.id, c])), [categorias])
  const subcategoriasPorId = useMemo(() => new Map(subcategorias.map(s => [s.id, s])), [subcategorias])
  const itemsPorId = useMemo(() => new Map(items.map(i => [i.id, i])), [items])

  const nombreCategoria = (id: number | null) => (id !== null ? (categoriasPorId.get(id)?.nombre ?? '') : '')
  const nombreSubcategoria = (id: number | null) => (id !== null ? (subcategoriasPorId.get(id)?.nombre ?? '') : '')

  // Borradores de filas que ya no existen (eliminadas o recargadas) se descartan.
  useEffect(() => {
    setDrafts(prev => {
      const next: Record<number, FilaDescripcion> = {}
      let cambio = false
      for (const [id, d] of Object.entries(prev)) {
        const saved = itemsPorId.get(Number(id))
        if (saved && !deletedIds?.includes(Number(id)) && !iguales(saved, d)) next[Number(id)] = d
        else cambio = true
      }
      return cambio ? next : prev
    })
  }, [itemsPorId, deletedIds])

  const cantidadCambios = Object.keys(drafts).length

  // Aviso del navegador si se cierra o recarga con cambios sin guardar.
  useEffect(() => {
    if (cantidadCambios === 0) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [cantidadCambios])

  useEffect(() => {
    setPage(0)
  }, [search, filtroTipo, filtroEstado, sort, pageSize])

  // ── Filtrar + ordenar (sobre valores guardados) ────────────
  const filas = useMemo(() => {
    const catNombre = (id: number | null) => (id !== null ? (categoriasPorId.get(id)?.nombre ?? '') : '')
    const subNombre = (id: number | null) => (id !== null ? (subcategoriasPorId.get(id)?.nombre ?? '') : '')
    const q = normalizar(search)
    const filtradas = items.filter(i => {
      if (filtroTipo !== 'todos' && i.tipo !== filtroTipo) return false
      if (filtroEstado === 'activas' && !i.activo) return false
      if (filtroEstado === 'inactivas' && i.activo) return false
      if (!q) return true
      const texto = normalizar(`${i.nombre} ${catNombre(i.categoria_id)} ${subNombre(i.subcategoria_id)}`)
      return q.split(' ').every(palabra => texto.includes(palabra))
    })

    const valor = (i: FilaDescripcion): string => {
      switch (sort.key) {
        case 'nombre':
          return limpiar(i.nombre)
        case 'tipo':
          return i.tipo ? TIPO_LABEL[i.tipo] : ''
        case 'categoria':
          return catNombre(i.categoria_id)
        case 'subcategoria':
          return subNombre(i.subcategoria_id)
        case 'activo':
          return i.activo ? 'Sí' : 'No'
      }
    }
    const signo = sort.dir === 'asc' ? 1 : -1
    return [...filtradas].sort((a, b) => {
      const va = valor(a)
      const vb = valor(b)
      // Los vacíos siempre al final, en cualquier dirección.
      if (!va && vb) return 1
      if (va && !vb) return -1
      const cmp = collator.compare(va, vb) * signo
      if (cmp !== 0) return cmp
      return collator.compare(limpiar(a.nombre), limpiar(b.nombre)) || a.id - b.id
    })
  }, [items, search, filtroTipo, filtroEstado, sort, categoriasPorId, subcategoriasPorId])

  const totalPaginas = Math.max(1, Math.ceil(filas.length / pageSize))
  const paginaActual = Math.min(page, totalPaginas - 1)
  const desde = paginaActual * pageSize
  const visibles = filas.slice(desde, desde + pageSize)

  // ── Edición ────────────────────────────────────────────────
  const setCampo = (id: number, patch: Partial<FilaDescripcion>) => {
    const saved = itemsPorId.get(id)
    if (!saved) return
    setDrafts(prev => {
      const next = { ...(prev[id] ?? saved), ...patch }
      const copia = { ...prev }
      if (iguales(next, saved)) delete copia[id]
      else copia[id] = next
      return copia
    })
    if (errores[id]) {
      setErrores(prev => {
        const copia = { ...prev }
        delete copia[id]
        return copia
      })
    }
  }

  const cambiarTipo = (fila: FilaDescripcion, tipo: Tipo | null) => {
    const categoria = fila.categoria_id !== null ? categoriasPorId.get(fila.categoria_id) : undefined
    const incompatible = !!tipo && !!categoria?.tipo && categoria.tipo !== tipo
    setCampo(fila.id, incompatible ? { tipo, categoria_id: null, subcategoria_id: null } : { tipo })
  }

  const revertir = (id: number) => {
    setDrafts(prev => {
      const copia = { ...prev }
      delete copia[id]
      return copia
    })
    setErrores(prev => {
      const copia = { ...prev }
      delete copia[id]
      return copia
    })
  }

  const descartarTodo = () => {
    setDrafts({})
    setErrores({})
  }

  const guardar = async () => {
    const cambios = Object.values(drafts).map(d => ({ ...d, nombre: limpiar(d.nombre) }))
    if (cambios.length === 0) return

    // Validación rápida en el cliente; el servidor valida todo de nuevo.
    const locales: Record<number, string[]> = {}
    for (const d of cambios) {
      const msgs: string[] = []
      if (!d.nombre) msgs.push('Falta el nombre.')
      if (!d.tipo && itemsPorId.get(d.id)?.tipo) msgs.push('Falta el tipo.')
      if (msgs.length) locales[d.id] = msgs
    }
    if (Object.keys(locales).length > 0) {
      setErrores(locales)
      toast.error('Hay cambios con errores. Revisá las filas marcadas en rojo.')
      return
    }

    setIsSaving(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.UPDATE_LOTE, {
        method: 'PUT',
        body: JSON.stringify({ descripciones: cambios }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        if (Array.isArray(data.errores)) {
          const porId: Record<number, string[]> = {}
          for (const e of data.errores as { id: number; mensaje: string }[]) {
            porId[e.id] = [...(porId[e.id] ?? []), e.mensaje]
          }
          setErrores(porId)
        }
        toast.error(data.message || 'No se pudieron guardar los cambios')
        return
      }
      toast.success(data.message || 'Cambios guardados')
      setErrores({})
      await onSaved()
      setDrafts({})
    } catch {
      toast.error('Error de red al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSort = (key: SortKey) => {
    setSort(prev => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

  const filasConError = Object.keys(errores).length

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-3 pt-4">
      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA0AC]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, categoría o subcategoría…"
            className="h-9 rounded-lg border-[#E0E0E0] pl-9 pr-8 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#9AA0AC] hover:text-[#1A1A1A]"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value as 'todos' | Tipo)}
          className="h-9 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A1A]"
          aria-label="Filtrar por tipo"
        >
          <option value="todos">Todos los tipos</option>
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value as 'todas' | 'activas' | 'inactivas')}
          className="h-9 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A1A]"
          aria-label="Filtrar por estado"
        >
          <option value="todas">Activas e inactivas</option>
          <option value="activas">Solo activas</option>
          <option value="inactivas">Solo inactivas</option>
        </select>
      </div>

      {/* Cambios pendientes */}
      {cantidadCambios > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 shadow-sm">
          <p className="text-sm text-amber-900">
            <span className="font-semibold">{cantidadCambios}</span>{' '}
            {cantidadCambios === 1 ? 'descripción con cambios sin guardar' : 'descripciones con cambios sin guardar'}
            {filasConError > 0 && (
              <span className="ml-2 font-semibold text-rose-700">· {filasConError} con errores</span>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={descartarTodo}
              disabled={isSaving}
              className="h-8 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
            >
              Descartar
            </Button>
            <Button
              size="sm"
              onClick={guardar}
              disabled={isSaving}
              className="h-8 bg-[#002868] text-white hover:bg-[#003d8f]"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-[#F8F9FA] text-left">
            <tr className="border-b border-gray-200">
              <Th label="Nombre" k="nombre" sort={sort} onSort={toggleSort} />
              <Th label="Tipo" k="tipo" sort={sort} onSort={toggleSort} className="w-[120px]" />
              <Th label="Categoría" k="categoria" sort={sort} onSort={toggleSort} className="w-[200px]" />
              <Th label="Subcategoría" k="subcategoria" sort={sort} onSort={toggleSort} className="w-[200px]" />
              <Th label="Activo" k="activo" sort={sort} onSort={toggleSort} className="w-[80px]" />
              <th className="w-[76px] px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {isLoading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#8A8F9C]">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            )}
            {!isLoading && visibles.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-[#8A8F9C]">
                  {items.length === 0 ? 'No hay descripciones configuradas.' : 'No hay descripciones que coincidan.'}
                </td>
              </tr>
            )}
            {visibles.map(saved => {
              const fila = drafts[saved.id] ?? saved
              const dirty = !!drafts[saved.id]
              const errs = errores[saved.id]
              const categoriasOpciones = categorias.filter(c => !fila.tipo || !c.tipo || c.tipo === fila.tipo)
              const categoriaEnLista =
                fila.categoria_id === null || categoriasOpciones.some(c => c.id === fila.categoria_id)
              const subsOpciones =
                fila.categoria_id !== null ? subcategorias.filter(s => s.categoria_id === fila.categoria_id) : []
              const subEnLista = fila.subcategoria_id === null || subsOpciones.some(s => s.id === fila.subcategoria_id)

              return (
                <Fragment key={saved.id}>
                  <tr
                    className={cn(
                      'border-b border-gray-100 align-middle',
                      errs ? 'bg-rose-50/60' : dirty ? 'bg-amber-50/30' : 'hover:bg-gray-50',
                      !fila.activo && 'text-[#8A8F9C]',
                    )}
                  >
                    <td className="px-2 py-1.5">
                      <input
                        value={fila.nombre}
                        onChange={e => setCampo(saved.id, { nombre: e.target.value })}
                        className={cn(
                          cellBase,
                          'font-medium',
                          fila.nombre !== saved.nombre ? cellDirty : cellNormal,
                          !fila.activo && 'text-[#8A8F9C]',
                        )}
                        aria-label="Nombre"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={fila.tipo ?? ''}
                        onChange={e => cambiarTipo(fila, (e.target.value || null) as Tipo | null)}
                        className={cn(cellBase, fila.tipo !== saved.tipo ? cellDirty : cellNormal)}
                        aria-label="Tipo"
                      >
                        {(saved.tipo === null || fila.tipo === null) && <option value="">Sin tipo</option>}
                        <option value="ingreso">Ingreso</option>
                        <option value="egreso">Egreso</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={fila.categoria_id ?? ''}
                        onChange={e =>
                          setCampo(saved.id, {
                            categoria_id: e.target.value ? Number(e.target.value) : null,
                            subcategoria_id: null,
                          })
                        }
                        className={cn(cellBase, fila.categoria_id !== saved.categoria_id ? cellDirty : cellNormal)}
                        aria-label="Categoría"
                      >
                        <option value="">Sin categoría</option>
                        {!categoriaEnLista && (
                          <option value={fila.categoria_id!}>
                            {nombreCategoria(fila.categoria_id) || 'Categoría no disponible'}
                          </option>
                        )}
                        {categoriasOpciones.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={fila.subcategoria_id ?? ''}
                        onChange={e =>
                          setCampo(saved.id, { subcategoria_id: e.target.value ? Number(e.target.value) : null })
                        }
                        disabled={fila.categoria_id === null}
                        className={cn(
                          cellBase,
                          fila.subcategoria_id !== saved.subcategoria_id ? cellDirty : cellNormal,
                        )}
                        aria-label="Subcategoría"
                      >
                        <option value="">Sin subcategoría</option>
                        {!subEnLista && (
                          <option value={fila.subcategoria_id!}>
                            {nombreSubcategoria(fila.subcategoria_id) || 'Subcategoría no disponible'}
                          </option>
                        )}
                        {subsOpciones.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <div
                        className={cn(
                          'flex h-8 items-center justify-center rounded-md border',
                          fila.activo !== saved.activo ? cellDirty : 'border-transparent',
                        )}
                      >
                        <Switch
                          checked={fila.activo}
                          onCheckedChange={v => setCampo(saved.id, { activo: v })}
                          aria-label="Activo"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex justify-end gap-1">
                        {dirty && (
                          <button
                            type="button"
                            onClick={() => revertir(saved.id)}
                            className="rounded-md p-1.5 text-amber-700 hover:bg-amber-100"
                            title="Deshacer cambios de esta fila"
                            aria-label="Deshacer cambios de esta fila"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDelete(saved)}
                          className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          title="Eliminar"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {errs && (
                    <tr className="border-b border-rose-100 bg-rose-50/60">
                      <td colSpan={6} className="px-4 pb-2 pt-0">
                        <p className="flex items-start gap-1.5 text-xs text-rose-700">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {errs.join(' ')}
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#5A6070]">
        <p>
          {filas.length === 0
            ? '0 resultados'
            : `${desde + 1}–${Math.min(desde + pageSize, filas.length)} de ${filas.length}`}
          {filas.length !== items.length && ` (${items.length} en total)`}
        </p>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="h-8 rounded-md border border-[#E0E0E0] bg-white px-2 text-xs"
            aria-label="Filas por página"
          >
            {PAGE_SIZES.map(n => (
              <option key={n} value={n}>
                {n} por página
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={paginaActual === 0}
            className="h-8 w-8 p-0"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            Página {paginaActual + 1} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPaginas - 1, p + 1))}
            disabled={paginaActual >= totalPaginas - 1}
            className="h-8 w-8 p-0"
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Th({
  label,
  k,
  sort,
  onSort,
  className,
}: {
  label: string
  k: SortKey
  sort: { key: SortKey; dir: SortDir }
  onSort: (k: SortKey) => void
  className?: string
}) {
  const activo = sort.key === k
  const Icono = !activo ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      className={cn('px-2 py-2', className)}
      aria-sort={activo ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          'inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-semibold uppercase tracking-wider',
          activo ? 'text-[#002868]' : 'text-[#5A6070] hover:text-[#1A1A1A]',
        )}
      >
        {label}
        <Icono className={cn('h-3.5 w-3.5', !activo && 'opacity-40')} />
      </button>
    </th>
  )
}
