'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const DEFAULT_FORM: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export function CambiarPasswordSection() {
  const currentUser = useAuthStore(state => state.user)
  const [form, setForm] = useState<PasswordForm>(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async () => {
    setError('')

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError('Todos los campos son requeridos')
      return
    }

    if (form.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (form.currentPassword === form.newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual')
      return
    }

    setIsSaving(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Contraseña actualizada exitosamente')
        setForm(DEFAULT_FORM)
      } else {
        setError(data.message || 'Error al cambiar la contraseña')
      }
    } catch {
      setError('Error de conexión. Intente nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const strength = (() => {
    const p = form.newPassword
    if (!p) return 0
    let s = 0
    if (p.length >= 6) s++
    if (p.length >= 10) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  const strengthLabel = ['', 'Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'][strength]
  const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-500'][strength]

  return (
    <div className="space-y-6 max-w-lg">
      {/* Tarjeta de info del usuario */}
      <Card className="border-[#E0E0E0] shadow-sm bg-gradient-to-br from-[#002868]/5 to-transparent">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#002868]/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#002868]" />
            </div>
            <div>
              <p className="font-semibold text-[#1A1A1A]">{currentUser?.nombre}</p>
              <p className="text-sm text-[#666666]">{currentUser?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario */}
      <Card className="border-[#E0E0E0] shadow-sm">
        <CardHeader className="pb-4 border-b border-[#F0F0F0]">
          <CardTitle className="text-[#002868] flex items-center gap-2 text-lg">
            <KeyRound className="w-5 h-5" />
            Cambiar Contraseña
          </CardTitle>
          <p className="text-sm text-[#666666] mt-0.5">Actualizá tu contraseña de acceso al sistema</p>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {/* Contraseña actual */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">Contraseña actual *</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="Tu contraseña actual"
                className="h-10 border-[#E0E0E0] text-[#1A1A1A] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#555] transition-colors"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">Nueva contraseña *</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="h-10 border-[#E0E0E0] text-[#1A1A1A] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#555] transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Barra de fuerza de contraseña */}
            {form.newPassword && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength ? strengthColor : 'bg-[#E0E0E0]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#888]">
                  Fortaleza: <span className="font-medium text-[#555]">{strengthLabel}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">
              Confirmar nueva contraseña *
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Repetí la nueva contraseña"
                className={`h-10 border-[#E0E0E0] text-[#1A1A1A] pr-10 ${
                  form.confirmPassword && form.newPassword !== form.confirmPassword
                    ? 'border-red-300 focus-visible:ring-red-200'
                    : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#555] transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          {/* Error general */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Botón */}
          <div className="pt-2">
            <Button
              id="btn-cambiar-password"
              onClick={handleSubmit}
              disabled={isSaving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
              className="w-full bg-[#002868] hover:bg-[#003d8f] text-white h-10 font-semibold transition-all"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Actualizando...
                </span>
              ) : (
                'Actualizar Contraseña'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-[#999] text-center px-4">
        Por seguridad, cerrá sesión en otros dispositivos después de cambiar tu contraseña.
      </p>
    </div>
  )
}
