'use client'

import { useEffect, useState } from 'react'
import { Bell, ArrowRight, MessageCircle, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Avatar } from './Avatar'
import type { NotificarData, UsuarioBasico } from './types'

interface NotificarDialogProps {
  data: NotificarData | null
  usuarios: UsuarioBasico[]
  currentUserId: number | null
  onSend: (usuariosIds: number[], descripcion: string, tareaId: number, tipo: string) => Promise<void>
  onClose: () => void
}

export function NotificarDialog({ data, usuarios, currentUserId, onSend, onClose }: NotificarDialogProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [extra, setExtra] = useState('')
  const [sending, setSending] = useState(false)

  const otros = usuarios.filter(u => u.id !== currentUserId)

  useEffect(() => {
    if (data) {
      setSelected(new Set())
      setExtra('')
    }
  }, [data])

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSend() {
    if (!data || selected.size === 0) return
    setSending(true)
    const finalDesc = extra.trim() ? `${data.descripcion}\n\n${extra.trim()}` : data.descripcion
    await onSend(Array.from(selected), finalDesc, data.tareaId, data.tipo)
    setSending(false)
    onClose()
  }

  if (!data) return null

  return (
    <Dialog open={!!data} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#002868] flex items-center gap-2">
            <Bell className="w-4.5 h-4.5" />
            Notificar cambio
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Elegí quién debería saber sobre esto.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div
            className={cn(
              'flex items-start gap-3 p-3.5 rounded-xl border',
              data.tipo === 'movimiento' ? 'bg-blue-50 border-blue-200' : 'bg-violet-50 border-violet-200',
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                data.tipo === 'movimiento' ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600',
              )}
            >
              {data.tipo === 'movimiento' ? <ArrowRight className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
            </div>
            <p className="text-sm font-medium text-slate-700 leading-snug">{data.descripcion}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2.5">¿A quién querés notificar?</p>
            {otros.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No hay otros usuarios disponibles.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {otros.map(u => {
                  const isSelected = selected.has(u.id)
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggle(u.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer text-sm font-medium',
                        isSelected
                          ? 'bg-[#002868] text-white border-[#002868]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-[#002868]/40 hover:text-[#002868]',
                      )}
                    >
                      <Avatar name={u.nombre} size="sm" />
                      {u.nombre.split(' ')[0]}
                      {isSelected && <CheckCheck className="w-3.5 h-3.5 opacity-80" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700">
              Nota adicional <span className="font-normal text-slate-400">(opcional)</span>
            </Label>
            <textarea
              value={extra}
              onChange={e => setExtra(e.target.value)}
              placeholder="Agregá información extra si querés..."
              rows={3}
              className="w-full mt-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#002868] focus:ring-1 focus:ring-[#002868] resize-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending} className="cursor-pointer">
            Omitir
          </Button>
          <Button
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
            className="bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Enviando...
              </span>
            ) : (
              `Notificar${selected.size > 0 ? ` (${selected.size})` : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
