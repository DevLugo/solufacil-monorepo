/**
 * Interfaz para snapshot histórico de préstamo
 */
export interface LoanSnapshot {
  snapshotLeadId: string
  snapshotLeadAssignedAt: Date
  snapshotRouteId: string | null
  snapshotRouteName: string | null
}

/**
 * Crea un snapshot de los datos históricos del préstamo
 * Este snapshot preserva quién era el líder y la ruta al momento del desembolso
 */
export function createLoanSnapshot(
  leadId: string,
  leadName: string,
  routeId: string | null,
  routeName: string | null
): LoanSnapshot {
  return {
    snapshotLeadId: leadId,
    snapshotLeadAssignedAt: new Date(),
    snapshotRouteId: routeId,
    snapshotRouteName: routeName,
  }
}
