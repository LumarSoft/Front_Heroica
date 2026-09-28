const PROVINCIA_NOMBRES: Record<string, string> = {
  C: 'Ciudad Autónoma de Buenos Aires',
  B: 'Buenos Aires',
  K: 'Catamarca',
  H: 'Chaco',
  U: 'Chubut',
  X: 'Córdoba',
  W: 'Corrientes',
  E: 'Entre Ríos',
  P: 'Formosa',
  Y: 'Jujuy',
  L: 'La Pampa',
  F: 'La Rioja',
  M: 'Mendoza',
  N: 'Misiones',
  Q: 'Neuquén',
  R: 'Río Negro',
  A: 'Salta',
  J: 'San Juan',
  D: 'San Luis',
  Z: 'Santa Cruz',
  S: 'Santa Fe',
  G: 'Santiago del Estero',
  V: 'Tierra del Fuego',
  T: 'Tucumán',
}

/**
 * Barrios oficiales de la Ciudad Autónoma de Buenos Aires.
 *
 * CABA no se consulta en el catálogo de localidades de Correo Argentino porque
 * el código postal exacto depende de la calle y la altura. Guardamos el barrio
 * como localidad y mantenemos el ingreso manual del CP de cuatro dígitos.
 */
export const CABA_BARRIOS = [
  'Agronomía',
  'Almagro',
  'Balvanera',
  'Barracas',
  'Belgrano',
  'Boedo',
  'Caballito',
  'Chacarita',
  'Coghlan',
  'Colegiales',
  'Constitución',
  'Flores',
  'Floresta',
  'La Boca',
  'La Paternal',
  'Liniers',
  'Mataderos',
  'Monserrat',
  'Monte Castro',
  'Nueva Pompeya',
  'Núñez',
  'Palermo',
  'Parque Avellaneda',
  'Parque Chacabuco',
  'Parque Chas',
  'Parque Patricios',
  'Puerto Madero',
  'Recoleta',
  'Retiro',
  'Saavedra',
  'San Cristóbal',
  'San Nicolás',
  'San Telmo',
  'Vélez Sarsfield',
  'Versalles',
  'Villa Crespo',
  'Villa del Parque',
  'Villa Devoto',
  'Villa General Mitre',
  'Villa Lugano',
  'Villa Luro',
  'Villa Ortúzar',
  'Villa Pueyrredón',
  'Villa Real',
  'Villa Riachuelo',
  'Villa Santa Rita',
  'Villa Soldati',
  'Villa Urquiza',
] as const

export function getProvinciaPostalNombre(codigo: string | null | undefined): string {
  if (!codigo) return '—'
  return PROVINCIA_NOMBRES[codigo] ?? codigo
}
