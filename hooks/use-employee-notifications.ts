'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { formatFecha, formatMonto } from '@/lib/formatters'
import type { PagoPendiente } from '@/lib/types'

/**
 * Devuelve una etiqueta legible para identificar el pago en la notificación.
 * El `concepto` es un campo libre que muchas veces queda vacío; en ese caso
 * caemos en la descripción o el proveedor para que la clienta sepa qué se aprobó.
 */
function etiquetaPago(p: PagoPendiente): string {
  const candidato = [p.concepto, p.descripcion_nombre, p.proveedor_nombre]
    .map(v => (v ?? '').trim())
    .find(v => v.length > 0)
  return candidato ?? `Pago #${p.id}`
}

/**
 * Línea de contexto (descripción + sucursal + monto) para que, entre tantos
 * pagos y sucursales, la clienta ubique de inmediato cuál fue aprobado.
 * La descripción solo se agrega si aporta algo distinto al título (`etiqueta`).
 */
function contextoPago(p: PagoPendiente, etiqueta: string): string {
  const partes: string[] = []
  const desc = (p.descripcion_nombre ?? '').trim()
  if (desc && desc !== etiqueta.trim()) partes.push(desc)
  if (p.sucursal_nombre) partes.push(p.sucursal_nombre)
  if (p.monto != null) partes.push(formatMonto(p.monto, p.moneda ?? 'ARS'))
  return partes.join(' · ')
}

// ── Tipos ──────────────────────────────────────────────────────────────────
export interface TrackedPago {
  id: number
  fecha_original: string
  concepto: string
  sucursal_id: number
}

// ── Helpers de localStorage ────────────────────────────────────────────────
function storageKey(userId: number, type: 'tracked' | 'seen' | 'initialized') {
  return `heroica_pp_${type}_${userId}`
}

function getTracked(userId: number): TrackedPago[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId, 'tracked')) ?? '[]')
  } catch {
    return []
  }
}

function getSeen(userId: number): number[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId, 'seen')) ?? '[]')
  } catch {
    return []
  }
}

function isInitialized(userId: number, sucursalId: number): boolean {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey(userId, 'initialized')) ?? '{}')
    return Boolean(data[sucursalId])
  } catch {
    return false
  }
}

function markInitialized(userId: number, sucursalId: number) {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey(userId, 'initialized')) ?? '{}')
    data[sucursalId] = true
    localStorage.setItem(storageKey(userId, 'initialized'), JSON.stringify(data))
  } catch {}
}

/**
 * Guarda un pago pendiente creado por el empleado para poder detectar
 * cambios de fecha cuando el admin lo apruebe.
 * Llamar desde NuevoMovimientoDialog tras una creación exitosa.
 */
export function trackCreatedPago(userId: number, pago: Omit<TrackedPago, never>) {
  try {
    const tracked = getTracked(userId)
    if (!tracked.find(t => t.id === pago.id)) {
      tracked.push(pago)
      localStorage.setItem(storageKey(userId, 'tracked'), JSON.stringify(tracked))
    }
  } catch {}
}

// ── Hook principal ─────────────────────────────────────────────────────────
/**
 * Polling de notificaciones para empleados.
 * Detecta cuando un admin aprueba o rechaza un pago pendiente del empleado
 * y muestra un toast con el resultado. Si la fecha fue cambiada, lo informa.
 *
 * @returns unseenCount - número de notificaciones nuevas no vistas
 * @returns clearUnseenCount - llama esto al navegar a pagos-pendientes
 */
export function useEmployeeNotifications(userId: number | undefined, sucursalId: number, isEmployee: boolean) {
  const [unseenCount, setUnseenCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const normalizeDate = (fecha: string): string => {
    if (!fecha) return ''
    return fecha.includes('T') ? fecha.split('T')[0] : fecha.substring(0, 10)
  }

  const checkNotifications = useCallback(async () => {
    if (!userId || !isEmployee) return

    try {
      const res = await apiFetch(
        `${API_ENDPOINTS.PAGOS_PENDIENTES.GET_HISTORIAL(userId)}?sucursal_id=${encodeURIComponent(String(sucursalId))}`,
      )
      if (!res.ok) return

      const data = await res.json()
      const historial: PagoPendiente[] = (data.data ?? []) as PagoPendiente[]

      // ── Primera ejecución: marcar todo como ya visto sin mostrar toasts ──
      if (!isInitialized(userId, sucursalId)) {
        const processed = historial.filter(p => p.estado === 'aprobado' || p.estado === 'rechazado').map(p => p.id)
        const existing = getSeen(userId)
        const merged = Array.from(new Set([...existing, ...processed]))
        localStorage.setItem(storageKey(userId, 'seen'), JSON.stringify(merged))
        markInitialized(userId, sucursalId)
        return
      }

      const seen = new Set(getSeen(userId))
      const tracked = getTracked(userId)
      const newIds: number[] = []
      let newCount = 0

      for (const item of historial) {
        const estado: string = item.estado
        if (estado !== 'aprobado' && estado !== 'rechazado') continue
        if (seen.has(item.id)) continue

        // Detectar cambio de fecha
        const trackedItem = tracked.find(t => t.id === item.id)
        const fechaOriginal = trackedItem?.fecha_original
        const fechaActual = normalizeDate(item.fecha ?? '')
        const fechaCambio = fechaOriginal && fechaOriginal !== fechaActual

        const etiqueta = etiquetaPago(item)
        const contexto = contextoPago(item, etiqueta)

        // ── Toast según estado ──
        if (estado === 'aprobado') {
          const lineaCambioFecha = fechaCambio
            ? `La fecha fue cambiada del ${formatFecha(fechaOriginal!)} al ${formatFecha(fechaActual)}.`
            : ''
          const description = [contexto, lineaCambioFecha].filter(Boolean).join('\n')
          toast.success(`Pago aprobado: ${etiqueta}`, {
            description: description || undefined,
            duration: fechaCambio ? 9000 : 7000,
          })
        } else {
          const motivo = item.motivo_rechazo ? `Motivo: ${item.motivo_rechazo}` : 'Sin motivo especificado.'
          const description = [contexto, motivo].filter(Boolean).join('\n')
          toast.error(`Pago rechazado: ${etiqueta}`, {
            description,
            duration: 9000,
          })
        }

        newIds.push(item.id)
        newCount++
      }

      if (newCount > 0) {
        const merged = Array.from(new Set([...Array.from(seen), ...newIds]))
        localStorage.setItem(storageKey(userId, 'seen'), JSON.stringify(merged))
        setUnseenCount(prev => prev + newCount)
      }
    } catch (_err: unknown) {
      // Error no crítico: el polling reintentará en el próximo ciclo.
    }
  }, [userId, sucursalId, isEmployee])

  useEffect(() => {
    if (!isEmployee || !userId) return

    checkNotifications()
    intervalRef.current = setInterval(checkNotifications, 30_000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [checkNotifications, isEmployee, userId])

  const clearUnseenCount = useCallback(() => setUnseenCount(0), [])

  return { unseenCount, clearUnseenCount }
}
