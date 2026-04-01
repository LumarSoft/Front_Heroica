"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { selectClasses, labelClasses, inputClasses } from "@/lib/dialog-styles";
import { API_ENDPOINTS } from "@/lib/config";
import { apiFetch } from "@/lib/api";
import type { SelectOption } from "@/lib/types";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

interface Sucursal {
    id: number;
    nombre: string;
    activo: boolean;
}

interface BulkMoverDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedIds: number[];
    currentSucursalId: number;
    cajaTipo: "efectivo" | "banco";
    onSuccess: () => void;
    bancosExternos?: SelectOption[];
    mediosPagoExternos?: SelectOption[];
}

export function BulkMoverDialog({
    open,
    onOpenChange,
    selectedIds,
    currentSucursalId,
    cajaTipo,
    onSuccess,
    bancosExternos = [],
    mediosPagoExternos = [],
}: BulkMoverDialogProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [isLoadingSucursales, setIsLoadingSucursales] = useState(false);
    const [formData, setFormData] = useState({
        destino_sucursal_id: String(currentSucursalId),
        destino_tipo_movimiento: cajaTipo,
        destino_saldo: "saldo_necesario",
        banco_id: "",
        medio_pago_id: "",
        numero_cheque: "",
    });

    useEffect(() => {
        if (open) {
            setIsLoadingSucursales(true);
            apiFetch(API_ENDPOINTS.SUCURSALES.GET_ALL)
                .then((r) => r.json())
                .then((d) => {
                    if (d.success) setSucursales(d.data.filter((s: Sucursal) => s.activo));
                })
                .finally(() => setIsLoadingSucursales(false));

            setFormData({
                destino_sucursal_id: String(currentSucursalId),
                destino_tipo_movimiento: cajaTipo,
                destino_saldo: "saldo_necesario",
                banco_id: "",
                medio_pago_id: "",
                numero_cheque: "",
            });
        }
    }, [open, currentSucursalId, cajaTipo]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const isDestinoBanco = formData.destino_tipo_movimiento === "banco";

    const selectedMedio = mediosPagoExternos.find(
        (m) => m.id.toString() === formData.medio_pago_id
    );
    const isCheque = selectedMedio && /cheque|echeq/i.test(selectedMedio.nombre);

    const handleSave = async () => {
        if (!formData.destino_sucursal_id) {
            toast.error("Seleccioná una sucursal destino.");
            return;
        }
        if (isDestinoBanco && !formData.banco_id) {
            toast.error("Seleccioná un banco destino.");
            return;
        }
        if (isDestinoBanco && !formData.medio_pago_id) {
            toast.error("Seleccioná un medio de pago.");
            return;
        }

        const endpoint = cajaTipo === "banco"
            ? API_ENDPOINTS.CAJA_BANCO.BULK_MOVER
            : API_ENDPOINTS.MOVIMIENTOS.BULK_MOVER;

        const body: Record<string, unknown> = {
            ids: selectedIds,
            destino_sucursal_id: Number(formData.destino_sucursal_id),
            destino_tipo_movimiento: formData.destino_tipo_movimiento,
            destino_saldo: formData.destino_saldo,
        };

        if (isDestinoBanco) {
            body.banco_id = formData.banco_id ? Number(formData.banco_id) : null;
            body.medio_pago_id = formData.medio_pago_id ? Number(formData.medio_pago_id) : null;
            body.numero_cheque = formData.numero_cheque || null;
        }

        setIsSaving(true);
        try {
            const res = await apiFetch(endpoint, {
                method: "PUT",
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(data.message || "Error al mover.");
            }
        } catch {
            toast.error("Error de red al mover.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
                <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
                    <DialogHeader className="p-0 border-0">
                        <DialogTitle className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                            </div>
                            Mover {selectedIds.length} movimiento{selectedIds.length !== 1 ? "s" : ""}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-[#8A8F9C] mt-2">
                            Todos los seleccionados se moverán al mismo destino.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-8 py-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-1.5">
                        <Label className={labelClasses}>Sucursal Destino</Label>
                        <select
                            name="destino_sucursal_id"
                            value={formData.destino_sucursal_id}
                            onChange={handleChange}
                            className={selectClasses}
                            disabled={isLoadingSucursales}
                        >
                            <option value="">Seleccione sucursal</option>
                            {sucursales.map((s) => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className={labelClasses}>Caja Destino</Label>
                            <select
                                name="destino_tipo_movimiento"
                                value={formData.destino_tipo_movimiento}
                                onChange={handleChange}
                                className={selectClasses}
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="banco">Banco</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className={labelClasses}>Saldo Destino</Label>
                            <select
                                name="destino_saldo"
                                value={formData.destino_saldo}
                                onChange={handleChange}
                                className={selectClasses}
                            >
                                <option value="saldo_real">Saldo Real (Completado)</option>
                                <option value="saldo_necesario">Saldo Necesario</option>
                            </select>
                        </div>
                    </div>

                    {isDestinoBanco && (
                        <div className="space-y-4 mt-4 p-4 bg-[#F8F9FA] rounded-md border border-[#E0E0E0]">
                            <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest">Datos Bancarios</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className={labelClasses}>Banco</Label>
                                    <select
                                        name="banco_id"
                                        value={formData.banco_id}
                                        onChange={handleChange}
                                        className={selectClasses}
                                    >
                                        <option value="">Seleccione banco</option>
                                        {bancosExternos.map((b) => (
                                            <option key={b.id} value={b.id}>{b.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClasses}>Medio de Pago</Label>
                                    <select
                                        name="medio_pago_id"
                                        value={formData.medio_pago_id}
                                        onChange={handleChange}
                                        className={selectClasses}
                                    >
                                        <option value="">Seleccione medio</option>
                                        {mediosPagoExternos.map((m) => (
                                            <option key={m.id} value={m.id}>{m.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {isCheque && (
                                <div className="space-y-1.5">
                                    <Label className={labelClasses}>N° de Cheque</Label>
                                    <Input
                                        name="numero_cheque"
                                        value={formData.numero_cheque}
                                        onChange={handleChange}
                                        placeholder="Ej: 00012345"
                                        className={inputClasses}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

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
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || selectedIds.length === 0}
                            className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isSaving ? "Moviendo..." : `Mover ${selectedIds.length}`}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
