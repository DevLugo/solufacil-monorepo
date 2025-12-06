import { GraphQLError } from 'graphql'
import type { GraphQLContext } from '../context'
import type { DocumentType } from '@solufacil/database'
import { DocumentPhotoService } from '../services/DocumentPhotoService'

export const documentResolvers = {
  Query: {
    documentPhotos: async (
      _parent: unknown,
      args: {
        loanId?: string
        personalDataId?: string
        documentType?: DocumentType
        hasErrors?: boolean
        limit?: number
        offset?: number
      },
      context: GraphQLContext
    ) => {
      const service = new DocumentPhotoService(context.prisma)
      return service.findMany({
        loanId: args.loanId,
        personalDataId: args.personalDataId,
        documentType: args.documentType,
        hasErrors: args.hasErrors,
        limit: args.limit,
        offset: args.offset,
      })
    },

    documentPhoto: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      const service = new DocumentPhotoService(context.prisma)
      return service.findById(args.id)
    },

    documentsWithErrors: async (
      _parent: unknown,
      args: { routeId?: string },
      context: GraphQLContext
    ) => {
      const service = new DocumentPhotoService(context.prisma)
      return service.findWithErrors(args.routeId)
    },
  },

  Mutation: {
    uploadDocumentPhoto: async (
      _parent: unknown,
      args: {
        input: {
          title?: string
          description?: string
          documentType: DocumentType
          file: Promise<{
            createReadStream: () => NodeJS.ReadableStream
            filename: string
            mimetype: string
          }>
          personalDataId?: string
          loanId?: string
          isError?: boolean
          errorDescription?: string
          isMissing?: boolean
        }
      },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const file = await args.input.file
      const service = new DocumentPhotoService(context.prisma)

      return service.upload(
        {
          title: args.input.title,
          description: args.input.description,
          documentType: args.input.documentType,
          file: file as any,
          personalDataId: args.input.personalDataId,
          loanId: args.input.loanId,
          isError: args.input.isError,
          errorDescription: args.input.errorDescription,
          isMissing: args.input.isMissing,
        },
        context.user.id
      )
    },

    updateDocumentPhoto: async (
      _parent: unknown,
      args: {
        id: string
        input: {
          title?: string
          description?: string
          isError?: boolean
          errorDescription?: string
          isMissing?: boolean
        }
      },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const service = new DocumentPhotoService(context.prisma)
      return service.update(args.id, args.input)
    },

    deleteDocumentPhoto: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const service = new DocumentPhotoService(context.prisma)
      return service.delete(args.id)
    },
  },

  DocumentPhoto: {
    personalData: async (parent: { personalDataId?: string }, _args: unknown, context: GraphQLContext) => {
      if (!parent.personalDataId) return null
      return context.prisma.personalData.findUnique({
        where: { id: parent.personalDataId },
        include: {
          phones: true,
          addresses: {
            include: {
              locationRelation: true,
            },
          },
        },
      })
    },

    loan: async (parent: { loanId?: string }, _args: unknown, context: GraphQLContext) => {
      if (!parent.loanId) return null
      return context.prisma.loan.findUnique({
        where: { id: parent.loanId },
        include: {
          borrower: {
            include: {
              personalDataRelation: true,
            },
          },
          loantype: true,
        },
      })
    },

    uploadedBy: async (parent: { uploadedById: string }, _args: unknown, context: GraphQLContext) => {
      return context.prisma.user.findUnique({
        where: { id: parent.uploadedById },
      })
    },
  },
}
