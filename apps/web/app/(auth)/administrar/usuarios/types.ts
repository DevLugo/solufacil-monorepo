import { ROLE_LABELS, ROLE_COLORS, EMPLOYEE_TYPE_LABELS } from '@solufacil/shared'

export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'NORMAL' | 'CAPTURA' | 'DOCUMENT_REVIEWER'
  employee?: {
    id: string
    type: 'ROUTE_LEAD' | 'LEAD' | 'ROUTE_ASSISTENT'
    personalDataRelation?: {
      fullName: string
    }
    routes?: {
      id: string
      name: string
    }[]
  }
  telegramUser?: {
    id: string
    chatId: string
    name: string
    isActive: boolean
  }
  createdAt: string
}

export interface Employee {
  id: string
  type: 'ROUTE_LEAD' | 'LEAD' | 'ROUTE_ASSISTENT'
  personalData: {
    fullName: string
  }
  routes: {
    id: string
    name: string
  }[]
  user?: {
    id: string
  } | null
}

// Re-export from shared for convenience
export { ROLE_LABELS, ROLE_COLORS, EMPLOYEE_TYPE_LABELS }
