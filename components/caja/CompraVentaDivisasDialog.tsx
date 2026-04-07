'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { API_ENDPOINTS } from '@/lib/config';
import { apiFetch } from '@/lib/api';
import {
  parseInputMonto,
  formatInputMonto,
  formatMonto,
} from '@/lib/formatters';
import { inputClasses, labelClasses, selectClasses } from '@/lib/dialog-styles';
import { ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react';

interface CompraVentaDivisasDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sucursalId: number;
  onSuccess: () => void;
}

export function CompraVentaDivisasDialog({
  isOpen,
  onClose,
  sucursalId,
  onSuccess,
}: CompraVentaDivisasDialogProps) {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    operacion: 'compra' as 'compra' | 'venta',
    fecha: (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })(),
    cantidad_usd: '',
    cotizacion: '',
    concepto: '',
    descripcion: '',
  });

  // Auto-populate concepto when operacion changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      concepto:
        prev.operacion === 'compra'
          ? 'Compra de divisas (USD)'
          : 'Venta de divisas (USD)',
    }));
  }, [formData.operacion]);

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setFormData({
      operacion: 'compra',
      fecha: today,
      cantidad_usd: '',
      cotizacion: '',
      concepto: 'Compra de divisas (USD)',
      descripcion: '',
    });
    setError('');
  }, [isOpen]);

  const cantidadUsdNum = parseFloat(formData.cantidad_usd) || 0;
  const cotizacionNum = parseFloat(formData.cotizacion) || 0;
  const montoArs = cantidadUsdNum * cotizacionNum;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === 'cantidad_usd' || name === 'cotizacion') {
      setFormData((prev) => ({ ...prev, [name]: parseInputMonto(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleSave = async () => {
    if (!formData.cantidad_usd || cantidadUsdNum <= 0) {
      setError('La cantidad de dólares debe ser mayor a 0');
      return;
    }
    if (!formData.cotizacion || cotizacionNum <= 0) {
      setError('La cotización debe ser mayor a 0');
      return;
    }
    if (!formData.fecha) {
      setError('La fecha es requerida');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const response = await apiFetch(
        API_ENDPOINTS.MOVIMIENTOS.COMPRA_VENTA_DIVISAS,
        {
          method: 'POST',
          body: JSON.stringify({
            sucursal_id: sucursalId,
            user_id: user?.id,
            fecha: formData.fecha,
            cantidad_usd: cantidadUsdNum,
            cotizacion: cotizacionNum,
            operacion: formData.operacion,
            concepto: formData.concepto || undefined,
            descripcion: formData.descripcion || undefined,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || 'Error al registrar la operación');

      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al registrar la operación';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const isVenta = formData.operacion === 'venta';
  const accentColor = isVenta ? '#C53030' : '#276749';
  const accentBg = isVenta
    ? 'bg-rose-50 border-rose-100'
    : 'bg-emerald-50 border-emerald-100';
  const accentText = isVenta ? 'text-rose-700' : 'text-emerald-700';
  const accentBadge = isVenta
    ? 'bg-rose-100 text-rose-800'
    : 'bg-emerald-100 text-emerald-800';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0] flex-shrink-0">
          <DialogHeader className="p-0 border-0">
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <ArrowRightLeft
                  className="w-5 h-5"
                  style={{ color: accentColor }}
                />
              </div>
              <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                Compra-Venta de Divisas
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
              Registra una operación de compra o venta de dólares. Se crearán
              automáticamente los movimientos en la caja USD y en la caja ARS.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6 overflow-y-auto flex-1">
          {/* Tipo de Operación */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-[#002868] rounded-full" />
              Tipo de operación
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, operacion: 'compra' }))
                }
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  formData.operacion === 'compra'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-[#E0E0E0] bg-white hover:border-emerald-300'
                }`}
              >
                <TrendingUp
                  className={`w-6 h-6 ${
                    formData.operacion === 'compra'
                      ? 'text-emerald-600'
                      : 'text-[#999]'
                  }`}
                />
                <span
                  className={`text-sm font-bold ${
                    formData.operacion === 'compra'
                      ? 'text-emerald-700'
                      : 'text-[#666]'
                  }`}
                >
                  Compra USD
                </span>
                <span className="text-xs text-[#888] text-center leading-tight">
                  Ingresa dólares,
                  <br />
                  egresa pesos
                </span>
                {formData.operacion === 'compra' && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-2.5 h-2.5 text-white"
                    >
                      <path
                        fillRule="evenodd"
                        d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, operacion: 'venta' }))
                }
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  formData.operacion === 'venta'
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-[#E0E0E0] bg-white hover:border-rose-300'
                }`}
              >
                <TrendingDown
                  className={`w-6 h-6 ${
                    formData.operacion === 'venta'
                      ? 'text-rose-600'
                      : 'text-[#999]'
                  }`}
                />
                <span
                  className={`text-sm font-bold ${
                    formData.operacion === 'venta'
                      ? 'text-rose-700'
                      : 'text-[#666]'
                  }`}
                >
                  Venta USD
                </span>
                <span className="text-xs text-[#888] text-center leading-tight">
                  Egresa dólares,
                  <br />
                  ingresa pesos
                </span>
                {formData.operacion === 'venta' && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-2.5 h-2.5 text-white"
                    >
                      <path
                        fillRule="evenodd"
                        d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </section>

          <div className="border-t border-dashed border-[#E8E8E8]" />

          {/* Datos de la operación */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-4 bg-[#002868] rounded-full" />
              Datos de la operación
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
                <Label htmlFor="cotizacion" className={labelClasses}>
                  Cotización del USD *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8A8F9C] select-none pointer-events-none">
                    $
                  </span>
                  <Input
                    id="cotizacion"
                    name="cotizacion"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ej: 1.050,00"
                    value={formatInputMonto(formData.cotizacion)}
                    onChange={handleInputChange}
                    className={`${inputClasses} pl-8`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cantidad_usd" className={labelClasses}>
                Cantidad de dólares *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8A8F9C] select-none pointer-events-none">
                  US$
                </span>
                <Input
                  id="cantidad_usd"
                  name="cantidad_usd"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formatInputMonto(formData.cantidad_usd)}
                  onChange={handleInputChange}
                  className={`${inputClasses} pl-12`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="concepto" className={labelClasses}>
                Concepto
              </Label>
              <Input
                id="concepto"
                name="concepto"
                placeholder="Ej: Compra de divisas (USD)"
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

          {/* Resumen calculado */}
          {cantidadUsdNum > 0 && cotizacionNum > 0 && (
            <>
              <div className="border-t border-dashed border-[#E8E8E8]" />
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#002868] rounded-full" />
                  Resumen de la operación
                </h4>
                <div className={`rounded-xl border p-4 space-y-3 ${accentBg}`}>
                  <p
                    className={`text-xs font-bold uppercase tracking-wide ${accentText}`}
                  >
                    {isVenta ? 'Venta de dólares' : 'Compra de dólares'}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#555]">
                        Caja USD{' '}
                        <span
                          className={`text-xs font-semibold px-1.5 py-0.5 rounded ${accentBadge}`}
                        >
                          {isVenta ? 'Egreso' : 'Ingreso'}
                        </span>
                      </span>
                      <span className={`text-sm font-bold ${accentText}`}>
                        {isVenta ? '−' : '+'}US${' '}
                        {formatInputMonto(String(cantidadUsdNum))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#555]">
                        Caja ARS{' '}
                        <span
                          className={`text-xs font-semibold px-1.5 py-0.5 rounded ${accentBadge}`}
                        >
                          {isVenta ? 'Ingreso' : 'Egreso'}
                        </span>
                      </span>
                      <span className={`text-sm font-bold ${accentText}`}>
                        {isVenta ? '+' : '−'}
                        {formatMonto(montoArs, 'ARS')}
                      </span>
                    </div>
                    <div className="border-t border-dashed border-current opacity-20 my-1" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#777]">
                        Cotización aplicada
                      </span>
                      <span className="text-xs font-semibold text-[#444]">
                        1 USD = {formatMonto(cotizacionNum, 'ARS')}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-[#F0F0F0] flex-shrink-0 space-y-3">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-rose-500 flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs text-rose-700 font-medium">{error}</p>
            </div>
          )}
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 cursor-pointer border-[#E0E0E0] text-[#666] hover:bg-[#F5F5F5]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 cursor-pointer text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              style={{
                backgroundColor: accentColor,
              }}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registrando...
                </span>
              ) : (
                `Confirmar ${isVenta ? 'Venta' : 'Compra'}`
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
