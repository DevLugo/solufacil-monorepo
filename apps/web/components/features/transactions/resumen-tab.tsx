'use client'

import { useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { startOfDay, endOfDay, format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Wallet,
  TrendingUp,
  DollarSign,
  CreditCard,
  Receipt,
  Loader2,
  MapPin,
  ArrowRight,
  Building2,
  BarChart3,
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
import {
  TRANSACTIONS_QUERY,
  ACCOUNTS_QUERY,
} from '@/graphql/queries/transactions'

interface TransactionNode {
  id: string
  amount: string
  date: string
  type: string
  incomeSource: string | null
  expenseSource: string | null
  profitAmount: string | null
  sourceAccount: { id: string; name: string; type: string } | null
  destinationAccount: { id: string; name: string; type: string } | null
  lead: { id: string; personalData: { fullName: string } } | null
}

interface Account {
  id: string
  name: string
  type: string
  amount: string
  accountBalance: string
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

  // Fetch all transactions for the day
  const { data: transactionsData, loading: transactionsLoading } = useQuery(
    TRANSACTIONS_QUERY,
    {
      variables: {
        routeId: selectedRouteId,
        fromDate: startOfDay(selectedDate).toISOString(),
        toDate: endOfDay(selectedDate).toISOString(),
        limit: 200,
      },
      skip: !selectedRouteId,
    }
  )

  // Fetch account balances
  const { data: accountsData, loading: accountsLoading } = useQuery(
    ACCOUNTS_QUERY,
    {
      variables: { routeId: selectedRouteId },
      skip: !selectedRouteId,
    }
  )

  const transactions: TransactionNode[] = useMemo(() => {
    return transactionsData?.transactions?.edges?.map(
      (edge: { node: TransactionNode }) => edge.node
    ) || []
  }, [transactionsData])

  const accounts: Account[] = useMemo(() => {
    return accountsData?.accounts || []
  }, [accountsData])

  // Calculate summary from transactions
  const summary = useMemo(() => {
    let totalPayments = 0
    let totalLoansGranted = 0
    let totalExpenses = 0
    let totalTransfers = 0
    let totalInvestments = 0

    // Count by type
    let paymentsCount = 0
    let loansCount = 0
    let expensesCount = 0
    let transfersCount = 0

    // By expense type
    const expensesByType: Record<string, number> = {}

    // By leader
    const byLeader: Record<string, {
      name: string
      payments: number
      paymentsAmount: number
      loans: number
      loansAmount: number
      expenses: number
      expensesAmount: number
    }> = {}

    transactions.forEach((tx) => {
      const amount = parseFloat(tx.amount || '0')
      const leadId = tx.lead?.id || 'unknown'
      const leadName = tx.lead?.personalData?.fullName || 'Sin líder'

      // Initialize leader if not exists
      if (!byLeader[leadId]) {
        byLeader[leadId] = {
          name: leadName,
          payments: 0,
          paymentsAmount: 0,
          loans: 0,
          loansAmount: 0,
          expenses: 0,
          expensesAmount: 0,
        }
      }

      switch (tx.type) {
        case 'INCOME':
          if (tx.incomeSource === 'MONEY_INVESMENT') {
            totalInvestments += amount
          } else {
            // Assume payments (ABONO)
            totalPayments += amount
            paymentsCount++
            byLeader[leadId].payments++
            byLeader[leadId].paymentsAmount += amount
          }
          break
        case 'EXPENSE':
          totalExpenses += amount
          expensesCount++
          byLeader[leadId].expenses++
          byLeader[leadId].expensesAmount += amount
          const expenseType = tx.expenseSource || 'OTRO'
          expensesByType[expenseType] = (expensesByType[expenseType] || 0) + amount
          break
        case 'TRANSFER':
          totalTransfers += amount
          transfersCount++
          break
        case 'INVESTMENT':
          totalLoansGranted += amount
          loansCount++
          byLeader[leadId].loans++
          byLeader[leadId].loansAmount += amount
          break
      }
    })

    // Calculate account balances
    let cashBalance = 0
    let bankBalance = 0

    accounts.forEach((acc) => {
      const balance = parseFloat(acc.amount || '0')
      if (acc.type === 'BANK') {
        bankBalance += balance
      } else if (acc.type === 'EMPLOYEE_CASH_FUND' || acc.type === 'OFFICE_CASH_FUND') {
        cashBalance += balance
      }
    })

    // Calculate profit
    const profit = totalPayments - totalExpenses - totalLoansGranted + totalInvestments

    return {
      totalPayments,
      totalLoansGranted,
      totalExpenses,
      totalTransfers,
      totalInvestments,
      paymentsCount,
      loansCount,
      expensesCount,
      transfersCount,
      cashBalance,
      bankBalance,
      profit,
      expensesByType,
      byLeader: Object.values(byLeader).filter(l =>
        l.payments > 0 || l.loans > 0 || l.expenses > 0
      ),
    }
  }, [transactions, accounts])

  if (!selectedRouteId) {
    return <EmptyState />
  }

  if (transactionsLoading || accountsLoading) {
    return <LoadingState />
  }

  const kpis = [
    {
      title: 'Abonos del Día',
      value: formatCurrency(summary.totalPayments),
      count: summary.paymentsCount,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Créditos Otorgados',
      value: formatCurrency(summary.totalLoansGranted),
      count: summary.loansCount,
      icon: CreditCard,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Gastos',
      value: formatCurrency(summary.totalExpenses),
      count: summary.expensesCount,
      icon: Receipt,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      title: 'Transferencias',
      value: formatCurrency(summary.totalTransfers),
      count: summary.transfersCount,
      icon: ArrowRight,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Resumen del {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {transactions.length} transacciones totales
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-lg py-2 px-4 ${
            summary.profit >= 0
              ? 'bg-success/10 text-success border-success/30'
              : 'bg-destructive/10 text-destructive border-destructive/30'
          }`}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          {summary.profit >= 0 ? '+' : ''}
          {formatCurrency(summary.profit)}
        </Badge>
      </div>

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
                  <p className="text-xs text-muted-foreground">
                    {kpi.count} {kpi.count === 1 ? 'operación' : 'operaciones'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Balances and Investment */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                  <Wallet className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Efectivo</p>
                  <p className="text-xl font-bold">{formatCurrency(summary.cashBalance)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                  <Building2 className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Banco</p>
                  <p className="text-xl font-bold">{formatCurrency(summary.bankBalance)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inversiones</p>
                  <p className="text-xl font-bold text-primary">
                    +{formatCurrency(summary.totalInvestments)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary by Leader */}
      {summary.byLeader.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resumen por Líder
            </CardTitle>
            <CardDescription>
              Desglose de operaciones por líder/localidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Líder</TableHead>
                  <TableHead className="text-center">Abonos</TableHead>
                  <TableHead className="text-right">Total Abonos</TableHead>
                  <TableHead className="text-center">Créditos</TableHead>
                  <TableHead className="text-right">Total Créditos</TableHead>
                  <TableHead className="text-center">Gastos</TableHead>
                  <TableHead className="text-right">Total Gastos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.byLeader.map((leader, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{leader.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{leader.payments}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-success font-medium">
                      {formatCurrency(leader.paymentsAmount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{leader.loans}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(leader.loansAmount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{leader.expenses}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      {formatCurrency(leader.expensesAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Expenses by Type */}
      {Object.keys(summary.expensesByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Gastos por Tipo
            </CardTitle>
            <CardDescription>
              Desglose de gastos por categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(summary.expensesByType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, amount]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="text-sm text-muted-foreground capitalize">
                      {type.toLowerCase().replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(amount)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Balances */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saldos de Cuentas</CardTitle>
            <CardDescription>Balance actual de todas las cuentas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {account.type === 'BANK' ? (
                      <Building2 className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Wallet className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm text-muted-foreground truncate">
                      {account.name}
                    </span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(parseFloat(account.amount))}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
