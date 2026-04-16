// =============================================
// Tipos compartidos para los componentes de Reportes
// =============================================

export interface ReportBreakdownItem {
  name: string
  value: number
  subcategorias?: ReportBreakdownItem[]
}

export interface ReportResumen {
  ingresos: number
  egresos: number
  resultado: number
  resultado_banco?: number
  deudas?: number
  creditos?: number
}

export interface ReportDeuda {
  id?: number
  fecha: string
  concepto?: string
  monto: number
  categoria_nombre?: string
  subcategoria_nombre?: string
}

export interface ReportMovimiento {
  id?: number
  fecha: string
  concepto?: string
  monto: number
  tipo: 'ingreso' | 'egreso'
  categoria_nombre?: string
  subcategoria_nombre?: string
}

export interface ReportData {
  resumen: ReportResumen
  ingresosBreakdown: ReportBreakdownItem[]
  egresosBreakdown: ReportBreakdownItem[]
  detalles?: {
    ingresos: ReportMovimiento[]
    egresos: ReportMovimiento[]
    deudas: ReportDeuda[]
    creditos: ReportDeuda[]
  }
}

export interface PieTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}
