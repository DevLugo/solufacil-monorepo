'use client'

import { useState, useCallback } from 'react'
import { useLazyQuery } from '@apollo/client'
import { ChevronDown, ChevronUp, Image, AlertCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { GET_LOAN_DOCUMENT_PHOTOS_QUERY } from '@/graphql/queries/clients'

interface DocumentPhoto {
  id: string
  title: string | null
  description: string | null
  photoUrl: string
  publicId: string
  documentType: string
  isError: boolean
  errorDescription: string | null
  isMissing: boolean
  createdAt: string
}

interface LoanDocumentPhotosProps {
  loanId: string
  loanDate: string
}

const documentTypeLabels: Record<string, string> = {
  INE: 'INE',
  DOMICILIO: 'Comprobante Domicilio',
  PAGARE: 'Pagaré',
  OTRO: 'Otro',
}

export function LoanDocumentPhotos({ loanId, loanDate }: LoanDocumentPhotosProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<DocumentPhoto | null>(null)

  const [fetchPhotos, { data, loading, error, called }] = useLazyQuery(
    GET_LOAN_DOCUMENT_PHOTOS_QUERY,
    {
      variables: { loanId, limit: 20 },
      fetchPolicy: 'cache-first',
    }
  )

  const photos: DocumentPhoto[] = data?.documentPhotos || []

  const handleToggle = useCallback(() => {
    if (!isExpanded && !called) {
      fetchPhotos()
    }
    setIsExpanded((prev) => !prev)
  }, [isExpanded, called, fetchPhotos])

  const handlePhotoClick = useCallback((photo: DocumentPhoto) => {
    setSelectedPhoto(photo)
  }, [])

  const hasPhotos = called && photos.length > 0
  const hasNoPhotos = called && !loading && photos.length === 0

  return (
    <>
      <Card className="mb-4 overflow-hidden">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-3 h-auto"
          onClick={handleToggle}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Image className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              Documentos ({loanDate})
            </span>
            {hasPhotos && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full flex-shrink-0">
                {photos.length}
              </span>
            )}
            {hasNoPhotos && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                Sin docs
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </Button>

        {isExpanded && (
          <div className="px-3 pb-3">
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Cargando documentos...
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 py-4 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Error al cargar documentos</span>
              </div>
            )}

            {hasNoPhotos && (
              <div className="text-center py-4 text-muted-foreground">
                <Image className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay documentos asociados</p>
              </div>
            )}

            {hasPhotos && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={cn(
                      'relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:scale-105',
                      photo.isError
                        ? 'border-destructive'
                        : photo.isMissing
                        ? 'border-warning'
                        : 'border-transparent hover:border-primary'
                    )}
                    onClick={() => handlePhotoClick(photo)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.photoUrl}
                      alt={photo.title || documentTypeLabels[photo.documentType] || 'Documento'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                      <span className="text-[10px] text-white font-medium truncate block">
                        {documentTypeLabels[photo.documentType] || photo.documentType}
                      </span>
                    </div>
                    {photo.isError && (
                      <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[8px] px-1 rounded">
                        Error
                      </div>
                    )}
                    {photo.isMissing && (
                      <div className="absolute top-1 right-1 bg-warning text-warning-foreground text-[8px] px-1 rounded">
                        Faltante
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Full-size photo modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl p-2">
          {selectedPhoto && (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.photoUrl}
                alt={selectedPhoto.title || 'Documento'}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">
                    {documentTypeLabels[selectedPhoto.documentType] || selectedPhoto.documentType}
                  </span>
                  {selectedPhoto.title && (
                    <span className="text-muted-foreground ml-2">
                      {selectedPhoto.title}
                    </span>
                  )}
                </div>
                {selectedPhoto.isError && (
                  <span className="text-destructive text-xs">
                    Error: {selectedPhoto.errorDescription || 'Sin descripción'}
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
