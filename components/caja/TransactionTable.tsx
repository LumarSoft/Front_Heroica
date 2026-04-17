'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatFecha, formatMonto, calcularTotal, truncarTexto } from '@/lib/formatters'
import type { Transaction } from '@/lib/types'
import { Clock, Trash2, ArrowRightLeft } from 'lucide-react'

// =============================================
// Definición de columnas
// =============================================

export interface ColumnDef {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  hideBelow?: 'md' | 'lg' // responsive breakpoint
  widthClass?: string
  render: (t: Transaction) => React.ReactNode
}

/** Columnas base compartidas */
const BASE_COLUMNS: ColumnDef[] = [
  {
    key: 'fecha',
    label: 'Fecha',
    widthClass: 'w-[100px]',
    render: t => <span className="font-medium text-[#1A1A1A] whitespace-nowrap">{formatFecha(t.fecha)}</span>,
  },
  {
    key: 'categoria',
    label: 'Categoria',
    widthClass: 'w-[140px]',
    render: t => (
      <div className="w-full">
        <span className="block text-[#1A1A1A] font-medium truncate" title={t.categoria_nombre || ''}>
          {t.categoria_nombre || '-'}
        </span>
      </div>
    ),
  },
]

/** Columna de descripcion compartida — cae a concepto cuando no hay descripcion configurada */
const DESCRIPCION_COLUMN: ColumnDef = {
  key: 'descripcion',
  label: 'Descripcion',
  widthClass: 'w-[150px]',
  render: t => {
    const text = t.descripcion_nombre || t.concepto || null
    return (
      <span className="block w-full text-[#666666] truncate" title={text || ''}>
        {truncarTexto(text)}
      </span>
    )
  },
}

/** Columna de comentario compartida */
const COMENTARIO_COLUMN: ColumnDef = {
  key: 'comentarios',
  label: 'Comentario',
  widthClass: 'w-[150px]',
  render: t => (
    <span className="block w-full text-[#666666] truncate" title={t.comentarios || ''}>
      {truncarTexto(t.comentarios)}
    </span>
  ),
}

/** Columnas extra para caja banco */
const BANCO_COLUMNS: ColumnDef[] = [
  {
    key: 'medio_pago',
    label: 'Medio Pago',
    widthClass: 'w-[120px]',
    render: t => (
      <span className="block w-full text-[#666666] truncate" title={t.medio_pago_nombre || ''}>
        {t.medio_pago_nombre || '-'}
      </span>
    ),
  },
  {
    key: 'banco',
    label: 'Banco',
    align: 'center',
    widthClass: 'w-[110px]',
    render: t => (
      <span className="block w-full font-medium text-[#002868] truncate" title={t.banco_nombre || ''}>
        {t.banco_nombre || '-'}
      </span>
    ),
  },
]

/** Columnas extra para caja efectivo */
const EFECTIVO_COLUMNS: ColumnDef[] = []

/** Columna de monto (siempre al final antes de acciones) */
const MONTO_COLUMN: ColumnDef = {
  key: 'monto',
  label: 'Monto',
  align: 'right',
  widthClass: 'w-[125px]',
  render: t => (
    <span
      className={`font-bold text-sm whitespace-nowrap ${Number(t.monto) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
    >
      {formatMonto(t.monto)}
    </span>
  ),
}

/** Columna de DEUDA (opcional, solo para caja efectivo y banco) */
const DEUDA_COLUMN: ColumnDef = {
  key: 'deuda',
  label: 'Deuda',
  align: 'center',
  widthClass: 'w-[95px]',
  render: t =>
    t.es_deuda ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 border border-orange-300 text-orange-700 text-xs font-bold">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-3 h-3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        DEUDA
      </span>
    ) : (
      <span className="text-[#B0B0B0] text-sm">—</span>
    ),
}

// =============================================
// Helpers para presets de columnas
// =============================================

export function getBancoColumns(): ColumnDef[] {
  return [...BASE_COLUMNS, DESCRIPCION_COLUMN, COMENTARIO_COLUMN, MONTO_COLUMN, ...BANCO_COLUMNS, DEUDA_COLUMN]
}

export function getEfectivoColumns(): ColumnDef[] {
  return [...BASE_COLUMNS, DESCRIPCION_COLUMN, COMENTARIO_COLUMN, MONTO_COLUMN, ...EFECTIVO_COLUMNS, DEUDA_COLUMN]
}

// =============================================
// Componente TransactionTable
// =============================================

interface TransactionTableProps {
  title: string
  description: string
  transactions: Transaction[]
  customTotal?: number
  columns: ColumnDef[]
  onViewDetails: (t: Transaction) => void
  onChangeState?: (t: Transaction) => void
  onDelete?: (t: Transaction) => void
  onToggleDeuda?: (t: Transaction) => void
  onMove?: (t: Transaction) => void
  onBulkDelete?: (ids: number[]) => void
  onBulkMove?: (ids: number[]) => void
  isReadOnly?: boolean
}

export function TransactionTable({
  title,
  description,
  transactions,
  customTotal,
  columns,
  onViewDetails,
  onChangeState,
  onDelete,
  onToggleDeuda,
  onMove,
  onBulkDelete,
  onBulkMove,
  isReadOnly = false,
}: TransactionTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const toggleAll = () => {
    if (selectedIds.size === transactions.length && transactions.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(transactions.map(t => t.id)))
    }
  }

  const toggleOne = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < transactions.length

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete([...selectedIds])
      setSelectedIds(new Set())
    }
  }

  const handleBulkMove = () => {
    if (onBulkMove) {
      onBulkMove([...selectedIds])
    }
  }

  const total = customTotal !== undefined ? customTotal : calcularTotal(transactions)
  const showBulkActions = (onBulkDelete || onBulkMove) && !isReadOnly
  const totalColSpan = columns.length + 2 // +1 checkbox col, +1 actions col

  return (
    <Card className="border-[#E0E0E0] bg-white shadow-lg">
      <CardHeader className="border-b border-[#E0E0E0] px-3 py-3 sm:px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-2xl font-bold text-[#002868] leading-tight">{title}</CardTitle>
            <CardDescription className="text-[#666666] text-xs sm:text-sm mt-0.5 leading-snug">{description}</CardDescription>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-[#666666] font-medium mb-1">Total</p>
            <div
              className={`inline-flex items-center justify-center px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg ${total >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}
            >
              <p className={`text-lg sm:text-2xl font-bold tabular-nums ${total >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatMonto(total)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-1 py-3 sm:px-2">
        {/* Barra de acciones masivas */}
        {showBulkActions && selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 mb-3 rounded-lg bg-indigo-50 border border-indigo-200">
            <span className="text-sm font-semibold text-indigo-700">
              {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedIds(new Set())}
              className="h-7 px-3 text-xs border-indigo-300 text-indigo-600 hover:bg-indigo-100"
            >
              Deseleccionar
            </Button>
            {onBulkMove && (
              <Button
                size="sm"
                onClick={handleBulkMove}
                className="h-7 px-3 text-xs bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                <ArrowRightLeft className="w-3 h-3 mr-1" />
                Mover seleccionados
              </Button>
            )}
            {onBulkDelete && (
              <Button
                size="sm"
                onClick={handleBulkDelete}
                className="h-7 px-3 text-xs bg-rose-500 hover:bg-rose-600 text-white"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Eliminar {selectedIds.size}
              </Button>
            )}
          </div>
        )}
        <div className="rounded-md border border-[#E0E0E0] overflow-x-auto">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA] border-b-2 border-[#E0E0E0]">
                {showBulkActions && (
                  <TableHead className="w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => {
                        if (el) el.indeterminate = someSelected
                      }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                      title="Seleccionar todos"
                    />
                  </TableHead>
                )}
                {columns.map(col => (
                  <TableHead
                    key={col.key}
                    className={`px-2 font-bold text-[#002868] text-sm ${
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                    } ${col.widthClass || ''} ${
                      col.hideBelow === 'md'
                        ? 'hidden md:table-cell'
                        : col.hideBelow === 'lg'
                          ? 'hidden lg:table-cell'
                          : ''
                    }`}
                  >
                    {col.label}
                  </TableHead>
                ))}
                <TableHead className="w-[172px] min-w-[172px] max-w-[172px] px-2 font-bold text-[#002868] text-sm text-center">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={totalColSpan} className="text-center text-[#666666] py-12">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-12 h-12 text-[#666666]/50"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                        />
                      </svg>
                      <p className="font-medium">No hay movimientos registrados</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map(transaction => (
                  <TableRow
                    key={transaction.id}
                    className={`hover:bg-[#F8F9FA]/50 transition-colors border-b border-[#E0E0E0]/50 ${selectedIds.has(transaction.id) ? 'bg-indigo-50/60' : ''}`}
                  >
                    {showBulkActions && (
                      <TableCell className="text-center w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(transaction.id)}
                          onChange={() => toggleOne(transaction.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                        />
                      </TableCell>
                    )}
                    {columns.map(col => (
                      <TableCell
                        key={col.key}
                        className={`px-2 ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                        } ${col.widthClass || ''} ${
                          col.hideBelow === 'md'
                            ? 'hidden md:table-cell'
                            : col.hideBelow === 'lg'
                              ? 'hidden lg:table-cell'
                              : ''
                        }`}
                      >
                        {col.render(transaction)}
                      </TableCell>
                    ))}
                    <TableCell
                      className={`w-[172px] min-w-[172px] max-w-[172px] px-2 text-center ${
                        selectedIds.has(transaction.id) ? 'bg-indigo-50/60' : 'bg-white'
                      }`}
                    >
                      <div className="flex flex-nowrap items-center justify-center gap-1">
                        {/* Ver detalles */}
                        <Button
                          size="sm"
                          onClick={() => onViewDetails(transaction)}
                          className={`h-7 w-7 p-0 text-white border-none cursor-pointer shadow-sm transition-all flex items-center justify-center ${
                            isReadOnly
                              ? 'bg-gray-400 hover:bg-gray-500'
                              : 'bg-[#002868] hover:bg-[#003d8f] hover:shadow-md'
                          }`}
                          title={isReadOnly ? 'Ver detalles (solo lectura)' : 'Ver detalles'}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </Button>
                        {/* Cambiar estado */}
                        {onChangeState && (
                          <Button
                            size="sm"
                            onClick={() => !isReadOnly && onChangeState(transaction)}
                            disabled={isReadOnly}
                            className="h-7 w-7 p-0 bg-[#002868] hover:bg-[#003d8f] text-white border-none shadow-sm hover:shadow-md transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                            title={isReadOnly ? 'Sucursal inactiva' : 'Cambiar estado'}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                              />
                            </svg>
                          </Button>
                        )}
                        {/* Deuda (solo si hay handler) */}
                        {onToggleDeuda && (
                          <Button
                            size="sm"
                            onClick={() => !isReadOnly && onToggleDeuda(transaction)}
                            disabled={isReadOnly}
                            className={`h-7 w-7 p-0 border-none shadow-sm hover:shadow-md transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none ${
                              transaction.es_deuda
                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                            }`}
                            title={
                              isReadOnly
                                ? 'Sucursal inactiva'
                                : transaction.es_deuda
                                  ? 'Quitar deuda'
                                  : 'Marcar como deuda'
                            }
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                        )}
                        {/* Mover */}
                        {onMove && (
                          <Button
                            size="sm"
                            onClick={() => !isReadOnly && onMove(transaction)}
                            disabled={isReadOnly}
                            className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-none shadow-sm hover:shadow-md transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                            title={isReadOnly ? 'Sucursal inactiva' : 'Mover transacción'}
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </Button>
                        )}
                        {/* Eliminar */}
                        {onDelete && (
                          <Button
                            size="sm"
                            onClick={() => !isReadOnly && onDelete(transaction)}
                            disabled={isReadOnly}
                            className="h-7 w-7 p-0 bg-rose-500 hover:bg-rose-600 text-white border-none shadow-sm hover:shadow-md transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                            title={isReadOnly ? 'Sucursal inactiva' : 'Eliminar movimiento'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
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
