'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { API_ENDPOINTS } from '@/lib/config';
import { Shield, Copy, Check } from 'lucide-react';
import Image from 'next/image';

interface Setup2FADialogProps {
  open: boolean;
  userId: number;
  onSuccess: (tempToken: string) => void;
  onClose: () => void;
}

export function Setup2FADialog({
  open,
  userId,
  onSuccess,
  onClose,
}: Setup2FADialogProps) {
  const [step, setStep] = useState<'loading' | 'setup' | 'verify'>('loading');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && step === 'loading') {
      initiate2FA();
    }
  }, [open, step]);

  const initiate2FA = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.AUTH.ENABLE_2FA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al generar código QR');
      }

      setQrCode(data.data.qrCode);
      setSecret(data.data.secret);
      setStep('setup');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al configurar 2FA';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.CONFIRM_2FA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Código inválido');
      }

      onSuccess(data.tempToken);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al verificar código';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#002868] flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Configuración de Doble Factor (2FA)
          </DialogTitle>
          <DialogDescription className="text-[#666666]">
            Por seguridad, debes configurar la autenticación de doble factor
          </DialogDescription>
        </DialogHeader>

        {step === 'loading' && (
          <div className="py-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
            <p className="text-sm text-[#666666]">Generando código QR...</p>
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                Paso 1: Escanea el código QR
              </p>
              <p className="text-xs text-blue-700">
                Usa Google Authenticator, Microsoft Authenticator, Authy o
                cualquier app compatible con TOTP
              </p>
            </div>

            <div className="flex justify-center bg-white p-4 rounded-lg border-2 border-[#E0E0E0]">
              {qrCode && (
                <Image
                  src={qrCode}
                  alt="QR Code 2FA"
                  width={200}
                  height={200}
                  className="rounded"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#002868]">
                O ingresa esta clave manualmente:
              </Label>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copySecret}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              onClick={() => setStep('verify')}
              className="w-full bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
            >
              Continuar a Verificación
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-6 py-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900 font-medium mb-2">
                Paso 2: Verifica el código
              </p>
              <p className="text-xs text-green-700">
                Ingresa el código de 6 dígitos que aparece en tu aplicación
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code" className="text-[#002868] font-semibold">
                Código de Verificación
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(
                    e.target.value.replace(/\D/g, '').slice(0, 6),
                  )
                }
                required
                maxLength={6}
                className="h-12 text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('setup')}
                disabled={isLoading}
                className="flex-1"
              >
                Volver
              </Button>
              <Button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verificando...</span>
                  </div>
                ) : (
                  'Activar 2FA'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
