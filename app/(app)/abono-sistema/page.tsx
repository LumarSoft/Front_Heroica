'use client'

import { useState } from 'react'
import { ReceiptText, Upload } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAbonoSistema } from '@/hooks/use-abono-sistema'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { etiquetaMesAbono } from '@/lib/abono'
import { Button } from '@/components/ui/button'
import { AccessDenied } from '@/components/ui/access-denied'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { ErrorBanner } from '@/components/ui/error-banner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AbonoTotales } from '@/components/abono/AbonoTotales'
import { AbonoMesCard } from '@/components/abono/AbonoMesCard'
import { AbonoHistorial } from '@/components/abono/AbonoHistorial'
import { SubirFacturaDialog } from '@/components/abono/SubirFacturaDialog'
import type { FacturaAbono } from '@/lib/types'

/** Abono del sistema: solo superadmins */
export default function AbonoSistemaPage() {
  const isSuperAdmin = useAuthStore(state => state.isSuperAdmin())
  if (!isSuperAdmin) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        <AccessDenied resource="el abono del sistema" backUrl="/home" />
      </div>
    )
  }
  return <AbonoSistema />
}

/** Facturas de Lumarsoft por mes, con lo abonado, lo adeudado y el historial de cambios */
function AbonoSistema() {
  useDocumentTitle('Abono del sistema')
  const abono = useAbonoSistema()
  const [subirAbierto, setSubirAbierto] = useState(false)
  const [aEliminar, setAEliminar] = useState<FacturaAbono | null>(null)

  const confirmarEliminar = () => {
    if (!aEliminar) return
    const f = aEliminar
    setAEliminar(null)
    void abono.eliminar(f)
  }

  let contenido: React.ReactNode
  if (abono.isLoading && abono.meses.length === 0) {
    contenido = (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  } else if (abono.meses.length === 0) {
    contenido = abono.error ? null : (
      <p className="rounded-2xl border border-dashed border-[#E0E0E0] bg-[#FAFBFC] p-8 text-center text-sm text-[#5A6070]">
        Todavía no hay facturas. Subí la primera con &quot;Subir factura&quot;.
      </p>
    )
  } else {
    contenido = abono.meses.map(m => (
      <AbonoMesCard
        key={m.clave}
        mes={m}
        enCurso={abono.enCurso}
        onCambiarEstado={(clave, ids, abonada) => void abono.cambiarEstado(clave, ids, abonada)}
        onEliminar={setAEliminar}
        onAbrir={f => void abono.abrir(f)}
      />
    ))
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-3xl font-bold text-[#002868] flex items-center gap-3">
            <ReceiptText className="h-7 w-7" />
            Abono del sistema
          </h1>
          <p className="text-sm text-[#666666]">
            Facturas mensuales del sistema. Cada subida, pago y eliminación queda en el historial.
          </p>
        </div>
        <Button className="bg-[#002868] text-white hover:bg-[#003d8f]" onClick={() => setSubirAbierto(true)}>
          <Upload className="h-4 w-4" />
          Subir factura
        </Button>
      </div>

      {abono.error && <ErrorBanner error={abono.error} />}

      <AbonoTotales totales={abono.totales} />

      <div className="space-y-4">{contenido}</div>

      <AbonoHistorial items={abono.historial} />

      <SubirFacturaDialog
        open={subirAbierto}
        onOpenChange={setSubirAbierto}
        isSubiendo={abono.enCurso === 'subir'}
        onSubir={abono.subir}
      />

      <DeleteDialog
        open={aEliminar !== null}
        nombre={
          aEliminar
            ? `${aEliminar.numero ? `Factura ${aEliminar.numero}` : 'Factura'} de ${etiquetaMesAbono(aEliminar.mes, aEliminar.anio)}`
            : ''
        }
        onConfirm={confirmarEliminar}
        onCancel={() => setAEliminar(null)}
      />
    </div>
  )
}
