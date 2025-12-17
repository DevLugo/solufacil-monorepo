import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '@solufacil/graphql-schema'
import { EmployeeType } from '@solufacil/database'
import { EmployeeService } from '../services/EmployeeService'
import { authenticateUser, requireRole } from '../middleware/auth'
import { resolvePersonalData } from './helpers/personalDataResolver'

export const employeeResolvers = {
  Query: {
    employee: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const employeeService = new EmployeeService(context.prisma)
      return employeeService.findById(args.id)
    },

    employees: async (
      _parent: unknown,
      args: { type?: EmployeeType; routeId?: string },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const employeeService = new EmployeeService(context.prisma)
      return employeeService.findMany({
        type: args.type ?? undefined,
        routeId: args.routeId ?? undefined,
      })
    },
  },

  Mutation: {
    createEmployee: async (
      _parent: unknown,
      args: {
        input: {
          type: EmployeeType
          personalData: {
            fullName: string
            clientCode?: string
            birthDate?: Date
            phones?: { number: string }[]
            addresses?: {
              street: string
              interiorNumber?: string
              exteriorNumber?: string
              postalCode?: string
              location: string
            }[]
          }
          routeIds?: string[]
        }
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const employeeService = new EmployeeService(context.prisma)
      return employeeService.create(args.input)
    },

    updateEmployee: async (
      _parent: unknown,
      args: {
        id: string
        input: {
          type?: EmployeeType
          routeIds?: string[]
        }
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const employeeService = new EmployeeService(context.prisma)
      return employeeService.update(args.id, args.input)
    },

    promoteToLead: async (
      _parent: unknown,
      args: { employeeId: string },
      context: GraphQLContext
    ) => {
      authenticateUser(context)
      requireRole(context, ['ADMIN'])

      const employeeService = new EmployeeService(context.prisma)
      return employeeService.promoteToLead(args.employeeId)
    },
  },

  Employee: {
    personalData: async (parent: { personalData: string | null; personalDataRelation?: unknown }, _args: unknown, context: GraphQLContext) => {
      return resolvePersonalData(parent, context)
    },

    routes: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      const employee = await context.prisma.employee.findUnique({
        where: { id: parent.id },
        include: { routes: true },
      })
      return employee?.routes || []
    },

    loansGranted: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.loan.findMany({
        where: { grantor: parent.id },
        orderBy: { signDate: 'desc' },
        take: 20,
      })
    },

    loansManagedAsLead: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.loan.findMany({
        where: { lead: parent.id },
        orderBy: { signDate: 'desc' },
        take: 20,
      })
    },

    transactions: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.transaction.findMany({
        where: { lead: parent.id },
        orderBy: { date: 'desc' },
        take: 50,
      })
    },

    commissionPayments: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.commissionPayment.findMany({
        where: { employee: parent.id },
        orderBy: { createdAt: 'desc' },
      })
    },

    location: async (parent: { personalData: string }, _args: unknown, context: GraphQLContext) => {
      // Get location from first address of personalData
      const personalData = await context.prisma.personalData.findUnique({
        where: { id: parent.personalData },
        include: {
          addresses: {
            take: 1,
            include: {
              locationRelation: {
                include: {
                  municipalityRelation: {
                    include: {
                      stateRelation: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      const firstAddress = personalData?.addresses?.[0]
      if (!firstAddress?.locationRelation) {
        return null
      }

      // Map to GraphQL Location type
      const loc = firstAddress.locationRelation
      return {
        id: loc.id,
        name: loc.name,
        route: loc.route,
        municipality: loc.municipalityRelation
          ? {
              id: loc.municipalityRelation.id,
              name: loc.municipalityRelation.name,
              state: loc.municipalityRelation.stateRelation
                ? {
                    id: loc.municipalityRelation.stateRelation.id,
                    name: loc.municipalityRelation.stateRelation.name,
                  }
                : null,
            }
          : null,
      }
    },
  },
}
