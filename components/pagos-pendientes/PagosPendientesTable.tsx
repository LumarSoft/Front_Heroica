'use client'

import { Inbox } from 'lucide-react'
import { PagoPendienteRow } from '@/components/pagos-pendientes/PagoPendienteRow'
import { ContentLoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatMonto } from '@/lib/formatters'
import type { PagoPendiente } from '@/lib/types'

interface PagosPendientesTableProps {
  displayData: PagoPendiente[]
  activeTab: 'pendientes' | 'historial'
  userRole?: string
  isReadOnly: boolean
  total: number
  isLoading: boolean
  onAprobar: (pago: PagoPendiente) => void
  onRechazar: (pago: PagoPendiente) => void
  selectedIds: Set<number>
  onSelectionChange: (ids: Set<number>) => void
  onAprobarSeleccionados: () => void
  onRechazarSeleccionados: () => void
}

export function PagosPendientesTable({
  displayData,
  activeTab,
  userRole,
  isReadOnly,
  total,
  isLoading,
  onAprobar,
  onRechazar,
  selectedIds,
  onSelectionChange,
  onAprobarSeleccionados,
  onRechazarSeleccionados,
}: PagosPendientesTableProps) {
  const showAcciones = activeTab === 'pendientes' && userRole === 'superadmin'
  const colSpan = 7 + (activeTab === 'historial' ? 1 : 0) + (showAcciones ? 2 : 0)
  const seleccionables = displayData.filter(pago => pago.estado === 'pendiente').map(pago => pago.id)
  const todosSeleccionados = seleccionables.length > 0 && seleccionables.every(id => selectedIds.has(id))

  const toggleTodos = () => onSelectionChange(todosSeleccionados ? new Set() : new Set(seleccionables))
  const togglePago = (id: number) => {
    const siguiente = new Set(selectedIds)
    if (siguiente.has(id)) siguiente.delete(id)
    else siguiente.add(id)
    onSelectionChange(siguiente)
  }

  if (isLoading) return <ContentLoadingSpinner />

  return (
    <Card className="border-[#E0E0E0] bg-white shadow-lg overflow-hidden">
      <CardHeader className="border-b border-[#E0E0E0] bg-[#F8F9FA]/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-[#002868]">
              {activeTab === 'pendientes' ? 'Pendientes de Autorización' : 'Historial de Solicitudes'}
            </CardTitle>
            <CardDescription className="text-[#666666]">
              {activeTab === 'pendientes'
                ? 'Movimientos esperando revisión de un administrador'
                : 'Registro de movimientos procesados y su estado final'}
            </CardDescription>
          </div>
          {activeTab === 'pendientes' && (
            <div className="flex items-center gap-3">
              {showAcciones && selectedIds.size > 0 && (
                <>
                  <Button
                    size="sm"
                    onClick={onAprobarSeleccionados}
                    disabled={isReadOnly}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Aprobar ({selectedIds.size})
                  </Button>
                  <Button
                    size="sm"
                    onClick={onRechazarSeleccionados}
                    disabled={isReadOnly}
                    className="bg-rose-600 hover:bg-rose-700"
                  >
                    Rechazar ({selectedIds.size})
                  </Button>
                </>
              )}
              <div className="text-right">
                <p className="text-xs text-[#666666] font-bold uppercase tracking-wider mb-1">Total Pendiente</p>
                <div
                  className={`inline-flex items-center justify-center px-4 py-1.5 rounded-lg ${
                    total >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
                  }`}
                >
                  <p className={`text-xl font-black ${total >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatMonto(Math.abs(total))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA] border-b-2 border-[#E0E0E0]">
                {showAcciones && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={todosSeleccionados}
                      onCheckedChange={toggleTodos}
                      aria-label="Seleccionar todos los pagos"
                    />
                  </TableHead>
                )}
                <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider">Fecha</TableHead>
                <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider">Concepto</TableHead>
                <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider">Solicitante</TableHead>
                <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-right">
                  Monto
                </TableHead>
                <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center">
                  Tipo
                </TableHead>
                <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center">
                  Prioridad
                </TableHead>
                <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center">
                  Estado
                </TableHead>
                {activeTab === 'historial' && (
                  <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider">
                    Resolución
                  </TableHead>
                )}
                {showAcciones && (
                  <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center">
                    Acciones
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="text-center text-[#666666] py-16">
                    <EmptyState
                      icon={Inbox}
                      title="No se encontraron movimientos"
                      description="No hay solicitudes registradas para esta vista."
                      className="py-0"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map(pago => (
                  <PagoPendienteRow
                    key={pago.id}
                    pago={pago}
                    activeTab={activeTab}
                    showAcciones={showAcciones}
                    isReadOnly={isReadOnly}
                    isSelected={selectedIds.has(pago.id)}
                    onToggle={() => togglePago(pago.id)}
                    onAprobar={onAprobar}
                    onRechazar={onRechazar}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
