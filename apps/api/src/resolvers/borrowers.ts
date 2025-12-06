import type { GraphQLContext } from '@solufacil/graphql-schema'
import { BorrowerService } from '../services/BorrowerService'
import { authenticateUser } from '../middleware/auth'

export const borrowerResolvers = {
  Mutation: {
    createBorrower: async (
      _parent: unknown,
      args: {
        input: {
          personalData: {
            fullName: string
            clientCode?: string
            birthDate?: Date
            phones?: { number: string }[]
            addresses?: {
              street: string
              numberInterior?: string
              numberExterior?: string
              zipCode?: string
              locationId: string
            }[]
          }
        }
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const borrowerService = new BorrowerService(context.prisma)
      return borrowerService.create(args.input)
    },

    updateBorrower: async (
      _parent: unknown,
      args: {
        id: string
        input: {
          personalData?: {
            fullName?: string
            birthDate?: Date
          }
        }
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const borrowerService = new BorrowerService(context.prisma)
      return borrowerService.update(args.id, args.input)
    },
  },

  Borrower: {
    personalData: async (parent: { personalDataId: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.personalData.findUnique({
        where: { id: parent.personalDataId },
        include: {
          phones: true,
          addresses: {
            include: {
              location: {
                include: {
                  municipality: {
                    include: {
                      state: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    },

    loans: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.loan.findMany({
        where: { borrowerId: parent.id },
        orderBy: { signDate: 'desc' },
      })
    },
  },
}
