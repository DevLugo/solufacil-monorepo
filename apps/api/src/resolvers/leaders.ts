import type { GraphQLContext } from '@solufacil/graphql-schema'
import { LeaderService } from '../services/LeaderService'
import { authenticateUser } from '../middleware/auth'

export const leadersResolvers = {
  Query: {
    checkExistingLeader: async (
      _parent: unknown,
      args: { locationId: string },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const leaderService = new LeaderService(context.prisma)
      return leaderService.checkExistingLeader(args.locationId)
    },
  },

  Mutation: {
    createNewLeader: async (
      _parent: unknown,
      args: {
        input: {
          fullName: string
          birthDate?: string
          phone?: string
          locationId: string
          routeId: string
          replaceExisting?: boolean
        }
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const leaderService = new LeaderService(context.prisma)

      // Convertir birthDate de string a Date si está presente
      const birthDate = args.input.birthDate ? new Date(args.input.birthDate) : undefined

      return leaderService.createNewLeader({
        ...args.input,
        birthDate
      })
    },
  },
}
