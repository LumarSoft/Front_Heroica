export const LABELS_DOCUMENTOS: Record<string, string> = {
  dni_frente_dorso: 'DNI (ambos lados)',
  ddjj_domicilio: 'DDJJ de domicilio',
  descripcion_puesto_firmada: 'Descripción de puesto firmada',
  foto_colaborador: 'Foto del colaborador',
  normas_convivencia: 'Normas de convivencia',
  constancia_uniforme: 'Constancia de uniforme',
  constancia_alta: 'Constancia de alta',
  carnet_manipulacion_alimentos: 'Carnet de manipulación',
}

export const TIPOS_DOCUMENTOS = [
  'dni_frente_dorso',
  'ddjj_domicilio',
  'descripcion_puesto_firmada',
  'foto_colaborador',
  'normas_convivencia',
  'constancia_uniforme',
  'constancia_alta',
] as const

export function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) {
    const m = String(fecha).match(/(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
    return '—'
  }
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export function isImagen(nombre: string | null, url: string): boolean {
  return /\.(jpe?g|png|webp|gif|heic)(\?|$)/i.test(nombre || url)
}

export function shortFilename(name: string | null, max = 55): string {
  if (!name) return 'archivo'
  if (name.length <= max) return name
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  const keep = Math.max(8, max - ext.length - 1)
  return `${name.slice(0, keep)}…${ext}`
}

export function estadoVencimiento(fecha: string | null | undefined): string | null {
  if (!fecha) return null
  const dias = Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000)
  if (dias < 0) return 'Vencido'
  if (dias <= 30) return 'Próximo a vencer'
  return 'Vigente'
}
