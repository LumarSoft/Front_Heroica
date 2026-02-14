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
  },
  MOVIMIENTOS: {
    GET_BY_SUCURSAL: (sucursalId: number) => `${API_URL}/api/movimientos/${sucursalId}`,
    GET_TOTALES: (sucursalId: number) => `${API_URL}/api/movimientos/${sucursalId}/totales`,
    CREATE_EFECTIVO: `${API_URL}/api/movimientos/efectivo`,
    UPDATE: (id: number) => `${API_URL}/api/movimientos/${id}`,
    MOVER_A_REAL: (id: number) => `${API_URL}/api/movimientos/efectivo/${id}/mover-a-real`,
    UPDATE_ESTADO: (id: number) => `${API_URL}/api/movimientos/${id}/estado`,
    DELETE: (id: number) => `${API_URL}/api/movimientos/${id}`,
  },
  PAGOS_PENDIENTES: {
    GET_BY_SUCURSAL: (sucursalId: number) => `${API_URL}/api/pagos-pendientes/${sucursalId}`,
    CREATE: `${API_URL}/api/pagos-pendientes`,
    APROBAR: (id: number) => `${API_URL}/api/pagos-pendientes/${id}/aprobar`,
    RECHAZAR: (id: number) => `${API_URL}/api/pagos-pendientes/${id}/rechazar`,
    DELETE: (id: number) => `${API_URL}/api/pagos-pendientes/${id}`,
  },
  CAJA_BANCO: {
    GET_BY_SUCURSAL: (sucursalId: number) => `${API_URL}/api/caja-banco/${sucursalId}`,
    GET_TOTALES: (sucursalId: number) => `${API_URL}/api/caja-banco/${sucursalId}/totales`,
    CREATE: `${API_URL}/api/caja-banco`,
    UPDATE: (id: number) => `${API_URL}/api/caja-banco/${id}`,
    MOVER_A_REAL: (id: number) => `${API_URL}/api/caja-banco/${id}/mover-a-real`,
    UPDATE_ESTADO: (id: number) => `${API_URL}/api/caja-banco/${id}/estado`,
    DELETE: (id: number) => `${API_URL}/api/caja-banco/${id}`,
  },
};
