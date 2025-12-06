'use client'

import { ApolloProvider } from '@apollo/client'
import { ThemeProvider } from 'next-themes'
import { getApolloClient } from '@/lib/apollo-client'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const apolloClient = getApolloClient()

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </ApolloProvider>
  )
}
