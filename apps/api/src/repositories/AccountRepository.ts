import type { PrismaClient, Account, AccountType, Prisma } from '@solufacil/database'
import { Decimal } from 'decimal.js'

export class AccountRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.account.findUnique({
      where: { id },
      include: {
        routes: true,
      },
    })
  }

  async findMany(options?: { routeId?: string; type?: AccountType }) {
    const where: Prisma.AccountWhereInput = {}

    if (options?.type) {
      where.type = options.type
    }

    if (options?.routeId) {
      where.routes = { some: { id: options.routeId } }
    }

    return this.prisma.account.findMany({
      where,
      include: {
        routes: true,
      },
      orderBy: { name: 'asc' },
    })
  }

  async create(data: {
    name: string
    type: AccountType
    amount: Decimal
    routeIds?: string[]
  }) {
    return this.prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        amount: data.amount,
        routes: data.routeIds
          ? { connect: data.routeIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        routes: true,
      },
    })
  }

  async update(
    id: string,
    data: {
      name?: string
      isActive?: boolean
      amount?: Decimal
    }
  ) {
    return this.prisma.account.update({
      where: { id },
      data,
      include: {
        routes: true,
      },
    })
  }

  async updateBalance(id: string, newAmount: Decimal, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma
    return client.account.update({
      where: { id },
      data: { amount: newAmount },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.account.count({
      where: { id },
    })
    return count > 0
  }

  async calculateBalance(id: string): Promise<Decimal> {
    // Suma de transacciones donde es cuenta origen (salidas)
    const outgoing = await this.prisma.transaction.aggregate({
      where: { sourceAccountId: id },
      _sum: { amount: true },
    })

    // Suma de transacciones donde es cuenta destino (entradas)
    const incoming = await this.prisma.transaction.aggregate({
      where: { destinationAccountId: id },
      _sum: { amount: true },
    })

    // También considerar ingresos (INCOME aumenta el balance)
    const incomes = await this.prisma.transaction.aggregate({
      where: {
        sourceAccountId: id,
        type: 'INCOME',
      },
      _sum: { amount: true },
    })

    const outgoingAmount = new Decimal(outgoing._sum.amount?.toString() || '0')
    const incomingAmount = new Decimal(incoming._sum.amount?.toString() || '0')
    const incomeAmount = new Decimal(incomes._sum.amount?.toString() || '0')

    // Balance = entradas + ingresos - salidas (gastos y transferencias)
    return incomingAmount.plus(incomeAmount).minus(outgoingAmount)
  }
}
