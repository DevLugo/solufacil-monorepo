import type { PrismaClient, Loantype, Prisma } from '@solufacil/database'
import { Decimal } from 'decimal.js'

export class LoantypeRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Loantype | null> {
    return this.prisma.loantype.findUnique({
      where: { id },
    })
  }

  async findMany(options?: { isActive?: boolean }): Promise<Loantype[]> {
    return this.prisma.loantype.findMany({
      where: options?.isActive !== undefined ? { isActive: options.isActive } : undefined,
      orderBy: { name: 'asc' },
    })
  }

  async create(data: {
    name: string
    weekDuration: number
    rate: number | Decimal
    interestRate: number | Decimal
    loanPaymentComission: number | Decimal
    loanGrantedComission: number | Decimal
    maxAmount?: number | Decimal
    maxTerm?: number
  }): Promise<Loantype> {
    return this.prisma.loantype.create({
      data: {
        name: data.name,
        weekDuration: data.weekDuration,
        rate: data.rate,
        interestRate: data.interestRate,
        loanPaymentComission: data.loanPaymentComission,
        loanGrantedComission: data.loanGrantedComission,
        maxAmount: data.maxAmount,
        maxTerm: data.maxTerm,
      },
    })
  }

  async update(
    id: string,
    data: {
      name?: string
      weekDuration?: number
      rate?: number | Decimal
      interestRate?: number | Decimal
      loanPaymentComission?: number | Decimal
      loanGrantedComission?: number | Decimal
      maxAmount?: number | Decimal
      maxTerm?: number
      isActive?: boolean
    }
  ): Promise<Loantype> {
    return this.prisma.loantype.update({
      where: { id },
      data,
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.loantype.count({
      where: { id },
    })
    return count > 0
  }
}
