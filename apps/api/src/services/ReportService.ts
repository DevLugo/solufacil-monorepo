import { Decimal } from 'decimal.js'
import type { PrismaClient, LoanStatus } from '@solufacil/database'

export interface FinancialSummary {
  activeLoans: number
  totalPortfolio: Decimal
  totalPaid: Decimal
  pendingAmount: Decimal
  averagePayment: Decimal
}

export interface WeeklyData {
  week: number
  date: Date
  loansGranted: number
  paymentsReceived: Decimal
  expectedPayments: Decimal
  recoveryRate: Decimal
}

export interface ComparisonData {
  previousMonth: FinancialSummary
  growth: Decimal
  trend: string
}

export interface PerformanceMetrics {
  recoveryRate: Decimal
  averageTicket: Decimal
  activeLoansCount: number
  finishedLoansCount: number
}

export interface FinancialReport {
  summary: FinancialSummary
  weeklyData: WeeklyData[]
  comparisonData: ComparisonData | null
  performanceMetrics: PerformanceMetrics
}

export interface BadDebtData {
  routeId: string
  routeName: string
  loanCount: number
  totalAmount: Decimal
}

export interface BadDebtSummary {
  totalLoans: number
  totalAmount: Decimal
  byRoute: BadDebtData[]
}

export class ReportService {
  constructor(private prisma: PrismaClient) {}

  async getFinancialReport(
    routeIds: string[],
    year: number,
    month: number
  ): Promise<FinancialReport> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    // Get loans for the specified routes and period
    const loans = await this.prisma.loan.findMany({
      where: {
        snapshotRouteId: { in: routeIds },
        signDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        payments: {
          where: {
            receivedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        loantype: true,
      },
    })

    // Calculate summary
    const activeLoans = await this.prisma.loan.count({
      where: {
        snapshotRouteId: { in: routeIds },
        status: 'ACTIVE',
      },
    })

    const loansWithAmounts = await this.prisma.loan.findMany({
      where: {
        snapshotRouteId: { in: routeIds },
        status: 'ACTIVE',
      },
      select: {
        totalDebtAcquired: true,
        totalPaid: true,
        pendingAmountStored: true,
      },
    })

    const totalPortfolio = loansWithAmounts.reduce(
      (acc, loan) => acc.plus(new Decimal(loan.totalDebtAcquired.toString())),
      new Decimal(0)
    )

    const totalPaid = loansWithAmounts.reduce(
      (acc, loan) => acc.plus(new Decimal(loan.totalPaid.toString())),
      new Decimal(0)
    )

    const pendingAmount = loansWithAmounts.reduce(
      (acc, loan) => acc.plus(new Decimal(loan.pendingAmountStored.toString())),
      new Decimal(0)
    )

    const averagePayment = activeLoans > 0
      ? totalPaid.dividedBy(activeLoans).toDecimalPlaces(2)
      : new Decimal(0)

    const summary: FinancialSummary = {
      activeLoans,
      totalPortfolio,
      totalPaid,
      pendingAmount,
      averagePayment,
    }

    // Calculate weekly data
    const weeklyData = await this.calculateWeeklyData(routeIds, year, month)

    // Calculate comparison with previous month
    const comparisonData = await this.getComparisonData(routeIds, year, month)

    // Calculate performance metrics
    const performanceMetrics = await this.calculatePerformanceMetrics(routeIds)

    return {
      summary,
      weeklyData,
      comparisonData,
      performanceMetrics,
    }
  }

  private async calculateWeeklyData(
    routeIds: string[],
    year: number,
    month: number
  ): Promise<WeeklyData[]> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    const weeklyData: WeeklyData[] = []

    let currentWeekStart = new Date(startDate)
    let weekNumber = 1

    while (currentWeekStart <= endDate) {
      const currentWeekEnd = new Date(currentWeekStart)
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6)

      if (currentWeekEnd > endDate) {
        currentWeekEnd.setTime(endDate.getTime())
      }

      // Loans granted this week
      const loansGranted = await this.prisma.loan.count({
        where: {
          snapshotRouteId: { in: routeIds },
          signDate: {
            gte: currentWeekStart,
            lte: currentWeekEnd,
          },
        },
      })

      // Payments received this week
      const payments = await this.prisma.loanPayment.findMany({
        where: {
          loan: {
            snapshotRouteId: { in: routeIds },
          },
          receivedAt: {
            gte: currentWeekStart,
            lte: currentWeekEnd,
          },
        },
        select: {
          amount: true,
        },
      })

      const paymentsReceived = payments.reduce(
        (acc, payment) => acc.plus(new Decimal(payment.amount.toString())),
        new Decimal(0)
      )

      // Expected payments (based on active loans' weekly payment)
      const activeLoans = await this.prisma.loan.findMany({
        where: {
          snapshotRouteId: { in: routeIds },
          status: 'ACTIVE',
          signDate: { lte: currentWeekEnd },
        },
        select: {
          expectedWeeklyPayment: true,
        },
      })

      const expectedPayments = activeLoans.reduce(
        (acc, loan) => acc.plus(new Decimal(loan.expectedWeeklyPayment.toString())),
        new Decimal(0)
      )

      const recoveryRate = expectedPayments.greaterThan(0)
        ? paymentsReceived.dividedBy(expectedPayments).times(100).toDecimalPlaces(2)
        : new Decimal(0)

      weeklyData.push({
        week: weekNumber,
        date: new Date(currentWeekStart),
        loansGranted,
        paymentsReceived,
        expectedPayments,
        recoveryRate,
      })

      currentWeekStart.setDate(currentWeekStart.getDate() + 7)
      weekNumber++
    }

    return weeklyData
  }

  private async getComparisonData(
    routeIds: string[],
    year: number,
    month: number
  ): Promise<ComparisonData | null> {
    // Get previous month
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    const prevStartDate = new Date(prevYear, prevMonth - 1, 1)
    const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59)

    const prevLoans = await this.prisma.loan.findMany({
      where: {
        snapshotRouteId: { in: routeIds },
        signDate: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
      select: {
        totalDebtAcquired: true,
        totalPaid: true,
        pendingAmountStored: true,
        status: true,
      },
    })

    if (prevLoans.length === 0) {
      return null
    }

    const prevActiveLoans = prevLoans.filter(l => l.status === 'ACTIVE').length
    const prevTotalPortfolio = prevLoans.reduce(
      (acc, loan) => acc.plus(new Decimal(loan.totalDebtAcquired.toString())),
      new Decimal(0)
    )
    const prevTotalPaid = prevLoans.reduce(
      (acc, loan) => acc.plus(new Decimal(loan.totalPaid.toString())),
      new Decimal(0)
    )
    const prevPendingAmount = prevLoans.reduce(
      (acc, loan) => acc.plus(new Decimal(loan.pendingAmountStored.toString())),
      new Decimal(0)
    )
    const prevAveragePayment = prevActiveLoans > 0
      ? prevTotalPaid.dividedBy(prevActiveLoans).toDecimalPlaces(2)
      : new Decimal(0)

    const previousMonth: FinancialSummary = {
      activeLoans: prevActiveLoans,
      totalPortfolio: prevTotalPortfolio,
      totalPaid: prevTotalPaid,
      pendingAmount: prevPendingAmount,
      averagePayment: prevAveragePayment,
    }

    // Calculate current month totals for comparison
    const currentStartDate = new Date(year, month - 1, 1)
    const currentEndDate = new Date(year, month, 0, 23, 59, 59)

    const currentLoans = await this.prisma.loan.findMany({
      where: {
        snapshotRouteId: { in: routeIds },
        signDate: {
          gte: currentStartDate,
          lte: currentEndDate,
        },
      },
      select: {
        totalDebtAcquired: true,
      },
    })

    const currentTotalPortfolio = currentLoans.reduce(
      (acc, loan) => acc.plus(new Decimal(loan.totalDebtAcquired.toString())),
      new Decimal(0)
    )

    const growth = prevTotalPortfolio.greaterThan(0)
      ? currentTotalPortfolio.minus(prevTotalPortfolio)
          .dividedBy(prevTotalPortfolio)
          .times(100)
          .toDecimalPlaces(2)
      : new Decimal(0)

    const trend = growth.greaterThan(0)
      ? 'UP'
      : growth.lessThan(0)
        ? 'DOWN'
        : 'STABLE'

    return {
      previousMonth,
      growth,
      trend,
    }
  }

  private async calculatePerformanceMetrics(
    routeIds: string[]
  ): Promise<PerformanceMetrics> {
    const activeLoansCount = await this.prisma.loan.count({
      where: {
        snapshotRouteId: { in: routeIds },
        status: 'ACTIVE',
      },
    })

    const finishedLoansCount = await this.prisma.loan.count({
      where: {
        snapshotRouteId: { in: routeIds },
        status: 'FINISHED',
      },
    })

    const activeLoans = await this.prisma.loan.findMany({
      where: {
        snapshotRouteId: { in: routeIds },
        status: 'ACTIVE',
      },
      select: {
        totalDebtAcquired: true,
        totalPaid: true,
        requestedAmount: true,
      },
    })

    const totalExpected = activeLoans.reduce(
      (acc, loan) => acc.plus(new Decimal(loan.totalDebtAcquired.toString())),
      new Decimal(0)
    )

    const totalReceived = activeLoans.reduce(
      (acc, loan) => acc.plus(new Decimal(loan.totalPaid.toString())),
      new Decimal(0)
    )

    const recoveryRate = totalExpected.greaterThan(0)
      ? totalReceived.dividedBy(totalExpected).times(100).toDecimalPlaces(2)
      : new Decimal(0)

    const totalRequestedAmount = activeLoans.reduce(
      (acc, loan) => acc.plus(new Decimal(loan.requestedAmount.toString())),
      new Decimal(0)
    )

    const averageTicket = activeLoansCount > 0
      ? totalRequestedAmount.dividedBy(activeLoansCount).toDecimalPlaces(2)
      : new Decimal(0)

    return {
      recoveryRate,
      averageTicket,
      activeLoansCount,
      finishedLoansCount,
    }
  }

  async getBadDebtByMonth(year: number, month: number): Promise<BadDebtData[]> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const loans = await this.prisma.loan.findMany({
      where: {
        badDebtDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        pendingAmountStored: true,
        snapshotRouteId: true,
        snapshotRouteName: true,
      },
    })

    // Group by route
    const byRoute = new Map<string, { routeName: string; count: number; amount: Decimal }>()

    for (const loan of loans) {
      const routeId = loan.snapshotRouteId || 'unknown'
      const routeName = loan.snapshotRouteName || 'Sin ruta'

      if (!byRoute.has(routeId)) {
        byRoute.set(routeId, { routeName, count: 0, amount: new Decimal(0) })
      }

      const data = byRoute.get(routeId)!
      data.count++
      data.amount = data.amount.plus(new Decimal(loan.pendingAmountStored.toString()))
    }

    return Array.from(byRoute.entries()).map(([routeId, data]) => ({
      routeId,
      routeName: data.routeName,
      loanCount: data.count,
      totalAmount: data.amount,
    }))
  }

  async getBadDebtSummary(): Promise<BadDebtSummary> {
    const loans = await this.prisma.loan.findMany({
      where: {
        badDebtDate: { not: null },
      },
      select: {
        id: true,
        pendingAmountStored: true,
        snapshotRouteId: true,
        snapshotRouteName: true,
      },
    })

    // Group by route
    const byRoute = new Map<string, { routeName: string; count: number; amount: Decimal }>()

    let totalLoans = 0
    let totalAmount = new Decimal(0)

    for (const loan of loans) {
      const routeId = loan.snapshotRouteId || 'unknown'
      const routeName = loan.snapshotRouteName || 'Sin ruta'

      if (!byRoute.has(routeId)) {
        byRoute.set(routeId, { routeName, count: 0, amount: new Decimal(0) })
      }

      const data = byRoute.get(routeId)!
      data.count++
      data.amount = data.amount.plus(new Decimal(loan.pendingAmountStored.toString()))

      totalLoans++
      totalAmount = totalAmount.plus(new Decimal(loan.pendingAmountStored.toString()))
    }

    const byRouteArray: BadDebtData[] = Array.from(byRoute.entries()).map(
      ([routeId, data]) => ({
        routeId,
        routeName: data.routeName,
        loanCount: data.count,
        totalAmount: data.amount,
      })
    )

    return {
      totalLoans,
      totalAmount,
      byRoute: byRouteArray,
    }
  }
}
