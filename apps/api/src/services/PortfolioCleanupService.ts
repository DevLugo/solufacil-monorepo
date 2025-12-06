import { GraphQLError } from 'graphql'
import { Decimal } from 'decimal.js'
import type { PrismaClient } from '@solufacil/database'
import { PortfolioCleanupRepository } from '../repositories/PortfolioCleanupRepository'
import { AuditLogService, AuditContext } from './AuditLogService'

export interface CreatePortfolioCleanupInput {
  name: string
  description?: string
  cleanupDate: Date
  fromDate?: Date
  toDate?: Date
  routeId: string
  loanIds: string[]
}

export class PortfolioCleanupService {
  private portfolioCleanupRepository: PortfolioCleanupRepository
  private auditLogService: AuditLogService

  constructor(private prisma: PrismaClient) {
    this.portfolioCleanupRepository = new PortfolioCleanupRepository(prisma)
    this.auditLogService = new AuditLogService(prisma)
  }

  async findById(id: string) {
    const cleanup = await this.portfolioCleanupRepository.findById(id)
    if (!cleanup) {
      throw new GraphQLError('Portfolio cleanup not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }
    return cleanup
  }

  async findMany(options?: {
    routeId?: string
    fromDate?: Date
    toDate?: Date
    limit?: number
    offset?: number
  }) {
    return this.portfolioCleanupRepository.findMany(options)
  }

  async create(
    input: CreatePortfolioCleanupInput,
    userId: string,
    auditContext?: AuditContext
  ) {
    // Validate route exists
    const route = await this.prisma.route.findUnique({
      where: { id: input.routeId },
    })
    if (!route) {
      throw new GraphQLError('Route not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    // Validate all loans exist and are eligible for cleanup
    const loans = await this.prisma.loan.findMany({
      where: {
        id: { in: input.loanIds },
        badDebtDate: { not: null },
        snapshotRouteId: input.routeId,
      },
      select: { id: true },
    })

    const foundLoanIds = new Set(loans.map((l) => l.id))
    const missingLoanIds = input.loanIds.filter((id) => !foundLoanIds.has(id))

    if (missingLoanIds.length > 0) {
      throw new GraphQLError(
        `Some loans are not eligible for cleanup (not bad debt or wrong route): ${missingLoanIds.join(', ')}`,
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      )
    }

    // Check if any loans are already in another cleanup
    const loansInOtherCleanups = await this.prisma.loan.findMany({
      where: {
        id: { in: input.loanIds },
        cleanupExcludedById: { not: null },
      },
      select: { id: true, cleanupExcludedById: true },
    })

    if (loansInOtherCleanups.length > 0) {
      throw new GraphQLError(
        `Some loans are already in another cleanup: ${loansInOtherCleanups.map((l) => l.id).join(', ')}`,
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      )
    }

    // Create the cleanup
    const cleanup = await this.portfolioCleanupRepository.create({
      name: input.name,
      description: input.description,
      cleanupDate: input.cleanupDate,
      fromDate: input.fromDate,
      toDate: input.toDate,
      routeId: input.routeId,
      executedById: userId,
      loanIds: input.loanIds,
    })

    // Log audit
    await this.auditLogService.logCreate(
      'PortfolioCleanup',
      cleanup.id,
      {
        name: input.name,
        routeId: input.routeId,
        excludedLoansCount: input.loanIds.length,
      },
      auditContext,
      `Created portfolio cleanup "${input.name}" with ${input.loanIds.length} loans`
    )

    return cleanup
  }

  async delete(id: string, auditContext?: AuditContext): Promise<boolean> {
    const cleanup = await this.portfolioCleanupRepository.findById(id)
    if (!cleanup) {
      throw new GraphQLError('Portfolio cleanup not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    await this.portfolioCleanupRepository.delete(id)

    // Log audit
    await this.auditLogService.logDelete(
      'PortfolioCleanup',
      id,
      {
        name: cleanup.name,
        routeId: cleanup.routeId,
        excludedLoansCount: cleanup.excludedLoansCount,
      },
      auditContext,
      `Deleted portfolio cleanup "${cleanup.name}"`
    )

    return true
  }

  async getSummary(routeId?: string) {
    const where = routeId ? { routeId } : {}

    const cleanups = await this.prisma.portfolioCleanup.findMany({
      where,
      select: {
        excludedLoansCount: true,
        excludedAmount: true,
      },
    })

    const totalCleanups = cleanups.length
    const totalExcludedLoans = cleanups.reduce(
      (acc, c) => acc + c.excludedLoansCount,
      0
    )
    const totalExcludedAmount = cleanups.reduce(
      (acc, c) => acc.plus(new Decimal(c.excludedAmount.toString())),
      new Decimal(0)
    )

    return {
      totalCleanups,
      totalExcludedLoans,
      totalExcludedAmount,
    }
  }

  async getEligibleLoansForCleanup(routeId: string, options?: {
    fromDate?: Date
    toDate?: Date
  }) {
    const where: any = {
      snapshotRouteId: routeId,
      badDebtDate: { not: null },
      cleanupExcludedById: null,
    }

    if (options?.fromDate || options?.toDate) {
      where.badDebtDate = {
        ...where.badDebtDate,
        ...(options?.fromDate ? { gte: options.fromDate } : {}),
        ...(options?.toDate ? { lte: options.toDate } : {}),
      }
    }

    return this.prisma.loan.findMany({
      where,
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
