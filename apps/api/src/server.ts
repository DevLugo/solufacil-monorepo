import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { typeDefs } from '@solufacil/graphql-schema'
import { resolvers } from './resolvers'
import { createContext } from './context'

async function startServer() {
  const app = express()

  // CORS configuration
  const corsOptions = {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL,
    ].filter(Boolean) as string[],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
  })

  await server.start()

  app.use(
    '/graphql',
    cors(corsOptions),
    express.json(),
    expressMiddleware(server, {
      context: createContext,
    })
  )

  const port = Number(process.env.PORT) || 4000

  app.listen(port, () => {
    console.log(`🚀 Apollo Server ready at http://localhost:${port}/graphql`)
    console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`)
    console.log(`🗄️  Database: Connected`)
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`🌐 CORS enabled for: ${corsOptions.origin.join(', ')}`)
  })
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})
