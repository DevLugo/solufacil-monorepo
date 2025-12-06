import type { GraphQLContext } from '@solufacil/graphql-schema'
import { LoanStatus } from '@solufacil/database'
import { LoanService } from '../services/LoanService'
import { authenticateUser } from '../middleware/auth'

export const loanResolvers = {
  Query: {
    loan: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const loanService = new LoanService(context.prisma)
      return loanService.findById(args.id)
    },

    loans: async (
      _parent: unknown,
      args: {
        status?: LoanStatus
        routeId?: string
        leadId?: string
        borrowerId?: string
        fromDate?: Date
        toDate?: Date
        limit?: number
        offset?: number
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const loanService = new LoanService(context.prisma)
      const { loans, totalCount } = await loanService.findMany({
        status: args.status ?? undefined,
        routeId: args.routeId ?? undefined,
        leadId: args.leadId ?? undefined,
        borrowerId: args.borrowerId ?? undefined,
        fromDate: args.fromDate ?? undefined,
        toDate: args.toDate ?? undefined,
        limit: args.limit ?? undefined,
        offset: args.offset ?? undefined,
      })

      // Format as connection type
      const edges = loans.map((loan, index) => ({
        node: loan,
        cursor: Buffer.from(`cursor:${args.offset ?? 0 + index}`).toString('base64'),
      }))

      return {
        edges,
        totalCount,
        pageInfo: {
          hasNextPage: (args.offset ?? 0) + loans.length < totalCount,
          hasPreviousPage: (args.offset ?? 0) > 0,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null,
        },
      }
    },

    loansForBadDebt: async (
      _parent: unknown,
      args: { routeId?: string },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const loanService = new LoanService(context.prisma)
      return loanService.findForBadDebt(args.routeId ?? undefined)
    },
  },

  Mutation: {
    createLoan: async (
      _parent: unknown,
      args: {
        input: {
          requestedAmount: string
          amountGived: string
          signDate: Date
          borrowerId: string
          loantypeId: string
          grantorId: string
          leadId: string
          collateralIds?: string[]
          previousLoanId?: string
        }
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const loanService = new LoanService(context.prisma)
      return loanService.create(args.input)
    },

    updateLoan: async (
      _parent: unknown,
      args: {
        id: string
        input: {
          amountGived?: string
          badDebtDate?: Date
          isDeceased?: boolean
          leadId?: string
          status?: LoanStatus
        }
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const loanService = new LoanService(context.prisma)
      return loanService.update(args.id, args.input)
    },

    renewLoan: async (
      _parent: unknown,
      args: {
        loanId: string
        input: {
          requestedAmount: string
          amountGived: string
          signDate: Date
          loantypeId: string
        }
      },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const loanService = new LoanService(context.prisma)
      return loanService.renewLoan(args.loanId, args.input)
    },

    markLoanAsBadDebt: async (
      _parent: unknown,
      args: { loanId: string; badDebtDate: Date },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const loanService = new LoanService(context.prisma)
      return loanService.markAsBadDebt(args.loanId, args.badDebtDate)
    },

    finishLoan: async (
      _parent: unknown,
      args: { loanId: string },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const loanService = new LoanService(context.prisma)
      return loanService.finishLoan(args.loanId)
    },

    cancelLoan: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      authenticateUser(context)

      const loanService = new LoanService(context.prisma)
      return loanService.cancelLoan(args.id)
    },
  },

  Loan: {
    borrower: async (parent: { borrowerId: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.borrower.findUnique({
        where: { id: parent.borrowerId },
        include: {
          personalData: {
            include: {
              phones: true,
            },
          },
        },
      })
    },

    loantype: async (parent: { loantypeId: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.loantype.findUnique({
        where: { id: parent.loantypeId },
      })
    },

    grantor: async (parent: { grantorId: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.employee.findUnique({
        where: { id: parent.grantorId },
        include: {
          personalData: true,
        },
      })
    },

    lead: async (parent: { leadId: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.employee.findUnique({
        where: { id: parent.leadId },
        include: {
          personalData: true,
          routes: true,
        },
      })
    },

    collaterals: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      const loan = await context.prisma.loan.findUnique({
        where: { id: parent.id },
        include: { collaterals: true },
      })
      return loan?.collaterals || []
    },

    payments: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.loanPayment.findMany({
        where: { loanId: parent.id },
        orderBy: { receivedAt: 'desc' },
      })
    },

    transactions: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.transaction.findMany({
        where: { loanId: parent.id },
        orderBy: { date: 'desc' },
      })
    },

    documentPhotos: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.documentPhoto.findMany({
        where: { loanId: parent.id },
      })
    },

    previousLoan: async (parent: { previousLoanId?: string }, _args: unknown, context: GraphQLContext) => {
      if (!parent.previousLoanId) return null
      return context.prisma.loan.findUnique({
        where: { id: parent.previousLoanId },
      })
    },

    renewedBy: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.loan.findFirst({
        where: { previousLoanId: parent.id },
      })
    },
  },
}
