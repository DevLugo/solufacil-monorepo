'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus,
  Search,
  Loader2,
  Receipt,
  Fuel,
  Utensils,
  Car,
  Home,
  Wallet,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTransactionContext } from './transaction-context'
import { formatCurrency } from '@/lib/utils'

const EXPENSES_QUERY = gql`
  query ExpensesByRouteAndDate($routeId: ID!, $date: DateTime!, $leadId: ID) {
    transactions(routeId: $routeId, date: $date, type: EXPENSE, leadId: $leadId) {
      edges {
        node {
          id
          amount
          date
          expenseSource
          description
          sourceAccount {
            id
            name
            type
          }
          lead {
            id
            personalData {
              fullName
            }
          }
        }
      }
    }
  }
`

interface Expense {
  id: string
  amount: number
  date: string
  expenseSource: string
  description?: string
  sourceAccount: {
    id: string
    name: string
    type: string
  }
  lead?: {
    id: string
    personalData?: {
      fullName: string
    }
  }
}

const expenseTypeConfig: Record<string, { label: string; icon: typeof Receipt; color: string }> = {
  VIATIC: { label: 'Viáticos', icon: Utensils, color: 'text-orange-500' },
  GASOLINE: { label: 'Gasolina', icon: Fuel, color: 'text-red-500' },
  ACCOMMODATION: { label: 'Hospedaje', icon: Home, color: 'text-blue-500' },
  VEHICULE_MAINTENANCE: { label: 'Mantenimiento Vehículo', icon: Car, color: 'text-gray-500' },
  NOMINA_SALARY: { label: 'Nómina', icon: Wallet, color: 'text-green-500' },
  EXTERNAL_SALARY: { label: 'Salario Externo', icon: Wallet, color: 'text-purple-500' },
  CAR_WASH: { label: 'Lavado Auto', icon: Car, color: 'text-cyan-500' },
  TOLLS: { label: 'Casetas', icon: Car, color: 'text-yellow-500' },
  OFFICE_SUPPLIES: { label: 'Papelería', icon: Receipt, color: 'text-pink-500' },
  OTHER: { label: 'Otro', icon: Receipt, color: 'text-muted-foreground' },
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Selecciona una ruta</h3>
      <p className="text-muted-foreground max-w-sm">
        Selecciona una ruta y fecha para ver y registrar los gastos del día
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

export function GastosTab() {
  const { selectedRouteId, selectedDate, selectedLeadId } = useTransactionContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // TODO: Enable query when expense date/lead filtering is implemented in the backend
  // const { data, loading } = useQuery<{ transactions: { edges: Array<{ node: Expense }> } }>(
  //   EXPENSES_QUERY,
  //   {
  //     variables: {
  //       routeId: selectedRouteId,
  //       date: format(selectedDate, 'yyyy-MM-dd'),
  //       leadId: selectedLeadId,
  //     },
  //     skip: !selectedRouteId,
  //   }
  // )

  if (!selectedRouteId) {
    return <EmptyState />
  }

  // Placeholder data until queries are implemented
  const expenses: Expense[] = []

  // Filter expenses
  let filteredExpenses = expenses
  if (typeFilter !== 'all') {
    filteredExpenses = expenses.filter(e => e.expenseSource === typeFilter)
  }
  if (searchTerm) {
    filteredExpenses = filteredExpenses.filter(e =>
      e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.lead?.personalData?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Calculate totals by type
  const totalByType = expenses.reduce((acc, expense) => {
    const type = expense.expenseSource || 'OTHER'
    acc[type] = (acc[type] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  // Get top expense categories
  const topCategories = Object.entries(totalByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Receipt className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gastos</p>
                <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {topCategories.map(([type, amount]) => {
          const config = expenseTypeConfig[type] || expenseTypeConfig.OTHER
          const Icon = config.icon
          return (
            <Card key={type}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                    <p className="text-lg font-bold">{formatCurrency(amount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gastos del Día</CardTitle>
              <CardDescription>
                {expenses.length} gastos registrados • {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </CardDescription>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Gasto
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(expenseTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay gastos registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => {
                  const config = expenseTypeConfig[expense.expenseSource] || expenseTypeConfig.OTHER
                  const Icon = config.icon
                  return (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <Badge variant="outline">{config.label}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {expense.description || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {expense.sourceAccount.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        {expense.lead?.personalData?.fullName || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        -{formatCurrency(expense.amount)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
