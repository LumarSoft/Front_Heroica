'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { inputClasses, labelClasses } from '@/lib/dialog-styles'
import type { NuevoMovimientoContext } from '@/lib/types'
import { MovimientoSelect } from './MovimientoSelect'
import { Combobox } from '@/components/ui/combobox'
interface Props {
  context: NuevoMovimientoContext
}
export function MovimientoGeneralFields({ context }: Props) {
  const {
    formData,
    setFormData,
    handleInputChange,
    isPagoPendiente,
    isApprovalMode,
    descripciones,
    categorias,
    subcategorias,
  } = context
  return (
    <section className="space-y-4">
      <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
        <span className="w-1 h-4 bg-[#002868] rounded-full" />
        Información general
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
          <Label htmlFor="tipo" className={labelClasses}>
            Tipo *
          </Label>
          <MovimientoSelect
            id="tipo"
            allowEmpty={false}
            value={formData.tipo}
            onValueChange={value => handleInputChange({ target: { name: 'tipo', value } })}
            options={[
              ...(isPagoPendiente || isApprovalMode ? [] : [{ value: 'ingreso', label: 'Ingreso' }]),
              { value: 'egreso', label: 'Egreso' },
            ]}
            placeholder="Seleccione"
            disabled={isPagoPendiente || isApprovalMode}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className={labelClasses}>Descripción (Clasificación) *</Label>
        <Combobox
          options={descripciones
            .filter(d => !d.tipo || d.tipo === formData.tipo)
            .map(d => ({ value: d.id.toString(), label: d.nombre }))}
          value={formData.descripcion_id}
          onChange={value => {
            const selectedDesc = descripciones.find(d => d.id.toString() === value)
            setFormData(prev => ({
              ...prev,
              descripcion_id: value,
              descripcion_nombre: '',
              ...(selectedDesc?.categoria_id && { categoria_id: selectedDesc.categoria_id.toString() }),
              subcategoria_id: selectedDesc?.subcategoria_id ? selectedDesc.subcategoria_id.toString() : '',
            }))
          }}
          onCreateOption={nombre => {
            setFormData(prev => ({
              ...prev,
              descripcion_id: '',
              descripcion_nombre: nombre,
            }))
          }}
          pendingLabel={formData.descripcion_nombre || undefined}
          placeholder="Seleccione o escriba una descripción"
          searchPlaceholder="Buscar o crear descripción..."
          emptyText="No hay descripciones para este tipo"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="categoria_id" className={labelClasses}>
            Categoría
          </Label>
          <MovimientoSelect
            id="categoria_id"
            value={formData.categoria_id}
            onValueChange={value => handleInputChange({ target: { name: 'categoria_id', value } })}
            options={categorias
              .filter(c => c.tipo === formData.tipo)
              .map(c => ({ value: String(c.id), label: c.nombre }))}
            placeholder="Seleccione categoría"
            disabled={false}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subcategoria_id" className={labelClasses}>
            Subcategoría
          </Label>
          <MovimientoSelect
            id="subcategoria_id"
            value={formData.subcategoria_id}
            onValueChange={value => handleInputChange({ target: { name: 'subcategoria_id', value } })}
            options={subcategorias.map(s => ({ value: String(s.id), label: s.nombre }))}
            placeholder="Seleccione subcategoría"
            disabled={!formData.categoria_id}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comentarios" className={labelClasses}>
          {isPagoPendiente ? 'Observaciones *' : 'Comentarios'}
        </Label>
        <Input
          id="comentarios"
          name="comentarios"
          placeholder={
            isPagoPendiente ? 'Indicá el motivo y los datos necesarios del pago' : 'Comentarios adicionales (opcional)'
          }
          value={formData.comentarios}
          onChange={handleInputChange}
          className={inputClasses}
        />
      </div>
    </section>
  )
}
