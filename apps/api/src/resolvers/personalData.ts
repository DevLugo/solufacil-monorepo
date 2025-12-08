import type { GraphQLContext } from '@solufacil/graphql-schema'

// Resolver para mapear campos de Prisma a GraphQL para PersonalData y Address
export const personalDataResolvers = {
  PersonalData: {
    // Los phones y addresses ya vienen incluidos normalmente
    employee: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.employee.findFirst({
        where: { personalData: parent.id },
      })
    },

    borrower: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.borrower.findFirst({
        where: { personalData: parent.id },
      })
    },
  },

  Address: {
    // Mapear locationRelation de Prisma a location de GraphQL
    location: async (parent: { locationRelation?: unknown; location?: string }, _args: unknown, context: GraphQLContext) => {
      // Si locationRelation ya está incluido, devolverlo
      if (parent.locationRelation) {
        return parent.locationRelation
      }
      // Si no está incluido pero tenemos el ID, buscarlo
      if (parent.location) {
        return context.prisma.location.findUnique({
          where: { id: parent.location },
          include: {
            municipalityRelation: {
              include: {
                stateRelation: true,
              },
            },
          },
        })
      }
      // No debería llegar aquí ya que location es requerido
      return null
    },

    personalData: async (parent: { personalData: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.personalData.findUnique({
        where: { id: parent.personalData },
      })
    },
  },

  Phone: {
    personalData: async (parent: { personalData: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.personalData.findUnique({
        where: { id: parent.personalData },
      })
    },
  },
}
