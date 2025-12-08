'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Search,
  Loader2,
  DollarSign,
  User,
  MapPin,
  Wallet,
  Building2,
  Save,
  Trash2,
  Check,
  AlertTriangle,
  Phone,
  Users,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTransactionContext } from './transaction-context'
import { formatCurrency } from '@/lib/utils'
import { ACTIVE_LOANS_BY_LEAD_QUERY } from '@/graphql/queries/transactions'
import { CREATE_LOAN_PAYMENT } from '@/graphql/mutations/transactions'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ActiveLoan {
  id: string
  requestedAmount: string
  amountGived: string
  signDate: string
  expectedWeeklyPayment: string
  totalPaid: string
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
  loantype: {
    id: string
    name: string
    weekDuration: number
    loanPaymentComission: string
  }
}

interface PaymentEntry {
  loanId: string
  amount: string
  commission: string
  initialCommission: string // Comisión original del loantype - para saber si aplicar comisión global
  paymentMethod: 'CASH' | 'MONEY_TRANSFER'
  isNoPayment: boolean // Para marcar como "sin pago"
}

// Función para verificar si un aval está incompleto
function hasIncompleteAval(loan: ActiveLoan): boolean {
  if (!loan.collaterals || loan.collaterals.length === 0) {
    return true
  }
  const firstCollateral = loan.collaterals[0]
  const avalName = firstCollateral?.fullName || ''
  const avalPhone = firstCollateral?.phones?.[0]?.number || ''
  return !avalName || avalName.trim() === '' || !avalPhone || avalPhone.trim() === ''
}

// Función para verificar si el cliente tiene teléfono
function hasIncompletePhone(loan: ActiveLoan): boolean {
  const phone = loan.borrower?.personalData?.phones?.[0]?.number
  return !phone || phone.trim() === ''
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Selecciona una ruta y localidad</h3>
      <p className="text-muted-foreground max-w-sm">
        Selecciona una ruta y líder/localidad para registrar los abonos del día
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
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [payments, setPayments] = useState<Record<string, PaymentEntry>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false)

  // New state for global commission
  const [globalCommission, setGlobalCommission] = useState('')

  // New state for cash distribution modal
  const [showDistributionModal, setShowDistributionModal] = useState(false)

  // State for distribution modal values
  const [bankTransferAmount, setBankTransferAmount] = useState('0')

  // State for shift+click range selection (for marking multiple as no-payment)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)

  // Query para obtener préstamos activos del líder
  const { data: loansData, loading: loansLoading, error: loansError, refetch } = useQuery(
    ACTIVE_LOANS_BY_LEAD_QUERY,
    {
      variables: { leadId: selectedLeadId },
      skip: !selectedLeadId,
      fetchPolicy: 'network-only',
    }
  )

  // Mutation para crear pagos
  const [createLoanPayment] = useMutation(CREATE_LOAN_PAYMENT)

  const loans: ActiveLoan[] = useMemo(() => {
    const rawLoans = loansData?.loans?.edges?.map(
      (edge: { node: ActiveLoan }) => edge.node
    ) || []

    // Ordenar por fecha de firma (más antiguo primero)
    return rawLoans.sort((a: ActiveLoan, b: ActiveLoan) => {
      const dateA = new Date(a.signDate || '1970-01-01').getTime()
      const dateB = new Date(b.signDate || '1970-01-01').getTime()
      return dateA - dateB
    })
  }, [loansData])

  // Pre-cargar pagos semanales cuando se cargan los préstamos
  useEffect(() => {
    if (loans.length > 0 && Object.keys(payments).length === 0) {
      const initialPayments: Record<string, PaymentEntry> = {}
      loans.forEach((loan) => {
        const defaultCommission = loan.loantype?.loanPaymentComission
          ? Math.round(parseFloat(loan.loantype.loanPaymentComission)).toString()
          : '0'

        initialPayments[loan.id] = {
          loanId: loan.id,
          amount: loan.expectedWeeklyPayment || '0',
          commission: defaultCommission,
          initialCommission: defaultCommission, // Guardar la comisión original
          paymentMethod: 'CASH',
          isNoPayment: false,
        }
      })
      setPayments(initialPayments)
    }
  }, [loans])

  // Reset payments when lead changes
  useEffect(() => {
    setPayments({})
    setGlobalCommission('')
    setLastSelectedIndex(null)
  }, [selectedLeadId])

  // Filter loans by search and incomplete filter
  const filteredLoans = useMemo(() => {
    let filtered = loans

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (loan) =>
          loan.borrower.personalData?.fullName?.toLowerCase().includes(term) ||
          loan.collaterals?.some((c) => c.fullName?.toLowerCase().includes(term))
      )
    }

    // Filtrar solo incompletos
    if (showOnlyIncomplete) {
      filtered = filtered.filter((loan) => hasIncompleteAval(loan) || hasIncompletePhone(loan))
    }

    return filtered
  }, [loans, searchTerm, showOnlyIncomplete])

  // Calculate totals
  const totals = useMemo(() => {
    let cashTotal = 0
    let bankTotal = 0
    let paymentsCount = 0
    let noPaymentCount = 0
    let commissionTotal = 0

    Object.values(payments).forEach((payment) => {
      if (payment.isNoPayment) {
        noPaymentCount++
        return
      }

      const amount = parseFloat(payment.amount || '0')
      const commission = parseFloat(payment.commission || '0')

      if (amount > 0) {
        paymentsCount++
        commissionTotal += commission
        if (payment.paymentMethod === 'CASH') {
          cashTotal += amount
        } else {
          bankTotal += amount
        }
      }
    })

    return {
      cash: cashTotal,
      bank: bankTotal,
      total: cashTotal + bankTotal,
      count: paymentsCount,
      noPayment: noPaymentCount,
      commission: commissionTotal,
    }
  }, [payments])

  // Count incomplete
  const incompleteCount = useMemo(() => {
    return loans.filter((loan) => hasIncompleteAval(loan) || hasIncompletePhone(loan)).length
  }, [loans])

  // Handle payment update
  const handlePaymentChange = (loanId: string, amount: string) => {
    setPayments((prev) => {
      const loan = loans.find((l) => l.id === loanId)
      const expectedWeekly = parseFloat(loan?.expectedWeeklyPayment || '0')
      const baseCommission = parseFloat(loan?.loantype?.loanPaymentComission || '0')
      const amountNum = parseFloat(amount || '0')
      const initialCommission = prev[loanId]?.initialCommission ||
        (loan?.loantype?.loanPaymentComission
          ? Math.round(parseFloat(loan.loantype.loanPaymentComission)).toString()
          : '0')

      // Calcular comisión dinámica basada en múltiplos del pago semanal
      // Solo si la comisión base es > 0
      let commission = '0'
      if (expectedWeekly > 0 && baseCommission > 0 && amountNum > 0) {
        const multiplier = Math.floor(amountNum / expectedWeekly)
        commission = (multiplier >= 1 ? baseCommission * multiplier : 0).toString()
      }

      return {
        ...prev,
        [loanId]: {
          ...prev[loanId],
          loanId,
          amount,
          commission,
          initialCommission,
          paymentMethod: prev[loanId]?.paymentMethod || 'CASH',
          isNoPayment: false,
        },
      }
    })
  }

  // Handle commission change manual
  const handleCommissionChange = (loanId: string, commission: string) => {
    setPayments((prev) => ({
      ...prev,
      [loanId]: {
        ...prev[loanId],
        commission,
      },
    }))
  }

  // Handle payment method change
  const handlePaymentMethodChange = (
    loanId: string,
    method: 'CASH' | 'MONEY_TRANSFER'
  ) => {
    setPayments((prev) => ({
      ...prev,
      [loanId]: {
        ...prev[loanId],
        loanId,
        paymentMethod: method,
      },
    }))
  }

  // Toggle no payment
  const handleToggleNoPayment = (loanId: string) => {
    setPayments((prev) => {
      const current = prev[loanId]
      const isCurrentlyNoPayment = current?.isNoPayment

      if (isCurrentlyNoPayment) {
        // Restaurar pago semanal
        const loan = loans.find((l) => l.id === loanId)
        const defaultCommission = loan?.loantype?.loanPaymentComission
          ? Math.round(parseFloat(loan.loantype.loanPaymentComission)).toString()
          : '0'

        return {
          ...prev,
          [loanId]: {
            loanId,
            amount: loan?.expectedWeeklyPayment || '0',
            commission: defaultCommission,
            initialCommission: current?.initialCommission || defaultCommission,
            paymentMethod: current?.paymentMethod || 'CASH',
            isNoPayment: false,
          },
        }
      } else {
        // Marcar como sin pago
        return {
          ...prev,
          [loanId]: {
            ...current,
            loanId,
            amount: '0',
            commission: '0',
            initialCommission: current?.initialCommission || '0',
            isNoPayment: true,
          },
        }
      }
    })
  }

  // Set all to weekly payment
  const handleSetAllWeekly = () => {
    const newPayments: Record<string, PaymentEntry> = {}
    filteredLoans.forEach((loan) => {
      const defaultCommission = loan.loantype?.loanPaymentComission
        ? Math.round(parseFloat(loan.loantype.loanPaymentComission)).toString()
        : '0'

      newPayments[loan.id] = {
        loanId: loan.id,
        amount: loan.expectedWeeklyPayment,
        commission: defaultCommission,
        initialCommission: defaultCommission,
        paymentMethod: payments[loan.id]?.paymentMethod || 'CASH',
        isNoPayment: false,
      }
    })
    setPayments(newPayments)
  }

  // Clear all payments
  const handleClearAll = () => {
    setPayments({})
    setLastSelectedIndex(null)
  }

  // Apply global commission to all payments with amount > 0 AND initialCommission > 0
  const handleApplyGlobalCommission = () => {
    if (!globalCommission) return

    let appliedCount = 0
    let skippedCount = 0

    setPayments((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((loanId) => {
        const payment = updated[loanId]
        const hasAmount = !payment.isNoPayment && parseFloat(payment.amount || '0') > 0
        const hadCommission = parseFloat(payment.initialCommission || '0') > 0

        if (hasAmount && hadCommission) {
          // Solo aplicar si tenía comisión inicial > 0
          updated[loanId] = {
            ...updated[loanId],
            commission: globalCommission,
          }
          appliedCount++
        } else if (hasAmount && !hadCommission) {
          // Tenía monto pero comisión inicial era 0, no aplicar
          skippedCount++
        }
      })
      return updated
    })

    const message = skippedCount > 0
      ? `Aplicada a ${appliedCount} abono(s). ${skippedCount} omitido(s) por tener comisión $0.`
      : `Aplicada a ${appliedCount} abono(s).`

    toast({
      title: 'Comisión aplicada',
      description: `Comisión de ${formatCurrency(parseFloat(globalCommission))}. ${message}`,
    })
  }

  // Toggle no-payment with shift support for range selection
  const handleToggleNoPaymentWithShift = (loanId: string, index: number, shiftKey: boolean) => {
    if (shiftKey && lastSelectedIndex !== null) {
      // Marcar rango como sin pago
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)

      setPayments((prev) => {
        const updated = { ...prev }
        for (let i = start; i <= end; i++) {
          const loan = filteredLoans[i]
          if (loan) {
            const initialCommission = prev[loan.id]?.initialCommission ||
              (loan.loantype?.loanPaymentComission
                ? Math.round(parseFloat(loan.loantype.loanPaymentComission)).toString()
                : '0')

            updated[loan.id] = {
              ...updated[loan.id],
              loanId: loan.id,
              amount: '0',
              commission: '0',
              initialCommission,
              paymentMethod: updated[loan.id]?.paymentMethod || 'CASH',
              isNoPayment: true,
            }
          }
        }
        return updated
      })

      toast({
        title: 'Sin pago marcado',
        description: `${end - start + 1} préstamo(s) marcado(s) como sin pago.`,
      })
    } else {
      // Toggle individual
      handleToggleNoPayment(loanId)
    }

    setLastSelectedIndex(index)
  }

  // Open distribution modal before saving
  const handleSaveAll = () => {
    const validPayments = Object.values(payments).filter(
      (p) => !p.isNoPayment && p.amount && parseFloat(p.amount) > 0
    )

    if (validPayments.length === 0) {
      toast({
        title: 'Sin abonos',
        description: 'No hay abonos para guardar.',
        variant: 'destructive',
      })
      return
    }

    // Reset bank transfer amount when opening modal
    setBankTransferAmount('0')
    setShowDistributionModal(true)
  }

  // Actual save after distribution is confirmed
  const handleConfirmSave = async () => {
    const validPayments = Object.values(payments).filter(
      (p) => !p.isNoPayment && p.amount && parseFloat(p.amount) > 0
    )

    setIsSubmitting(true)
    setShowDistributionModal(false)

    try {
      for (const payment of validPayments) {
        await createLoanPayment({
          variables: {
            input: {
              loanId: payment.loanId,
              amount: payment.amount,
              comission: payment.commission,
              receivedAt: selectedDate.toISOString(),
              paymentMethod: payment.paymentMethod,
            },
          },
        })
      }

      setSavedCount(validPayments.length)
      setShowSuccessDialog(true)
      setPayments({})
      setLastSelectedIndex(null)
      refetch()

      toast({
        title: 'Abonos guardados',
        description: `Se guardaron ${validPayments.length} abono(s) correctamente.`,
      })
    } catch (error) {
      console.error('Error al guardar abonos:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los abonos. Intenta de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!selectedRouteId || !selectedLeadId) {
    return <EmptyState />
  }

  if (loansLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-4">
      {/* Loans Table */}
      <Card className="relative">
        {/* Sticky Header with KPIs - top-16 accounts for the fixed header (h-16 = 64px) */}
        <div className="sticky top-16 z-20 bg-card rounded-t-lg shadow-sm">
          <CardHeader className="pb-3 border-b">
          {/* Row 1: Title + KPIs */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-shrink-0">
              <CardTitle>Préstamos Activos</CardTitle>
              <CardDescription>
                {filteredLoans.length} préstamos • {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </CardDescription>
            </div>
            {/* KPIs - right side */}
            <TooltipProvider delayDuration={100}>
              <div className="flex flex-wrap items-center gap-1.5 justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0.5 px-2 cursor-default">
                      <Users className="h-3 w-3 mr-1" />
                      {filteredLoans.length}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>Clientes activos</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0.5 px-2 bg-green-50 text-green-700 border-green-200 cursor-default">
                      <Check className="h-3 w-3 mr-1" />
                      {totals.count}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>Abonos registrados</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0.5 px-2 bg-red-50 text-red-700 border-red-200 cursor-default">
                      <Ban className="h-3 w-3 mr-1" />
                      {totals.noPayment}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>Marcados sin pago</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0.5 px-2 bg-purple-50 text-purple-700 border-purple-200 cursor-default">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {formatCurrency(totals.commission)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>Comisión del líder</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0.5 px-2 bg-green-50 text-green-700 border-green-200 cursor-default">
                      <Wallet className="h-3 w-3 mr-1" />
                      {formatCurrency(totals.cash)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>Cobrado en efectivo</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0.5 px-2 bg-blue-50 text-blue-700 border-blue-200 cursor-default">
                      <Building2 className="h-3 w-3 mr-1" />
                      {formatCurrency(totals.bank)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>Cobrado por transferencia</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0.5 px-2 font-bold bg-slate-100 cursor-default">
                      {formatCurrency(totals.total)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>Total cobrado</p></TooltipContent>
                </Tooltip>

                {incompleteCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs py-0.5 px-2 cursor-pointer transition-colors",
                          showOnlyIncomplete
                            ? "bg-orange-100 text-orange-700 border-orange-300"
                            : "bg-orange-50 text-orange-600 border-orange-200"
                        )}
                        onClick={() => setShowOnlyIncomplete(!showOnlyIncomplete)}
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {incompleteCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click para {showOnlyIncomplete ? 'mostrar todos' : 'filtrar solo incompletos'}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          </div>

          {/* Row 2: Search + Actions */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {/* Search - flexible width */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8"
              />
            </div>

            {/* Actions - pushed to the right */}
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Comisión:</span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={globalCommission}
                    onChange={(e) => setGlobalCommission(e.target.value)}
                    className="w-[60px] h-7 text-sm pl-5 pr-1"
                  />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleApplyGlobalCommission}
                  disabled={!globalCommission || filteredLoans.length === 0}
                  className="h-7 px-2 text-xs"
                >
                  Aplicar
                </Button>
              </div>

              <div className="h-5 w-px bg-border" />

              <Button
                size="sm"
                variant="outline"
                onClick={handleSetAllWeekly}
                disabled={filteredLoans.length === 0}
                className="h-8 px-2"
                title="Aplicar pago semanal a todos"
              >
                <DollarSign className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearAll}
                disabled={totals.count === 0 && totals.noPayment === 0}
                className="h-8 px-2"
                title="Limpiar todos los pagos"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>

              {totals.count > 0 && (
                <>
                  <div className="h-5 w-px bg-border" />
                  <Button
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={isSubmitting}
                    className="gap-1.5 h-8"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Guardar ({totals.count})
                  </Button>
                </>
              )}
            </div>
          </div>
          </CardHeader>
        </div>
        <CardContent>
          {filteredLoans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay préstamos activos para esta localidad
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Ban className="h-4 w-4 text-muted-foreground" />
                  </TableHead>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead className="w-[200px]">Cliente</TableHead>
                  <TableHead>Aval</TableHead>
                  <TableHead className="text-right">Fecha Crédito</TableHead>
                  <TableHead className="text-right">Pago Semanal</TableHead>
                  <TableHead className="w-[100px]">Abono</TableHead>
                  <TableHead className="w-[80px]">Comisión</TableHead>
                  <TableHead className="w-[120px]">Método</TableHead>
                  <TableHead className="w-[80px]">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.map((loan, index) => {
                  const payment = payments[loan.id]
                  const isNoPayment = payment?.isNoPayment
                  const hasPayment = payment && payment.amount && parseFloat(payment.amount) > 0 && !isNoPayment
                  const isTransfer = payment?.paymentMethod === 'MONEY_TRANSFER'
                  const isCash = payment?.paymentMethod === 'CASH' || !payment?.paymentMethod
                  const hasZeroCommission = hasPayment && parseFloat(payment?.commission || '0') === 0
                  const aval = loan.collaterals?.[0]
                  const isIncompleteAval = hasIncompleteAval(loan)
                  const isIncompletePhone = hasIncompletePhone(loan)
                  const isIncomplete = isIncompleteAval || isIncompletePhone

                  // Determine row styling based on priority:
                  // 1. Sin pago (highest) - red
                  // 2. Aval incompleto - orange
                  // 3. Zero commission - amber/yellow
                  // 4. Transfer payment - purple
                  // 5. Cash payment - green
                  // 6. Pending/selected - blue
                  const getRowStyle = () => {
                    if (isNoPayment) {
                      return {
                        className: 'bg-red-100/80 dark:bg-red-950/40',
                        borderColor: '#ef4444',
                        borderWidth: '4px'
                      }
                    }
                    if (isIncomplete && !hasPayment) {
                      return {
                        className: 'bg-orange-50 dark:bg-orange-950/30',
                        borderColor: '#f97316',
                        borderWidth: '4px'
                      }
                    }
                    if (hasZeroCommission) {
                      return {
                        className: 'bg-amber-50 dark:bg-amber-950/30',
                        borderColor: '#d97706',
                        borderWidth: '4px'
                      }
                    }
                    if (hasPayment && isTransfer) {
                      return {
                        className: 'bg-purple-50 dark:bg-purple-950/30',
                        borderColor: '#8b5cf6',
                        borderWidth: '4px'
                      }
                    }
                    if (hasPayment && isCash) {
                      return {
                        className: 'bg-green-50 dark:bg-green-950/30',
                        borderColor: '#22c55e',
                        borderWidth: '4px'
                      }
                    }
                    return {
                      className: '',
                      borderColor: 'transparent',
                      borderWidth: '4px'
                    }
                  }

                  const rowStyle = getRowStyle()

                  // Handler para click en la fila - marca como sin pago con soporte shift
                  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
                    const target = e.target as HTMLElement

                    // Verificar si hay texto seleccionado
                    const selection = window.getSelection()
                    if (selection && selection.toString().length > 0) {
                      return
                    }

                    // Solo bloquear elementos realmente interactivos
                    const isInput = target.closest('input, select, textarea')
                    const isButton = target.closest('button')
                    const isCheckbox = target.closest('[role="checkbox"]')

                    if (isInput || isButton || isCheckbox) {
                      return
                    }

                    handleToggleNoPaymentWithShift(loan.id, index, e.shiftKey)
                  }

                  return (
                    <TableRow
                      key={loan.id}
                      className={cn(
                        'transition-colors cursor-pointer select-none',
                        rowStyle.className,
                        isNoPayment && 'line-through opacity-70'
                      )}
                      style={{
                        borderLeft: `${rowStyle.borderWidth} solid ${rowStyle.borderColor}`,
                      }}
                      onClick={handleRowClick}
                    >
                      <TableCell
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleNoPaymentWithShift(loan.id, index, e.shiftKey)
                        }}
                        className="cursor-pointer"
                        title="Click para marcar sin pago"
                      >
                        <Checkbox
                          checked={isNoPayment || false}
                          onCheckedChange={() => handleToggleNoPaymentWithShift(loan.id, index, false)}
                        />
                      </TableCell>
                      <TableCell
                        className="font-medium text-muted-foreground cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleNoPaymentWithShift(loan.id, index, e.shiftKey)
                        }}
                        title="Click para marcar sin pago"
                      >
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">
                              {loan.borrower.personalData?.fullName || 'Sin nombre'}
                            </p>
                            {loan.borrower.personalData?.phones?.[0]?.number ? (
                              <p className="text-xs text-muted-foreground">
                                {loan.borrower.personalData.phones[0].number}
                              </p>
                            ) : (
                              <p className="text-xs text-orange-600 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                Sin teléfono
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {aval ? (
                          <div>
                            <p className="text-sm">{aval.fullName || <span className="text-orange-600">Sin nombre</span>}</p>
                            {aval.phones?.[0]?.number ? (
                              <p className="text-xs text-muted-foreground">
                                {aval.phones[0].number}
                              </p>
                            ) : (
                              <p className="text-xs text-orange-600 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                Sin teléfono
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-orange-600 text-sm flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Sin aval
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {loan.signDate ? format(new Date(loan.signDate), 'dd/MM/yy') : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(parseFloat(loan.expectedWeeklyPayment))}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="number"
                          placeholder="0"
                          value={payment?.amount || ''}
                          onChange={(e) => handlePaymentChange(loan.id, e.target.value)}
                          className={cn(
                            "w-[90px]",
                            isNoPayment && "opacity-50"
                          )}
                          disabled={isNoPayment}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="number"
                          placeholder="0"
                          value={payment?.commission || ''}
                          onChange={(e) => handleCommissionChange(loan.id, e.target.value)}
                          className={cn(
                            "w-[70px]",
                            isNoPayment && "opacity-50"
                          )}
                          disabled={isNoPayment}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={payment?.paymentMethod || 'CASH'}
                          onValueChange={(value) =>
                            handlePaymentMethodChange(
                              loan.id,
                              value as 'CASH' | 'MONEY_TRANSFER'
                            )
                          }
                          disabled={isNoPayment}
                        >
                          <SelectTrigger className={cn("w-[110px]", isNoPayment && "opacity-50")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">
                              <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4" />
                                Efectivo
                              </div>
                            </SelectItem>
                            <SelectItem value="MONEY_TRANSFER">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Banco
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleNoPaymentWithShift(loan.id, index, e.shiftKey)
                        }}
                        title="Click para marcar sin pago"
                      >
                        {isNoPayment ? (
                          <Badge variant="destructive" className="text-xs cursor-pointer font-semibold">
                            <Ban className="h-3 w-3 mr-1" />
                            Sin pago
                          </Badge>
                        ) : hasPayment && isTransfer ? (
                          <Badge className="bg-purple-600 hover:bg-purple-700 text-xs cursor-pointer font-semibold">
                            <Building2 className="h-3 w-3 mr-1" />
                            Banco
                          </Badge>
                        ) : hasPayment ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-xs cursor-pointer font-semibold">
                            <Wallet className="h-3 w-3 mr-1" />
                            Efectivo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground cursor-pointer">
                            Pendiente
                          </Badge>
                        )}
                        {hasZeroCommission && (
                          <Badge variant="outline" className="text-xs ml-1 bg-amber-100 text-amber-700 border-amber-300">
                            $0
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Abonos</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comisiones</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.commission)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Efectivo</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.cash)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Banco</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.bank)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Distribution Modal - Matches original Keystone design */}
      <Dialog open={showDistributionModal} onOpenChange={setShowDistributionModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Distribución de Pagos
            </DialogTitle>
            <DialogDescription>
              Confirma la distribución del efectivo cobrado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Total */}
            <div className="text-center">
              <h4 className="text-lg font-semibold">
                Total: {formatCurrency(totals.total)}
              </h4>
            </div>

            {/* Desglose por Método de Pago */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
              <p className="text-sm font-semibold text-muted-foreground mb-3">
                Desglose por Método de Pago
              </p>
              <div className="grid grid-cols-2 gap-4">
                {/* Efectivo */}
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-md">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs font-medium text-green-700 dark:text-green-400">Efectivo</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">
                      {formatCurrency(totals.cash)}
                    </p>
                  </div>
                </div>
                {/* Transferencia */}
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Transferencia</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      {formatCurrency(totals.bank)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Distribución de Efectivo */}
            <div className="grid grid-cols-2 gap-4">
              {/* Efectivo en Caja (solo lectura) */}
              <div>
                <Label className="text-sm">Distribución de Efectivo:</Label>
                <div className="mt-1.5 px-3 py-2 h-10 bg-white dark:bg-slate-800 border rounded-md flex items-center font-medium text-sm">
                  {formatCurrency(totals.cash - parseFloat(bankTransferAmount || '0'))}
                </div>
                <p className="text-xs text-muted-foreground italic mt-1.5">
                  Solo puedes distribuir: {formatCurrency(totals.cash)} (efectivo real)
                </p>
              </div>

              {/* Input de Transferencia */}
              <div>
                <Label htmlFor="bank-transfer" className="text-sm">Transferencia:</Label>
                <Input
                  id="bank-transfer"
                  type="number"
                  min="0"
                  max={totals.cash}
                  value={bankTransferAmount}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(parseFloat(e.target.value) || 0, totals.cash))
                    setBankTransferAmount(value.toString())
                  }}
                  className={cn(
                    "mt-1.5",
                    parseFloat(bankTransferAmount || '0') > totals.cash && "border-red-500 border-2"
                  )}
                  onWheel={(e) => e.currentTarget.blur()}
                />
                <p className="text-xs text-muted-foreground italic mt-1.5">
                  Máximo: {formatCurrency(totals.cash)}
                </p>
              </div>
            </div>

            {/* Error si la transferencia excede el efectivo */}
            {parseFloat(bankTransferAmount || '0') > totals.cash && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-md text-center">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  El monto de transferencia no puede ser mayor al efectivo real disponible ({formatCurrency(totals.cash)})
                </p>
              </div>
            )}

            {/* Resumen de la operación */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">Resumen de la operación:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Abonos a registrar:</span>
                  <span className="font-medium">{totals.count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total cobrado:</span>
                  <span className="font-medium">{formatCurrency(totals.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comisiones:</span>
                  <span className="font-medium text-purple-600">{formatCurrency(totals.commission)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sin pago:</span>
                  <span className="font-medium text-red-600">{totals.noPayment}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDistributionModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={isSubmitting || parseFloat(bankTransferAmount || '0') > totals.cash}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Confirmar y Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Abonos Guardados
            </DialogTitle>
            <DialogDescription>
              Se guardaron {savedCount} abono(s) correctamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
