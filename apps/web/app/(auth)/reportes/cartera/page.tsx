'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Loader2,
  AlertTriangle,
  Download,
  RefreshCw,
  BarChart3,
} from 'lucide-react'
import {
  usePortfolioReport,
  useActiveClientsWithCVStatus,
  usePeriodNavigation,
  useLocalityReport,
} from './hooks'
import {
  WeekSelector,
  PortfolioSummaryCard,
  CVStatusTable,
  LocationBreakdown,
  ClientBalanceChart,
} from './components'
import { GET_ROUTES } from '@/graphql/queries/reports'

interface Route {
  id: string
  name: string
}

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-96" />
    </div>
  )
}

export default function PortfolioReportPage() {
  const [activeTab, setActiveTab] = useState('resumen')

  // Period navigation - always use MONTHLY view
  const {
    year,
    month,
    setYear,
    setMonth,
    goToCurrentPeriod,
  } = usePeriodNavigation('MONTHLY')

  // Portfolio report data - always monthly
  const {
    report,
    currentActiveWeek,
    loading,
    error,
    pdfLoading,
    refetch,
    generatePDF,
  } = usePortfolioReport({
    periodType: 'MONTHLY',
    year,
    month,
  })

  // Active clients with CV status (for detailed table)
  const {
    clients,
    loading: clientsLoading,
  } = useActiveClientsWithCVStatus()

  // Locality report for "Por Localidad" view
  const {
    localityReport,
    loading: localityLoading,
  } = useLocalityReport({
    year,
    month,
  })

  // Routes data for filters (future use)
  const { data: routesData } = useQuery<{ routes: Route[] }>(GET_ROUTES)

  // Handle PDF download
  const handleDownloadPDF = async () => {
    const result = await generatePDF()
    if (result?.success && result.url) {
      window.open(result.url, '_blank')
    } else if (result?.success && result.base64) {
      // Create download from base64
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${result.base64}`
      link.download = result.filename
      link.click()
    }
  }

  // Render loading state
  if (loading && !report) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reporte de Cartera</h1>
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
        <ReportSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reporte de Cartera</h1>
            <p className="text-muted-foreground">
              Estado de clientes activos y cartera vencida
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Actualizar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={pdfLoading || !report}
          >
            {pdfLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Descargar PDF</span>
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Período del Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <WeekSelector
            periodType="MONTHLY"
            year={year}
            month={month}
            currentActiveWeek={currentActiveWeek}
            onPeriodTypeChange={() => {}}
            onYearChange={setYear}
            onMonthChange={setMonth}
            onWeekNumberChange={() => {}}
            onPrevious={() => {}}
            onNext={() => {}}
            onGoToCurrent={goToCurrentPeriod}
          />
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <h3 className="font-semibold">Error al cargar el reporte</h3>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {report && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="rutas">Por Ruta</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
          </TabsList>

          {/* Resumen Tab */}
          <TabsContent value="resumen" className="space-y-6">
            <PortfolioSummaryCard
              summary={report.summary}
              renovationKPIs={report.renovationKPIs}
            />

            {/* Quick Stats by Location */}
            {report.byLocation.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Rutas por Clientes Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {report.byLocation.slice(0, 6).map((loc) => (
                      <div
                        key={loc.locationId}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{loc.routeName || loc.locationName}</p>
                          <p className="text-sm text-muted-foreground">
                            {loc.clientesActivos} activos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                            {loc.clientesEnCV} CV
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {loc.clientesActivos > 0
                              ? ((loc.clientesEnCV / loc.clientesActivos) * 100).toFixed(0)
                              : 0}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Por Ruta Tab */}
          <TabsContent value="rutas">
            <LocationBreakdown
              locations={report.byLocation}
              localityReport={localityReport}
              localityLoading={localityLoading}
              year={year}
              month={month}
            />
          </TabsContent>

          {/* Clientes Tab */}
          <TabsContent value="clientes">
            <CVStatusTable clients={clients} loading={clientsLoading} />
          </TabsContent>

          {/* Tendencias Tab */}
          <TabsContent value="tendencias">
            {report.weeklyData.length > 0 ? (
              <ClientBalanceChart
                weeklyData={report.weeklyData}
                periodType="MONTHLY"
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold">Sin datos de tendencias</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    No hay información de semanas disponible para este período.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {!loading && !report && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Sin datos para mostrar</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No hay información disponible para el período seleccionado.
              Intenta seleccionar un período diferente.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
