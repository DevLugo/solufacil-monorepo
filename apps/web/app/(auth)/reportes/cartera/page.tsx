'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@apollo/client'
import {
  Card,
  CardContent,
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
  LayoutDashboard,
  Route,
} from 'lucide-react'
import {
  usePortfolioReport,
  usePeriodNavigation,
  useLocalityReport,
  useAnnualPortfolioData,
} from './hooks'
import type { AnnualMonthData } from './components'
import {
  WeekSelector,
  PortfolioSummaryCard,
  LocationBreakdown,
  ClientBalanceChart,
  MonthComparisonChart,
  formatMonthLabel,
} from './components'
import { GET_ROUTES } from '@/graphql/queries/reports'

interface RouteType {
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

  // Calculate previous month for comparison
  const { prevYear, prevMonth } = useMemo(() => {
    if (month === 1) {
      return { prevYear: year - 1, prevMonth: 12 }
    }
    return { prevYear: year, prevMonth: month - 1 }
  }, [year, month])

  // Portfolio report data - current month
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

  // Portfolio report data - previous month for comparison
  const {
    report: previousReport,
    loading: previousLoading,
  } = usePortfolioReport({
    periodType: 'MONTHLY',
    year: prevYear,
    month: prevMonth,
  })

  // Locality report for "Por Localidad" view
  const {
    localityReport,
    loading: localityLoading,
  } = useLocalityReport({
    year,
    month,
  })

  // Annual data for trends view
  const {
    annualData: rawAnnualData,
    loading: annualLoading,
  } = useAnnualPortfolioData({
    year,
    currentMonth: month,
  })

  // Routes data for filters (future use)
  const { data: routesData } = useQuery<{ routes: RouteType[] }>(GET_ROUTES)

  // Transform annual data for chart
  const annualData: AnnualMonthData[] = useMemo(() => {
    return rawAnnualData.map((d) => ({
      month: d.month,
      year: d.year,
      label: d.label,
      clientesActivos: d.clientesActivos,
      alCorrientePromedio: d.alCorrientePromedio,
      cvPromedio: d.cvPromedio,
      renovaciones: d.renovaciones,
      nuevos: d.nuevos,
      balance: d.balance,
    }))
  }, [rawAnnualData])

  // Month comparison data
  const monthComparisonData = useMemo(() => {
    if (!report) return null

    // Helper to safely get numeric value (handles undefined and NaN)
    const safeNumber = (value: number | undefined | null): number => {
      if (value === undefined || value === null || Number.isNaN(value)) return 0
      return value
    }

    // Current month data
    const currentMonth = {
      label: formatMonthLabel(month, year),
      clientesActivos: safeNumber(report.summary.totalClientesActivos),
      alCorrientePromedio: safeNumber(report.summary.clientesAlCorriente),
      cvPromedio: safeNumber(report.summary.promedioCV ?? report.summary.clientesEnCV),
      renovaciones: safeNumber(report.renovationKPIs.totalRenovaciones),
      nuevos: safeNumber(report.summary.clientBalance.nuevos),
    }

    // Override with locality report averages if available (with NaN protection)
    if (localityReport?.totals) {
      const alCorriente = localityReport.totals.alCorrientePromedio
      const cv = localityReport.totals.cvPromedio
      if (alCorriente !== undefined && !Number.isNaN(alCorriente)) {
        currentMonth.alCorrientePromedio = alCorriente
      }
      if (cv !== undefined && !Number.isNaN(cv)) {
        currentMonth.cvPromedio = cv
      }
    }

    // Previous month data
    const previousMonth = previousReport
      ? {
          label: formatMonthLabel(prevMonth, prevYear),
          clientesActivos: safeNumber(previousReport.summary.totalClientesActivos),
          alCorrientePromedio: safeNumber(previousReport.summary.clientesAlCorriente),
          cvPromedio: safeNumber(previousReport.summary.promedioCV ?? previousReport.summary.clientesEnCV),
          renovaciones: safeNumber(previousReport.renovationKPIs.totalRenovaciones),
          nuevos: safeNumber(previousReport.summary.clientBalance.nuevos),
        }
      : null

    return { currentMonth, previousMonth }
  }, [report, previousReport, localityReport, month, year, prevMonth, prevYear])

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resumen" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span>Resumen del Mes</span>
            </TabsTrigger>
            <TabsTrigger value="rutas" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              <span>Por Ruta</span>
            </TabsTrigger>
          </TabsList>

          {/* Resumen del Mes Tab */}
          <TabsContent value="resumen" className="space-y-6">
            {/* Month Comparison Chart */}
            {monthComparisonData && (
              <MonthComparisonChart
                currentMonth={monthComparisonData.currentMonth}
                previousMonth={monthComparisonData.previousMonth}
                annualData={annualData.length > 1 ? annualData : undefined}
                loading={previousLoading || annualLoading}
              />
            )}

            {/* KPI Summary Cards */}
            <PortfolioSummaryCard
              summary={report.summary}
              renovationKPIs={report.renovationKPIs}
            />

            {/* Weekly Trends (integrated from Tendencias tab) */}
            {report.weeklyData.length > 0 && (
              <ClientBalanceChart
                weeklyData={report.weeklyData}
                periodType="MONTHLY"
              />
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
