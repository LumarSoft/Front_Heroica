import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import {
  pdfStyles,
  PdfHeader,
  PdfFooter,
  Section,
  SummaryCard,
  Table,
  type ColumnDef,
  Pill,
  Cell,
  Muted,
} from './primitives'
import { MonthlyBarChart, ProportionBar, type MonthlySeriesPoint } from './charts'
import { pdfColors, pdfFonts, pdfSize, accentPalette } from './theme'
import { formatMonto } from '../formatters'
import type {
  ReportData,
  ReportBreakdownItem,
  ReportDeuda,
  ReportMovimiento,
} from '@/components/reportes/types'
import type { Sucursal } from '@/lib/types'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReporteMensualPDFProps {
  sucursal: Sucursal
  moneda: 'ARS' | 'USD'
  periodoLabel: string // e.g. "Abril 2026"
  isClosedMonth: boolean
  startDate: string
  endDate: string
  generatedAt: Date
  report: ReportData
  monthly: Array<{ mes: string; ingresos: number; egresos: number; resultado: number }>
  deltas: { ingresos: number | null; egresos: number | null; resultado: number | null } | null
}

// ── Styles specific to the document ──────────────────────────────────────────

const coverStyles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    fontFamily: pdfFonts.sans,
    fontSize: pdfSize.base,
    color: pdfColors.body,
    backgroundColor: pdfColors.surface,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: pdfColors.brand,
  },
  accentBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 22,
    backgroundColor: pdfColors.brandDark,
  },
  crestRow: {
    position: 'absolute',
    top: 32,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crestBrand: {
    color: pdfColors.surface,
    fontFamily: pdfFonts.sansBold,
    fontSize: pdfSize.xl,
    letterSpacing: 4,
  },
  crestMeta: {
    color: pdfColors.surface,
    fontSize: pdfSize.sm,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  body: {
    marginTop: 180,
    paddingHorizontal: 48,
    flexDirection: 'column',
    gap: 14,
  },
  eyebrow: {
    fontSize: pdfSize.sm,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: pdfColors.muted,
    fontFamily: pdfFonts.sansBold,
  },
  title: {
    fontSize: 42,
    fontFamily: pdfFonts.serifBold,
    color: pdfColors.ink,
    letterSpacing: 0.5,
    marginTop: 6,
  },
  subtitle: {
    fontSize: pdfSize.lg,
    color: pdfColors.brand,
    fontFamily: pdfFonts.sansBold,
    marginTop: 4,
  },
  infoGrid: {
    marginTop: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoBlock: {
    minWidth: 160,
    borderLeftWidth: 2,
    borderLeftColor: pdfColors.brand,
    paddingLeft: 10,
    marginRight: 16,
  },
  infoLabel: {
    fontSize: pdfSize.xs,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: pdfFonts.sansBold,
    color: pdfColors.muted,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: pdfSize.md,
    color: pdfColors.ink,
    fontFamily: pdfFonts.sansBold,
  },
  footNote: {
    position: 'absolute',
    bottom: 44,
    left: 48,
    right: 48,
    fontSize: pdfSize.xs,
    color: pdfColors.muted,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  summaryHero: {
    marginTop: 28,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: pdfColors.border,
    flexDirection: 'row',
    paddingVertical: 14,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRightWidth: 0.5,
    borderRightColor: pdfColors.border,
  },
  summaryColLast: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  summaryLabel: {
    fontSize: pdfSize.xs,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: pdfColors.muted,
    fontFamily: pdfFonts.sansBold,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: pdfSize.xl,
    fontFamily: pdfFonts.sansBold,
  },
  summarySub: {
    fontSize: pdfSize.xs,
    color: pdfColors.muted,
    marginTop: 2,
  },
})

// ── Helpers ──────────────────────────────────────────────────────────────────

const monthLabel = (mes: string): string => {
  const [y, m] = mes.split('-')
  const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${names[Number(m) - 1]} ${y.slice(-2)}`
}

const formatDate = (iso: string): string => {
  const date = iso.includes('T') ? iso.split('T')[0] : iso
  const [y, m, d] = date.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

const resultadoLabel = (resultado: number): string =>
  resultado > 0 ? 'Ganancia' : resultado < 0 ? 'Pérdida' : 'Equilibrio'

const resultadoColor = (resultado: number): string =>
  resultado > 0 ? pdfColors.positive : resultado < 0 ? pdfColors.negative : pdfColors.muted

const deltaText = (delta: number | null, inverted = false): { text: string; color: string } | null => {
  if (delta == null || !isFinite(delta)) return null
  const sign = delta > 0 ? '+' : ''
  const positive = inverted ? delta <= 0 : delta >= 0
  return {
    text: `${sign}${delta.toFixed(1)}% vs mes ant.`,
    color: positive ? pdfColors.positive : pdfColors.negative,
  }
}

// ── Cover page ───────────────────────────────────────────────────────────────

interface CoverProps {
  sucursal: Sucursal
  moneda: string
  periodoLabel: string
  isClosedMonth: boolean
  startDate: string
  endDate: string
  generatedAt: Date
  resumen: ReportData['resumen']
}

function CoverPage({ sucursal, moneda, periodoLabel, isClosedMonth, startDate, endDate, generatedAt, resumen }: CoverProps) {
  return (
    <Page size="A4" style={coverStyles.page}>
      <View style={coverStyles.accent} />
      <View style={coverStyles.crestRow}>
        <Text style={coverStyles.crestBrand}>HEROICA</Text>
        <Text style={coverStyles.crestMeta}>Reporte Ejecutivo</Text>
      </View>

      <View style={coverStyles.body}>
        <Text style={coverStyles.eyebrow}>Período fiscal</Text>
        <Text style={coverStyles.title}>{periodoLabel}</Text>
        <Text style={coverStyles.subtitle}>{sucursal.nombre}</Text>

        <View style={{ flexDirection: 'row', marginTop: 6, gap: 8 }}>
          <Pill accent={isClosedMonth ? 'blue' : 'emerald'}>
            {isClosedMonth ? 'Período Cerrado' : 'Mes en Curso'}
          </Pill>
          <Pill accent="indigo">Moneda {moneda}</Pill>
        </View>

        <View style={coverStyles.infoGrid}>
          <View style={coverStyles.infoBlock}>
            <Text style={coverStyles.infoLabel}>Razón social</Text>
            <Text style={coverStyles.infoValue}>{sucursal.razon_social || '—'}</Text>
          </View>
          {sucursal.cuit && (
            <View style={coverStyles.infoBlock}>
              <Text style={coverStyles.infoLabel}>CUIT</Text>
              <Text style={coverStyles.infoValue}>{sucursal.cuit}</Text>
            </View>
          )}
          <View style={coverStyles.infoBlock}>
            <Text style={coverStyles.infoLabel}>Desde</Text>
            <Text style={coverStyles.infoValue}>{formatDate(startDate)}</Text>
          </View>
          <View style={coverStyles.infoBlock}>
            <Text style={coverStyles.infoLabel}>Hasta</Text>
            <Text style={coverStyles.infoValue}>{formatDate(endDate)}</Text>
          </View>
          <View style={coverStyles.infoBlock}>
            <Text style={coverStyles.infoLabel}>Emitido</Text>
            <Text style={coverStyles.infoValue}>
              {generatedAt.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>

        <View style={coverStyles.summaryHero}>
          <View style={coverStyles.summaryCol}>
            <Text style={coverStyles.summaryLabel}>Ingresos</Text>
            <Text style={[coverStyles.summaryValue, { color: pdfColors.positive }]}>
              {formatMonto(resumen.ingresos, moneda as 'ARS' | 'USD')}
            </Text>
          </View>
          <View style={coverStyles.summaryCol}>
            <Text style={coverStyles.summaryLabel}>Egresos</Text>
            <Text style={[coverStyles.summaryValue, { color: pdfColors.negative }]}>
              {formatMonto(resumen.egresos, moneda as 'ARS' | 'USD')}
            </Text>
          </View>
          <View style={coverStyles.summaryColLast}>
            <Text style={coverStyles.summaryLabel}>Resultado neto</Text>
            <Text style={[coverStyles.summaryValue, { color: resultadoColor(resumen.resultado) }]}>
              {formatMonto(resumen.resultado, moneda as 'ARS' | 'USD')}
            </Text>
            <Text style={coverStyles.summarySub}>{resultadoLabel(resumen.resultado)}</Text>
          </View>
        </View>
      </View>

      <Text style={coverStyles.footNote}>
        Documento confidencial — uso interno de Heroica. Generado automáticamente desde el sistema de gestión.
      </Text>
      <View style={coverStyles.accentBottom} />
    </Page>
  )
}

// ── Executive summary block on the first content page ────────────────────────

interface ExecSummaryProps {
  report: ReportData
  moneda: 'ARS' | 'USD'
  deltas: ReporteMensualPDFProps['deltas']
}

function ExecutiveSummary({ report, moneda, deltas }: ExecSummaryProps) {
  const resumen = report.resumen
  const cards: { label: string; value: string; accent: keyof typeof accentPalette; sub?: string; delta?: number | null; invertDelta?: boolean }[] = [
    {
      label: 'Ingresos Totales',
      value: formatMonto(resumen.ingresos, moneda),
      accent: 'emerald',
      delta: deltas?.ingresos ?? null,
    },
    {
      label: 'Egresos Totales',
      value: formatMonto(resumen.egresos, moneda),
      accent: 'rose',
      delta: deltas?.egresos ?? null,
      invertDelta: true,
    },
    {
      label: 'Resultado Neto',
      value: formatMonto(resumen.resultado, moneda),
      accent: resumen.resultado >= 0 ? 'blue' : 'red',
      sub: resultadoLabel(resumen.resultado),
      delta: deltas?.resultado ?? null,
    },
    {
      label: 'Deudas (A pagar)',
      value: formatMonto(resumen.deudas || 0, moneda),
      accent: 'orange',
      sub: 'Histórico total',
    },
    {
      label: 'Créditos (A cobrar)',
      value: formatMonto(resumen.creditos || 0, moneda),
      accent: 'indigo',
      sub: 'A favor nuestro',
    },
  ]

  return (
    <Section number="1" title="Resumen General del Período">
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {cards.map(card => (
          <SummaryCard
            key={card.label}
            label={card.label}
            value={card.value}
            accent={card.accent}
            sub={card.sub}
            delta={card.delta ?? null}
            invertDelta={card.invertDelta}
          />
        ))}
      </View>
    </Section>
  )
}

// ── Monthly evolution (bar chart + table) ────────────────────────────────────

function MonthlyEvolution({
  data,
  moneda,
}: {
  data: ReporteMensualPDFProps['monthly']
  moneda: 'ARS' | 'USD'
}) {
  const last12 = data.slice(-12)
  const chartData: MonthlySeriesPoint[] = last12.map(d => ({
    label: monthLabel(d.mes),
    ingresos: d.ingresos,
    egresos: d.egresos,
    resultado: d.resultado,
  }))

  const columns: ColumnDef<typeof last12[number]>[] = [
    {
      key: 'mes',
      header: 'Mes',
      width: '22%',
      render: row => monthLabel(row.mes),
    },
    {
      key: 'ingresos',
      header: 'Ingresos',
      width: '26%',
      align: 'right',
      render: row => (
        <Cell align="right" color={pdfColors.positive} bold>
          {formatMonto(row.ingresos, moneda)}
        </Cell>
      ),
    },
    {
      key: 'egresos',
      header: 'Egresos',
      width: '26%',
      align: 'right',
      render: row => (
        <Cell align="right" color={pdfColors.negative} bold>
          {formatMonto(row.egresos, moneda)}
        </Cell>
      ),
    },
    {
      key: 'resultado',
      header: 'Resultado',
      width: '26%',
      align: 'right',
      render: row => (
        <Cell align="right" color={resultadoColor(row.resultado)} bold>
          {formatMonto(row.resultado, moneda)}
        </Cell>
      ),
    },
  ]

  return (
    <Section number="2" title="Evolución Mensual (Últimos 12 meses)" breakBefore>
      {chartData.length > 0 ? (
        <View style={{ marginBottom: 12 }}>
          <MonthlyBarChart data={chartData} width={510} height={150} />
        </View>
      ) : (
        <Muted>Sin datos históricos suficientes para graficar.</Muted>
      )}
      <Table columns={columns} rows={last12} emptyMessage="Sin histórico disponible" />
    </Section>
  )
}

// ── Breakdown section (categorías) ───────────────────────────────────────────

interface BreakdownSectionProps {
  number: string
  title: string
  total: number
  items: ReportBreakdownItem[]
  moneda: 'ARS' | 'USD'
  accent: 'emerald' | 'rose'
}

function BreakdownSection({ number, title, total, items, moneda, accent }: BreakdownSectionProps) {
  const palette = accentPalette[accent]
  const sorted = [...items].sort((a, b) => b.value - a.value)

  const columns: ColumnDef<ReportBreakdownItem>[] = [
    {
      key: 'name',
      header: 'Categoría',
      width: '34%',
      render: row => row.name,
    },
    {
      key: 'bar',
      header: 'Proporción',
      width: '28%',
      render: row => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <ProportionBar value={row.value} total={total} color={palette.fg} width={120} />
          <Text style={{ fontSize: pdfSize.xs, color: pdfColors.muted }}>
            {total > 0 ? `${((row.value / total) * 100).toFixed(1)}%` : '—'}
          </Text>
        </View>
      ),
    },
    {
      key: 'monto',
      header: 'Monto',
      width: '22%',
      align: 'right',
      render: row => (
        <Cell align="right" color={palette.fg} bold>
          {formatMonto(row.value, moneda)}
        </Cell>
      ),
      footerRender: () => (
        <Cell align="right" color={palette.fg} bold size={pdfSize.sm}>
          {formatMonto(total, moneda)}
        </Cell>
      ),
    },
    {
      key: 'subs',
      header: 'Subcategorías',
      width: '16%',
      align: 'right',
      render: row => row.subcategorias?.length ?? 0,
      footerRender: () => (
        <Cell align="right" bold size={pdfSize.sm}>
          TOTAL
        </Cell>
      ),
    },
  ]

  // Swap footer labels so the TOTAL label appears to the left of amount
  const fixedColumns = columns.map((c, i) => {
    if (i === 2) {
      return { ...c, footerRender: columns[3].footerRender }
    }
    if (i === 3) {
      return { ...c, footerRender: columns[2].footerRender }
    }
    return c
  })

  return (
    <Section number={number} title={title} breakBefore>
      <Table columns={fixedColumns} rows={sorted} emptyMessage="No hay registros en este período" />
    </Section>
  )
}

// ── Deudas / Créditos list ───────────────────────────────────────────────────

function DebtCreditTable({
  number,
  title,
  items,
  moneda,
  accent,
  emptyText,
}: {
  number: string
  title: string
  items: ReportDeuda[]
  moneda: 'ARS' | 'USD'
  accent: 'orange' | 'indigo'
  emptyText: string
}) {
  const total = items.reduce((s, d) => s + (Number(d.monto) || 0), 0)
  const palette = accentPalette[accent]
  const sorted = [...items].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  const columns: ColumnDef<ReportDeuda>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      width: '14%',
      render: row => formatDate(row.fecha),
    },
    {
      key: 'concepto',
      header: 'Concepto',
      width: '42%',
      render: row => row.concepto || '—',
    },
    {
      key: 'categoria',
      header: 'Categoría',
      width: '26%',
      render: row => {
        const cat = row.categoria_nombre || 'General'
        const sub = row.subcategoria_nombre ? ` / ${row.subcategoria_nombre}` : ''
        return `${cat}${sub}`
      },
    },
    {
      key: 'monto',
      header: 'Monto',
      width: '18%',
      align: 'right',
      render: row => (
        <Cell align="right" color={palette.fg} bold>
          {formatMonto(row.monto, moneda)}
        </Cell>
      ),
      footerRender: () => (
        <Cell align="right" color={palette.fg} bold size={pdfSize.sm}>
          {formatMonto(total, moneda)}
        </Cell>
      ),
    },
  ]

  // Add "TOTAL" label to the third-to-last footer cell
  const columnsWithFooterLabel = columns.map((c, i) => {
    if (i === 2) {
      return {
        ...c,
        footerRender: () => (
          <Cell align="right" bold size={pdfSize.sm}>
            TOTAL
          </Cell>
        ),
      }
    }
    return c
  })

  return (
    <Section number={number} title={title} breakBefore>
      <Table columns={columnsWithFooterLabel} rows={sorted} emptyMessage={emptyText} />
    </Section>
  )
}

// ── Top conceptos ────────────────────────────────────────────────────────────

function TopConceptosSection({ report, moneda }: { report: ReportData; moneda: 'ARS' | 'USD' }) {
  const agrupar = (items: ReportMovimiento[]): { concepto: string; total: number; count: number }[] => {
    const map = new Map<string, { concepto: string; total: number; count: number }>()
    for (const m of items) {
      const key = (m.descripcion_nombre || m.concepto || 'Sin descripción').trim()
      const curr = map.get(key) ?? { concepto: key, total: 0, count: 0 }
      curr.total += Math.abs(Number(m.monto) || 0)
      curr.count += 1
      map.set(key, curr)
    }
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 10)
  }

  const topIng = agrupar(report.detalles?.ingresos ?? [])
  const topEgr = agrupar(report.detalles?.egresos ?? [])

  const makeColumns = (color: string): ColumnDef<{ concepto: string; total: number; count: number }>[] => [
    { key: 'rank', header: '#', width: '8%', align: 'center', render: (_r, i) => String(i + 1) },
    { key: 'concepto', header: 'Concepto', width: '52%', render: r => r.concepto },
    {
      key: 'count',
      header: 'Mov.',
      width: '14%',
      align: 'center',
      render: r => String(r.count),
    },
    {
      key: 'total',
      header: 'Total',
      width: '26%',
      align: 'right',
      render: r => (
        <Cell align="right" color={color} bold>
          {formatMonto(r.total, moneda)}
        </Cell>
      ),
    },
  ]

  return (
    <Section number="7" title="Top 10 Conceptos del Período" breakBefore>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <View
            style={{
              paddingVertical: 4,
              paddingHorizontal: 6,
              backgroundColor: accentPalette.emerald.soft,
              borderWidth: 0.5,
              borderColor: accentPalette.emerald.border,
              marginBottom: 4,
            }}
          >
            <Text
              style={{ fontSize: pdfSize.xs, fontFamily: pdfFonts.sansBold, color: pdfColors.positive, letterSpacing: 1 }}
            >
              INGRESOS
            </Text>
          </View>
          <Table
            columns={makeColumns(pdfColors.positive)}
            rows={topIng}
            emptyMessage="Sin ingresos en el período"
          />
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              paddingVertical: 4,
              paddingHorizontal: 6,
              backgroundColor: accentPalette.rose.soft,
              borderWidth: 0.5,
              borderColor: accentPalette.rose.border,
              marginBottom: 4,
            }}
          >
            <Text
              style={{ fontSize: pdfSize.xs, fontFamily: pdfFonts.sansBold, color: pdfColors.negative, letterSpacing: 1 }}
            >
              EGRESOS
            </Text>
          </View>
          <Table
            columns={makeColumns(pdfColors.negative)}
            rows={topEgr}
            emptyMessage="Sin egresos en el período"
          />
        </View>
      </View>
    </Section>
  )
}

// ── Salud Financiera ─────────────────────────────────────────────────────────

function SaludFinanciera({ report, moneda }: { report: ReportData; moneda: 'ARS' | 'USD' }) {
  const { resumen } = report
  const margen = resumen.ingresos > 0 ? (resumen.resultado / resumen.ingresos) * 100 : 0
  const cobertura = resumen.egresos > 0 ? resumen.ingresos / resumen.egresos : 0
  const posicionNeta = (resumen.creditos ?? 0) - (resumen.deudas ?? 0)
  const topEgresoConcentracion = (() => {
    if (!report.egresosBreakdown.length || resumen.egresos === 0) return 0
    const top = Math.max(...report.egresosBreakdown.map(e => e.value))
    return (top / resumen.egresos) * 100
  })()

  const indicadores: Array<{
    label: string
    value: string
    detail: string
    accent: 'emerald' | 'orange' | 'rose' | 'blue'
  }> = [
    {
      label: 'Margen neto',
      value: `${margen.toFixed(1)}%`,
      detail: margen >= 20 ? 'Saludable' : margen >= 0 ? 'Ajustado' : 'Negativo',
      accent: margen >= 20 ? 'emerald' : margen >= 0 ? 'orange' : 'rose',
    },
    {
      label: 'Cobertura de egresos',
      value: cobertura > 0 ? `${cobertura.toFixed(2)}x` : '—',
      detail: cobertura >= 1.2 ? 'Holgura' : cobertura >= 1 ? 'Equilibrio' : 'Déficit',
      accent: cobertura >= 1.2 ? 'emerald' : cobertura >= 1 ? 'orange' : 'rose',
    },
    {
      label: 'Posición neta (créd - deu)',
      value: formatMonto(posicionNeta, moneda),
      detail: posicionNeta > 0 ? 'A favor' : posicionNeta < 0 ? 'En contra' : 'Neutra',
      accent: posicionNeta > 0 ? 'emerald' : posicionNeta < 0 ? 'rose' : 'blue',
    },
    {
      label: 'Concentración mayor egreso',
      value: `${topEgresoConcentracion.toFixed(1)}%`,
      detail:
        topEgresoConcentracion >= 50 ? 'Alta' : topEgresoConcentracion >= 25 ? 'Moderada' : 'Baja',
      accent:
        topEgresoConcentracion >= 50 ? 'rose' : topEgresoConcentracion >= 25 ? 'orange' : 'emerald',
    },
  ]

  return (
    <Section number="8" title="Indicadores de Salud Financiera" breakBefore>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {indicadores.map(ind => {
          const palette = accentPalette[ind.accent]
          return (
            <View
              key={ind.label}
              style={{
                flex: 1,
                borderWidth: 0.5,
                borderColor: palette.border,
                backgroundColor: palette.soft,
                padding: 10,
                borderRadius: 3,
              }}
            >
              <Text
                style={{
                  fontSize: pdfSize.xs,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  color: pdfColors.muted,
                  fontFamily: pdfFonts.sansBold,
                }}
              >
                {ind.label}
              </Text>
              <Text style={{ fontSize: pdfSize.xl, fontFamily: pdfFonts.sansBold, color: palette.fg, marginTop: 4 }}>
                {ind.value}
              </Text>
              <Text style={{ fontSize: pdfSize.xs, color: pdfColors.muted, marginTop: 3 }}>{ind.detail}</Text>
            </View>
          )
        })}
      </View>
    </Section>
  )
}

// ── Detalle movimientos ──────────────────────────────────────────────────────

function DetalleMovimientos({ report, moneda }: { report: ReportData; moneda: 'ARS' | 'USD' }) {
  const renderTable = (items: ReportMovimiento[], total: number, color: string, sign: '+' | '-') => {
    const sorted = [...items].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    const columns: ColumnDef<ReportMovimiento>[] = [
      { key: 'fecha', header: 'Fecha', width: '12%', render: r => formatDate(r.fecha) },
      { key: 'concepto', header: 'Concepto', width: '38%', render: r => r.concepto || '—' },
      {
        key: 'categoria',
        header: 'Categoría',
        width: '28%',
        render: r => {
          const cat = r.categoria_nombre || 'General'
          const sub = r.subcategoria_nombre ? ` / ${r.subcategoria_nombre}` : ''
          return `${cat}${sub}`
        },
      },
      {
        key: 'monto',
        header: 'Monto',
        width: '22%',
        align: 'right',
        render: r => (
          <Cell align="right" color={color} bold>
            {sign}
            {formatMonto(Math.abs(Number(r.monto) || 0), moneda)}
          </Cell>
        ),
        footerRender: () => (
          <Cell align="right" color={color} bold size={pdfSize.sm}>
            {formatMonto(total, moneda)}
          </Cell>
        ),
      },
    ]
    const withFooterLabel = columns.map((c, i) =>
      i === 2
        ? {
            ...c,
            footerRender: () => (
              <Cell align="right" bold size={pdfSize.sm}>
                SUBTOTAL
              </Cell>
            ),
          }
        : c,
    )
    return <Table columns={withFooterLabel} rows={sorted} emptyMessage="Sin movimientos" />
  }

  return (
    <Section number="9" title="Detalle de Movimientos del Período" breakBefore>
      <View style={{ marginBottom: 14 }}>
        <Text
          style={{
            fontSize: pdfSize.sm,
            fontFamily: pdfFonts.sansBold,
            color: pdfColors.positive,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Ingresos — {formatMonto(report.resumen.ingresos, moneda)}
        </Text>
        {renderTable(report.detalles?.ingresos ?? [], report.resumen.ingresos, pdfColors.positive, '+')}
      </View>
      <View>
        <Text
          style={{
            fontSize: pdfSize.sm,
            fontFamily: pdfFonts.sansBold,
            color: pdfColors.negative,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Egresos — {formatMonto(report.resumen.egresos, moneda)}
        </Text>
        {renderTable(report.detalles?.egresos ?? [], report.resumen.egresos, pdfColors.negative, '-')}
      </View>

      <View
        style={{
          marginTop: 14,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: pdfColors.borderStrong,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Text
          style={{
            fontSize: pdfSize.sm,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: pdfColors.muted,
            fontFamily: pdfFonts.sansBold,
          }}
        >
          Resultado neto del período
        </Text>
        <Text
          style={{
            fontSize: pdfSize.xl,
            fontFamily: pdfFonts.sansBold,
            color: resultadoColor(report.resumen.resultado),
          }}
        >
          {formatMonto(report.resumen.resultado, moneda)}
        </Text>
        <Text style={{ fontSize: pdfSize.sm, color: resultadoColor(report.resumen.resultado) }}>
          ({resultadoLabel(report.resumen.resultado)})
        </Text>
      </View>
    </Section>
  )
}

// ── Main document ────────────────────────────────────────────────────────────

export function ReporteMensualPDF(props: ReporteMensualPDFProps) {
  const { sucursal, moneda, periodoLabel, isClosedMonth, startDate, endDate, generatedAt, report, monthly, deltas } = props

  const headerTitle = `Reporte ${periodoLabel} · ${moneda}`
  const emitidoEl = generatedAt.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <Document
      title={`Reporte ${sucursal.nombre} — ${periodoLabel}`}
      author="Heroica"
      subject={`Reporte ${periodoLabel} ${moneda}`}
      creator="Sistema Heroica"
      producer="Heroica"
    >
      <CoverPage
        sucursal={sucursal}
        moneda={moneda}
        periodoLabel={periodoLabel}
        isClosedMonth={isClosedMonth}
        startDate={startDate}
        endDate={endDate}
        generatedAt={generatedAt}
        resumen={report.resumen}
      />

      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader title={headerTitle} sucursal={sucursal.nombre} />
        <PdfFooter emitidoEl={emitidoEl} />

        <ExecutiveSummary report={report} moneda={moneda} deltas={deltas} />

        <MonthlyEvolution data={monthly} moneda={moneda} />

        <BreakdownSection
          number="3"
          title="Discriminado de Ingresos"
          total={report.resumen.ingresos}
          items={report.ingresosBreakdown}
          moneda={moneda}
          accent="emerald"
        />

        <BreakdownSection
          number="4"
          title="Discriminado de Egresos"
          total={report.resumen.egresos}
          items={report.egresosBreakdown}
          moneda={moneda}
          accent="rose"
        />

        <DebtCreditTable
          number="5"
          title="Listado de Deudas (A Pagar)"
          items={report.detalles?.deudas ?? []}
          moneda={moneda}
          accent="orange"
          emptyText="No hay deudas registradas"
        />

        <DebtCreditTable
          number="6"
          title="Listado de Créditos (A Cobrar)"
          items={report.detalles?.creditos ?? []}
          moneda={moneda}
          accent="indigo"
          emptyText="No hay créditos registrados"
        />

        <TopConceptosSection report={report} moneda={moneda} />

        <SaludFinanciera report={report} moneda={moneda} />

        <DetalleMovimientos report={report} moneda={moneda} />
      </Page>
    </Document>
  )
}
