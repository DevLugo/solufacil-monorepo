'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Filter,
  Search,
  Loader2,
  RefreshCw,
  BookOpen,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TRANSACTIONS_QUERY, ACCOUNTS_QUERY } from '@/graphql/queries/transactions'
import { formatCurrency } from '@/lib/utils'

type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVESTMENT'

interface Transaction {
  id: string
  amount: string
  date: string
  type: TransactionType
  incomeSource?: string
  expenseSource?: string
  profitAmount?: string
  returnToCapital?: string
  loan?: {
    id: string
    borrower?: {
      personalData?: {
        fullName: string
      }
    }
  }
  sourceAccount: {
    id: string
    name: string
    type: string
  }
  destinationAccount?: {
    id: string
    name: string
    type: string
  }
  route?: {
    id: string
    name: string
  }
  lead?: {
    id: string
    personalData?: {
      fullName: string
    }
  }
  createdAt: string
}

interface TransactionsData {
  transactions: {
    edges: Array<{
      node: Transaction
      cursor: string
    }>
    pageInfo: {
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string
      endCursor: string
    }
    totalCount: number
  }
}

interface Account {
  id: string
  name: string
  type: string
  amount: string
  accountBalance: string
}

interface AccountsData {
  accounts: Account[]
}

const transactionTypeConfig: Record<TransactionType, { label: string; icon: typeof ArrowUpRight; color: string; bgColor: string }> = {
  INCOME: {
    label: 'Ingreso',
    icon: ArrowDownLeft,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  EXPENSE: {
    label: 'Gasto',
    icon: ArrowUpRight,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  TRANSFER: {
    label: 'Transferencia',
    icon: ArrowLeftRight,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  INVESTMENT: {
    label: 'Inversión',
    icon: TrendingUp,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const config = transactionTypeConfig[transaction.type]
  const Icon = config.icon

  const getDescription = () => {
    if (transaction.loan?.borrower?.personalData?.fullName) {
      return `Préstamo - ${transaction.loan.borrower.personalData.fullName}`
    }
    if (transaction.incomeSource) {
      return transaction.incomeSource
    }
    if (transaction.expenseSource) {
      return transaction.expenseSource
    }
    if (transaction.type === 'TRANSFER') {
      return `${transaction.sourceAccount.name} → ${transaction.destinationAccount?.name || 'N/A'}`
    }
    return transaction.sourceAccount.name
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${config.bgColor}`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          <div>
            <p className="font-medium">{getDescription()}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(transaction.date), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {config.label}
        </Badge>
      </TableCell>
      <TableCell>
        {transaction.route?.name || '-'}
      </TableCell>
      <TableCell>
        {transaction.lead?.personalData?.fullName || '-'}
      </TableCell>
      <TableCell className="text-right">
        <span className={transaction.type === 'INCOME' ? 'text-success font-medium' : transaction.type === 'EXPENSE' ? 'text-destructive font-medium' : 'font-medium'}>
          {transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' ? '-' : ''}
          {formatCurrency(transaction.amount)}
        </span>
      </TableCell>
    </TableRow>
  )
}

function TransactionsList({ type, searchTerm }: { type?: TransactionType; searchTerm: string }) {
  const { data, loading, error, refetch } = useQuery<TransactionsData>(TRANSACTIONS_QUERY, {
    variables: {
      type,
      limit: 50,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  })

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive mb-4">Error al cargar movimientos</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    )
  }

  const transactions = data?.transactions.edges.map(edge => edge.node) || []
  const filteredTransactions = searchTerm
    ? transactions.filter(t =>
        t.loan?.borrower?.personalData?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.incomeSource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.expenseSource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sourceAccount.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : transactions

  if (filteredTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay movimientos</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descripción</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Ruta</TableHead>
          <TableHead>Líder</TableHead>
          <TableHead className="text-right">Monto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredTransactions.map((transaction) => (
          <TransactionRow key={transaction.id} transaction={transaction} />
        ))}
      </TableBody>
    </Table>
  )
}

function AccountsSummary() {
  const { data, loading } = useQuery<AccountsData>(ACCOUNTS_QUERY)

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-8 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const accounts = data?.accounts || []
  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.accountBalance || '0'), 0)
  const bankAccounts = accounts.filter(a => a.type === 'BANK')
  const officeAccounts = accounts.filter(a => a.type === 'OFFICE')
  const employeeAccounts = accounts.filter(a => a.type === 'EMPLOYEE')

  const stats = [
    {
      title: 'Balance Total',
      value: formatCurrency(totalBalance),
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Cuentas Bancarias',
      value: formatCurrency(bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.accountBalance || '0'), 0)),
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Fondos de Oficina',
      value: formatCurrency(officeAccounts.reduce((sum, acc) => sum + parseFloat(acc.accountBalance || '0'), 0)),
      icon: Receipt,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Empleados',
      value: formatCurrency(employeeAccounts.reduce((sum, acc) => sum + parseFloat(acc.accountBalance || '0'), 0)),
      icon: TrendingDown,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function MovimientosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Libro de Movimientos</h1>
          <p className="text-muted-foreground">
            Historial completo de movimientos financieros del sistema
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Account Summary */}
      <AccountsSummary />

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registro de Movimientos</CardTitle>
              <CardDescription>
                Todos los movimientos financieros registrados en el sistema
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="income">
                <ArrowDownLeft className="mr-1 h-4 w-4" />
                Ingresos
              </TabsTrigger>
              <TabsTrigger value="expense">
                <ArrowUpRight className="mr-1 h-4 w-4" />
                Gastos
              </TabsTrigger>
              <TabsTrigger value="transfer">
                <ArrowLeftRight className="mr-1 h-4 w-4" />
                Transferencias
              </TabsTrigger>
              <TabsTrigger value="investment">
                <TrendingUp className="mr-1 h-4 w-4" />
                Inversiones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <TransactionsList searchTerm={searchTerm} />
            </TabsContent>
            <TabsContent value="income">
              <TransactionsList type="INCOME" searchTerm={searchTerm} />
            </TabsContent>
            <TabsContent value="expense">
              <TransactionsList type="EXPENSE" searchTerm={searchTerm} />
            </TabsContent>
            <TabsContent value="transfer">
              <TransactionsList type="TRANSFER" searchTerm={searchTerm} />
            </TabsContent>
            <TabsContent value="investment">
              <TransactionsList type="INVESTMENT" searchTerm={searchTerm} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
