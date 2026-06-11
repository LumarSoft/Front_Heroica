'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { cn } from '@/lib/utils'
import type { RhMotivoBajaCatalogoItem } from '@/lib/types'

interface MotivoBajaSelectorProps {
  sucursalId: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

type RowMode = 'view' | 'edit' | 'delete'

export function MotivoBajaSelector({ sucursalId, value, onChange, disabled, className }: MotivoBajaSelectorProps) {
  const [motivos, setMotivos] = useState<RhMotivoBajaCatalogoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [creando, setCreando] = useState(false)
  const [rowMode, setRowMode] = useState<{ id: number; mode: RowMode }>({ id: 0, mode: 'view' })
  const [editValue, setEditValue] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await apiFetch(API_ENDPOINTS.RRHH_MOTIVOS_BAJA.LIST(sucursalId))
        const data = await res.json()
        if (!cancelled && data.success && Array.isArray(data.data)) {
          setMotivos(data.data as RhMotivoBajaCatalogoItem[])
        }
      } catch {
        if (!cancelled) toast.error('No se pudieron cargar los motivos de baja')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [sucursalId])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        resetRowMode()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function resetRowMode() {
    setRowMode({ id: 0, mode: 'view' })
    setEditValue('')
    setSearch('')
  }

  const ordenados = useMemo(
    () => [...motivos].sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es', { sensitivity: 'base' })),
    [motivos],
  )

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ordenados
    return ordenados.filter(m => m.nombre.toLowerCase().includes(q))
  }, [ordenados, search])

  const seleccionado = motivos.find(m => String(m.id) === value)
  const trimmedSearch = search.trim()
  const tieneMatchExacto = ordenados.some(m => m.nombre.toLowerCase() === trimmedSearch.toLowerCase())
  const puedeCrear = trimmedSearch.length >= 2 && !tieneMatchExacto

  function handleOpen() {
    if (disabled) return
    setOpen(true)
    setTimeout(() => searchRef.current?.focus(), 20)
  }

  function handleSelect(id: number) {
    onChange(String(id))
    setOpen(false)
    resetRowMode()
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setOpen(false)
    resetRowMode()
  }

  async function handleCreate() {
    if (!puedeCrear || creando) return
    setCreando(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.RRHH_MOTIVOS_BAJA.CREATE, {
        method: 'POST',
        body: JSON.stringify({ sucursal_id: sucursalId, nombre: trimmedSearch }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudo crear el motivo')
      const creado = data.data as { id: number; nombre: string }
      const nuevo: RhMotivoBajaCatalogoItem = { id: creado.id, sucursal_id: sucursalId, nombre: creado.nombre }
      setMotivos(prev => [...prev, nuevo])
      onChange(String(creado.id))
      toast.success(`Motivo "${creado.nombre}" creado`)
      setOpen(false)
      resetRowMode()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear el motivo')
    } finally {
      setCreando(false)
    }
  }

  function startEdit(motivo: RhMotivoBajaCatalogoItem) {
    setRowMode({ id: motivo.id, mode: 'edit' })
    setEditValue(motivo.nombre)
  }

  function startDelete(id: number) {
    setRowMode({ id, mode: 'delete' })
  }

  async function commitEdit(motivo: RhMotivoBajaCatalogoItem) {
    const nuevoNombre = editValue.trim()
    if (nuevoNombre.length < 2) {
      toast.error('El nombre debe tener al menos 2 caracteres')
      return
    }
    if (nuevoNombre === motivo.nombre) {
      resetRowMode()
      return
    }
    setSavingId(motivo.id)
    try {
      const res = await apiFetch(API_ENDPOINTS.RRHH_MOTIVOS_BAJA.UPDATE(motivo.id), {
        method: 'PUT',
        body: JSON.stringify({ sucursal_id: sucursalId, nombre: nuevoNombre }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudo actualizar el motivo')
      setMotivos(prev => prev.map(m => (m.id === motivo.id ? { ...m, nombre: nuevoNombre } : m)))
      toast.success('Motivo actualizado')
      resetRowMode()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar el motivo')
    } finally {
      setSavingId(null)
    }
  }

  async function commitDelete(id: number) {
    setDeletingId(id)
    try {
      const res = await apiFetch(API_ENDPOINTS.RRHH_MOTIVOS_BAJA.DELETE(id, sucursalId), { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudo eliminar el motivo')
      setMotivos(prev => prev.filter(m => m.id !== id))
      if (String(id) === value) onChange('')
      toast.success('Motivo eliminado')
      resetRowMode()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el motivo')
    } finally {
      setDeletingId(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (rowMode.mode !== 'view') {
        resetRowMode()
      } else {
        setOpen(false)
        setSearch('')
      }
    }
    if (e.key === 'Enter' && puedeCrear && rowMode.mode === 'view') {
      e.preventDefault()
      handleCreate()
    }
  }

  if (open) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'rounded-lg border border-[#002868] ring-2 ring-[#002868]/20 bg-white overflow-hidden',
          className,
        )}
      >
        {/* Buscador */}
        <div className="flex items-center gap-2 px-3 h-10 border-b border-[#E0E0E0]">
          <Search className="h-4 w-4 text-[#8A8F9C] shrink-0" />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar o escribir nombre nuevo…"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#8A8F9C] text-[#1A1A1A]"
            disabled={creando}
          />
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              resetRowMode()
            }}
            className="text-[#8A8F9C] hover:text-[#1A1A1A] transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Lista */}
        <div className="max-h-64 overflow-y-auto py-1">
          {loading ? (
            <div className="flex items-center justify-center py-4 gap-2 text-sm text-[#8A8F9C]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando…
            </div>
          ) : filtrados.length === 0 && !puedeCrear ? (
            <p className="py-4 text-center text-sm text-[#8A8F9C]">
              {trimmedSearch ? 'Sin coincidencias. Escribí 2+ letras para crear uno nuevo.' : 'No hay motivos creados.'}
            </p>
          ) : (
            filtrados.map(motivo => {
              const isSelected = String(motivo.id) === value
              const inEdit = rowMode.id === motivo.id && rowMode.mode === 'edit'
              const inDelete = rowMode.id === motivo.id && rowMode.mode === 'delete'
              const saving = savingId === motivo.id
              const deleting = deletingId === motivo.id

              if (inEdit) {
                return (
                  <div
                    key={motivo.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F7FA] border-l-2 border-[#002868]"
                  >
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          commitEdit(motivo)
                        }
                        if (e.key === 'Escape') resetRowMode()
                      }}
                      disabled={saving}
                      className="flex-1 text-sm bg-white border border-[#E0E0E0] rounded-md px-2 py-1 outline-none focus:border-[#002868] focus:ring-2 focus:ring-[#002868]/15"
                    />
                    <button
                      type="button"
                      onClick={() => commitEdit(motivo)}
                      disabled={saving}
                      className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                      title="Guardar"
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={resetRowMode}
                      disabled={saving}
                      className="p-1.5 rounded-md text-[#8A8F9C] hover:bg-[#F0F2F5]"
                      title="Cancelar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              }

              if (inDelete) {
                return (
                  <div
                    key={motivo.id}
                    className="flex items-center gap-2 px-3 py-2 bg-rose-50 border-l-2 border-rose-400"
                  >
                    <p className="text-xs text-rose-800 flex-1 truncate">
                      ¿Eliminar &quot;<span className="font-semibold">{motivo.nombre}</span>&quot;?
                    </p>
                    <button
                      type="button"
                      onClick={() => commitDelete(motivo.id)}
                      disabled={deleting}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Eliminar
                    </button>
                    <button
                      type="button"
                      onClick={resetRowMode}
                      disabled={deleting}
                      className="px-2 py-1 rounded-md text-[11px] font-medium text-[#5A6070] hover:bg-white"
                    >
                      Cancelar
                    </button>
                  </div>
                )
              }

              return (
                <div
                  key={motivo.id}
                  className={cn(
                    'group flex items-center gap-1 px-3 py-1.5 transition-colors',
                    isSelected ? 'bg-[#EEF3FF]' : 'hover:bg-[#F5F7FA]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(motivo.id)}
                    className="flex flex-1 items-center gap-2 min-w-0 text-left"
                  >
                    <Check
                      className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100 text-[#002868]' : 'opacity-0')}
                    />
                    <span
                      className={cn('text-sm truncate', isSelected ? 'text-[#002868] font-semibold' : 'text-[#1A1A1A]')}
                    >
                      {motivo.nombre}
                    </span>
                  </button>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(motivo)}
                      className="p-1.5 rounded-md text-[#5A6070] hover:bg-[#EEF3FF] hover:text-[#002868]"
                      title="Renombrar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startDelete(motivo.id)}
                      className="p-1.5 rounded-md text-[#8A8F9C] hover:bg-rose-50 hover:text-rose-600"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })
          )}

          {/* Crear nuevo */}
          {puedeCrear && rowMode.mode === 'view' && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creando}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition-colors cursor-pointer border-t border-dashed border-[#E0E0E0] mt-1 pt-2 text-[#002868] hover:bg-[#EEF3FF] font-medium disabled:opacity-50"
            >
              {creando ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
              <span className="truncate">Crear &quot;{trimmedSearch}&quot;</span>
            </button>
          )}
        </div>

        {/* Pie con hint */}
        <div className="px-3 py-1.5 border-t border-[#E0E0E0] bg-[#FAFBFC] flex items-center gap-3">
          <span className="text-[10px] text-[#8A8F9C]">Pasá el cursor sobre un motivo para renombrar o eliminar.</span>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      role="combobox"
      aria-expanded={false}
      aria-haspopup="listbox"
      disabled={disabled}
      onClick={handleOpen}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-sm transition-colors',
        'hover:border-[#002868] focus:outline-none focus:ring-2 focus:ring-[#002868]/20 focus:border-[#002868]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-[#FAFAFA]',
        seleccionado ? 'text-[#1A1A1A]' : 'text-[#8A8F9C]',
        className,
      )}
    >
      <span className={cn('truncate', seleccionado ? 'text-[#1A1A1A]' : 'text-[#8A8F9C]')}>
        {seleccionado ? seleccionado.nombre : loading ? 'Cargando motivos…' : 'Buscar en el catálogo o crear uno nuevo'}
      </span>
      <div className="flex items-center gap-1 ml-2 shrink-0">
        {seleccionado && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={e => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
            className="text-[#8A8F9C] hover:text-[#1A1A1A] transition-colors rounded p-0.5 hover:bg-gray-100"
            aria-label="Quitar selección"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronsUpDown className="h-4 w-4 text-[#8A8F9C]" />
      </div>
    </button>
  )
}
