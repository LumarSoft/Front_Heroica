// Configuración de la API
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_URL}/api/auth/login`,
    VERIFY: `${API_URL}/api/auth/verify`,
  },
  SUCURSALES: {
    GET_ALL: `${API_URL}/api/sucursales`,
    GET_BY_ID: (id: number) => `${API_URL}/api/sucursales/${id}`,
    CREATE: `${API_URL}/api/sucursales`,
    UPDATE: (id: number) => `${API_URL}/api/sucursales/${id}`,
    DELETE: (id: number) => `${API_URL}/api/sucursales/${id}`,
    // Documentos (múltiples)
    GET_DOCUMENTOS: (id: number) => `${API_URL}/api/sucursales/${id}/documentos`,
    UPLOAD_DOCUMENTO: (id: number) => `${API_URL}/api/sucursales/${id}/documentos`,
    DOWNLOAD_DOCUMENTO: (sucursalId: number, docId: number) => `${API_URL}/api/sucursales/${sucursalId}/documentos/${docId}/download`,
    DELETE_DOCUMENTO: (sucursalId: number, docId: number) => `${API_URL}/api/sucursales/${sucursalId}/documentos/${docId}`,
  },
  MOVIMIENTOS: {
    GET_BY_SUCURSAL: (sucursalId: number, moneda: string = "ARS") => `${API_URL}/api/movimientos/${sucursalId}?moneda=${moneda}`,
    GET_TOTALES: (sucursalId: number, moneda: string = "ARS") => `${API_URL}/api/movimientos/${sucursalId}/totales?moneda=${moneda}`,
    GET_DEUDAS: (sucursalId: number, fechaInicio?: string, fechaFin?: string) => {
      const params = new URLSearchParams({ sucursalId: String(sucursalId) });
      if (fechaInicio) params.append("fechaInicio", fechaInicio);
      if (fechaFin) params.append("fechaFin", fechaFin);
      return `${API_URL}/api/movimientos/deudas?${params.toString()}`;
    },
    CREATE_EFECTIVO: `${API_URL}/api/movimientos/efectivo`,
    COMPRA_VENTA_DIVISAS: `${API_URL}/api/movimientos/compra-venta-divisas`,
    UPDATE: (id: number) => `${API_URL}/api/movimientos/${id}`,
    UPDATE_ESTADO: (id: number) => `${API_URL}/api/movimientos/${id}/estado`,
    TOGGLE_DEUDA: (id: number) => `${API_URL}/api/movimientos/${id}/deuda`,
    DELETE: (id: number) => `${API_URL}/api/movimientos/${id}`,
    BULK_DELETE: `${API_URL}/api/movimientos/bulk`,
    BULK_MOVER: `${API_URL}/api/movimientos/bulk/mover`,
    // Documentos
    GET_DOCUMENTOS: (id: number) => `${API_URL}/api/movimientos/${id}/documentos`,
    UPLOAD_DOCUMENTO: (id: number) => `${API_URL}/api/movimientos/${id}/documentos`,
    DOWNLOAD_DOCUMENTO: (movimientoId: number, docId: number) => `${API_URL}/api/movimientos/${movimientoId}/documentos/${docId}/download`,
    DELETE_DOCUMENTO: (movimientoId: number, docId: number) => `${API_URL}/api/movimientos/${movimientoId}/documentos/${docId}`,
  },
  PAGOS_PENDIENTES: {
    GET_ALL: `${API_URL}/api/pagos-pendientes/all`,
    GET_BY_SUCURSAL: (sucursalId: number) => `${API_URL}/api/pagos-pendientes/${sucursalId}`,
    CREATE: `${API_URL}/api/pagos-pendientes`,
    APROBAR: (id: number) => `${API_URL}/api/pagos-pendientes/${id}/aprobar`,
    RECHAZAR: (id: number) => `${API_URL}/api/pagos-pendientes/${id}/rechazar`,
    GET_HISTORIAL: (userId: number) => `${API_URL}/api/pagos-pendientes/historial/${userId}`,
  },
  CAJA_BANCO: {
    GET_BY_SUCURSAL: (sucursalId: number, moneda: string = "ARS") => `${API_URL}/api/caja-banco/${sucursalId}?moneda=${moneda}`,
    GET_TOTALES: (sucursalId: number, moneda: string = "ARS") => `${API_URL}/api/caja-banco/${sucursalId}/totales?moneda=${moneda}`,
    CREATE: `${API_URL}/api/caja-banco`,
    UPDATE: (id: number) => `${API_URL}/api/caja-banco/${id}`,
    UPDATE_ESTADO: (id: number) => `${API_URL}/api/caja-banco/${id}/estado`,
    TOGGLE_DEUDA: (id: number) => `${API_URL}/api/caja-banco/${id}/deuda`,
    DELETE: (id: number) => `${API_URL}/api/caja-banco/${id}`,
    BULK_DELETE: `${API_URL}/api/caja-banco/bulk`,
    BULK_MOVER: `${API_URL}/api/caja-banco/bulk/mover`,
    // Documentos
    GET_DOCUMENTOS: (id: number) => `${API_URL}/api/caja-banco/${id}/documentos`,
    UPLOAD_DOCUMENTO: (id: number) => `${API_URL}/api/caja-banco/${id}/documentos`,
    DOWNLOAD_DOCUMENTO: (movimientoId: number, docId: number) => `${API_URL}/api/caja-banco/${movimientoId}/documentos/${docId}/download`,
    DELETE_DOCUMENTO: (movimientoId: number, docId: number) => `${API_URL}/api/caja-banco/${movimientoId}/documentos/${docId}`,
  },
  CONFIGURACION: {
    // Categorías
    CATEGORIAS: {
      GET_ALL: `${API_URL}/api/configuracion/categorias`,
      CREATE: `${API_URL}/api/configuracion/categorias`,
      UPDATE: (id: number) => `${API_URL}/api/configuracion/categorias/${id}`,
      DELETE: (id: number) => `${API_URL}/api/configuracion/categorias/${id}`,
    },
    // Subcategorías
    SUBCATEGORIAS: {
      GET_ALL: `${API_URL}/api/configuracion/subcategorias`,
      GET_BY_CATEGORIA: (categoriaId: number) => `${API_URL}/api/configuracion/subcategorias?categoria_id=${categoriaId}`,
      CREATE: `${API_URL}/api/configuracion/subcategorias`,
      UPDATE: (id: number) => `${API_URL}/api/configuracion/subcategorias/${id}`,
      DELETE: (id: number) => `${API_URL}/api/configuracion/subcategorias/${id}`,
    },
    // Bancos
    BANCOS: {
      GET_ALL: `${API_URL}/api/configuracion/bancos`,
      CREATE: `${API_URL}/api/configuracion/bancos`,
      UPDATE: (id: number) => `${API_URL}/api/configuracion/bancos/${id}`,
      DELETE: (id: number) => `${API_URL}/api/configuracion/bancos/${id}`,
    },
    // Medios de Pago
    MEDIOS_PAGO: {
      GET_ALL: `${API_URL}/api/configuracion/medios-pago`,
      CREATE: `${API_URL}/api/configuracion/medios-pago`,
      UPDATE: (id: number) => `${API_URL}/api/configuracion/medios-pago/${id}`,
      DELETE: (id: number) => `${API_URL}/api/configuracion/medios-pago/${id}`,
    },
    // Usuarios
    USUARIOS: {
      GET_ALL: `${API_URL}/api/configuracion/usuarios`,
      CREATE: `${API_URL}/api/configuracion/usuarios`,
      UPDATE_ROL: (id: number) => `${API_URL}/api/configuracion/usuarios/${id}/rol`,
      TOGGLE_ACTIVO: (id: number) => `${API_URL}/api/configuracion/usuarios/${id}/toggle-activo`,
      DELETE: (id: number) => `${API_URL}/api/configuracion/usuarios/${id}`,
    },
  },
  REPORTES: {
    GET_BY_SUCURSAL: (sucursalId: number | string, startDate: string, endDate: string, moneda: string = "ARS") =>
      `${API_URL}/api/reportes/${sucursalId}?startDate=${startDate}T00:00:00&endDate=${endDate}T23:59:59&moneda=${moneda}`,
  },
  CUENTAS_BANCARIAS: {
    GET_BY_SUCURSAL: (sucursalId: number) => `${API_URL}/api/cuentas-bancarias/${sucursalId}`,
    CREATE: (sucursalId: number) => `${API_URL}/api/cuentas-bancarias/${sucursalId}`,
    UPDATE: (id: number) => `${API_URL}/api/cuentas-bancarias/${id}`,
    DELETE: (id: number) => `${API_URL}/api/cuentas-bancarias/${id}`,
  },
  TAREAS: {
    GET_ALL: `${API_URL}/api/tareas`,
    CREATE: `${API_URL}/api/tareas`,
    UPDATE: (id: number) => `${API_URL}/api/tareas/${id}`,
    UPDATE_ESTADO: (id: number) => `${API_URL}/api/tareas/${id}/estado`,
    DELETE: (id: number) => `${API_URL}/api/tareas/${id}`,
  },
};
