import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { Categoria, Subcategoria, Banco, MedioPago } from "@/lib/types";
import * as service from "@/services/configuracion.service";

// Tipos de formulario
export type CategoriaForm = { id: number; nombre: string; descripcion: string };
export type SubcategoriaForm = {
  id: number;
  categoria_id: number;
  nombre: string;
  descripcion: string;
};
export type BancoForm = { id: number; nombre: string; codigo: string };
export type MedioPagoForm = { id: number; nombre: string; descripcion: string };

const EMPTY_CATEGORIA: CategoriaForm = { id: 0, nombre: "", descripcion: "" };
const EMPTY_SUBCATEGORIA: SubcategoriaForm = {
  id: 0,
  categoria_id: 0,
  nombre: "",
  descripcion: "",
};
const EMPTY_BANCO: BancoForm = { id: 0, nombre: "", codigo: "" };
const EMPTY_MEDIO_PAGO: MedioPagoForm = { id: 0, nombre: "", descripcion: "" };

export function useConfiguracion() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "categorias" | "subcategorias" | "bancos" | "medios"
  >("categorias");

  // Datos
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);

  // Dialogs
  const [categoriaDialog, setCategoriaDialog] = useState(false);
  const [subcategoriaDialog, setSubcategoriaDialog] = useState(false);
  const [bancoDialog, setBancoDialog] = useState(false);
  const [medioPagoDialog, setMedioPagoDialog] = useState(false);

  // Forms
  const [categoriaForm, setCategoriaForm] =
    useState<CategoriaForm>(EMPTY_CATEGORIA);
  const [subcategoriaForm, setSubcategoriaForm] =
    useState<SubcategoriaForm>(EMPTY_SUBCATEGORIA);
  const [bancoForm, setBancoForm] = useState<BancoForm>(EMPTY_BANCO);
  const [medioPagoForm, setMedioPagoForm] =
    useState<MedioPagoForm>(EMPTY_MEDIO_PAGO);

  // ── init ────────────────────────────────────────────────────

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || user?.rol !== "admin") {
      router.push("/");
      return;
    }
    loadAll();
  }, [isHydrated, isAuthenticated]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [cats, subs, bcos, medios] = await Promise.all([
        service.getCategorias(),
        service.getSubcategorias(),
        service.getBancos(),
        service.getMediosPago(),
      ]);
      setCategorias(cats);
      setSubcategorias(subs);
      setBancos(bcos);
      setMediosPago(medios);
    } catch {
      setError("Error al cargar configuración");
    } finally {
      setIsLoading(false);
    }
  };

  // ── handlers genérico ────────────────────────────────────────

  const withSaving = async (fn: () => Promise<void>) => {
    setIsSaving(true);
    setError("");
    try {
      await fn();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── categorías ───────────────────────────────────────────────

  const openNuevaCategoria = () => {
    setCategoriaForm(EMPTY_CATEGORIA);
    setCategoriaDialog(true);
  };

  const openEditCategoria = (cat: Categoria) => {
    setCategoriaForm(cat);
    setCategoriaDialog(true);
  };

  const handleSaveCategoria = () =>
    withSaving(async () => {
      const res = await service.saveCategoria(categoriaForm);
      toast.success(res.message);
      setCategoriaDialog(false);
      setCategorias(await service.getCategorias());
    });

  const handleDeleteCategoria = (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;
    withSaving(async () => {
      const res = await service.deleteCategoria(id);
      toast.success(res.message);
      setCategorias(await service.getCategorias());
    });
  };

  // ── subcategorías ────────────────────────────────────────────

  const openNuevaSubcategoria = () => {
    setSubcategoriaForm(EMPTY_SUBCATEGORIA);
    setSubcategoriaDialog(true);
  };

  const openEditSubcategoria = (sub: Subcategoria) => {
    setSubcategoriaForm({
      id: sub.id,
      categoria_id: sub.categoria_id,
      nombre: sub.nombre,
      descripcion: sub.descripcion,
    });
    setSubcategoriaDialog(true);
  };

  const handleSaveSubcategoria = () =>
    withSaving(async () => {
      const res = await service.saveSubcategoria(subcategoriaForm);
      toast.success(res.message);
      setSubcategoriaDialog(false);
      setSubcategorias(await service.getSubcategorias());
    });

  const handleDeleteSubcategoria = (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta subcategoría?")) return;
    withSaving(async () => {
      const res = await service.deleteSubcategoria(id);
      toast.success(res.message);
      setSubcategorias(await service.getSubcategorias());
    });
  };

  // ── bancos ───────────────────────────────────────────────────

  const openNuevoBanco = () => {
    setBancoForm(EMPTY_BANCO);
    setBancoDialog(true);
  };

  const openEditBanco = (banco: Banco) => {
    setBancoForm(banco);
    setBancoDialog(true);
  };

  const handleSaveBanco = () =>
    withSaving(async () => {
      const res = await service.saveBanco(bancoForm);
      toast.success(res.message);
      setBancoDialog(false);
      setBancos(await service.getBancos());
    });

  const handleDeleteBanco = (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este banco?")) return;
    withSaving(async () => {
      const res = await service.deleteBanco(id);
      toast.success(res.message);
      setBancos(await service.getBancos());
    });
  };

  // ── medios de pago ───────────────────────────────────────────

  const openNuevoMedioPago = () => {
    setMedioPagoForm(EMPTY_MEDIO_PAGO);
    setMedioPagoDialog(true);
  };

  const openEditMedioPago = (medio: MedioPago) => {
    setMedioPagoForm(medio);
    setMedioPagoDialog(true);
  };

  const handleSaveMedioPago = () =>
    withSaving(async () => {
      const res = await service.saveMedioPago(medioPagoForm);
      toast.success(res.message);
      setMedioPagoDialog(false);
      setMediosPago(await service.getMediosPago());
    });

  const handleDeleteMedioPago = (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este medio de pago?")) return;
    withSaving(async () => {
      const res = await service.deleteMedioPago(id);
      toast.success(res.message);
      setMediosPago(await service.getMediosPago());
    });
  };

  return {
    // estado general
    isHydrated,
    isLoading,
    isSaving,
    error,
    activeTab,
    setActiveTab,
    // datos
    categorias,
    subcategorias,
    bancos,
    mediosPago,
    // dialogs
    categoriaDialog,
    setCategoriaDialog,
    subcategoriaDialog,
    setSubcategoriaDialog,
    bancoDialog,
    setBancoDialog,
    medioPagoDialog,
    setMedioPagoDialog,
    // forms
    categoriaForm,
    setCategoriaForm,
    subcategoriaForm,
    setSubcategoriaForm,
    bancoForm,
    setBancoForm,
    medioPagoForm,
    setMedioPagoForm,
    // acciones abrir
    openNuevaCategoria,
    openEditCategoria,
    openNuevaSubcategoria,
    openEditSubcategoria,
    openNuevoBanco,
    openEditBanco,
    openNuevoMedioPago,
    openEditMedioPago,
    // acciones guardar/eliminar
    handleSaveCategoria,
    handleDeleteCategoria,
    handleSaveSubcategoria,
    handleDeleteSubcategoria,
    handleSaveBanco,
    handleDeleteBanco,
    handleSaveMedioPago,
    handleDeleteMedioPago,
  };
}
