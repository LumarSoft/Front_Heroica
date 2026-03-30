export const ROLES = {
  ADMIN: { id: 2, nombre: 'admin' },
  SUPERADMIN: { id: 3, nombre: 'superadmin' },
  DIRECTIVO: { id: 4, nombre: 'directivo' },
} as const;

export const PERMISOS = {
  VER_MOVIMIENTOS: 'ver_movimientos',
  CREAR_MOVIMIENTOS: 'crear_movimientos',
  EDITAR_MOVIMIENTOS: 'editar_movimientos',
  ELIMINAR_MOVIMIENTOS: 'eliminar_movimientos',
  APROBAR_MOVIMIENTOS: 'aprobar_movimientos',
  AGREGAR_COMENTARIOS: 'agregar_comentarios',
  VER_PENDIENTES: 'ver_pendientes',
  CARGAR_PENDIENTES: 'cargar_pendientes',
  APROBAR_PENDIENTES: 'aprobar_pendientes',
  VER_SUCURSALES: 'ver_sucursales',
  GESTIONAR_SUCURSALES: 'gestionar_sucursales',
  VER_REPORTES: 'ver_reportes',
  GESTIONAR_USUARIOS: 'gestionar_usuarios',
  GESTIONAR_ROLES: 'gestionar_roles',
  VER_CONFIGURACION: 'ver_configuracion',
} as const;
