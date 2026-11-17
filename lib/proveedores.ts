import type { Proveedor } from './types'

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

/**
 * Busca por nombre, razón social o CBU/alias (sin importar mayúsculas ni acentos) y por CUIT,
 * con o sin guiones. Sin texto devuelve todos.
 */
export function filtrarProveedores(proveedores: Proveedor[], texto: string): Proveedor[] {
  const buscado = normalizar(texto)
  if (!buscado) return proveedores
  const digitos = buscado.replace(/\D/g, '')
  return proveedores.filter(p => {
    const campos = [p.nombre, p.razon_social, p.cbu_alias].map(campo => normalizar(campo ?? ''))
    if (campos.some(campo => campo.includes(buscado))) return true
    return digitos.length >= 3 && (p.cuit ?? '').replace(/\D/g, '').includes(digitos)
  })
}
