import { AlertTriangle, CalendarRange, CloudDownload, PlugZap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VENTAS_CARD_CLASS } from '@/lib/dialog-styles'
import { formatFecha, formatHaceCuanto, formatRangoFechas, pluralDias } from '@/lib/formatters'
import type { CoberturaVentas, EstadoIntegracionVentas } from '@/lib/types'
import { SincronizacionEstadoBadge } from './SincronizacionEstadoBadge'

interface IntegracionEstadoCardProps {
  estado: EstadoIntegracionVentas
  cobertura: CoberturaVentas | null
  canSincronizar: boolean
  onSincronizar: () => void
}

export function IntegracionEstadoCard({
  estado,
  cobertura,
  canSincronizar,
  onSincronizar,
}: IntegracionEstadoCardProps) {
  const tieneDatos = Boolean(cobertura?.desde && cobertura.hasta)

  return (
    <section className={`${VENTAS_CARD_CLASS} p-5 flex flex-col gap-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#EEF3FF] text-[#002868] flex items-center justify-center">
            <PlugZap className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-[#002868]">{estado.nombre}</h3>
            <p className="text-xs text-[#7A93BB]">
              {!estado.disponible
                ? 'Próximamente'
                : estado.syncAutomatica
                  ? 'Se actualiza sola al abrir el panel y cada noche'
                  : 'Actualización automática desactivada: se trae a mano'}
            </p>
          </div>
        </div>
        {estado.enCurso && <SincronizacionEstadoBadge estado="en_curso" />}
      </div>

      {!estado.disponible ? (
        <p className="text-sm text-[#7A93BB]">
          Se habilitará cuando Heroica entregue las credenciales y el dashboard de exportación de HiOffice.
        </p>
      ) : (
        <>
          <div className="rounded-xl bg-[#F8FAFF] border border-[#EEF2FB] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A93BB] flex items-center gap-1.5">
              <CalendarRange className="w-3.5 h-3.5" />
              Ventas importadas
            </p>
            {tieneDatos && cobertura?.desde && cobertura.hasta ? (
              <>
                <p className="mt-1 text-lg font-bold text-[#002868]">
                  {formatRangoFechas(cobertura.desde, cobertura.hasta)}
                </p>
                <p className="text-sm text-[#5A6B8C]">
                  {pluralDias(cobertura.diasImportados)} importados
                  {cobertura.ultimaActualizacion &&
                    ` · última actualización ${formatHaceCuanto(cobertura.ultimaActualizacion)}`}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-[#5A6B8C]">Todavía no se importó ningún día.</p>
            )}
          </div>

          {cobertura && cobertura.diasFaltantes > 0 && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Faltan {pluralDias(cobertura.diasFaltantes)} dentro de ese rango (
                {cobertura.faltantes
                  .slice(0, 3)
                  .map(t =>
                    t.desde === t.hasta ? formatFecha(t.desde) : `${formatFecha(t.desde)} al ${formatFecha(t.hasta)}`,
                  )
                  .join(' · ')}
                {cobertura.faltantes.length > 3 ? ' y otros' : ''}). Usá “Completar días faltantes”.
              </span>
            </p>
          )}
          {estado.alerta && estado.configurada && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {estado.alerta}
            </p>
          )}
          {!estado.configurada && (
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              Faltan las credenciales de Bistrosoft en el servidor (BISTROSOFT_USERNAME / BISTROSOFT_PASSWORD).
            </p>
          )}

          {canSincronizar && (
            <Button
              onClick={onSincronizar}
              disabled={!estado.configurada || estado.enCurso}
              className="self-start cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white flex items-center gap-2"
            >
              <CloudDownload className="w-4 h-4" />
              {estado.enCurso ? 'Importando…' : 'Traer ventas'}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
