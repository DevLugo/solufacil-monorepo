'use client'

import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, CalendarDays, BarChart3, LineChartIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MonthData {
  label: string // "Dic 2025"
  clientesActivos: number
  alCorrientePromedio: number
  cvPromedio: number
  renovaciones: number
  nuevos: number
}

export interface AnnualMonthData {
  month: number // 1-12
  year: number
  label: string // "Ene", "Feb", etc.
  clientesActivos: number
  alCorrientePromedio: number
  cvPromedio: number
  renovaciones: number
  nuevos: number
  balance: number
}

interface MonthComparisonChartProps {
  currentMonth: MonthData
  previousMonth: MonthData | null
  annualData?: AnnualMonthData[]
  loading?: boolean
}

type ViewMode = 'comparison' | 'annual'

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
]

export function formatMonthLabel(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

function calculateChange(current: number, previous: number | undefined): {
  value: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
} {
  if (previous === undefined || previous === 0) {
    return { value: 0, percentage: 0, trend: 'stable' }
  }
  const value = current - previous
  const percentage = ((current - previous) / previous) * 100
  return {
    value,
    percentage,
    trend: value > 0 ? 'up' : value < 0 ? 'down' : 'stable',
  }
}

function TrendIndicator({
  change,
  inverted = false,
}: {
  change: { value: number; percentage: number; trend: 'up' | 'down' | 'stable' }
  inverted?: boolean // For CV, up is bad
}) {
  const isPositive = inverted ? change.trend === 'down' : change.trend === 'up'
  const isNegative = inverted ? change.trend === 'up' : change.trend === 'down'

  if (change.trend === 'stable') {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span className="text-xs">Sin cambio</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs',
        isPositive && 'text-green-600 dark:text-green-400',
        isNegative && 'text-red-600 dark:text-red-400'
      )}
    >
      {change.trend === 'up' ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>
        {change.value > 0 ? '+' : ''}
        {change.value.toFixed(1)} ({Math.abs(change.percentage).toFixed(0)}%)
      </span>
    </div>
  )
}

// Comparison View Component
function ComparisonView({
  currentMonth,
  previousMonth,
  chartData,
  chartConfig,
  changes,
}: {
  currentMonth: MonthData
  previousMonth: MonthData | null
  chartData: Array<{
    metric: string
    fullName: string
    current: number
    previous: number
    type: 'total' | 'promedio'
    inverted?: boolean
  }>
  chartConfig: ChartConfig
  changes: {
    activos: ReturnType<typeof calculateChange>
    alCorriente: ReturnType<typeof calculateChange>
    cv: ReturnType<typeof calculateChange>
    renovaciones: ReturnType<typeof calculateChange>
    nuevos: ReturnType<typeof calculateChange>
  } | null
}) {
  return (
    <div className="space-y-6">
      {/* Badges showing months being compared */}
      {previousMonth && (
        <div className="flex gap-2 justify-end">
          <Badge variant="outline" className="bg-[hsl(var(--chart-2))]/10">
            <div
              className="h-2 w-2 rounded-full mr-1"
              style={{ backgroundColor: 'hsl(var(--chart-2))' }}
            />
            {currentMonth.label}
          </Badge>
          <Badge variant="outline" className="bg-[hsl(var(--chart-4))]/10">
            <div
              className="h-2 w-2 rounded-full mr-1"
              style={{ backgroundColor: 'hsl(var(--chart-4))' }}
            />
            {previousMonth.label}
          </Badge>
        </div>
      )}

      {/* Horizontal Bar Chart */}
      <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 20, right: 20 }}
        >
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            type="category"
            dataKey="metric"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={80}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  if (payload && payload[0]) {
                    return (payload[0].payload as { fullName: string }).fullName
                  }
                  return ''
                }}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="current"
            fill="var(--color-current)"
            radius={[0, 4, 4, 0]}
            barSize={20}
          />
          {previousMonth && (
            <Bar
              dataKey="previous"
              fill="var(--color-previous)"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
          )}
        </BarChart>
      </ChartContainer>

      {/* Change Summary Cards */}
      {changes && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Activos</p>
            <p className="text-lg font-bold">{currentMonth.clientesActivos}</p>
            <TrendIndicator change={changes.activos} />
          </div>
          <div className="rounded-lg border p-3 border-green-200 dark:border-green-900">
            <p className="text-xs text-muted-foreground">Al Corriente</p>
            <p className="text-lg font-bold text-green-600">
              {(currentMonth.alCorrientePromedio ?? 0).toFixed(1)}
            </p>
            <TrendIndicator change={changes.alCorriente} />
          </div>
          <div className="rounded-lg border p-3 border-red-200 dark:border-red-900">
            <p className="text-xs text-muted-foreground">En CV</p>
            <p className="text-lg font-bold text-red-600">
              {(currentMonth.cvPromedio ?? 0).toFixed(1)}
            </p>
            <TrendIndicator change={changes.cv} inverted />
          </div>
          <div className="rounded-lg border p-3 border-blue-200 dark:border-blue-900">
            <p className="text-xs text-muted-foreground">Renovados</p>
            <p className="text-lg font-bold text-blue-600">{currentMonth.renovaciones}</p>
            <TrendIndicator change={changes.renovaciones} />
          </div>
          <div className="rounded-lg border p-3 border-emerald-200 dark:border-emerald-900">
            <p className="text-xs text-muted-foreground">Nuevos</p>
            <p className="text-lg font-bold text-emerald-600">{currentMonth.nuevos}</p>
            <TrendIndicator change={changes.nuevos} />
          </div>
        </div>
      )}
    </div>
  )
}

// Metric options for the annual trends view
type AnnualMetric = 'cartera' | 'crecimiento' | 'balance'

const ANNUAL_METRIC_CONFIG: Record<AnnualMetric, {
  label: string
  description: string
  chartConfig: ChartConfig
  dataKeys: string[]
}> = {
  cartera: {
    label: 'Cartera',
    description: 'Clientes activos y CV promedio',
    chartConfig: {
      clientesActivos: {
        label: 'Activos',
        color: 'hsl(var(--chart-1))',
      },
      cvPromedio: {
        label: 'CV (Prom.)',
        color: 'hsl(var(--chart-6))',
      },
    },
    dataKeys: ['clientesActivos', 'cvPromedio'],
  },
  crecimiento: {
    label: 'Crecimiento',
    description: 'Nuevos clientes y renovaciones',
    chartConfig: {
      nuevos: {
        label: 'Nuevos',
        color: 'hsl(var(--chart-4))',
      },
      renovaciones: {
        label: 'Renovaciones',
        color: 'hsl(var(--chart-3))',
      },
    },
    dataKeys: ['nuevos', 'renovaciones'],
  },
  balance: {
    label: 'Balance',
    description: 'Balance neto mensual',
    chartConfig: {
      balance: {
        label: 'Balance',
        color: 'hsl(var(--chart-2))',
      },
    },
    dataKeys: ['balance'],
  },
}

// Annual Trends View Component
function AnnualTrendsView({
  annualData,
}: {
  annualData: AnnualMonthData[]
  currentMonth: MonthData
}) {
  const [selectedMetric, setSelectedMetric] = useState<AnnualMetric>('cartera')
  const metricConfig = ANNUAL_METRIC_CONFIG[selectedMetric]

  // Calculate year-over-year changes
  const firstMonth = annualData[0]
  const lastMonth = annualData[annualData.length - 1]

  const yearStats = useMemo(() => {
    if (!firstMonth || !lastMonth) return null

    return {
      activos: {
        start: firstMonth.clientesActivos,
        end: lastMonth.clientesActivos,
        change: lastMonth.clientesActivos - firstMonth.clientesActivos,
      },
      cv: {
        start: firstMonth.cvPromedio,
        end: lastMonth.cvPromedio,
        change: lastMonth.cvPromedio - firstMonth.cvPromedio,
      },
      totalNuevos: annualData.reduce((sum, d) => sum + d.nuevos, 0),
      totalRenovaciones: annualData.reduce((sum, d) => sum + d.renovaciones, 0),
      balanceTotal: annualData.reduce((sum, d) => sum + d.balance, 0),
    }
  }, [annualData, firstMonth, lastMonth])

  return (
    <div className="space-y-4">
      {/* Year Summary Stats */}
      {yearStats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground">Activos</p>
            <p className="text-lg font-bold">{yearStats.activos.end}</p>
            <p className={cn(
              'text-xs',
              yearStats.activos.change > 0 ? 'text-green-600' : yearStats.activos.change < 0 ? 'text-red-600' : 'text-muted-foreground'
            )}>
              {yearStats.activos.change > 0 ? '+' : ''}{yearStats.activos.change} vs inicio
            </p>
          </div>
          <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-950/20">
            <p className="text-xs text-muted-foreground">CV Prom.</p>
            <p className="text-lg font-bold text-red-600">{yearStats.cv.end.toFixed(1)}</p>
            <p className={cn(
              'text-xs',
              yearStats.cv.change < 0 ? 'text-green-600' : yearStats.cv.change > 0 ? 'text-red-600' : 'text-muted-foreground'
            )}>
              {yearStats.cv.change > 0 ? '+' : ''}{yearStats.cv.change.toFixed(1)} vs inicio
            </p>
          </div>
          <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950/20">
            <p className="text-xs text-muted-foreground">Nuevos (año)</p>
            <p className="text-lg font-bold text-blue-600">{yearStats.totalNuevos}</p>
            <p className="text-xs text-muted-foreground">
              ~{(yearStats.totalNuevos / annualData.length).toFixed(0)}/mes
            </p>
          </div>
          <div className={cn(
            'rounded-lg border p-3',
            yearStats.balanceTotal >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
          )}>
            <p className="text-xs text-muted-foreground">Balance (año)</p>
            <p className={cn(
              'text-lg font-bold',
              yearStats.balanceTotal >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {yearStats.balanceTotal > 0 ? '+' : ''}{yearStats.balanceTotal}
            </p>
            <p className="text-xs text-muted-foreground">
              clientes neto
            </p>
          </div>
        </div>
      )}

      {/* Metric Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Ver:</span>
        <div className="flex gap-1">
          {(Object.keys(ANNUAL_METRIC_CONFIG) as AnnualMetric[]).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                selectedMetric === metric
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {ANNUAL_METRIC_CONFIG[metric].label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          {metricConfig.description}
        </p>
        <ChartContainer config={metricConfig.chartConfig} className="min-h-[220px] w-full">
          <BarChart data={annualData} margin={{ left: -10, right: 10 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={11}
              width={40}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `${value} ${annualData[0]?.year || ''}`}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {metricConfig.dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={[4, 4, 0, 0]}
                barSize={metricConfig.dataKeys.length === 1 ? 32 : 16}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </div>

      {/* Monthly Table Summary */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Mes</th>
              <th className="px-3 py-2 text-right font-medium">Activos</th>
              <th className="px-3 py-2 text-right font-medium">CV</th>
              <th className="px-3 py-2 text-right font-medium">Nuevos</th>
              <th className="px-3 py-2 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {annualData.map((d, i) => (
              <tr key={d.month} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                <td className="px-3 py-2 font-medium">{d.label}</td>
                <td className="px-3 py-2 text-right">{d.clientesActivos}</td>
                <td className="px-3 py-2 text-right text-red-600">{d.cvPromedio.toFixed(1)}</td>
                <td className="px-3 py-2 text-right text-blue-600">{d.nuevos}</td>
                <td className={cn(
                  'px-3 py-2 text-right font-medium',
                  d.balance > 0 ? 'text-green-600' : d.balance < 0 ? 'text-red-600' : ''
                )}>
                  {d.balance > 0 ? '+' : ''}{d.balance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function MonthComparisonChart({
  currentMonth,
  previousMonth,
  annualData,
  loading = false,
}: MonthComparisonChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('comparison')

  const chartData = useMemo(() => {
    const metrics = [
      {
        metric: 'Activos',
        fullName: 'Clientes Activos',
        current: currentMonth.clientesActivos ?? 0,
        previous: previousMonth?.clientesActivos ?? 0,
        type: 'total' as const,
      },
      {
        metric: 'Al Corriente',
        fullName: 'Al Corriente (Prom.)',
        current: currentMonth.alCorrientePromedio ?? 0,
        previous: previousMonth?.alCorrientePromedio ?? 0,
        type: 'promedio' as const,
      },
      {
        metric: 'En CV',
        fullName: 'En CV (Prom.)',
        current: currentMonth.cvPromedio ?? 0,
        previous: previousMonth?.cvPromedio ?? 0,
        type: 'promedio' as const,
        inverted: true,
      },
      {
        metric: 'Renovados',
        fullName: 'Renovaciones',
        current: currentMonth.renovaciones ?? 0,
        previous: previousMonth?.renovaciones ?? 0,
        type: 'total' as const,
      },
      {
        metric: 'Nuevos',
        fullName: 'Clientes Nuevos',
        current: currentMonth.nuevos ?? 0,
        previous: previousMonth?.nuevos ?? 0,
        type: 'total' as const,
      },
    ]

    return metrics
  }, [currentMonth, previousMonth])

  const chartConfig: ChartConfig = {
    current: {
      label: currentMonth.label,
      color: 'hsl(var(--chart-2))',
    },
    previous: {
      label: previousMonth?.label ?? 'Mes Anterior',
      color: 'hsl(var(--chart-4))',
    },
  }

  // Calculate changes for summary badges
  const changes = useMemo(() => {
    if (!previousMonth) return null
    return {
      activos: calculateChange(currentMonth.clientesActivos ?? 0, previousMonth.clientesActivos),
      alCorriente: calculateChange(currentMonth.alCorrientePromedio ?? 0, previousMonth.alCorrientePromedio),
      cv: calculateChange(currentMonth.cvPromedio ?? 0, previousMonth.cvPromedio),
      renovaciones: calculateChange(currentMonth.renovaciones ?? 0, previousMonth.renovaciones),
      nuevos: calculateChange(currentMonth.nuevos ?? 0, previousMonth.nuevos),
    }
  }, [currentMonth, previousMonth])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Análisis Mensual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Cargando...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasAnnualData = annualData && annualData.length > 1

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Análisis Mensual
            </CardTitle>
            <CardDescription>
              {viewMode === 'comparison'
                ? `${currentMonth.label} vs ${previousMonth?.label ?? 'Sin datos anteriores'}`
                : `Tendencias del año ${annualData?.[0]?.year ?? ''}`}
            </CardDescription>
          </div>

          {/* View Toggle */}
          {hasAnnualData && (
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="comparison" className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Comparación</span>
                </TabsTrigger>
                <TabsTrigger value="annual" className="flex items-center gap-1.5">
                  <LineChartIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Tendencias</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'comparison' ? (
          <ComparisonView
            currentMonth={currentMonth}
            previousMonth={previousMonth}
            chartData={chartData}
            chartConfig={chartConfig}
            changes={changes}
          />
        ) : hasAnnualData ? (
          <AnnualTrendsView annualData={annualData!} currentMonth={currentMonth} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <LineChartIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Sin datos anuales</h3>
            <p className="text-sm text-muted-foreground">
              No hay suficientes datos para mostrar tendencias anuales
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
