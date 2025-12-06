import type { GraphQLContext } from '@solufacil/graphql-schema'
import { RouteService } from '../services/RouteService'
import { authenticateUser, requireRole } from '../middleware/auth'

export const routeResolvers = {
  Query: {
    route: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const routeService = new RouteService(context.prisma)
      return routeService.findById(args.id)
    },

    routes: async (
      _parent: unknown,
      args: { isActive?: boolean },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const routeService = new RouteService(context.prisma)
      return routeService.findMany({
        isActive: args.isActive ?? undefined,
      })
    },

    locations: async (
      _parent: unknown,
      args: { routeId?: string },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const routeService = new RouteService(context.prisma)
      return routeService.findLocations(args.routeId ?? undefined)
    },
  },

  Mutation: {
    createRoute: async (
      _parent: unknown,
      args: { input: { name: string } },
      context: GraphQLContext
    ) => {
      authenticateUser(context)
      requireRole(context, ['ADMIN'])

      const routeService = new RouteService(context.prisma)
      return routeService.create(args.input)
    },

    updateRoute: async (
      _parent: unknown,
      args: {
        id: string
        input: { name?: string; isActive?: boolean }
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)
      requireRole(context, ['ADMIN'])

      const routeService = new RouteService(context.prisma)
      return routeService.update(args.id, args.input)
    },
  },

  Route: {
    isActive: (parent: { isActive?: boolean | null }) => {
      return parent.isActive ?? true
    },

    employees: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      const route = await context.prisma.route.findUnique({
        where: { id: parent.id },
        include: {
          employees: {
            include: {
              personalDataRelation: true,
            },
          },
        },
      })
      return route?.employees || []
    },

    accounts: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      const route = await context.prisma.route.findUnique({
        where: { id: parent.id },
        include: { accounts: true },
      })
      return route?.accounts || []
    },

    transactions: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.transaction.findMany({
        where: { routeId: parent.id },
        orderBy: { date: 'desc' },
        take: 50,
      })
    },

    locations: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.location.findMany({
        where: { routeId: parent.id },
        include: {
          municipality: {
            include: {
              state: true,
            },
          },
        },
      })
    },
  },

  Location: {
    route: async (parent: { routeId?: string }, _args: unknown, context: GraphQLContext) => {
      if (!parent.routeId) return null
      return context.prisma.route.findUnique({
        where: { id: parent.routeId },
      })
    },

    municipality: async (parent: { municipalityId: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.municipality.findUnique({
        where: { id: parent.municipalityId },
        include: {
          state: true,
        },
      })
    },

    addresses: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.address.findMany({
        where: { locationId: parent.id },
      })
    },
  },

  Municipality: {
    state: async (parent: { stateId: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.state.findUnique({
        where: { id: parent.stateId },
      })
    },

    locations: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.location.findMany({
        where: { municipalityId: parent.id },
      })
    },
  },

  State: {
    municipalities: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.municipality.findMany({
        where: { stateId: parent.id },
      })
    },
  },
}
