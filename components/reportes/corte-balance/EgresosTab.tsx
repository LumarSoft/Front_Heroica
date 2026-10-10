'use client'

import { useCallback, useMemo } from 'react'
import { EgresosSeccionCard } from '@/components/reportes/corte-balance/EgresosSeccionCard'
import { EgresosSueltosPanel } from '@/components/reportes/corte-balance/EgresosSueltosPanel'
import { asignarReglaALinea, excluirRegla, opcionesDeLineas, volverAIncluirRegla } from '@/lib/corte-balance/edicion'
import type {
  AjusteLineaCorte,
  BorradorCorteBalance,
  PlantillaCorteBalance,
  ReglaPlantilla,
  ResultadoCorteBalance,
} from '@/lib/types'

interface EgresosTabProps {
  resultado: ResultadoCorteBalance
  plantilla: PlantillaCorteBalance
  borrador: BorradorCorteBalance
  moneda: 'ARS' | 'USD'
  onPlantillaChange: (plantilla: PlantillaCorteBalance) => void
  onAjusteChange: (lineaId: string, cambios: Partial<AjusteLineaCorte>) => void
  onDetalleChange: (seccionId: string, texto: string) => void
}

export function EgresosTab({
  resultado,
  plantilla,
  borrador,
  moneda,
  onPlantillaChange,
  onAjusteChange,
  onDetalleChange,
}: EgresosTabProps) {
  const lineas = useMemo(() => opcionesDeLineas(plantilla), [plantilla])

  const asignar = useCallback(
    (regla: ReglaPlantilla, lineaId: string) => onPlantillaChange(asignarReglaALinea(plantilla, regla, lineaId)),
    [plantilla, onPlantillaChange],
  )
  const excluir = useCallback(
    (regla: ReglaPlantilla) => onPlantillaChange(excluirRegla(plantilla, regla)),
    [plantilla, onPlantillaChange],
  )
  const incluir = useCallback(
    (regla: ReglaPlantilla) => onPlantillaChange(volverAIncluirRegla(plantilla, regla)),
    [plantilla, onPlantillaChange],
  )

  return (
    <div className="space-y-5">
      <EgresosSueltosPanel
        modo="sin-clasificar"
        grupos={resultado.sinClasificar}
        total={resultado.totalSinClasificar}
        lineas={lineas}
        moneda={moneda}
        onAsignar={asignar}
        onExcluir={excluir}
        onIncluir={incluir}
      />
      {resultado.secciones.map(seccion => (
        <EgresosSeccionCard
          key={seccion.id}
          seccion={seccion}
          ajustes={borrador.ajustes}
          detalle={borrador.detalles[seccion.id] ?? seccion.detalle}
          moneda={moneda}
          onAjusteChange={onAjusteChange}
          onDetalleChange={onDetalleChange}
        />
      ))}
      <EgresosSueltosPanel
        modo="excluidos"
        grupos={resultado.excluidos}
        total={resultado.totalExcluido}
        lineas={lineas}
        moneda={moneda}
        onAsignar={asignar}
        onExcluir={excluir}
        onIncluir={incluir}
      />
    </div>
  )
}
