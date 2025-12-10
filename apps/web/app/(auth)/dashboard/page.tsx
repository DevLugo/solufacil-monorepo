'use client'

import { useQuery } from '@apollo/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MapPin,
} from 'lucide-react'
import { useTransactionContext } from '@/components/features/transactions/transaction-context'
import { DASHBOARD_FULL_QUERY } from '@/graphql/queries/dashboard'
import { ROUTES_QUERY } from '@/graphql/queries/transactions'

// Utility function to format currency
function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '$0'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue)
}

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
}

// Get account type label
function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    BANK: 'Banco',
    OFFICE_CASH_FUND: 'Caja Oficina',
    EMPLOYEE_CASH_FUND: 'Fondo Empleado',
    PREPAID_GAS: 'Gasolina',
    TRAVEL_EXPENSES: 'Viáticos',
  }
  return labels[type] || type
}

// Dashboard Skeleton component
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="fintech-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface TransactionNode {
  id: string
  amount: string
  date: string
  type: string
  incomeSource: string | null
  expenseSource: string | null
  loan: {
    borrower: {
      personalData: {
        fullName: string
      }
    }
  } | null
  lead: {
    personalData: {
      fullName: string
    }
  } | null
}

interface Account {
  id: string
  name: string
  type: string
  accountBalance: string
}

interface WeeklyData {
  week: number
  date: string
  loansGranted: number
  paymentsReceived: string
  expectedPayments: string
  recoveryRate: string
}

interface Route {
  id: string
  name: string
}

interface ActiveLoansBreakdown {
  total: number
  alCorriente: number
  carteraVencida: number
}

interface DashboardData {
  financialReport: {
    summary: {
      activeLoans: number
      activeLoansBreakdown: ActiveLoansBreakdown
      totalPortfolio: string
      totalPaid: string
      pendingAmount: string
      averagePayment: string
    }
    weeklyData: WeeklyData[]
    comparisonData: {
      previousMonth: {
        activeLoans: number
        totalPortfolio: string
        totalPaid: string
        pendingAmount: string
      }
      growth: string
      trend: string
    } | null
    performanceMetrics: {
      recoveryRate: string
      averageTicket: string
      activeLoansCount: number
      finishedLoansCount: number
    }
  }
  accounts: Account[]
  transactions: {
    edges: { node: TransactionNode }[]
  }
}

export default function DashboardPage() {
  const { selectedRouteId, setSelectedRouteId } = useTransactionContext()
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // First, fetch all routes
  const { data: routesData, loading: routesLoading } = useQuery<{ routes: Route[] }>(ROUTES_QUERY)
  const routes = routesData?.routes || []

  // Handle route selection change
  const handleRouteChange = (value: string) => {
    if (value === 'all') {
      setSelectedRouteId(null)
    } else {
      setSelectedRouteId(value)
    }
  }

  // Determine which route IDs to use
  const allRouteIds = routesData?.routes?.map((r) => r.id) || []
  const routeIdsToUse = selectedRouteId ? [selectedRouteId] : allRouteIds
  const routeIdForAccounts = selectedRouteId || null // null = all accounts

  // Fetch dashboard data
  const { data, loading, error } = useQuery<DashboardData>(DASHBOARD_FULL_QUERY, {
    variables: {
      routeIds: routeIdsToUse,
      routeId: routeIdForAccounts,
      year: currentYear,
      month: currentMonth,
      limit: 10,
    },
    skip: routeIdsToUse.length === 0,
    fetchPolicy: 'cache-and-network',
  })

  // Calculate weekly averages from weeklyData
  const weeklyData = data?.financialReport?.weeklyData || []
  const completedWeeks = weeklyData.filter((w) => new Date(w.date) <= now)
  const activeWeeks = completedWeeks.length

  const weeklyAveragePayments =
    activeWeeks > 0
      ? completedWeeks.reduce((sum, w) => sum + parseFloat(w.paymentsReceived || '0'), 0) /
        activeWeeks
      : 0

  // Show loading while fetching routes
  if (routesLoading || (loading && !data)) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="rounded-full bg-destructive/10 p-6 mb-4">
          <TrendingDown className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Error al cargar datos</h2>
        <p className="text-muted-foreground max-w-md">{error.message}</p>
      </div>
    )
  }

  const summary = data?.financialReport?.summary
  const comparison = data?.financialReport?.comparisonData
  const metrics = data?.financialReport?.performanceMetrics
  const accounts = data?.accounts || []
  const transactions = data?.transactions?.edges || []

  // Calculate growth percentage
  const growthPercent = comparison?.growth ? parseFloat(comparison.growth).toFixed(1) : '0'
  const trend = comparison?.trend || 'STABLE'

  // Stats cards data
  const stats = [
    {
      title: 'Cartera Total',
      value: formatCurrency(summary?.totalPortfolio),
      change: `${trend === 'UP' ? '+' : trend === 'DOWN' ? '' : ''}${growthPercent}%`,
      trend: trend === 'UP' ? 'up' : trend === 'DOWN' ? 'down' : 'stable',
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Cobranza Mensual',
      value: formatCurrency(summary?.totalPaid),
      change: `${activeWeeks} semanas`,
      trend: 'up',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Préstamos Activos',
      value: summary?.activeLoans?.toLocaleString() || '0',
      change: summary?.activeLoansBreakdown
        ? `${summary.activeLoansBreakdown.alCorriente} al corriente • ${summary.activeLoansBreakdown.carteraVencida} CV`
        : `+${(metrics?.activeLoansCount || 0) - (comparison?.previousMonth?.activeLoans || 0)}`,
      trend: 'up',
      icon: Receipt,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Deuda Pendiente',
      value: formatCurrency(summary?.pendingAmount),
      change: `${parseFloat(metrics?.recoveryRate || '0').toFixed(1)}% recuperado`,
      trend: 'down',
      icon: TrendingDown,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ]

  // Map transaction type to activity type
  function getActivityType(tx: TransactionNode): string {
    if (tx.type === 'INCOME') return 'payment'
    if (tx.type === 'EXPENSE' && tx.expenseSource === 'LOAN_GRANTED') return 'loan'
    if (tx.type === 'EXPENSE') return 'expense'
    if (tx.type === 'TRANSFER') return 'transfer'
    return 'other'
  }

  // Get transaction description
  function getTransactionDescription(tx: TransactionNode): string {
    const borrowerName = tx.loan?.borrower?.personalData?.fullName
    const leadName = tx.lead?.personalData?.fullName

    if (tx.type === 'INCOME') {
      return borrowerName ? `Abono recibido - ${borrowerName}` : 'Abono recibido'
    }
    if (tx.type === 'EXPENSE') {
      if (tx.expenseSource === 'LOAN_GRANTED') {
        return borrowerName ? `Nuevo préstamo - ${borrowerName}` : 'Nuevo préstamo'
      }
      if (tx.expenseSource === 'GASOLINE') return 'Gasto de gasolina'
      if (tx.expenseSource === 'NOMINA_SALARY') return 'Pago de nómina'
      return tx.expenseSource || 'Gasto'
    }
    if (tx.type === 'TRANSFER') {
      return leadName ? `Transferencia a ${leadName}` : 'Transferencia'
    }
    return 'Transacción'
  }

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {monthNames[currentMonth - 1]} {currentYear}
          </p>
        </div>

        {/* Route Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Ruta:</span>
          </div>
          <Select
            value={selectedRouteId || 'all'}
            onValueChange={handleRouteChange}
          >
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Seleccionar ruta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-primary">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-medium">Todas las rutas</span>
                </div>
              </SelectItem>
              {routes.map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-3 w-3 text-primary" />
                    </div>
                    <span>{route.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="fintech-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
                ) : stat.trend === 'down' ? (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
                ) : null}
                <span
                  className={
                    stat.trend === 'up'
                      ? 'text-success'
                      : stat.trend === 'down'
                        ? 'text-destructive'
                        : ''
                  }
                >
                  {stat.change}
                </span>
                {stat.title === 'Cartera Total' && <span className="ml-1">vs. mes anterior</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly averages section */}
      {activeWeeks > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="stats-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Semanas Activas</p>
                  <p className="text-2xl font-bold">{activeWeeks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="stats-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-secondary">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cobranza/Semana</p>
                  <p className="text-2xl font-bold">{formatCurrency(weeklyAveragePayments)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="stats-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-unicorn">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tasa Recuperación</p>
                  <p className="text-2xl font-bold">
                    {parseFloat(metrics?.recoveryRate || '0').toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Accounts */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Cuentas
            </CardTitle>
            <CardDescription>Balance de todas las cuentas</CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay cuentas configuradas
              </p>
            ) : (
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {getAccountTypeLabel(account.type)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(account.accountBalance)}</p>
                      <Badge variant="outline" className="text-xs">
                        {account.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimas transacciones</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay transacciones recientes
              </p>
            ) : (
              <div className="space-y-4">
                {transactions.map(({ node: tx }) => {
                  const activityType = getActivityType(tx)
                  const isPositive = tx.type === 'INCOME'
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            activityType === 'payment'
                              ? 'bg-success/10'
                              : activityType === 'loan'
                                ? 'bg-info/10'
                                : activityType === 'expense'
                                  ? 'bg-warning/10'
                                  : 'bg-muted'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="h-4 w-4 text-success" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{getTransactionDescription(tx)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(tx.date)}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`font-medium ${isPositive ? 'text-success' : 'text-foreground'}`}
                      >
                        {isPositive ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="stats-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Préstamos Terminados</p>
                <p className="text-2xl font-bold">
                  {metrics?.finishedLoansCount?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-secondary">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics?.averageTicket)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-unicorn">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pago Promedio</p>
                <p className="text-2xl font-bold">{formatCurrency(summary?.averagePayment)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
