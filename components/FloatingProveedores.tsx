'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BookUser, Minus, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ProveedorFicha } from '@/components/proveedores/ProveedorFicha'
import { useDraggable } from '@/hooks/use-draggable'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { filtrarProveedores } from '@/lib/proveedores'
import type { ApiRespuesta, Proveedor } from '@/lib/types'
import { useAuthStore } from '@/store/authStore'
import { useProveedoresPanelStore } from '@/store/proveedoresPanelStore'

const MAX_RESULTADOS = 50

/**
 * Buscador flotante de proveedores (F2), como la calculadora: se consulta y se copian los datos
 * (CBU/alias, CUIT, etc.) sin salir de la pantalla. El alta y la edición siguen en Configuración.
 */
export default function FloatingProveedores() {
  const { isOpen, togglePanel, closePanel } = useProveedoresPanelStore()
  const puedeBuscar = useAuthStore(state => state.canBuscarProveedores())
  const { position, containerRef, handleMouseDown } = useDraggable({ x: 300, y: 80 })
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [abiertoId, setAbiertoId] = useState<number | null>(null)
  const [minimizado, setMinimizado] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // F2 lo abre y lo cierra desde cualquier pantalla
  useEffect(() => {
    if (!puedeBuscar) return
    const handleF2 = (e: KeyboardEvent) => {
      if (e.key !== 'F2') return
      e.preventDefault()
      togglePanel()
    }
    window.addEventListener('keydown', handleF2)
    return () => window.removeEventListener('keydown', handleF2)
  }, [puedeBuscar, togglePanel])

  // Cada vez que se abre: la lista actualizada y el cursor en la búsqueda
  useEffect(() => {
    if (!isOpen || !puedeBuscar) return
    setMinimizado(false)
    inputRef.current?.focus()
    inputRef.current?.select()
    let cancelado = false
    setCargando(true)
    setError('')
    apiFetch(`${API_ENDPOINTS.CONFIGURACION.PROVEEDORES.GET_ALL}?activo=true`, { cache: 'no-store' })
      .then(r => r.json())
      .then((d: ApiRespuesta<Proveedor[]>) => {
        if (cancelado) return
        if (!d.success) throw new Error(d.message)
        setProveedores(d.data ?? [])
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar los proveedores.')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [isOpen, puedeBuscar])

  const resultados = useMemo(() => filtrarProveedores(proveedores, busqueda), [proveedores, busqueda])
  const visibles = useMemo(() => resultados.slice(0, MAX_RESULTADOS), [resultados])
  // Con un único resultado se muestra abierto
  const abierto = visibles.length === 1 ? visibles[0].id : abiertoId

  if (!isOpen || !puedeBuscar) return null

  let contenido: React.ReactNode
  if (cargando && proveedores.length === 0) {
    contenido = (
      <div className="flex justify-center py-6">
        <LoadingSpinner className="h-8 w-8 border-[3px]" />
      </div>
    )
  } else if (error) {
    contenido = <p className="px-1 py-4 text-center text-sm text-rose-600">{error}</p>
  } else if (visibles.length === 0) {
    contenido = (
      <p className="px-1 py-4 text-center text-sm text-[#8A8F9C]">
        {busqueda ? 'No hay proveedores que coincidan.' : 'No hay proveedores activos.'}
      </p>
    )
  } else {
    contenido = visibles.map(p => (
      <ProveedorFicha
        key={p.id}
        proveedor={p}
        abierto={abierto === p.id}
        onToggle={() => setAbiertoId(id => (id === p.id ? null : p.id))}
      />
    ))
  }

  return (
    <div
      ref={containerRef}
      // La posición sale del arrastre: Tailwind no puede expresarla
      style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 9999 }}
      className="w-80 overflow-hidden rounded-2xl border border-[#002868]/20 bg-[#F8F9FA] shadow-2xl"
    >
      <div
        onMouseDown={handleMouseDown}
        className="flex cursor-grab select-none items-center justify-between bg-[#002868] px-4 py-2 active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <BookUser className="h-4 w-4 text-white/80" />
          <span className="text-sm font-semibold text-white">Proveedores</span>
          <span className="text-xs text-white/40">F2</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimizado(m => !m)}
            className="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Minimizar"
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={closePanel}
            className="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {!minimizado && (
        <div className="space-y-2 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8F9C]" />
            <Input
              ref={inputRef}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') closePanel()
              }}
              placeholder="Nombre, razón social, CUIT o alias"
              aria-label="Buscar proveedor"
              className="h-9 bg-white pl-9 text-sm"
            />
          </div>
          <div className="max-h-[420px] space-y-1 overflow-y-auto">{contenido}</div>
          {resultados.length > MAX_RESULTADOS && (
            <p className="text-center text-xs text-[#8A8F9C]">
              Se muestran {MAX_RESULTADOS} de {resultados.length}. Escribí para afinar la búsqueda.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
