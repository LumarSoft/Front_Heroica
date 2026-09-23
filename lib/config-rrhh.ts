export function createRrhhEndpoints(API_URL: string) {
  return {
    RRHH_CALENDARIO: {
      GET_ALL: `${API_URL}/api/rrhh/calendario`,
      CREATE: `${API_URL}/api/rrhh/calendario`,
      CREATE_BATCH: `${API_URL}/api/rrhh/calendario/batch`,
      UPDATE: (id: number) => `${API_URL}/api/rrhh/calendario/${id}`,
      DELETE: (id: number) => `${API_URL}/api/rrhh/calendario/${id}`,
    },
    RRHH_INCENTIVOS: {
      GET_BY_SUCURSAL: (sucursalId: number, mes?: number, anio?: number) => {
        const params = new URLSearchParams({ sucursal_id: String(sucursalId) })
        if (mes) params.append('mes', String(mes))
        if (anio) params.append('anio', String(anio))
        return `${API_URL}/api/rrhh/incentivos?${params.toString()}`
      },
      CREATE: `${API_URL}/api/rrhh/incentivos`,
      UPDATE: (id: number) => `${API_URL}/api/rrhh/incentivos/${id}`,
      DELETE: (id: number) => `${API_URL}/api/rrhh/incentivos/${id}`,
    },
    RRHH_MOTIVOS_BAJA: {
      LIST: (sucursalId: number) => `${API_URL}/api/rrhh/motivos-baja?sucursal_id=${sucursalId}`,
      CREATE: `${API_URL}/api/rrhh/motivos-baja`,
      UPDATE: (id: number) => `${API_URL}/api/rrhh/motivos-baja/${id}`,
      DELETE: (id: number, sucursalId: number) => `${API_URL}/api/rrhh/motivos-baja/${id}?sucursal_id=${sucursalId}`,
    },
    RRHH_SOLICITUDES: {
      GET_ALL: `${API_URL}/api/rrhh/solicitudes`,
      GET_BY_SUCURSAL: (sucursalId: number) => `${API_URL}/api/rrhh/solicitudes?sucursal_id=${sucursalId}`,
      GET_BY_PERSONAL: (personalId: number) => `${API_URL}/api/rrhh/solicitudes?personal_id=${personalId}&legajo=1`,
      CREATE: `${API_URL}/api/rrhh/solicitudes`,
      UPDATE: (id: number) => `${API_URL}/api/rrhh/solicitudes/${id}`,
      UPDATE_ESTADO: (id: number) => `${API_URL}/api/rrhh/solicitudes/${id}/estado`,
      CANCEL: (id: number) => `${API_URL}/api/rrhh/solicitudes/${id}/cancelar`,
      DELETE: (id: number) => `${API_URL}/api/rrhh/solicitudes/${id}`,
      UPLOAD_ARCHIVO: `${API_URL}/api/rrhh/solicitudes/archivos`,
      UPLOAD_ARCHIVO_TOKEN: `${API_URL}/api/rrhh/solicitudes/archivos/token`,
      OPEN_ARCHIVO: (id: number) => `${API_URL}/api/rrhh/solicitudes/${id}/archivos/abrir`,
    },
    ESCALAS_SALARIALES: {
      GET_BY_SUCURSAL: (sucursalId: number) => `${API_URL}/api/escalas-salariales?sucursal_id=${sucursalId}`,
      GET_BY_SUCURSAL_PUESTO: (sucursalId: number, puestoId: number) =>
        `${API_URL}/api/escalas-salariales?sucursal_id=${sucursalId}&puesto_id=${puestoId}`,
      CREATE: `${API_URL}/api/escalas-salariales`,
      UPDATE: (id: number) => `${API_URL}/api/escalas-salariales/${id}`,
      DELETE: (id: number) => `${API_URL}/api/escalas-salariales/${id}`,
      COPIAR: `${API_URL}/api/escalas-salariales/copiar`,
    },
    PERSONAL: {
      GET_ALL: `${API_URL}/api/personal`,
      ALERTAS_DOCUMENTACION: `${API_URL}/api/personal/alertas-documentacion`,
      PROVINCIAS_POSTALES: `${API_URL}/api/personal/catalogos/provincias`,
      CODIGOS_POSTALES: (provinciaCodigo: string) =>
        `${API_URL}/api/personal/catalogos/codigos-postales?provincia=${encodeURIComponent(provinciaCodigo)}`,
      GET_BY_SUCURSAL: (sucursalId: number) => `${API_URL}/api/personal?sucursal_id=${sucursalId}`,
      GET_BY_ID: (id: number) => `${API_URL}/api/personal/${id}`,
      CREATE: `${API_URL}/api/personal`,
      UPDATE: (id: number) => `${API_URL}/api/personal/${id}`,
      DELETE: (id: number) => `${API_URL}/api/personal/${id}`,
      GET_PROFESIONAL: (id: number) => `${API_URL}/api/personal/${id}/profesional`,
      GET_ANALITICO: (id: number) => `${API_URL}/api/personal/${id}/analitico`,
      GET_ARCHIVOS: (id: number) => `${API_URL}/api/personal/${id}/archivos`,
      OPEN_ARCHIVO: (id: number) => `${API_URL}/api/personal/${id}/archivos/abrir`,
      GET_RECIBOS_SUELDO: (id: number) => `${API_URL}/api/personal/${id}/recibos-sueldo`,
      UPLOAD_RECIBO_SUELDO: (id: number) => `${API_URL}/api/personal/${id}/recibos-sueldo`,
      OPEN_RECIBO_SUELDO: (id: number, reciboId: number) =>
        `${API_URL}/api/personal/${id}/recibos-sueldo/${reciboId}/abrir`,
      DELETE_RECIBO_SUELDO: (id: number, reciboId: number) =>
        `${API_URL}/api/personal/${id}/recibos-sueldo/${reciboId}`,
      GET_NOTAS: (id: number) => `${API_URL}/api/personal/${id}/notas`,
      CREATE_NOTA: (id: number) => `${API_URL}/api/personal/${id}/notas`,
      DELETE_NOTA: (id: number, notaId: number) => `${API_URL}/api/personal/${id}/notas/${notaId}`,
      UPLOAD_DOCUMENTO: (id: number) => `${API_URL}/api/personal/${id}/documentos`,
      DELETE_DOCUMENTO: (id: number, docId: number) => `${API_URL}/api/personal/${id}/documentos/${docId}`,
    },
    PUESTOS: {
      GET_ALL: `${API_URL}/api/puestos`,
      GET_BY_AREA: (areaId: number) => `${API_URL}/api/puestos?area_id=${areaId}`,
      CREATE: `${API_URL}/api/puestos`,
      UPDATE: (id: number) => `${API_URL}/api/puestos/${id}`,
      DELETE: (id: number) => `${API_URL}/api/puestos/${id}`,
    },
    AREAS: {
      GET_ALL: `${API_URL}/api/areas`,
      GET_ACTIVAS: `${API_URL}/api/areas?activo=1`,
      CREATE: `${API_URL}/api/areas`,
      UPDATE: (id: number) => `${API_URL}/api/areas/${id}`,
      DELETE: (id: number) => `${API_URL}/api/areas/${id}`,
    },
    RRHH_SUELDOS: {
      GET_PERIODO: (sucursalId: number, mes: number, anio: number) =>
        `${API_URL}/api/rrhh/sueldos?sucursal_id=${sucursalId}&mes=${mes}&anio=${anio}`,
      UPDATE_PERIODO: (personalId: number, sucursalId: number, mes: number, anio: number) =>
        `${API_URL}/api/rrhh/sueldos/${personalId}/periodo?sucursal_id=${sucursalId}&mes=${mes}&anio=${anio}`,
      UPDATE_PERIODO_META: (personalId: number, sucursalId: number, mes: number, anio: number) =>
        `${API_URL}/api/rrhh/sueldos/${personalId}/periodo/meta?sucursal_id=${sucursalId}&mes=${mes}&anio=${anio}`,
      UPDATE_LIQUIDACION: (liquidacionId: number) => `${API_URL}/api/rrhh/sueldos/liquidaciones/${liquidacionId}`,
      ENVIAR_PAGOS: `${API_URL}/api/rrhh/sueldos/enviar-pagos`,
      ENVIAR_LIQUIDACION_PAGOS: (liquidacionId: number) =>
        `${API_URL}/api/rrhh/sueldos/liquidaciones/${liquidacionId}/enviar-pagos`,
    },
    RRHH_ANALITICO: {
      GLOBAL: (sucursalId?: number | null, desde?: string, hasta?: string) => {
        const params = new URLSearchParams()
        if (sucursalId) params.append('sucursal_id', String(sucursalId))
        if (desde) params.append('desde', desde)
        if (hasta) params.append('hasta', hasta)
        const qs = params.toString()
        return `${API_URL}/api/rrhh/analitico/global${qs ? `?${qs}` : ''}`
      },
    },
  }
}
