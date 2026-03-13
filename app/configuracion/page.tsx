"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Settings,
  FolderOpen,
  Folder,
  Building2,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoadingSpinner } from "@/components/ui/loading-spinner";
import { CategoriasSection } from "@/components/configuracion/CategoriasSection";
import { SubcategoriasSection } from "@/components/configuracion/SubcategoriasSection";
import { BancosSection } from "@/components/configuracion/BancosSection";
import { MediosPagoSection } from "@/components/configuracion/MediosPagoSection";

type ActiveTab = "categorias" | "subcategorias" | "bancos" | "medios";

const TABS: { id: ActiveTab; label: string; Icon: React.ElementType }[] = [
  { id: "categorias", label: "Categorías", Icon: Folder },
  { id: "subcategorias", label: "Subcategorías", Icon: FolderOpen },
  { id: "bancos", label: "Bancos", Icon: Building2 },
  { id: "medios", label: "Medios de Pago", Icon: CreditCard },
];

export default function ConfiguracionPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin());
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("categorias");

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !isSuperAdmin) {
      router.push("/");
    }
  }, [isAuthenticated, isHydrated, router, isSuperAdmin]);

  if (!isHydrated) return <PageLoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/sucursales")}
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
                Gestión de categorías, bancos y medios de pago
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 flex flex-col items-center">
        <div className="flex justify-center w-full max-w-4xl gap-2 mb-6 border-b border-gray-200">
          {TABS.map(({ id, label, Icon }) => (
            <Button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-6 py-3 font-semibold transition-all ${activeTab === id
                  ? "text-[#002868] border-b-2 border-[#002868]"
                  : "text-[#666666] hover:text-[#002868]"
                }`}
            >
              <Icon className="w-4 h-4 inline mr-1.5" />
              {label}
            </Button>
          ))}
        </div>

        <div className="max-w-4xl w-full mx-auto">
          {activeTab === "categorias" && <CategoriasSection />}
          {activeTab === "subcategorias" && <SubcategoriasSection />}
          {activeTab === "bancos" && <BancosSection />}
          {activeTab === "medios" && <MediosPagoSection />}
        </div>
      </div>
    </div>
  );
}
