'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { format, startOfDay, endOfDay } from 'date-fns'
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
  Save,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useTransactionContext } from './transaction-context'
import { formatCurrency } from '@/lib/utils'
import { LOANS_BY_DATE_LEAD_QUERY, LOAN_TYPES_QUERY, PREVIOUS_LOANS_QUERY } from '@/graphql/queries/transactions'
import { CREATE_LOAN, CANCEL_LOAN } from '@/graphql/mutations/transactions'
import { useToast } from '@/hooks/use-toast'

interface Loan {
  id: string
  requestedAmount: string
  amountGived: string
  signDate: string
  comissionAmount: string
  totalDebtAcquired: string
  expectedWeeklyPayment: string
  pendingAmountStored: string
  profitAmount: string
  status: string
  loantype: {
    id: string
    name: string
    rate: string
    weekDuration: number
    loanPaymentComission: string
    loanGrantedComission: string
  }
  borrower: {
    id: string
    personalData: {
      id: string
      fullName: string
      phones: Array<{ id: string; number: string }>
    }
  }
  collaterals: Array<{
    id: string
    fullName: string
    phones: Array<{ id: string; number: string }>
  }>
  lead: {
    id: string
    personalData: {
      fullName: string
      addresses: Array<{
        location: { id: string; name: string }
      }>
    }
  }
  previousLoan: {
    id: string
    requestedAmount: string
    amountGived: string
    profitAmount: string
    pendingAmountStored: string
    borrower: {
      personalData: { fullName: string }
    }
  } | null
}

interface LoanType {
  id: string
  name: string
  weekDuration: number
  rate: string
  loanPaymentComission: string
  loanGrantedComission: string
}

interface PreviousLoan {
  id: string
  requestedAmount: string
  amountGived: string
  profitAmount: string
  signDate: string
  pendingAmountStored: string
  status: string
  borrower: {
    id: string
    personalData: {
      id: string
      fullName: string
      phones: Array<{ number: string }>
    }
  }
  collaterals: Array<{
    id: string
    fullName: string
    phones: Array<{ id: string; number: string }>
  }>
}

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
  const { selectedRouteId, selectedDate, selectedLeadId } = useTransactionContext()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Form state for new loan
  const [selectedLoanTypeId, setSelectedLoanTypeId] = useState('')
  const [amountGived, setAmountGived] = useState('')
  const [selectedPreviousLoanId, setSelectedPreviousLoanId] = useState<string>('')
  const [borrowerName, setBorrowerName] = useState('')
  const [borrowerPhone, setBorrowerPhone] = useState('')
  const [avalName, setAvalName] = useState('')
  const [avalPhone, setAvalPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Query para obtener préstamos del día por líder
  const { data: loansData, loading: loansLoading, refetch } = useQuery(
    LOANS_BY_DATE_LEAD_QUERY,
    {
      variables: {
        fromDate: startOfDay(selectedDate).toISOString(),
        toDate: endOfDay(selectedDate).toISOString(),
        leadId: selectedLeadId,
      },
      skip: !selectedLeadId,
    }
  )

  // Query para obtener tipos de préstamo
  const { data: loanTypesData } = useQuery(LOAN_TYPES_QUERY)

  // Query para obtener préstamos anteriores (para renovaciones)
  const { data: previousLoansData } = useQuery(PREVIOUS_LOANS_QUERY, {
    variables: { leadId: selectedLeadId },
    skip: !selectedLeadId,
  })

  // Mutation para crear préstamo
  const [createLoan] = useMutation(CREATE_LOAN)
  const [cancelLoan] = useMutation(CANCEL_LOAN)

  const loans: Loan[] = loansData?.loans?.edges?.map(
    (edge: { node: Loan }) => edge.node
  ) || []

  const loanTypes: LoanType[] = loanTypesData?.loantypes || []

  const previousLoans: PreviousLoan[] = previousLoansData?.loans?.edges?.map(
    (edge: { node: PreviousLoan }) => edge.node
  ) || []

  // Reset form
  const resetForm = () => {
    setSelectedLoanTypeId('')
    setAmountGived('')
    setSelectedPreviousLoanId('')
    setBorrowerName('')
    setBorrowerPhone('')
    setAvalName('')
    setAvalPhone('')
  }

  // When selecting a previous loan, populate borrower info
  useEffect(() => {
    if (selectedPreviousLoanId) {
      const prevLoan = previousLoans.find((l) => l.id === selectedPreviousLoanId)
      if (prevLoan) {
        setBorrowerName(prevLoan.borrower.personalData?.fullName || '')
        setBorrowerPhone(prevLoan.borrower.personalData?.phones?.[0]?.number || '')
        if (prevLoan.collaterals[0]) {
          setAvalName(prevLoan.collaterals[0].fullName || '')
          setAvalPhone(prevLoan.collaterals[0].phones?.[0]?.number || '')
        }
      }
    }
  }, [selectedPreviousLoanId, previousLoans])

  // Calculate loan details based on selected type and amount
  const loanCalculations = useMemo(() => {
    const loanType = loanTypes.find((lt) => lt.id === selectedLoanTypeId)
    if (!loanType || !amountGived) return null

    const amount = parseFloat(amountGived)
    const rate = parseFloat(loanType.rate)
    const weeks = loanType.weekDuration
    const grantedCommission = parseFloat(loanType.loanGrantedComission)

    const totalDebt = amount * rate
    const weeklyPayment = totalDebt / weeks
    const profit = totalDebt - amount
    const commission = amount * grantedCommission

    return {
      totalDebt,
      weeklyPayment,
      profit,
      commission,
      weeks,
    }
  }, [selectedLoanTypeId, amountGived, loanTypes])

  // Filter loans by search
  const filteredLoans = useMemo(() => {
    if (!searchTerm) return loans
    const term = searchTerm.toLowerCase()
    return loans.filter(
      (loan) =>
        loan.borrower.personalData?.fullName?.toLowerCase().includes(term) ||
        loan.collaterals.some((c) => c.fullName?.toLowerCase().includes(term))
    )
  }, [loans, searchTerm])

  // Calculate totals
  const totals = useMemo(() => {
    const totalLoaned = loans.reduce((sum, l) => sum + parseFloat(l.amountGived || '0'), 0)
    const totalProfit = loans.reduce((sum, l) => sum + parseFloat(l.profitAmount || '0'), 0)
    const totalCommission = loans.reduce((sum, l) => sum + parseFloat(l.comissionAmount || '0'), 0)

    return {
      count: loans.length,
      loaned: totalLoaned,
      profit: totalProfit,
      commission: totalCommission,
    }
  }, [loans])

  // Handle loan creation
  const handleCreateLoan = async () => {
    if (!selectedLoanTypeId || !amountGived || !borrowerName) {
      toast({
        title: 'Datos incompletos',
        description: 'Completa todos los campos requeridos.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // For now, we'll create a simplified loan
      // In production, this would need borrower creation/lookup
      await createLoan({
        variables: {
          input: {
            requestedAmount: amountGived,
            amountGived: amountGived,
            signDate: selectedDate.toISOString(),
            loantypeId: selectedLoanTypeId,
            leadId: selectedLeadId,
            grantorId: selectedLeadId, // Same as lead for now
            borrowerId: selectedPreviousLoanId
              ? previousLoans.find((l) => l.id === selectedPreviousLoanId)?.borrower.id
              : undefined,
            previousLoanId: selectedPreviousLoanId || undefined,
          },
        },
      })

      toast({
        title: 'Crédito creado',
        description: `Se creó un crédito de ${formatCurrency(parseFloat(amountGived))} correctamente.`,
      })

      resetForm()
      setIsCreateDialogOpen(false)
      refetch()
    } catch (error) {
      console.error('Error al crear crédito:', error)
      toast({
        title: 'Error',
        description: 'No se pudo crear el crédito. Intenta de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle loan cancellation
  const handleCancelLoan = async (loanId: string) => {
    try {
      await cancelLoan({ variables: { id: loanId } })
      toast({
        title: 'Crédito cancelado',
        description: 'El crédito ha sido cancelado.',
      })
      refetch()
    } catch (error) {
      console.error('Error al cancelar crédito:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cancelar el crédito.',
        variant: 'destructive',
      })
    }
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
                <p className="text-2xl font-bold text-success">{formatCurrency(totals.profit)}</p>
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Crédito
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Crédito</DialogTitle>
                  <DialogDescription>
                    Completa los datos para registrar un nuevo préstamo
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {/* Previous Loan Selection (Renovation) */}
                  {previousLoans.length > 0 && (
                    <div className="space-y-2">
                      <Label>Renovación de Crédito (Opcional)</Label>
                      <Select
                        value={selectedPreviousLoanId}
                        onValueChange={setSelectedPreviousLoanId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar crédito anterior" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nuevo cliente</SelectItem>
                          {previousLoans.map((loan) => (
                            <SelectItem key={loan.id} value={loan.id}>
                              {loan.borrower.personalData?.fullName} - {formatCurrency(parseFloat(loan.amountGived))}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Loan Type */}
                    <div className="space-y-2">
                      <Label>Tipo de Crédito *</Label>
                      <Select
                        value={selectedLoanTypeId}
                        onValueChange={setSelectedLoanTypeId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {loanTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} ({type.weekDuration} semanas)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label>Monto a Prestar *</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={amountGived}
                        onChange={(e) => setAmountGived(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Loan Calculations */}
                  {loanCalculations && (
                    <div className="grid gap-2 p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deuda Total:</span>
                        <span className="font-medium">{formatCurrency(loanCalculations.totalDebt)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pago Semanal:</span>
                        <span className="font-medium">{formatCurrency(loanCalculations.weeklyPayment)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ganancia:</span>
                        <span className="font-medium text-success">{formatCurrency(loanCalculations.profit)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Comisión:</span>
                        <span className="font-medium">{formatCurrency(loanCalculations.commission)}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Borrower Info */}
                    <div className="space-y-2">
                      <Label>Nombre del Cliente *</Label>
                      <Input
                        placeholder="Nombre completo"
                        value={borrowerName}
                        onChange={(e) => setBorrowerName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono del Cliente</Label>
                      <Input
                        placeholder="Teléfono"
                        value={borrowerPhone}
                        onChange={(e) => setBorrowerPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Aval Info */}
                    <div className="space-y-2">
                      <Label>Nombre del Aval</Label>
                      <Input
                        placeholder="Nombre del aval"
                        value={avalName}
                        onChange={(e) => setAvalName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono del Aval</Label>
                      <Input
                        placeholder="Teléfono del aval"
                        value={avalPhone}
                        onChange={(e) => setAvalPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm()
                      setIsCreateDialogOpen(false)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateLoan}
                    disabled={isSubmitting || !selectedLoanTypeId || !amountGived || !borrowerName}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Crear Crédito
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Aval</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Pago Semanal</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.map((loan) => {
                  const aval = loan.collaterals[0]
                  const hasAval = aval && aval.fullName

                  return (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {loan.borrower.personalData?.fullName || 'Sin nombre'}
                            </p>
                            {loan.borrower.personalData?.phones?.[0]?.number && (
                              <p className="text-xs text-muted-foreground">
                                {loan.borrower.personalData.phones[0].number}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {loan.loantype.name}
                        </Badge>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleCancelLoan(loan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
