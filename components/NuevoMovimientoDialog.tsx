"use client";

import { useState } from "react";
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

export default function NuevoMovimientoDialog({
  isOpen,
  onClose,
  sucursalId,
  onSuccess,
}: NuevoMovimientoDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0], // Fecha actual por defecto
    concepto: "",
    monto: "",
    descripcion: "",
    prioridad: "media" as "baja" | "media" | "alta",
    estado: "aprobado" as "pendiente" | "aprobado" | "rechazado" | "completado",
  });

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
          fecha: formData.fecha,
          concepto: formData.concepto,
          monto: parseFloat(formData.monto),
          descripcion: formData.descripcion,
          prioridad: formData.prioridad,
          estado: formData.estado,
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
              placeholder="Ej: 15000 (positivo para ingreso, negativo para egreso)"
              className="border-[#E0E0E0] focus:border-[#002868] focus:ring-[#002868]"
            />
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
