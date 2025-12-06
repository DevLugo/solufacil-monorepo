import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '@solufacil/graphql-schema'
import { UserRole } from '@solufacil/database'
import { UserService } from '../services/UserService'
import { authenticateUser, requireRole } from '../middleware/auth'

export const userResolvers = {
  Query: {
    user: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const userService = new UserService(context.prisma)
      const user = await userService.findByIdWithEmployee(args.id)

      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return user
    },

    users: async (
      _parent: unknown,
      args: { role?: UserRole; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      authenticateUser(context)
      requireRole(context, [UserRole.ADMIN])

      const userService = new UserService(context.prisma)
      return userService.findMany({
        role: args.role ?? undefined,
        limit: args.limit ?? undefined,
        offset: args.offset ?? undefined,
      })
    },
  },

  Mutation: {
    createUser: async (
      _parent: unknown,
      args: { input: { email: string; password: string; role: UserRole } },
      context: GraphQLContext
    ) => {
      authenticateUser(context)
      requireRole(context, [UserRole.ADMIN])

      const userService = new UserService(context.prisma)
      return userService.create(args.input)
    },

    updateUser: async (
      _parent: unknown,
      args: { id: string; input: { email?: string; role?: UserRole } },
      context: GraphQLContext
    ) => {
      authenticateUser(context)
      requireRole(context, [UserRole.ADMIN])

      const userService = new UserService(context.prisma)
      return userService.update(args.id, args.input)
    },

    deleteUser: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      authenticateUser(context)
      requireRole(context, [UserRole.ADMIN])

      const userService = new UserService(context.prisma)
      return userService.delete(args.id)
    },
  },

  User: {
    employee: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.employee.findUnique({
        where: { user: parent.id },
        include: {
          personalDataRelation: true,
        },
      })
    },
  },
}
