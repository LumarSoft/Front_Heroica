'use client'

import { useState } from 'react'
import { AlertTriangle, CalendarClock, MailPlus, Paperclip, Pencil, Send, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccessDenied } from '@/components/ui/access-denied'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorBanner } from '@/components/ui/error-banner'
import { ContentLoadingSpinner, LoadingSpinner } from '@/components/ui/loading-spinner'
import { DIAS_SEMANA_ENVIO, ProgramadoDialog } from '@/components/ventas/ProgramadoDialog'
import { VentasPageHeader } from '@/components/ventas/VentasPageHeader'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useReportesGuardados } from '@/hooks/use-reporte-ventas'
import { useVentasOpciones } from '@/hooks/use-ventas-opciones'
import { useVentasProgramados } from '@/hooks/use-ventas-programados'
import { VENTAS_CARD_CLASS } from '@/lib/dialog-styles'
import { formatFechaHora } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { ReporteProgramadoVentas } from '@/lib/types'

function frecuenciaTexto(p: ReporteProgramadoVentas): string {
  const hora = `${String(p.hora).padStart(2, '0')}:00`
  if (p.frecuencia === 'diaria') return `Todos los días desde las ${hora} · ventas del día anterior`
  if (p.frecuencia === 'semanal')
    return `Los ${DIAS_SEMANA_ENVIO[(p.diaSemana ?? 1) - 1].toLowerCase()} desde las ${hora} · semana anterior`
  return `El día 1 de cada mes desde las ${hora} · mes anterior`
}

export default function VentasEnviosPage() {
  useDocumentTitle('Envíos de ventas por mail')
  const canGestionar = useAuthStore(state => state.canGestionarReportesVentas())
  const { programados, isLoading, error, enviandoId, guardar, eliminar, enviarAhora } =
    useVentasProgramados(canGestionar)
  const { opciones } = useVentasOpciones()
  const { guardados } = useReportesGuardados()
  const [editando, setEditando] = useState<ReporteProgramadoVentas | null>(null)
  const [dialogo, setDialogo] = useState(false)
  const [aEliminar, setAEliminar] = useState<ReporteProgramadoVentas | null>(null)

  if (!canGestionar) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <AccessDenied resource="los envíos programados de ventas" backUrl="/ventas" />
      </main>
    )
  }

  const nombresSucursales = (ids: number[] | null) =>
    ids?.length
      ? ids.map(id => opciones.sucursales.find(s => s.id === id)?.nombre ?? `#${id}`).join(', ')
      : 'Todas las sucursales'

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F0F5FF] via-[#F8FAFF] to-white">
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <VentasPageHeader
          title="Envíos por mail"
          subtitle="Resúmenes automáticos de ventas para gerencia y encargados: diarios, semanales o mensuales."
        >
          <Button
            onClick={() => {
              setEditando(null)
              setDialogo(true)
            }}
            className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white flex items-center gap-2"
          >
            <MailPlus className="w-4 h-4" /> Nuevo envío
          </Button>
        </VentasPageHeader>
        <ErrorBanner error={error} />

        {isLoading ? (
          <ContentLoadingSpinner />
        ) : programados.length === 0 ? (
          <div className={VENTAS_CARD_CLASS}>
            <EmptyState
              icon={MailPlus}
              title="Todavía no hay envíos"
              description="Creá el primero: por ejemplo, un resumen diario a las 8 para la gerencia con las ventas de ayer por sucursal."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {programados.map(p => (
              <section key={p.id} className={cn(`${VENTAS_CARD_CLASS} p-5 space-y-3`, !p.activo && 'opacity-60')}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#002868]">{p.nombre}</h3>
                    <p className="text-sm text-[#5A6B8C] flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4" /> {frecuenciaTexto(p)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                      p.activo
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200',
                    )}
                  >
                    {p.activo ? 'Activo' : 'Pausado'}
                  </span>
                </div>
                <p className="text-sm text-[#1E293B] flex items-start gap-1.5">
                  <Users className="w-4 h-4 mt-0.5 text-[#7A93BB] flex-shrink-0" />
                  <span className="break-all">{p.destinatarios.join(', ')}</span>
                </p>
                <p className="text-xs text-[#7A93BB]">
                  {nombresSucursales(p.sucursalIds)}
                  {p.reporteNombre && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <Paperclip className="w-3 h-3" /> {p.reporteNombre}
                    </span>
                  )}
                </p>
                <p className="text-xs text-[#7A93BB]">
                  {p.ultimoEnvioAt ? `Último envío: ${formatFechaHora(p.ultimoEnvioAt)}` : 'Todavía no se envió'} ·
                  Próximo: {p.proximoPeriodo}
                </p>
                {p.ultimoError && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 flex gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {p.ultimoError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={enviandoId === p.id}
                    onClick={() => enviarAhora(p.id)}
                    className="cursor-pointer flex items-center gap-1.5"
                    title="Manda ahora el resumen del último período (no cuenta como el envío programado)"
                  >
                    {enviandoId === p.id ? (
                      <LoadingSpinner className="w-4 h-4 border-2" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Enviar ahora
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditando(p)
                      setDialogo(true)
                    }}
                    className="cursor-pointer flex items-center gap-1.5"
                  >
                    <Pencil className="w-4 h-4" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAEliminar(p)}
                    className="cursor-pointer text-rose-600 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </Button>
                </div>
              </section>
            ))}
          </div>
        )}

        <ProgramadoDialog
          open={dialogo}
          programado={editando}
          sucursales={opciones.sucursales}
          reportes={guardados}
          onClose={() => setDialogo(false)}
          onGuardar={datos => guardar(datos, editando?.id)}
        />
        <DeleteDialog
          open={aEliminar !== null}
          nombre={aEliminar?.nombre ?? ''}
          onCancel={() => setAEliminar(null)}
          onConfirm={async () => {
            if (aEliminar) await eliminar(aEliminar.id)
            setAEliminar(null)
          }}
        />
      </main>
    </div>
  )
}
