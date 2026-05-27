'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MontoInput } from '@/components/ui/monto-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { Area, Puesto, RhIncentivoMetodoCalculo, RhIncentivoPremio, RhIncentivoTipo } from '@/lib/types'

type ScopeType = 'sucursal' | 'area' | 'puesto'

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const METODOS: Array<{ value: RhIncentivoMetodoCalculo; label: string; hint: string }> = [
  { value: 'porcentaje_escala', label: '% de sueldo base', hint: 'Ej: 7 → 7% del sueldo del empleado' },
  { value: 'monto_fijo', label: 'Monto fijo', hint: 'Importe fijo igual para todos' },
  {
    value: 'multiplicador_valor_hora',
    label: 'Horas × valor/hora',
    hint: 'Ej: 2 → 2 horas al valor/hora del empleado',
  },
]

export interface IncentivoPayload {
  nombre: string
  tipo: RhIncentivoTipo
  descripcion: string | null
  mes: number
  anio: number
  metodo_calculo: RhIncentivoMetodoCalculo
  valor: number
  activo: boolean
  area_id: number | null
  puesto_id: number | null
}

interface IncentivoForm {
  nombre: string
  tipo: RhIncentivoTipo
  descripcion: string
  mes: number
  anio: number
  metodo_calculo: RhIncentivoMetodoCalculo
  valor: string
  activo: boolean
  scope: ScopeType
  area_id: string
  puesto_id: string
}

interface IncentivoFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: (payload: IncentivoPayload) => Promise<void>
  saving: boolean
  initial: RhIncentivoPremio | null
  defaultMes: number
  defaultAnio: number
  areas: Area[]
  puestos: Puesto[]
}

function formatArMoney(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseArNumber(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, '')
  if (!s) return null
  if (s.includes(',')) {
    const parts = s.split(',')
    if (parts.length > 2) return null
    const n = Number(`${parts[0].replace(/\./g, '')}.${(parts[1] ?? '').replace(/[^\d]/g, '').slice(0, 2)}`)
    return Number.isFinite(n) ? n : null
  }
  const n = Number(s.replace(/\./g, ''))
  return Number.isFinite(n) ? n : null
}

function parseValorNumeric(valorStr: string, metodo: RhIncentivoMetodoCalculo): number | null {
  if (metodo === 'monto_fijo') return parseArNumber(valorStr)
  const n = Number(valorStr)
  return Number.isFinite(n) ? n : null
}

function emptyForm(mes: number, anio: number): IncentivoForm {
  return {
    nombre: '',
    tipo: 'Incentivo',
    descripcion: '',
    mes,
    anio,
    metodo_calculo: 'porcentaje_escala',
    valor: '',
    activo: true,
    scope: 'sucursal',
    area_id: '',
    puesto_id: '',
  }
}

function toForm(incentivo: RhIncentivoPremio): IncentivoForm {
  const valorStr =
    incentivo.metodo_calculo === 'monto_fijo' ? formatArMoney(Number(incentivo.valor)) : String(incentivo.valor)
  const scope: ScopeType = incentivo.area_id ? 'area' : incentivo.puesto_id ? 'puesto' : 'sucursal'
  return {
    nombre: incentivo.nombre,
    tipo: incentivo.tipo,
    descripcion: incentivo.descripcion ?? '',
    mes: incentivo.mes,
    anio: incentivo.anio,
    metodo_calculo: incentivo.metodo_calculo,
    valor: valorStr,
    activo: typeof incentivo.activo === 'boolean' ? incentivo.activo : incentivo.activo === 1,
    scope,
    area_id: incentivo.area_id ? String(incentivo.area_id) : '',
    puesto_id: incentivo.puesto_id ? String(incentivo.puesto_id) : '',
  }
}

export function IncentivoFormDialog({
  open,
  onClose,
  onSave,
  saving,
  initial,
  defaultMes,
  defaultAnio,
  areas,
  puestos,
}: IncentivoFormDialogProps) {
  const [form, setForm] = useState<IncentivoForm>(() => emptyForm(defaultMes, defaultAnio))

  useEffect(() => {
    if (!open) return
    setForm(initial ? toForm(initial) : emptyForm(defaultMes, defaultAnio))
  }, [open, initial, defaultMes, defaultAnio])

  function setField<K extends keyof IncentivoForm>(key: K, value: IncentivoForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleMetodoChange(next: RhIncentivoMetodoCalculo) {
    setForm(prev => {
      let nextValor = prev.valor
      if (next === 'monto_fijo' && prev.metodo_calculo !== 'monto_fijo') {
        const n = Number(prev.valor)
        if (prev.valor.trim() !== '' && Number.isFinite(n)) nextValor = formatArMoney(n)
      } else if (next !== 'monto_fijo' && prev.metodo_calculo === 'monto_fijo') {
        const n = parseArNumber(prev.valor)
        nextValor = n !== null ? String(n) : prev.valor
      }
      return { ...prev, metodo_calculo: next, valor: nextValor }
    })
  }

  async function handleSave() {
    if (!form.nombre.trim()) {
      toast.error('Ingresá un nombre')
      return
    }
    const valorNum = parseValorNumeric(form.valor, form.metodo_calculo)
    if (valorNum === null || valorNum < 0) {
      toast.error('Ingresá un valor válido')
      return
    }
    if (form.scope === 'area' && !form.area_id) {
      toast.error('Seleccioná un área')
      return
    }
    if (form.scope === 'puesto' && !form.puesto_id) {
      toast.error('Seleccioná un puesto')
      return
    }
    await onSave({
      nombre: form.nombre,
      tipo: form.tipo,
      descripcion: form.descripcion.trim() || null,
      mes: form.mes,
      anio: form.anio,
      metodo_calculo: form.metodo_calculo,
      valor: valorNum,
      activo: form.activo,
      area_id: form.scope === 'area' && form.area_id ? Number(form.area_id) : null,
      puesto_id: form.scope === 'puesto' && form.puesto_id ? Number(form.puesto_id) : null,
    })
  }

  const metodoActual = METODOS.find(m => m.value === form.metodo_calculo)

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#002868]">
            {initial ? 'Editar incentivo' : 'Nuevo incentivo o premio'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={form.nombre} onChange={e => setField('nombre', e.target.value)} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Aplicar a</Label>
            <Select
              value={form.scope}
              onValueChange={v => setForm(prev => ({ ...prev, scope: v as ScopeType, area_id: '', puesto_id: '' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sucursal">Toda la sucursal</SelectItem>
                <SelectItem value="area">Área específica</SelectItem>
                <SelectItem value="puesto">Puesto específico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.scope === 'area' && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Área</Label>
              <Select value={form.area_id} onValueChange={v => setField('area_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.scope === 'puesto' && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Puesto</Label>
              <Select value={form.puesto_id} onValueChange={v => setField('puesto_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un puesto" />
                </SelectTrigger>
                <SelectContent>
                  {puestos.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                      <span className="text-[#9AA0AC] ml-1">· {p.area_nombre}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={v => setField('tipo', v as RhIncentivoTipo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Incentivo">Incentivo</SelectItem>
                <SelectItem value="Premio">Premio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Método de cálculo</Label>
            <Select value={form.metodo_calculo} onValueChange={v => handleMetodoChange(v as RhIncentivoMetodoCalculo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METODOS.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mes</Label>
            <Select value={String(form.mes)} onValueChange={v => setField('mes', Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((label, i) => (
                  <SelectItem key={label} value={String(i + 1)}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anio">Año</Label>
            <Input id="anio" type="number" value={form.anio} onChange={e => setField('anio', Number(e.target.value))} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="valor">Valor</Label>
            {form.metodo_calculo === 'monto_fijo' ? (
              <MontoInput id="valor" placeholder="Ej: 25.000" value={form.valor} onChange={v => setField('valor', v)} />
            ) : (
              <Input
                id="valor"
                type="number"
                min="0"
                step="0.01"
                value={form.valor}
                placeholder={form.metodo_calculo === 'porcentaje_escala' ? 'Ej: 7' : 'Ej: 2'}
                onChange={e => setField('valor', e.target.value)}
              />
            )}
            {metodoActual && <p className="text-xs text-[#9AA0AC]">{metodoActual.hint}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="descripcion">Detalle informativo</Label>
            <Textarea
              id="descripcion"
              value={form.descripcion}
              placeholder="Cómo se calcula, objetivo asociado o comentario interno"
              onChange={e => setField('descripcion', e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 flex items-center justify-between rounded-2xl border border-[#D8E3F8] bg-white p-4">
            <div>
              <p className="font-semibold text-[#002868]">Activo</p>
              <p className="text-sm text-[#666666]">Desactivá el incentivo cuando deje de aplicar.</p>
            </div>
            <Switch checked={form.activo} onCheckedChange={v => setField('activo', v)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#002868] text-white hover:bg-[#003d8f]">
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
