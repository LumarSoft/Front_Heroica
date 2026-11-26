'use client'
import { useEffect, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MontoInput } from '@/components/ui/monto-input'
import { MESES_ABONO } from '@/lib/abono'
import { inputClasses, labelClasses, selectClasses } from '@/lib/dialog-styles'
import type { NuevaFacturaAbono } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubiendo: boolean
  onSubir: (nueva: NuevaFacturaAbono) => Promise<boolean>
}

const MAX_BYTES = 10 * 1024 * 1024

/** Sube la factura de un mes: período, número, monto y el PDF o imagen */
export function SubirFacturaDialog({ open, onOpenChange, isSubiendo, onSubir }: Props) {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(String(hoy.getFullYear()))
  const [numero, setNumero] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const ahora = new Date()
    setMes(ahora.getMonth() + 1)
    setAnio(String(ahora.getFullYear()))
    setNumero('')
    setDescripcion('')
    setMonto('')
    setArchivo(null)
    setError('')
  }, [open])

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    const anioNum = Number(anio)
    if (!Number.isInteger(anioNum) || anioNum < 2000 || anioNum > 9999) return setError('Ingresá un año válido.')
    if (!(Number(monto) > 0)) return setError('Ingresá el monto de la factura.')
    if (!archivo) return setError('Elegí el archivo de la factura.')
    if (archivo.size > MAX_BYTES) return setError('El archivo supera el máximo de 10 MB.')
    setError('')
    if (await onSubir({ mes, anio: anioNum, numero, descripcion, monto, archivo })) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1A1A1A]">Subir factura</DialogTitle>
          <DialogDescription>Queda pendiente hasta que la marques como abonada.</DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="abono-mes" className={labelClasses}>
                Mes
              </Label>
              <select
                id="abono-mes"
                className={selectClasses}
                value={mes}
                onChange={e => setMes(Number(e.target.value))}
              >
                {MESES_ABONO.map((nombre, i) => (
                  <option key={nombre} value={i + 1}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="abono-anio" className={labelClasses}>
                Año
              </Label>
              <Input
                id="abono-anio"
                className={inputClasses}
                inputMode="numeric"
                value={anio}
                onChange={e => setAnio(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="abono-numero" className={labelClasses}>
                N° de factura
              </Label>
              <Input
                id="abono-numero"
                className={inputClasses}
                placeholder="Opcional"
                maxLength={50}
                value={numero}
                onChange={e => setNumero(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="abono-monto" className={labelClasses}>
                Monto
              </Label>
              <MontoInput id="abono-monto" className={inputClasses} value={monto} onChange={setMonto} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="abono-descripcion" className={labelClasses}>
              Descripción
            </Label>
            <Input
              id="abono-descripcion"
              className={inputClasses}
              placeholder="Opcional, ej. Abono mensual"
              maxLength={255}
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="abono-archivo" className={labelClasses}>
              Archivo
            </Label>
            <Input
              id="abono-archivo"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className={inputClasses}
              onChange={e => setArchivo(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-[#8A8F9C]">PDF o imagen, hasta 10 MB.</p>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubiendo} className="bg-[#002868] text-white hover:bg-[#003d8f]">
              <Upload className="h-4 w-4" />
              {isSubiendo ? 'Subiendo…' : 'Subir factura'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
