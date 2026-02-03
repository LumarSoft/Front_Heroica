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
};
