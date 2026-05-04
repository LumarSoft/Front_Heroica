export const ROLES = {
  ADMIN: { id: 2, nombre: 'admin' },
  SUPERADMIN: { id: 3, nombre: 'superadmin' },
  DIRECTIVO: { id: 4, nombre: 'directivo' },
} as const

export const PERMISOS = {
  // Movimientos de caja
  VER_MOVIMIENTOS: 'ver_movimientos',
  CREAR_MOVIMIENTOS: 'crear_movimientos',
  EDITAR_MOVIMIENTOS: 'editar_movimientos',
  ELIMINAR_MOVIMIENTOS: 'eliminar_movimientos',
  APROBAR_MOVIMIENTOS: 'aprobar_movimientos',

  // Pagos pendientes
  VER_PENDIENTES: 'ver_pendientes',
  CARGAR_PENDIENTES: 'cargar_pendientes',
  APROBAR_PENDIENTES: 'aprobar_pendientes',

  // Sucursales
  VER_SUCURSALES: 'ver_sucursales',
  GESTIONAR_SUCURSALES: 'gestionar_sucursales',

  // Reportes
  VER_REPORTES: 'ver_reportes',

  // Configuración
  VER_CONFIGURACION: 'ver_configuracion',
  GESTIONAR_USUARIOS: 'gestionar_usuarios',
  GESTIONAR_ROLES: 'gestionar_roles',

  // RRHH — Personal / Legajos
  VER_PERSONAL: 'ver_personal',
  CREAR_PERSONAL: 'crear_personal',
  GESTIONAR_PERSONAL: 'gestionar_personal',
  ELIMINAR_PERSONAL: 'eliminar_personal',

  // RRHH — Áreas
  VER_AREAS: 'ver_areas',
  GESTIONAR_AREAS: 'gestionar_areas',

  // RRHH — Puestos
  VER_PUESTOS: 'ver_puestos',
  GESTIONAR_PUESTOS: 'gestionar_puestos',

  // RRHH — Escalas salariales
  VER_ESCALAS: 'ver_escalas',
  GESTIONAR_ESCALAS: 'gestionar_escalas',

  // RRHH — Incentivos y premios
  VER_INCENTIVOS: 'ver_incentivos',
  GESTIONAR_INCENTIVOS: 'gestionar_incentivos',

  // RRHH — Calendario
  VER_CALENDARIO: 'ver_calendario',
  GESTIONAR_CALENDARIO: 'gestionar_calendario',

  // RRHH — Solicitudes
  VER_SOLICITUDES: 'ver_solicitudes',
  CREAR_SOLICITUDES: 'crear_solicitudes',
  EDITAR_SOLICITUDES: 'editar_solicitudes',
  CANCELAR_SOLICITUDES: 'cancelar_solicitudes',
  APROBAR_SOLICITUDES: 'aprobar_solicitudes',
  VER_HISTORIAL_SOLICITUDES_GLOBAL: 'ver_historial_solicitudes_global',
  VER_SOLICITUDES_TODAS_SUCURSALES: 'ver_solicitudes_todas_sucursales',
} as const
