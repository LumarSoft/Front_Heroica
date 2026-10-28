// Vista previa de la importación por Excel de un catálogo (descripciones, proveedores).
// La API la devuelve antes de aplicar nada; las altas y bajas traen datos propios de cada catálogo.

export interface MensajeFilaExcel {
  fila: number | null
  mensaje: string
}

export interface CambioCampoExcel {
  campo: string
  antes: string
  despues: string
}

export interface ModificacionExcel {
  fila: number
  id: number
  nombre: string
  cambios: CambioCampoExcel[]
}

/** Un registro repetido que se unifica con otro: sus movimientos pasan al destino */
export interface UnificacionExcel {
  fila: number
  id: number
  nombre: string
  destino_id: number
  destino_nombre: string
  movimientos: number
}

export interface AltaExcelBase {
  fila: number
  nombre: string
}

export interface BajaExcelBase {
  id: number
  nombre: string
  movimientos: number
}

export interface PreviewCatalogoExcel<A extends AltaExcelBase, B extends BajaExcelBase> {
  archivo_hash: string
  firma: string
  resumen: {
    filas: number
    altas: number
    modificaciones: number
    bajas: number
    unificaciones: number
    sin_cambios: number
    errores: number
    advertencias: number
  }
  altas: A[]
  modificaciones: ModificacionExcel[]
  bajas: B[]
  unificaciones: UnificacionExcel[]
  errores: MensajeFilaExcel[]
  advertencias: MensajeFilaExcel[]
}

export interface AltaDescripcionExcel extends AltaExcelBase {
  tipo: string
  categoria: string
  subcategoria: string
  activo: boolean
}

export interface BajaDescripcionExcel extends BajaExcelBase {
  tipo: string
  categoria: string
  subcategoria: string
}

export interface AltaProveedorExcel extends AltaExcelBase {
  cuit: string
  activo: boolean
}

export interface BajaProveedorExcel extends BajaExcelBase {
  cuit: string
}
