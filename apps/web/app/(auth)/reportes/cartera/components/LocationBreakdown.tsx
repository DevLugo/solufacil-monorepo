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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin, Users, UserX, UserCheck, Route, Building2, Filter } from 'lucide-react'
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

type ViewMode = 'route' | 'locality'

function LocationCard({ location }: { location: LocationBreakdownType }) {
  const cvPercentage = location.clientesActivos > 0
    ? (location.clientesEnCV / location.clientesActivos) * 100
    : 0

  const alCorrientePercentage = location.clientesActivos > 0
    ? (location.clientesAlCorriente / location.clientesActivos) * 100
    : 0

  return (
    <div className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-semibold">{location.routeName || location.locationName}</h4>
        </div>
        <Badge variant="outline" className="text-xs">
          <Users className="h-3 w-3 mr-1" />
          {location.clientesActivos}
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
          <div>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {location.clientesAlCorriente}
            </span>
            <p className="text-xs text-muted-foreground">Al corriente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
          <div>
            <span className="text-lg font-bold text-red-600 dark:text-red-400">
              {location.clientesEnCV}
            </span>
            <p className="text-xs text-muted-foreground">En CV</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>CV: {cvPercentage.toFixed(1)}%</span>
          <span>OK: {alCorrientePercentage.toFixed(1)}%</span>
        </div>
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
      </div>

      {/* Balance */}
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Balance:</span>
          <span className={cn(
            'font-semibold',
            location.balance > 0
              ? 'text-green-600 dark:text-green-400'
              : location.balance < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-muted-foreground'
          )}>
            {location.balance > 0 ? '+' : ''}{location.balance}
          </span>
        </div>
      </div>
    </div>
  )
}

function RouteCardsView({ locations }: { locations: LocationBreakdownType[] }) {
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
      <div className="flex gap-2">
        <Badge variant="secondary" className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400">
          <UserCheck className="h-3 w-3 mr-1" />
          {totals.alCorriente} OK
        </Badge>
        <Badge variant="secondary" className="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400">
          <UserX className="h-3 w-3 mr-1" />
          {totals.enCV} CV
        </Badge>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedLocations.map((location) => (
          <LocationCard key={location.locationId} location={location} />
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
  const [viewMode, setViewMode] = useState<ViewMode>('route')
  const [selectedLocality, setSelectedLocality] = useState<LocalityBreakdownDetail | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string>('all')

  const handleLocalityClick = (locality: LocalityBreakdownDetail) => {
    setSelectedLocality(locality)
  }

  // Extract unique routes from locality report
  const availableRoutes = useMemo(() => {
    if (!localityReport?.localities) return []
    const routeMap = new Map<string, string>()
    localityReport.localities.forEach((loc) => {
      if (loc.routeId && loc.routeName) {
        routeMap.set(loc.routeId, loc.routeName)
      }
    })
    return Array.from(routeMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [localityReport])

  // Filter localities by selected route
  const filteredLocalityReport = useMemo(() => {
    if (!localityReport || selectedRouteId === 'all') return localityReport

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
        cvPromedio: 0, // Will calculate below
        porcentajePagando: 0, // Will calculate below
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
        cvPromedio: 0,
        porcentajePagando: 0,
      }
    )

    // Calculate averages
    if (filteredLocalities.length > 0) {
      totals.cvPromedio = filteredLocalities.reduce((sum, loc) => sum + loc.summary.cvPromedio, 0) / filteredLocalities.length
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
              <CardTitle className="text-lg">Desglose</CardTitle>
              <CardDescription>
                {viewMode === 'route'
                  ? `${locations.length} rutas con clientes activos`
                  : `${localityCount} localidades con clientes activos`}
              </CardDescription>
            </div>

            {/* View Mode Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="route" className="flex items-center gap-1.5">
                  <Route className="h-4 w-4" />
                  <span className="hidden sm:inline">Por Ruta</span>
                </TabsTrigger>
                <TabsTrigger value="locality" className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Por Localidad</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'route' ? (
            <RouteCardsView locations={locations} />
          ) : localityLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Route Filter */}
              {availableRoutes.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por ruta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las rutas</SelectItem>
                      {availableRoutes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRouteId !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      {localityCount} localidades
                    </Badge>
                  )}
                </div>
              )}

              <LocalityWeeklyTable
                report={filteredLocalityReport ?? null}
                onLocalityClick={handleLocalityClick}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <LocalityDetailModal
        locality={selectedLocality}
        year={year}
        month={month}
        onClose={() => setSelectedLocality(null)}
      />
    </>
  )
}
