import type { PrismaClient, Transaction, TransactionType, Prisma } from '@solufacil/database'
import { Decimal } from 'decimal.js'

export class TransactionRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: {
        sourceAccount: true,
        destinationAccount: true,
        loan: true,
        loanPayment: true,
        route: true,
        lead: {
          include: {
            personalData: true,
          },
        },
      },
    })
  }

  async findMany(options?: {
    type?: TransactionType
    routeId?: string
    accountId?: string
    fromDate?: Date
    toDate?: Date
    limit?: number
    offset?: number
  }) {
    const where: Prisma.TransactionWhereInput = {}

    if (options?.type) {
      where.type = options.type
    }

    if (options?.routeId) {
      where.routeId = options.routeId
    }

    if (options?.accountId) {
      where.OR = [
        { sourceAccountId: options.accountId },
        { destinationAccountId: options.accountId },
      ]
    }

    if (options?.fromDate || options?.toDate) {
      where.date = {}
      if (options?.fromDate) {
        where.date.gte = options.fromDate
      }
      if (options?.toDate) {
        where.date.lte = options.toDate
      }
    }

    const [transactions, totalCount] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
        orderBy: { date: 'desc' },
        include: {
          sourceAccount: true,
          destinationAccount: true,
          loan: true,
          lead: {
            include: {
              personalData: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ])

    return { transactions, totalCount }
  }

  async create(
    data: {
      amount: Decimal
      date: Date
      type: TransactionType
      incomeSource?: string
      expenseSource?: string
      profitAmount?: Decimal
      returnToCapital?: Decimal
      sourceAccountId: string
      destinationAccountId?: string
      loanId?: string
      loanPaymentId?: string
      routeId?: string
      leadId?: string
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || this.prisma
    return client.transaction.create({
      data: {
        amount: data.amount,
        date: data.date,
        type: data.type,
        incomeSource: data.incomeSource,
        expenseSource: data.expenseSource,
        profitAmount: data.profitAmount,
        returnToCapital: data.returnToCapital,
        sourceAccountId: data.sourceAccountId,
        destinationAccountId: data.destinationAccountId,
        loanId: data.loanId,
        loanPaymentId: data.loanPaymentId,
        routeId: data.routeId,
        leadId: data.leadId,
      },
      include: {
        sourceAccount: true,
        destinationAccount: true,
      },
    })
  }
}
