import { GraphQLError } from 'graphql'
import type { PrismaClient } from '@solufacil/database'
import { BorrowerRepository } from '../repositories/BorrowerRepository'
import { generateClientCode } from '@solufacil/shared'

export interface CreateBorrowerInput {
  personalData: {
    fullName: string
    clientCode?: string
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
}

export interface UpdateBorrowerInput {
  personalData?: {
    fullName?: string
    birthDate?: Date
  }
}

export class BorrowerService {
  private borrowerRepository: BorrowerRepository

  constructor(private prisma: PrismaClient) {
    this.borrowerRepository = new BorrowerRepository(prisma)
  }

  async findById(id: string) {
    const borrower = await this.borrowerRepository.findById(id)
    if (!borrower) {
      throw new GraphQLError('Borrower not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }
    return borrower
  }

  async findMany(options?: { limit?: number; offset?: number }) {
    return this.borrowerRepository.findMany(options)
  }

  async create(input: CreateBorrowerInput) {
    // Generar clientCode si no se proporciona
    const clientCode = input.personalData.clientCode || await this.generateUniqueClientCode()

    return this.borrowerRepository.create({
      personalData: {
        ...input.personalData,
        clientCode,
      },
    })
  }

  async update(id: string, input: UpdateBorrowerInput) {
    const exists = await this.borrowerRepository.exists(id)
    if (!exists) {
      throw new GraphQLError('Borrower not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    return this.borrowerRepository.update(id, input)
  }

  private async generateUniqueClientCode(): Promise<string> {
    let code: string
    let exists: boolean

    do {
      code = generateClientCode()
      const personalData = await this.prisma.personalData.findUnique({
        where: { clientCode: code },
      })
      exists = !!personalData
    } while (exists)

    return code
  }
}
