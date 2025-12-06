import type { PrismaClient, Employee, EmployeeType, Prisma } from '@solufacil/database'

export class EmployeeRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.employee.findUnique({
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
        routes: true,
        user: true,
      },
    })
  }

  async findMany(options?: {
    type?: EmployeeType
    routeId?: string
    isActive?: boolean
  }) {
    return this.prisma.employee.findMany({
      where: {
        ...(options?.type ? { type: options.type } : {}),
        ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
        ...(options?.routeId
          ? { routes: { some: { id: options.routeId } } }
          : {}),
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
        routes: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: {
    type: EmployeeType
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
    routeIds?: string[]
  }) {
    return this.prisma.employee.create({
      data: {
        type: data.type,
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
        routes: data.routeIds
          ? { connect: data.routeIds.map((id) => ({ id })) }
          : undefined,
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
        routes: true,
      },
    })
  }

  async update(
    id: string,
    data: {
      type?: EmployeeType
      isActive?: boolean
      routeIds?: string[]
    }
  ) {
    return this.prisma.employee.update({
      where: { id },
      data: {
        ...(data.type ? { type: data.type } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.routeIds
          ? { routes: { set: data.routeIds.map((id) => ({ id })) } }
          : {}),
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
        routes: true,
      },
    })
  }

  async promoteToLead(id: string) {
    return this.prisma.employee.update({
      where: { id },
      data: { type: 'LEAD' },
      include: {
        personalData: true,
        routes: true,
      },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.employee.count({
      where: { id },
    })
    return count > 0
  }
}
