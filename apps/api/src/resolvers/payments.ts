import type { GraphQLContext } from '@solufacil/graphql-schema'
import type { PaymentMethod } from '@solufacil/database'
import { PaymentService } from '../services/PaymentService'
import { authenticateUser } from '../middleware/auth'

export const paymentResolvers = {
  Query: {
    loanPayments: async (
      _parent: unknown,
      args: { loanId: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const paymentService = new PaymentService(context.prisma)
      return paymentService.findByLoanId(args.loanId, {
        limit: args.limit ?? undefined,
        offset: args.offset ?? undefined,
      })
    },
  },

  Mutation: {
    createLoanPayment: async (
      _parent: unknown,
      args: {
        input: {
          loanId: string
          amount: string
          comission?: string
          receivedAt: Date
          paymentMethod: PaymentMethod
        }
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const paymentService = new PaymentService(context.prisma)
      return paymentService.createLoanPayment(args.input)
    },

    createLeadPaymentReceived: async (
      _parent: unknown,
      args: {
        input: {
          leadId: string
          agentId: string
          expectedAmount: string
          paidAmount: string
          cashPaidAmount: string
          bankPaidAmount: string
          falcoAmount?: string
          payments: {
            loanId: string
            amount: string
            comission?: string
            paymentMethod: PaymentMethod
          }[]
        }
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const paymentService = new PaymentService(context.prisma)
      return paymentService.createLeadPaymentReceived(args.input)
    },
  },

  LoanPayment: {
    loan: async (parent: { loan: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.loan.findUnique({
        where: { id: parent.loan },
      })
    },

    leadPaymentReceived: async (
      parent: { leadPaymentReceived?: string },
      _args: unknown,
      context: GraphQLContext
    ) => {
      if (!parent.leadPaymentReceived) return null
      return context.prisma.leadPaymentReceived.findUnique({
        where: { id: parent.leadPaymentReceived },
      })
    },

    transactions: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.transaction.findMany({
        where: { loanPayment: parent.id },
      })
    },
  },

  LeadPaymentReceived: {
    lead: async (parent: { lead: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.employee.findUnique({
        where: { id: parent.lead },
        include: {
          personalDataRelation: true,
        },
      })
    },

    agent: async (parent: { agent: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.employee.findUnique({
        where: { id: parent.agent },
        include: {
          personalDataRelation: true,
        },
      })
    },

    payments: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.loanPayment.findMany({
        where: { leadPaymentReceived: parent.id },
      })
    },
  },
}
