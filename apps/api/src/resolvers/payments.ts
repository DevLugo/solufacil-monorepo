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
    loan: async (parent: { loanId: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.loan.findUnique({
        where: { id: parent.loanId },
      })
    },

    leadPaymentReceived: async (
      parent: { leadPaymentReceivedId?: string },
      _args: unknown,
      context: GraphQLContext
    ) => {
      if (!parent.leadPaymentReceivedId) return null
      return context.prisma.leadPaymentReceived.findUnique({
        where: { id: parent.leadPaymentReceivedId },
      })
    },

    transactions: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.transaction.findMany({
        where: { loanPaymentId: parent.id },
      })
    },
  },

  LeadPaymentReceived: {
    lead: async (parent: { leadId: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.employee.findUnique({
        where: { id: parent.leadId },
        include: {
          personalData: true,
        },
      })
    },

    agent: async (parent: { agentId: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.employee.findUnique({
        where: { id: parent.agentId },
        include: {
          personalData: true,
        },
      })
    },

    payments: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.loanPayment.findMany({
        where: { leadPaymentReceivedId: parent.id },
      })
    },
  },
}
