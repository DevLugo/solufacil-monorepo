'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus,
  Loader2,
  ArrowRight,
  Wallet,
  Building2,
  User,
  MapPin,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { ACCOUNTS_QUERY } from '@/graphql/queries/transactions'

const TRANSFERS_QUERY = gql`
  query TransfersByRouteAndDate($routeId: ID!, $date: DateTime!) {
    transactions(routeId: $routeId, date: $date, type: TRANSFER) {
      edges {
        node {
          id
          amount
          date
          description
          sourceAccount {
            id
            name
            type
          }
          destinationAccount {
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

const INVESTMENTS_QUERY = gql`
  query InvestmentsByRouteAndDate($routeId: ID!, $date: DateTime!) {
    transactions(routeId: $routeId, date: $date, type: INVESTMENT) {
      edges {
        node {
          id
          amount
          date
          description
          destinationAccount {
            id
            name
            type
          }
        }
      }
    }
  }
`

interface Transfer {
  id: string
  amount: number
  date: string
  description?: string
  sourceAccount: {
    id: string
    name: string
    type: string
  }
  destinationAccount: {
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

interface Investment {
  id: string
  amount: number
  date: string
  description?: string
  destinationAccount: {
    id: string
    name: string
    type: string
  }
}

interface Account {
  id: string
  name: string
  type: string
  accountBalance: string
}

const accountTypeIcon: Record<string, typeof Wallet> = {
  BANK: Building2,
  EMPLOYEE: User,
  OFFICE: Wallet,
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Selecciona una ruta</h3>
      <p className="text-muted-foreground max-w-sm">
        Selecciona una ruta y fecha para ver y registrar transferencias
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

export function TransferenciasTab() {
  const { selectedRouteId, selectedDate } = useTransactionContext()
  const [activeSection, setActiveSection] = useState<'transfers' | 'investments'>('transfers')

  // TODO: Enable queries when transfer date filtering is implemented in the backend
  // const { data: transfersData, loading: transfersLoading } = useQuery<{
  //   transactions: { edges: Array<{ node: Transfer }> }
  // }>(TRANSFERS_QUERY, {
  //   variables: {
  //     routeId: selectedRouteId,
  //     date: format(selectedDate, 'yyyy-MM-dd'),
  //   },
  //   skip: !selectedRouteId,
  // })

  // const { data: investmentsData, loading: investmentsLoading } = useQuery<{
  //   transactions: { edges: Array<{ node: Investment }> }
  // }>(INVESTMENTS_QUERY, {
  //   variables: {
  //     routeId: selectedRouteId,
  //     date: format(selectedDate, 'yyyy-MM-dd'),
  //   },
  //   skip: !selectedRouteId,
  // })

  const { data: accountsData, loading: accountsLoading } = useQuery<{ accounts: Account[] }>(
    ACCOUNTS_QUERY,
    {
      variables: { routeId: selectedRouteId },
      skip: !selectedRouteId,
    }
  )

  if (!selectedRouteId) {
    return <EmptyState />
  }

  if (accountsLoading) {
    return <LoadingState />
  }

  // Placeholder data until queries are implemented
  const transfers: Transfer[] = []
  const investments: Investment[] = []
  const accounts = accountsData?.accounts || []

  const totalTransfers = transfers.reduce((sum, t) => sum + t.amount, 0)
  const totalInvestments = investments.reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="space-y-6">
      {/* Account Balances */}
      <div className="grid gap-4 md:grid-cols-4">
        {accounts.slice(0, 4).map((account) => {
          const Icon = accountTypeIcon[account.type] || Wallet
          return (
            <Card key={account.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{account.name}</p>
                    <p className="text-xl font-bold">{formatCurrency(parseFloat(account.accountBalance || '0'))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className={`cursor-pointer transition-colors ${activeSection === 'transfers' ? 'border-primary' : ''}`}
          onClick={() => setActiveSection('transfers')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                  <ArrowRight className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transferencias</p>
                  <p className="text-2xl font-bold">{transfers.length}</p>
                </div>
              </div>
              <p className="text-lg font-medium">{formatCurrency(totalTransfers)}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${activeSection === 'investments' ? 'border-primary' : ''}`}
          onClick={() => setActiveSection('investments')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inversiones de Capital</p>
                  <p className="text-2xl font-bold">{investments.length}</p>
                </div>
              </div>
              <p className="text-lg font-medium text-success">+{formatCurrency(totalInvestments)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfers Section */}
      {activeSection === 'transfers' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transferencias entre Cuentas</CardTitle>
                <CardDescription>
                  {transfers.length} transferencias • {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </CardDescription>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Transferencia
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {transfers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ArrowRight className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay transferencias registradas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origen</TableHead>
                    <TableHead></TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer) => {
                    const SourceIcon = accountTypeIcon[transfer.sourceAccount.type] || Wallet
                    const DestIcon = accountTypeIcon[transfer.destinationAccount.type] || Wallet
                    return (
                      <TableRow key={transfer.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <SourceIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{transfer.sourceAccount.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DestIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{transfer.destinationAccount.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {transfer.lead?.personalData?.fullName || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {transfer.description || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transfer.amount)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Investments Section */}
      {activeSection === 'investments' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inversiones de Capital</CardTitle>
                <CardDescription>
                  {investments.length} inversiones • {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </CardDescription>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Inversión
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {investments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay inversiones registradas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuenta Destino</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((investment) => {
                    const Icon = accountTypeIcon[investment.destinationAccount.type] || Wallet
                    return (
                      <TableRow key={investment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{investment.destinationAccount.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {investment.description || 'Inversión de capital'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-success">
                          +{formatCurrency(investment.amount)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
