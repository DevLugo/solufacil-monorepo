import type { PrismaClient, Borrower, Prisma } from '@solufacil/database'

export class BorrowerRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.borrower.findUnique({
      where: { id },
      include: {
        personalData: {
          include: {
            phones: true,
            addresses: {
              include: {
                location: {
                  include: {
                    municipality: {
                      include: {
                        state: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        loans: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
  }

  async findMany(options?: { limit?: number; offset?: number }) {
    return this.prisma.borrower.findMany({
      take: options?.limit,
      skip: options?.offset,
      include: {
        personalData: {
          include: {
            phones: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: {
    personalData: {
      fullName: string
      clientCode: string
      birthDate?: Date
      phones?: { number: string }[]
      addresses?: {
        street: string
        numberInterior?: string
        numberExterior?: string
        zipCode?: string
        locationId: string
      }[]
    }
  }) {
    return this.prisma.borrower.create({
      data: {
        personalData: {
          create: {
            fullName: data.personalData.fullName,
            clientCode: data.personalData.clientCode,
            birthDate: data.personalData.birthDate,
            phones: data.personalData.phones
              ? { create: data.personalData.phones }
              : undefined,
            addresses: data.personalData.addresses
              ? { create: data.personalData.addresses }
              : undefined,
          },
        },
      },
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
    })
  }

  async update(
    id: string,
    data: {
      personalData?: {
        fullName?: string
        birthDate?: Date
      }
    }
  ) {
    // Obtener el borrower para conseguir el personalDataId
    const borrower = await this.prisma.borrower.findUnique({
      where: { id },
      select: { personalDataId: true },
    })

    if (!borrower) {
      throw new Error('Borrower not found')
    }

    // Actualizar personalData si se proporciona
    if (data.personalData) {
      await this.prisma.personalData.update({
        where: { id: borrower.personalDataId },
        data: {
          ...(data.personalData.fullName
            ? { fullName: data.personalData.fullName }
            : {}),
          ...(data.personalData.birthDate
            ? { birthDate: data.personalData.birthDate }
            : {}),
        },
      })
    }

    return this.prisma.borrower.findUnique({
      where: { id },
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
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.borrower.count({
      where: { id },
    })
    return count > 0
  }

  async incrementLoanFinishedCount(id: string): Promise<void> {
    await this.prisma.borrower.update({
      where: { id },
      data: {
        loanFinishedCount: { increment: 1 },
      },
    })
  }
}
