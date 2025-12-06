import type { PrismaClient, Loan, LoanStatus, Prisma } from '@solufacil/database'
import { Decimal } from 'decimal.js'

export class LoanRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.loan.findUnique({
      where: { id },
      include: {
        borrower: {
          include: {
            personalData: {
              include: {
                phones: true,
                addresses: {
                  include: {
                    location: true,
                  },
                },
              },
            },
          },
        },
        loantype: true,
        grantor: {
          include: {
            personalData: true,
          },
        },
        lead: {
          include: {
            personalData: true,
            routes: true,
          },
        },
        collaterals: true,
        payments: {
          orderBy: { receivedAt: 'desc' },
          take: 20,
        },
        previousLoan: true,
        renewedBy: true,
      },
    })
  }

  async findMany(options?: {
    status?: LoanStatus
    routeId?: string
    leadId?: string
    borrowerId?: string
    fromDate?: Date
    toDate?: Date
    limit?: number
    offset?: number
  }) {
    const where: Prisma.LoanWhereInput = {}

    if (options?.status) {
      where.status = options.status
    }

    if (options?.leadId) {
      where.leadId = options.leadId
    }

    if (options?.borrowerId) {
      where.borrowerId = options.borrowerId
    }

    if (options?.routeId) {
      where.snapshotRouteId = options.routeId
    }

    if (options?.fromDate || options?.toDate) {
      where.signDate = {}
      if (options?.fromDate) {
        where.signDate.gte = options.fromDate
      }
      if (options?.toDate) {
        where.signDate.lte = options.toDate
      }
    }

    const [loans, totalCount] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
        orderBy: { signDate: 'desc' },
        include: {
          borrower: {
            include: {
              personalData: true,
            },
          },
          loantype: true,
          lead: {
            include: {
              personalData: true,
            },
          },
        },
      }),
      this.prisma.loan.count({ where }),
    ])

    return { loans, totalCount }
  }

  async create(data: {
    requestedAmount: Decimal
    amountGived: Decimal
    signDate: Date
    profitAmount: Decimal
    totalDebtAcquired: Decimal
    expectedWeeklyPayment: Decimal
    pendingAmountStored: Decimal
    borrowerId: string
    loantypeId: string
    grantorId: string
    leadId: string
    collateralIds?: string[]
    previousLoanId?: string
    snapshotLeadId?: string
    snapshotLeadName?: string
    snapshotLeadAssignedAt?: Date
    snapshotRouteId?: string
    snapshotRouteName?: string
  }) {
    return this.prisma.loan.create({
      data: {
        requestedAmount: data.requestedAmount,
        amountGived: data.amountGived,
        signDate: data.signDate,
        profitAmount: data.profitAmount,
        totalDebtAcquired: data.totalDebtAcquired,
        expectedWeeklyPayment: data.expectedWeeklyPayment,
        pendingAmountStored: data.pendingAmountStored,
        borrowerId: data.borrowerId,
        loantypeId: data.loantypeId,
        grantorId: data.grantorId,
        leadId: data.leadId,
        previousLoanId: data.previousLoanId,
        snapshotLeadId: data.snapshotLeadId,
        snapshotLeadName: data.snapshotLeadName,
        snapshotLeadAssignedAt: data.snapshotLeadAssignedAt,
        snapshotRouteId: data.snapshotRouteId,
        snapshotRouteName: data.snapshotRouteName,
        collaterals: data.collateralIds
          ? { connect: data.collateralIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        borrower: {
          include: {
            personalData: true,
          },
        },
        loantype: true,
        grantor: {
          include: {
            personalData: true,
          },
        },
        lead: {
          include: {
            personalData: true,
          },
        },
        collaterals: true,
      },
    })
  }

  async update(
    id: string,
    data: {
      amountGived?: Decimal
      badDebtDate?: Date | null
      isDeceased?: boolean
      leadId?: string
      status?: LoanStatus
      totalPaid?: Decimal
      pendingAmountStored?: Decimal
      finishedDate?: Date | null
      comissionAmount?: Decimal
    }
  ) {
    return this.prisma.loan.update({
      where: { id },
      data,
      include: {
        borrower: {
          include: {
            personalData: true,
          },
        },
        loantype: true,
        lead: {
          include: {
            personalData: true,
          },
        },
      },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.loan.count({
      where: { id },
    })
    return count > 0
  }

  async findActiveByBorrowerId(borrowerId: string) {
    return this.prisma.loan.findFirst({
      where: {
        borrowerId,
        status: 'ACTIVE',
      },
    })
  }

  async findForBadDebt(routeId?: string) {
    return this.prisma.loan.findMany({
      where: {
        badDebtDate: { not: null },
        ...(routeId ? { snapshotRouteId: routeId } : {}),
      },
      include: {
        borrower: {
          include: {
            personalData: true,
          },
        },
        lead: {
          include: {
            personalData: true,
          },
        },
      },
      orderBy: { badDebtDate: 'desc' },
    })
  }
}
