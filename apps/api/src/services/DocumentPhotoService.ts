import { GraphQLError } from 'graphql'
import type { PrismaClient, DocumentType } from '@solufacil/database'
import type { ReadStream } from 'fs'
import { DocumentPhotoRepository } from '../repositories/DocumentPhotoRepository'
import { CloudinaryService } from './CloudinaryService'

export interface UploadDocumentInput {
  title?: string
  description?: string
  documentType: DocumentType
  file: {
    createReadStream: () => ReadStream
    filename: string
    mimetype: string
  }
  personalDataId?: string
  loanId?: string
  isError?: boolean
  errorDescription?: string
  isMissing?: boolean
}

export interface UpdateDocumentInput {
  title?: string
  description?: string
  isError?: boolean
  errorDescription?: string
  isMissing?: boolean
}

export class DocumentPhotoService {
  private documentPhotoRepository: DocumentPhotoRepository
  private cloudinaryService: CloudinaryService

  constructor(private prisma: PrismaClient) {
    this.documentPhotoRepository = new DocumentPhotoRepository(prisma)
    this.cloudinaryService = new CloudinaryService()
  }

  async findById(id: string) {
    const document = await this.documentPhotoRepository.findById(id)
    if (!document) {
      throw new GraphQLError('Document photo not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }
    return document
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
    return this.documentPhotoRepository.findMany(options)
  }

  async upload(input: UploadDocumentInput, userId: string) {
    // Validate that at least one of personalDataId or loanId is provided
    if (!input.personalDataId && !input.loanId) {
      throw new GraphQLError(
        'Either personalDataId or loanId must be provided',
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      )
    }

    // Validate mimetype
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedMimeTypes.includes(input.file.mimetype)) {
      throw new GraphQLError(
        `Invalid file type: ${input.file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`,
        {
          extensions: { code: 'BAD_USER_INPUT' },
        }
      )
    }

    // Upload to Cloudinary
    const stream = input.file.createReadStream()
    const folder = input.loanId
      ? `solufacil/loans/${input.loanId}`
      : `solufacil/personal/${input.personalDataId}`

    const uploadResult = await this.cloudinaryService.uploadImage(stream, {
      folder,
    })

    // Create document photo record
    return this.documentPhotoRepository.create({
      photoUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      documentType: input.documentType,
      title: input.title,
      description: input.description,
      personalDataId: input.personalDataId,
      loanId: input.loanId,
      uploadedById: userId,
      isError: input.isError,
      errorDescription: input.errorDescription,
      isMissing: input.isMissing,
    })
  }

  async update(id: string, input: UpdateDocumentInput) {
    const exists = await this.documentPhotoRepository.exists(id)
    if (!exists) {
      throw new GraphQLError('Document photo not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    return this.documentPhotoRepository.update(id, {
      title: input.title,
      description: input.description,
      isError: input.isError,
      errorDescription: input.errorDescription,
      isMissing: input.isMissing,
    })
  }

  async delete(id: string): Promise<boolean> {
    const document = await this.documentPhotoRepository.findById(id)
    if (!document) {
      throw new GraphQLError('Document photo not found', {
        extensions: { code: 'NOT_FOUND' },
      })
    }

    // Delete from Cloudinary
    await this.cloudinaryService.deleteImage(document.publicId)

    // Delete from database
    await this.documentPhotoRepository.delete(id)

    return true
  }

  async findWithErrors(routeId?: string) {
    return this.documentPhotoRepository.findWithErrors({ routeId })
  }
}
