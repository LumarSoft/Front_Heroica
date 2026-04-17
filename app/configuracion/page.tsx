'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/store/authStore'
import {
  Settings,
  FolderOpen,
  Folder,
  Building2,
  CreditCard,
  ArrowLeft,
  Users,
  Shield,
  KeyRound,
  Truck,
  FileText,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { CategoriasSection } from '@/components/configuracion/CategoriasSection'
import { SubcategoriasSection } from '@/components/configuracion/SubcategoriasSection'
import { BancosSection } from '@/components/configuracion/BancosSection'
import { MediosPagoSection } from '@/components/configuracion/MediosPagoSection'
import { UsuariosSection } from '@/components/configuracion/UsuariosSection'
import { RolesSection } from '@/components/configuracion/RolesSection'
import { CambiarPasswordSection } from '@/components/configuracion/CambiarPasswordSection'
import { DispositivosConfianzaSection } from '@/components/configuracion/DispositivosConfianzaSection'
import { DescripcionesSection } from '@/components/configuracion/DescripcionesSection'
import { ProveedoresSection } from '@/components/configuracion/ProveedoresSection'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type ActiveTab =
  | 'categorias'
  | 'subcategorias'
  | 'descripciones'
  | 'proveedores'
  | 'bancos'
  | 'medios'
  | 'usuarios'
  | 'roles'
  | 'mi-cuenta'

interface TabDef {
  id: ActiveTab
  label: string
  Icon: React.ElementType
  visible: boolean
  group: string
}

const GROUPS = [
  { key: 'catalogo', label: 'Catálogo' },
  { key: 'financiero', label: 'Financiero' },
  { key: 'equipo', label: 'Equipo' },
  { key: 'cuenta', label: 'Mi Cuenta' },
]

export default function ConfiguracionPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const isSuperAdmin = useAuthStore(state => state.isSuperAdmin())
  const canVerConfiguracion = useAuthStore(state => state.canVerConfiguracion())
  const canGestionarUsuarios = useAuthStore(state => state.canGestionarUsuarios())
  const canGestionarRoles = useAuthStore(state => state.canGestionarRoles())

  const [isHydrated, setIsHydrated] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('mi-cuenta')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setIsHydrated(true) }, [])

  useEffect(() => {
    if (!isHydrated) return
    if (!isAuthenticated) { router.push('/'); return }
    if (!canVerConfiguracion) { router.push('/sucursales'); return }
    setActiveTab(isSuperAdmin ? 'categorias' : 'mi-cuenta')
  }, [isAuthenticated, isHydrated, router, canVerConfiguracion, isSuperAdmin])

  if (!isHydrated) return <PageLoadingSpinner />

  const ALL_TABS: TabDef[] = [
    { id: 'categorias',   label: 'Categorías',     Icon: Folder,    visible: isSuperAdmin,          group: 'catalogo'   },
    { id: 'subcategorias',label: 'Subcategorías',  Icon: FolderOpen,visible: isSuperAdmin,          group: 'catalogo'   },
    { id: 'descripciones',label: 'Descripciones',  Icon: FileText,  visible: isSuperAdmin,          group: 'catalogo'   },
    { id: 'proveedores',  label: 'Proveedores',    Icon: Truck,     visible: isSuperAdmin,          group: 'catalogo'   },
    { id: 'bancos',       label: 'Bancos',         Icon: Building2, visible: isSuperAdmin,          group: 'financiero' },
    { id: 'medios',       label: 'Medios de Pago', Icon: CreditCard,visible: isSuperAdmin,          group: 'financiero' },
    { id: 'usuarios',     label: 'Usuarios',       Icon: Users,     visible: canGestionarUsuarios,  group: 'equipo'     },
    { id: 'roles',        label: 'Roles y Permisos',Icon: Shield,   visible: canGestionarRoles,     group: 'equipo'     },
    { id: 'mi-cuenta',    label: 'Mi Cuenta',      Icon: KeyRound,  visible: true,                  group: 'cuenta'     },
  ]

  const TABS = ALL_TABS.filter(t => t.visible)
  const activeTabDef = TABS.find(t => t.id === activeTab)

  const handleTabChange = (id: ActiveTab) => {
    setActiveTab(id)
    setMobileOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header — mismo patrón que el resto de la app */}
      <header className="bg-white border-b border-[#E0E0E0] shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="flex items-center h-14 sm:h-16 gap-2 sm:gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => router.push('/sucursales')}
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 sm:w-9 sm:h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 flex-shrink-0 cursor-pointer rounded-lg"
                    aria-label="Volver"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Volver a sucursales</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Image src="/HEROICA.svg" alt="Heroica" width={80} height={32} className="h-6 sm:h-8 w-auto flex-shrink-0" priority />

            <div className="h-6 sm:h-8 w-px bg-[#E0E0E0] flex-shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <Settings className="w-4 h-4 text-[#9AA0AC] flex-shrink-0" />
              <div className="flex flex-col justify-center min-w-0">
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-0.5">
                  Sistema
                </p>
                <p className="text-xs sm:text-sm font-semibold text-[#002868] leading-none">Configuración</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-6 py-6 flex-1">
        <div className="max-w-6xl mx-auto">

          {/* Mobile nav — STANDALONE above content, not inside flex row */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setMobileOpen(p => !p)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white rounded-xl border border-[#E0E0E0] shadow-sm text-sm font-semibold text-[#1A1A1A] cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {activeTabDef && <activeTabDef.Icon className="w-4 h-4 text-[#002868]" />}
                {activeTabDef?.label}
              </span>
              <ChevronDown className={cn('w-4 h-4 text-[#9AA0AC] transition-transform', mobileOpen && 'rotate-180')} />
            </button>

            {mobileOpen && (
              <div className="mt-1 bg-white rounded-xl border border-[#E0E0E0] shadow-lg overflow-hidden z-10 relative">
                {GROUPS.map(group => {
                  const groupTabs = TABS.filter(t => t.group === group.key)
                  if (groupTabs.length === 0) return null
                  return (
                    <div key={group.key}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#9AA0AC] px-4 pt-3 pb-1">
                        {group.label}
                      </p>
                      {groupTabs.map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          onClick={() => handleTabChange(id)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer text-left',
                            activeTab === id
                              ? 'bg-[#002868]/8 text-[#002868]'
                              : 'text-[#5A6070] hover:bg-[#F5F5F5]',
                          )}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {label}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar + Content row */}
          <div className="flex gap-6">

            {/* Sidebar — desktop only */}
            <aside className="hidden md:flex flex-col w-52 flex-shrink-0 gap-1">
              {GROUPS.map(group => {
                const groupTabs = TABS.filter(t => t.group === group.key)
                if (groupTabs.length === 0) return null
                return (
                  <div key={group.key} className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9AA0AC] px-3 mb-1">
                      {group.label}
                    </p>
                    {groupTabs.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        onClick={() => handleTabChange(id)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer text-left',
                          activeTab === id
                            ? 'bg-[#002868] text-white shadow-sm'
                            : 'text-[#5A6070] hover:bg-[#002868]/8 hover:text-[#002868]',
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {label}
                      </button>
                    ))}
                  </div>
                )
              })}
            </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {/* Section header */}
            {activeTabDef && (
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#002868]/10 flex items-center justify-center flex-shrink-0">
                  <activeTabDef.Icon className="w-4 h-4 text-[#002868]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#002868] leading-tight">{activeTabDef.label}</h2>
                  <p className="text-xs text-[#9AA0AC] leading-none mt-0.5">
                    {GROUPS.find(g => g.key === activeTabDef.group)?.label}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'categorias'    && <CategoriasSection />}
            {activeTab === 'subcategorias' && <SubcategoriasSection />}
            {activeTab === 'descripciones' && <DescripcionesSection />}
            {activeTab === 'proveedores'   && <ProveedoresSection />}
            {activeTab === 'bancos'        && <BancosSection />}
            {activeTab === 'medios'        && <MediosPagoSection />}
            {activeTab === 'usuarios'      && <UsuariosSection />}
            {activeTab === 'roles'         && <RolesSection />}
            {activeTab === 'mi-cuenta'     && (
              <div className="flex flex-col gap-6 max-w-lg">
                <CambiarPasswordSection />
                <DispositivosConfianzaSection />
              </div>
            )}
          </main>
          </div>{/* end flex row */}
        </div>{/* end max-w wrapper */}
      </div>
    </div>
  )
}
