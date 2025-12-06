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
  DollarSign,
  User,
  CreditCard,
  MapPin,
  AlertCircle,
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

const PAYMENTS_QUERY = gql`
  query PaymentsByRouteAndDate($routeId: ID!, $date: DateTime!, $leadId: ID) {
    loanPayments(routeId: $routeId, date: $date, leadId: $leadId) {
      id
      amount
      paymentType
      paymentDate
      loan {
        id
        amount
        borrower {
          id
          personalData {
            fullName
          }
        }
        route {
          name
        }
      }
      lead {
        id
        personalDataRelation {
          fullName
        }
      }
    }
  }
`

const PENDING_LOANS_QUERY = gql`
  query PendingLoans($routeId: ID!, $date: DateTime!) {
    loans(routeId: $routeId, status: ACTIVE) {
      id
      amount
      balance
      weeklyPayment
      borrower {
        id
        personalData {
          fullName
        }
      }
      route {
        name
      }
      locality {
        name
      }
    }
  }
`

interface Payment {
  id: string
  amount: number
  paymentType: 'CASH' | 'BANK'
  paymentDate: string
  loan: {
    id: string
    amount: number
    borrower: {
      id: string
      personalData?: {
        fullName: string
      }
    }
    route?: {
      name: string
    }
  }
  lead?: {
    id: string
    personalDataRelation?: {
      fullName: string
    }
  }
}

interface PendingLoan {
  id: string
  amount: number
  balance: number
  weeklyPayment: number
  borrower: {
    id: string
    personalData?: {
      fullName: string
    }
  }
  route?: {
    name: string
  }
  locality?: {
    name: string
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Selecciona una ruta</h3>
      <p className="text-muted-foreground max-w-sm">
        Selecciona una ruta y fecha para registrar los abonos del día
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

export function AbonosTab() {
  const { selectedRouteId, selectedDate, selectedLeadId } = useTransactionContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'bank'>('all')

  // TODO: Enable queries when payment routes are implemented in the backend
  // const { data: paymentsData, loading: paymentsLoading } = useQuery<{ loanPayments: Payment[] }>(
  //   PAYMENTS_QUERY,
  //   {
  //     variables: {
  //       routeId: selectedRouteId,
  //       date: format(selectedDate, 'yyyy-MM-dd'),
  //       leadId: selectedLeadId,
  //     },
  //     skip: !selectedRouteId,
  //   }
  // )

  // const { data: pendingData, loading: pendingLoading } = useQuery<{ loans: PendingLoan[] }>(
  //   PENDING_LOANS_QUERY,
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

  // Placeholder data until queries are implemented
  const payments: Payment[] = []
  const pendingLoans: PendingLoan[] = []

  // Filter payments
  let filteredPayments = payments
  if (paymentFilter !== 'all') {
    filteredPayments = payments.filter(p =>
      paymentFilter === 'cash' ? p.paymentType === 'CASH' : p.paymentType === 'BANK'
    )
  }
  if (searchTerm) {
    filteredPayments = filteredPayments.filter(p =>
      p.loan.borrower.personalData?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Calculate totals
  const totalCash = payments
    .filter(p => p.paymentType === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0)
  const totalBank = payments
    .filter(p => p.paymentType === 'BANK')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Abonos</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCash + totalBank)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Efectivo</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCash)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                <CreditCard className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Banco</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBank)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Abonos del Día</CardTitle>
              <CardDescription>
                {payments.length} abonos registrados • {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </CardDescription>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Abono
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as typeof paymentFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="bank">Banco</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay abonos registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Préstamo</TableHead>
                  <TableHead>Líder</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {payment.loan.borrower.personalData?.fullName || 'Sin nombre'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {formatCurrency(payment.loan.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {payment.lead?.personalDataRelation?.fullName || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payment.paymentType === 'CASH' ? 'default' : 'secondary'}>
                        {payment.paymentType === 'CASH' ? 'Efectivo' : 'Banco'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-success">
                      +{formatCurrency(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Loans */}
      {pendingLoans.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <CardTitle>Préstamos Pendientes de Cobro</CardTitle>
            </div>
            <CardDescription>
              Clientes con pagos pendientes en esta ruta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Localidad</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Pago Semanal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLoans.slice(0, 5).map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">
                      {loan.borrower.personalData?.fullName || 'Sin nombre'}
                    </TableCell>
                    <TableCell>{loan.locality?.name || '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(loan.balance)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(loan.weeklyPayment)}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        Registrar Abono
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
