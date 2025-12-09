'use client'

import { useQuery } from '@apollo/client'
import { startOfDay, endOfDay } from 'date-fns'
import { ACCOUNTS_QUERY, TRANSFERS_BY_DATE_QUERY } from '@/graphql/queries/transactions'
import type { Account, Transfer } from '../types'

interface UseTransferQueriesParams {
  selectedRouteId: string | null
  selectedDate: Date
}

interface UseTransferQueriesResult {
  transfers: Transfer[]
  accounts: Account[]
  transfersLoading: boolean
  accountsLoading: boolean
  refetchTransfers: () => void
}

export function useTransferQueries({
  selectedRouteId,
  selectedDate,
}: UseTransferQueriesParams): UseTransferQueriesResult {
  // Query para obtener transfers del día
  const {
    data: transfersData,
    loading: transfersLoading,
    refetch: refetchTransfers,
  } = useQuery(TRANSFERS_BY_DATE_QUERY, {
    variables: {
      fromDate: startOfDay(selectedDate).toISOString(),
      toDate: endOfDay(selectedDate).toISOString(),
      routeId: selectedRouteId,
    },
    skip: !selectedRouteId,
    fetchPolicy: 'cache-and-network',
  })

  // Query para obtener las cuentas de la ruta
  const { data: accountsData, loading: accountsLoading } = useQuery(ACCOUNTS_QUERY, {
    variables: { routeId: selectedRouteId },
    skip: !selectedRouteId,
    fetchPolicy: 'cache-and-network',
  })

  const transfers: Transfer[] =
    transfersData?.transactions?.edges?.map((edge: { node: Transfer }) => edge.node) || []

  const accounts: Account[] = accountsData?.accounts || []

  return {
    transfers,
    accounts,
    transfersLoading,
    accountsLoading,
    refetchTransfers,
  }
}
