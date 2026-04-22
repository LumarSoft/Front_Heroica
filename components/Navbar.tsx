'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Settings,
  LogOut,
  ClipboardList,
  Calculator,
  Bell,
  ArrowRight,
  MessageCircle,
  X,
  CheckCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { useAuthStore } from '@/store/authStore'
import { useCalculatorStore } from '@/store/calculatorStore'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notificacion {
  id: number
  tipo: 'movimiento' | 'comentario'
  descripcion: string
  leida: number | boolean
  created_at: string
  tarea_id: number
  tarea_codigo: string
  tarea_titulo: string
  de_nombre: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days}d`
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

// ─── NavbarProps ──────────────────────────────────────────────────────────────

interface NavbarProps {
  userName?: string
  userRole?: string
  onLogout?: () => void
  showBackButton?: boolean
  backUrl?: string
  sucursalNombre?: string
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar({
  userName,
  userRole,
  onLogout,
  showBackButton = false,
  backUrl,
  sucursalNombre,
}: NavbarProps) {
  const router = useRouter()
  const canVerConfiguracion = useAuthStore(state => state.canVerConfiguracion())
  const { toggleCalculator, isOpen: isCalculatorOpen } = useCalculatorStore()

  // ─── Notifications state ──────────────────────────────────────────────────
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const [loadingNotif, setLoadingNotif] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const unread = notificaciones.filter(n => !n.leida).length

  // Fetch + poll
  useEffect(() => {
    if (!userName) return
    doFetch()
    const interval = setInterval(doFetch, 30_000)
    return () => clearInterval(interval)
  }, [userName])

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    if (bellOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  // Escape key to close
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setBellOpen(false)
    }
    if (bellOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [bellOpen])

  async function doFetch() {
    if (loadingNotif) return
    try {
      const res = await apiFetch(API_ENDPOINTS.NOTIFICACIONES.MIS)
      if (!res.ok) return
      const data = await res.json()
      setNotificaciones(data.data ?? [])
    } catch {
      // silent — non-critical
    }
  }

  async function marcarLeida(id: number) {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
    try {
      await apiFetch(API_ENDPOINTS.NOTIFICACIONES.LEER, {
        method: 'PATCH',
        body: JSON.stringify({ ids: [id] }),
      })
    } catch { /* silent */ }
  }

  async function marcarTodasLeidas() {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    try {
      await apiFetch(API_ENDPOINTS.NOTIFICACIONES.LEER, {
        method: 'PATCH',
        body: JSON.stringify({ ids: null }),
      })
    } catch { /* silent */ }
  }

  function handleOpenNotificacion(n: Notificacion) {
    setBellOpen(false)
    if (!n.leida) marcarLeida(n.id)
    router.push(`/tareas?open=${n.tarea_id}`)
  }

  // ─── Greeting ─────────────────────────────────────────────────────────────

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  })()

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <header className="bg-white border-b border-[#E0E0E0] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-6">
        <div className="flex items-center h-14 sm:h-16 gap-2 sm:gap-3">

          {/* Back */}
          {showBackButton && (
            <Button
              onClick={() => backUrl ? router.push(backUrl) : router.back()}
              variant="ghost"
              size="icon"
              className="w-8 h-8 sm:w-9 sm:h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 flex-shrink-0 cursor-pointer"
              aria-label="Volver"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          )}

          {/* Logo */}
          <Image
            src="/HEROICA.svg"
            alt="Heroica"
            width={80}
            height={32}
            className="h-6 sm:h-8 w-auto flex-shrink-0"
            priority
          />

          <div className="h-6 sm:h-8 w-px bg-[#E0E0E0] flex-shrink-0" />

          {/* Context */}
          <div className="flex flex-col justify-center min-w-0 flex-1 sm:flex-none">
            {sucursalNombre ? (
              <>
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-0.5">
                  Sucursal
                </p>
                <p className="text-xs sm:text-sm font-semibold text-[#002868] truncate leading-none">
                  {sucursalNombre}
                </p>
              </>
            ) : userName ? (
              <>
                <p className="text-xs sm:text-sm font-semibold text-[#1A1A1A] leading-none mb-0.5 truncate">
                  {greeting}, {userName.split(' ')[0]}
                </p>
                <p className="text-[9px] sm:text-[10px] text-[#9AA0AC] leading-none hidden sm:block">
                  Sistema de Contabilidad
                </p>
              </>
            ) : (
              <p className="text-xs sm:text-sm text-[#9AA0AC]">Sistema de Contabilidad</p>
            )}
          </div>

          <div className="flex-1 hidden sm:block" />

          {/* User badge — desktop */}
          {userName && userRole && (
            <div className="hidden md:flex items-center gap-2.5 pr-3 sm:pr-4 border-r border-[#E0E0E0] flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#002868] to-[#003d8f] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-[#1A1A1A] leading-tight">{userName}</p>
                <p className="text-xs text-[#9AA0AC] capitalize leading-tight">{userRole}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <TooltipProvider>
            <div className="flex items-center gap-0.5 flex-shrink-0">

              {/* Calculator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={toggleCalculator}
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'w-8 h-8 sm:w-9 sm:h-9 transition-all cursor-pointer rounded-lg',
                      isCalculatorOpen
                        ? 'bg-[#002868] text-white hover:bg-[#003d8f]'
                        : 'text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8',
                    )}
                    aria-label="Calculadora"
                  >
                    <Calculator className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Calculadora <span className="opacity-60 ml-1">F1</span>
                </TooltipContent>
              </Tooltip>

              {/* Tareas */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => router.push('/tareas')}
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 sm:w-9 sm:h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 transition-all cursor-pointer rounded-lg"
                    aria-label="Tareas"
                  >
                    <ClipboardList className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Tareas</TooltipContent>
              </Tooltip>

              {/* ── Notification Bell ──────────────────────────────────── */}
              {userName && (
                <div ref={bellRef} className="relative">
                  <button
                    onClick={() => setBellOpen(v => !v)}
                    aria-label={`Notificaciones${unread > 0 ? ` — ${unread} sin leer` : ''}`}
                    className={cn(
                      'relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer',
                      bellOpen
                        ? 'bg-[#002868] text-white'
                        : 'text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8',
                    )}
                  >
                    <Bell className="w-4 h-4" />

                    {/* Unread badge */}
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px]">
                        {!bellOpen && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-50" />
                        )}
                        <span className="relative inline-flex items-center justify-center rounded-full h-[18px] min-w-[18px] px-1 bg-rose-500 text-white text-[9px] font-bold leading-none">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      </span>
                    )}
                  </button>

                  {/* ── Dropdown panel ────────────────────────────────── */}
                  <div
                    className={cn(
                      'absolute right-0 top-full mt-2',
                      'w-[90vw] sm:w-[400px]',
                      'bg-white rounded-2xl shadow-2xl border border-slate-200',
                      'z-[60] overflow-hidden',
                      'transition-all duration-200 ease-out origin-top-right',
                      bellOpen
                        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 scale-95 -translate-y-1 pointer-events-none',
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#002868]/8 flex items-center justify-center">
                          <Bell className="w-3.5 h-3.5 text-[#002868]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-none">Notificaciones</p>
                          {unread > 0 && (
                            <p className="text-[10px] text-rose-500 font-semibold mt-0.5 leading-none">
                              {unread} sin leer
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {unread > 0 && (
                          <button
                            onClick={marcarTodasLeidas}
                            className="flex items-center gap-1 text-[10px] font-semibold text-[#002868] bg-[#002868]/6 hover:bg-[#002868]/12 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <CheckCheck className="w-3 h-3" />
                            Marcar todo
                          </button>
                        )}
                        <button
                          onClick={() => setBellOpen(false)}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto">
                      {notificaciones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                            <Bell className="w-5 h-5 text-slate-400" />
                          </div>
                          <p className="text-sm font-semibold text-slate-600">Sin notificaciones</p>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            Cuando alguien te notifique sobre una tarea, aparecerá acá.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {notificaciones.map(n => {
                            const isUnread = !n.leida
                            const isMove = n.tipo === 'movimiento'
                            return (
                              <button
                                key={n.id}
                                onClick={() => handleOpenNotificacion(n)}
                                className={cn(
                                  'w-full text-left px-4 py-3.5 flex gap-3 items-start',
                                  'transition-colors duration-150 cursor-pointer',
                                  isUnread
                                    ? 'bg-blue-50/50 hover:bg-blue-50'
                                    : 'hover:bg-slate-50',
                                )}
                              >
                                {/* Type icon */}
                                <div className={cn(
                                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                                  isMove ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600',
                                )}>
                                  {isMove
                                    ? <ArrowRight className="w-3.5 h-3.5" />
                                    : <MessageCircle className="w-3.5 h-3.5" />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  {/* Task code badge */}
                                  <span className="inline-block text-[9px] font-bold bg-[#002868] text-white px-1.5 py-0.5 rounded-full mb-1">
                                    {n.tarea_codigo}
                                  </span>
                                  <p className={cn(
                                    'text-xs leading-snug',
                                    isUnread ? 'font-semibold text-slate-800' : 'text-slate-600',
                                  )}>
                                    {n.descripcion}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                    De {n.de_nombre} · {timeAgo(n.created_at)}
                                  </p>
                                </div>

                                {/* Unread dot */}
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {notificaciones.length > 0 && (
                      <div className="border-t border-slate-100 px-4 py-3">
                        <button
                          onClick={() => { setBellOpen(false); router.push('/tareas') }}
                          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#002868] hover:text-[#003d8f] transition-colors cursor-pointer py-1"
                        >
                          Ver tablero de tareas
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Settings */}
              {canVerConfiguracion && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => router.push('/configuracion')}
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 sm:w-9 sm:h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 transition-all cursor-pointer rounded-lg"
                      aria-label="Configuración"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Configuración</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Separator + Logout */}
            {onLogout && (
              <>
                <div className="h-6 sm:h-7 w-px bg-[#E0E0E0] flex-shrink-0" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onLogout}
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 sm:w-9 sm:h-9 text-[#9AA0AC] hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer rounded-lg flex-shrink-0"
                      aria-label="Cerrar Sesión"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Cerrar Sesión</TooltipContent>
                </Tooltip>
              </>
            )}
          </TooltipProvider>
        </div>
      </div>
    </header>
  )
}
