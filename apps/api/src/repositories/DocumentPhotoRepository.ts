import type { PrismaClient, DocumentType, Prisma } from '@solufacil/database'

export class DocumentPhotoRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.documentPhoto.findUnique({
      where: { id },
      include: {
        personalData: true,
        loan: {
          include: {
            borrower: {
              include: {
                personalData: true,
              },
            },
          },
        },
        uploadedBy: true,
      },
    })
  }

  async findMany(options?: {
    loanId?: string
    personalDataId?: string
    documentType?: DocumentType
    hasErrors?: boolean
    isMissing?: boolean
    limit?: number
    offset?: number
  }) {
    const where: Prisma.DocumentPhotoWhereInput = {}

    if (options?.loanId) {
      where.loanId = options.loanId
    }

    if (options?.personalDataId) {
      where.personalDataId = options.personalDataId
    }

    if (options?.documentType) {
      where.documentType = options.documentType
    }

    if (options?.hasErrors !== undefined) {
      where.isError = options.hasErrors
    }

    if (options?.isMissing !== undefined) {
      where.isMissing = options.isMissing
    }

    return this.prisma.documentPhoto.findMany({
      where,
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      orderBy: { createdAt: 'desc' },
      include: {
        personalData: true,
        loan: {
          include: {
            borrower: {
              include: {
                personalData: true,
              },
            },
          },
        },
        uploadedBy: true,
      },
    })
  }

  async create(data: {
    photoUrl: string
    publicId: string
    documentType: DocumentType
    title?: string
    description?: string
    personalDataId?: string
    loanId?: string
    uploadedById: string
    isError?: boolean
    errorDescription?: string
    isMissing?: boolean
  }) {
    return this.prisma.documentPhoto.create({
      data: {
        photoUrl: data.photoUrl,
        publicId: data.publicId,
        documentType: data.documentType,
        title: data.title,
        description: data.description,
        personalDataId: data.personalDataId,
        loanId: data.loanId,
        uploadedById: data.uploadedById,
        isError: data.isError ?? false,
        errorDescription: data.errorDescription,
        isMissing: data.isMissing ?? false,
      },
      include: {
        personalData: true,
        loan: true,
        uploadedBy: true,
      },
    })
  }

  async update(
    id: string,
    data: {
      title?: string
      description?: string
      isError?: boolean
      errorDescription?: string
      isMissing?: boolean
    }
  ) {
    return this.prisma.documentPhoto.update({
      where: { id },
      data,
      include: {
        personalData: true,
        loan: true,
        uploadedBy: true,
      },
    })
  }

  async delete(id: string) {
    return this.prisma.documentPhoto.delete({
      where: { id },
    })
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.documentPhoto.count({
      where: { id },
    })
    return count > 0
  }

  async findWithErrors(options?: { routeId?: string }) {
    return this.prisma.documentPhoto.findMany({
      where: {
        OR: [{ isError: true }, { isMissing: true }],
        ...(options?.routeId
          ? {
              loan: {
                snapshotRouteId: options.routeId,
              },
            }
          : {}),
      },
      include: {
        personalData: true,
        loan: {
          include: {
            borrower: {
              include: {
                personalData: true,
              },
            },
            lead: {
              include: {
                personalData: true,
                routes: true,
              },
            },
          },
        },
        uploadedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
