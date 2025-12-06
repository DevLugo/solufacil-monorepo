import type { PrismaClient, LoanPayment, PaymentMethod, Prisma } from '@solufacil/database'
import { Decimal } from 'decimal.js'

export class PaymentRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.loanPayment.findUnique({
      where: { id },
      include: {
        loan: {
          include: {
            borrower: {
              include: {
                personalDataRelation: true,
              },
            },
            loantype: true,
          },
        },
        transactions: true,
        leadPaymentReceived: true,
      },
    })
  }

  async findByLoanId(loanId: string, options?: { limit?: number; offset?: number }) {
    return this.prisma.loanPayment.findMany({
      where: { loanId },
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
      loanId: string
      leadPaymentReceivedId?: string
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
        loanId: data.loanId,
        leadPaymentReceivedId: data.leadPaymentReceivedId,
      },
      include: {
        loan: true,
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
    leadId: string
    agentId: string
  }) {
    return this.prisma.leadPaymentReceived.create({
      data: {
        expectedAmount: data.expectedAmount,
        paidAmount: data.paidAmount,
        cashPaidAmount: data.cashPaidAmount,
        bankPaidAmount: data.bankPaidAmount,
        falcoAmount: data.falcoAmount || new Decimal(0),
        paymentStatus: data.paymentStatus,
        leadId: data.leadId,
        agentId: data.agentId,
      },
      include: {
        lead: {
          include: {
            personalDataRelation: true,
          },
        },
        agent: {
          include: {
            personalDataRelation: true,
          },
        },
        payments: true,
      },
    })
  }
}
