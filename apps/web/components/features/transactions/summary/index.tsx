'use client'

import { useMemo, useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { AlertCircle, Search, X, BarChart3 } from 'lucide-react'

// Components
import { ExecutiveSummary, LocalityCard } from './components'

// Hooks
import { useSummaryQueries } from './hooks'

// Utils
import { processTransactionsByLocality, calculateExecutiveSummary } from './utils'

// Types
import type { Route, LocalitySummary, ExecutiveSummaryData } from './types'

export interface SummaryTabProps {
  selectedDate: Date
  selectedRoute: Route | null
  refreshKey?: number
}

export function SummaryTab({ selectedDate, selectedRoute, refreshKey = 0 }: SummaryTabProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Query for all transactions
  const { transactions, totalCount, loading, error, refetch } = useSummaryQueries({
    selectedDate,
    selectedRoute,
    refreshKey,
  })

  // Process transactions into localities
  const localities: LocalitySummary[] = useMemo(() => {
    return processTransactionsByLocality(transactions)
  }, [transactions])

  // Filter localities by search term
  const filteredLocalities = useMemo(() => {
    if (!searchTerm.trim()) return localities

    const term = searchTerm.toLowerCase().trim()
    return localities.filter(
      (loc) =>
        loc.localityName.toLowerCase().includes(term) ||
        loc.leaderName.toLowerCase().includes(term)
    )
  }, [localities, searchTerm])

  // Calculate executive summary (from all localities, not filtered)
  const executiveSummary: ExecutiveSummaryData = useMemo(() => {
    return calculateExecutiveSummary(localities)
  }, [localities])

  // Refetch on refreshKey change
  useEffect(() => {
    if (selectedDate && selectedRoute) {
      refetch()
    }
  }, [refreshKey, refetch, selectedDate, selectedRoute])

  // Loading state
  if (loading && transactions.length === 0) {
    return <SummaryTabSkeleton />
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error al cargar datos: {error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // No route selected
  if (!selectedRoute) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Selecciona una ruta para ver el resumen</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Executive Summary Stats */}
      <ExecutiveSummary data={executiveSummary} />

      {/* Localities Card */}
      <Card className="relative">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Resumen por Localidad
              </CardTitle>
              <CardDescription>
                {localities.length} localidades con actividad
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar localidad o líder..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 w-64"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredLocalities.length === localities.length
                  ? `${localities.length} localidades`
                  : `${filteredLocalities.length} de ${localities.length}`}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {filteredLocalities.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filteredLocalities.map((locality) => (
                <LocalityCard key={locality.locationKey} locality={locality} />
              ))}
            </div>
          ) : localities.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No se encontraron localidades que coincidan con &ldquo;{searchTerm}&rdquo;
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay transacciones para esta fecha y ruta
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryTabSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>

      {/* Localities skeleton */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Re-export types for convenience
export type { Route, LocalitySummary, ExecutiveSummaryData } from './types'
