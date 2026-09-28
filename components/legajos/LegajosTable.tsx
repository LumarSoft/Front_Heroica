'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, FileText, XCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Personal } from '@/lib/types'
import { PdfsViewerDialog } from './PdfsViewerDialog'

interface LegajosTableProps {
  personal: Personal[]
  onSelect: (persona: Personal) => void
}

const DOCUMENTO_LABELS: Record<string, string> = {
  dni_frente_dorso: 'DNI (ambos lados)',
  ddjj_domicilio: 'DDJJ de domicilio',
  descripcion_puesto_firmada: 'Descripción de puesto firmada',
  foto_colaborador: 'Foto del colaborador',
  normas_convivencia: 'Normas de convivencia firmadas',
  constancia_uniforme: 'Constancia de entrega de uniforme',
  carnet_manipulacion_alimentos: 'Carnet de manipulación',
}

function formatFecha(fecha: string) {
  const [year, month, day] = fecha.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

export function LegajosTable({ personal, onSelect }: LegajosTableProps) {
  const [pdfsOpen, setPdfsOpen] = useState(false)
  const [pdfsTarget, setPdfsTarget] = useState<{
    id: number
    nombre: string
    faltantes: string[]
  } | null>(null)

  function handleVerPdfs(e: React.MouseEvent, persona: Personal) {
    e.stopPropagation()
    setPdfsTarget({
      id: persona.id,
      nombre: persona.nombre,
      faltantes: persona.adjuntos_faltantes ?? [],
    })
    setPdfsOpen(true)
  }

  return (
    <>
      <div className="rounded-lg border border-[#E0E0E0] bg-white shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA] border-b-2 border-[#E0E0E0]">
              <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider w-24">Legajo</TableHead>
              <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider">Nombre</TableHead>
              <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider hidden sm:table-cell">
                DNI
              </TableHead>
              <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider hidden md:table-cell">
                Puesto
              </TableHead>
              <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider hidden lg:table-cell">
                Incorporación
              </TableHead>
              <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center hidden sm:table-cell">
                Carnet
              </TableHead>
              <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center">
                Estado
              </TableHead>
              <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center w-24">
                PDFs
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {personal.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-[#666666] py-16">
                  <p className="font-medium">No se encontraron colaboradores con los filtros aplicados.</p>
                </TableCell>
              </TableRow>
            ) : (
              personal.map(persona => {
                const faltantes = persona.adjuntos_faltantes ?? []
                const vencimientos = persona.vencimientos_proximos ?? []
                const tieneFaltantes = faltantes.length > 0
                const tieneVencimientos = vencimientos.length > 0
                return (
                  <TableRow
                    key={persona.id}
                    onClick={() => onSelect(persona)}
                    className={`transition-colors border-b border-[#E0E0E0]/50 cursor-pointer ${
                      tieneFaltantes
                        ? 'bg-rose-50/60 hover:bg-rose-50 border-l-2 border-l-rose-400'
                        : tieneVencimientos
                          ? 'bg-amber-50/60 hover:bg-amber-50 border-l-2 border-l-amber-400'
                          : 'hover:bg-[#F8F9FA]/50'
                    }`}
                  >
                    <TableCell className="font-mono text-sm text-[#666666]">#{persona.legajo}</TableCell>
                    <TableCell className="font-semibold text-[#1A1A1A]">
                      <div className="flex items-center gap-2">
                        <span>{persona.nombre}</span>
                        {tieneFaltantes && (
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3" />
                                  {faltantes.length}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-semibold">Documentos faltantes</p>
                                <ul className="mt-1 list-disc pl-3">
                                  {faltantes.map(documento => (
                                    <li key={documento}>{DOCUMENTO_LABELS[documento] ?? documento}</li>
                                  ))}
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {tieneVencimientos && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200"
                            title={vencimientos.map(v => `${v.label}: ${v.fecha_vencimiento}`).join(', ')}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Vence{vencimientos.length > 1 ? 'n' : ''} {vencimientos.length}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#444] hidden sm:table-cell">{persona.dni}</TableCell>
                    <TableCell className="text-[#444] hidden md:table-cell">{persona.puesto_nombre ?? '—'}</TableCell>
                    <TableCell className="text-[#666666] hidden lg:table-cell">
                      {formatFecha(persona.fecha_incorporacion)}
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      {persona.carnet_manipulacion_alimentos ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#D0D0D0] mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border
                          ${
                            persona.activo
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border-rose-200'
                          }`}
                      >
                        {persona.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={e => handleVerPdfs(e, persona)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                          tieneFaltantes
                            ? 'bg-rose-600 text-white hover:bg-rose-700'
                            : 'bg-[#EEF3FF] text-[#002868] hover:bg-[#D8E3F8]'
                        }`}
                        title="Ver documentos del colaborador"
                      >
                        <FileText className="w-3 h-3" />
                        Ver
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PdfsViewerDialog
        open={pdfsOpen}
        onOpenChange={setPdfsOpen}
        personalId={pdfsTarget?.id ?? null}
        personalNombre={pdfsTarget?.nombre ?? ''}
        faltantes={pdfsTarget?.faltantes ?? []}
      />
    </>
  )
}
