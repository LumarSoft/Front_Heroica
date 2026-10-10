import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { corteCardClasses, labelClasses } from '@/lib/dialog-styles'
import { COLOR_PRINCIPAL_POR_DEFECTO } from '@/lib/corte-balance/borrador-por-defecto'
import type { MostrarVacios, OpcionesCorteBalance } from '@/lib/types'

interface OpcionesTabProps {
  opciones: OpcionesCorteBalance
  onChange: (cambios: Partial<OpcionesCorteBalance>) => void
}

type ClaveBooleana = {
  [K in keyof OpcionesCorteBalance]: OpcionesCorteBalance[K] extends boolean ? K : never
}[keyof OpcionesCorteBalance]

const SWITCHES: { clave: ClaveBooleana; etiqueta: string; ayuda: string }[] = [
  { clave: 'incluirPortada', etiqueta: 'Portada', ayuda: 'Título, sucursal y período' },
  { clave: 'incluirIndice', etiqueta: 'Índice de contenidos', ayuda: '01 - Anexo Ingresos, 02 - …' },
  { clave: 'incluirSeparadores', etiqueta: 'Separadores', ayuda: 'Una diapositiva con el título antes de cada anexo' },
  { clave: 'incluirGraficoEgresos', etiqueta: 'Gráfico de torta de egresos', ayuda: 'Editable en PowerPoint' },
  { clave: 'incluirBalance', etiqueta: 'Balance mensual', ayuda: 'Ingresos, egresos y resultado' },
  { clave: 'incluirCierre', etiqueta: 'Diapositiva de cierre', ayuda: '"Gracias" + firma' },
  { clave: 'ocultarLineasEnCero', etiqueta: 'Ocultar líneas en $0', ayuda: 'En las tablas de egresos' },
  { clave: 'incluirComparativo', etiqueta: 'Comparativo vs mes anterior', ayuda: 'Variación por sección, resaltada' },
  { clave: 'incluirEvolucion', etiqueta: 'Evolución 6 meses', ayuda: 'Barras apiladas por sección' },
  { clave: 'incluirTopProveedores', etiqueta: 'Principales proveedores', ayuda: 'Top 10 + banco vs efectivo' },
  { clave: 'incluirCascada', etiqueta: 'Cascada del balance', ayuda: 'Del ingreso al resultado final' },
  { clave: 'incluirIndicadores', etiqueta: 'Indicadores y equilibrio', ayuda: '% sobre ventas y punto de equilibrio' },
  {
    clave: 'incluirSinClasificar',
    etiqueta: 'Sumar egresos sin clasificar',
    ayuda: 'Como sección "Otros egresos" (también suma al balance)',
  },
]

const COLORES = [
  { valor: COLOR_PRINCIPAL_POR_DEFECTO, nombre: 'Azul Canva' },
  { valor: '#002868', nombre: 'Azul Heroica' },
  { valor: '#0F766E', nombre: 'Verde' },
  { valor: '#9F1239', nombre: 'Bordó' },
  { valor: '#334155', nombre: 'Gris' },
]

const FUENTES = ['Inter', 'Arial', 'Calibri', 'Montserrat', 'Poppins']

const VACIOS: { value: MostrarVacios; label: string }[] = [
  { value: 'blanco', label: 'En blanco (para completar después)' },
  { value: 'guion', label: 'Con un guion (—)' },
  { value: 'cero', label: 'Como cero' },
]

const esVacios = (v: string): v is MostrarVacios => VACIOS.some(x => x.value === v)

export function OpcionesTab({ opciones, onChange }: OpcionesTabProps) {
  const texto = (clave: 'titulo' | 'subtitulo' | 'periodo' | 'textoCierre' | 'firmaCierre', etiqueta: string) => (
    <div className="space-y-1">
      <Label className={labelClasses}>{etiqueta}</Label>
      <Input value={opciones[clave]} onChange={e => onChange({ [clave]: e.target.value })} />
    </div>
  )

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <section className={`${corteCardClasses} space-y-4`}>
        <h3 className="text-sm font-bold text-[#002868]">Textos</h3>
        {texto('titulo', 'Título de portada')}
        {texto('subtitulo', 'Subtítulo (sucursal)')}
        {texto('periodo', 'Período')}
        <div className="grid grid-cols-2 gap-3">
          {texto('textoCierre', 'Texto de cierre')}
          {texto('firmaCierre', 'Firma')}
        </div>
      </section>

      <section className={`${corteCardClasses} space-y-4`}>
        <h3 className="text-sm font-bold text-[#002868]">Diseño</h3>
        <div className="space-y-2">
          <Label className={labelClasses}>Color principal</Label>
          <div className="flex flex-wrap items-center gap-2">
            {COLORES.map(c => (
              <Button
                key={c.valor}
                type="button"
                variant={opciones.colorPrincipal.toLowerCase() === c.valor.toLowerCase() ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange({ colorPrincipal: c.valor })}
              >
                {c.nombre}
              </Button>
            ))}
            <Input
              type="color"
              value={opciones.colorPrincipal}
              onChange={e => onChange({ colorPrincipal: e.target.value })}
              className="h-9 w-14 cursor-pointer p-1"
              aria-label="Color personalizado"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className={labelClasses}>Fuente</Label>
            <Select value={opciones.fuente} onValueChange={fuente => onChange({ fuente })}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUENTES.map(f => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={labelClasses}>Valores vacíos</Label>
            <Select value={opciones.mostrarVacios} onValueChange={v => esVacios(v) && onChange({ mostrarVacios: v })}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VACIOS.map(v => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label className={labelClasses}>Resaltar variaciones desde (%)</Label>
          <Input
            type="number"
            min={0}
            step="1"
            value={opciones.umbralVariacionPct}
            onChange={e => onChange({ umbralVariacionPct: Math.max(0, Number(e.target.value) || 0) })}
            className="w-28"
          />
        </div>
      </section>

      <section className={`${corteCardClasses} lg:col-span-2`}>
        <h3 className="mb-3 text-sm font-bold text-[#002868]">Qué incluir</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SWITCHES.map(s => (
            <Label
              key={s.clave}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#EEF0F3] p-3 font-normal"
            >
              <Switch
                checked={opciones[s.clave]}
                onCheckedChange={v => onChange({ [s.clave]: v })}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium text-[#1A1A1A]">{s.etiqueta}</span>
                <span className="block text-xs text-[#9AA0AC]">{s.ayuda}</span>
              </span>
            </Label>
          ))}
        </div>
      </section>
    </div>
  )
}
