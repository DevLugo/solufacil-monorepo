'use client'

import { useState, useMemo, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  MapPin,
  RefreshCw,
  User,
  DollarSign,
  AlertCircle,
  Wallet,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { UnifiedClientAutocomplete } from './UnifiedClientAutocomplete'
import { LocationWarning } from './LocationWarning'
import { usePendingLoans } from '../hooks/usePendingLoans'
import { CREATE_LOANS_IN_BATCH } from '@/graphql/mutations/transactions'
import type {
  LoanType,
  Account,
  PreviousLoan,
  PendingLoan,
  UnifiedClientValue,
} from '../types'

interface CreateLoansModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loanTypes: LoanType[]
  accounts: Account[]
  loansForRenewal: PreviousLoan[]
  leadId: string
  grantorId: string
  locationId?: string
  selectedDate: Date
  onSuccess: () => void
}

export function CreateLoansModal({
  open,
  onOpenChange,
  loanTypes,
  accounts,
  loansForRenewal,
  leadId,
  grantorId,
  locationId,
  selectedDate,
  onSuccess,
}: CreateLoansModalProps) {
  const { toast } = useToast()
  const {
    pendingLoans,
    addPendingLoan,
    removePendingLoan,
    updatePendingLoan,
    clearPendingLoans,
    totals,
    generateTempId,
  } = usePendingLoans()

  // Use the default cash account for the route (OFFICE_CASH_FUND)
  const defaultAccount = useMemo(() => {
    return accounts.find((a) => a.type === 'OFFICE_CASH_FUND') || accounts[0]
  }, [accounts])

  // Form state for adding a new loan
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null)
  const [selectedLoanTypeId, setSelectedLoanTypeId] = useState<string>('')
  const [requestedAmount, setRequestedAmount] = useState<string>('')
  const [comissionAmount, setComissionAmount] = useState<string>('')
  const [selectedBorrower, setSelectedBorrower] = useState<UnifiedClientValue | null>(null)
  const [selectedAval, setSelectedAval] = useState<UnifiedClientValue | null>(null)
  const [includeFirstPayment, setIncludeFirstPayment] = useState(false)
  const [firstPaymentAmount, setFirstPaymentAmount] = useState<string>('')
  const [globalComissionAmount, setGlobalComissionAmount] = useState<string>('')

  // Get active loan from selected borrower (if any)
  const selectedActiveLoan = selectedBorrower?.activeLoan

  const [createLoansInBatch, { loading: saving }] = useMutation(CREATE_LOANS_IN_BATCH)

  // Get selected loan type details
  const selectedLoanType = useMemo(
    () => loanTypes.find((lt) => lt.id === selectedLoanTypeId),
    [loanTypes, selectedLoanTypeId]
  )

  // Calculate the pending amount from active loan (deuda pendiente)
  const renewalPendingAmount = useMemo(() => {
    if (!selectedActiveLoan) return 0
    return parseFloat(selectedActiveLoan.pendingAmountStored) || 0
  }, [selectedActiveLoan])

  // Check if this is a renewal (client has active loan)
  const isRenewal = !!selectedActiveLoan

  // Calculate "Monto Otorgado" (amount actually given to client)
  // For renewals: requestedAmount - pendingAmount
  // For new loans: requestedAmount
  const calculatedAmountGived = useMemo(() => {
    const requested = parseFloat(requestedAmount) || 0
    if (isRenewal && renewalPendingAmount > 0) {
      return Math.max(0, requested - renewalPendingAmount)
    }
    return requested
  }, [requestedAmount, isRenewal, renewalPendingAmount])

  // Calculate weekly payment based on the total debt
  // Rate is already in decimal format (0.4 = 40%), so we use it directly
  const calculatedWeeklyPayment = useMemo(() => {
    if (!selectedLoanType || !requestedAmount) return 0
    const amount = parseFloat(requestedAmount) || 0
    const rate = parseFloat(selectedLoanType.rate) || 0
    const totalDebt = amount * (1 + rate)
    return totalDebt / selectedLoanType.weekDuration
  }, [selectedLoanType, requestedAmount])

  // Check if borrower is from different location
  const isBorrowerFromDifferentLocation = selectedBorrower && selectedBorrower.isFromCurrentLocation === false

  // Check if aval is from different location
  const isAvalFromDifferentLocation = selectedAval && selectedAval.isFromCurrentLocation === false

  // Auto-calculate comission when loan type changes
  useEffect(() => {
    if (selectedLoanType && !editingLoanId) {
      setComissionAmount(selectedLoanType.loanGrantedComission || '0')
    }
  }, [selectedLoanType, editingLoanId])

  // Account balance and validation
  const accountBalance = parseFloat(defaultAccount?.amount || '0')
  const hasInsufficientFunds = accountBalance < totals.totalAmount

  // Reset form
  const resetForm = () => {
    setEditingLoanId(null)
    setSelectedLoanTypeId('')
    setRequestedAmount('')
    setComissionAmount('')
    setSelectedBorrower(null)
    setSelectedAval(null)
    setIncludeFirstPayment(false)
    setFirstPaymentAmount('')
  }

  // Load loan data into form for editing
  const handleEditLoan = (loan: PendingLoan) => {
    setEditingLoanId(loan.tempId)
    setSelectedLoanTypeId(loan.loantypeId)
    setRequestedAmount(loan.requestedAmount)
    setComissionAmount(loan.comissionAmount)

    // Reconstruct borrower from loan data
    if (loan.borrowerId) {
      // Existing borrower
      setSelectedBorrower({
        id: loan.borrowerId,
        personalDataId: loan.borrowerPersonalDataId,
        phoneId: loan.borrowerPhoneId,
        fullName: loan.borrowerName,
        phone: loan.borrowerPhone,
        isFromCurrentLocation: !loan.isFromDifferentLocation,
        clientState: 'existing',
        action: 'connect',
      })
    } else if (loan.newBorrower) {
      // New borrower
      setSelectedBorrower({
        fullName: loan.newBorrower.personalData.fullName,
        phone: loan.newBorrower.personalData.phones?.[0]?.number,
        isFromCurrentLocation: !loan.isFromDifferentLocation,
        clientState: 'new',
        action: 'create',
      })
    }

    // Reconstruct aval from loan data
    if (loan.collateralIds && loan.collateralIds.length > 0) {
      // Existing aval
      setSelectedAval({
        id: loan.collateralIds[0],
        personalDataId: loan.collateralPersonalDataId,
        phoneId: loan.collateralPhoneId,
        fullName: loan.collateralName || '',
        phone: loan.collateralPhone,
        isFromCurrentLocation: true, // Assume same location for aval
        clientState: 'existing',
        action: 'connect',
      })
    } else if (loan.newCollateral) {
      // New aval
      setSelectedAval({
        fullName: loan.newCollateral.fullName,
        phone: loan.newCollateral.phones?.[0]?.number,
        isFromCurrentLocation: true,
        clientState: 'new',
        action: 'create',
      })
    } else {
      setSelectedAval(null)
    }

    // Set first payment if exists
    if (loan.firstPayment) {
      setIncludeFirstPayment(true)
      setFirstPaymentAmount(loan.firstPayment.amount)
    } else {
      setIncludeFirstPayment(false)
      setFirstPaymentAmount('')
    }
  }

  // Handle selecting a borrower - auto-fill if they have an active loan
  const handleBorrowerChange = (borrower: UnifiedClientValue | null) => {
    // If editing a loan and changing the borrower, cancel the edit
    if (editingLoanId) {
      setEditingLoanId(null)
    }

    setSelectedBorrower(borrower)

    // If borrower has an active loan, pre-fill the form
    if (borrower?.activeLoan) {
      const activeLoan = borrower.activeLoan
      // Pre-fill loan type from previous loan
      if (activeLoan.loantype?.id) {
        setSelectedLoanTypeId(activeLoan.loantype.id)
        // Set comission based on loantype's loanGrantedComission
        const loantype = loanTypes.find(lt => lt.id === activeLoan.loantype?.id)
        if (loantype) {
          setComissionAmount(loantype.loanGrantedComission || '0')
        }
      }
      // Pre-fill requested amount with the previous loan's amount
      setRequestedAmount(activeLoan.requestedAmount)
      // Pre-fill aval if exists
      if (activeLoan.collaterals && activeLoan.collaterals.length > 0) {
        const collateral = activeLoan.collaterals[0]
        setSelectedAval({
          id: collateral.id,
          personalDataId: collateral.id, // For avales, id IS the personalDataId
          phoneId: collateral.phones?.[0]?.id,
          fullName: collateral.fullName,
          phone: collateral.phones?.[0]?.number,
          isFromCurrentLocation: true, // Assume same location
          clientState: 'existing',
          action: 'connect',
        })
      }
    } else {
      // Clear loan type, amount, aval, and comission if borrower has no active loan
      setSelectedLoanTypeId('')
      setRequestedAmount('')
      setComissionAmount('')
      setSelectedAval(null)
    }
  }

  // Add or update loan in pending list
  const handleAddLoan = () => {
    if (!selectedLoanTypeId || !requestedAmount) {
      toast({
        title: 'Error',
        description: 'Selecciona un tipo de préstamo y monto',
        variant: 'destructive',
      })
      return
    }

    if (!selectedBorrower) {
      toast({
        title: 'Error',
        description: 'Selecciona un cliente',
        variant: 'destructive',
      })
      return
    }

    // Determine borrower info
    let borrowerId: string | undefined
    let borrowerPersonalDataId: string | undefined
    let borrowerPhoneId: string | undefined
    let borrowerName: string
    let borrowerPhone: string | undefined
    let newBorrower: PendingLoan['newBorrower']

    // Check if creating new or connecting existing borrower
    if (selectedBorrower.action === 'create') {
      // Creating new borrower
      borrowerName = selectedBorrower.fullName
      borrowerPhone = selectedBorrower.phone
      newBorrower = {
        personalData: {
          fullName: selectedBorrower.fullName,
          phones: selectedBorrower.phone ? [{ number: selectedBorrower.phone }] : undefined,
          addresses: locationId ? [{ street: '', locationId }] : undefined,
        },
      }
    } else {
      // Connecting existing borrower
      borrowerId = selectedBorrower.id
      borrowerPersonalDataId = selectedBorrower.personalDataId
      borrowerPhoneId = selectedBorrower.phoneId
      borrowerName = selectedBorrower.fullName
      borrowerPhone = selectedBorrower.phone
    }

    // Determine collateral/aval info
    let collateralIds: string[] = []
    let collateralPersonalDataId: string | undefined
    let collateralPhoneId: string | undefined
    let collateralName: string | undefined
    let collateralPhone: string | undefined
    let newCollateral: PendingLoan['newCollateral']

    if (selectedAval) {
      if (selectedAval.action === 'create') {
        // Creating new aval
        collateralName = selectedAval.fullName
        collateralPhone = selectedAval.phone
        newCollateral = {
          fullName: selectedAval.fullName,
          phones: selectedAval.phone ? [{ number: selectedAval.phone }] : undefined,
          addresses: locationId ? [{ street: '', locationId }] : undefined,
        }
      } else if (selectedAval.id) {
        // Connecting existing aval
        collateralIds = [selectedAval.id]
        collateralPersonalDataId = selectedAval.personalDataId
        collateralPhoneId = selectedAval.phoneId
        collateralName = selectedAval.fullName
        collateralPhone = selectedAval.phone
      }
    }

    const pendingLoanData: PendingLoan = {
      tempId: editingLoanId || generateTempId(),
      requestedAmount,
      amountGived: calculatedAmountGived.toString(), // For renewals: requestedAmount - pendingAmount
      loantypeId: selectedLoanTypeId,
      loantypeName: selectedLoanType?.name || '',
      weekDuration: selectedLoanType?.weekDuration || 0,
      comissionAmount: comissionAmount || '0',
      previousLoanId: selectedActiveLoan?.id,
      borrowerId,
      borrowerPersonalDataId,
      borrowerPhoneId,
      borrowerName,
      borrowerPhone,
      newBorrower,
      collateralIds,
      collateralPersonalDataId,
      collateralPhoneId,
      collateralName,
      collateralPhone,
      newCollateral,
      firstPayment: includeFirstPayment && firstPaymentAmount
        ? {
            amount: firstPaymentAmount,
            paymentMethod: 'CASH',
          }
        : undefined,
      isFromDifferentLocation: selectedBorrower?.isFromCurrentLocation === false,
      isRenewal,
    }

    if (editingLoanId) {
      // Update existing loan
      updatePendingLoan(editingLoanId, pendingLoanData)
      toast({
        title: 'Crédito actualizado',
        description: `${pendingLoanData.borrowerName} - ${formatCurrency(calculatedAmountGived)} a entregar`,
      })
    } else {
      // Add new loan
      addPendingLoan(pendingLoanData)
      toast({
        title: 'Crédito agregado',
        description: `${pendingLoanData.borrowerName} - ${formatCurrency(calculatedAmountGived)} a entregar`,
      })
    }

    resetForm()
  }

  // Save all pending loans
  const handleSaveAll = async () => {
    if (pendingLoans.length === 0) {
      toast({
        title: 'Error',
        description: 'Agrega al menos un crédito',
        variant: 'destructive',
      })
      return
    }

    if (!defaultAccount) {
      toast({
        title: 'Error',
        description: 'No hay cuenta de efectivo disponible para esta ruta',
        variant: 'destructive',
      })
      return
    }

    try {
      await createLoansInBatch({
        variables: {
          input: {
            loans: pendingLoans.map((loan) => ({
              tempId: loan.tempId,
              requestedAmount: loan.requestedAmount,
              amountGived: loan.amountGived,
              loantypeId: loan.loantypeId,
              comissionAmount: loan.comissionAmount,
              previousLoanId: loan.previousLoanId,
              borrowerId: loan.borrowerId,
              newBorrower: loan.newBorrower,
              collateralIds: loan.collateralIds.length > 0 ? loan.collateralIds : undefined,
              newCollateral: loan.newCollateral,
              firstPayment: loan.firstPayment,
              isFromDifferentLocation: loan.isFromDifferentLocation,
            })),
            sourceAccountId: defaultAccount.id,
            signDate: selectedDate.toISOString(),
            leadId,
            grantorId,
          },
        },
      })

      toast({
        title: 'Créditos guardados',
        description: `Se guardaron ${pendingLoans.length} créditos correctamente`,
      })

      clearPendingLoans()
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudieron guardar los créditos'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg md:text-xl">Registrar Créditos</DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            Agrega los créditos a otorgar y guárdalos todos de una vez
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Left side: Form to add loans */}
          <div className="space-y-4 md:space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base md:text-lg">
                {editingLoanId ? 'Editar crédito' : 'Agregar crédito'}
              </h3>
              {editingLoanId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="h-8 text-xs"
                >
                  Cancelar edición
                </Button>
              )}
            </div>

            {/* Client selector - shows both new clients and clients with active loans for renewal */}
            <div className="space-y-2">
              <Label>Cliente</Label>
              <UnifiedClientAutocomplete
                mode="borrower"
                value={selectedBorrower}
                onValueChange={handleBorrowerChange}
                leadId={leadId}
                locationId={locationId}
                activeLoansForRenewal={loansForRenewal}
                placeholder="Buscar cliente o renovar préstamo..."
                allowCreate
                allowEdit
              />
              {isBorrowerFromDifferentLocation && (
                <LocationWarning
                  type="borrower"
                  locationName={selectedBorrower?.locationName}
                />
              )}
            </div>

            {/* Renewal summary - compact inline version */}
            {isRenewal && selectedActiveLoan && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
                <RefreshCw className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0 flex items-center gap-4 text-sm">
                  <span className="text-green-700 dark:text-green-400 font-medium">Renovación</span>
                  <span className="text-muted-foreground">
                    Pagado: <span className="text-green-600">{formatCurrency(parseFloat(selectedActiveLoan.totalPaid || '0'))}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Deuda: <span className="text-destructive font-medium">{formatCurrency(renewalPendingAmount)}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Loan type, amount and commission in one row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Tipo de préstamo</Label>
                <Select value={selectedLoanTypeId} onValueChange={setSelectedLoanTypeId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loanTypes.map((lt) => (
                      <SelectItem key={lt.id} value={lt.id} className="py-2">
                        {lt.name} ({lt.weekDuration}sem, {lt.rate}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Monto solicitado</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Comisión</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={comissionAmount}
                  onChange={(e) => setComissionAmount(e.target.value)}
                  placeholder="0"
                  className="h-10"
                />
              </div>
            </div>

            {/* Calculation summary - always show if we have amount and type */}
            {requestedAmount && calculatedWeeklyPayment > 0 && (
              <div className="p-2.5 rounded-lg bg-muted/50 space-y-1.5 text-sm">
                {isRenewal && renewalPendingAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">A entregar:</span>
                    <span className="font-semibold text-primary">{formatCurrency(calculatedAmountGived)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pago semanal:</span>
                  <span className="font-medium">{formatCurrency(calculatedWeeklyPayment)}</span>
                </div>
              </div>
            )}

            {/* Aval selector */}
            <div className="space-y-1.5">
              <Label className="text-sm">Aval (opcional)</Label>
              <UnifiedClientAutocomplete
                mode="aval"
                value={selectedAval}
                onValueChange={setSelectedAval}
                excludeBorrowerId={selectedBorrower?.id}
                locationId={locationId}
                placeholder="Buscar aval..."
                allowCreate
                allowEdit
              />
              {isAvalFromDifferentLocation && (
                <LocationWarning
                  type="aval"
                  locationName={selectedAval?.locationName}
                />
              )}
            </div>

            {/* First payment - inline toggle */}
            <div className="flex items-center gap-3">
              <Switch
                checked={includeFirstPayment}
                onCheckedChange={setIncludeFirstPayment}
              />
              <Label className="text-sm flex-shrink-0">Primer pago</Label>
              {includeFirstPayment && (
                <Input
                  type="number"
                  inputMode="decimal"
                  value={firstPaymentAmount}
                  onChange={(e) => setFirstPaymentAmount(e.target.value)}
                  placeholder="Monto"
                  className="h-9 flex-1"
                />
              )}
            </div>

            <Button onClick={handleAddLoan} className="w-full h-11">
              {editingLoanId ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Actualizar crédito
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar al listado
                </>
              )}
            </Button>
          </div>

          {/* Right side: Pending loans list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base md:text-lg">
                Créditos pendientes ({pendingLoans.length})
              </h3>
              <Badge variant="secondary" className="text-base md:text-lg py-1 px-3">
                Total: {formatCurrency(totals.totalAmount)}
              </Badge>
            </div>

            {/* Global commission control */}
            {pendingLoans.length > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
                <Label className="text-xs whitespace-nowrap">Comisión global:</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={globalComissionAmount}
                  onChange={(e) => setGlobalComissionAmount(e.target.value)}
                  placeholder="0"
                  className="h-8 w-20 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    if (globalComissionAmount) {
                      pendingLoans.forEach((loan) => {
                        // Only apply to loans with commission > 0
                        if (parseFloat(loan.comissionAmount) > 0) {
                          updatePendingLoan(loan.tempId, {
                            ...loan,
                            comissionAmount: globalComissionAmount,
                          })
                        }
                      })
                      toast({
                        title: 'Comisión actualizada',
                        description: 'Se aplicó la comisión a todos los créditos con comisión',
                      })
                    }
                  }}
                  disabled={!globalComissionAmount}
                >
                  Aplicar
                </Button>
              </div>
            )}

            <ScrollArea className="h-[250px] md:h-[300px]">
              <div className="space-y-2 p-0.5">
                {pendingLoans.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay créditos pendientes
                  </div>
                ) : (
                  pendingLoans.map((loan) => (
                    <Card
                      key={loan.tempId}
                      className={`relative touch-manipulation cursor-pointer transition-all ${
                        editingLoanId === loan.tempId
                          ? 'border-2 border-primary bg-primary/5 shadow-sm'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleEditLoan(loan)}
                    >
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <User className="h-4 w-4 flex-shrink-0" />
                              <span className="font-medium text-sm md:text-base truncate">{loan.borrowerName}</span>
                              {loan.isFromDifferentLocation && (
                                <MapPin className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                              )}
                              {loan.isRenewal && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Renovación
                                </Badge>
                              )}
                              {editingLoanId === loan.tempId && (
                                <Badge variant="default" className="text-xs flex-shrink-0">
                                  Editando
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {loan.loantypeName} - {loan.weekDuration} sem
                            </div>
                            <div className="flex items-center gap-1 text-sm md:text-base font-medium">
                              <DollarSign className="h-3.5 w-3.5" />
                              {formatCurrency(parseFloat(loan.amountGived))}
                            </div>
                            {loan.comissionAmount && parseFloat(loan.comissionAmount) > 0 && (
                              <div className="text-xs md:text-sm text-muted-foreground">
                                Comisión: {formatCurrency(parseFloat(loan.comissionAmount))}
                              </div>
                            )}
                            {loan.collateralName && (
                              <div className="text-xs md:text-sm text-muted-foreground">
                                Aval: {loan.collateralName}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 md:h-11 md:w-11 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              removePendingLoan(loan.tempId)
                              if (editingLoanId === loan.tempId) {
                                resetForm()
                              }
                            }}
                          >
                            <Trash2 className="h-5 w-5 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Account info (auto-selected) */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{defaultAccount?.name || 'Sin cuenta'}</p>
                    <p className="text-xs text-muted-foreground">Cuenta origen</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(accountBalance)}</p>
                  <p className="text-xs text-muted-foreground">Saldo disponible</p>
                </div>
              </div>
              {hasInsufficientFunds && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Fondos insuficientes. Se necesitan {formatCurrency(totals.totalAmount)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-11 md:h-12 text-base"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={saving || pendingLoans.length === 0 || hasInsufficientFunds}
            className="w-full sm:w-auto h-11 md:h-12 text-base"
          >
            {saving && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
            <Save className="h-5 w-5 mr-2" />
            Guardar Todos ({pendingLoans.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
