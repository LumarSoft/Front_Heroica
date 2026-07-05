'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/hooks/use-heroicai-chat'
import { MessageBubble } from './MessageBubble'
import { ThinkingIndicator } from './ThinkingIndicator'

interface MessageListProps {
  messages: ChatMessage[]
  isStreaming: boolean
  toolActivo?: string | null
}

export function MessageList({ messages, isStreaming, toolActivo }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll suave al fondo cuando llegan tokens, mensajes o cambia el estado de "pensando".
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isStreaming, toolActivo])

  const last = messages[messages.length - 1]
  const esperandoPrimerToken = isStreaming && last?.role === 'assistant' && last.content === ''

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
      {messages.map((m, idx) => {
        const esUltimo = idx === messages.length - 1
        const bubbleStreaming = isStreaming && esUltimo && m.role === 'assistant' && m.content !== ''
        // No renderizar la burbuja vacía del asistente mientras "piensa".
        if (esperandoPrimerToken && esUltimo && m.role === 'assistant') return null
        return <MessageBubble key={m.id} message={m} streaming={bubbleStreaming} />
      })}

      {esperandoPrimerToken && <ThinkingIndicator tool={toolActivo} />}

      <div ref={bottomRef} />
    </div>
  )
}
