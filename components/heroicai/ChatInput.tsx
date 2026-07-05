'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (texto: string) => void
  onStop: () => void
  isStreaming: boolean
}

const MAX_LEN = 2000

export function ChatInput({ onSend, onStop, isStreaming }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Autosize del textarea según el contenido (hasta un máximo).
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [])

  useEffect(() => {
    resize()
  }, [value, resize])

  const handleSend = () => {
    const texto = value.trim()
    if (!texto || isStreaming) return
    onSend(texto)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const puedeEnviar = value.trim().length > 0 && !isStreaming

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-5">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-900/5 transition-shadow focus-within:border-blue-300 focus-within:shadow-blue-900/5">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value.slice(0, MAX_LEN))}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Preguntá sobre tesorería, RRHH o tareas…"
          className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-[14px] leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
        />

        {isStreaming ? (
          <button
            onClick={onStop}
            title="Detener"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white transition-colors hover:bg-slate-900 cursor-pointer"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!puedeEnviar}
            title="Enviar"
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200',
              puedeEnviar
                ? 'bg-gradient-to-br from-[#002868] to-[#2563eb] text-white shadow-sm hover:shadow-md cursor-pointer'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed',
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400">
        HeroicAI puede cometer errores. Verificá los datos importantes.
      </p>
    </div>
  )
}
