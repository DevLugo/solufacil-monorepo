import { GraphQLError } from 'graphql'
import { Decimal } from 'decimal.js'
import type { PrismaClient, LoanStatus } from '@solufacil/database'
import { LoanRepository } from '../repositories/LoanRepository'
import { LoantypeRepository } from '../repositories/LoantypeRepository'
import { BorrowerRepository } from '../repositories/BorrowerRepository'
import { EmployeeRepository } from '../repositories/EmployeeRepository'
import { calculateLoanMetrics, createLoanSnapshot } from '@solufacil/business-logic'

export interface CreateLoanInput {
  requestedAmount: string | number
  amountGived: string | number
  signDate: Date
  borrowerId: string
  loantypeId: string
  grantorId: string
  leadId: string
  collateralIds?: string[]
  previousLoanId?: string
}

export interface UpdateLoanInput {
  amountGived?: string | number
  badDebtDate?: Date | null
  isDeceased?: boolean
  leadId?: string
  status?: LoanStatus
}

export interface RenewLoanInput {
  requestedAmount: string | number
  amountGived: string | number
  signDate: Date
  loantypeId: string
}

export class LoanService {
  private loanRepository: LoanRepository
  private loantypeRepository: LoantypeRepository
  private borrowerRepository: BorrowerRepository
  private employeeRepository: EmployeeRepository

  constructor(private prisma: PrismaClient) {
    this.loanRepository = new LoanRepository(prisma)
    this.loantypeRepository = new LoantypeRepository(prisma)
    this.borrowerRepository = new BorrowerRepository(prisma)
    this.employeeRepository = new EmployeeRepository(prisma)
  }

  async findById(id: string) {
    const loan = await this.loanRepository.findById(id)
    if (!loan) {
      throw new GraphQLError('Loan not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }
    return loan
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
    return this.loanRepository.findMany(options)
  }

  async create(input: CreateLoanInput) {
    // Validar que el loantype existe
    const loantype = await this.loantypeRepository.findById(input.loantypeId)
    if (!loantype) {
      throw new GraphQLError('Loantype not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    // Validar que el borrower existe
    const borrowerExists = await this.borrowerRepository.exists(input.borrowerId)
    if (!borrowerExists) {
      throw new GraphQLError('Borrower not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    // Obtener datos del lead para el snapshot
    const lead = await this.employeeRepository.findById(input.leadId)
    if (!lead) {
      throw new GraphQLError('Lead not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    // Calcular métricas del préstamo
    const requestedAmount = new Decimal(input.requestedAmount)
    const amountGived = new Decimal(input.amountGived)
    const rate = new Decimal(loantype.rate.toString())

    const metrics = calculateLoanMetrics(
      requestedAmount,
      rate,
      loantype.weekDuration
    )

    // Manejar profit pendiente si es renovación
    let pendingProfit = new Decimal(0)
    if (input.previousLoanId) {
      const previousLoan = await this.loanRepository.findById(input.previousLoanId)
      if (!previousLoan) {
        throw new GraphQLError('Previous loan not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // Obtener el profit pendiente del préstamo anterior
      pendingProfit = new Decimal(previousLoan.pendingAmountStored.toString())

      // Marcar el préstamo anterior como RENOVATED
      await this.loanRepository.update(input.previousLoanId, {
        status: 'RENOVATED',
        finishedDate: new Date(),
      })
    }

    // Crear snapshot histórico
    const routeId = lead.routes[0]?.id || null
    const routeName = lead.routes[0]?.name || null
    const snapshot = createLoanSnapshot(
      lead.id,
      lead.personalData.fullName,
      routeId,
      routeName
    )

    // Calcular métricas finales (incluyendo profit pendiente de renovación)
    const finalProfitAmount = metrics.profitAmount.plus(pendingProfit)
    const finalTotalDebt = metrics.totalDebtAcquired.plus(pendingProfit)

    // Crear el préstamo
    return this.loanRepository.create({
      requestedAmount: requestedAmount,
      amountGived: amountGived,
      signDate: input.signDate,
      profitAmount: finalProfitAmount,
      totalDebtAcquired: finalTotalDebt,
      expectedWeeklyPayment: metrics.expectedWeeklyPayment,
      pendingAmountStored: finalTotalDebt,
      borrowerId: input.borrowerId,
      loantypeId: input.loantypeId,
      grantorId: input.grantorId,
      leadId: input.leadId,
      collateralIds: input.collateralIds,
      previousLoanId: input.previousLoanId,
      ...snapshot,
    })
  }

  async update(id: string, input: UpdateLoanInput) {
    const exists = await this.loanRepository.exists(id)
    if (!exists) {
      throw new GraphQLError('Loan not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    const updateData: Parameters<typeof this.loanRepository.update>[1] = {}

    if (input.amountGived !== undefined) {
      updateData.amountGived = new Decimal(input.amountGived)
    }
    if (input.badDebtDate !== undefined) {
      updateData.badDebtDate = input.badDebtDate
    }
    if (input.isDeceased !== undefined) {
      updateData.isDeceased = input.isDeceased
    }
    if (input.leadId !== undefined) {
      updateData.leadId = input.leadId
    }
    if (input.status !== undefined) {
      updateData.status = input.status
    }

    return this.loanRepository.update(id, updateData)
  }

  async renewLoan(loanId: string, input: RenewLoanInput) {
    // Obtener el préstamo a renovar
    const existingLoan = await this.loanRepository.findById(loanId)
    if (!existingLoan) {
      throw new GraphQLError('Loan not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    // Validar que el préstamo esté activo
    if (existingLoan.status !== 'ACTIVE') {
      throw new GraphQLError('Only active loans can be renewed', {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    }

    // Crear nuevo préstamo con referencia al anterior
    return this.create({
      requestedAmount: input.requestedAmount,
      amountGived: input.amountGived,
      signDate: input.signDate,
      borrowerId: existingLoan.borrowerId,
      loantypeId: input.loantypeId,
      grantorId: existingLoan.grantorId,
      leadId: existingLoan.leadId,
      previousLoanId: loanId,
    })
  }

  async markAsBadDebt(loanId: string, badDebtDate: Date) {
    const exists = await this.loanRepository.exists(loanId)
    if (!exists) {
      throw new GraphQLError('Loan not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    return this.loanRepository.update(loanId, { badDebtDate })
  }

  async finishLoan(loanId: string) {
    const loan = await this.loanRepository.findById(loanId)
    if (!loan) {
      throw new GraphQLError('Loan not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    // Actualizar contador de préstamos terminados del borrower
    await this.borrowerRepository.incrementLoanFinishedCount(loan.borrowerId)

    return this.loanRepository.update(loanId, {
      status: 'FINISHED',
      finishedDate: new Date(),
    })
  }

  async cancelLoan(loanId: string) {
    const exists = await this.loanRepository.exists(loanId)
    if (!exists) {
      throw new GraphQLError('Loan not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    return this.loanRepository.update(loanId, {
      status: 'CANCELLED',
    })
  }

  async findForBadDebt(routeId?: string) {
    return this.loanRepository.findForBadDebt(routeId)
  }
}
