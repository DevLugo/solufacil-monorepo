'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, User, MapPin, Route, Calendar, DollarSign } from 'lucide-react'

export interface RecoveredDeadDebtPayment {
  id: string
  amount: string
  receivedAt: string
  loanId: string
  clientName: string
  clientCode: string
  badDebtDate: string
  routeName: string
  locality: string
  pendingAmount: string
}

interface RecoveredDeadDebtModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payments: RecoveredDeadDebtPayment[]
  title?: string
}

function formatCurrency(value: string | number): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function RecoveredDeadDebtModal({
  open,
  onOpenChange,
  payments,
  title = 'Recovered Dead Debt Details',
}: RecoveredDeadDebtModalProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Group payments by client for a cleaner view
  const groupedByClient = useMemo(() => {
    const groups = new Map<string, {
      clientName: string
      clientCode: string
      locality: string
      routeName: string
      payments: RecoveredDeadDebtPayment[]
      totalRecovered: number
      totalPending: number
    }>()

    payments.forEach(payment => {
      const key = payment.clientCode || payment.clientName
      const existing = groups.get(key)

      if (existing) {
        existing.payments.push(payment)
        existing.totalRecovered += parseFloat(payment.amount)
        // Only count pending once per loan
        if (!existing.payments.some(p => p.loanId === payment.loanId && p.id !== payment.id)) {
          existing.totalPending = parseFloat(payment.pendingAmount)
        }
      } else {
        groups.set(key, {
          clientName: payment.clientName,
          clientCode: payment.clientCode,
          locality: payment.locality,
          routeName: payment.routeName,
          payments: [payment],
          totalRecovered: parseFloat(payment.amount),
          totalPending: parseFloat(payment.pendingAmount),
        })
      }
    })

    return Array.from(groups.values())
  }, [payments])

  // Filter by search term
  const filteredClients = useMemo(() => {
    if (!searchTerm) return groupedByClient

    const term = searchTerm.toLowerCase()
    return groupedByClient.filter(client =>
      client.clientName.toLowerCase().includes(term) ||
      client.clientCode.toLowerCase().includes(term) ||
      client.locality.toLowerCase().includes(term) ||
      client.routeName.toLowerCase().includes(term)
    )
  }, [groupedByClient, searchTerm])

  // Summary stats
  const summary = useMemo(() => {
    const totalRecovered = filteredClients.reduce((sum, c) => sum + c.totalRecovered, 0)
    const totalPending = filteredClients.reduce((sum, c) => sum + c.totalPending, 0)
    const uniqueClients = filteredClients.length
    const totalPayments = filteredClients.reduce((sum, c) => sum + c.payments.length, 0)

    return { totalRecovered, totalPending, uniqueClients, totalPayments }
  }, [filteredClients])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by client, locality, or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-3">
            <p className="text-xs text-muted-foreground">Total Recovered</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary.totalRecovered)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Still Pending</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(summary.totalPending)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Clients</p>
            <p className="text-lg font-bold">{summary.uniqueClients}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Payments</p>
            <p className="text-lg font-bold">{summary.totalPayments}</p>
          </div>
        </div>

        {/* Table */}
        <ScrollArea className="h-[400px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Locality</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="text-right">Recovered</TableHead>
                <TableHead className="text-right">Still Owes</TableHead>
                <TableHead>Payments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No recovered dead debt payments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.clientCode}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{client.clientName}</p>
                          <p className="text-xs text-muted-foreground">{client.clientCode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{client.locality}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Route className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{client.routeName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(client.totalRecovered)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-orange-600 dark:text-orange-400">
                        {formatCurrency(client.totalPending)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {client.payments.map((payment, idx) => (
                          <Badge
                            key={payment.id}
                            variant="outline"
                            className="text-xs"
                            title={`Payment on ${formatDate(payment.receivedAt)}`}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(payment.receivedAt)} - {formatCurrency(payment.amount)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
