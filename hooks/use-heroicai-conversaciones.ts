'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'

export interface ConversacionResumen {
  id: number
  titulo: string
  created_at: string
  updated_at: string
}

export interface MensajePersistido {
  role: 'user' | 'assistant'
  content: string
}

/** Maneja la lista de conversaciones del historial de HeroicAI. */
export function useHeroicaiConversaciones() {
  const [conversaciones, setConversaciones] = useState<ConversacionResumen[]>([])
  const [loading, setLoading] = useState(false)

  const refrescar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.HEROICAI.CONVERSACIONES)
      if (!res.ok) return
      const data = await res.json()
      setConversaciones(Array.isArray(data.data) ? data.data : [])
    } catch {
      /* silencioso */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refrescar()
  }, [refrescar])

  const cargarMensajes = useCallback(async (id: number): Promise<MensajePersistido[] | null> => {
    try {
      const res = await apiFetch(API_ENDPOINTS.HEROICAI.CONVERSACION(id))
      if (!res.ok) return null
      const data = await res.json()
      const mensajes = data?.data?.mensajes
      return Array.isArray(mensajes) ? mensajes : []
    } catch {
      return null
    }
  }, [])

  const eliminar = useCallback(async (id: number): Promise<boolean> => {
    try {
      const res = await apiFetch(API_ENDPOINTS.HEROICAI.CONVERSACION(id), { method: 'DELETE' })
      if (!res.ok) return false
      setConversaciones(prev => prev.filter(c => c.id !== id))
      return true
    } catch {
      return false
    }
  }, [])

  return { conversaciones, loading, refrescar, cargarMensajes, eliminar }
}
