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
        where: { personalDataId: parent.id },
      })
    },
  },

  Address: {
    // Mapear locationRelation de Prisma a location de GraphQL
    location: (parent: { locationRelation?: unknown; location?: string }) => {
      // Si locationRelation ya está incluido, devolverlo
      if (parent.locationRelation) {
        return parent.locationRelation
      }
      // Si no, devolver null (será resuelto por el DataLoader si es necesario)
      return null
    },

    personalData: async (parent: { personalDataId: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.personalData.findUnique({
        where: { id: parent.personalDataId },
      })
    },
  },

  Phone: {
    personalData: async (parent: { personalDataId: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.personalData.findUnique({
        where: { id: parent.personalDataId },
      })
    },
  },
}
