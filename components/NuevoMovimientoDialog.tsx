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

interface NuevoMovimientoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sucursalId: number;
  onSuccess: () => void;
}

interface Categoria {
  id: number;
  nombre: string;
}

interface Subcategoria {
  id: number;
  categoria_id: number;
  nombre: string;
}

export default function NuevoMovimientoDialog({
  isOpen,
  onClose,
  sucursalId,
  onSuccess,
}: NuevoMovimientoDialogProps) {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0], // Fecha actual por defecto
    concepto: "",
    monto: "",
    descripcion: "",
    prioridad: "media" as "baja" | "media" | "alta",
    estado: "aprobado" as "pendiente" | "aprobado" | "rechazado" | "completado",
    tipo: "ingreso",
    categoria_id: "",
    subcategoria_id: "",
  });

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);

  // Cargar categorías al abrir el dialog

  useEffect(() => {
    if (isOpen) {
      fetchCategorias();
    }
  }, [isOpen]);

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split("T")[0],
      concepto: "",
      monto: "",
      descripcion: "",
      prioridad: "media",
      estado: "aprobado",
      tipo: "ingreso",
      categoria_id: "",
      subcategoria_id: "",
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
    // Validaciones
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

      const response = await fetch(API_ENDPOINTS.MOVIMIENTOS.CREATE_EFECTIVO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al crear movimiento");
      }

      // Éxito
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white border-[#E0E0E0] shadow-2xl">
        <DialogHeader className="border-b border-[#E0E0E0] pb-4">
          <DialogTitle className="text-2xl font-bold text-[#002868] flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#002868]/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-[#002868]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            Nuevo Movimiento
          </DialogTitle>
          <DialogDescription className="text-[#666666] mt-2">
            Registra un nuevo movimiento de efectivo
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 font-medium">⚠️ {error}</p>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fecha" className="text-[#002868] font-semibold">
              Fecha
            </Label>
            <Input
              id="fecha"
              name="fecha"
              type="date"
              value={formData.fecha}
              onChange={handleInputChange}
              className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="concepto" className="text-[#002868] font-semibold">
              Concepto *
            </Label>
            <Input
              id="concepto"
              name="concepto"
              value={formData.concepto}
              onChange={handleInputChange}
              placeholder="Ej: Venta de contado"
              className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto" className="text-[#002868] font-semibold">
                Monto *
              </Label>
              <Input
                id="monto"
                name="monto"
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={handleInputChange}
                placeholder="Ej: 15000"
                className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-[#002868] font-semibold">
                Tipo *
              </Label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[#E0E0E0] px-3 py-2 focus:border-[#002868] focus:outline-none focus:ring-1 focus:ring-[#002868]"
              >
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="descripcion"
              className="text-[#002868] font-semibold"
            >
              Descripción
            </Label>
            <Input
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Detalles adicionales (opcional)"
              className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria_id" className="text-[#002868] font-semibold">
                Categoría
              </Label>
              <select
                id="categoria_id"
                name="categoria_id"
                value={formData.categoria_id}
                onChange={handleInputChange}
                className="w-full rounded-md border border-[#E0E0E0] px-3 py-2 focus:border-[#002868] focus:outline-none focus:ring-1 focus:ring-[#002868]"
              >
                <option value="">Seleccione una categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategoria_id" className="text-[#002868] font-semibold">
                Subcategoría
              </Label>
              <select
                id="subcategoria_id"
                name="subcategoria_id"
                value={formData.subcategoria_id}
                onChange={handleInputChange}
                disabled={!formData.categoria_id}
                className="w-full rounded-md border border-[#E0E0E0] px-3 py-2 focus:border-[#002868] focus:outline-none focus:ring-1 focus:ring-[#002868] disabled:opacity-50 disabled:bg-gray-100"
              >
                <option value="">Seleccione una subcategoría</option>
                {subcategorias.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prioridad" className="text-[#002868] font-semibold">
              Prioridad
            </Label>
            <select
              id="prioridad"
              name="prioridad"
              value={formData.prioridad}
              onChange={handleInputChange}
              className="w-full rounded-md border border-[#E0E0E0] px-3 py-2 focus:border-[#002868] focus:outline-none focus:ring-1 focus:ring-[#002868]"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado" className="text-[#002868] font-semibold">
              Estado
            </Label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              className="w-full rounded-md border border-[#E0E0E0] px-3 py-2 focus:border-[#002868] focus:outline-none focus:ring-1 focus:ring-[#002868]"
            >
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="completado">Completado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#1A1A1A] cursor-pointer"
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#002868] text-white hover:bg-[#003d8f] cursor-pointer"
          >
            {isSaving ? "Guardando..." : "Crear Movimiento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
