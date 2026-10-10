'use client'

import { useMemo, useState } from 'react'
import { Plus, RotateCcw, Save, Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PlantillaSeccionEditor } from '@/components/reportes/corte-balance/PlantillaSeccionEditor'
import type { OpcionesReglas } from '@/components/reportes/corte-balance/ReglaSelector'
import { corteCardClasses, corteChipClasses, labelClasses } from '@/lib/dialog-styles'
import { formatFechaHora } from '@/lib/formatters'
import { etiquetaRegla, mover, nuevaSeccion, quitarEn, reemplazarEn } from '@/lib/corte-balance/edicion'
import type { CatalogoEgresosCorte, PlantillaCorteBalance, SeccionPlantilla } from '@/lib/types'

interface PlantillaTabProps {
  plantilla: PlantillaCorteBalance
  catalogo: CatalogoEgresosCorte
  esPorDefecto: boolean
  actualizadaEn: string | null
  modificada: boolean
  puedeGuardar: boolean
  isSaving: boolean
  onChange: (plantilla: PlantillaCorteBalance) => void
  onGuardar: () => void
  onDescartar: () => void
  onRestablecer: () => void
}

export function PlantillaTab({
  plantilla,
  catalogo,
  esPorDefecto,
  actualizadaEn,
  modificada,
  puedeGuardar,
  isSaving,
  onChange,
  onGuardar,
  onDescartar,
  onRestablecer,
}: PlantillaTabProps) {
  const [confirmarReset, setConfirmarReset] = useState(false)
  const setSecciones = (secciones: SeccionPlantilla[]) => onChange({ ...plantilla, secciones })

  const opcionesReglas = useMemo<OpcionesReglas>(() => {
    const categorias = new Map(catalogo.categorias.map(c => [c.id, c.nombre]))
    const subcategorias = new Map(catalogo.subcategorias.map(s => [s.id, s.nombre]))
    return {
      categoria: catalogo.categorias.map(c => ({ value: String(c.id), label: c.nombre })),
      subcategoria: catalogo.subcategorias.map(s => ({
        value: String(s.id),
        label: `${categorias.get(s.categoria_id ?? 0) ?? '—'} › ${s.nombre}`,
      })),
      descripcion: catalogo.descripciones.map(d => ({
        value: String(d.id),
        label: d.subcategoria_id ? `${d.nombre} (${subcategorias.get(d.subcategoria_id) ?? '—'})` : d.nombre,
      })),
    }
  }, [catalogo])

  const estado = esPorDefecto
    ? 'Plantilla por defecto (armada a partir del Canva de Julio 2026)'
    : `Plantilla guardada${actualizadaEn ? ` el ${formatFechaHora(actualizadaEn)}` : ''}`

  return (
    <div className="space-y-5">
      <section className={`${corteCardClasses} space-y-3`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-[#002868]">Plantilla global de egresos</h3>
            <p className="text-xs text-[#5A6070]">
              {estado}. Cada línea suma los egresos que coinciden con sus reglas; si un egreso coincide con varias, gana
              la regla más específica (descripción &gt; subcategoría &gt; categoría).
            </p>
            {modificada && (
              <p className="mt-1 text-xs font-semibold text-amber-700">
                Hay cambios sin guardar: se usan en esta exportación
                {puedeGuardar ? ', guardalos para que apliquen a todas las sucursales.' : '.'}
              </p>
            )}
          </div>
          {modificada && (
            <Button type="button" variant="outline" size="sm" onClick={onDescartar} disabled={isSaving}>
              <Undo2 className="h-3.5 w-3.5" /> Descartar cambios
            </Button>
          )}
          {puedeGuardar && !esPorDefecto && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmarReset(true)}
              disabled={isSaving}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Volver a la por defecto
            </Button>
          )}
          {puedeGuardar && (
            <Button type="button" size="sm" onClick={onGuardar} disabled={isSaving || (!modificada && !esPorDefecto)}>
              {isSaving ? <LoadingSpinner className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              Guardar para todas las sucursales
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-1">
            <Label className={labelClasses}>Operatividad por defecto (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.5"
              value={plantilla.operatividadPct}
              onChange={e => onChange({ ...plantilla, operatividadPct: Number(e.target.value) || 0 })}
              className="w-28"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <Label className={labelClasses}>Excluidos del reporte</Label>
            <div className="flex flex-wrap gap-1.5">
              {plantilla.excluidas.length === 0 && <span className="text-xs text-[#9AA0AC]">Ninguno</span>}
              {plantilla.excluidas.map((r, i) => (
                <span key={`${r.tipo}-${r.id}-${r.medio ?? ''}`} className={corteChipClasses}>
                  {etiquetaRegla(r, catalogo)}
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                    onClick={() => onChange({ ...plantilla, excluidas: quitarEn(plantilla.excluidas, i) })}
                    aria-label="Volver a incluir"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {plantilla.secciones.map((s, i) => (
        <PlantillaSeccionEditor
          key={s.id}
          seccion={s}
          catalogo={catalogo}
          opcionesReglas={opcionesReglas}
          esPrimera={i === 0}
          esUltima={i === plantilla.secciones.length - 1}
          onChange={seccion => setSecciones(reemplazarEn(plantilla.secciones, i, seccion))}
          onMove={delta => setSecciones(mover(plantilla.secciones, i, delta))}
          onRemove={() => setSecciones(quitarEn(plantilla.secciones, i))}
        />
      ))}

      <Button type="button" variant="outline" onClick={() => setSecciones([...plantilla.secciones, nuevaSeccion()])}>
        <Plus className="h-4 w-4" /> Agregar sección
      </Button>

      <DeleteDialog
        open={confirmarReset}
        nombre="la plantilla guardada (se vuelve a la plantilla por defecto)"
        onCancel={() => setConfirmarReset(false)}
        onConfirm={() => {
          setConfirmarReset(false)
          onRestablecer()
        }}
      />
    </div>
  )
}
