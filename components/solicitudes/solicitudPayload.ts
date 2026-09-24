import type { SolicitudFormState } from '@/lib/types'
import { mapEmpleadoNovedadToApiPayload } from './solicitudEmpleadosUtils'

function mapAdjuntos(archivos: Array<{ url: string; nombre: string }>) {
  return archivos.map(archivo => ({
    url: archivo.url.trim(),
    nombre_original: archivo.nombre.trim() || null,
  }))
}

export function buildSolicitudDetalles(form: SolicitudFormState) {
  switch (form.tipo) {
    case 'Altas':
      return {
        nombre: form.alta_nombre.trim(),
        dni: form.alta_dni.trim(),
        cuil: form.alta_cuil.replace(/\D/g, ''),
        domicilio: form.alta_domicilio.trim(),
        domicilio_dni: form.alta_direccion_dni.trim(),
        domicilio_real_provincia_codigo: form.alta_domicilio_real_provincia_codigo,
        domicilio_real_localidad: form.alta_domicilio_real_localidad.trim(),
        domicilio_real_codigo_postal: form.alta_domicilio_real_codigo_postal,
        domicilio_dni_provincia_codigo: form.alta_domicilio_dni_provincia_codigo,
        domicilio_dni_localidad: form.alta_domicilio_dni_localidad.trim(),
        domicilio_dni_codigo_postal: form.alta_domicilio_dni_codigo_postal,
        fecha_nacimiento: form.alta_fecha_nacimiento,
        telefono: form.alta_telefono.trim(),
        email: form.alta_email.trim() || null,
        banco: form.alta_banco.trim() || null,
        cbu: form.alta_cbu.trim() || null,
        puesto_id: Number(form.alta_puesto_id),
        fecha_incorporacion: form.alta_fecha_incorporacion,
        fecha_inicio_cobro_oficina: form.alta_fecha_inicio_cobro,
        jornada_semanal_dias: Number(form.alta_jornada_dias_semanales),
        jornada_diaria_horas_texto: form.alta_jornada_horas_diarias.trim(),
        propuesta_economica: Number(form.alta_propuesta_economica),
        beneficios: form.alta_beneficios.trim(),
        otras_observaciones_alta: form.alta_otras_observaciones.trim() || null,
        condicion_laboral: Number(form.alta_condicion_laboral) as 1 | 2,
        fecha_alta_temprana:
          form.alta_condicion_laboral === '1' && form.alta_fecha_alta_temprana ? form.alta_fecha_alta_temprana : null,
        periodo_prueba: form.alta_periodo_prueba,
        periodo_prueba_dias: form.alta_periodo_prueba ? Number(form.alta_periodo_prueba_dias) : null,
        carnet_manipulacion_alimentos: form.alta_carnet,
        carnet_adjunto: form.alta_carnet
          ? {
              url: form.alta_carnet_archivo_url.trim(),
              nombre_original: form.alta_carnet_archivo_nombre.trim() || null,
            }
          : null,
        carnet_fecha_vencimiento: form.alta_carnet ? form.alta_carnet_vencimiento : null,
        adjuntos: {
          dni_frente_dorso: mapAdjuntos(form.alta_doc_dni_archivos),
          ddjj_domicilio: mapAdjuntos(form.alta_doc_ddjj_archivos),
          descripcion_puesto_firmada: mapAdjuntos(form.alta_doc_puesto_archivos),
          foto_colaborador: {
            url: form.alta_doc_foto_url.trim(),
            nombre_original: form.alta_doc_foto_nombre.trim() || null,
          },
          normas_convivencia: mapAdjuntos(form.alta_doc_normas_archivos),
          constancia_uniforme: mapAdjuntos(form.alta_doc_uniforme_archivos),
        },
      }
    case 'Bajas':
      return {
        motivo_baja_id: Number(form.baja_motivo_id),
        motivo_baja_detalle: form.baja_motivo_detalle.trim() || null,
        fecha_baja: form.baja_fecha,
        liquidacion_empleado: mapEmpleadoNovedadToApiPayload(form.baja_empleado_liquidacion!),
        carta_documento_adjunto: form.baja_carta_url.trim()
          ? { url: form.baja_carta_url.trim(), nombre_original: form.baja_carta_nombre.trim() || null }
          : null,
      }
    case 'Vacaciones':
      return {
        fecha_desde: form.vacaciones_desde,
        fecha_hasta: form.vacaciones_hasta,
        cantidad_dias: Number(form.vacaciones_dias),
      }
    case 'Licencias':
      return {
        tipo_licencia: form.licencia_tipo.trim(),
        fecha_desde: form.licencia_desde,
        fecha_hasta: form.licencia_hasta,
        motivo: form.licencia_motivo.trim(),
        constancia_adjunto: form.licencia_constancia_url.trim()
          ? {
              url: form.licencia_constancia_url.trim(),
              nombre_original: form.licencia_constancia_nombre.trim() || null,
            }
          : null,
      }
    case 'Novedades de sueldo':
      return {
        area_id: Number(form.nov_area_id),
        mes: Number(form.nov_mes),
        anio: Number(form.nov_anio),
        empleados: form.nov_empleados.map(emp => mapEmpleadoNovedadToApiPayload(emp)),
      }
    case 'Apercibimientos':
      return {
        fecha: form.apercibimiento_fecha,
        severidad: form.apercibimiento_severidad,
        motivo: form.apercibimiento_motivo.trim(),
        archivo_adjunto: form.apercibimiento_archivo_url.trim()
          ? {
              url: form.apercibimiento_archivo_url.trim(),
              nombre_original: form.apercibimiento_archivo_nombre.trim() || null,
            }
          : null,
      }
    case 'Descuentos':
      return {
        motivo: form.descuento_motivo.trim(),
        monto: Number(form.descuento_monto),
        fecha: form.descuento_fecha,
      }
    case 'Horas extras':
      return {
        cantidad_horas: Number(form.horas_extras_cantidad),
        fecha: form.horas_extras_fecha,
        ...(form.horas_extras_valor_hora && { valor_hora: Number(form.horas_extras_valor_hora) }),
        ...(form.horas_extras_descripcion.trim() && { descripcion: form.horas_extras_descripcion.trim() }),
      }
    case 'Suspensiones':
      return {
        fecha_desde: form.suspension_fecha_desde,
        fecha_hasta: form.suspension_fecha_hasta,
        motivo: form.suspension_motivo.trim(),
        archivo_adjunto: form.suspension_archivo_url.trim()
          ? {
              url: form.suspension_archivo_url.trim(),
              nombre_original: form.suspension_archivo_nombre.trim() || null,
            }
          : null,
      }
    case 'Capacitaciones':
      return {
        area_id: Number(form.capacitacion_area_id),
        tema: form.capacitacion_tema.trim(),
        fecha: form.capacitacion_fecha,
        ...(form.capacitacion_descripcion.trim() && { descripcion: form.capacitacion_descripcion.trim() }),
      }
    case 'Pedido de uniforme':
      return {
        talle: form.uniforme_talle.trim(),
        items: form.uniforme_items.trim(),
      }
    case 'Adelantos':
      return {
        monto: Number(form.adelanto_monto),
        fecha: form.adelanto_fecha,
        motivo: form.adelanto_motivo.trim(),
      }
    case 'Incentivos y premios':
      return {
        scope: form.incentivo_scope,
        ...(form.incentivo_scope === 'area' && form.incentivo_area_id
          ? { area_id: Number(form.incentivo_area_id) }
          : {}),
        ...(form.incentivo_scope === 'puesto' && form.incentivo_puesto_id
          ? { puesto_id: Number(form.incentivo_puesto_id) }
          : {}),
        descripcion: form.incentivo_descripcion.trim(),
        fecha: form.incentivo_fecha,
        ...(form.incentivo_monto && { monto: Number(form.incentivo_monto) }),
        archivo_adjunto: form.incentivo_archivo_url.trim()
          ? {
              url: form.incentivo_archivo_url.trim(),
              nombre_original: form.incentivo_archivo_nombre.trim() || null,
            }
          : null,
      }
    case 'Cambio de puesto/sucursal':
      return {
        puesto_id_nuevo: form.cambio_nuevo_puesto_id ? Number(form.cambio_nuevo_puesto_id) : null,
        sucursal_id_nueva: form.cambio_nueva_sucursal_id ? Number(form.cambio_nueva_sucursal_id) : null,
        fecha_efectiva: form.cambio_fecha_efectiva,
        motivo: form.cambio_motivo.trim() || null,
      }
    default:
      return null
  }
}
