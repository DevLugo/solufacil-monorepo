'use client'

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  type NormalizedCacheObject,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
  credentials: 'include',
})

const authLink = setContext((_, { headers }) => {
  // Get the authentication token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      console.error(
        `[GraphQL error]: Message: ${err.message}, Location: ${err.locations}, Path: ${err.path}`
      )

      // Handle authentication errors
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        // Clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      }
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
          keyArgs: ['where', 'orderBy'],
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
