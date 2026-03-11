"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { API_ENDPOINTS } from "@/lib/config";
import { AlertTriangle } from "lucide-react";

interface InitialValues {
  concepto?: string;
  monto?: string;
  descripcion?: string;
  fecha?: string;
  prioridad?: "baja" | "media" | "alta";
  categoria_id?: string;
  subcategoria_id?: string;
}

interface NuevoMovimientoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sucursalId: number;
  onSuccess: () => void;
  cajaTipo?: "efectivo" | "banco";
  isPagoPendiente?: boolean;
  /** Cuando se provee, el dialog opera en modo "aprobar pago pendiente" */
  pagoIdToApprove?: number;
  usuarioRevisorId?: number;
  initialValues?: InitialValues;
}

interface Categoria {
  id: number;
  nombre: string;
  tipo?: string;
}

interface Subcategoria {
  id: number;
  categoria_id: number;
  nombre: string;
}

interface Banco {
  id: number;
  nombre: string;
}

interface MedioPago {
  id: number;
  nombre: string;
}

export default function NuevoMovimientoDialog({
  isOpen,
  onClose,
  sucursalId,
  onSuccess,
  cajaTipo = "efectivo",
  isPagoPendiente = false,
  pagoIdToApprove,
  usuarioRevisorId,
  initialValues,
}: NuevoMovimientoDialogProps) {
  const isApprovalMode = pagoIdToApprove !== undefined;
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fecha: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })(),
    concepto: "",
    monto: "",
    descripcion: "",
    prioridad: "media" as "baja" | "media" | "alta",
    estado: (isPagoPendiente ? "pendiente" : "aprobado") as "pendiente" | "aprobado" | "rechazado" | "completado",
    tipo: isPagoPendiente ? "egreso" : "ingreso",
    tipo_movimiento: cajaTipo as "efectivo" | "banco",
    categoria_id: "",
    subcategoria_id: "",
    comprobante: "",
    banco_id: "",
    medio_pago_id: "",
  });

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);

  // Cargar datos y pre-poblar cuando se abre el dialog
  useEffect(() => {
    if (!isOpen) return;

    fetchCategorias();
    if (cajaTipo === "banco") {
      fetchBancos();
      fetchMediosPago();
    }

    if (isApprovalMode && initialValues) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      setFormData((prev) => ({
        ...prev,
        fecha: initialValues.fecha ?? todayStr,
        concepto: initialValues.concepto ?? "",
        monto: initialValues.monto ?? "",
        descripcion: initialValues.descripcion ?? "",
        prioridad: initialValues.prioridad ?? "media",
        categoria_id: initialValues.categoria_id ?? "",
        subcategoria_id: initialValues.subcategoria_id ?? "",
        tipo: "egreso",
        estado: "aprobado",
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cajaTipo]);

  const fetchCategorias = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL);
      const data = await response.json();
      if (response.ok) {
        setCategorias(data.data || []);
      }
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    }
  };

  const fetchBancos = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CONFIGURACION.BANCOS.GET_ALL);
      const data = await response.json();
      if (response.ok) {
        setBancos(data.data || []);
      }
    } catch (err) {
      console.error("Error al cargar bancos:", err);
    }
  };

  const fetchMediosPago = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.GET_ALL);
      const data = await response.json();
      if (response.ok) {
        setMediosPago(data.data || []);
      }
    } catch (err) {
      console.error("Error al cargar medios de pago:", err);
    }
  };

  // Cargar bancos/mediosPago cuando el usuario elige "banco" en tipo_movimiento
  useEffect(() => {
    if (formData.tipo_movimiento === "banco" && bancos.length === 0) {
      fetchBancos();
      fetchMediosPago();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tipo_movimiento]);

  // Cargar subcategorías cuando cambia la categoría
  useEffect(() => {
    if (formData.categoria_id) {
      fetchSubcategorias(Number(formData.categoria_id));
    } else {
      setSubcategorias([]);
    }
  }, [formData.categoria_id]);

  const fetchSubcategorias = async (categoriaId: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_BY_CATEGORIA(categoriaId));
      const data = await response.json();
      if (response.ok) {
        setSubcategorias(data.data || []);
      }
    } catch (err) {
      console.error("Error al cargar subcategorías:", err);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "tipo") {
      setFormData((prev) => ({ ...prev, [name]: value, categoria_id: "", subcategoria_id: "" }));
    } else if (name === "tipo_movimiento") {
      setFormData((prev) => ({ ...prev, tipo_movimiento: value as "efectivo" | "banco", banco_id: "", medio_pago_id: "", comprobante: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      fecha: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })(),
      concepto: "",
      monto: "",
      descripcion: "",
      prioridad: "media",
      estado: isPagoPendiente ? "pendiente" : "aprobado",
      tipo: isPagoPendiente ? "egreso" : "ingreso",
      tipo_movimiento: cajaTipo,
      categoria_id: "",
      subcategoria_id: "",
      comprobante: "",
      banco_id: "",
      medio_pago_id: "",
    });
    setError("");
  };

  // Cerrar dialog
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Guardar nuevo movimiento
  const handleSave = async () => {
    if (!formData.concepto.trim()) {
      setError("El concepto es obligatorio");
      return;
    }
    if (!formData.monto || parseFloat(formData.monto) === 0) {
      setError("El monto debe ser diferente de cero");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      // ── Modo aprobación: crea el movimiento en la caja correspondiente
      //    y luego marca el pago pendiente como aprobado ──
      if (isApprovalMode) {
        const cajaEndpoint = cajaTipo === "banco"
          ? API_ENDPOINTS.CAJA_BANCO.CREATE
          : API_ENDPOINTS.MOVIMIENTOS.CREATE_EFECTIVO;

        const movBody = {
          sucursal_id: sucursalId,
          user_id: usuarioRevisorId ?? user?.id,
          fecha: formData.fecha,
          concepto: formData.concepto,
          monto: parseFloat(formData.monto),
          descripcion: formData.descripcion,
          prioridad: formData.prioridad,
          estado: "aprobado",
          tipo: "egreso",
          categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
          subcategoria_id: formData.subcategoria_id ? Number(formData.subcategoria_id) : null,
          comprobante: formData.comprobante || null,
          banco_id: formData.banco_id ? Number(formData.banco_id) : null,
          medio_pago_id: formData.medio_pago_id ? Number(formData.medio_pago_id) : null,
        };

        const movRes = await fetch(cajaEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(movBody),
        });
        const movData = await movRes.json();
        if (!movRes.ok) throw new Error(movData.message || "Error al crear movimiento");

        // Marcar pago pendiente como aprobado
        const aprobarRes = await fetch(
          API_ENDPOINTS.PAGOS_PENDIENTES.APROBAR(pagoIdToApprove!),
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              usuario_revisor_id: usuarioRevisorId ?? user?.id,
              tipo_caja: cajaTipo,
              fecha: formData.fecha,
              banco_id: formData.banco_id ? Number(formData.banco_id) : null,
              medio_pago_id: formData.medio_pago_id ? Number(formData.medio_pago_id) : null,
            }),
          }
        );
        const aprobarData = await aprobarRes.json();
        if (!aprobarRes.ok) throw new Error(aprobarData.message || "Error al aprobar pago");

        resetForm();
        onSuccess();
        onClose();
        return;
      }

      // ── Modo normal: crear pago pendiente o movimiento directo ──
      const endpoint = isPagoPendiente
        ? API_ENDPOINTS.PAGOS_PENDIENTES.CREATE
        : (cajaTipo === "banco" ? API_ENDPOINTS.CAJA_BANCO.CREATE : API_ENDPOINTS.MOVIMIENTOS.CREATE_EFECTIVO);

      const body = isPagoPendiente ? {
        sucursal_id: sucursalId,
        user_id: user?.id,
        fecha: formData.fecha,
        concepto: formData.concepto,
        descripcion: formData.descripcion,
        monto: parseFloat(formData.monto),
        tipo_movimiento: formData.tipo_movimiento,
        prioridad: formData.prioridad,
        tipo: formData.tipo,
        categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
        subcategoria_id: formData.subcategoria_id ? Number(formData.subcategoria_id) : null,
        banco_id: formData.banco_id ? Number(formData.banco_id) : null,
        medio_pago_id: formData.medio_pago_id ? Number(formData.medio_pago_id) : null,
      } : {
        sucursal_id: sucursalId,
        user_id: user?.id,
        fecha: formData.fecha,
        concepto: formData.concepto,
        monto: parseFloat(formData.monto),
        descripcion: formData.descripcion,
        prioridad: formData.prioridad,
        estado: formData.estado,
        tipo: formData.tipo,
        categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
        subcategoria_id: formData.subcategoria_id ? Number(formData.subcategoria_id) : null,
        comprobante: formData.comprobante,
        banco_id: formData.banco_id ? Number(formData.banco_id) : null,
        medio_pago_id: formData.medio_pago_id ? Number(formData.medio_pago_id) : null,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al crear movimiento");

      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error al crear movimiento:", err);
      setError(err.message || "Error al crear movimiento");
    } finally {
      setIsSaving(false);
    }
  };

  const selectClasses =
    "w-full h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#1A1A1A] transition-colors hover:border-[#B0B0B0] focus:border-[#002868] focus:outline-none focus:ring-2 focus:ring-[#002868]/20 appearance-none cursor-pointer";
  const labelClasses = "text-xs font-semibold text-[#5A6070] uppercase tracking-wider";
  const inputClasses =
    "h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A] transition-colors placeholder:text-[#B0B0B0] hover:border-[#B0B0B0] focus:border-[#002868] focus:ring-2 focus:ring-[#002868]/20";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
        {/* ─── Header ─── */}
        <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
          <DialogHeader className="p-0 border-0">
            <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
              {isApprovalMode ? "Aprobar pago pendiente" : "Nuevo movimiento"}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
              {isApprovalMode
                ? `Registra el egreso en caja ${cajaTipo === "banco" ? "banco" : "efectivo"} para confirmar el pago`
                : `Registra un nuevo movimiento de ${cajaTipo === "banco" ? "banco" : "efectivo"}`}
            </DialogDescription>
          </DialogHeader>
          {isApprovalMode && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-600 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-emerald-700 font-medium">
                Caja destino: <span className="font-bold">{cajaTipo === "banco" ? "Caja Banco" : "Caja Efectivo"}</span> · Tipo fijo: <span className="font-bold">Egreso</span>
              </p>
            </div>
          )}
        </div>

        {/* ─── Body ─── */}
        <div className="px-8 py-6 space-y-6 max-h-[65vh] overflow-y-auto">

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <p className="text-sm text-rose-600 font-medium">{error}</p>
            </div>
          )}

          {/* ── Sección: Información General ── */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-[#002868] rounded-full" />
              Información general
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fecha" className={labelClasses}>
                  Fecha
                </Label>
                <Input
                  id="fecha"
                  name="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  className={inputClasses}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tipo" className={labelClasses}>
                  Tipo *
                </Label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className={`${selectClasses} ${isPagoPendiente || isApprovalMode ? "opacity-60 cursor-not-allowed bg-gray-50" : ""}`}
                  disabled={isPagoPendiente || isApprovalMode}
                >
                  {!isPagoPendiente && !isApprovalMode && <option value="ingreso">Ingreso</option>}
                  <option value="egreso">Egreso</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="concepto" className={labelClasses}>
                Concepto *
              </Label>
              <Input
                id="concepto"
                name="concepto"
                placeholder="Ej: Venta de contado"
                value={formData.concepto}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion" className={labelClasses}>
                Descripción
              </Label>
              <Input
                id="descripcion"
                name="descripcion"
                placeholder="Detalles adicionales (opcional)"
                value={formData.descripcion}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
          </section>

          {/* ── Separador ── */}
          <div className="border-t border-dashed border-[#E8E8E8]" />

          {/* ── Sección: Detalles Financieros ── */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-[#002868] rounded-full" />
              Detalles financieros
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="monto" className={labelClasses}>
                  Monto *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8A8F9C] select-none pointer-events-none">
                    $
                  </span>
                  <Input
                    id="monto"
                    name="monto"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.monto}
                    onChange={handleInputChange}
                    className={`${inputClasses} pl-7`}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prioridad" className={labelClasses}>
                  Prioridad
                </Label>
                <select
                  id="prioridad"
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleInputChange}
                  className={selectClasses}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>

            {(cajaTipo === "banco" || formData.tipo_movimiento === "banco") && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="comprobante" className={labelClasses}>
                    N° Comprobante
                  </Label>
                  <Input
                    id="comprobante"
                    name="comprobante"
                    placeholder="Ej: 0001-00012345"
                    value={formData.comprobante}
                    onChange={handleInputChange}
                    className={inputClasses}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="banco_id" className={labelClasses}>
                      Banco
                    </Label>
                    <select
                      id="banco_id"
                      name="banco_id"
                      value={formData.banco_id}
                      onChange={handleInputChange}
                      className={selectClasses}
                    >
                      <option value="">Seleccione un banco</option>
                      {bancos.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="medio_pago_id" className={labelClasses}>
                      Medio de Pago
                    </Label>
                    <select
                      id="medio_pago_id"
                      name="medio_pago_id"
                      value={formData.medio_pago_id}
                      onChange={handleInputChange}
                      className={selectClasses}
                    >
                      <option value="">Seleccione medio de pago</option>
                      {mediosPago.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* ── Separador ── */}
          <div className="border-t border-dashed border-[#E8E8E8]" />

          {/* ── Sección: Categorización y Estado ── */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-[#002868] rounded-full" />
              Categorización y estado
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="categoria_id" className={labelClasses}>
                  Categoría
                </Label>
                <select
                  id="categoria_id"
                  name="categoria_id"
                  value={formData.categoria_id}
                  onChange={handleInputChange}
                  className={selectClasses}
                >
                  <option value="">Seleccione categoría</option>
                  {categorias
                    .filter((c) => c.tipo === formData.tipo)
                    .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subcategoria_id" className={labelClasses}>
                  Subcategoría
                </Label>
                <select
                  id="subcategoria_id"
                  name="subcategoria_id"
                  value={formData.subcategoria_id}
                  onChange={handleInputChange}
                  disabled={!formData.categoria_id}
                  className={`${selectClasses} disabled:opacity-40 disabled:bg-[#FAFAFA] disabled:cursor-not-allowed`}
                >
                  <option value="">Seleccione subcategoría</option>
                  {subcategorias.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!isPagoPendiente && (
              <div className="space-y-1.5">
                <Label htmlFor="estado" className={labelClasses}>
                  Estado
                </Label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className={selectClasses}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="completado">Completado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
            )}
          </section>
        </div>

        {/* ─── Footer ─── */}
        <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
          <DialogFooter className="sm:justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
              className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] font-medium hover:bg-[#F0F0F0] hover:text-[#1A1A1A] hover:border-[#C0C0C0] transition-all cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className={`h-10 px-6 rounded-lg text-white font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer ${isApprovalMode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#002868] hover:bg-[#003d8f]"}`}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isApprovalMode ? "Aprobando…" : "Creando…"}
                </span>
              ) : (
                isApprovalMode ? "Confirmar y aprobar" : "Crear movimiento"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
