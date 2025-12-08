import { GraphQLError } from 'graphql'
import { Decimal } from 'decimal.js'
import type { PrismaClient, PaymentMethod } from '@solufacil/database'
import { PaymentRepository } from '../repositories/PaymentRepository'
import { LoanRepository } from '../repositories/LoanRepository'
import { TransactionRepository } from '../repositories/TransactionRepository'
import { AccountRepository } from '../repositories/AccountRepository'
import { calculatePaymentProfit } from '@solufacil/business-logic'

export interface CreateLoanPaymentInput {
  loanId: string
  amount: string | number
  comission?: string | number
  receivedAt: Date
  paymentMethod: PaymentMethod
}

export interface CreateLeadPaymentReceivedInput {
  leadId: string
  agentId: string
  expectedAmount: string | number
  paidAmount: string | number
  cashPaidAmount: string | number
  bankPaidAmount: string | number
  falcoAmount?: string | number
  payments: {
    loanId: string
    amount: string | number
    comission?: string | number
    paymentMethod: PaymentMethod
  }[]
}

export class PaymentService {
  private paymentRepository: PaymentRepository
  private loanRepository: LoanRepository
  private transactionRepository: TransactionRepository
  private accountRepository: AccountRepository

  constructor(private prisma: PrismaClient) {
    this.paymentRepository = new PaymentRepository(prisma)
    this.loanRepository = new LoanRepository(prisma)
    this.transactionRepository = new TransactionRepository(prisma)
    this.accountRepository = new AccountRepository(prisma)
  }

  async findByLoanId(loanId: string, options?: { limit?: number; offset?: number }) {
    return this.paymentRepository.findByLoanId(loanId, options)
  }

  async createLoanPayment(input: CreateLoanPaymentInput) {
    // Obtener el préstamo
    const loan = await this.loanRepository.findById(input.loanId)
    if (!loan) {
      throw new GraphQLError('Loan not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    const paymentAmount = new Decimal(input.amount)
    const comission = input.comission ? new Decimal(input.comission) : new Decimal(0)

    // Calcular profit del pago
    const totalProfit = new Decimal(loan.profitAmount.toString())
    const totalDebt = new Decimal(loan.totalDebtAcquired.toString())
    const isBadDebt = !!loan.badDebtDate

    const { profitAmount, returnToCapital } = calculatePaymentProfit(
      paymentAmount,
      totalProfit,
      totalDebt,
      isBadDebt
    )

    // Ejecutar en transacción
    return this.prisma.$transaction(async (tx) => {
      // Crear el pago
      const payment = await this.paymentRepository.create(
        {
          amount: paymentAmount,
          comission,
          receivedAt: input.receivedAt,
          paymentMethod: input.paymentMethod,
          type: 'PAYMENT',
          loan: input.loanId,
        },
        tx
      )

      // Obtener cuenta del lead
      const leadAccount = await this.getLeadAccount(loan.lead || '', tx)

      // Crear transacción de ingreso
      const incomeSource = input.paymentMethod === 'CASH'
        ? 'CASH_LOAN_PAYMENT'
        : 'BANK_LOAN_PAYMENT'

      await this.transactionRepository.create(
        {
          amount: paymentAmount,
          date: input.receivedAt,
          type: 'INCOME',
          incomeSource,
          profitAmount,
          returnToCapital,
          sourceAccountId: leadAccount.id,
          loanId: loan.id,
          loanPaymentId: payment.id,
          leadId: loan.lead || undefined,
          routeId: loan.snapshotRouteId || undefined,
        },
        tx
      )

      // Crear transacción de comisión si aplica
      if (comission.greaterThan(0)) {
        await this.transactionRepository.create(
          {
            amount: comission,
            date: input.receivedAt,
            type: 'EXPENSE',
            expenseSource: 'LOAN_PAYMENT_COMISSION',
            sourceAccountId: leadAccount.id,
            loanPaymentId: payment.id,
            leadId: loan.lead || undefined,
          },
          tx
        )
      }

      // Actualizar métricas del préstamo
      const currentTotalPaid = new Decimal(loan.totalPaid.toString())
      const currentPending = new Decimal(loan.pendingAmountStored.toString())

      const updatedTotalPaid = currentTotalPaid.plus(paymentAmount)
      const updatedPending = currentPending.minus(paymentAmount)

      const updateData: Parameters<typeof this.loanRepository.update>[1] = {
        totalPaid: updatedTotalPaid,
        pendingAmountStored: updatedPending.isNegative() ? new Decimal(0) : updatedPending,
        comissionAmount: new Decimal(loan.comissionAmount.toString()).plus(comission),
      }

      // Si ya está pagado, marcar como FINISHED
      if (updatedPending.lessThanOrEqualTo(0)) {
        updateData.status = 'FINISHED'
        updateData.finishedDate = new Date()
      }

      await tx.loan.update({
        where: { id: loan.id },
        data: updateData,
      })

      return payment
    })
  }

  async createLeadPaymentReceived(input: CreateLeadPaymentReceivedInput) {
    const expectedAmount = new Decimal(input.expectedAmount)
    const paidAmount = new Decimal(input.paidAmount)
    const cashPaidAmount = new Decimal(input.cashPaidAmount)
    const bankPaidAmount = new Decimal(input.bankPaidAmount)
    const falcoAmount = input.falcoAmount ? new Decimal(input.falcoAmount) : new Decimal(0)

    const paymentStatus = paidAmount.greaterThanOrEqualTo(expectedAmount)
      ? 'COMPLETE'
      : 'PARTIAL'

    return this.prisma.$transaction(async (tx) => {
      // Crear el registro de pago del lead
      const leadPaymentReceived = await this.paymentRepository.createLeadPaymentReceived({
        expectedAmount,
        paidAmount,
        cashPaidAmount,
        bankPaidAmount,
        falcoAmount,
        paymentStatus,
        lead: input.leadId,
        agent: input.agentId,
      })

      // Crear los pagos individuales
      for (const paymentInput of input.payments) {
        const loan = await this.loanRepository.findById(paymentInput.loanId)
        if (!loan) continue

        await this.paymentRepository.create(
          {
            amount: new Decimal(paymentInput.amount),
            comission: paymentInput.comission ? new Decimal(paymentInput.comission) : undefined,
            receivedAt: new Date(),
            paymentMethod: paymentInput.paymentMethod,
            type: 'PAYMENT',
            loan: paymentInput.loanId,
            leadPaymentReceived: leadPaymentReceived.id,
          },
          tx
        )
      }

      return leadPaymentReceived
    })
  }

  private async getLeadAccount(leadId: string, tx?: any): Promise<{ id: string }> {
    const client = tx || this.prisma

    // Buscar cuenta del empleado tipo EMPLOYEE_CASH_FUND
    const account = await client.account.findFirst({
      where: {
        type: 'EMPLOYEE_CASH_FUND',
        routes: {
          some: {
            employees: {
              some: { id: leadId },
            },
          },
        },
      },
    })

    if (!account) {
      // Si no existe, buscar cualquier cuenta de oficina
      const officeAccount = await client.account.findFirst({
        where: { type: 'OFFICE_CASH_FUND' },
      })

      if (!officeAccount) {
        throw new GraphQLError('No account found for lead', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return officeAccount
    }

    return account
  }
}
