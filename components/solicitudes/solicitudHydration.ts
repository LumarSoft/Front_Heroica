import type { RhSolicitud, EmpleadoNovedadData, SolicitudFormState } from '@/lib/types'
import { createInitialSolicitudFormState } from './solicitudInitialState'
import { createEmpleadoVacio } from './solicitudEmpleadosUtils'
import { parseEmpleadosFromDetalles, readAdjuntoIndividual, readAltaAdjuntoSlot } from './solicitudHydrationHelpers'

const today = new Date().toISOString().split('T')[0]
export function createSolicitudFormStateFromSolicitud(solicitud: RhSolicitud): SolicitudFormState {
  const form = createInitialSolicitudFormState()
  const detalles = (solicitud.detalles ?? {}) as Record<string, unknown>

  const base: SolicitudFormState = {
    ...form,
    personal_id: solicitud.personal_id ? String(solicitud.personal_id) : 'general',
    tipo: solicitud.tipo,
    fecha_solicitud: solicitud.fecha_solicitud.split('T')[0],
    observaciones: solicitud.observaciones ?? '',
    alta_nombre: String(detalles.nombre ?? ''),
    alta_dni: String(detalles.dni ?? ''),
    alta_cuil: typeof detalles.cuil === 'number' ? String(detalles.cuil) : String(detalles.cuil ?? ''),
    alta_domicilio: String(detalles.domicilio ?? ''),
    alta_direccion_dni: String(detalles.domicilio_dni ?? ''),
    alta_domicilio_real_provincia_codigo: String(detalles.domicilio_real_provincia_codigo ?? ''),
    alta_domicilio_real_localidad: String(detalles.domicilio_real_localidad ?? ''),
    alta_domicilio_real_codigo_postal: String(detalles.domicilio_real_codigo_postal ?? ''),
    alta_domicilio_dni_provincia_codigo: String(detalles.domicilio_dni_provincia_codigo ?? ''),
    alta_domicilio_dni_localidad: String(detalles.domicilio_dni_localidad ?? ''),
    alta_domicilio_dni_codigo_postal: String(detalles.domicilio_dni_codigo_postal ?? ''),
    alta_fecha_nacimiento: String(detalles.fecha_nacimiento ?? ''),
    alta_telefono: String(detalles.telefono ?? ''),
    alta_email: String(detalles.email ?? ''),
    alta_banco: String(detalles.banco ?? ''),
    alta_cbu: String(detalles.cbu ?? ''),
    alta_puesto_id: detalles.puesto_id ? String(detalles.puesto_id) : '',
    alta_fecha_incorporacion: String(detalles.fecha_incorporacion ?? today),
    alta_fecha_inicio_cobro: String(detalles.fecha_inicio_cobro_oficina ?? today),
    alta_condicion_laboral:
      detalles.condicion_laboral === 1 || detalles.condicion_laboral === 2
        ? (String(detalles.condicion_laboral) as '1' | '2')
        : '',
    alta_fecha_alta_temprana: String(detalles.fecha_alta_temprana ?? ''),
    alta_jornada_dias_semanales: detalles.jornada_semanal_dias != null ? String(detalles.jornada_semanal_dias) : '',
    alta_jornada_horas_diarias: String(detalles.jornada_diaria_horas_texto ?? ''),
    alta_propuesta_economica: detalles.propuesta_economica != null ? String(detalles.propuesta_economica) : '',
    alta_beneficios: String(detalles.beneficios ?? ''),
    alta_otras_observaciones: String(detalles.otras_observaciones_alta ?? ''),
    alta_doc_dni_archivos: [],
    alta_doc_ddjj_archivos: [],
    alta_doc_puesto_archivos: [],
    alta_doc_foto_url: '',
    alta_doc_foto_nombre: '',
    alta_doc_normas_archivos: [],
    alta_doc_uniforme_archivos: [],
    alta_periodo_prueba: detalles.periodo_prueba === true,
    alta_periodo_prueba_dias: detalles.periodo_prueba_dias ? String(detalles.periodo_prueba_dias) : '180',
    alta_carnet: detalles.carnet_manipulacion_alimentos === true,
    alta_carnet_archivo_url: '',
    alta_carnet_archivo_nombre: '',
    alta_carnet_vencimiento: String(detalles.carnet_fecha_vencimiento ?? ''),
    baja_fecha: String(detalles.fecha_baja ?? today),
    baja_motivo_id: detalles.motivo_baja_id != null ? String(detalles.motivo_baja_id) : '',
    baja_motivo_detalle: String(detalles.motivo_baja_detalle ?? ''),
    vacaciones_desde: String(detalles.fecha_desde ?? today),
    vacaciones_hasta: String(detalles.fecha_hasta ?? today),
    vacaciones_dias: detalles.cantidad_dias ? String(detalles.cantidad_dias) : '',
    licencia_tipo: String(detalles.tipo_licencia ?? ''),
    licencia_desde: String(detalles.fecha_desde ?? today),
    licencia_hasta: String(detalles.fecha_hasta ?? today),
    licencia_motivo: String(detalles.motivo ?? ''),
    apercibimiento_fecha: String(detalles.fecha ?? today),
    apercibimiento_severidad: (detalles.severidad as 'Leve' | 'Moderada' | 'Grave') ?? 'Leve',
    apercibimiento_motivo: String(detalles.motivo ?? ''),
    descuento_motivo: String(detalles.motivo ?? ''),
    descuento_monto: detalles.monto ? String(detalles.monto) : '',
    descuento_fecha: String(detalles.fecha ?? today),
    horas_extras_cantidad: detalles.cantidad_horas ? String(detalles.cantidad_horas) : '',
    horas_extras_fecha: String(detalles.fecha ?? today),
    horas_extras_valor_hora: detalles.valor_hora ? String(detalles.valor_hora) : '',
    horas_extras_descripcion: String(detalles.descripcion ?? ''),
  }

  if (solicitud.tipo === 'Altas') {
    const archivos = solicitud.archivos ?? []
    const findArchivo = (tipoDoc: string) => archivos.find(a => a.tipo_doc === tipoDoc)
    // Fallback a adjuntos del JSON para registros anteriores a RH-60
    const fallbackAdj = (key: string) => readAltaAdjuntoSlot(detalles, key)
    const findArchivos = (tipoDoc: string) => {
      const encontrados = archivos
        .filter(archivo => archivo.tipo_doc === tipoDoc)
        .map(archivo => ({ url: archivo.url, nombre: archivo.nombre_original ?? '' }))
      if (encontrados.length > 0) return encontrados
      const legacy = fallbackAdj(tipoDoc)
      return legacy.url ? [legacy] : []
    }

    const fotoA = findArchivo('foto_colaborador')
    const carnetA = findArchivo('carnet_manipulacion_alimentos')

    const fotoS = fotoA ? { url: fotoA.url, nombre: fotoA.nombre_original ?? '' } : fallbackAdj('foto_colaborador')

    // carnet_adjunto legacy desde JSON
    const carnetSlotLegacy = detalles.carnet_adjunto as { url?: string; nombre_original?: string } | null | undefined
    const carnetUrl = carnetA?.url ?? (carnetSlotLegacy?.url ? String(carnetSlotLegacy.url) : '')
    const carnetNombre =
      carnetA?.nombre_original ?? (carnetSlotLegacy?.nombre_original ? String(carnetSlotLegacy.nombre_original) : '')

    return {
      ...base,
      alta_doc_dni_archivos: findArchivos('dni_frente_dorso'),
      alta_doc_ddjj_archivos: findArchivos('ddjj_domicilio'),
      alta_doc_puesto_archivos: findArchivos('descripcion_puesto_firmada'),
      alta_doc_foto_url: fotoS.url,
      alta_doc_foto_nombre: fotoS.nombre,
      alta_doc_normas_archivos: findArchivos('normas_convivencia'),
      alta_doc_uniforme_archivos: findArchivos('constancia_uniforme'),
      alta_carnet_archivo_url: carnetUrl,
      alta_carnet_archivo_nombre: carnetNombre,
    }
  }

  if (solicitud.tipo === 'Bajas') {
    // Carta documento desde tabla archivos; fallback a JSON para registros anteriores
    const cartaA = solicitud.archivos?.find(a => a.tipo_doc === 'carta_documento')
    const cartaFallback = readAdjuntoIndividual(detalles, 'carta_documento_adjunto')
    const cartaUrl = cartaA?.url ?? cartaFallback.url
    const cartaNombre = cartaA?.nombre_original ?? cartaFallback.nombre

    // Empleado de liquidación desde tabla empleados; fallback a JSON para registros anteriores
    let liq: EmpleadoNovedadData | null = null
    const empDesdeTabla = solicitud.empleados?.[0]
    if (empDesdeTabla) {
      liq = parseEmpleadosFromDetalles([empDesdeTabla])[0] ?? null
    } else {
      const liqRaw = detalles.liquidacion_empleado
      if (liqRaw && typeof liqRaw === 'object' && !Array.isArray(liqRaw)) {
        liq = parseEmpleadosFromDetalles([liqRaw as unknown])[0] ?? null
      }
    }

    const pid = solicitud.personal_id
    const pname = solicitud.personal_nombre ?? ''
    if (!liq && pid) {
      const vacio = createEmpleadoVacio(pid, pname)
      const legacyDias =
        typeof detalles.dias_horas_trabajadas_mes === 'string' ? detalles.dias_horas_trabajadas_mes.trim() : ''
      liq = legacyDias ? { ...vacio, observaciones: `(Registro anterior) ${legacyDias}` } : vacio
    }
    const detalleDesdeDetalle = base.baja_motivo_detalle
    const textoMotivoViejo =
      typeof detalles.motivo_baja === 'string' && detalles.motivo_baja_id == null ? detalles.motivo_baja.trim() : ''
    return {
      ...base,
      baja_motivo_detalle: detalleDesdeDetalle || textoMotivoViejo,
      baja_empleado_liquidacion: liq,
      baja_carta_url: cartaUrl,
      baja_carta_nombre: cartaNombre,
    }
  }
  if (solicitud.tipo === 'Novedades de sueldo') {
    const d = detalles as Record<string, unknown>
    // Empleados desde tabla; fallback a JSON para registros anteriores
    const empSource =
      solicitud.empleados && solicitud.empleados.length > 0
        ? solicitud.empleados
        : Array.isArray(d.empleados)
          ? d.empleados
          : []
    return {
      ...base,
      nov_area_id: d.area_id ? String(d.area_id) : '',
      nov_mes: d.mes ? String(d.mes) : form.nov_mes,
      nov_anio: d.anio ? String(d.anio) : form.nov_anio,
      nov_empleados: parseEmpleadosFromDetalles(empSource as unknown[]),
    }
  }

  if (solicitud.tipo === 'Licencias') {
    const constancia = solicitud.archivos?.find(a => a.tipo_doc === 'licencia_constancia')
    const legacy = readAdjuntoIndividual(detalles, 'constancia_adjunto')
    return {
      ...base,
      licencia_constancia_url: constancia?.url ?? legacy.url,
      licencia_constancia_nombre: constancia?.nombre_original ?? legacy.nombre,
    }
  }

  if (solicitud.tipo === 'Apercibimientos') {
    const adjA = solicitud.archivos?.find(a => a.tipo_doc === 'apercibimiento_adjunto')
    const adjFallback = readAdjuntoIndividual(detalles, 'archivo_adjunto')
    const adjUrl = adjA?.url ?? adjFallback.url
    const adjNombre = adjA?.nombre_original ?? adjFallback.nombre
    return {
      ...base,
      apercibimiento_archivo_url: adjUrl,
      apercibimiento_archivo_nombre: adjNombre,
    }
  }

  if (solicitud.tipo === 'Suspensiones') {
    const adjA = solicitud.archivos?.find(a => a.tipo_doc === 'suspension_adjunto')
    const adjFallback = readAdjuntoIndividual(detalles, 'archivo_adjunto')
    const adjUrl = adjA?.url ?? adjFallback.url
    const adjNombre = adjA?.nombre_original ?? adjFallback.nombre
    return {
      ...base,
      suspension_fecha_desde: String(detalles.fecha_desde ?? today),
      suspension_fecha_hasta: String(detalles.fecha_hasta ?? today),
      suspension_motivo: String(detalles.motivo ?? ''),
      suspension_archivo_url: adjUrl,
      suspension_archivo_nombre: adjNombre,
    }
  }

  if (solicitud.tipo === 'Capacitaciones') {
    return {
      ...base,
      capacitacion_area_id: detalles.area_id ? String(detalles.area_id) : '',
      capacitacion_tema: String(detalles.tema ?? ''),
      capacitacion_fecha: String(detalles.fecha ?? today),
      capacitacion_descripcion: String(detalles.descripcion ?? ''),
    }
  }

  if (solicitud.tipo === 'Pedido de uniforme') {
    return {
      ...base,
      uniforme_talle: String(detalles.talle ?? ''),
      uniforme_items: String(detalles.items ?? ''),
    }
  }

  if (solicitud.tipo === 'Adelantos') {
    return {
      ...base,
      adelanto_monto: detalles.monto != null ? String(detalles.monto) : '',
      adelanto_fecha: String(detalles.fecha ?? today),
      adelanto_motivo: String(detalles.motivo ?? ''),
    }
  }

  if (solicitud.tipo === 'Incentivos y premios') {
    const scope = (detalles.scope as 'colaborador' | 'area' | 'puesto') ?? 'colaborador'
    const adjA = solicitud.archivos?.find(a => a.tipo_doc === 'incentivo_adjunto')
    const adjFallback = readAdjuntoIndividual(detalles, 'archivo_adjunto')
    const adjUrl = adjA?.url ?? adjFallback.url
    const adjNombre = adjA?.nombre_original ?? adjFallback.nombre
    return {
      ...base,
      incentivo_scope: scope,
      incentivo_area_id: detalles.area_id != null ? String(detalles.area_id) : '',
      incentivo_puesto_id: detalles.puesto_id != null ? String(detalles.puesto_id) : '',
      incentivo_descripcion: String(detalles.descripcion ?? ''),
      incentivo_fecha: String(detalles.fecha ?? today),
      incentivo_monto: detalles.monto != null ? String(detalles.monto) : '',
      incentivo_archivo_url: adjUrl,
      incentivo_archivo_nombre: adjNombre,
    }
  }

  if (solicitud.tipo === 'Cambio de puesto/sucursal') {
    return {
      ...base,
      cambio_nuevo_puesto_id: detalles.puesto_id_nuevo != null ? String(detalles.puesto_id_nuevo) : '',
      cambio_nueva_sucursal_id: detalles.sucursal_id_nueva != null ? String(detalles.sucursal_id_nueva) : '',
      cambio_fecha_efectiva: String(detalles.fecha_efectiva ?? today),
      cambio_motivo: String(detalles.motivo ?? ''),
    }
  }

  return base
}
