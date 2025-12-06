import 'dotenv/config'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { typeDefs } from '@solufacil/graphql-schema'
import { resolvers } from './resolvers'
import { createContext } from './context'

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
  })

  const { url } = await startStandaloneServer(server, {
    context: createContext,
    listen: { port: Number(process.env.PORT) || 4000 },
  })

  console.log(`🚀 Apollo Server ready at ${url}`)
  console.log(`📊 GraphQL Playground: ${url}`)
  console.log(`🗄️  Database: Connected`)
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})
