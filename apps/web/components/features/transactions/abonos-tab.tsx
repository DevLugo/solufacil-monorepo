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
  Gavel,
  Pencil,
  X,
  RotateCcw,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
import { ACTIVE_LOANS_BY_LEAD_QUERY, ACCOUNTS_QUERY, LEAD_PAYMENT_RECEIVED_BY_DATE_QUERY } from '@/graphql/queries/transactions'
import {
  CREATE_LEAD_PAYMENT_RECEIVED,
  UPDATE_LEAD_PAYMENT_RECEIVED,
  CREATE_TRANSACTION,
} from '@/graphql/mutations/transactions'
import { isSameDay } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface LoanPayment {
  id: string
  amount: string
  comission: string
  receivedAt: string
  paymentMethod: 'CASH' | 'MONEY_TRANSFER'
  leadPaymentReceived?: {
    id: string
  } | null
}

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
  payments: LoanPayment[]
}

interface PaymentEntry {
  loanId: string
  amount: string
  commission: string
  initialCommission: string // Comisión original del loantype - para saber si aplicar comisión global
  paymentMethod: 'CASH' | 'MONEY_TRANSFER'
  isNoPayment: boolean // Para marcar como "sin pago"
}

interface Account {
  id: string
  name: string
  type: string
  amount: string
}

interface EditedPayment {
  paymentId: string
  loanId: string
  amount: string
  comission: string
  paymentMethod: 'CASH' | 'MONEY_TRANSFER'
  isDeleted: boolean // For strikethrough/soft delete
}

interface UserAddedPayment {
  tempId: string
  loanId: string
  amount: string
  commission: string
  paymentMethod: 'CASH' | 'MONEY_TRANSFER'
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
    <Card>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <Skeleton className="h-8 flex-1 max-w-sm" />
          <div className="flex gap-2 ml-auto">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {/* Table header skeleton */}
          <div className="flex gap-4 py-2 border-b">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Table rows skeleton */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-6" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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

  // State for saving progress in modal
  const [savingProgress, setSavingProgress] = useState<{ current: number; total: number } | null>(null)

  // State for multa (fine/penalty) modal
  const [showMultaModal, setShowMultaModal] = useState(false)
  const [multaAmount, setMultaAmount] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [isCreatingMulta, setIsCreatingMulta] = useState(false)

  // State for editing registered payments
  const [editedPayments, setEditedPayments] = useState<Record<string, EditedPayment>>({})
  const [isSavingEdits, setIsSavingEdits] = useState(false)

  // State for user-added payments (Agregar Pago)
  const [userAddedPayments, setUserAddedPayments] = useState<UserAddedPayment[]>([])

  // Query para obtener préstamos activos del líder (incluye pagos)
  const { data: loansData, loading: loansLoading, error: loansError, refetch: refetchLoans } = useQuery(
    ACTIVE_LOANS_BY_LEAD_QUERY,
    {
      variables: { leadId: selectedLeadId },
      skip: !selectedLeadId,
      fetchPolicy: 'network-only',
    }
  )

  // Query para obtener cuentas de la ruta (para multas y balances)
  const { data: accountsData, refetch: refetchAccounts } = useQuery(ACCOUNTS_QUERY, {
    variables: { routeId: selectedRouteId },
    skip: !selectedRouteId,
  })

  // Calculate UTC date range for the selected date (for queries)
  const { startDateUTC, endDateUTC } = useMemo(() => {
    const start = new Date(selectedDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(selectedDate)
    end.setHours(23, 59, 59, 999)
    return {
      startDateUTC: start.toISOString(),
      endDateUTC: end.toISOString(),
    }
  }, [selectedDate])

  // Query para obtener el LeadPaymentReceived del día directamente
  const { data: leadPaymentData, refetch: refetchLeadPayment } = useQuery(LEAD_PAYMENT_RECEIVED_BY_DATE_QUERY, {
    variables: {
      leadId: selectedLeadId,
      startDate: startDateUTC,
      endDate: endDateUTC,
    },
    skip: !selectedLeadId,
    fetchPolicy: 'network-only',
  })

  // Cuentas de efectivo del empleado para destino de multa
  const cashAccounts: Account[] = useMemo(() => {
    return accountsData?.accounts?.filter((acc: Account) =>
      acc.type === 'EMPLOYEE_CASH_FUND' || acc.type === 'OFFICE_CASH_FUND'
    ) || []
  }, [accountsData])

  // Mutation para crear transacción (multa)
  const [createTransaction] = useMutation(CREATE_TRANSACTION)

  // Mutations para pagos agrupados
  const [createLeadPaymentReceived] = useMutation(CREATE_LEAD_PAYMENT_RECEIVED)
  const [updateLeadPaymentReceived] = useMutation(UPDATE_LEAD_PAYMENT_RECEIVED)

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

  // Map of loanId -> payment registered today for quick lookup
  const registeredPaymentsMap = useMemo(() => {
    const map = new Map<string, LoanPayment>()
    loans.forEach((loan) => {
      // Find payment for selected date
      const paymentToday = loan.payments?.find((payment) =>
        isSameDay(new Date(payment.receivedAt), selectedDate)
      )
      if (paymentToday) {
        map.set(loan.id, paymentToday)
      }
    })
    return map
  }, [loans, selectedDate])

  // Get LeadPaymentReceived ID from the direct query
  const leadPaymentReceivedId = useMemo(() => {
    const record = leadPaymentData?.leadPaymentReceivedByLeadAndDate
    if (record?.id) {
      console.log('=== leadPaymentReceivedId found from query ===')
      console.log('leadPaymentReceivedId:', record.id)
      return record.id
    }
    console.log('=== leadPaymentReceivedId NOT found ===')
    return null
  }, [leadPaymentData])

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
    setUserAddedPayments([])
    setEditedPayments({})
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

  // Calculate totals for NEW payments (not yet registered)
  const totals = useMemo(() => {
    let cashTotal = 0
    let bankTotal = 0
    let paymentsCount = 0
    let noPaymentCount = 0
    let commissionTotal = 0

    // Count payments from the payments state (loans without registered payment today)
    Object.entries(payments).forEach(([loanId, payment]) => {
      // Skip if this loan already has a registered payment today
      if (registeredPaymentsMap.has(loanId)) return

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

    // Count user-added payments (Agregar Pago)
    userAddedPayments.forEach((payment) => {
      const amount = parseFloat(payment.amount || '0')
      const commission = parseFloat(payment.commission || '0')

      if (amount > 0 && payment.loanId) {
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
  }, [payments, userAddedPayments, registeredPaymentsMap])

  // Calculate totals for REGISTERED payments (already saved) - considering edits
  const registeredTotals = useMemo(() => {
    let cashTotal = 0
    let bankTotal = 0
    let paymentsCount = 0
    let deletedCount = 0
    let commissionTotal = 0

    registeredPaymentsMap.forEach((payment, loanId) => {
      const edited = editedPayments[loanId]

      // If marked for deletion, count as deleted
      if (edited?.isDeleted) {
        deletedCount++
        return
      }

      // Use edited values if available, otherwise original
      const amount = edited ? parseFloat(edited.amount || '0') : parseFloat(payment.amount || '0')
      const commission = edited ? parseFloat(edited.comission || '0') : parseFloat(payment.comission || '0')
      const method = edited ? edited.paymentMethod : payment.paymentMethod

      if (amount > 0) {
        paymentsCount++
        commissionTotal += commission
        if (method === 'CASH') {
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
      deleted: deletedCount,
      commission: commissionTotal,
    }
  }, [registeredPaymentsMap, editedPayments])

  // Combined totals (new + registered considering edits)
  const combinedTotals = useMemo(() => {
    return {
      cash: totals.cash + registeredTotals.cash,
      bank: totals.bank + registeredTotals.bank,
      total: totals.total + registeredTotals.total,
      count: totals.count + registeredTotals.count,
      noPayment: totals.noPayment,
      deleted: registeredTotals.deleted,
      commission: totals.commission + registeredTotals.commission,
    }
  }, [totals, registeredTotals])

  // Modal totals - uses registeredTotals when editing, totals when saving new
  const modalTotals = useMemo(() => {
    const hasEdits = Object.keys(editedPayments).length > 0
    if (hasEdits) {
      return {
        cash: registeredTotals.cash,
        bank: registeredTotals.bank,
        total: registeredTotals.total,
        count: registeredTotals.count,
        deleted: registeredTotals.deleted,
        commission: registeredTotals.commission,
        noPayment: 0, // Not applicable for edits
      }
    }
    return {
      cash: totals.cash,
      bank: totals.bank,
      total: totals.total,
      count: totals.count,
      deleted: 0,
      commission: totals.commission,
      noPayment: totals.noPayment,
    }
  }, [editedPayments, registeredTotals, totals])

  // Count incomplete
  const incompleteCount = useMemo(() => {
    return loans.filter((loan) => hasIncompleteAval(loan) || hasIncompletePhone(loan)).length
  }, [loans])

  // Count registered payments for today
  const registeredCount = registeredPaymentsMap.size

  // Check if there are pending edits to save
  const hasEditedPayments = Object.keys(editedPayments).length > 0
  const editedCount = Object.values(editedPayments).filter((p) => !p.isDeleted).length
  const deletedCount = Object.values(editedPayments).filter((p) => p.isDeleted).length

  // Start editing a registered payment
  const handleStartEditPayment = (loanId: string, registeredPayment: LoanPayment) => {
    setEditedPayments((prev) => ({
      ...prev,
      [loanId]: {
        paymentId: registeredPayment.id,
        loanId,
        amount: registeredPayment.amount,
        comission: registeredPayment.comission,
        paymentMethod: registeredPayment.paymentMethod,
        isDeleted: false,
      },
    }))
  }

  // Update an edited payment field
  const handleEditPaymentChange = (loanId: string, field: keyof EditedPayment, value: string | boolean) => {
    setEditedPayments((prev) => ({
      ...prev,
      [loanId]: {
        ...prev[loanId],
        [field]: value,
      },
    }))
  }

  // Toggle delete (strikethrough) for an edited payment
  const handleToggleDeletePayment = (loanId: string) => {
    setEditedPayments((prev) => ({
      ...prev,
      [loanId]: {
        ...prev[loanId],
        isDeleted: !prev[loanId]?.isDeleted,
      },
    }))
  }

  // Cancel editing a payment
  const handleCancelEditPayment = (loanId: string) => {
    setEditedPayments((prev) => {
      const updated = { ...prev }
      delete updated[loanId]
      return updated
    })
  }

  // === USER-ADDED PAYMENTS (Agregar Pago) ===

  // Add a new user payment row at the TOP
  const handleAddPayment = () => {
    const tempId = `temp-${Date.now()}`
    setUserAddedPayments((prev) => [
      {
        tempId,
        loanId: '',
        amount: '',
        commission: globalCommission || '0',
        paymentMethod: 'CASH',
      },
      ...prev, // New payments appear at TOP
    ])
  }

  // Update a user-added payment field
  const handleUserAddedPaymentChange = (
    tempId: string,
    field: keyof Omit<UserAddedPayment, 'tempId'>,
    value: string
  ) => {
    setUserAddedPayments((prev) =>
      prev.map((p) => {
        if (p.tempId !== tempId) return p

        // If changing loanId, auto-populate commission from loantype
        if (field === 'loanId') {
          const selectedLoan = loans.find((l) => l.id === value)
          const loanCommission = selectedLoan?.loantype?.loanPaymentComission
            ? Math.round(parseFloat(selectedLoan.loantype.loanPaymentComission)).toString()
            : globalCommission || '0'

          return {
            ...p,
            loanId: value,
            commission: loanCommission,
            // Pre-fill amount with expected weekly payment
            amount: p.amount || selectedLoan?.expectedWeeklyPayment || '',
          }
        }

        return { ...p, [field]: value }
      })
    )
  }

  // Remove a user-added payment
  const handleRemoveUserAddedPayment = (tempId: string) => {
    setUserAddedPayments((prev) => prev.filter((p) => p.tempId !== tempId))
  }

  // Get available loans for user-added payments dropdown
  // Shows ALL loans except those already selected in OTHER user-added rows
  // (A loan can have multiple payments, so we don't filter by registeredPaymentsMap)
  const getAvailableLoansForRow = useCallback((currentTempId: string) => {
    const usedLoanIds = new Set(
      userAddedPayments
        .filter((p) => p.tempId !== currentTempId && p.loanId) // Exclude current row
        .map((p) => p.loanId)
    )

    return loans.filter((loan) => !usedLoanIds.has(loan.id))
  }, [loans, userAddedPayments])

  // Open modal for editing registered payments
  const handleSaveEditedPayments = () => {
    const editsToSave = Object.values(editedPayments)
    if (editsToSave.length === 0) return

    // Pre-set bank transfer amount for the modal
    // registeredTotals already contains the correct calculated values including edits/deletions
    setBankTransferAmount('0')
    setShowDistributionModal(true)
  }

  // Confirm save for edited payments
  const handleConfirmSaveEdits = async () => {
    if (!leadPaymentReceivedId) {
      toast({
        title: 'Error',
        description: 'No se encontró el registro de pagos del día. Recarga la página e intenta de nuevo.',
        variant: 'destructive',
      })
      return
    }

    setIsSavingEdits(true)

    try {
      // Build the payments array for update
      const paymentsToUpdate: {
        paymentId?: string
        loanId: string
        amount: string
        comission?: string
        paymentMethod: 'CASH' | 'MONEY_TRANSFER'
        isDeleted?: boolean
      }[] = []

      // Add edited payments
      Object.values(editedPayments).forEach((edit) => {
        paymentsToUpdate.push({
          paymentId: edit.paymentId,
          loanId: edit.loanId,
          amount: edit.amount,
          comission: edit.comission,
          paymentMethod: edit.paymentMethod,
          isDeleted: edit.isDeleted,
        })
      })

      // Add unchanged registered payments
      registeredPaymentsMap.forEach((payment, loanId) => {
        if (!editedPayments[loanId]) {
          paymentsToUpdate.push({
            paymentId: payment.id,
            loanId,
            amount: payment.amount,
            comission: payment.comission,
            paymentMethod: payment.paymentMethod,
            isDeleted: false,
          })
        }
      })

      // Calculate totals for the update
      const bankTransferValue = parseFloat(bankTransferAmount || '0')
      let cashTotal = 0
      let bankTotal = 0

      paymentsToUpdate.forEach((p) => {
        if (p.isDeleted) return
        const amount = parseFloat(p.amount || '0')
        if (p.paymentMethod === 'CASH') {
          cashTotal += amount
        } else {
          bankTotal += amount
        }
      })

      const cashValue = cashTotal - bankTransferValue
      const totalPaid = cashTotal + bankTotal

      await updateLeadPaymentReceived({
        variables: {
          id: leadPaymentReceivedId,
          input: {
            paidAmount: totalPaid.toString(),
            cashPaidAmount: cashValue.toString(),
            bankPaidAmount: (bankTotal + bankTransferValue).toString(),
            payments: paymentsToUpdate,
          },
        },
      })

      toast({
        title: 'Cambios guardados',
        description: `Se actualizaron ${editedCount} pago(s)${deletedCount > 0 ? ` y eliminaron ${deletedCount}` : ''}.`,
      })

      setEditedPayments({})
      setShowDistributionModal(false)

      // Refrescar queries para tener los datos actualizados (incluyendo balances de cuentas)
      await Promise.all([refetchLoans(), refetchLeadPayment(), refetchAccounts()])
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios. Intenta de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingEdits(false)
    }
  }

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
    setUserAddedPayments([])
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
    // Get valid payments from the regular payments state
    const validPayments = Object.values(payments).filter(
      (p) => !p.isNoPayment && p.amount && parseFloat(p.amount) > 0
    )

    // Get valid user-added payments (must have loanId and amount)
    const validUserAddedPayments = userAddedPayments.filter(
      (p) => p.loanId && p.amount && parseFloat(p.amount) > 0
    )

    // Combine all payments
    const allPaymentsToSave = [
      ...validPayments.map((p) => ({
        loanId: p.loanId,
        amount: p.amount,
        comission: p.commission || '0',
        paymentMethod: p.paymentMethod,
      })),
      ...validUserAddedPayments.map((p) => ({
        loanId: p.loanId,
        amount: p.amount,
        comission: p.commission || '0',
        paymentMethod: p.paymentMethod,
      })),
    ]

    if (allPaymentsToSave.length === 0) {
      toast({
        title: 'Sin pagos',
        description: 'No hay pagos válidos para guardar.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    setSavingProgress({ current: 0, total: 1 })

    try {
      // Calculate totals from distribution
      const bankTransferValue = parseFloat(bankTransferAmount || '0')
      const cashValue = totals.cash - bankTransferValue

      // Create all payments in a single LeadPaymentReceived
      await createLeadPaymentReceived({
        variables: {
          input: {
            leadId: selectedLeadId,
            agentId: selectedLeadId, // Using lead as agent for now
            expectedAmount: totals.total.toString(),
            paidAmount: totals.total.toString(),
            cashPaidAmount: cashValue.toString(),
            bankPaidAmount: (totals.bank + bankTransferValue).toString(),
            falcoAmount: '0',
            paymentDate: selectedDate.toISOString(),
            payments: allPaymentsToSave,
          },
        },
      })

      setSavingProgress({ current: 1, total: 1 })
      setSavedCount(allPaymentsToSave.length)
      setShowDistributionModal(false)
      setShowSuccessDialog(true)
      setPayments({})
      setUserAddedPayments([])
      setLastSelectedIndex(null)

      // Refrescar queries para tener los datos actualizados (incluyendo balances de cuentas)
      await Promise.all([refetchLoans(), refetchLeadPayment(), refetchAccounts()])

      toast({
        title: 'Abonos guardados',
        description: `Se guardaron ${allPaymentsToSave.length} abono(s) correctamente.`,
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
      setSavingProgress(null)
    }
  }

  // Open multa modal
  const handleOpenMultaModal = () => {
    setMultaAmount('')
    // Pre-select the first cash account if available
    if (cashAccounts.length > 0) {
      setSelectedAccountId(cashAccounts[0].id)
    }
    setShowMultaModal(true)
  }

  // Create multa (fine/penalty) transaction
  const handleCreateMulta = async () => {
    if (!multaAmount || parseFloat(multaAmount) <= 0) {
      toast({
        title: 'Error',
        description: 'Ingresa un monto válido para la multa.',
        variant: 'destructive',
      })
      return
    }

    if (!selectedAccountId) {
      toast({
        title: 'Error',
        description: 'Selecciona una cuenta de destino.',
        variant: 'destructive',
      })
      return
    }

    setIsCreatingMulta(true)

    try {
      await createTransaction({
        variables: {
          input: {
            amount: multaAmount,
            date: selectedDate.toISOString(),
            type: 'INCOME',
            incomeSource: 'MULTA',
            sourceAccountId: selectedAccountId,
            routeId: selectedRouteId,
            leadId: selectedLeadId,
          },
        },
      })

      toast({
        title: 'Multa registrada',
        description: `Se registró una multa de ${formatCurrency(parseFloat(multaAmount))}.`,
      })

      setShowMultaModal(false)
      setMultaAmount('')
    } catch (error) {
      console.error('Error al crear multa:', error)
      toast({
        title: 'Error',
        description: 'No se pudo registrar la multa. Intenta de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingMulta(false)
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
      {/* DEBUG PANEL - REMOVER DESPUÉS */}
      <Card className="bg-yellow-50 border-yellow-300">
        <CardHeader className="py-2">
          <CardTitle className="text-sm text-yellow-800">DEBUG INFO</CardTitle>
        </CardHeader>
        <CardContent className="py-2 text-xs font-mono">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>selectedLeadId:</strong> {selectedLeadId || 'null'}
            </div>
            <div>
              <strong>selectedDate:</strong> {selectedDate?.toISOString() || 'null'}
            </div>
            <div>
              <strong>startDateUTC:</strong> {startDateUTC}
            </div>
            <div>
              <strong>endDateUTC:</strong> {endDateUTC}
            </div>
            <div>
              <strong>leadPaymentReceivedId:</strong>{' '}
              <span className={leadPaymentReceivedId ? 'text-green-600' : 'text-red-600'}>
                {leadPaymentReceivedId || 'NULL (este es el problema)'}
              </span>
            </div>
            <div>
              <strong>leadPaymentData:</strong>{' '}
              {JSON.stringify(leadPaymentData?.leadPaymentReceivedByLeadAndDate || 'null')}
            </div>
            <div>
              <strong>registeredPaymentsMap.size:</strong> {registeredPaymentsMap.size}
            </div>
            <div>
              <strong>hasEdits:</strong> {Object.keys(editedPayments).length > 0 ? 'YES' : 'NO'}
            </div>
          </div>
          {registeredPaymentsMap.size > 0 && (
            <div className="mt-2 border-t border-yellow-300 pt-2">
              <strong>Pagos registrados hoy:</strong>
              <ul className="ml-4">
                {Array.from(registeredPaymentsMap.entries()).slice(0, 3).map(([loanId, payment]) => (
                  <li key={loanId}>
                    loanId: {loanId.slice(0, 8)}..., paymentId: {payment.id.slice(0, 8)}...,
                    leadPaymentReceived: {payment.leadPaymentReceived?.id || 'NULL'}
                  </li>
                ))}
                {registeredPaymentsMap.size > 3 && <li>...y {registeredPaymentsMap.size - 3} más</li>}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

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

                {registeredCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs py-0.5 px-2 bg-slate-100 text-slate-700 border-slate-300 cursor-default">
                        <Check className="h-3 w-3 mr-1" />
                        {registeredCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent><p>Ya registrados hoy</p></TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0.5 px-2 bg-green-50 text-green-700 border-green-200 cursor-default">
                      <Check className="h-3 w-3 mr-1" />
                      {totals.count}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>Abonos nuevos por guardar</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0.5 px-2 bg-red-50 text-red-700 border-red-200 cursor-default">
                      <Ban className="h-3 w-3 mr-1" />
                      {combinedTotals.noPayment}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>Marcados sin pago</p></TooltipContent>
                </Tooltip>

                {combinedTotals.deleted > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs py-0.5 px-2 bg-red-100 text-red-700 border-red-300 cursor-default">
                        <Trash2 className="h-3 w-3 mr-1" />
                        {combinedTotals.deleted}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent><p>Pagos a eliminar</p></TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0.5 px-2 bg-purple-50 text-purple-700 border-purple-200 cursor-default">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {formatCurrency(combinedTotals.commission)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>Comisión del líder</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0.5 px-2 bg-green-50 text-green-700 border-green-200 cursor-default">
                      <Wallet className="h-3 w-3 mr-1" />
                      {formatCurrency(combinedTotals.cash)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>Cobrado en efectivo</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0.5 px-2 bg-blue-50 text-blue-700 border-blue-200 cursor-default">
                      <Building2 className="h-3 w-3 mr-1" />
                      {formatCurrency(combinedTotals.bank)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>Cobrado por transferencia</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs py-0.5 px-2 font-bold bg-slate-100 cursor-default">
                      {formatCurrency(combinedTotals.total)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold">Distribución Total</p>
                      <p>💵 Efectivo: {formatCurrency(combinedTotals.cash)}</p>
                      <p>🏦 Transferencia: {formatCurrency(combinedTotals.bank)}</p>
                      <p>📊 Comisión: {formatCurrency(combinedTotals.commission)}</p>
                    </div>
                  </TooltipContent>
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
                disabled={totals.count === 0 && totals.noPayment === 0 && userAddedPayments.length === 0}
                className="h-8 px-2"
                title="Limpiar todos los pagos"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddPayment}
                className="h-8 px-2 gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                title="Agregar pago manual"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Agregar Pago</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenMultaModal}
                className="h-8 px-2 gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                title="Registrar multa"
              >
                <Gavel className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Multa</span>
              </Button>

              {totals.count > 0 && !hasEditedPayments && (
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

              {hasEditedPayments && (
                <>
                  <div className="h-5 w-px bg-border" />
                  <Button
                    size="sm"
                    onClick={handleSaveEditedPayments}
                    disabled={isSavingEdits}
                    className="gap-1.5 h-8 bg-yellow-600 hover:bg-yellow-700"
                  >
                    {isSavingEdits ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Pencil className="h-3.5 w-3.5" />
                    )}
                    Guardar Cambios ({editedCount + deletedCount})
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
                {/* User-added payment rows at TOP */}
                {userAddedPayments.map((userPayment) => {
                  const selectedLoan = loans.find((l) => l.id === userPayment.loanId)
                  const hasValidAmount = parseFloat(userPayment.amount || '0') > 0
                  const hasLoanSelected = !!userPayment.loanId
                  const isComplete = hasValidAmount && hasLoanSelected

                  return (
                    <TableRow
                      key={userPayment.tempId}
                      className={cn(
                        'transition-colors bg-blue-50 dark:bg-blue-950/30',
                        isComplete && 'bg-green-50 dark:bg-green-950/30'
                      )}
                      style={{
                        borderLeft: `4px solid ${isComplete ? '#22c55e' : '#3b82f6'}`,
                      }}
                    >
                      {/* No-payment checkbox - not applicable for user-added */}
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveUserAddedPayment(userPayment.tempId)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar pago"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                      {/* Index */}
                      <TableCell className="font-medium text-blue-600">
                        <Plus className="h-4 w-4" />
                      </TableCell>
                      {/* Loan selector (instead of fixed client name) */}
                      <TableCell colSpan={2}>
                        <Select
                          value={userPayment.loanId}
                          onValueChange={(value) =>
                            handleUserAddedPaymentChange(userPayment.tempId, 'loanId', value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona un préstamo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Available loans for this row */}
                            {getAvailableLoansForRow(userPayment.tempId).map((loan) => (
                              <SelectItem key={loan.id} value={loan.id}>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span className="font-medium">
                                    {loan.borrower?.personalData?.fullName || 'Sin nombre'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    ({loan.loantype?.name} - {formatCurrency(parseFloat(loan.expectedWeeklyPayment))})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {/* Sign date */}
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {selectedLoan?.signDate
                          ? format(new Date(selectedLoan.signDate), 'dd/MM/yy')
                          : '-'}
                      </TableCell>
                      {/* Expected weekly payment */}
                      <TableCell className="text-right font-medium">
                        {selectedLoan
                          ? formatCurrency(parseFloat(selectedLoan.expectedWeeklyPayment))
                          : '-'}
                      </TableCell>
                      {/* Amount input */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="number"
                          placeholder="0"
                          value={userPayment.amount}
                          onChange={(e) =>
                            handleUserAddedPaymentChange(userPayment.tempId, 'amount', e.target.value)
                          }
                          className="w-[90px]"
                        />
                      </TableCell>
                      {/* Commission input */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="number"
                          placeholder="0"
                          value={userPayment.commission}
                          onChange={(e) =>
                            handleUserAddedPaymentChange(userPayment.tempId, 'commission', e.target.value)
                          }
                          className="w-[70px]"
                        />
                      </TableCell>
                      {/* Payment method */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={userPayment.paymentMethod}
                          onValueChange={(value) =>
                            handleUserAddedPaymentChange(
                              userPayment.tempId,
                              'paymentMethod',
                              value as 'CASH' | 'MONEY_TRANSFER'
                            )
                          }
                        >
                          <SelectTrigger className="w-[110px]">
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
                      {/* Status */}
                      <TableCell>
                        {isComplete ? (
                          <Badge className="bg-green-600 text-xs font-semibold">
                            <Check className="h-3 w-3 mr-1" />
                            Listo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                            <Plus className="h-3 w-3 mr-1" />
                            Nuevo
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}

                {filteredLoans.map((loan, index) => {
                  const payment = payments[loan.id]
                  const registeredPayment = registeredPaymentsMap.get(loan.id)
                  const editedPayment = editedPayments[loan.id]
                  const isRegistered = !!registeredPayment
                  const isEditing = !!editedPayment
                  const isMarkedForDeletion = editedPayment?.isDeleted
                  // isNoPayment: marcado manualmente O (existe LPR del día pero este préstamo no tiene pago registrado)
                  const isNoPayment = payment?.isNoPayment || (leadPaymentReceivedId && !isRegistered)
                  const hasPayment = payment && payment.amount && parseFloat(payment.amount) > 0 && !payment?.isNoPayment
                  const isTransfer = payment?.paymentMethod === 'MONEY_TRANSFER'
                  const isCash = payment?.paymentMethod === 'CASH' || !payment?.paymentMethod
                  const hasZeroCommission = hasPayment && parseFloat(payment?.commission || '0') === 0
                  const aval = loan.collaterals?.[0]
                  const isIncompleteAval = hasIncompleteAval(loan)
                  const isIncompletePhone = hasIncompletePhone(loan)
                  const isIncomplete = isIncompleteAval || isIncompletePhone

                  // Determine row styling based on priority:
                  // 0. Editing/marked for deletion - yellow/red
                  // 1. Registered payment - slate/gray - already saved
                  // 2. Sin pago - red
                  // 3. Aval incompleto - orange
                  // 4. Zero commission - amber/yellow
                  // 5. Transfer payment - purple
                  // 6. Cash payment - green
                  // 7. Pending - default
                  const getRowStyle = () => {
                    if (isMarkedForDeletion) {
                      return {
                        className: 'bg-red-100 dark:bg-red-950/50 line-through',
                        borderColor: '#dc2626',
                        borderWidth: '4px'
                      }
                    }
                    if (isEditing) {
                      return {
                        className: 'bg-yellow-50 dark:bg-yellow-950/30',
                        borderColor: '#eab308',
                        borderWidth: '4px'
                      }
                    }
                    if (isRegistered) {
                      return {
                        className: 'bg-slate-100 dark:bg-slate-800/50 opacity-75',
                        borderColor: '#64748b',
                        borderWidth: '4px'
                      }
                    }
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
                  // También funciona para pagos registrados, marcándolos para eliminación
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

                    // Si es un pago registrado, marcar para eliminación (strikethrough)
                    if (isRegistered && registeredPayment) {
                      if (isEditing) {
                        // Si ya está editando, toggle el strikethrough
                        handleToggleDeletePayment(loan.id)
                      } else {
                        // Iniciar edición y marcar como eliminado
                        handleStartEditPayment(loan.id, registeredPayment)
                        // Toggle delete después de un tick para que el estado se actualice
                        setTimeout(() => handleToggleDeletePayment(loan.id), 0)
                      }
                      return
                    }

                    // Para pagos no registrados, usar el toggle normal
                    handleToggleNoPaymentWithShift(loan.id, index, e.shiftKey)
                  }

                  return (
                    <TableRow
                      key={loan.id}
                      className={cn(
                        'transition-colors select-none cursor-pointer',
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
                          if (isRegistered && registeredPayment) {
                            if (isEditing) {
                              handleToggleDeletePayment(loan.id)
                            } else {
                              handleStartEditPayment(loan.id, registeredPayment)
                              setTimeout(() => handleToggleDeletePayment(loan.id), 0)
                            }
                          } else {
                            handleToggleNoPaymentWithShift(loan.id, index, e.shiftKey)
                          }
                        }}
                        className="cursor-pointer"
                        title={isRegistered ? 'Click para marcar sin pago (strikethrough)' : 'Click para marcar sin pago'}
                      >
                        <Checkbox
                          checked={isMarkedForDeletion || isNoPayment || false}
                          onCheckedChange={() => {
                            if (isRegistered && registeredPayment) {
                              if (isEditing) {
                                handleToggleDeletePayment(loan.id)
                              } else {
                                handleStartEditPayment(loan.id, registeredPayment)
                                setTimeout(() => handleToggleDeletePayment(loan.id), 0)
                              }
                            } else {
                              handleToggleNoPaymentWithShift(loan.id, index, false)
                            }
                          }}
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
                        {isRegistered ? (
                          isEditing ? (
                            <Input
                              type="number"
                              placeholder="0"
                              value={editedPayment.amount}
                              onChange={(e) => handleEditPaymentChange(loan.id, 'amount', e.target.value)}
                              className={cn("w-[90px]", isMarkedForDeletion && "opacity-50")}
                              disabled={isMarkedForDeletion}
                            />
                          ) : (
                            <div className="w-[90px] h-9 px-3 flex items-center text-sm font-medium text-slate-600">
                              {formatCurrency(parseFloat(registeredPayment.amount))}
                            </div>
                          )
                        ) : (
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
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {isRegistered ? (
                          isEditing ? (
                            <Input
                              type="number"
                              placeholder="0"
                              value={editedPayment.comission}
                              onChange={(e) => handleEditPaymentChange(loan.id, 'comission', e.target.value)}
                              className={cn("w-[70px]", isMarkedForDeletion && "opacity-50")}
                              disabled={isMarkedForDeletion}
                            />
                          ) : (
                            <div className="w-[70px] h-9 px-3 flex items-center text-sm text-slate-600">
                              {formatCurrency(parseFloat(registeredPayment.comission || '0'))}
                            </div>
                          )
                        ) : (
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
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {isRegistered ? (
                          isEditing ? (
                            <Select
                              value={editedPayment.paymentMethod}
                              onValueChange={(value) =>
                                handleEditPaymentChange(loan.id, 'paymentMethod', value)
                              }
                              disabled={isMarkedForDeletion}
                            >
                              <SelectTrigger className={cn("w-[110px]", isMarkedForDeletion && "opacity-50")}>
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
                          ) : (
                            <div className="w-[110px] h-9 px-3 flex items-center gap-2 text-sm text-slate-600">
                              {registeredPayment.paymentMethod === 'MONEY_TRANSFER' ? (
                                <>
                                  <Building2 className="h-4 w-4" />
                                  Banco
                                </>
                              ) : (
                                <>
                                  <Wallet className="h-4 w-4" />
                                  Efectivo
                                </>
                              )}
                            </div>
                          )
                        ) : (
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
                        )}
                      </TableCell>
                      <TableCell
                        className={isRegistered && !isEditing ? 'cursor-default' : 'cursor-pointer'}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isRegistered) {
                            handleToggleNoPaymentWithShift(loan.id, index, e.shiftKey)
                          }
                        }}
                        title={isRegistered && !isEditing ? 'Pago ya registrado - click en Editar para modificar' : !isRegistered ? 'Click para marcar sin pago' : ''}
                      >
                        {isRegistered ? (
                          isEditing ? (
                            // Editing mode - show action buttons
                            <div className="flex items-center gap-1">
                              {isMarkedForDeletion ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleDeletePayment(loan.id)
                                  }}
                                  className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Restaurar pago"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleToggleDeletePayment(loan.id)
                                  }}
                                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Eliminar pago"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCancelEditPayment(loan.id)
                                }}
                                className="h-7 px-2 text-muted-foreground hover:text-foreground"
                                title="Cancelar edición"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            // Not editing - show badge with edit button
                            <div className="flex items-center gap-1">
                              <Badge className="bg-slate-600 text-xs font-semibold">
                                <Check className="h-3 w-3 mr-1" />
                                Registrado
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStartEditPayment(loan.id, registeredPayment)
                                }}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                title="Editar pago"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        ) : isNoPayment ? (
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
                        {hasZeroCommission && !isRegistered && (
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

      {/* Cash Distribution Modal - Matches original Keystone design */}
      <Dialog open={showDistributionModal} onOpenChange={(open) => !isSubmitting && setShowDistributionModal(open)}>
        <DialogContent className="sm:max-w-lg">
          {/* Saving Overlay */}
          {isSubmitting && savingProgress && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 rounded-lg">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Guardando abonos...</h3>
              <p className="text-muted-foreground mb-4">
                Procesando {savingProgress.current} de {savingProgress.total}
              </p>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(savingProgress.current / savingProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                No cierres esta ventana
              </p>
            </div>
          )}

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
                Total: {formatCurrency(modalTotals.total)}
              </h4>
              {modalTotals.deleted > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  ({modalTotals.deleted} pago(s) serán eliminados)
                </p>
              )}
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
                      {formatCurrency(modalTotals.cash)}
                    </p>
                  </div>
                </div>
                {/* Transferencia */}
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Transferencia</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      {formatCurrency(modalTotals.bank)}
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
                  {formatCurrency(modalTotals.cash - parseFloat(bankTransferAmount || '0'))}
                </div>
                <p className="text-xs text-muted-foreground italic mt-1.5">
                  Solo puedes distribuir: {formatCurrency(modalTotals.cash)} (efectivo real)
                </p>
              </div>

              {/* Input de Transferencia */}
              <div>
                <Label htmlFor="bank-transfer" className="text-sm">Transferencia:</Label>
                <Input
                  id="bank-transfer"
                  type="number"
                  min="0"
                  max={modalTotals.cash}
                  value={bankTransferAmount}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(parseFloat(e.target.value) || 0, modalTotals.cash))
                    setBankTransferAmount(value.toString())
                  }}
                  className={cn(
                    "mt-1.5",
                    parseFloat(bankTransferAmount || '0') > modalTotals.cash && "border-red-500 border-2"
                  )}
                  onWheel={(e) => e.currentTarget.blur()}
                />
                <p className="text-xs text-muted-foreground italic mt-1.5">
                  Máximo: {formatCurrency(modalTotals.cash)}
                </p>
              </div>
            </div>

            {/* Error si la transferencia excede el efectivo */}
            {parseFloat(bankTransferAmount || '0') > modalTotals.cash && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-md text-center">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  El monto de transferencia no puede ser mayor al efectivo real disponible ({formatCurrency(modalTotals.cash)})
                </p>
              </div>
            )}

            {/* Resumen de la operación */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">Resumen de la operación:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{hasEditedPayments ? 'Abonos activos:' : 'Abonos a registrar:'}</span>
                  <span className="font-medium">{modalTotals.count}</span>
                </div>
                {modalTotals.deleted > 0 && (
                  <div className="flex justify-between">
                    <span>Abonos a eliminar:</span>
                    <span className="font-medium text-red-600">{modalTotals.deleted}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Total cobrado:</span>
                  <span className="font-medium">{formatCurrency(modalTotals.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comisiones:</span>
                  <span className="font-medium text-purple-600">{formatCurrency(modalTotals.commission)}</span>
                </div>
                {!hasEditedPayments && modalTotals.noPayment > 0 && (
                  <div className="flex justify-between">
                    <span>Sin pago:</span>
                    <span className="font-medium text-red-600">{modalTotals.noPayment}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDistributionModal(false)}
              disabled={isSubmitting || isSavingEdits}
            >
              Cancelar
            </Button>
            <Button
              onClick={hasEditedPayments ? handleConfirmSaveEdits : handleConfirmSave}
              disabled={(isSubmitting || isSavingEdits) || parseFloat(bankTransferAmount || '0') > totals.cash}
              className="gap-2"
            >
              {(isSubmitting || isSavingEdits) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {hasEditedPayments ? 'Actualizar Pagos' : 'Confirmar y Guardar'}
                </>
              )}
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

      {/* Multa (Fine/Penalty) Modal */}
      <Dialog open={showMultaModal} onOpenChange={(open) => !isCreatingMulta && setShowMultaModal(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-orange-600" />
              Registrar Multa
            </DialogTitle>
            <DialogDescription>
              Crea una multa para esta localidad en la fecha seleccionada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Monto de la multa */}
            <div>
              <Label htmlFor="multa-amount">Monto de la Multa</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="multa-amount"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={multaAmount}
                  onChange={(e) => setMultaAmount(e.target.value)}
                  className="pl-7"
                  autoFocus
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
            </div>

            {/* Cuenta destino */}
            <div>
              <Label htmlFor="multa-account">Cuenta Destino</Label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecciona una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cashAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        {account.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                El monto se registrará en esta cuenta
              </p>
            </div>

            {/* Resumen */}
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-sm text-muted-foreground mb-1">Detalles:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Fecha:</span>
                  <span className="font-medium">{format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monto:</span>
                  <span className="font-bold text-orange-600">
                    {multaAmount ? formatCurrency(parseFloat(multaAmount)) : '$0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowMultaModal(false)}
              disabled={isCreatingMulta}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateMulta}
              disabled={isCreatingMulta || !multaAmount || parseFloat(multaAmount) <= 0 || !selectedAccountId}
              className="gap-2 bg-orange-600 hover:bg-orange-700"
            >
              {isCreatingMulta ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Gavel className="h-4 w-4" />
                  Registrar Multa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
