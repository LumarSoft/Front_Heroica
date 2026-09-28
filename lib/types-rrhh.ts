export interface EscalaSalarial {
  id: number
  sucursal_id: number
  puesto_id: number
  puesto_nombre: string
  sueldo_base: number
  mes: number
  anio: number
  valor_hora: number | null
}

export interface Area {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Puesto {
  id: number
  nombre: string
  area_id: number
  area_nombre: string
  created_at: string
  updated_at: string
}

export interface SelectOption {
  id: number
  nombre: string
}

export type RhCalendarioEventoTipo =
  | 'Capacitación'
  | 'Reunión'
  | 'Comunicado'
  | 'Vencimiento'
  | 'Evento interno'
  | 'Ministerio'
  | 'Otro'
export type RhCalendarioTipoNotion = 'General' | 'Invitación' | 'Comunicado' | 'Recordatorio'
export type RhCalendarioPeriodicidad =
  | 'Ninguna'
  | 'Cada día'
  | 'Lun-Vie'
  | 'Cada semana'
  | 'Cada 2 semanas'
  | 'Cada mes'
  | 'Primero de cada mes'
  | 'Cada año'

export interface RhCalendarioEvento {
  id: number
  evento: RhCalendarioEventoTipo
  fecha: string
  hora: string | null
  direccion: string | null
  participantes: string | null
  comentarios: string | null
  tipo_notion: RhCalendarioTipoNotion
  periodicidad: RhCalendarioPeriodicidad | null
  creado_por: number | null
  creado_por_nombre: string | null
  created_at: string
  updated_at: string
}

export interface Personal {
  id: number
  legajo: string
  nombre: string
  dni: string
  cuil?: string | null
  email?: string | null
  telefono?: string | null
  fecha_nacimiento?: string | null
  domicilio_real?: string | null
  domicilio_dni?: string | null
  domicilio_real_provincia_codigo?: string | null
  domicilio_real_localidad?: string | null
  domicilio_real_codigo_postal?: string | null
  domicilio_dni_provincia_codigo?: string | null
  domicilio_dni_localidad?: string | null
  domicilio_dni_codigo_postal?: string | null
  puesto_id: number
  puesto_nombre: string
  sucursal_id: number
  fecha_incorporacion: string
  fecha_inicio_cobro?: string | null
  periodo_prueba?: boolean
  periodo_prueba_dias?: number | null
  jornada_semanal_dias?: number | null
  jornada_diaria_horas?: string | null
  propuesta_economica?: number | string | null
  beneficios?: string | null
  condicion_laboral?: number | null
  fecha_alta_temprana?: string | null
  banco?: string | null
  cbu?: string | null
  carnet_manipulacion_alimentos: boolean
  carnet_archivo_url?: string | null
  carnet_archivo_nombre?: string | null
  carnet_vencimiento?: string | null
  solicitud_alta_id?: number | null
  datos_alta_json?: unknown
  activo: boolean
  /** Lista de tipo_doc de documentos requeridos que faltan en la solicitud de alta. */
  adjuntos_faltantes?: string[]
  vencimientos_proximos?: VencimientoLegajo[]
  created_at: string
  updated_at: string
}

export interface ProvinciaPostal {
  codigo: string
  nombre: string
}

export interface CodigoPostalOpcion {
  id: string
  localidad: string
  partido: string | null
  codigo_postal: string
}

export interface VencimientoLegajo {
  tipo: 'carnet_manipulacion' | 'documento_legajo'
  label: string
  fecha_vencimiento: string
  dias_restantes: number
}

export interface PersonalArchivo {
  tipo_doc: string
  label: string
  url: string
  nombre_original: string | null
  solicitud_id: number
  solicitud_tipo: string
  fecha_solicitud: string
  estado: string
  documento_id?: number
  fecha_vencimiento?: string | null
  subido_por_nombre?: string | null
}

export type RhIncentivoTipo = 'Incentivo' | 'Premio'
export type RhIncentivoMetodoCalculo = 'porcentaje_escala' | 'monto_fijo' | 'multiplicador_valor_hora'

export interface RhIncentivoPremio {
  id: number
  sucursal_id: number
  sucursal_nombre: string
  area_id: number | null
  area_nombre: string | null
  puesto_id: number | null
  puesto_nombre: string | null
  nombre: string
  tipo: RhIncentivoTipo
  descripcion: string | null
  mes: number
  anio: number
  metodo_calculo: RhIncentivoMetodoCalculo
  valor: number
  activo: boolean | number
  fecha_ultima_actualizacion: string
  created_at: string
  updated_at: string
}

export interface DescripcionOption {
  id: number
  nombre: string
  tipo?: 'ingreso' | 'egreso'
  categoria_id?: number | null
  subcategoria_id?: number | null
  categoria_nombre?: string | null
  subcategoria_nombre?: string | null
  activo?: boolean
}

export interface PersonalReciboSueldo {
  id: number
  mes: number
  anio: number
  nombre_original: string | null
  subido_por_nombre: string | null
  created_at: string
}
