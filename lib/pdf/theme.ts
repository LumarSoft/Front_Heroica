export const pdfColors: Record<string, string> = {
  brand: '#002868',
  brandDark: '#001845',
  brandSoft: '#e6ebf4',
  ink: '#0f172a',
  body: '#1f2937',
  muted: '#64748b',
  subtle: '#94a3b8',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  surfaceStripe: '#f3f4f6',
  positive: '#047857',
  positiveSoft: '#ecfdf5',
  negative: '#be123c',
  negativeSoft: '#fff1f2',
  warning: '#b45309',
  warningSoft: '#fffbeb',
  info: '#1d4ed8',
  infoSoft: '#eff6ff',
  indigo: '#4338ca',
  indigoSoft: '#eef2ff',
}

export const pdfFonts = {
  sans: 'Helvetica',
  sansBold: 'Helvetica-Bold',
  sansOblique: 'Helvetica-Oblique',
  serif: 'Times-Roman',
  serifBold: 'Times-Bold',
}

export const pdfSize = {
  xs: 7,
  sm: 8,
  base: 9,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 18,
  display: 24,
}

export type AccentKey = 'emerald' | 'rose' | 'blue' | 'red' | 'orange' | 'indigo'

export const accentPalette: Record<
  AccentKey,
  { fg: string; soft: string; border: string }
> = {
  emerald: { fg: pdfColors.positive, soft: pdfColors.positiveSoft, border: '#a7f3d0' },
  rose: { fg: pdfColors.negative, soft: pdfColors.negativeSoft, border: '#fecdd3' },
  blue: { fg: pdfColors.info, soft: pdfColors.infoSoft, border: '#bfdbfe' },
  red: { fg: pdfColors.negative, soft: pdfColors.negativeSoft, border: '#fecdd3' },
  orange: { fg: pdfColors.warning, soft: pdfColors.warningSoft, border: '#fde68a' },
  indigo: { fg: pdfColors.indigo, soft: pdfColors.indigoSoft, border: '#c7d2fe' },
}
