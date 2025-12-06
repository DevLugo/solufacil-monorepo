import { gql } from '@apollo/client'

export const TRANSACTIONS_QUERY = gql`
  query Transactions(
    $type: TransactionType
    $routeId: ID
    $accountId: ID
    $fromDate: DateTime
    $toDate: DateTime
    $limit: Int
    $offset: Int
  ) {
    transactions(
      type: $type
      routeId: $routeId
      accountId: $accountId
      fromDate: $fromDate
      toDate: $toDate
      limit: $limit
      offset: $offset
    ) {
      edges {
        node {
          id
          amount
          date
          type
          incomeSource
          expenseSource
          profitAmount
          returnToCapital
          loan {
            id
            borrower {
              personalData {
                fullName
              }
            }
          }
          sourceAccount {
            id
            name
            type
          }
          destinationAccount {
            id
            name
            type
          }
          route {
            id
            name
          }
          lead {
            id
            personalData {
              fullName
            }
          }
          createdAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`

export const ACCOUNTS_QUERY = gql`
  query Accounts($routeId: ID, $type: AccountType) {
    accounts(routeId: $routeId, type: $type) {
      id
      name
      type
      amount
      accountBalance
      isActive
    }
  }
`

export const ROUTES_QUERY = gql`
  query Routes {
    routes {
      id
      name
      isActive
    }
  }
`
