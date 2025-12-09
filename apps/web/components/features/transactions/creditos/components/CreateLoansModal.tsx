'use client'

import { useState, useMemo } from 'react'
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
    clearPendingLoans,
    totals,
    generateTempId,
  } = usePendingLoans()

  // Use the default cash account for the route (OFFICE_CASH_FUND)
  const defaultAccount = useMemo(() => {
    return accounts.find((a) => a.type === 'OFFICE_CASH_FUND') || accounts[0]
  }, [accounts])

  // Form state for adding a new loan
  const [selectedLoanTypeId, setSelectedLoanTypeId] = useState<string>('')
  const [requestedAmount, setRequestedAmount] = useState<string>('')
  const [selectedBorrower, setSelectedBorrower] = useState<UnifiedClientValue | null>(null)
  const [selectedAval, setSelectedAval] = useState<UnifiedClientValue | null>(null)
  const [includeFirstPayment, setIncludeFirstPayment] = useState(false)
  const [firstPaymentAmount, setFirstPaymentAmount] = useState<string>('')

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
  const calculatedWeeklyPayment = useMemo(() => {
    if (!selectedLoanType || !requestedAmount) return 0
    const amount = parseFloat(requestedAmount) || 0
    const rate = parseFloat(selectedLoanType.rate) || 0
    const totalDebt = amount * (1 + rate / 100)
    return totalDebt / selectedLoanType.weekDuration
  }, [selectedLoanType, requestedAmount])

  // Check if borrower is from different location
  const isBorrowerFromDifferentLocation = selectedBorrower && selectedBorrower.isFromCurrentLocation === false

  // Check if aval is from different location
  const isAvalFromDifferentLocation = selectedAval && selectedAval.isFromCurrentLocation === false

  // Account balance and validation
  const accountBalance = parseFloat(defaultAccount?.amount || '0')
  const hasInsufficientFunds = accountBalance < totals.totalAmount

  // Reset form
  const resetForm = () => {
    setSelectedLoanTypeId('')
    setRequestedAmount('')
    setSelectedBorrower(null)
    setSelectedAval(null)
    setIncludeFirstPayment(false)
    setFirstPaymentAmount('')
  }

  // Handle selecting a borrower - auto-fill if they have an active loan
  const handleBorrowerChange = (borrower: UnifiedClientValue | null) => {
    setSelectedBorrower(borrower)

    // If borrower has an active loan, pre-fill the form
    if (borrower?.activeLoan) {
      const activeLoan = borrower.activeLoan
      // Pre-fill requested amount with the previous loan's amount
      setRequestedAmount(activeLoan.requestedAmount)
      // Pre-fill aval if exists
      if (activeLoan.collaterals && activeLoan.collaterals.length > 0) {
        const collateral = activeLoan.collaterals[0]
        setSelectedAval({
          id: collateral.id,
          fullName: collateral.fullName,
          phone: collateral.phones?.[0]?.number,
          isFromCurrentLocation: true, // Assume same location
          clientState: 'existing',
          action: 'connect',
        })
      }
    } else {
      // Clear aval if borrower has no active loan
      setSelectedAval(null)
    }
  }

  // Add loan to pending list
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
      borrowerName = selectedBorrower.fullName
      borrowerPhone = selectedBorrower.phone
    }

    // Determine collateral/aval info
    let collateralIds: string[] = []
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
        collateralName = selectedAval.fullName
        collateralPhone = selectedAval.phone
      }
    }

    const newPendingLoan: PendingLoan = {
      tempId: generateTempId(),
      requestedAmount,
      amountGived: calculatedAmountGived.toString(), // For renewals: requestedAmount - pendingAmount
      loantypeId: selectedLoanTypeId,
      loantypeName: selectedLoanType?.name || '',
      weekDuration: selectedLoanType?.weekDuration || 0,
      previousLoanId: selectedActiveLoan?.id,
      borrowerId,
      borrowerName,
      borrowerPhone,
      newBorrower,
      collateralIds,
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

    addPendingLoan(newPendingLoan)
    resetForm()

    toast({
      title: 'Crédito agregado',
      description: `${newPendingLoan.borrowerName} - ${formatCurrency(calculatedAmountGived)} a entregar`,
    })
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
      onOpenChange(false)
      onSuccess()
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
            <h3 className="font-semibold text-base md:text-lg">Agregar crédito</h3>

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
              {/* Show renewal info card when client has active loan */}
              {selectedActiveLoan && (
                <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">Renovación</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tipo anterior</p>
                        <p className="font-medium">{selectedActiveLoan.loantype?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monto original</p>
                        <p className="font-medium">{formatCurrency(parseFloat(selectedActiveLoan.requestedAmount))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pagado</p>
                        <p className="font-medium text-green-600">{formatCurrency(parseFloat(selectedActiveLoan.totalPaid || '0'))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deuda pendiente</p>
                        <p className="font-medium text-destructive">{formatCurrency(renewalPendingAmount)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Loan type */}
            <div className="space-y-2">
              <Label className="text-sm md:text-base">Tipo de préstamo</Label>
              <Select value={selectedLoanTypeId} onValueChange={setSelectedLoanTypeId}>
                <SelectTrigger className="h-11 md:h-12 text-base">
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {loanTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id} className="py-3 text-base">
                      {lt.name} - {lt.weekDuration} semanas ({lt.rate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm md:text-base">Monto solicitado</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 h-11 md:h-12 text-base"
                />
              </div>

              {/* Show breakdown for renewals */}
              {isRenewal && requestedAmount && (
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monto solicitado:</span>
                    <span>{formatCurrency(parseFloat(requestedAmount) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deuda pendiente:</span>
                    <span className="text-destructive">- {formatCurrency(renewalPendingAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span className="flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      Monto a entregar:
                    </span>
                    <span className="text-primary">{formatCurrency(calculatedAmountGived)}</span>
                  </div>
                </div>
              )}

              {/* Weekly payment info */}
              {calculatedWeeklyPayment > 0 && (
                <p className="text-sm text-muted-foreground">
                  Pago semanal: {formatCurrency(calculatedWeeklyPayment)}
                </p>
              )}
            </div>

            {/* Aval selector */}
            <div className="space-y-2">
              <Label>Aval (opcional)</Label>
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

            {/* First payment */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 py-1">
                <Switch
                  checked={includeFirstPayment}
                  onCheckedChange={setIncludeFirstPayment}
                  className="scale-110"
                />
                <Label className="text-sm md:text-base">Incluir primer pago</Label>
              </div>
              {includeFirstPayment && (
                <Input
                  type="number"
                  inputMode="decimal"
                  value={firstPaymentAmount}
                  onChange={(e) => setFirstPaymentAmount(e.target.value)}
                  placeholder="Monto del primer pago"
                  className="h-11 md:h-12 text-base"
                />
              )}
            </div>

            <Button onClick={handleAddLoan} className="w-full h-12 md:h-14 text-base">
              <Plus className="h-5 w-5 mr-2" />
              Agregar al listado
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

            <ScrollArea className="h-[250px] md:h-[300px]">
              <div className="space-y-2">
                {pendingLoans.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay créditos pendientes
                  </div>
                ) : (
                  pendingLoans.map((loan) => (
                    <Card key={loan.tempId} className="relative touch-manipulation">
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
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {loan.loantypeName} - {loan.weekDuration} sem
                            </div>
                            <div className="flex items-center gap-1 text-sm md:text-base font-medium">
                              <DollarSign className="h-3.5 w-3.5" />
                              {formatCurrency(parseFloat(loan.amountGived))}
                            </div>
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
                            onClick={() => removePendingLoan(loan.tempId)}
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
