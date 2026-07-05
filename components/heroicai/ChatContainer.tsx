'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, RotateCcw, AlertCircle, PanelLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useHeroicaiChat } from '@/hooks/use-heroicai-chat'
import { useHeroicaiConversaciones } from '@/hooks/use-heroicai-conversaciones'
import { MessageList } from './MessageList'
import { EmptyState } from './EmptyState'
import { ChatInput } from './ChatInput'
import { ConversationsDrawer } from './ConversationsDrawer'

export function ChatContainer() {
  const { messages, isStreaming, toolActivo, error, conversacionId, send, stop, reset, loadConversacion } =
    useHeroicaiChat()
  const { conversaciones, loading, refrescar, cargarMensajes, eliminar } = useHeroicaiConversaciones()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const vacio = messages.length === 0

  // Refrescar la lista del historial cuando termina una respuesta (nueva conversación / título).
  const wasStreaming = useRef(false)
  useEffect(() => {
    if (wasStreaming.current && !isStreaming) refrescar()
    wasStreaming.current = isStreaming
  }, [isStreaming, refrescar])

  const abrirHistorial = () => {
    refrescar()
    setDrawerOpen(true)
  }

  const handleSelect = async (id: number) => {
    setDrawerOpen(false)
    const mensajes = await cargarMensajes(id)
    if (!mensajes) {
      toast.error('No se pudo cargar la conversación')
      return
    }
    loadConversacion(id, mensajes)
  }

  const handleNueva = () => {
    setDrawerOpen(false)
    reset()
  }

  const handleDelete = async (id: number) => {
    const ok = await eliminar(id)
    if (!ok) {
      toast.error('No se pudo eliminar la conversación')
      return
    }
    if (id === conversacionId) reset()
    toast.success('Conversación eliminada')
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#F8FAFF] to-[#F1F5FB]">
      {/* Header */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2.5">
          <button
            onClick={abrirHistorial}
            title="Historial"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <PanelLeft className="h-[18px] w-[18px]" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#002868] to-[#2563eb] shadow-sm shadow-blue-900/20">
              <Sparkles className="h-[18px] w-[18px] text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-800">HeroicAI</p>
              <p className="text-[11px] leading-tight text-slate-400">Asistente de consultas</p>
            </div>
          </div>
        </div>

        {!vacio && (
          <button
            onClick={handleNueva}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Nueva consulta
          </button>
        )}
      </header>

      {/* Cuerpo */}
      <div className="flex-1 overflow-y-auto">
        {vacio ? (
          <EmptyState onPick={send} />
        ) : (
          <MessageList messages={messages} isStreaming={isStreaming} toolActivo={toolActivo} />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-auto w-full max-w-3xl px-4">
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700 animate-in fade-in slide-in-from-bottom-1">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0">
        <ChatInput onSend={send} onStop={stop} isStreaming={isStreaming} />
      </div>

      {/* Drawer de historial */}
      <ConversationsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        conversaciones={conversaciones}
        loading={loading}
        activeId={conversacionId}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onNueva={handleNueva}
      />
    </div>
  )
}
