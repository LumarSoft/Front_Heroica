/** Factura del abono del sistema, como la devuelve GET /api/abono/facturas */
export interface FacturaAbono {
  id: number
  mes: number
  anio: number
  numero: string | null
  descripcion: string | null
  monto: number
  nombre_original: string | null
  abonada: boolean
  abonada_at: string | null
  abonada_por_nombre: string | null
  subido_por_nombre: string | null
  created_at: string
}

export interface TotalesAbono {
  facturado: number
  abonado: number
  adeudado: number
}

export interface FacturasAbonoRespuesta {
  facturas: FacturaAbono[]
  totales: TotalesAbono
}

export type AccionHistorialAbono = 'subida' | 'abonada' | 'pendiente' | 'eliminada'

/** Una línea del historial: GET /api/abono/historial */
export interface HistorialAbono {
  id: number
  factura_id: number
  accion: AccionHistorialAbono
  detalle: string
  usuario_nombre: string | null
  created_at: string
}

/** Facturas de un mes con sus subtotales */
export interface MesAbono {
  clave: string
  mes: number
  anio: number
  facturas: FacturaAbono[]
  totales: TotalesAbono
}

export interface NuevaFacturaAbono {
  mes: number
  anio: number
  numero: string
  descripcion: string
  /** Monto crudo del MontoInput */
  monto: string
  archivo: File
}
