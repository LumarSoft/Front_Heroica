'use client'

import { useCallback, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorBanner } from '@/components/ui/error-banner'
import { ContentLoadingSpinner, PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { CorteBalanceHeader } from '@/components/reportes/corte-balance/CorteBalanceHeader'
import { CorteBalanceResumen } from '@/components/reportes/corte-balance/CorteBalanceResumen'
import { EgresosTab } from '@/components/reportes/corte-balance/EgresosTab'
import { AnexoManualEditor } from '@/components/reportes/corte-balance/AnexoManualEditor'
import { BalanceTab } from '@/components/reportes/corte-balance/BalanceTab'
import { OpcionesTab } from '@/components/reportes/corte-balance/OpcionesTab'
import { PlantillaTab } from '@/components/reportes/corte-balance/PlantillaTab'
import { useCorteBalanceDatos } from '@/hooks/use-corte-balance-datos'
import { useCorteBalanceBorrador } from '@/hooks/use-corte-balance-borrador'
import { useCorteBalanceExport } from '@/hooks/use-corte-balance-export'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useAuthStore } from '@/store/authStore'
import { ingresosDelBalance } from '@/lib/corte-balance/valores'
import type { AnexoManual, ClaveAnexoManual } from '@/lib/types'

/** Por defecto se arma el corte del mes anterior (el último cerrado). */
function mesInicial(param: string | null): string {
  if (param && /^\d{4}-(0[1-9]|1[0-2])$/.test(param)) return param
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const AYUDAS: Record<ClaveAnexoManual, string> = {
  ingresos:
    'Los ingresos se cargan a mano con los datos de Hiopos (los del sistema no coinciden). Lo que quede vacío sale en blanco para completarlo después en Canva/PowerPoint.',
  rrhh: 'Datos de Recursos Humanos cargados a mano. Las filas con el ícono de vínculo se completan solas con las líneas de Sueldos de los egresos si las dejás vacías.',
  conclusion: 'Texto de cierre del informe: análisis del período y acciones propuestas.',
}

export default function CorteBalancePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const sucursalId = Number(params.id)
  const moneda = searchParams.get('moneda') === 'USD' ? 'USD' : 'ARS'
  const [mesInput, setMesInput] = useState(() => mesInicial(searchParams.get('mes')))
  const mes = useDebouncedValue(mesInput)
  const puedeEditarPlantilla = useAuthStore(s => s.canEditarPlantillaReportes)()

  const datos = useCorteBalanceDatos(sucursalId, mes, moneda)
  const sucursalNombre = datos.sucursal?.nombre ?? null
  const borradorApi = useCorteBalanceBorrador(sucursalId, mes, moneda, sucursalNombre)
  const { borrador, setAnexo } = borradorApi
  const exp = useCorteBalanceExport(datos.datos, datos.plantilla, borrador, sucursalNombre ?? '')

  useDocumentTitle(sucursalNombre ? `${sucursalNombre} · Corte de balance` : '')

  const onAnexoChange = useCallback((clave: ClaveAnexoManual) => (a: AnexoManual) => setAnexo(clave, a), [setAnexo])
  const ventasTotales = useMemo(
    () =>
      borrador
        ? ingresosDelBalance({ ...borrador, balance: { ...borrador.balance, ingresos: '' } }, exp.importes)
        : null,
    [borrador, exp.importes],
  )

  if (!datos.sucursal && !datos.error) return <PageLoadingSpinner />

  const listo = datos.datos && datos.plantilla && borrador && exp.resultado && exp.balance
  const anexoTab = (clave: ClaveAnexoManual) =>
    borrador && (
      <AnexoManualEditor
        anexo={borrador.anexos[clave]}
        ayuda={AYUDAS[clave]}
        importes={exp.importes}
        moneda={moneda}
        onChange={onAnexoChange(clave)}
      />
    )

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED] pb-10">
      <CorteBalanceHeader
        sucursalNombre={sucursalNombre ?? ''}
        moneda={moneda}
        mes={mesInput}
        exportando={exp.exportando}
        puedeExportar={Boolean(listo)}
        onMesChange={setMesInput}
        onBack={() => router.push(`/sucursales/${sucursalId}/reportes?moneda=${moneda}`)}
        onExportar={exp.exportar}
        onDescartarBorrador={borradorApi.descartarBorrador}
      />

      <main className="container mx-auto space-y-6 px-4 py-6 sm:px-6">
        {datos.error && <ErrorBanner error={datos.error} />}
        {datos.isLoading && !listo && <ContentLoadingSpinner />}

        {listo && datos.datos && datos.plantilla && borrador && exp.resultado && exp.balance && (
          <>
            <CorteBalanceResumen resultado={exp.resultado} balance={exp.balance} moneda={moneda} />

            <Tabs defaultValue="egresos" className="gap-4">
              <TabsList className="h-auto w-full flex-wrap justify-start bg-white p-1 shadow-sm">
                <TabsTrigger value="egresos" className="flex-none">
                  Egresos
                </TabsTrigger>
                <TabsTrigger value="ingresos" className="flex-none">
                  Ingresos
                </TabsTrigger>
                <TabsTrigger value="rrhh" className="flex-none">
                  Recursos Humanos
                </TabsTrigger>
                <TabsTrigger value="balance" className="flex-none">
                  Balance
                </TabsTrigger>
                <TabsTrigger value="conclusion" className="flex-none">
                  Conclusión
                </TabsTrigger>
                <TabsTrigger value="opciones" className="flex-none">
                  Diseño y opciones
                </TabsTrigger>
                <TabsTrigger value="plantilla" className="flex-none">
                  Plantilla{datos.plantillaModificada ? ' •' : ''}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="egresos">
                <EgresosTab
                  resultado={exp.resultado}
                  plantilla={datos.plantilla}
                  borrador={borrador}
                  moneda={moneda}
                  onPlantillaChange={datos.setPlantilla}
                  onAjusteChange={borradorApi.setAjuste}
                  onDetalleChange={borradorApi.setDetalle}
                />
              </TabsContent>
              <TabsContent value="ingresos">{anexoTab('ingresos')}</TabsContent>
              <TabsContent value="rrhh">{anexoTab('rrhh')}</TabsContent>
              <TabsContent value="balance">
                <BalanceTab
                  balance={exp.balance}
                  borrador={borrador}
                  secciones={exp.secciones}
                  ventasTotales={ventasTotales}
                  operatividadPorDefecto={datos.plantilla.operatividadPct}
                  moneda={moneda}
                  onBalanceChange={borradorApi.setBalance}
                />
              </TabsContent>
              <TabsContent value="conclusion">{anexoTab('conclusion')}</TabsContent>
              <TabsContent value="opciones">
                <OpcionesTab opciones={borrador.opciones} onChange={borradorApi.setOpciones} />
              </TabsContent>
              <TabsContent value="plantilla">
                <PlantillaTab
                  plantilla={datos.plantilla}
                  catalogo={datos.datos.catalogo}
                  esPorDefecto={datos.datos.plantillaEsPorDefecto}
                  actualizadaEn={datos.datos.plantillaActualizadaEn}
                  modificada={datos.plantillaModificada}
                  puedeGuardar={puedeEditarPlantilla}
                  isSaving={datos.isSaving}
                  onChange={datos.setPlantilla}
                  onGuardar={datos.guardarPlantilla}
                  onDescartar={datos.descartarCambiosPlantilla}
                  onRestablecer={datos.restablecerPlantilla}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  )
}
