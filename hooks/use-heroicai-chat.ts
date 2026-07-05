'use client'

import { useCallback, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function nuevoId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Maneja el estado del chat de HeroicAI y el consumo del stream SSE.
 * El backend responde con líneas `data: {"token"|"done"|"error"}`.
 */
export function useHeroicaiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversacionId, setConversacionId] = useState<number | null>(null)
  /** Herramienta que HeroicAI está ejecutando en este momento (para el indicador de "pensando"). */
  const [toolActivo, setToolActivo] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const appendToLast = useCallback((chunk: string) => {
    setMessages(prev => {
      const next = [...prev]
      const last = next[next.length - 1]
      if (last && last.role === 'assistant') {
        next[next.length - 1] = { ...last, content: last.content + chunk }
      }
      return next
    })
  }, [])

  const send = useCallback(
    async (texto: string) => {
      const contenido = texto.trim()
      if (!contenido || isStreaming) return

      setError(null)

      const userMsg: ChatMessage = { id: nuevoId(), role: 'user', content: contenido }
      const assistantMsg: ChatMessage = { id: nuevoId(), role: 'assistant', content: '' }
      setMessages(prev => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)
      setToolActivo(null)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await apiFetch(API_ENDPOINTS.HEROICAI.CHAT, {
          method: 'POST',
          body: JSON.stringify({ mensaje: contenido, conversacion_id: conversacionId }),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.message ?? 'No se pudo conectar con HeroicAI.')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const eventos = buffer.split('\n\n')
          buffer = eventos.pop() ?? ''

          for (const evento of eventos) {
            const linea = evento.trim()
            if (!linea.startsWith('data:')) continue
            const payload = linea.slice(5).trim()
            if (!payload) continue

            try {
              const data = JSON.parse(payload) as {
                token?: string
                tool?: string
                done?: boolean
                error?: string
                conversacion_id?: number
              }
              if (data.error) throw new Error(data.error)
              if (data.conversacion_id) setConversacionId(data.conversacion_id)
              if (data.tool) setToolActivo(data.tool)
              // El primer token de texto marca el fin de la fase de "pensando".
              if (data.token) {
                setToolActivo(null)
                appendToLast(data.token)
              }
            } catch (err: unknown) {
              if (err instanceof Error && err.message) throw err
            }
          }
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return
        const mensaje = err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
        setError(mensaje)
        // Si el mensaje del asistente quedó vacío, lo removemos para no dejar una burbuja fantasma.
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last && last.role === 'assistant' && !last.content) return prev.slice(0, -1)
          return prev
        })
      } finally {
        setIsStreaming(false)
        setToolActivo(null)
        abortRef.current = null
      }
    },
    [isStreaming, conversacionId, appendToLast],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setToolActivo(null)
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    setIsStreaming(false)
    setToolActivo(null)
    setConversacionId(null)
  }, [])

  /** Carga una conversación existente en el chat (mensajes ya traídos de la API). */
  const loadConversacion = useCallback(
    (id: number, mensajes: Array<{ role: 'user' | 'assistant'; content: string }>) => {
      abortRef.current?.abort()
      setError(null)
      setIsStreaming(false)
      setToolActivo(null)
      setConversacionId(id)
      setMessages(mensajes.map(m => ({ id: nuevoId(), role: m.role, content: m.content })))
    },
    [],
  )

  return { messages, isStreaming, toolActivo, error, conversacionId, send, stop, reset, loadConversacion }
}
