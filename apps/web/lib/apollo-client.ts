'use client'

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  type NormalizedCacheObject,
  Observable,
  type FetchResult,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { saveRedirectUrl } from '@/hooks/use-redirect-url'

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

// Shared promise for refresh token to handle race conditions
let refreshPromise: Promise<boolean> | null = null

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
  credentials: 'include',
})

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

// Function to refresh tokens
async function refreshTokens(): Promise<boolean> {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null

  if (!refreshToken) {
    return false
  }

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation RefreshToken($refreshToken: String!) {
            refreshToken(refreshToken: $refreshToken) {
              accessToken
              refreshToken
            }
          }
        `,
        variables: { refreshToken },
      }),
    })

    const result = await response.json()

    if (result.data?.refreshToken) {
      const { accessToken, refreshToken: newRefreshToken } = result.data.refreshToken
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', newRefreshToken)
      return true
    }

    return false
  } catch (error) {
    console.error('Failed to refresh token:', error)
    return false
  }
}

// Function to handle logout with redirect URL saving
function handleLogout() {
  if (typeof window === 'undefined') return

  // Save current URL for redirect after login
  const currentPath = window.location.pathname
  if (currentPath !== '/login' && !currentPath.startsWith('/login')) {
    saveRedirectUrl(currentPath)
  }

  // Clear tokens
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')

  // Redirect to login
  window.location.href = '/login'
}

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // Handle authentication errors - attempt refresh before logging
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        // Return an observable that will retry the request after refresh
        return new Observable<FetchResult>((observer) => {
          let subscription: { unsubscribe: () => void } | null = null

          // If there's already a refresh in progress, wait for it
          const doRefresh = refreshPromise || (refreshPromise = refreshTokens().finally(() => {
            refreshPromise = null
          }))

          doRefresh.then((success) => {
            if (success) {
              // Retry the request with new token
              subscription = forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              })
            } else {
              // Refresh failed, logout
              handleLogout()
              observer.error(err)
            }
          }).catch(() => {
            handleLogout()
            observer.error(err)
          })

          // Return cleanup function
          return () => {
            if (subscription) {
              subscription.unsubscribe()
            }
          }
        })
      }

      // Log non-auth errors
      console.error(
        `[GraphQL error]: Message: ${err.message}, Location: ${err.locations}, Path: ${err.path}`
      )
    }
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
  }
})

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        loans: {
          keyArgs: ['status', 'routeId', 'leadId', 'locationId', 'borrowerId', 'fromDate', 'toDate', 'limit', 'offset'],
          merge(existing, incoming) {
            return incoming
          },
        },
        transactions: {
          keyArgs: ['where', 'orderBy'],
          merge(existing, incoming) {
            return incoming
          },
        },
        accounts: {
          merge(existing, incoming) {
            return incoming
          },
        },
        routes: {
          merge(existing, incoming) {
            return incoming
          },
        },
      },
    },
    Loan: {
      keyFields: ['id'],
    },
    Transaction: {
      keyFields: ['id'],
    },
    Account: {
      keyFields: ['id'],
    },
    Route: {
      keyFields: ['id'],
    },
    Employee: {
      keyFields: ['id'],
    },
    Borrower: {
      keyFields: ['id'],
    },
    PersonalData: {
      keyFields: ['id'],
    },
  },
})

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined

function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: from([errorLink, authLink, httpLink]),
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  })
}

export function getApolloClient(): ApolloClient<NormalizedCacheObject> {
  const _apolloClient = apolloClient ?? createApolloClient()

  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient

  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient

  return _apolloClient
}

export function resetApolloClient(): void {
  apolloClient = undefined
}
