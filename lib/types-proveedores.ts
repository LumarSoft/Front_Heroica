/** Proveedor tal como lo devuelve GET /api/configuracion/proveedores */
export interface Proveedor {
  id: number
  nombre: string
  razon_social?: string | null
  cuit?: string | null
  cbu_alias?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  activo: boolean
}
