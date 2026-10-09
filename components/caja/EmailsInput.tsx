'use client'

import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Separa por coma, punto y coma o espacio y clasifica los emails escritos. */
export function parsearEmails(texto: string): { validos: string[]; invalidos: string[] } {
  const candidatos = texto
    .split(/[,;\s]+/)
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
  return {
    validos: candidatos.filter(email => EMAIL_REGEX.test(email)),
    invalidos: candidatos.filter(email => !EMAIL_REGEX.test(email)),
  }
}

interface EmailsInputProps {
  id: string
  emails: string[]
  onEmailsChange: (emails: string[]) => void
  /** Texto todavía no convertido en chip (se valida al enviar). */
  pendiente: string
  onPendienteChange: (texto: string) => void
}

/** Input de varios emails: cada uno queda como chip al presionar Enter, coma, Tab o al salir del campo. */
export function EmailsInput({ id, emails, onEmailsChange, pendiente, onPendienteChange }: EmailsInputProps) {
  const agregar = (texto: string) => {
    const { validos, invalidos } = parsearEmails(texto)
    if (validos.length) onEmailsChange([...new Set([...emails, ...validos])])
    onPendienteChange(invalidos.join(', '))
    if (invalidos.length) toast.error(`Email inválido: ${invalidos.join(', ')}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#002868]">
      {emails.map(email => (
        <span
          key={email}
          className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] text-[#002868] text-xs font-medium pl-2.5 pr-1 py-1"
        >
          {email}
          <button
            type="button"
            onClick={() => onEmailsChange(emails.filter(item => item !== email))}
            className="rounded-full p-0.5 hover:bg-[#002868]/10 cursor-pointer"
            aria-label={`Quitar ${email}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <Input
        id={id}
        type="text"
        inputMode="email"
        value={pendiente}
        onChange={event => onPendienteChange(event.target.value)}
        onKeyDown={event => {
          if (['Enter', ',', ';', 'Tab'].includes(event.key) && pendiente.trim()) {
            event.preventDefault()
            agregar(pendiente)
          } else if (event.key === 'Backspace' && !pendiente && emails.length) {
            onEmailsChange(emails.slice(0, -1))
          }
        }}
        onBlur={() => pendiente.trim() && agregar(pendiente)}
        onPaste={event => {
          event.preventDefault()
          agregar(`${pendiente} ${event.clipboardData.getData('text')}`)
        }}
        placeholder={emails.length ? 'Agregar otro email…' : 'destinatario@empresa.com'}
        className="flex-1 min-w-[180px] border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-7 px-1"
      />
    </div>
  )
}
