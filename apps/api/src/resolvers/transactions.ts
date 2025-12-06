import type { GraphQLContext } from '@solufacil/graphql-schema'
import type { TransactionType } from '@solufacil/database'
import { TransactionService } from '../services/TransactionService'
import { authenticateUser } from '../middleware/auth'

export const transactionResolvers = {
  Query: {
    transactions: async (
      _parent: unknown,
      args: {
        type?: TransactionType
        routeId?: string
        accountId?: string
        fromDate?: Date
        toDate?: Date
        limit?: number
        offset?: number
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const transactionService = new TransactionService(context.prisma)
      const { transactions, totalCount } = await transactionService.findMany({
        type: args.type ?? undefined,
        routeId: args.routeId ?? undefined,
        accountId: args.accountId ?? undefined,
        fromDate: args.fromDate ?? undefined,
        toDate: args.toDate ?? undefined,
        limit: args.limit ?? undefined,
        offset: args.offset ?? undefined,
      })

      // Format as connection type
      const edges = transactions.map((transaction, index) => ({
        node: transaction,
        cursor: Buffer.from(`cursor:${(args.offset ?? 0) + index}`).toString('base64'),
      }))

      return {
        edges,
        totalCount,
        pageInfo: {
          hasNextPage: (args.offset ?? 0) + transactions.length < totalCount,
          hasPreviousPage: (args.offset ?? 0) > 0,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null,
        },
      }
    },
  },

  Mutation: {
    createTransaction: async (
      _parent: unknown,
      args: {
        input: {
          amount: string
          date: Date
          type: TransactionType
          incomeSource?: string
          expenseSource?: string
          sourceAccountId: string
          destinationAccountId?: string
          loanId?: string
          loanPaymentId?: string
          routeId?: string
          leadId?: string
        }
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const transactionService = new TransactionService(context.prisma)
      return transactionService.create(args.input)
    },

    transferBetweenAccounts: async (
      _parent: unknown,
      args: {
        input: {
          amount: string
          sourceAccountId: string
          destinationAccountId: string
          description?: string
        }
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const transactionService = new TransactionService(context.prisma)
      return transactionService.transferBetweenAccounts(args.input)
    },
  },

  Transaction: {
    loan: async (parent: { loanId?: string }, _args: unknown, context: GraphQLContext) => {
      if (!parent.loanId) return null
      return context.prisma.loan.findUnique({
        where: { id: parent.loanId },
      })
    },

    loanPayment: async (parent: { loanPaymentId?: string }, _args: unknown, context: GraphQLContext) => {
      if (!parent.loanPaymentId) return null
      return context.prisma.loanPayment.findUnique({
        where: { id: parent.loanPaymentId },
      })
    },

    sourceAccount: async (parent: { sourceAccountId: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.account.findUnique({
        where: { id: parent.sourceAccountId },
      })
    },

    destinationAccount: async (
      parent: { destinationAccountId?: string },
      _args: unknown,
      context: GraphQLContext
    ) => {
      if (!parent.destinationAccountId) return null
      return context.prisma.account.findUnique({
        where: { id: parent.destinationAccountId },
      })
    },

    route: async (parent: { routeId?: string }, _args: unknown, context: GraphQLContext) => {
      if (!parent.routeId) return null
      return context.prisma.route.findUnique({
        where: { id: parent.routeId },
      })
    },

    lead: async (parent: { leadId?: string }, _args: unknown, context: GraphQLContext) => {
      if (!parent.leadId) return null
      return context.prisma.employee.findUnique({
        where: { id: parent.leadId },
        include: {
          personalData: true,
        },
      })
    },
  },
}
