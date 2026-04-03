"use client";

import { CheckCircle2, Banknote, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatMonto } from "@/lib/formatters";
import type { PagoPendiente } from "@/lib/types";

interface AprobarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPago: PagoPendiente | null;
  onSelectCaja: (caja: "efectivo" | "banco") => void;
}

export function AprobarDialog({
  open,
  onOpenChange,
  selectedPago,
  onSelectCaja,
}: AprobarDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-white border-[#E0E0E0] shadow-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-[#F0F0F0] bg-[#F8F9FA]/50">
          <DialogTitle className="text-xl font-bold text-[#002868] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2
                className="w-5 h-5 text-emerald-600"
                strokeWidth={2}
              />
            </div>
            ¿Dónde registrar el pago?
          </DialogTitle>
          <DialogDescription className="text-[#666666] mt-2">
            Seleccioná la caja en la que se registrará el egreso.
            {selectedPago && (
              <span className="block mt-1 font-semibold text-[#1A1A1A]">
                {selectedPago.concepto} ·{" "}
                {formatMonto(
                  Math.abs(parseFloat(selectedPago.monto.toString())),
                )}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelectCaja("efectivo")}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-[#E0E0E0] bg-white hover:border-[#002868] hover:bg-[#002868]/5 transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#002868]/10 flex items-center justify-center group-hover:bg-[#002868]/20 transition-colors">
              <Banknote className="w-7 h-7 text-[#002868]" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="font-bold text-[#002868] text-sm">Caja Efectivo</p>
              <p className="text-xs text-[#666666] mt-0.5">
                Dinero en sucursal
              </p>
            </div>
          </button>

          <button
            onClick={() => onSelectCaja("banco")}
            className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-[#E0E0E0] bg-white hover:border-[#002868] hover:bg-[#002868]/5 transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#002868]/10 flex items-center justify-center group-hover:bg-[#002868]/20 transition-colors">
              <Building2 className="w-7 h-7 text-[#002868]" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="font-bold text-[#002868] text-sm">Caja Banco</p>
              <p className="text-xs text-[#666666] mt-0.5">
                Transferencia / débito
              </p>
            </div>
          </button>
        </div>

        <div className="px-6 pb-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full h-10 rounded-xl border-[#E0E0E0] text-[#5A6070] font-semibold hover:bg-[#F0F0F0] transition-all cursor-pointer"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
