'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { fechaHoyMovimiento } from '@/lib/movimiento-form'
import type {
  ApiRespuesta,
  CajaPrestamo,
  DevolverPrestamoForm,
  ModoPrestamo,
  PedirPrestamoForm,
  Prestamo,
  SucursalPrestamo,
} from '@/lib/types'

interface Opciones {
  /** El formulario de préstamo está visible (dentro de Nuevo Movimiento) */
  activo: boolean
  sucursalId: number
  cajaTipo: CajaPrestamo
  moneda: 'ARS' | 'USD'
  /** Se llama al guardar bien: cerrar el diálogo y recargar la caja */
  onDone: () => void
}

const pedirInicial = (): PedirPrestamoForm => ({
  fecha: fechaHoyMovimiento(),
  monto: '',
  descripcion: '',
  sucursal_presta_id: '',
  caja_salida: 'banco',
  banco_salida_id: '',
  banco_entrada_id: '',
})

const devolverInicial = (): DevolverPrestamoForm => ({
  prestamo_id: '',
  total: true,
  monto: '',
  fecha: fechaHoyMovimiento(),
  banco_salida_id: '',
  caja_entrada: 'banco',
  banco_entrada_id: '',
})

const aNumero = (valor: string) => (valor ? Number(valor) : null)

/**
 * Estado y envío del préstamo entre sucursales de Nuevo Movimiento.
 * "Pedir": la plata entra en la caja actual. "Devolver": sale de la caja actual.
 */
export function usePrestamoForm({ activo, sucursalId, cajaTipo, moneda, onDone }: Opciones) {
  const [modo, setModo] = useState<ModoPrestamo>('pedir')
  const [pedir, setPedir] = useState(pedirInicial)
  const [devolver, setDevolver] = useState(devolverInicial)
  const [sucursales, setSucursales] = useState<SucursalPrestamo[]>([])
  const [pendientes, setPendientes] = useState<Prestamo[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (activo) return
    setModo('pedir')
    setPedir(pedirInicial())
    setDevolver(devolverInicial())
    setError('')
  }, [activo])

  useEffect(() => {
    if (!activo) return
    apiFetch(API_ENDPOINTS.PRESTAMOS.SUCURSALES)
      .then(r => r.json())
      .then((d: ApiRespuesta<SucursalPrestamo[]>) => setSucursales((d.data ?? []).filter(s => s.id !== sucursalId)))
      .catch(() => setSucursales([]))
  }, [activo, sucursalId])

  useEffect(() => {
    if (!activo || modo !== 'devolver') return
    apiFetch(API_ENDPOINTS.PRESTAMOS.PENDIENTES_DEVOLVER(sucursalId, moneda), { cache: 'no-store' })
      .then(r => r.json())
      .then((d: ApiRespuesta<Prestamo[]>) => setPendientes(d.data ?? []))
      .catch(() => setPendientes([]))
  }, [activo, modo, sucursalId, moneda])

  const prestamoElegido = useMemo(
    () => pendientes.find(p => String(p.id) === devolver.prestamo_id) ?? null,
    [pendientes, devolver.prestamo_id],
  )
  const disponible = prestamoElegido ? (prestamoElegido.disponible ?? prestamoElegido.pendiente) : 0

  /** Al elegir el préstamo a devolver: por defecto el total, a la caja de donde salió. */
  const elegirPrestamo = useCallback(
    (id: string) => {
      const p = pendientes.find(x => String(x.id) === id)
      setDevolver(prev => ({
        ...prev,
        prestamo_id: id,
        total: true,
        monto: p ? String(p.disponible ?? p.pendiente) : '',
        caja_entrada: p?.caja_salida ?? 'banco',
        banco_entrada_id: p?.banco_salida_id ? String(p.banco_salida_id) : '',
      }))
    },
    [pendientes],
  )

  const validar = (): string | null => {
    if (modo === 'pedir') {
      if (!pedir.sucursal_presta_id) return 'Elegí la sucursal que presta.'
      if (!(parseFloat(pedir.monto) > 0)) return 'El monto debe ser mayor a cero.'
      if (pedir.caja_salida === 'banco' && !pedir.banco_salida_id) return 'Elegí de qué banco sale la plata.'
      if (cajaTipo === 'banco' && !pedir.banco_entrada_id) return 'Elegí a qué banco entra la plata.'
      return null
    }
    if (!prestamoElegido) return 'Elegí el préstamo que querés devolver.'
    const monto = devolver.total ? disponible : parseFloat(devolver.monto)
    if (!(monto > 0)) return 'El monto debe ser mayor a cero.'
    if (monto > disponible) return 'El monto supera lo que queda por devolver.'
    if (cajaTipo === 'banco' && !devolver.banco_salida_id) return 'Elegí de qué banco sale la plata.'
    if (devolver.caja_entrada === 'banco' && !devolver.banco_entrada_id) return 'Elegí a qué banco entra la plata.'
    return null
  }

  const submit = async (): Promise<void> => {
    const problema = validar()
    if (problema) {
      setError(problema)
      return
    }
    const [url, body] =
      modo === 'pedir'
        ? [
            API_ENDPOINTS.PRESTAMOS.CREATE,
            {
              sucursal_presta_id: Number(pedir.sucursal_presta_id),
              sucursal_recibe_id: sucursalId,
              monto: parseFloat(pedir.monto),
              moneda,
              descripcion: pedir.descripcion.trim() || null,
              fecha: pedir.fecha,
              caja_salida: pedir.caja_salida,
              banco_salida_id: pedir.caja_salida === 'banco' ? aNumero(pedir.banco_salida_id) : null,
              caja_entrada: cajaTipo,
              banco_entrada_id: cajaTipo === 'banco' ? aNumero(pedir.banco_entrada_id) : null,
            },
          ]
        : [
            API_ENDPOINTS.PRESTAMOS.DEVOLVER(Number(devolver.prestamo_id)),
            {
              monto: devolver.total ? disponible : parseFloat(devolver.monto),
              fecha: devolver.fecha,
              caja_salida: cajaTipo,
              banco_salida_id: cajaTipo === 'banco' ? aNumero(devolver.banco_salida_id) : null,
              caja_entrada: devolver.caja_entrada,
              banco_entrada_id: devolver.caja_entrada === 'banco' ? aNumero(devolver.banco_entrada_id) : null,
            },
          ]
    try {
      setIsSaving(true)
      setError('')
      const res = await apiFetch(url, { method: 'POST', body: JSON.stringify(body) })
      const data: ApiRespuesta<{ id: number; directo: boolean }> = await res.json()
      if (!res.ok) throw new Error(data.message || 'No se pudo guardar el préstamo')
      toast.success(data.message || 'Préstamo guardado')
      onDone()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el préstamo')
    } finally {
      setIsSaving(false)
    }
  }

  return {
    modo,
    setModo,
    pedir,
    setPedir,
    devolver,
    setDevolver,
    elegirPrestamo,
    prestamoElegido,
    disponible,
    sucursales,
    pendientes,
    isSaving,
    error,
    submit,
  }
}

export type PrestamoFormState = ReturnType<typeof usePrestamoForm>
