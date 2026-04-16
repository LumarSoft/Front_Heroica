'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { formatFecha } from '@/lib/formatters'
import type { PagoPendiente } from '@/lib/types'

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

        // ── Toast según estado ──
        if (estado === 'aprobado') {
          if (fechaCambio) {
            toast.success(`Tu pago "${item.concepto}" fue aprobado`, {
              description: `La fecha fue cambiada del ${formatFecha(fechaOriginal!)} al ${formatFecha(fechaActual)}.`,
              duration: 9000,
            })
          } else {
            toast.success(`Tu pago "${item.concepto}" fue aprobado por el administrador.`, {
              duration: 7000,
            })
          }
        } else {
          toast.error(`Tu pago "${item.concepto}" fue rechazado.`, {
            description: item.motivo_rechazo ? `Motivo: ${item.motivo_rechazo}` : 'Sin motivo especificado.',
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
