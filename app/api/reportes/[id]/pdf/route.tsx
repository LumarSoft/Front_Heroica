import { NextRequest } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { ReporteMensualPDF } from '@/lib/pdf/ReporteMensualPDF'
import { API_URL } from '@/lib/config'
import type { ReportData } from '@/components/reportes/types'
import type { Sucursal } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface AnualResponse {
  mensual: Array<{ mes: string; ingresos: number; egresos: number; resultado: number }>
}

const PERIOD_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const calcDelta = (curr: number, prev: number): number | null => {
  if (!isFinite(curr) || !isFinite(prev) || prev === 0) return null
  return ((curr - prev) / prev) * 100
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = req.headers.get('authorization')
  if (!auth) {
    return new Response(JSON.stringify({ message: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { searchParams } = new URL(req.url)
  const monedaRaw = searchParams.get('moneda')
  const moneda: 'ARS' | 'USD' = monedaRaw === 'USD' ? 'USD' : 'ARS'
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!startDate || !endDate) {
    return new Response(JSON.stringify({ message: 'Faltan parámetros startDate/endDate' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const safeId = encodeURIComponent(String(id))

  const headers = { Authorization: auth }

  let sucursal: Sucursal
  let report: ReportData
  let monthly: AnualResponse['mensual'] = []

  try {
    const [sucursalRes, reportRes, anualRes] = await Promise.all([
      fetch(`${API_URL}/api/sucursales/${safeId}`, { headers, cache: 'no-store' }),
      fetch(
        `${API_URL}/api/reportes/${safeId}?startDate=${startDate}T00:00:00&endDate=${endDate}T23:59:59&moneda=${moneda}`,
        { headers, cache: 'no-store' },
      ),
      fetch(`${API_URL}/api/reportes/${safeId}/anual?moneda=${moneda}`, { headers, cache: 'no-store' }),
    ])

    if (!sucursalRes.ok) {
      const body = await sucursalRes.text()
      return new Response(
        JSON.stringify({ message: 'No se pudo cargar la sucursal', detail: body }),
        { status: sucursalRes.status, headers: { 'Content-Type': 'application/json' } },
      )
    }
    if (!reportRes.ok) {
      const body = await reportRes.text()
      return new Response(
        JSON.stringify({ message: 'No se pudieron cargar los reportes', detail: body }),
        { status: reportRes.status, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const sucursalJson = (await sucursalRes.json()) as { data: Sucursal }
    sucursal = sucursalJson.data

    const reportJson = (await reportRes.json()) as { data: ReportData }
    report = reportJson.data

    if (anualRes.ok) {
      const anualJson = (await anualRes.json()) as { data: AnualResponse }
      const today = new Date()
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
      monthly = anualJson.data.mensual.filter(d => d.mes <= currentMonth)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return new Response(JSON.stringify({ message: 'Error llamando al backend', detail: message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Derive presentation data ──────────────────────────────────────────────
  const [yearStr, monthStr] = startDate.split('-')
  const periodoLabel = `${PERIOD_NAMES[Number(monthStr) - 1]} ${yearStr}`
  const today = new Date()
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const reportMonth = `${yearStr}-${monthStr}`
  const isClosedMonth = reportMonth < currentMonthStr

  // Compute deltas vs previous month
  let deltas: { ingresos: number | null; egresos: number | null; resultado: number | null } | null = null
  const currentEntry = monthly.find(m => m.mes === reportMonth)
  if (currentEntry) {
    const [y, m] = reportMonth.split('-').map(Number)
    const prevDate = new Date(y, m - 2, 1)
    const prevMes = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    const prevEntry = monthly.find(d => d.mes === prevMes)
    if (prevEntry) {
      deltas = {
        ingresos: calcDelta(currentEntry.ingresos, prevEntry.ingresos),
        egresos: calcDelta(currentEntry.egresos, prevEntry.egresos),
        resultado: calcDelta(currentEntry.resultado, prevEntry.resultado),
      }
    }
  }

  // ── Render PDF ────────────────────────────────────────────────────────────
  try {
    const stream = await renderToStream(
      <ReporteMensualPDF
        sucursal={sucursal}
        moneda={moneda}
        periodoLabel={periodoLabel}
        isClosedMonth={isClosedMonth}
        startDate={startDate}
        endDate={endDate}
        generatedAt={new Date()}
        report={report}
        monthly={monthly}
        deltas={deltas}
      />,
    )

    const safeNombre = sucursal.nombre.replace(/[^a-zA-Z0-9-_]/g, '_')
    const filename = `Reporte_${safeNombre}_${reportMonth}_${moneda}.pdf`

    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)))
        stream.on('end', () => controller.close())
        stream.on('error', err => controller.error(err))
      },
    })

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error generando PDF'
    return new Response(JSON.stringify({ message: 'Error generando PDF', detail: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
