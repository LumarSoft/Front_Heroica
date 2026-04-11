'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLoadingSpinner } from '@/components/ui/loading-spinner';
import { CategoriasSection } from '@/components/configuracion/CategoriasSection';
import { SubcategoriasSection } from '@/components/configuracion/SubcategoriasSection';
import { BancosSection } from '@/components/configuracion/BancosSection';
import { MediosPagoSection } from '@/components/configuracion/MediosPagoSection';
import { UsuariosSection } from '@/components/configuracion/UsuariosSection';
import { RolesSection } from '@/components/configuracion/RolesSection';
import { CambiarPasswordSection } from '@/components/configuracion/CambiarPasswordSection';
import { DescripcionesSection } from '@/components/configuracion/DescripcionesSection';
import { ProveedoresSection } from '@/components/configuracion/ProveedoresSection';
import { Truck, FileText } from 'lucide-react';

type ActiveTab =
  | 'categorias'
  | 'subcategorias'
  | 'descripciones'
  | 'proveedores'
  | 'bancos'
  | 'medios'
  | 'usuarios'
  | 'roles'
  | 'mi-cuenta';

export default function ConfiguracionPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin());
  const canVerConfiguracion = useAuthStore((state) =>
    state.canVerConfiguracion(),
  );
  const canGestionarUsuarios = useAuthStore((state) =>
    state.canGestionarUsuarios(),
  );
  const canGestionarRoles = useAuthStore((state) => state.canGestionarRoles());

  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('mi-cuenta');

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    if (!canVerConfiguracion) {
      router.push('/sucursales');
      return;
    }
    if (isSuperAdmin) {
      setActiveTab('categorias');
    } else {
      setActiveTab('mi-cuenta');
    }
  }, [isAuthenticated, isHydrated, router, canVerConfiguracion, isSuperAdmin]);

  if (!isHydrated) return <PageLoadingSpinner />;

  // Tabs disponibles según permisos
  const ALL_TABS: {
    id: ActiveTab;
    label: string;
    Icon: React.ElementType;
    visible: boolean;
  }[] = [
    {
      id: 'categorias',
      label: 'Categorías',
      Icon: Folder,
      visible: isSuperAdmin,
    },
    {
      id: 'subcategorias',
      label: 'Subcategorías',
      Icon: FolderOpen,
      visible: isSuperAdmin,
    },
    {
      id: 'descripciones',
      label: 'Descripciones',
      Icon: FileText,
      visible: isSuperAdmin,
    },
    {
      id: 'proveedores',
      label: 'Proveedores',
      Icon: Truck,
      visible: isSuperAdmin,
    },
    { id: 'bancos', label: 'Bancos', Icon: Building2, visible: isSuperAdmin },
    {
      id: 'medios',
      label: 'Medios de Pago',
      Icon: CreditCard,
      visible: isSuperAdmin,
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      Icon: Users,
      visible: canGestionarUsuarios,
    },
    {
      id: 'roles',
      label: 'Roles y Permisos',
      Icon: Shield,
      visible: canGestionarRoles,
    },
    { id: 'mi-cuenta', label: 'Mi Cuenta', Icon: KeyRound, visible: true },
  ];

  const TABS = ALL_TABS.filter((t) => t.visible);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/sucursales')}
              variant="outline"
              size="sm"
              className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#666666] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#002868] flex items-center gap-2">
                <Settings className="w-6 h-6" /> Configuración
              </h1>
              <p className="text-sm text-[#666666]">
                {isSuperAdmin
                  ? 'Gestión de categorías, bancos, medios de pago, usuarios y roles'
                  : 'Configuración de tu cuenta'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 flex flex-col items-center">
        <div className="flex justify-start w-full max-w-5xl gap-1 mb-6 border-b border-gray-200 overflow-x-auto overflow-y-hidden">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer whitespace-nowrap ${
                activeTab === id
                  ? 'border-[#002868] text-[#002868]'
                  : 'border-transparent text-[#666666] hover:text-[#002868] hover:border-[#002868]/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="max-w-5xl w-full mx-auto">
          {activeTab === 'categorias' && <CategoriasSection />}
          {activeTab === 'subcategorias' && <SubcategoriasSection />}
          {activeTab === 'descripciones' && <DescripcionesSection />}
          {activeTab === 'proveedores' && <ProveedoresSection />}
          {activeTab === 'bancos' && <BancosSection />}
          {activeTab === 'medios' && <MediosPagoSection />}
          {activeTab === 'usuarios' && <UsuariosSection />}
          {activeTab === 'roles' && <RolesSection />}
          {activeTab === 'mi-cuenta' && <CambiarPasswordSection />}
        </div>
      </div>
    </div>
  );
}
