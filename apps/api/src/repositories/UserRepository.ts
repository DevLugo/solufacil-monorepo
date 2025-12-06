import type { PrismaClient, User, UserRole, Prisma } from '@solufacil/database'

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    })
  }

  async findByIdWithEmployee(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            personalData: true,
          },
        },
      },
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    })
  }

  async findMany(options?: {
    role?: UserRole
    limit?: number
    offset?: number
  }): Promise<User[]> {
    return this.prisma.user.findMany({
      where: options?.role ? { role: options.role } : undefined,
      take: options?.limit,
      skip: options?.offset,
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data })
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.user.delete({
      where: { id },
    })
    return true
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id },
    })
    return count > 0
  }

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    })
    return count > 0
  }
}
