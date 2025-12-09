'use client'

import { useQuery } from '@apollo/client'
import { startOfDay, endOfDay } from 'date-fns'
import {
  LOANS_BY_DATE_LEAD_QUERY,
  LOAN_TYPES_QUERY,
  ACTIVE_LOANS_FOR_RENEWAL_QUERY,
} from '@/graphql/queries/transactions'
import { ACCOUNTS_QUERY } from '@/graphql/queries/transactions'
import type { Loan, LoanType, Account, PreviousLoan } from '../types'

interface UseCreditosQueriesParams {
  selectedDate: Date
  selectedLeadId?: string | null
  selectedRouteId?: string | null
}

export function useCreditosQueries({
  selectedDate,
  selectedLeadId,
  selectedRouteId,
}: UseCreditosQueriesParams) {
  // Query loans granted on the selected date for the selected lead
  const {
    data: loansData,
    loading: loansLoading,
    error: loansError,
    refetch: refetchLoans,
  } = useQuery(LOANS_BY_DATE_LEAD_QUERY, {
    variables: {
      fromDate: startOfDay(selectedDate).toISOString(),
      toDate: endOfDay(selectedDate).toISOString(),
      leadId: selectedLeadId,
    },
    skip: !selectedLeadId,
    fetchPolicy: 'no-cache', // Use no-cache to avoid conflicts with ACTIVE_LOANS_FOR_RENEWAL_QUERY which also uses 'loans' field
    notifyOnNetworkStatusChange: true,
  })

  // Log errors
  if (loansError) {
    console.error('[useCreditosQueries] Error fetching loans:', loansError)
  }

  // Query loan types
  const { data: loanTypesData, loading: loanTypesLoading } = useQuery(LOAN_TYPES_QUERY)

  // Query loans for the selected lead (filters by leadId on server)
  // Filter for active loans (pendingAmountStored > 0) is done client-side
  // Using 'no-cache' to avoid conflicts with LOANS_BY_DATE_LEAD_QUERY which uses same 'loans' field
  const { data: renewalLoansData, loading: renewalLoansLoading, error: renewalLoansError } = useQuery(
    ACTIVE_LOANS_FOR_RENEWAL_QUERY,
    {
      variables: {
        leadId: selectedLeadId,
      },
      skip: !selectedLeadId, // Don't fetch if no lead selected
      fetchPolicy: 'no-cache', // Completely bypass cache to avoid conflicts with other loans queries
      notifyOnNetworkStatusChange: true,
    }
  )

  // Log error if any
  if (renewalLoansError) {
    console.error('[useCreditosQueries] Error fetching loans:', renewalLoansError)
  }

  // Query accounts for the route
  const { data: accountsData, loading: accountsLoading } = useQuery(ACCOUNTS_QUERY, {
    variables: {
      routeId: selectedRouteId,
      type: 'OFFICE_CASH_FUND',
    },
    skip: !selectedRouteId,
  })

  // Extract and transform data
  const loansToday: Loan[] = loansData?.loans?.edges?.map((edge: { node: Loan }) => edge.node) || []
  const loanTypes: LoanType[] = loanTypesData?.loantypes || []

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[useCreditosQueries] Raw data:', {
      loansData,
      hasLoansData: !!loansData,
      hasEdges: !!loansData?.loans?.edges,
      edgesLength: loansData?.loans?.edges?.length,
      loansToday,
      loansTodayCount: loansToday.length,
      selectedLeadId,
      selectedDate: selectedDate.toISOString(),
    })
  }

  // Get all loans for the route
  const allLoansFromRoute: PreviousLoan[] =
    renewalLoansData?.loans?.edges?.map((edge: { node: PreviousLoan }) => edge.node) || []

  // Filter for ACTIVE loans (pendingAmountStored > 0 means there's still debt)
  // Server already filters by leadId, so all loans here are from the selected lead's location
  const loansForRenewal: PreviousLoan[] = allLoansFromRoute.filter((loan) => {
    const pendingAmount = parseFloat(loan.pendingAmountStored || '0')
    return pendingAmount > 0
  })

  const accounts: Account[] = accountsData?.accounts || []

  // Get default account (first one)
  const defaultAccount = accounts[0] || null

  return {
    loansToday,
    loansLoading,
    refetchLoans,
    loanTypes,
    loanTypesLoading,
    loansForRenewal,
    renewalLoansLoading,
    accounts,
    accountsLoading,
    defaultAccount,
  }
}
