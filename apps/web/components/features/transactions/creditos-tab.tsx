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
  CreditCard,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle,
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
import { useTransactionContext } from './transaction-context'
import { formatCurrency } from '@/lib/utils'

const LOANS_BY_DATE_QUERY = gql`
  query LoansByDate($routeId: ID!, $date: DateTime!, $leadId: ID) {
    loans(routeId: $routeId, signDate: $date, grantorId: $leadId) {
      id
      amount
      profitAmount
      signDate
      loanType
      status
      hasCompleteAvals
      borrower {
        id
        personalData {
          fullName
        }
      }
      avals {
        id
        personalData {
          fullName
        }
      }
      grantor {
        id
        personalDataRelation {
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

const INCOMPLETE_AVALS_QUERY = gql`
  query IncompleteAvals($routeId: ID!) {
    loans(routeId: $routeId, hasCompleteAvals: false, status: ACTIVE) {
      id
      amount
      signDate
      borrower {
        id
        personalData {
          fullName
        }
      }
      avals {
        id
        personalData {
          fullName
        }
      }
    }
  }
`

interface Loan {
  id: string
  amount: number
  profitAmount: number
  signDate: string
  loanType: string
  status: string
  hasCompleteAvals: boolean
  borrower: {
    id: string
    personalData?: {
      fullName: string
    }
  }
  avals: Array<{
    id: string
    personalData?: {
      fullName: string
    }
  }>
  grantor?: {
    id: string
    personalDataRelation?: {
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
        Selecciona una ruta y fecha para ver y registrar los créditos del día
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

const loanTypeLabels: Record<string, string> = {
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
}

export function CreditosTab() {
  const { selectedRouteId, selectedDate, selectedLeadId } = useTransactionContext()
  const [searchTerm, setSearchTerm] = useState('')

  // TODO: Enable queries when loan date filtering is implemented in the backend
  // const { data: loansData, loading: loansLoading } = useQuery<{ loans: Loan[] }>(
  //   LOANS_BY_DATE_QUERY,
  //   {
  //     variables: {
  //       routeId: selectedRouteId,
  //       date: format(selectedDate, 'yyyy-MM-dd'),
  //       leadId: selectedLeadId,
  //     },
  //     skip: !selectedRouteId,
  //   }
  // )

  // const { data: incompleteData, loading: incompleteLoading } = useQuery<{ loans: Loan[] }>(
  //   INCOMPLETE_AVALS_QUERY,
  //   {
  //     variables: { routeId: selectedRouteId },
  //     skip: !selectedRouteId,
  //   }
  // )

  if (!selectedRouteId) {
    return <EmptyState />
  }

  // Placeholder data until queries are implemented
  const loans: Loan[] = []
  const incompleteLoans: Loan[] = []

  // Filter loans
  const filteredLoans = searchTerm
    ? loans.filter(l =>
        l.borrower.personalData?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : loans

  // Calculate totals
  const totalLoaned = loans.reduce((sum, l) => sum + l.amount, 0)
  const totalProfit = loans.reduce((sum, l) => sum + l.profitAmount, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Créditos del Día</p>
                <p className="text-2xl font-bold">{loans.length}</p>
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
                <p className="text-sm text-muted-foreground">Total Prestado</p>
                <p className="text-2xl font-bold">{formatCurrency(totalLoaned)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <CreditCard className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ganancia Esperada</p>
                <p className="text-2xl font-bold">{formatCurrency(totalProfit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incomplete Avals Warning */}
      {incompleteLoans.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <CardTitle className="text-warning">Avales Incompletos</CardTitle>
            </div>
            <CardDescription>
              {incompleteLoans.length} préstamos requieren información de avales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {incompleteLoans.slice(0, 3).map((loan) => (
                <div key={loan.id} className="flex items-center justify-between p-2 bg-background rounded-md">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{loan.borrower.personalData?.fullName || 'Sin nombre'}</span>
                    <Badge variant="outline">{formatCurrency(loan.amount)}</Badge>
                  </div>
                  <Button size="sm" variant="outline">
                    Completar Aval
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Créditos Otorgados</CardTitle>
              <CardDescription>
                {loans.length} créditos • {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </CardDescription>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Crédito
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
          </div>
        </CardHeader>
        <CardContent>
          {filteredLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay créditos registrados para esta fecha</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Localidad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Avales</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {loan.borrower.personalData?.fullName || 'Sin nombre'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{loan.locality?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {loanTypeLabels[loan.loanType] || loan.loanType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {loan.hasCompleteAvals ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                        <span className="text-sm">
                          {loan.avals.length > 0
                            ? loan.avals.map(a => a.personalData?.fullName || 'Pendiente').join(', ')
                            : 'Sin avales'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(loan.amount)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-success">
                      {formatCurrency(loan.profitAmount)}
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
