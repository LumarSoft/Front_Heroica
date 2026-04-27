export type Tipo = 'bug' | 'mejora' | 'implementacion' | 'otro'
export type Prioridad = 'alta' | 'media' | 'baja'
export type Estado = 'pendiente' | 'en_progreso' | 'en_pruebas' | 'completado'
export type Modulo = 'tesoreria' | 'rh'

export interface Tarea {
  id: number
  codigo: string
  modulo: Modulo
  version: string | null
  titulo: string
  descripcion: string | null
  tipo: Tipo
  prioridad: Prioridad
  estado: Estado
  creado_por: number | null
  creado_por_nombre: string | null
  asignado_a: number | null
  asignado_a_nombre: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  comentarios_count: number
}

export interface Comentario {
  id: number
  contenido: string
  created_at: string
  usuario_id: number
  usuario_nombre: string
}

export interface UsuarioBasico {
  id: number
  nombre: string
}

export interface NotificarData {
  tipo: 'movimiento' | 'comentario'
  descripcion: string
  tareaId: number
}
