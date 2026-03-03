"use client";

import { useConfiguracion } from "@/hooks/configuracion/use-configuracion";
import { useAuthGuard } from "@/hooks/auth/use-auth-guard";
import { CrudList } from "@/components/configuracion/CrudList";
import { CategoriaDialog } from "@/components/configuracion/CategoriaDialog";
import { SubcategoriaDialog } from "@/components/configuracion/SubcategoriaDialog";
import { BancoDialog } from "@/components/configuracion/BancoDialog";
import { MedioPagoDialog } from "@/components/configuracion/MedioPagoDialog";
import Navbar from "@/components/Navbar";

const TABS = [
  { key: "categorias", label: "📁 Categorías" },
  { key: "subcategorias", label: "📂 Subcategorías" },
  { key: "bancos", label: "🏦 Bancos" },
  { key: "medios", label: "💳 Medios de Pago" },
] as const;

export default function ConfiguracionPage() {
  const { user, isGuardLoading, handleLogout } = useAuthGuard();
  const cfg = useConfiguracion();

  if (isGuardLoading || !cfg.isHydrated || cfg.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#002868] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#666666]">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Navbar compartida */}
      <Navbar
        userName={user?.nombre}
        userRole={user?.rol}
        onLogout={handleLogout}
        showBackButton
        backUrl="/sucursales"
      />

      {/* Contenido principal */}
      <main className="container mx-auto px-6 py-8 flex-1">
        {cfg.error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg">
            {cfg.error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => cfg.setActiveTab(tab.key)}
              className={`px-6 py-3 font-semibold transition-all ${
                cfg.activeTab === tab.key
                  ? "text-[#002868] border-b-2 border-[#002868]"
                  : "text-[#666666] hover:text-[#002868]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        {cfg.activeTab === "categorias" && (
          <CrudList
            title="Categorías"
            buttonLabel="Nueva Categoría"
            items={cfg.categorias}
            onNew={cfg.openNuevaCategoria}
            onEdit={cfg.openEditCategoria}
            onDelete={cfg.handleDeleteCategoria}
          />
        )}
        {cfg.activeTab === "subcategorias" && (
          <CrudList
            title="Subcategorías"
            buttonLabel="Nueva Subcategoría"
            items={cfg.subcategorias.map((s) => ({
              ...s,
              subtitulo: `Categoría: ${s.categoria_nombre}`,
            }))}
            onNew={cfg.openNuevaSubcategoria}
            onEdit={(item) =>
              cfg.openEditSubcategoria(
                cfg.subcategorias.find((s) => s.id === item.id)!,
              )
            }
            onDelete={cfg.handleDeleteSubcategoria}
          />
        )}
        {cfg.activeTab === "bancos" && (
          <CrudList
            title="Bancos"
            buttonLabel="Nuevo Banco"
            items={cfg.bancos.map((b) => ({
              ...b,
              descripcion: b.codigo ? `Código: ${b.codigo}` : undefined,
            }))}
            onNew={cfg.openNuevoBanco}
            onEdit={(item) =>
              cfg.openEditBanco(cfg.bancos.find((b) => b.id === item.id)!)
            }
            onDelete={cfg.handleDeleteBanco}
          />
        )}
        {cfg.activeTab === "medios" && (
          <CrudList
            title="Medios de Pago"
            buttonLabel="Nuevo Medio de Pago"
            items={cfg.mediosPago}
            onNew={cfg.openNuevoMedioPago}
            onEdit={cfg.openEditMedioPago}
            onDelete={cfg.handleDeleteMedioPago}
          />
        )}
      </main>

      {/* Dialogs */}
      <CategoriaDialog
        open={cfg.categoriaDialog}
        onOpenChange={cfg.setCategoriaDialog}
        form={cfg.categoriaForm}
        onChange={cfg.setCategoriaForm}
        onSave={cfg.handleSaveCategoria}
        isSaving={cfg.isSaving}
      />
      <SubcategoriaDialog
        open={cfg.subcategoriaDialog}
        onOpenChange={cfg.setSubcategoriaDialog}
        form={cfg.subcategoriaForm}
        onChange={cfg.setSubcategoriaForm}
        categorias={cfg.categorias}
        onSave={cfg.handleSaveSubcategoria}
        isSaving={cfg.isSaving}
      />
      <BancoDialog
        open={cfg.bancoDialog}
        onOpenChange={cfg.setBancoDialog}
        form={cfg.bancoForm}
        onChange={cfg.setBancoForm}
        onSave={cfg.handleSaveBanco}
        isSaving={cfg.isSaving}
      />
      <MedioPagoDialog
        open={cfg.medioPagoDialog}
        onOpenChange={cfg.setMedioPagoDialog}
        form={cfg.medioPagoForm}
        onChange={cfg.setMedioPagoForm}
        onSave={cfg.handleSaveMedioPago}
        isSaving={cfg.isSaving}
      />
    </div>
  );
}
