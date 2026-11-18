'use client'

import { useState } from 'react'
import { Check, ChevronDown, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cuitToDigits, formatCuit } from '@/lib/validators'
import type { Proveedor } from '@/lib/types'

interface CampoProps {
  etiqueta: string
  valor: string
  /** Lo que se copia, si difiere de lo que se muestra (ej: el CUIT sin guiones) */
  aCopiar?: string
}

function CampoCopiable({ etiqueta, valor, aCopiar }: CampoProps) {
  const [copiado, setCopiado] = useState(false)
  const copiar = () => {
    void navigator.clipboard.writeText(aCopiar ?? valor).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    })
  }
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8F9C]">{etiqueta}</p>
        <p className="text-sm text-[#1A1A1A] break-all">{valor}</p>
      </div>
      <button
        type="button"
        onClick={copiar}
        className="flex-shrink-0 rounded-md p-1.5 text-[#8A8F9C] hover:bg-[#EEF2FF] hover:text-[#002868] transition-colors"
        title={`Copiar ${etiqueta.toLowerCase()}`}
        aria-label={`Copiar ${etiqueta.toLowerCase()}`}
      >
        {copiado ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

interface Props {
  proveedor: Proveedor
  abierto: boolean
  onToggle: () => void
}

/** Un proveedor del buscador flotante: el nombre y, al abrirlo, sus datos con botón de copiar */
export function ProveedorFicha({ proveedor, abierto, onToggle }: Props) {
  const cuit = cuitToDigits(proveedor.cuit ?? '')
  const campos: CampoProps[] = [
    { etiqueta: 'CBU / Alias', valor: proveedor.cbu_alias ?? '' },
    { etiqueta: 'CUIT', valor: cuit ? formatCuit(cuit) : '', aCopiar: cuit },
    { etiqueta: 'Razón social', valor: proveedor.razon_social ?? '' },
    { etiqueta: 'Teléfono', valor: proveedor.telefono ?? '' },
    { etiqueta: 'Email', valor: proveedor.email ?? '' },
    { etiqueta: 'Dirección', valor: proveedor.direccion ?? '' },
  ].filter(c => c.valor.trim() !== '')

  return (
    <div className={cn('rounded-lg border', abierto ? 'border-[#002868]/30 bg-white' : 'border-transparent')}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left hover:bg-[#F4F7FF]"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#002868]">{proveedor.nombre}</p>
          {!abierto && proveedor.razon_social && (
            <p className="truncate text-xs text-[#8A8F9C]">{proveedor.razon_social}</p>
          )}
        </div>
        <ChevronDown
          className={cn('h-4 w-4 flex-shrink-0 text-[#8A8F9C] transition-transform', abierto && 'rotate-180')}
        />
      </button>
      {abierto && (
        <div className="divide-y divide-[#F0F0F0] px-3 pb-2">
          {campos.length > 0 ? (
            campos.map(c => <CampoCopiable key={c.etiqueta} {...c} />)
          ) : (
            <p className="py-1 text-xs text-[#8A8F9C]">Sin datos cargados. Se completan en Configuración.</p>
          )}
        </div>
      )}
    </div>
  )
}
