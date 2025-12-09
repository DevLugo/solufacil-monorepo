'use client'

import { useState, useMemo } from 'react'
import { useMutation } from '@apollo/client'
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
  Trash2,
  Pencil,
  DollarSign,
  RefreshCw,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTransactionContext } from '../transaction-context'
import { formatCurrency } from '@/lib/utils'
import { CANCEL_LOAN_WITH_ACCOUNT_RESTORE } from '@/graphql/mutations/transactions'
import { useToast } from '@/hooks/use-toast'
import { useCreditosQueries } from './hooks'
import { CreateLoansModal, EditLoanModal } from './components'
import type { Loan } from './types'

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Selecciona una ruta y localidad</h3>
      <p className="text-muted-foreground max-w-sm">
        Selecciona una ruta y líder/localidad para ver y registrar los créditos del día
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

export function CreditosTab() {
  const { selectedRouteId, selectedDate, selectedLeadId, selectedLocationId } =
    useTransactionContext()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [loanToCancel, setLoanToCancel] = useState<Loan | null>(null)

  // Queries
  const {
    loansToday,
    loansLoading,
    refetchLoans,
    loanTypes,
    loansForRenewal,
    accounts,
    defaultAccount,
  } = useCreditosQueries({
    selectedDate,
    selectedLeadId,
    selectedRouteId,
  })

  // Mutation for canceling loans
  const [cancelLoanWithAccountRestore, { loading: canceling }] = useMutation(
    CANCEL_LOAN_WITH_ACCOUNT_RESTORE
  )

  // Filter loans by search
  const filteredLoans = useMemo(() => {
    if (!searchTerm) return loansToday
    const term = searchTerm.toLowerCase()
    return loansToday.filter(
      (loan) =>
        loan.borrower.personalData?.fullName?.toLowerCase().includes(term) ||
        loan.collaterals.some((c) => c.fullName?.toLowerCase().includes(term))
    )
  }, [loansToday, searchTerm])

  // Calculate totals
  const totals = useMemo(() => {
    const totalLoaned = loansToday.reduce(
      (sum, l) => sum + parseFloat(l.amountGived || '0'),
      0
    )
    const totalProfit = loansToday.reduce(
      (sum, l) => sum + parseFloat(l.profitAmount || '0'),
      0
    )
    const totalCommission = loansToday.reduce(
      (sum, l) => sum + parseFloat(l.comissionAmount || '0'),
      0
    )
    const renewals = loansToday.filter((l) => l.previousLoan !== null).length
    const newLoans = loansToday.length - renewals

    return {
      count: loansToday.length,
      loaned: totalLoaned,
      profit: totalProfit,
      commission: totalCommission,
      renewals,
      newLoans,
    }
  }, [loansToday])

  // Handle edit loan
  const handleEditLoan = (loan: Loan) => {
    setSelectedLoan(loan)
    setIsEditModalOpen(true)
  }

  // Handle cancel loan
  const handleCancelLoan = async () => {
    if (!loanToCancel || !defaultAccount) return

    try {
      await cancelLoanWithAccountRestore({
        variables: {
          id: loanToCancel.id,
          accountId: defaultAccount.id,
        },
      })

      toast({
        title: 'Crédito cancelado',
        description: `El crédito de ${loanToCancel.borrower.personalData.fullName} ha sido cancelado y el saldo restaurado.`,
      })

      setLoanToCancel(null)
      refetchLoans()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo cancelar el crédito'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // Handle success from create modal
  const handleCreateSuccess = () => {
    refetchLoans()
  }

  // Handle success from edit modal
  const handleEditSuccess = () => {
    refetchLoans()
  }

  if (!selectedRouteId || !selectedLeadId) {
    return <EmptyState />
  }

  if (loansLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Créditos del Día</p>
                <p className="text-2xl font-bold">{totals.count}</p>
                <p className="text-xs text-muted-foreground">
                  {totals.newLoans} nuevos, {totals.renewals} renovaciones
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Prestado</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.loaned)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ganancia Esperada</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(totals.profit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comisión</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.commission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Balance Info */}
      {defaultAccount && (
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Saldo disponible ({defaultAccount.name}):
                </span>
                <span className="font-medium">
                  {formatCurrency(parseFloat(defaultAccount.amount))}
                </span>
              </div>
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
                {loansToday.length} créditos • {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </CardDescription>
            </div>
            <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
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
              <p className="text-muted-foreground">
                No hay créditos registrados para esta fecha
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Aval</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Pago Semanal</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.map((loan) => {
                  const aval = loan.collaterals[0]
                  const hasAval = aval && aval.fullName
                  const isRenewal = loan.previousLoan !== null

                  return (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {loan.borrower.personalData?.fullName || 'Sin nombre'}
                              </p>
                              {isRenewal && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <RefreshCw className="h-3 w-3" />
                                  Renovación
                                </Badge>
                              )}
                            </div>
                            {loan.borrower.personalData?.phones?.[0]?.number && (
                              <p className="text-xs text-muted-foreground">
                                {loan.borrower.personalData.phones[0].number}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{loan.loantype.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {hasAval ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-success" />
                              <span className="text-sm">{aval.fullName}</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 text-warning" />
                              <span className="text-sm text-muted-foreground">Pendiente</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(parseFloat(loan.amountGived))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(parseFloat(loan.expectedWeeklyPayment))}
                      </TableCell>
                      <TableCell className="text-right font-medium text-success">
                        {formatCurrency(parseFloat(loan.profitAmount || '0'))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditLoan(loan)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setLoanToCancel(loan)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Loans Modal */}
      <CreateLoansModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        loanTypes={loanTypes}
        loansForRenewal={loansForRenewal}
        accounts={accounts}
        selectedDate={selectedDate}
        leadId={selectedLeadId || ''}
        grantorId={selectedLeadId || ''} // For now, grantor is the same as lead
        locationId={selectedLocationId || undefined}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Loan Modal */}
      <EditLoanModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        loan={selectedLoan}
        loanTypes={loanTypes}
        locationId={selectedLocationId}
        onSuccess={handleEditSuccess}
      />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!loanToCancel} onOpenChange={(open) => !open && setLoanToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Crédito</AlertDialogTitle>
            <AlertDialogDescription>
              {loanToCancel && (
                <>
                  ¿Estás seguro de cancelar el crédito de{' '}
                  <strong>{loanToCancel.borrower.personalData.fullName}</strong> por{' '}
                  <strong>{formatCurrency(parseFloat(loanToCancel.amountGived))}</strong>?
                  <br />
                  <br />
                  El monto será restaurado a la cuenta {defaultAccount?.name}.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelLoan}
              disabled={canceling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {canceling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sí, cancelar crédito
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
