import { ReactNode } from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import { pdfColors, pdfFonts, pdfSize, accentPalette, type AccentKey } from './theme'

// ── Styles ───────────────────────────────────────────────────────────────────

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontFamily: pdfFonts.sans,
    fontSize: pdfSize.base,
    color: pdfColors.body,
    backgroundColor: pdfColors.surface,
  },
  brandBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: pdfColors.brand,
  },
  header: {
    position: 'absolute',
    top: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: pdfColors.border,
  },
  headerBrand: {
    fontFamily: pdfFonts.sansBold,
    color: pdfColors.brand,
    fontSize: pdfSize.md,
    letterSpacing: 1.2,
  },
  headerMeta: {
    fontSize: pdfSize.xs,
    color: pdfColors.muted,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: pdfColors.border,
  },
  footerText: {
    fontSize: pdfSize.xs,
    color: pdfColors.muted,
  },
})

// ── Header / Footer (fixed on every page) ────────────────────────────────────

interface HeaderProps {
  title: string
  sucursal: string
}

export function PdfHeader({ title, sucursal }: HeaderProps) {
  return (
    <>
      <View style={pdfStyles.brandBar} fixed />
      <View style={pdfStyles.header} fixed>
        <Text style={pdfStyles.headerBrand}>HEROICA</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: pdfSize.sm, color: pdfColors.ink, fontFamily: pdfFonts.sansBold }}>
            {title}
          </Text>
          <Text style={pdfStyles.headerMeta}>{sucursal}</Text>
        </View>
      </View>
    </>
  )
}

interface FooterProps {
  emitidoEl: string
}

export function PdfFooter({ emitidoEl }: FooterProps) {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text style={pdfStyles.footerText}>Emitido: {emitidoEl}</Text>
      <Text
        style={pdfStyles.footerText}
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
      />
    </View>
  )
}

// ── Section title ────────────────────────────────────────────────────────────

interface SectionProps {
  number?: string | number
  title: string
  subtitle?: string
  children?: ReactNode
  breakBefore?: boolean
  wrap?: boolean
}

const sectionStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  numberBadge: {
    width: 22,
    height: 22,
    borderRadius: 3,
    backgroundColor: pdfColors.brand,
    color: pdfColors.surface,
    fontFamily: pdfFonts.sansBold,
    fontSize: pdfSize.md,
    textAlign: 'center',
    paddingTop: 4,
    marginRight: 8,
  },
  titleBlock: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.borderStrong,
    paddingBottom: 4,
  },
  title: {
    fontFamily: pdfFonts.sansBold,
    fontSize: pdfSize.lg,
    color: pdfColors.ink,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: pdfSize.xs,
    color: pdfColors.muted,
    marginTop: 1,
  },
})

export function Section({ number, title, subtitle, children, breakBefore, wrap = true }: SectionProps) {
  return (
    <View style={sectionStyles.wrapper} break={breakBefore} wrap={wrap}>
      <View style={sectionStyles.header}>
        {number != null && <Text style={sectionStyles.numberBadge}>{number}</Text>}
        <View style={sectionStyles.titleBlock}>
          <Text style={sectionStyles.title}>{title}</Text>
          {subtitle && <Text style={sectionStyles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </View>
  )
}

// ── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string
  value: string
  accent?: AccentKey
  sub?: string
  delta?: number | null
  invertDelta?: boolean
}

const summaryStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 4,
    padding: 8,
    minHeight: 60,
  },
  label: {
    fontSize: pdfSize.xs,
    fontFamily: pdfFonts.sansBold,
    color: pdfColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  value: {
    fontFamily: pdfFonts.sansBold,
    fontSize: pdfSize.lg,
  },
  sub: {
    fontSize: pdfSize.xs,
    color: pdfColors.muted,
    marginTop: 3,
  },
  delta: {
    fontSize: pdfSize.xs,
    fontFamily: pdfFonts.sansBold,
    marginTop: 3,
  },
})

export function SummaryCard({ label, value, accent = 'blue', sub, delta, invertDelta }: SummaryCardProps) {
  const palette = accentPalette[accent]
  let deltaColor = pdfColors.muted
  let deltaText: string | null = null
  if (delta != null && isFinite(delta)) {
    const sign = delta > 0 ? '+' : ''
    deltaText = `${sign}${delta.toFixed(1)}% vs mes ant.`
    const positive = invertDelta ? delta <= 0 : delta >= 0
    deltaColor = positive ? pdfColors.positive : pdfColors.negative
  }
  return (
    <View style={[summaryStyles.card, { backgroundColor: palette.soft, borderColor: palette.border }]}>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={[summaryStyles.value, { color: palette.fg }]}>{value}</Text>
      {sub && <Text style={summaryStyles.sub}>{sub}</Text>}
      {deltaText && <Text style={[summaryStyles.delta, { color: deltaColor }]}>{deltaText}</Text>}
    </View>
  )
}

// ── Table ────────────────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  key: string
  header: string
  width: string | number
  align?: 'left' | 'center' | 'right'
  render: (row: T, index: number) => ReactNode
  footerRender?: () => ReactNode
}

interface TableProps<T> {
  columns: ColumnDef<T>[]
  rows: T[]
  emptyMessage?: string
  zebra?: boolean
}

const tableStyles = StyleSheet.create({
  table: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: pdfColors.border,
    borderRadius: 2,
  },
  headRow: {
    flexDirection: 'row',
    backgroundColor: pdfColors.brand,
  },
  th: {
    fontFamily: pdfFonts.sansBold,
    fontSize: pdfSize.xs,
    color: pdfColors.surface,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: pdfColors.border,
  },
  rowZebra: {
    backgroundColor: pdfColors.surfaceAlt,
  },
  td: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: pdfSize.sm,
    color: pdfColors.body,
  },
  footRow: {
    flexDirection: 'row',
    backgroundColor: pdfColors.surfaceStripe,
    borderTopWidth: 0.5,
    borderTopColor: pdfColors.borderStrong,
  },
  tfoot: {
    fontFamily: pdfFonts.sansBold,
    fontSize: pdfSize.sm,
    color: pdfColors.ink,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  empty: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: pdfColors.muted,
    fontSize: pdfSize.sm,
    paddingVertical: 16,
  },
})

export function Table<T>({ columns, rows, emptyMessage, zebra = true }: TableProps<T>) {
  const hasFooter = columns.some(c => c.footerRender)
  return (
    <View style={tableStyles.table}>
      <View style={tableStyles.headRow} fixed>
        {columns.map(col => (
          <Text
            key={col.key}
            style={[
              tableStyles.th,
              { width: col.width as any, textAlign: col.align ?? 'left' },
            ]}
          >
            {col.header}
          </Text>
        ))}
      </View>

      {rows.length === 0 ? (
        <Text style={tableStyles.empty}>{emptyMessage ?? 'Sin registros'}</Text>
      ) : (
        rows.map((row, i) => {
          const rowStyle = zebra && i % 2 === 1 ? [tableStyles.row, tableStyles.rowZebra] : tableStyles.row
          return (
            <View key={i} style={rowStyle} wrap={false}>
              {columns.map(col => {
                const rendered = col.render(row, i)
                const isPrimitive = typeof rendered === 'string' || typeof rendered === 'number'
                return (
                  <View
                    key={col.key}
                    style={{ width: col.width as any, paddingVertical: 4, paddingHorizontal: 6 }}
                  >
                    {isPrimitive ? (
                      <Text style={{ fontSize: pdfSize.sm, color: pdfColors.body, textAlign: col.align ?? 'left' }}>
                        {rendered as any}
                      </Text>
                    ) : (
                      rendered
                    )}
                  </View>
                )
              })}
            </View>
          )
        })
      )}

      {hasFooter && rows.length > 0 && (
        <View style={tableStyles.footRow} wrap={false}>
          {columns.map(col => (
            <View key={col.key} style={{ width: col.width as any, paddingVertical: 5, paddingHorizontal: 6 }}>
              {col.footerRender ? col.footerRender() : <Text style={{ fontSize: pdfSize.sm }}> </Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

// ── Lightweight cell primitives ──────────────────────────────────────────────

export function Cell({ children, align = 'left', bold = false, color, size }: {
  children: ReactNode
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  color?: string
  size?: number
}) {
  return (
    <Text
      style={{
        fontSize: size ?? pdfSize.sm,
        textAlign: align,
        color: color ?? pdfColors.body,
        fontFamily: bold ? pdfFonts.sansBold : pdfFonts.sans,
      }}
    >
      {children}
    </Text>
  )
}

export function Muted({ children, size }: { children: ReactNode; size?: number }) {
  return (
    <Text style={{ fontSize: size ?? pdfSize.xs, color: pdfColors.muted }}>{children}</Text>
  )
}

export function Divider({ thick }: { thick?: boolean }) {
  return (
    <View
      style={{
        borderBottomWidth: thick ? 1 : 0.5,
        borderBottomColor: thick ? pdfColors.borderStrong : pdfColors.border,
        marginVertical: 8,
      }}
    />
  )
}

// ── Pill / Badge ─────────────────────────────────────────────────────────────

export function Pill({ children, accent = 'blue' }: { children: ReactNode; accent?: AccentKey }) {
  const palette = accentPalette[accent]
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: palette.border,
        backgroundColor: palette.soft,
      }}
    >
      <Text
        style={{
          fontSize: pdfSize.xs,
          fontFamily: pdfFonts.sansBold,
          color: palette.fg,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {children}
      </Text>
    </View>
  )
}
