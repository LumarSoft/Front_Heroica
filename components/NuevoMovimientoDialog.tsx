'use client'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorBanner } from '@/components/ui/error-banner'
import { CircleCheck } from 'lucide-react'
import { labelClasses } from '@/lib/dialog-styles'
import { useNuevoMovimiento } from '@/hooks/use-nuevo-movimiento'
import { useMovimientoSubmit } from '@/hooks/use-movimiento-submit'
import { useTransferenciaSubmit } from '@/hooks/use-transferencia-submit'
import { MovimientoGeneralFields } from './movimientos/MovimientoGeneralFields'
import { MovimientoFinancieroFields } from './movimientos/MovimientoFinancieroFields'
import { MovimientoTransferenciaFields } from './movimientos/MovimientoTransferenciaFields'
import { MovimientoComprobantes } from './movimientos/MovimientoComprobantes'
import { MovimientoSelect } from './movimientos/MovimientoSelect'
import type { NuevoMovimientoDialogProps } from '@/lib/types'
export default function NuevoMovimientoDialog(props: NuevoMovimientoDialogProps) {
  const context = useNuevoMovimiento(props)
  const { handleSave } = useMovimientoSubmit(context)
  const { handleSaveTransferencia } = useTransferenciaSubmit(context)
  const {
    isOpen,
    handleClose,
    isApprovalMode,
    cajaTipo,
    isPagoPendiente,
    isTransferenciaInterna,
    setIsTransferenciaInterna,
    formData,
    handleInputChange,
    isSaving,
    error,
    transferenciaData,
    parcialesBancos,
  } = context
  const excedeSaldoTransferencia = useMemo(() => {
    if (!isTransferenciaInterna || !transferenciaData.banco_origen_id || !transferenciaData.monto) return false
    const parcial = parcialesBancos.find(p => String(p.banco_id) === transferenciaData.banco_origen_id)
    return parseFloat(transferenciaData.monto) > Number(parcial?.total_real ?? 0)
  }, [isTransferenciaInterna, transferenciaData.banco_origen_id, transferenciaData.monto, parcialesBancos])
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden flex flex-col">
        {/* ─── Header ─── */}
        <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0] flex-shrink-0">
          <DialogHeader className="p-0 border-0">
            <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
              {isApprovalMode ? 'Aprobar pago pendiente' : 'Nuevo movimiento'}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
              {isApprovalMode
                ? `Registra el egreso en caja ${cajaTipo === 'banco' ? 'banco' : 'efectivo'} para confirmar el pago`
                : `Registra un nuevo movimiento de ${cajaTipo === 'banco' ? 'banco' : 'efectivo'}`}
            </DialogDescription>
          </DialogHeader>
          {isApprovalMode && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
              <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">
                Caja destino: <span className="font-bold">{cajaTipo === 'banco' ? 'Caja Banco' : 'Caja Efectivo'}</span>{' '}
                · Tipo fijo: <span className="font-bold">Egreso</span>
              </p>
            </div>
          )}
        </div>

        {/* ─── Body ─── */}
        <div className="px-8 py-6 space-y-6 overflow-y-auto flex-1">
          {/* ── Checkbox: Transferencia interna (solo en caja banco, no aprobación) ── */}
          {cajaTipo === 'banco' && !isApprovalMode && !isPagoPendiente && (
            <div
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer select-none transition-all ${
                isTransferenciaInterna
                  ? 'border-[#002868] bg-[#EEF3FF]'
                  : 'border-[#E0E0E0] bg-[#FAFAFA] hover:border-[#002868]/40'
              }`}
              onClick={() => setIsTransferenciaInterna(v => !v)}
            >
              <Checkbox
                id="transferencia_interna"
                checked={isTransferenciaInterna}
                onCheckedChange={v => setIsTransferenciaInterna(Boolean(v))}
                className="pointer-events-none"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#002868]">Transferencia entre bancos</span>
                <span className="text-xs text-[#8A8F9C]">Mover dinero de un banco a otro dentro de esta sucursal</span>
              </div>
            </div>
          )}

          {isTransferenciaInterna ? (
            <MovimientoTransferenciaFields context={context} />
          ) : (
            <>
              <MovimientoGeneralFields context={context} />
              <div className="border-t border-dashed border-[#E8E8E8]" />
              <MovimientoFinancieroFields context={context} />
              <div className="border-t border-dashed border-[#E8E8E8]" />
              <section className="space-y-4">
                <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#002868] rounded-full" />
                  Detalles adicionales
                </h4>

                {!isPagoPendiente && (
                  <div className="space-y-1.5">
                    <Label htmlFor="estado" className={labelClasses}>
                      Estado
                    </Label>
                    <MovimientoSelect
                      id="estado"
                      allowEmpty={false}
                      value={formData.estado}
                      onValueChange={value => handleInputChange({ target: { name: 'estado', value } })}
                      options={[
                        ...(isApprovalMode ? [] : [{ value: 'pendiente', label: 'Pendiente' }]),
                        { value: 'aprobado', label: 'Aprobado' },
                        { value: 'completado', label: 'Completado' },
                        ...(isApprovalMode ? [] : [{ value: 'rechazado', label: 'Rechazado' }]),
                      ]}
                      placeholder="Seleccione"
                      disabled={false}
                    />
                  </div>
                )}
              </section>
            </>
          )}
          <MovimientoComprobantes context={context} />
        </div>
        {/* ─── Footer ─── */}
        <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC] space-y-3 flex-shrink-0">
          {/* Error visible siempre en el footer */}
          <ErrorBanner error={error} />
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
              onClick={isTransferenciaInterna ? handleSaveTransferencia : handleSave}
              disabled={isSaving || excedeSaldoTransferencia}
              className={`h-10 px-6 rounded-lg text-white font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer ${
                isTransferenciaInterna
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : isApprovalMode
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#002868] hover:bg-[#003d8f]'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner className="w-4 h-4 border-2 border-white/30 border-t-white" />
                  {isTransferenciaInterna ? 'Transfiriendo…' : isApprovalMode ? 'Aprobando…' : 'Creando…'}
                </span>
              ) : isTransferenciaInterna ? (
                'Confirmar transferencia'
              ) : isApprovalMode ? (
                'Confirmar y aprobar'
              ) : (
                'Crear movimiento'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
