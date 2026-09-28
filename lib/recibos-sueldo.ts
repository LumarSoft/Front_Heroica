const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

// Se conserva el campo mes de la API: 1–12 son meses; 13 y 14 identifican los SAC.
export const PERIODOS_RECIBOS = [
  ...MESES.map((nombre, index) => ({ id: index + 1, nombre, corto: nombre.slice(0, 3), mesCalendario: index + 1 })),
  { id: 13, nombre: 'SAC 1er semestre', corto: 'SAC 1er semestre', mesCalendario: 6 },
  { id: 14, nombre: 'SAC 2do semestre', corto: 'SAC 2do semestre', mesCalendario: 12 },
]
