'use client'

import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import {
  Wallet,
  TrendingUp,
  DollarSign,
  CreditCard,
  Receipt,
  Loader2,
  MapPin,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useTransactionContext } from './transaction-context'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

const DAILY_SUMMARY_QUERY = gql`
  query DailySummary($routeId: ID!, $date: DateTime!) {
    dailySummary(routeId: $routeId, date: $date) {
      totalIncome
      totalExpenses
      totalPayments
      totalLoansGranted
      totalTransfers
      cashBalance
      bankBalance
      profit
      localities {
        id
        name
        paymentsCount
        paymentsTotal
        loansCount
        loansTotal
      }
    }
  }
`

interface LocalitySummary {
  id: string
  name: string
  paymentsCount: number
  paymentsTotal: number
  loansCount: number
  loansTotal: number
}

interface DailySummary {
  totalIncome: number
  totalExpenses: number
  totalPayments: number
  totalLoansGranted: number
  totalTransfers: number
  cashBalance: number
  bankBalance: number
  profit: number
  localities: LocalitySummary[]
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Selecciona una ruta</h3>
      <p className="text-muted-foreground max-w-sm">
        Selecciona una ruta y fecha para ver el resumen de operaciones del día
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export function ResumenTab() {
  const { selectedRouteId, selectedDate } = useTransactionContext()

  // TODO: Enable query when dailySummary is implemented in the backend
  // const { data, loading, error } = useQuery<{ dailySummary: DailySummary }>(
  //   DAILY_SUMMARY_QUERY,
  //   {
  //     variables: {
  //       routeId: selectedRouteId,
  //       date: format(selectedDate, 'yyyy-MM-dd'),
  //     },
  //     skip: !selectedRouteId,
  //   }
  // )

  if (!selectedRouteId) {
    return <EmptyState />
  }

  // Placeholder data until dailySummary query is implemented
  const summary: DailySummary = {
    totalIncome: 0,
    totalExpenses: 0,
    totalPayments: 0,
    totalLoansGranted: 0,
    totalTransfers: 0,
    cashBalance: 0,
    bankBalance: 0,
    profit: 0,
    localities: [],
  }

  const kpis = [
    {
      title: 'Abonos del Día',
      value: formatCurrency(summary.totalPayments),
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
      description: 'Total cobrado',
    },
    {
      title: 'Créditos Otorgados',
      value: formatCurrency(summary.totalLoansGranted),
      icon: CreditCard,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      description: 'Préstamos nuevos',
    },
    {
      title: 'Gastos',
      value: formatCurrency(summary.totalExpenses),
      icon: Receipt,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      description: 'Total gastado',
    },
    {
      title: 'Ganancia',
      value: formatCurrency(summary.profit),
      icon: TrendingUp,
      color: summary.profit >= 0 ? 'text-success' : 'text-destructive',
      bgColor: summary.profit >= 0 ? 'bg-success/10' : 'bg-destructive/10',
      description: 'Utilidad del día',
    },
  ]

  const balances = [
    {
      title: 'Efectivo',
      value: formatCurrency(summary.cashBalance),
      icon: Wallet,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Banco',
      value: formatCurrency(summary.bankBalance),
      icon: TrendingUp,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${kpi.bgColor}`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Balances */}
      <div className="grid gap-4 md:grid-cols-2">
        {balances.map((balance) => (
          <Card key={balance.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${balance.bgColor}`}>
                    <balance.icon className={`h-5 w-5 ${balance.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance {balance.title}</p>
                    <p className="text-xl font-bold">{balance.value}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Localities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen por Localidad</CardTitle>
          <CardDescription>
            Desglose de operaciones por localidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.localities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">No hay datos de localidades para esta fecha</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Localidad</TableHead>
                  <TableHead className="text-center">Abonos</TableHead>
                  <TableHead className="text-right">Total Abonos</TableHead>
                  <TableHead className="text-center">Créditos</TableHead>
                  <TableHead className="text-right">Total Créditos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.localities.map((locality) => (
                  <TableRow key={locality.id}>
                    <TableCell className="font-medium">{locality.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{locality.paymentsCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-success font-medium">
                      {formatCurrency(locality.paymentsTotal)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{locality.loansCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(locality.loansTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
