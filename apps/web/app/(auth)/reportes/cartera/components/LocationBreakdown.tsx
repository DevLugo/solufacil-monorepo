'use client'

import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, Users, UserX, UserCheck, ChevronRight, ArrowLeft, Route } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  LocationBreakdown as LocationBreakdownType,
  LocalityReport,
  LocalityBreakdownDetail,
} from '../hooks'
import { LocalityWeeklyTable } from './LocalityWeeklyTable'
import { LocalityDetailModal } from './LocalityDetailModal'

interface LocationBreakdownProps {
  locations: LocationBreakdownType[]
  localityReport?: LocalityReport | null
  localityLoading?: boolean
  year: number
  month: number
}

// Clickable route card for drill-down navigation
function RouteCard({
  location,
  onClick,
}: {
  location: LocationBreakdownType
  onClick: () => void
}) {
  const cvPercentage = location.clientesActivos > 0
    ? (location.clientesEnCV / location.clientesActivos) * 100
    : 0

  const alCorrientePercentage = location.clientesActivos > 0
    ? (location.clientesAlCorriente / location.clientesActivos) * 100
    : 0

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card p-4 hover:bg-muted/50 hover:border-primary/50 transition-all group cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-semibold">{location.routeName || location.locationName}</h4>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      {/* Stats - Equal visual weight for Activos, OK, and CV */}
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="bg-muted/50 rounded p-2">
          <span className="text-lg font-bold">{location.clientesActivos}</span>
          <p className="text-xs text-muted-foreground">Activos</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 rounded p-2">
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {location.clientesAlCorriente}
          </span>
          <p className="text-xs text-muted-foreground">OK</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 rounded p-2">
          <span className="text-lg font-bold text-red-600 dark:text-red-400">
            {location.clientesEnCV}
          </span>
          <p className="text-xs text-muted-foreground">CV</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          <div
            className="h-full bg-green-500 dark:bg-green-600"
            style={{ width: `${alCorrientePercentage}%` }}
          />
          <div
            className="h-full bg-red-500 dark:bg-red-600"
            style={{ width: `${cvPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>OK: {alCorrientePercentage.toFixed(0)}%</span>
          <span>CV: {cvPercentage.toFixed(0)}%</span>
        </div>
      </div>

      {/* Balance */}
      <div className="mt-3 pt-3 border-t flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Balance mensual</span>
        <span className={cn(
          'text-sm font-semibold',
          location.balance > 0
            ? 'text-green-600 dark:text-green-400'
            : location.balance < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-muted-foreground'
        )}>
          {location.balance > 0 ? '+' : ''}{location.balance}
        </span>
      </div>
    </button>
  )
}

function RouteCardsView({
  locations,
  onRouteClick,
}: {
  locations: LocationBreakdownType[]
  onRouteClick: (routeId: string) => void
}) {
  // Calculate totals
  const totals = locations.reduce(
    (acc, loc) => ({
      activos: acc.activos + loc.clientesActivos,
      alCorriente: acc.alCorriente + loc.clientesAlCorriente,
      enCV: acc.enCV + loc.clientesEnCV,
      balance: acc.balance + loc.balance,
    }),
    { activos: 0, alCorriente: 0, enCV: 0, balance: 0 }
  )

  // Sort by clientes activos descending
  const sortedLocations = [...locations].sort(
    (a, b) => b.clientesActivos - a.clientesActivos
  )

  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">Sin datos de rutas</h3>
        <p className="text-sm text-muted-foreground">
          No hay rutas con clientes activos en este período
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          <Users className="h-3 w-3 mr-1" />
          {totals.activos} Activos
        </Badge>
        <Badge variant="secondary" className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400">
          <UserCheck className="h-3 w-3 mr-1" />
          {totals.alCorriente} OK
        </Badge>
        <Badge variant="secondary" className="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400">
          <UserX className="h-3 w-3 mr-1" />
          {totals.enCV} CV
        </Badge>
      </div>

      {/* Instruction */}
      <p className="text-sm text-muted-foreground">
        Haz clic en una ruta para ver el detalle por localidad
      </p>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedLocations.map((location) => (
          <RouteCard
            key={location.locationId}
            location={location}
            onClick={() => onRouteClick(location.routeId || location.locationId)}
          />
        ))}
      </div>
    </div>
  )
}

export function LocationBreakdown({
  locations,
  localityReport,
  localityLoading,
  year,
  month,
}: LocationBreakdownProps) {
  // Drill-down state: null = show routes, string = show localities for that route
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [selectedLocality, setSelectedLocality] = useState<LocalityBreakdownDetail | null>(null)
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number | undefined>(undefined)

  // Find the selected route name
  const selectedRouteName = useMemo(() => {
    if (!selectedRouteId) return null
    const route = locations.find((loc) => loc.routeId === selectedRouteId || loc.locationId === selectedRouteId)
    return route?.routeName || route?.locationName || 'Ruta'
  }, [selectedRouteId, locations])

  const handleRouteClick = (routeId: string) => {
    setSelectedRouteId(routeId)
  }

  const handleBackToRoutes = () => {
    setSelectedRouteId(null)
  }

  const handleLocalityClick = (locality: LocalityBreakdownDetail, weekNumber?: number) => {
    setSelectedLocality(locality)
    setSelectedWeekNumber(weekNumber)
  }

  const handleModalClose = () => {
    setSelectedLocality(null)
    setSelectedWeekNumber(undefined)
  }

  // Filter localities by selected route for drill-down view
  const filteredLocalityReport = useMemo(() => {
    if (!localityReport || !selectedRouteId) return localityReport

    const filteredLocalities = localityReport.localities.filter(
      (loc) => loc.routeId === selectedRouteId
    )

    // Recalculate totals for filtered data
    const totals = filteredLocalities.reduce(
      (acc, loc) => ({
        totalClientesActivos: acc.totalClientesActivos + loc.summary.totalClientesActivos,
        totalClientesAlCorriente: acc.totalClientesAlCorriente + loc.summary.totalClientesAlCorriente,
        totalClientesEnCV: acc.totalClientesEnCV + loc.summary.totalClientesEnCV,
        totalNuevos: acc.totalNuevos + loc.summary.totalNuevos,
        totalRenovados: acc.totalRenovados + loc.summary.totalRenovados,
        totalReintegros: acc.totalReintegros + loc.summary.totalReintegros,
        totalFinalizados: acc.totalFinalizados + loc.summary.totalFinalizados,
        balance: acc.balance + loc.summary.balance,
        alCorrientePromedio: 0,
        cvPromedio: 0,
        porcentajePagando: 0,
      }),
      {
        totalClientesActivos: 0,
        totalClientesAlCorriente: 0,
        totalClientesEnCV: 0,
        totalNuevos: 0,
        totalRenovados: 0,
        totalReintegros: 0,
        totalFinalizados: 0,
        balance: 0,
        alCorrientePromedio: 0,
        cvPromedio: 0,
        porcentajePagando: 0,
      }
    )

    // Calculate averages (with fallback for cached data without new fields)
    if (filteredLocalities.length > 0) {
      totals.alCorrientePromedio = filteredLocalities.reduce(
        (sum, loc) => sum + (loc.summary.alCorrientePromedio ?? loc.summary.totalClientesAlCorriente ?? 0),
        0
      ) / filteredLocalities.length
      totals.cvPromedio = filteredLocalities.reduce(
        (sum, loc) => sum + (loc.summary.cvPromedio ?? loc.summary.totalClientesEnCV ?? 0),
        0
      ) / filteredLocalities.length
      totals.porcentajePagando = totals.totalClientesActivos > 0
        ? (totals.totalClientesAlCorriente / totals.totalClientesActivos) * 100
        : 0
    }

    return {
      ...localityReport,
      localities: filteredLocalities,
      totals,
    }
  }, [localityReport, selectedRouteId])

  const localityCount = filteredLocalityReport?.localities.length ?? 0

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {selectedRouteId ? (
                // Drill-down header with back button
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToRoutes}
                    className="flex items-center gap-1 -ml-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Rutas</span>
                  </Button>
                  <div className="h-6 w-px bg-border" />
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Route className="h-5 w-5" />
                      {selectedRouteName}
                    </CardTitle>
                    <CardDescription>
                      {localityCount} localidades con clientes activos
                    </CardDescription>
                  </div>
                </div>
              ) : (
                // Routes view header
                <>
                  <CardTitle className="text-lg">Desglose por Ruta</CardTitle>
                  <CardDescription>
                    {locations.length} rutas con clientes activos
                  </CardDescription>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedRouteId ? (
            // Drill-down: Show localities for selected route
            localityLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <LocalityWeeklyTable
                report={filteredLocalityReport ?? null}
                onLocalityClick={handleLocalityClick}
              />
            )
          ) : (
            // Default: Show route cards
            <RouteCardsView
              locations={locations}
              onRouteClick={handleRouteClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <LocalityDetailModal
        locality={selectedLocality}
        year={year}
        month={month}
        weekNumber={selectedWeekNumber}
        onClose={handleModalClose}
      />
    </>
  )
}
