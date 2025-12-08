import type { PrismaClient, LoanPayment, PaymentMethod, Prisma } from '@solufacil/database'
import { Decimal } from 'decimal.js'

export class PaymentRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.loanPayment.findUnique({
      where: { id },
      include: {
        loanRelation: {
          include: {
            borrowerRelation: {
              include: {
                personalDataRelation: true,
              },
            },
            loantypeRelation: true,
          },
        },
        transactions: true,
        leadPaymentReceivedRelation: true,
      },
    })
  }

  async findByLoanId(loanId: string, options?: { limit?: number; offset?: number }) {
    return this.prisma.loanPayment.findMany({
      where: { loan: loanId },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { receivedAt: 'desc' },
      include: {
        transactions: true,
      },
    })
  }

  async create(
    data: {
      amount: Decimal
      comission?: Decimal
      receivedAt: Date
      paymentMethod: PaymentMethod
      type?: string
      loan: string
      leadPaymentReceived?: string
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || this.prisma
    return client.loanPayment.create({
      data: {
        amount: data.amount,
        comission: data.comission || new Decimal(0),
        receivedAt: data.receivedAt,
        paymentMethod: data.paymentMethod,
        type: data.type || 'PAYMENT',
        loan: data.loan,
        leadPaymentReceived: data.leadPaymentReceived,
      },
      include: {
        loanRelation: true,
        transactions: true,
      },
    })
  }

  async createLeadPaymentReceived(data: {
    expectedAmount: Decimal
    paidAmount: Decimal
    cashPaidAmount: Decimal
    bankPaidAmount: Decimal
    falcoAmount?: Decimal
    paymentStatus: string
    lead: string
    agent: string
  }) {
    return this.prisma.leadPaymentReceived.create({
      data: {
        expectedAmount: data.expectedAmount,
        paidAmount: data.paidAmount,
        cashPaidAmount: data.cashPaidAmount,
        bankPaidAmount: data.bankPaidAmount,
        falcoAmount: data.falcoAmount || new Decimal(0),
        paymentStatus: data.paymentStatus,
        lead: data.lead,
        agent: data.agent,
      },
      include: {
        leadRelation: {
          include: {
            personalDataRelation: true,
          },
        },
        agentRelation: {
          include: {
            personalDataRelation: true,
          },
        },
        payments: true,
      },
    })
  }
}
