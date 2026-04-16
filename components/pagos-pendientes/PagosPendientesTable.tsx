'use client'

import { Check, X, Inbox, Megaphone, User } from 'lucide-react'
import { ContentLoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/caja/StatusBadge'
import { formatFecha, formatMonto, ESTADO_COLOR_MAP, PRIORIDAD_COLOR_MAP, truncarTexto } from '@/lib/formatters'
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
}: PagosPendientesTableProps) {
  const showAcciones = activeTab === 'pendientes' && userRole === 'superadmin'
  const colSpan = 7 + (activeTab === 'historial' ? 1 : 0) + (showAcciones ? 1 : 0)

  if (isLoading) return <ContentLoadingSpinner />

  return (
    <Card className="border-[#E0E0E0] bg-white shadow-lg overflow-hidden">
      <CardHeader className="border-b border-[#E0E0E0] bg-[#F8F9FA]/50">
        <div className="flex items-center justify-between">
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
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA] border-b-2 border-[#E0E0E0]">
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
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-[#666666]/30" />
                      </div>
                      <p className="font-medium">No se encontraron movimientos registrados</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map(pago => (
                  <TableRow
                    key={pago.id}
                    className="hover:bg-[#F8F9FA]/50 transition-colors border-b border-[#E0E0E0]/50"
                  >
                    <TableCell className="font-medium text-[#1A1A1A]">{formatFecha(pago.fecha)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1A1A1A]">{pago.concepto}</span>
                        {pago.comentarios && pago.comentarios.includes('[Nota del sistema:') ? (
                          <div className="flex flex-col gap-1.5 mt-1">
                            {pago.comentarios.split('[Nota del sistema:')[0].trim() && (
                              <span
                                className="text-xs text-[#666666] inline-block"
                                title={pago.comentarios.split('[Nota del sistema:')[0].trim()}
                              >
                                {truncarTexto(pago.comentarios.split('[Nota del sistema:')[0].trim())}
                              </span>
                            )}
                            <div className="bg-amber-50 text-amber-800 text-[11px] px-2.5 py-1.5 rounded-md border border-amber-200 flex items-start gap-1.5 w-fit max-w-sm mt-0.5">
                              <Megaphone className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span className="font-medium whitespace-normal break-words leading-snug">
                                {truncarTexto(pago.comentarios.split('[Nota del sistema:')[1].split(']')[0].trim())}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-[#666666]" title={pago.comentarios || ''}>
                            {truncarTexto(pago.comentarios)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {pago.usuario_creador_nombre ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-[#002868]/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-[#002868]" />
                          </div>
                          <span
                            className="text-sm font-medium text-[#1A1A1A] truncate max-w-[120px]"
                            title={pago.usuario_creador_nombre}
                          >
                            {pago.usuario_creador_nombre.split(' ')[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-[#999999]">-</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-black text-sm ${
                        parseFloat(pago.monto.toString()) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatMonto(Math.abs(parseFloat(pago.monto.toString())))}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge
                        value={pago.tipo === 'egreso' || (!pago.tipo && Number(pago.monto) < 0) ? 'egreso' : 'ingreso'}
                        colorMap={{
                          egreso: 'bg-rose-100 text-rose-800',
                          ingreso: 'bg-emerald-100 text-emerald-800',
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge value={pago.prioridad} colorMap={PRIORIDAD_COLOR_MAP} />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge value={pago.estado} colorMap={ESTADO_COLOR_MAP} />
                    </TableCell>
                    {activeTab === 'historial' && (
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          {pago.estado === 'aprobado' && (
                            <span className="text-xs font-medium text-emerald-600">
                              Aprobado por {pago.usuario_revisor_nombre || 'Admin'}
                            </span>
                          )}
                          {pago.estado === 'completado' && (
                            <span className="text-xs font-medium text-emerald-600">
                              Pagado en caja · autorizó {pago.usuario_revisor_nombre || 'Admin'}
                            </span>
                          )}
                          {pago.estado === 'rechazado' && (
                            <>
                              <span className="text-xs font-bold text-rose-600">
                                Rechazado por {pago.usuario_revisor_nombre || 'Admin'}
                              </span>
                              <span className="text-[11px] text-[#666666] italic leading-tight">
                                &quot;
                                {pago.motivo_rechazo || 'Sin motivo especificado'}
                                &quot;
                              </span>
                            </>
                          )}
                          {pago.estado === 'pendiente' && (
                            <span className="text-xs text-[#8A8F9C]">En revisión...</span>
                          )}
                        </div>
                      </TableCell>
                    )}
                    {showAcciones && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {pago.estado === 'pendiente' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => !isReadOnly && onAprobar(pago)}
                                disabled={isReadOnly}
                                title={isReadOnly ? 'Sucursal inactiva' : 'Aprobar pago'}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm hover:shadow-md transition-all h-8 w-8 p-0 flex items-center justify-center rounded-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                              >
                                <Check className="w-4 h-4" strokeWidth={2.5} />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => !isReadOnly && onRechazar(pago)}
                                disabled={isReadOnly}
                                title={isReadOnly ? 'Sucursal inactiva' : 'Rechazar pago'}
                                className="bg-rose-500 hover:bg-rose-600 text-white border-none shadow-sm hover:shadow-md transition-all h-8 w-8 p-0 flex items-center justify-center rounded-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                              >
                                <X className="w-4 h-4" strokeWidth={2.5} />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
