'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Monitor, Trash2, ShieldOff, RefreshCw, Clock } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Dispositivo {
  id: number
  user_agent: string | null
  ip_address: string | null
  created_at: string
  last_used_at: string | null
  expires_at: string
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Extrae un nombre legible del User-Agent (simplificado). */
function parseUserAgent(ua: string | null): string {
  if (!ua) return 'Navegador desconocido'
  if (/Chrome/i.test(ua) && !/Chromium|Edg/i.test(ua)) return 'Google Chrome'
  if (/Firefox/i.test(ua)) return 'Mozilla Firefox'
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari'
  if (/Edg/i.test(ua)) return 'Microsoft Edge'
  if (/OPR|Opera/i.test(ua)) return 'Opera'
  return 'Navegador desconocido'
}

export function DispositivosConfianzaSection() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [revocandoId, setRevocandoId] = useState<number | null>(null)
  const [revocandoTodos, setRevocandoTodos] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const fetchDispositivos = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.AUTH.DISPOSITIVOS)
      const data = await res.json()
      if (data.success) {
        setDispositivos(data.data)
      } else {
        toast.error(data.message || 'Error al cargar dispositivos')
      }
    } catch {
      toast.error('Error de conexión al cargar dispositivos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDispositivos()
  }, [fetchDispositivos])

  const handleRevocar = async (id: number) => {
    setRevocandoId(id)
    try {
      const res = await apiFetch(API_ENDPOINTS.AUTH.DISPOSITIVO(id), { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Dispositivo revocado')
        setDispositivos(prev => prev.filter(d => d.id !== id))
      } else {
        toast.error(data.message || 'Error al revocar dispositivo')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setRevocandoId(null)
    }
  }

  const handleRevocarTodos = async () => {
    setShowConfirmDialog(false)
    setRevocandoTodos(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.AUTH.DISPOSITIVOS, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Todos los dispositivos de confianza han sido revocados')
        setDispositivos([])
      } else {
        toast.error(data.message || 'Error al revocar dispositivos')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setRevocandoTodos(false)
    }
  }

  return (
    <Card className="border-[#E0E0E0] shadow-sm mt-6">
      <CardHeader className="pb-4 border-b border-[#F0F0F0]">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-[#002868] flex items-center gap-2 text-lg">
            <Monitor className="w-5 h-5" />
            Dispositivos de confianza
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDispositivos}
              disabled={isLoading}
              className="border-[#E0E0E0] text-[#666666] hover:text-[#002868] cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            {dispositivos.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={revocandoTodos}
                onClick={() => setShowConfirmDialog(true)}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
              >
                <ShieldOff className="w-4 h-4 mr-1.5" />
                Revocar todos
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-[#666666] mt-0.5">
          Dispositivos desde los que no se te pide el código 2FA en cada inicio de sesión
        </p>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-[#002868]/20 border-t-[#002868] rounded-full animate-spin" />
          </div>
        ) : dispositivos.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Monitor className="w-10 h-10 text-[#E0E0E0] mx-auto" />
            <p className="text-sm text-[#999]">No hay dispositivos de confianza registrados</p>
            <p className="text-xs text-[#BBB]">
              Marcá "Recordar este dispositivo" al verificar el código 2FA para agregar uno
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {dispositivos.map(d => (
              <li
                key={d.id}
                className="flex items-start justify-between gap-3 p-4 rounded-lg border border-[#F0F0F0] bg-white hover:border-[#002868]/20 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#002868]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Monitor className="w-4 h-4 text-[#002868]" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-[#1A1A1A] text-sm truncate">{parseUserAgent(d.user_agent)}</p>
                    <p className="text-xs text-[#888] truncate" title={d.user_agent ?? undefined}>
                      {d.user_agent ?? 'User-agent desconocido'}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#999]">
                      {d.ip_address && (
                        <span>
                          IP: <span className="text-[#666]">{d.ip_address}</span>
                        </span>
                      )}
                      <span>
                        Agregado: <span className="text-[#666]">{formatDate(d.created_at)}</span>
                      </span>
                      {d.last_used_at && (
                        <span>
                          Último uso: <span className="text-[#666]">{formatDate(d.last_used_at)}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expira: <span className="text-[#666]">{formatDate(d.expires_at)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevocar(d.id)}
                  disabled={revocandoId === d.id}
                  className="flex-shrink-0 text-[#999] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  title="Revocar dispositivo"
                >
                  {revocandoId === d.id ? (
                    <div className="w-4 h-4 border-2 border-[#999]/30 border-t-[#999] rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#002868]">¿Revocar todos los dispositivos?</DialogTitle>
            <DialogDescription>
              Se eliminarán todos los dispositivos de confianza. En el próximo inicio de sesión se te pedirá el código
              2FA desde cada uno de ellos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="cursor-pointer">
              Cancelar
            </Button>
            <Button onClick={handleRevocarTodos} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
              Revocar todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
