"use client";

import { useState, useEffect } from "react";
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
import type { Transaction, Categoria, Subcategoria, SelectOption } from "@/lib/types";
import { selectClasses, labelClasses, inputClasses } from "@/lib/dialog-styles";
import { Lightbulb, CheckCircle2 } from "lucide-react";

// =============================================
// Dialog de Detalles (edición de movimiento)
// =============================================

interface DetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: {
        fecha: string;
        concepto: string;
        monto: string;
        descripcion: string;
        prioridad: string;
        tipo: string;
        categoria_id: string;
        subcategoria_id: string;
        comprobante: string;
        banco_id: string;
        medio_pago_id: string;
    };
    onInputChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => void;
    onSave: () => void;
    isSaving: boolean;
    categorias: Categoria[];
    subcategorias: Subcategoria[];
    bancos: SelectOption[];
    mediosPago: SelectOption[];
    showBancoFields?: boolean;
    isReadOnly?: boolean;
}

export function DetailsDialog({
    open,
    onOpenChange,
    formData,
    onInputChange,
    onSave,
    isSaving,
    categorias,
    subcategorias,
    bancos,
    mediosPago,
    showBancoFields = false,
    isReadOnly = false,
}: DetailsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
                {/* ─── Header ─── */}
                <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
                    <DialogHeader className="p-0 border-0">
                        <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                            {isReadOnly ? "Ver movimiento" : "Editar movimiento"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                            {isReadOnly ? "Sucursal inactiva — solo visualización" : "Modifica los datos del movimiento de caja"}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* ─── Body ─── */}
                <div className="px-8 py-6 space-y-6 max-h-[65vh] overflow-y-auto">

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
                                    onChange={onInputChange}
                                    className={inputClasses}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="tipo" className={labelClasses}>
                                    Tipo
                                </Label>
                                <select
                                    id="tipo"
                                    name="tipo"
                                    value={formData.tipo}
                                    onChange={onInputChange}
                                    className={selectClasses}
                                >
                                    <option value="ingreso">Ingreso</option>
                                    <option value="egreso">Egreso</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="concepto" className={labelClasses}>
                                Concepto
                            </Label>
                            <Input
                                id="concepto"
                                name="concepto"
                                placeholder="Ej: Transferencia recibida"
                                value={formData.concepto}
                                onChange={onInputChange}
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
                                placeholder="Detalle adicional del movimiento"
                                value={formData.descripcion}
                                onChange={onInputChange}
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
                                    Monto
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8A8F9C] select-none pointer-events-none">
                                        $
                                    </span>
                                    <Input
                                        id="monto"
                                        name="monto"
                                        type="number"
                                        placeholder="0,00"
                                        value={formData.monto}
                                        onChange={onInputChange}
                                        className={`${inputClasses} pl-7`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="comprobante" className={labelClasses}>
                                    N° Comprobante
                                </Label>
                                <Input
                                    id="comprobante"
                                    name="comprobante"
                                    placeholder="Ej: 0001-00012345"
                                    value={formData.comprobante}
                                    onChange={onInputChange}
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        {showBancoFields && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="banco_id" className={labelClasses}>
                                        Banco
                                    </Label>
                                    <select
                                        id="banco_id"
                                        name="banco_id"
                                        value={formData.banco_id}
                                        onChange={onInputChange}
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
                                        onChange={onInputChange}
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
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="prioridad" className={labelClasses}>
                                Prioridad
                            </Label>
                            <select
                                id="prioridad"
                                name="prioridad"
                                value={formData.prioridad}
                                onChange={onInputChange}
                                className={selectClasses}
                            >
                                <option value="baja">Baja</option>
                                <option value="media">Media</option>
                                <option value="alta">Alta</option>
                            </select>
                        </div>
                    </section>

                    {/* ── Separador ── */}
                    <div className="border-t border-dashed border-[#E8E8E8]" />

                    {/* ── Sección: Categorización ── */}
                    <section className="space-y-4">
                        <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1 h-4 bg-[#002868] rounded-full" />
                            Categorización
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
                                    onChange={onInputChange}
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
                                    onChange={onInputChange}
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
                    </section>
                </div>

                {/* ─── Footer ─── */}
                <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
                    <DialogFooter className="sm:justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                            className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] font-medium hover:bg-[#F0F0F0] hover:text-[#1A1A1A] hover:border-[#C0C0C0] transition-all cursor-pointer"
                        >
                            {isReadOnly ? "Cerrar" : "Cancelar"}
                        </Button>
                        {!isReadOnly && (
                            <Button
                                onClick={onSave}
                                disabled={isSaving}
                                className="h-10 px-6 rounded-lg bg-[#002868] text-white font-semibold hover:bg-[#003d8f] shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Guardando…
                                    </span>
                                ) : (
                                    "Guardar cambios"
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// =============================================
// Dialog de Cambio de Estado
// =============================================

interface StateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nuevoEstado: string;
    onEstadoChange: (value: string) => void;
    onSave: () => void;
    isSaving: boolean;
}

export function StateDialog({
    open,
    onOpenChange,
    nuevoEstado,
    onEstadoChange,
    onSave,
    isSaving,
}: StateDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] bg-white border-[#E0E0E0] shadow-2xl">
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
                                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                                />
                            </svg>
                        </div>
                        Cambiar Estado
                    </DialogTitle>
                    <DialogDescription className="text-[#666666] mt-2">
                        Selecciona el nuevo estado para este movimiento
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="estado" className="text-[#002868] font-semibold">
                            Nuevo Estado
                        </Label>
                        <select
                            id="estado"
                            value={nuevoEstado}
                            onChange={(e) => onEstadoChange(e.target.value)}
                            className="w-full rounded-md border border-[#E0E0E0] px-3 py-2 focus:border-[#002868] focus:outline-none focus:ring-1 focus:ring-[#002868]"
                        >
                            <option value="pendiente">Pendiente</option>
                            <option value="aprobado">Aprobado</option>
                            <option value="rechazado">Rechazado</option>
                            <option value="completado">Completado</option>
                        </select>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#1A1A1A] cursor-pointer"
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className="bg-[#002868] text-white hover:bg-[#003d8f] cursor-pointer"
                    >
                        {isSaving ? "Guardando..." : "Cambiar Estado"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// =============================================
// Dialog de DEUDA
// =============================================

interface DeudaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: { es_deuda?: number; fecha?: string; fecha_original_vencimiento?: string } | null;
    onSave: (esDeuda: boolean, fechaOriginalVencimiento?: string) => void;
    isSaving: boolean;
}

export function DeudaDialog({
    open,
    onOpenChange,
    transaction,
    onSave,
    isSaving,
}: DeudaDialogProps) {
    const [localFecha, setLocalFecha] = useState(
        transaction?.fecha ? transaction.fecha.split("T")[0] : ""
    );

    // Reset localFecha when dialog opens with a new transaction
    useEffect(() => {
        if (open) {
            setLocalFecha(transaction?.fecha ? transaction.fecha.split("T")[0] : "");
        }
    }, [open, transaction]);

    const esDeudaActiva = transaction?.es_deuda === 1;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className={`px-8 pt-8 pb-5 border-b ${esDeudaActiva ? "border-orange-100 bg-orange-50/40" : "border-[#F0F0F0]"}`}>
                    <DialogHeader className="p-0 border-0">
                        <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${esDeudaActiva ? "bg-orange-100" : "bg-[#002868]/10"}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${esDeudaActiva ? "text-orange-600" : "text-[#002868]"}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            {esDeudaActiva ? "Deuda Activa" : "Marcar como Deuda"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
                            {esDeudaActiva
                                ? "Este movimiento está en deuda y no contabiliza en el saldo necesario."
                                : "Al activar la deuda, este movimiento no contabilizará en el saldo necesario hasta que se libere."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Body */}
                <div className="px-8 py-6 space-y-4">
                    {esDeudaActiva ? (
                        <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 space-y-2">
                            <p className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                Este movimiento está en deuda
                            </p>
                            {transaction?.fecha_original_vencimiento && (
                                <p className="text-xs text-orange-600">
                                    Fecha original de vencimiento: <span className="font-bold">
                                        {(() => {
                                            const partes = transaction.fecha_original_vencimiento!.split("T")[0].split("-");
                                            return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : transaction.fecha_original_vencimiento;
                                        })()}
                                    </span>
                                </p>
                            )}
                            <p className="text-xs text-orange-500 mt-1">
                                Al quitar la deuda, la fecha original quedará registrada en la descripción del movimiento.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                                <p className="text-xs text-amber-700">
                                    <Lightbulb className="w-3.5 h-3.5 inline mr-1 text-amber-600" /> Indicá la fecha original de vencimiento de este movimiento. Quedará guardada para cuando se libere la deuda.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">
                                    Fecha original de vencimiento
                                </label>
                                <input
                                    type="date"
                                    value={localFecha}
                                    onChange={(e) => setLocalFecha(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#1A1A1A] transition-colors hover:border-[#B0B0B0] focus:border-[#002868] focus:outline-none focus:ring-2 focus:ring-[#002868]/20"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
                    <DialogFooter className="sm:justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                            className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] font-medium hover:bg-[#F0F0F0] hover:text-[#1A1A1A] hover:border-[#C0C0C0] transition-all cursor-pointer"
                        >
                            Cancelar
                        </Button>
                        {esDeudaActiva ? (
                            <Button
                                onClick={() => onSave(false)}
                                disabled={isSaving}
                                className="h-10 px-6 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-sm hover:shadow-md transition-all cursor-pointer"
                            >
                                {isSaving ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Procesando…
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Quitar Deuda</span>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={() => onSave(true, localFecha || undefined)}
                                disabled={isSaving}
                                className="h-10 px-6 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 shadow-sm hover:shadow-md transition-all cursor-pointer"
                            >
                                {isSaving ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Procesando…
                                    </span>
                                ) : (
                                    "Activar Deuda"
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// =============================================
// Dialog de Confirmación de Eliminación
// =============================================

interface DeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isSaving: boolean;
}

export function DeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    isSaving,
}: DeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] bg-white border-rose-200 shadow-2xl">
                <DialogHeader className="border-b border-rose-100 pb-4">
                    <DialogTitle className="text-2xl font-bold text-rose-600 flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5 text-rose-600"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                />
                            </svg>
                        </div>
                        Confirmar Eliminación
                    </DialogTitle>
                    <DialogDescription className="text-[#666666] mt-2">
                        ¿Estás seguro de que deseas eliminar este movimiento? Esta acción no
                        se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#1A1A1A] cursor-pointer"
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isSaving}
                        className="bg-rose-500 text-white hover:bg-rose-600 cursor-pointer"
                    >
                        {isSaving ? "Eliminando..." : "Eliminar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
