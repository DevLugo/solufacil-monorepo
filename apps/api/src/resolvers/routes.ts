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

    routes: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      authenticateUser(context)

      const routeService = new RouteService(context.prisma)
      return routeService.findMany()
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
        input: { name?: string }
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
        where: { route: parent.id },
        orderBy: { date: 'desc' },
        take: 50,
      })
    },

    locations: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.location.findMany({
        where: { route: parent.id },
        include: {
          municipalityRelation: {
            include: {
              stateRelation: true,
            },
          },
        },
      })
    },
  },

  Location: {
    route: async (parent: { route?: string; routeRelation?: unknown }, _args: unknown, context: GraphQLContext) => {
      if (parent.routeRelation) return parent.routeRelation
      if (!parent.route) return null
      return context.prisma.route.findUnique({
        where: { id: parent.route },
      })
    },

    municipality: async (parent: { municipality: string; municipalityRelation?: unknown }, _args: unknown, context: GraphQLContext) => {
      // Si ya está incluida la relación, devolverla
      if (parent.municipalityRelation) return parent.municipalityRelation
      // Si no, buscarla
      return context.prisma.municipality.findUnique({
        where: { id: parent.municipality },
        include: {
          stateRelation: true,
        },
      })
    },

    addresses: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.address.findMany({
        where: { location: parent.id },
      })
    },
  },

  Municipality: {
    state: async (parent: { state: string; stateRelation?: unknown }, _args: unknown, context: GraphQLContext) => {
      // Si ya está incluida la relación, devolverla
      if (parent.stateRelation) return parent.stateRelation
      // Si no, buscarla
      return context.prisma.state.findUnique({
        where: { id: parent.state },
      })
    },

    locations: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.location.findMany({
        where: { municipality: parent.id },
      })
    },
  },

  State: {
    municipalities: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.municipality.findMany({
        where: { state: parent.id },
      })
    },
  },
}
