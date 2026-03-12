"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import {
  Settings,
  FolderOpen,
  Folder,
  Building2,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  tipo: "ingreso" | "egreso";
}

interface Subcategoria {
  id: number;
  categoria_id: number;
  categoria_nombre: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

interface Banco {
  id: number;
  nombre: string;
  codigo: string;
  activo: boolean;
}

interface MedioPago {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export default function ConfiguracionPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const isSuperAdmin = useAuthStore((state) => state.isSuperAdmin());
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "categorias" | "subcategorias" | "bancos" | "medios"
  >("categorias");

  // Estados para datos
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);

  // Estados de carga
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados de modales
  const [isCategoriaDialogOpen, setIsCategoriaDialogOpen] = useState(false);
  const [isSubcategoriaDialogOpen, setIsSubcategoriaDialogOpen] =
    useState(false);
  const [isBancoDialogOpen, setIsBancoDialogOpen] = useState(false);
  const [isMedioPagoDialogOpen, setIsMedioPagoDialogOpen] = useState(false);

  // Estados de formularios
  const [categoriaForm, setCategoriaForm] = useState<{
    id: number;
    nombre: string;
    descripcion: string;
    tipo: "ingreso" | "egreso";
  }>({ id: 0, nombre: "", descripcion: "", tipo: "egreso" });
  const [subcategoriaForm, setSubcategoriaForm] = useState({
    id: 0,
    categoria_id: 0,
    nombre: "",
    descripcion: "",
  });
  const [bancoForm, setBancoForm] = useState({ id: 0, nombre: "", codigo: "" });
  const [medioPagoForm, setMedioPagoForm] = useState({
    id: 0,
    nombre: "",
    descripcion: "",
  });

    const [error, setError] = useState("");

    // ── Delete confirmation ──
    const [deleteTarget, setDeleteTarget] = useState<{
        type: "categoria" | "subcategoria" | "banco" | "medioPago";
        id: number;
        nombre: string;
    } | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated || !isSuperAdmin) {
      router.push("/");
      return;
    }

    fetchAllData();
  }, [isAuthenticated, isHydrated, router, isSuperAdmin]);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchCategorias(),
                fetchSubcategorias(),
                fetchBancos(),
                fetchMediosPago(),
            ]);
        } catch {
            setError("Error al cargar configuración");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategorias = async () => {
        const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL);
        const data = await res.json();
        if (data.success) setCategorias(data.data);
    };

    const fetchSubcategorias = async () => {
        const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_ALL);
        const data = await res.json();
        if (data.success) setSubcategorias(data.data);
    };

    const fetchBancos = async () => {
        const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.BANCOS.GET_ALL);
        const data = await res.json();
        if (data.success) setBancos(data.data);
    };

    const fetchMediosPago = async () => {
        const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.GET_ALL);
        const data = await res.json();
        if (data.success) setMediosPago(data.data);
    };

  // ========== CATEGORÍAS ==========
    const handleSaveCategoria = async () => {
        setIsSaving(true);
        setError("");
        try {
            const url = categoriaForm.id
                ? API_ENDPOINTS.CONFIGURACION.CATEGORIAS.UPDATE(categoriaForm.id)
                : API_ENDPOINTS.CONFIGURACION.CATEGORIAS.CREATE;

            const res = await apiFetch(url, {
                method: categoriaForm.id ? "PUT" : "POST",
                body: JSON.stringify(categoriaForm),
            });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setIsCategoriaDialogOpen(false);
        setCategoriaForm({
          id: 0,
          nombre: "",
          descripcion: "",
          tipo: "egreso",
        });
        await fetchCategorias();
      } else {
        setError(data.message);
      }
    } catch {
      setError("Error al guardar categoría");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategoria = (id: number, nombre: string) => {
    setDeleteTarget({ type: "categoria", id, nombre });
  };

  // ========== SUBCATEGORÍAS ==========
  const handleSaveSubcategoria = async () => {
    setIsSaving(true);
    setError("");
    try {
      const url = subcategoriaForm.id
        ? API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.UPDATE(subcategoriaForm.id)
        : API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.CREATE;

      const res = await apiFetch(url, {
        method: subcategoriaForm.id ? "PUT" : "POST",
        body: JSON.stringify(subcategoriaForm),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setIsSubcategoriaDialogOpen(false);
        setSubcategoriaForm({ id: 0, categoria_id: 0, nombre: "", descripcion: "" });
        await fetchSubcategorias();
      } else {
        setError(data.message);
      }
    } catch {
      setError("Error al guardar subcategoría");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubcategoria = (id: number, nombre: string) => {
    setDeleteTarget({ type: "subcategoria", id, nombre });
  };

  // ========== BANCOS ==========
  const handleSaveBanco = async () => {
    setIsSaving(true);
    setError("");
    try {
      const url = bancoForm.id
        ? API_ENDPOINTS.CONFIGURACION.BANCOS.UPDATE(bancoForm.id)
        : API_ENDPOINTS.CONFIGURACION.BANCOS.CREATE;

      const res = await apiFetch(url, {
        method: bancoForm.id ? "PUT" : "POST",
        body: JSON.stringify(bancoForm),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setIsBancoDialogOpen(false);
        setBancoForm({ id: 0, nombre: "", codigo: "" });
        await fetchBancos();
      } else {
        setError(data.message);
      }
    } catch {
      setError("Error al guardar banco");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBanco = (id: number, nombre: string) => {
    setDeleteTarget({ type: "banco", id, nombre });
  };

  // ========== MEDIOS DE PAGO ==========
  const handleSaveMedioPago = async () => {
    setIsSaving(true);
    setError("");
    try {
      const url = medioPagoForm.id
        ? API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.UPDATE(medioPagoForm.id)
        : API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.CREATE;

      const res = await apiFetch(url, {
        method: medioPagoForm.id ? "PUT" : "POST",
        body: JSON.stringify(medioPagoForm),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setIsMedioPagoDialogOpen(false);
        setMedioPagoForm({ id: 0, nombre: "", descripcion: "" });
        await fetchMediosPago();
      } else {
        setError(data.message);
      }
    } catch {
      setError("Error al guardar medio de pago");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMedioPago = (id: number, nombre: string) => {
    setDeleteTarget({ type: "medioPago", id, nombre });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    try {
      const urlMap = {
        categoria: API_ENDPOINTS.CONFIGURACION.CATEGORIAS.DELETE(id),
        subcategoria: API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.DELETE(id),
        banco: API_ENDPOINTS.CONFIGURACION.BANCOS.DELETE(id),
        medioPago: API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.DELETE(id),
      };
      const refetchMap = {
        categoria: fetchCategorias,
        subcategoria: fetchSubcategorias,
        banco: fetchBancos,
        medioPago: fetchMediosPago,
      };
      const res = await apiFetch(urlMap[type], { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        await refetchMap[type]();
      } else {
        setError(data.message);
      }
    } catch {
      setError("Error al eliminar");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#002868] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#666666]">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push("/sucursales")}
                variant="outline"
                size="sm"
                className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#666666] cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 mr-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
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
        </div>
      </header>

      {error && (
        <div className="container mx-auto px-6 pt-4">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="container mx-auto px-6 py-6 flex flex-col items-center">
        <div className="flex justify-center w-full max-w-4xl gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("categorias")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "categorias"
                ? "text-[#002868] border-b-2 border-[#002868]"
                : "text-[#666666] hover:text-[#002868]"
            }`}
          >
            <Folder className="w-4 h-4 inline mr-1.5" /> Categorías
          </button>
          <button
            onClick={() => setActiveTab("subcategorias")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "subcategorias"
                ? "text-[#002868] border-b-2 border-[#002868]"
                : "text-[#666666] hover:text-[#002868]"
            }`}
          >
            <FolderOpen className="w-4 h-4 inline mr-1.5" /> Subcategorías
          </button>
          <button
            onClick={() => setActiveTab("bancos")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "bancos"
                ? "text-[#002868] border-b-2 border-[#002868]"
                : "text-[#666666] hover:text-[#002868]"
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-1.5" /> Bancos
          </button>
          <button
            onClick={() => setActiveTab("medios")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "medios"
                ? "text-[#002868] border-b-2 border-[#002868]"
                : "text-[#666666] hover:text-[#002868]"
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-1.5" /> Medios de Pago
          </button>
        </div>

        {/* Content */}
        <div className="max-w-4xl w-full mx-auto">
          {/* CATEGORÍAS */}
          {activeTab === "categorias" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Categorías</CardTitle>
                <Button
                  onClick={() => {
                    setCategoriaForm({
                      id: 0,
                      nombre: "",
                      descripcion: "",
                      tipo: "egreso",
                    });
                    setIsCategoriaDialogOpen(true);
                  }}
                  className="bg-[#002868] hover:bg-[#003d8f]"
                >
                  + Nueva Categoría
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categorias.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <h3 className="font-semibold text-[#002868]">
                          {cat.nombre}
                          <span
                            className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                              cat.tipo === "ingreso"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {cat.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                          </span>
                        </h3>
                        {cat.descripcion && (
                          <p className="text-sm text-[#666666]">
                            {cat.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setCategoriaForm(cat);
                            setIsCategoriaDialogOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Editar
                        </Button>
                                                <Button
                                                    onClick={() => handleDeleteCategoria(cat.id, cat.nombre)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-rose-600 hover:bg-rose-50"
                                                >
                                                    Eliminar
                                                </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SUBCATEGORÍAS */}
          {activeTab === "subcategorias" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Subcategorías</CardTitle>
                <Button
                  onClick={() => {
                    setSubcategoriaForm({
                      id: 0,
                      categoria_id: 0,
                      nombre: "",
                      descripcion: "",
                    });
                    setIsSubcategoriaDialogOpen(true);
                  }}
                  className="bg-[#002868] hover:bg-[#003d8f]"
                >
                  + Nueva Subcategoría
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subcategorias.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <h3 className="font-semibold text-[#002868]">
                          {sub.nombre}
                        </h3>
                        <p className="text-xs text-[#666666]">
                          Categoría: {sub.categoria_nombre}
                        </p>
                        {sub.descripcion && (
                          <p className="text-sm text-[#666666] mt-1">
                            {sub.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSubcategoriaForm({
                              id: sub.id,
                              categoria_id: sub.categoria_id,
                              nombre: sub.nombre,
                              descripcion: sub.descripcion,
                            });
                            setIsSubcategoriaDialogOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Editar
                        </Button>
                                                <Button
                                                    onClick={() => handleDeleteSubcategoria(sub.id, sub.nombre)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-rose-600 hover:bg-rose-50"
                                                >
                                                    Eliminar
                                                </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* BANCOS */}
          {activeTab === "bancos" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Bancos</CardTitle>
                <Button
                  onClick={() => {
                    setBancoForm({ id: 0, nombre: "", codigo: "" });
                    setIsBancoDialogOpen(true);
                  }}
                  className="bg-[#002868] hover:bg-[#003d8f]"
                >
                  + Nuevo Banco
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bancos.map((banco) => (
                    <div
                      key={banco.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <h3 className="font-semibold text-[#002868]">
                          {banco.nombre}
                        </h3>
                        {banco.codigo && (
                          <p className="text-sm text-[#666666]">
                            Código: {banco.codigo}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setBancoForm(banco);
                            setIsBancoDialogOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Editar
                        </Button>
                                                <Button
                                                    onClick={() => handleDeleteBanco(banco.id, banco.nombre)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-rose-600 hover:bg-rose-50"
                                                >
                                                    Eliminar
                                                </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* MEDIOS DE PAGO */}
          {activeTab === "medios" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Medios de Pago</CardTitle>
                <Button
                  onClick={() => {
                    setMedioPagoForm({ id: 0, nombre: "", descripcion: "" });
                    setIsMedioPagoDialogOpen(true);
                  }}
                  className="bg-[#002868] hover:bg-[#003d8f]"
                >
                  + Nuevo Medio de Pago
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mediosPago.map((medio) => (
                    <div
                      key={medio.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <h3 className="font-semibold text-[#002868]">
                          {medio.nombre}
                        </h3>
                        {medio.descripcion && (
                          <p className="text-sm text-[#666666]">
                            {medio.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setMedioPagoForm(medio);
                            setIsMedioPagoDialogOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Editar
                        </Button>
                                                <Button
                                                    onClick={() => handleDeleteMedioPago(medio.id, medio.nombre)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-rose-600 hover:bg-rose-50"
                                                >
                                                    Eliminar
                                                </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* DIALOG CATEGORÍA */}
      <Dialog
        open={isCategoriaDialogOpen}
        onOpenChange={setIsCategoriaDialogOpen}
      >
        <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
            <DialogHeader className="p-0 border-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                {categoriaForm.id ? "Editar Categoría" : "Nueva Categoría"}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                {categoriaForm.id
                  ? "Modifica los detalles de esta categoría"
                  : "Agrega una nueva categoría al sistema"}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <Label
                htmlFor="cat-nombre"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Nombre *
              </Label>
              <Input
                id="cat-nombre"
                value={categoriaForm.nombre}
                onChange={(e) =>
                  setCategoriaForm({ ...categoriaForm, nombre: e.target.value })
                }
                placeholder="Ej: Servicios"
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label
                htmlFor="cat-desc"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Descripción
              </Label>
              <Textarea
                id="cat-desc"
                value={categoriaForm.descripcion || ""}
                onChange={(e) =>
                  setCategoriaForm({
                    ...categoriaForm,
                    descripcion: e.target.value,
                  })
                }
                placeholder="Descripción opcional"
                className="min-h-[80px] rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label
                htmlFor="cat-tipo"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Tipo *
              </Label>
              <Select
                value={categoriaForm.tipo || "egreso"}
                onValueChange={(value: "ingreso" | "egreso") =>
                  setCategoriaForm({ ...categoriaForm, tipo: value })
                }
              >
                <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]">
                  <SelectValue placeholder="Seleccione el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
            <DialogFooter className="sm:justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsCategoriaDialogOpen(false)}
                className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] font-medium hover:bg-[#F0F0F0] hover:text-[#1A1A1A] transition-all"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveCategoria}
                disabled={isSaving || !categoriaForm.nombre}
                className="h-10 px-6 rounded-lg bg-[#002868] text-white font-semibold hover:bg-[#003d8f] shadow-sm transition-all"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG SUBCATEGORÍA */}
      <Dialog
        open={isSubcategoriaDialogOpen}
        onOpenChange={setIsSubcategoriaDialogOpen}
      >
        <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
            <DialogHeader className="p-0 border-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                {subcategoriaForm.id
                  ? "Editar Subcategoría"
                  : "Nueva Subcategoría"}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                {subcategoriaForm.id
                  ? "Modifica los detalles de esta subcategoría"
                  : "Agrega una nueva subcategoría a una categoría existente"}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <Label
                htmlFor="subcat-categoria"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Categoría *
              </Label>
              <Select
                value={subcategoriaForm.categoria_id.toString()}
                onValueChange={(value) =>
                  setSubcategoriaForm({
                    ...subcategoriaForm,
                    categoria_id: parseInt(value),
                  })
                }
              >
                <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="subcat-nombre"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Nombre *
              </Label>
              <Input
                id="subcat-nombre"
                value={subcategoriaForm.nombre}
                onChange={(e) =>
                  setSubcategoriaForm({
                    ...subcategoriaForm,
                    nombre: e.target.value,
                  })
                }
                placeholder="Ej: Luz"
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label
                htmlFor="subcat-desc"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Descripción
              </Label>
              <Textarea
                id="subcat-desc"
                value={subcategoriaForm.descripcion || ""}
                onChange={(e) =>
                  setSubcategoriaForm({
                    ...subcategoriaForm,
                    descripcion: e.target.value,
                  })
                }
                placeholder="Descripción opcional"
                className="min-h-[80px] rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
          </div>
          <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
            <DialogFooter className="sm:justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsSubcategoriaDialogOpen(false)}
                className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] font-medium hover:bg-[#F0F0F0] hover:text-[#1A1A1A] transition-all"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveSubcategoria}
                disabled={
                  isSaving ||
                  !subcategoriaForm.nombre ||
                  !subcategoriaForm.categoria_id
                }
                className="h-10 px-6 rounded-lg bg-[#002868] text-white font-semibold hover:bg-[#003d8f] shadow-sm transition-all"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG BANCO */}
      <Dialog open={isBancoDialogOpen} onOpenChange={setIsBancoDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
            <DialogHeader className="p-0 border-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                {bancoForm.id ? "Editar Banco" : "Nuevo Banco"}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                {bancoForm.id
                  ? "Modifica los detalles de este banco"
                  : "Agrega un nuevo banco al sistema"}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <Label
                htmlFor="banco-nombre"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Nombre *
              </Label>
              <Input
                id="banco-nombre"
                value={bancoForm.nombre}
                onChange={(e) =>
                  setBancoForm({ ...bancoForm, nombre: e.target.value })
                }
                placeholder="Ej: Banco Galicia"
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label
                htmlFor="banco-codigo"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Código
              </Label>
              <Input
                id="banco-codigo"
                value={bancoForm.codigo}
                onChange={(e) =>
                  setBancoForm({ ...bancoForm, codigo: e.target.value })
                }
                placeholder="Ej: GALI"
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
          </div>
          <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
            <DialogFooter className="sm:justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsBancoDialogOpen(false)}
                className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] font-medium hover:bg-[#F0F0F0] hover:text-[#1A1A1A] transition-all"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveBanco}
                disabled={isSaving || !bancoForm.nombre}
                className="h-10 px-6 rounded-lg bg-[#002868] text-white font-semibold hover:bg-[#003d8f] shadow-sm transition-all"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG MEDIO DE PAGO */}
      <Dialog
        open={isMedioPagoDialogOpen}
        onOpenChange={setIsMedioPagoDialogOpen}
      >
        <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
          <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
            <DialogHeader className="p-0 border-0">
              <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                {medioPagoForm.id
                  ? "Editar Medio de Pago"
                  : "Nuevo Medio de Pago"}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                {medioPagoForm.id
                  ? "Modifica los detalles de este medio de pago"
                  : "Agrega un nuevo medio de pago al sistema"}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6 space-y-4">
            <div>
              <Label
                htmlFor="medio-nombre"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Nombre *
              </Label>
              <Input
                id="medio-nombre"
                value={medioPagoForm.nombre}
                onChange={(e) =>
                  setMedioPagoForm({ ...medioPagoForm, nombre: e.target.value })
                }
                placeholder="Ej: Transferencia"
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
            <div>
              <Label
                htmlFor="medio-desc"
                className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block"
              >
                Descripción
              </Label>
              <Textarea
                id="medio-desc"
                value={medioPagoForm.descripcion || ""}
                onChange={(e) =>
                  setMedioPagoForm({
                    ...medioPagoForm,
                    descripcion: e.target.value,
                  })
                }
                placeholder="Descripción opcional"
                className="min-h-[80px] rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              />
            </div>
          </div>
          <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
            <DialogFooter className="sm:justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsMedioPagoDialogOpen(false)}
                className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] font-medium hover:bg-[#F0F0F0] hover:text-[#1A1A1A] transition-all"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveMedioPago}
                disabled={isSaving || !medioPagoForm.nombre}
                className="h-10 px-6 rounded-lg bg-[#002868] text-white font-semibold hover:bg-[#003d8f] shadow-sm transition-all"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG CONFIRMACIÓN DE ELIMINACIÓN */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-rose-600">
              Confirmar Eliminación
            </DialogTitle>
          </DialogHeader>
          <p className="text-[#666666] text-sm py-2">
            ¿Estás seguro de eliminar{" "}
            <span className="font-semibold text-[#1A1A1A]">
              &quot;{deleteTarget?.nombre}&quot;
            </span>
            ? Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
