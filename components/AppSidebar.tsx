'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Building2,
  Users,
  Calculator,
  ClipboardList,
  Bell,
  Settings,
  LogOut,
  ArrowRight,
  MessageCircle,
  CheckCheck,
  X,
  Menu,
  PanelLeftClose,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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

// ─── Module config ────────────────────────────────────────────────────────────

const MODULES = [
  {
    id: 'tesoreria',
    label: 'Tesorería',
    icon: Building2,
    defaultHref: '/sucursales',
    matchPaths: ['/sucursales'],
  },
  {
    id: 'recursos-humanos',
    label: 'Recursos Humanos',
    icon: Users,
    defaultHref: '/recursos-humanos',
    matchPaths: ['/recursos-humanos'],
  },
] as const

// ─── Internal NavItem ─────────────────────────────────────────────────────────

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href?: string
  onClick?: () => void
  active?: boolean
  collapsed: boolean
  badge?: number
  shortcut?: string
  tooltipLabel?: string
  btnRef?: React.Ref<HTMLButtonElement>
}

function NavItem({
  icon: Icon,
  label,
  href,
  onClick,
  active,
  collapsed,
  badge,
  shortcut,
  tooltipLabel,
  btnRef,
}: NavItemProps) {
  const baseExpandedCls = cn(
    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
    active
      ? 'bg-[#EAF0FF] text-[#002868] font-semibold'
      : 'text-[#64748B] hover:bg-[#EEF3FF] hover:text-[#1E293B]',
  )
  const baseCollapsedCls = cn(
    'w-full h-10 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer',
    active
      ? 'bg-[#EAF0FF] text-[#002868]'
      : 'text-[#64748B] hover:bg-[#EEF3FF] hover:text-[#1E293B]',
  )

  // Expanded inner content
  const expandedContent = (
    <>
      <div className="relative flex-shrink-0">
        <Icon className="w-4 h-4" />
        {!!badge && badge > 0 && !active && (
          <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center rounded-full h-[13px] min-w-[13px] px-0.5 bg-rose-500 text-white text-[8px] font-bold leading-none">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="flex-1 text-left whitespace-nowrap">{label}</span>
      {shortcut && (
        <span className="text-[10px] bg-[#E2EAF8] text-[#8899BB] px-1.5 py-0.5 rounded font-mono leading-none">
          {shortcut}
        </span>
      )}
      {!!badge && badge > 0 && active && (
        <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-semibold leading-none">
          {badge}
        </span>
      )}
      {!!badge && badge > 0 && !active && null}
    </>
  )

  // Collapsed inner content
  const collapsedContent = (
    <div className="relative">
      <Icon className="w-[18px] h-[18px]" />
      {!!badge && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-[14px] h-[14px] bg-rose-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold leading-none">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </div>
  )

  const sharedTip = tooltipLabel ?? label

  if (collapsed) {
    const el = href ? (
      <Link href={href} className={baseCollapsedCls}>{collapsedContent}</Link>
    ) : (
      <button ref={btnRef} onClick={onClick} className={baseCollapsedCls}>{collapsedContent}</button>
    )
    return (
      <Tooltip>
        <TooltipTrigger asChild>{el}</TooltipTrigger>
        <TooltipContent side="right">{sharedTip}</TooltipContent>
      </Tooltip>
    )
  }

  if (href) {
    return <Link href={href} className={baseExpandedCls}>{expandedContent}</Link>
  }
  return (
    <button ref={btnRef} onClick={onClick} className={baseExpandedCls}>
      {expandedContent}
    </button>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppSidebarProps {
  user: { nombre: string; rol: string } | null
  onLogout: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

export default function AppSidebar({ user, onLogout, mobileOpen, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const canVerConfiguracion = useAuthStore(state => state.canVerConfiguracion())
  const { toggleCalculator, isOpen: isCalculatorOpen } = useCalculatorStore()

  // ── Collapse ─────────────────────────────────────────────────────────────────
  // `collapsed`       → controls the CSS width (starts immediately)
  // `layoutCollapsed` → controls the inner content (delayed when closing so
  //                     overflow-hidden clips the text naturally during animation)
  const [collapsed, setCollapsed] = useState(false)
  const [layoutCollapsed, setLayoutCollapsed] = useState(false)
  const layoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('heroica-sidebar-collapsed')
    if (stored !== null) {
      const val = stored === 'true'
      setCollapsed(val)
      setLayoutCollapsed(val)
    }
  }, [])

  useEffect(() => {
    return () => { if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current) }
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('heroica-sidebar-collapsed', String(next))
    if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current)
    if (next) {
      // Collapsing: let the width animation run first, then switch content
      layoutTimerRef.current = setTimeout(() => setLayoutCollapsed(true), 280)
    } else {
      // Expanding: switch content immediately so text flows in as sidebar grows
      setLayoutCollapsed(false)
    }
  }

  // ── Notifications ─────────────────────────────────────────────────────────────
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const [loadingNotif, setLoadingNotif] = useState(false)
  const bellBtnRef = useRef<HTMLButtonElement>(null)
  const notifPanelRef = useRef<HTMLDivElement>(null)
  const [bellPos, setBellPos] = useState<{ top: number; left: number } | null>(null)

  const unread = notificaciones.filter(n => !n.leida).length

  useEffect(() => {
    if (!user) return
    doFetch()
    const interval = setInterval(doFetch, 30_000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as Node
      if (
        bellBtnRef.current && !bellBtnRef.current.contains(t) &&
        notifPanelRef.current && !notifPanelRef.current.contains(t)
      ) setBellOpen(false)
    }
    if (bellOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setBellOpen(false) }
    if (bellOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [bellOpen])

  async function doFetch() {
    if (loadingNotif) return
    setLoadingNotif(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.NOTIFICACIONES.MIS)
      if (!res.ok) return
      const data = await res.json()
      setNotificaciones(data.data ?? [])
    } catch { /* silent */ } finally { setLoadingNotif(false) }
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

  function handleBellClick() {
    if (bellBtnRef.current) {
      const rect = bellBtnRef.current.getBoundingClientRect()
      const panelW = Math.min(380, window.innerWidth - 24)
      setBellPos({
        top: rect.top,
        left: Math.max(8, Math.min(rect.right + 8, window.innerWidth - panelW - 8)),
      })
    }
    setBellOpen(v => !v)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const isActive = (href: string) => pathname?.startsWith(href) ?? false

  // ─── Nav (shared between desktop + mobile) ────────────────────────────────────
  // isCollapsed is false for mobile (always full-width)
  function buildNav(isCollapsed: boolean) {
    return (
      <TooltipProvider delayDuration={80}>
        <div className={cn('flex-1 overflow-y-auto py-3', isCollapsed ? 'px-2' : 'px-3')}>

          {/* ── Modules ──────────────────────────────────────────── */}
          {!isCollapsed && (
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#AABBD4] px-2 mb-2 whitespace-nowrap">
              Módulos
            </p>
          )}

          <nav className={cn('space-y-0.5', isCollapsed ? 'mb-4' : 'mb-5')}>
            {MODULES.map(mod => {
              const modActive = mod.matchPaths.some(p => isActive(p))
              const Icon = mod.icon

              if (isCollapsed) {
                return (
                  <Tooltip key={mod.id}>
                    <TooltipTrigger asChild>
                      <Link
                        href={mod.defaultHref}
                        onClick={onMobileClose}
                        className={cn(
                          'w-full h-10 flex items-center justify-center rounded-xl transition-all duration-150',
                          modActive
                            ? 'bg-[#EAF0FF] text-[#002868]'
                            : 'text-[#64748B] hover:bg-[#EEF3FF] hover:text-[#1E293B]',
                        )}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{mod.label}</TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Link
                  key={mod.id}
                  href={mod.defaultHref}
                  onClick={onMobileClose}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    modActive
                      ? 'bg-[#EAF0FF] text-[#002868] font-semibold'
                      : 'text-[#64748B] hover:bg-[#EEF3FF] hover:text-[#1E293B]',
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left whitespace-nowrap">{mod.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* ── Divider ───────────────────────────────────────────── */}
          <div className="h-px bg-[#E8EDF8] mx-1 mb-4" />

          {/* ── Tools ────────────────────────────────────────────── */}
          {!isCollapsed && (
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#AABBD4] px-2 mb-2 whitespace-nowrap">
              Herramientas
            </p>
          )}

          <nav className="space-y-0.5">
            <NavItem
              icon={Calculator}
              label="Calculadora"
              shortcut={isCollapsed ? undefined : 'F1'}
              tooltipLabel="Calculadora (F1)"
              active={isCalculatorOpen}
              collapsed={isCollapsed}
              onClick={toggleCalculator}
            />
            <NavItem
              icon={ClipboardList}
              label="Tareas"
              href="/tareas"
              active={isActive('/tareas')}
              collapsed={isCollapsed}
              onClick={onMobileClose}
            />

            {/* Bell (special — needs ref for positioning) */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    ref={bellBtnRef}
                    onClick={handleBellClick}
                    className={cn(
                      'w-full h-10 flex items-center justify-center rounded-xl transition-all duration-150',
                      bellOpen
                        ? 'bg-[#EAF0FF] text-[#002868]'
                        : 'text-[#64748B] hover:bg-[#EEF3FF] hover:text-[#1E293B]',
                    )}
                  >
                    <div className="relative">
                      <Bell className="w-[18px] h-[18px]" />
                      {unread > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-[14px] h-[14px] bg-rose-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold leading-none">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Notificaciones{unread > 0 ? ` (${unread})` : ''}
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                ref={bellBtnRef}
                onClick={handleBellClick}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  bellOpen
                    ? 'bg-[#EAF0FF] text-[#002868] font-semibold'
                    : 'text-[#64748B] hover:bg-[#EEF3FF] hover:text-[#1E293B]',
                )}
              >
                <div className="relative flex-shrink-0">
                  <Bell className="w-4 h-4" />
                  {unread > 0 && !bellOpen && (
                    <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center rounded-full h-[13px] min-w-[13px] px-0.5 bg-rose-500 text-white text-[8px] font-bold leading-none">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
                <span className="flex-1 text-left whitespace-nowrap">Notificaciones</span>
                {unread > 0 && (
                  <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-semibold leading-none">
                    {unread}
                  </span>
                )}
              </button>
            )}

            {canVerConfiguracion && (
              <NavItem
                icon={Settings}
                label="Configuración"
                href="/configuracion"
                active={isActive('/configuracion')}
                collapsed={isCollapsed}
                onClick={onMobileClose}
              />
            )}
          </nav>
        </div>
      </TooltipProvider>
    )
  }

  // ── User footer ───────────────────────────────────────────────────────────────
  function buildUserFooter(isCollapsed: boolean) {
    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={80}>
          <div className="flex-shrink-0 border-t border-[#E2E8F5] p-2 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onLogout}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-[#002868] to-[#003d8f] flex items-center justify-center text-white font-bold text-sm hover:ring-2 hover:ring-rose-400 transition-all"
                >
                  {user?.nombre?.charAt(0).toUpperCase() ?? '?'}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {user?.nombre} — Cerrar sesión
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )
    }

    return (
      <div className="flex-shrink-0 border-t border-[#E2E8F5] p-3">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/70 ring-1 ring-[#E2EAF8]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#002868] to-[#003d8f] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.nombre?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1E293B] leading-tight truncate">
              {user?.nombre}
            </p>
            <p className="text-xs text-[#94A3B8] capitalize leading-tight whitespace-nowrap">{user?.rol}</p>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col flex-shrink-0 h-full',
          'bg-[#F7F9FD] border-r border-[#E2E8F5]',
          'transition-[width] duration-300 ease-in-out overflow-hidden',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        {/* Logo / header row */}
        <div
          className={cn(
            'flex items-center h-16 border-b border-[#E2E8F5] flex-shrink-0',
            layoutCollapsed ? 'justify-center px-3' : 'px-4 gap-3 justify-between',
          )}
        >
          {layoutCollapsed ? (
            <TooltipProvider delayDuration={80}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleCollapsed}
                    title="Expandir sidebar"
                    className="w-8 h-8 rounded-xl bg-[#002868] flex items-center justify-center hover:bg-[#003d8f] transition-colors"
                  >
                    <span className="text-white font-black text-sm leading-none select-none">H</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Expandir</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <>
              <Image
                src="/HEROICA.svg"
                alt="Heroica"
                width={88}
                height={36}
                className="h-7 w-auto flex-shrink-0"
                priority
              />
              <button
                onClick={toggleCollapsed}
                title="Colapsar sidebar"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#002868] hover:bg-[#EEF3FF] transition-all flex-shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {buildNav(layoutCollapsed)}
        {buildUserFooter(layoutCollapsed)}
      </aside>

      {/* Mobile overlay — always fully expanded */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#F7F9FD] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-[#E2E8F5] flex-shrink-0">
              <Image src="/HEROICA.svg" alt="Heroica" width={88} height={36} className="h-7 w-auto" priority />
              <button
                onClick={onMobileClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#EEF3FF] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {buildNav(false)}
            {buildUserFooter(false)}
          </aside>
        </div>
      )}

      {/* Notification panel — fixed, escapes sidebar overflow */}
      {bellOpen && bellPos && (
        <div
          ref={notifPanelRef}
          className="fixed z-[200] w-[92vw] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden"
          style={{ top: bellPos.top, left: bellPos.left }}
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
          <div className="max-h-[400px] overflow-y-auto">
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
                        'w-full text-left px-4 py-3.5 flex gap-3 items-start transition-colors duration-150 cursor-pointer',
                        isUnread ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50',
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                        isMove ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600',
                      )}>
                        {isMove
                          ? <ArrowRight className="w-3.5 h-3.5" />
                          : <MessageCircle className="w-3.5 h-3.5" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
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
                      {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />}
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
      )}
    </>
  )
}

// ─── Mobile trigger button ────────────────────────────────────────────────────

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 flex items-center justify-center rounded-xl text-[#64748B] hover:text-[#1E293B] hover:bg-[#EEF3FF] transition-all"
      aria-label="Abrir menú"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}
