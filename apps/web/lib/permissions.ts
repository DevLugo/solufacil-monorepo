import { USER_ROLES, UserRoleType } from '@solufacil/shared'

// Grupos de roles reutilizables
export const ROLES = {
  SOLO_ADMIN: [USER_ROLES.ADMIN] as UserRoleType[],
  ADMIN_Y_CAPTURA: [USER_ROLES.ADMIN, USER_ROLES.CAPTURA] as UserRoleType[],
  ADMIN_Y_REVISOR: [USER_ROLES.ADMIN, USER_ROLES.DOCUMENT_REVIEWER] as UserRoleType[],
  OPERATIVOS: [USER_ROLES.ADMIN, USER_ROLES.NORMAL, USER_ROLES.CAPTURA] as UserRoleType[],
  TODOS: [
    USER_ROLES.ADMIN,
    USER_ROLES.NORMAL,
    USER_ROLES.CAPTURA,
    USER_ROLES.DOCUMENT_REVIEWER,
  ] as UserRoleType[],
}

// Permisos por ruta - fuente unica de verdad
export const PERMISOS_RUTAS: Record<string, UserRoleType[]> = {
  '/dashboard': ROLES.TODOS,
  '/historial-clientes': ROLES.TODOS,
  '/transacciones': ROLES.SOLO_ADMIN,
  '/listados/generar': ROLES.OPERATIVOS,
  '/documentos/cargar': ROLES.ADMIN_Y_REVISOR,
  '/reportes/financiero': ROLES.SOLO_ADMIN,
  '/reportes/cartera': ROLES.SOLO_ADMIN,
  '/reportes/limpieza-cartera': ROLES.SOLO_ADMIN,
  '/administrar/rutas': ROLES.SOLO_ADMIN,
  '/administrar/lideres/nuevo': ROLES.ADMIN_Y_CAPTURA,
  '/administrar/gastos': ROLES.SOLO_ADMIN,
}

// Etiquetas de rol para UI
export const ETIQUETAS_ROL: Record<UserRoleType, string> = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.NORMAL]: 'Usuario',
  [USER_ROLES.CAPTURA]: 'Captura',
  [USER_ROLES.DOCUMENT_REVIEWER]: 'Revisor de Documentos',
}

// Verifica si un rol tiene acceso a una ruta
export function tieneAcceso(rol: UserRoleType | undefined, ruta: string): boolean {
  if (!rol) return false

  const rolesPermitidos = PERMISOS_RUTAS[ruta]

  // Si la ruta no esta configurada, solo ADMIN tiene acceso
  if (!rolesPermitidos) return rol === USER_ROLES.ADMIN

  return rolesPermitidos.includes(rol)
}

// Obtiene los roles permitidos para una ruta (usado por sidebar)
export function obtenerRolesRuta(ruta: string): UserRoleType[] | undefined {
  return PERMISOS_RUTAS[ruta]
}

// Alias para compatibilidad (deprecado)
export const ROUTE_PERMISSIONS = PERMISOS_RUTAS
export const ROLE_LABELS = ETIQUETAS_ROL
export const canAccess = tieneAcceso
