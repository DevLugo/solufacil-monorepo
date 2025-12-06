export const USER_ROLES = {
  ADMIN: 'ADMIN',
  NORMAL: 'NORMAL',
  CAPTURA: 'CAPTURA',
} as const

export type UserRoleType = (typeof USER_ROLES)[keyof typeof USER_ROLES]
