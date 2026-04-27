/** Detecta medios tipo cheque / eCheq según el nombre del catálogo */
export function isMedioPagoChequeLike(nombre: string | null | undefined): boolean {
  if (!nombre) return false
  return /cheque|echeq/i.test(nombre)
}

export function tieneNumeroChequeCargado(numero: string | null | undefined): boolean {
  return Boolean(numero?.trim())
}
