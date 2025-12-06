import type { GraphQLContext } from '../context'
import { ReportService } from '../services/ReportService'

export const reportResolvers = {
  Query: {
    financialReport: async (
      _parent: unknown,
      args: { routeIds: string[]; year: number; month: number },
      context: GraphQLContext
    ) => {
      const reportService = new ReportService(context.prisma)
      const report = await reportService.getFinancialReport(
        args.routeIds,
        args.year,
        args.month
      )

      return {
        summary: {
          activeLoans: report.summary.activeLoans,
          totalPortfolio: report.summary.totalPortfolio.toString(),
          totalPaid: report.summary.totalPaid.toString(),
          pendingAmount: report.summary.pendingAmount.toString(),
          averagePayment: report.summary.averagePayment.toString(),
        },
        weeklyData: report.weeklyData.map((week) => ({
          week: week.week,
          date: week.date,
          loansGranted: week.loansGranted,
          paymentsReceived: week.paymentsReceived.toString(),
          expectedPayments: week.expectedPayments.toString(),
          recoveryRate: week.recoveryRate.toString(),
        })),
        comparisonData: report.comparisonData
          ? {
              previousMonth: {
                activeLoans: report.comparisonData.previousMonth.activeLoans,
                totalPortfolio: report.comparisonData.previousMonth.totalPortfolio.toString(),
                totalPaid: report.comparisonData.previousMonth.totalPaid.toString(),
                pendingAmount: report.comparisonData.previousMonth.pendingAmount.toString(),
                averagePayment: report.comparisonData.previousMonth.averagePayment.toString(),
              },
              growth: report.comparisonData.growth.toString(),
              trend: report.comparisonData.trend,
            }
          : null,
        performanceMetrics: {
          recoveryRate: report.performanceMetrics.recoveryRate.toString(),
          averageTicket: report.performanceMetrics.averageTicket.toString(),
          activeLoansCount: report.performanceMetrics.activeLoansCount,
          finishedLoansCount: report.performanceMetrics.finishedLoansCount,
        },
      }
    },

    badDebtByMonth: async (
      _parent: unknown,
      args: { year: number; month: number },
      context: GraphQLContext
    ) => {
      const reportService = new ReportService(context.prisma)
      const data = await reportService.getBadDebtByMonth(args.year, args.month)

      return data.map((item) => ({
        routeId: item.routeId,
        routeName: item.routeName,
        loanCount: item.loanCount,
        totalAmount: item.totalAmount.toString(),
      }))
    },

    badDebtSummary: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ) => {
      const reportService = new ReportService(context.prisma)
      const summary = await reportService.getBadDebtSummary()

      return {
        totalLoans: summary.totalLoans,
        totalAmount: summary.totalAmount.toString(),
        byRoute: summary.byRoute.map((item) => ({
          routeId: item.routeId,
          routeName: item.routeName,
          loanCount: item.loanCount,
          totalAmount: item.totalAmount.toString(),
        })),
      }
    },
  },
}
