'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { format, startOfDay, endOfDay } from 'date-fns'
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
  AlertCircle,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useTransactionContext } from './transaction-context'
import { formatCurrency } from '@/lib/utils'
import { ACCOUNTS_QUERY, TRANSFERS_BY_DATE_QUERY } from '@/graphql/queries/transactions'
import { CREATE_TRANSACTION, TRANSFER_BETWEEN_ACCOUNTS } from '@/graphql/mutations/transactions'
import { useToast } from '@/hooks/use-toast'

interface Transfer {
  id: string
  amount: string
  date: string
  type: string
  sourceAccount: {
    id: string
    name: string
    type: string
  } | null
  destinationAccount: {
    id: string
    name: string
    type: string
  } | null
  route: {
    id: string
    name: string
  } | null
}

interface Account {
  id: string
  name: string
  type: string
  amount: string
  accountBalance: string
}

const accountTypeIcon: Record<string, typeof Wallet> = {
  BANK: Building2,
  EMPLOYEE_CASH_FUND: User,
  OFFICE_CASH_FUND: Wallet,
  PREPAID_GAS: Wallet,
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
  const { selectedRouteId, selectedDate, selectedLeadId } = useTransactionContext()
  const { toast } = useToast()

  // Form state
  const [isCapitalInvestment, setIsCapitalInvestment] = useState(false)
  const [sourceAccountId, setSourceAccountId] = useState<string>('')
  const [destinationAccountId, setDestinationAccountId] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // Query para obtener transfers del día
  const { data: transfersData, loading: transfersLoading, refetch } = useQuery(
    TRANSFERS_BY_DATE_QUERY,
    {
      variables: {
        fromDate: startOfDay(selectedDate).toISOString(),
        toDate: endOfDay(selectedDate).toISOString(),
        routeId: selectedRouteId,
      },
      skip: !selectedRouteId,
    }
  )

  // Query para obtener las cuentas de la ruta
  const { data: accountsData, loading: accountsLoading } = useQuery(ACCOUNTS_QUERY, {
    variables: { routeId: selectedRouteId },
    skip: !selectedRouteId,
  })

  // Mutation para crear transferencia o inversión
  const [createTransaction] = useMutation(CREATE_TRANSACTION)

  const transfers: Transfer[] = transfersData?.transactions?.edges?.map(
    (edge: { node: Transfer }) => edge.node
  ) || []

  const accounts: Account[] = accountsData?.accounts || []

  // Reset form when route changes
  useEffect(() => {
    setSourceAccountId('')
    setDestinationAccountId('')
    setAmount('')
    setDescription('')
  }, [selectedRouteId])

  // Reset source account when capital investment is toggled
  useEffect(() => {
    if (isCapitalInvestment) {
      setSourceAccountId('')
    }
  }, [isCapitalInvestment])

  // Get source account data
  const sourceAccount = useMemo(() => {
    return accounts.find((acc) => acc.id === sourceAccountId)
  }, [accounts, sourceAccountId])

  // Available balance from source account
  const availableBalance = sourceAccount
    ? parseFloat(sourceAccount.amount || '0')
    : 0

  // Validate amount against available balance (only for transfers)
  const isAmountValid = useMemo(() => {
    if (isCapitalInvestment) return true
    if (!amount) return true
    return parseFloat(amount) <= availableBalance
  }, [amount, availableBalance, isCapitalInvestment])

  // Filter destination accounts
  const destinationOptions = useMemo(() => {
    if (sourceAccountId) {
      return accounts.filter((acc) => acc.id !== sourceAccountId)
    }
    return accounts
  }, [accounts, sourceAccountId])

  // Form validation
  const isFormValid = useMemo(() => {
    if (!selectedRouteId) return false
    if (!destinationAccountId) return false
    if (!amount || parseFloat(amount) <= 0) return false
    if (!isCapitalInvestment && !sourceAccountId) return false
    if (!isCapitalInvestment && !isAmountValid) return false
    return true
  }, [selectedRouteId, destinationAccountId, amount, isCapitalInvestment, sourceAccountId, isAmountValid])

  // Handle transfer/investment submission
  const handleSubmit = async () => {
    if (!isFormValid || !selectedRouteId) return

    setIsSubmitting(true)

    try {
      const numericAmount = parseFloat(amount)

      if (isCapitalInvestment) {
        // Create capital investment (INCOME transaction)
        await createTransaction({
          variables: {
            input: {
              amount: numericAmount.toString(),
              date: selectedDate.toISOString(),
              type: 'INCOME',
              incomeSource: 'MONEY_INVESMENT',
              destinationAccountId,
              routeId: selectedRouteId,
              leadId: selectedLeadId || undefined,
            },
          },
        })

        toast({
          title: 'Inversión registrada',
          description: `Se registró una inversión de ${formatCurrency(numericAmount)}.`,
        })
      } else {
        // Create transfer between accounts
        await createTransaction({
          variables: {
            input: {
              amount: numericAmount.toString(),
              date: selectedDate.toISOString(),
              type: 'TRANSFER',
              sourceAccountId,
              destinationAccountId,
              routeId: selectedRouteId,
              leadId: selectedLeadId || undefined,
            },
          },
        })

        toast({
          title: 'Transferencia registrada',
          description: `Se transfirió ${formatCurrency(numericAmount)} entre cuentas.`,
        })
      }

      // Reset form
      setSourceAccountId('')
      setDestinationAccountId('')
      setAmount('')
      setDescription('')
      setShowSuccessDialog(true)

      // Refetch transfers
      refetch()
    } catch (error) {
      console.error('Error al crear transacción:', error)
      toast({
        title: 'Error',
        description: 'No se pudo completar la operación. Intenta de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate totals
  const totalTransfers = transfers.reduce(
    (sum, t) => sum + parseFloat(t.amount || '0'),
    0
  )

  if (!selectedRouteId) {
    return <EmptyState />
  }

  if (accountsLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      {/* Account Balances */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {accounts.map((account) => {
          const Icon = accountTypeIcon[account.type] || Wallet
          return (
            <Card key={account.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground truncate">{account.name}</p>
                    <p className="text-xl font-bold">{formatCurrency(parseFloat(account.amount || '0'))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Transfer Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isCapitalInvestment ? 'Inversión de Capital' : 'Transferencia entre Cuentas'}
          </CardTitle>
          <CardDescription>
            {isCapitalInvestment
              ? 'Registra una inversión de capital externo al sistema'
              : 'Transfiere fondos entre las cuentas de la ruta'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Capital Investment Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="capital-investment"
              checked={isCapitalInvestment}
              onCheckedChange={(checked) => setIsCapitalInvestment(checked === true)}
              disabled={isSubmitting}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="capital-investment" className="cursor-pointer">
                Inversión de Capital
              </Label>
              <p className="text-sm text-muted-foreground">
                El dinero ingresa al sistema desde una fuente externa
              </p>
            </div>
          </div>

          <div className={`grid gap-4 ${isCapitalInvestment ? 'md:grid-cols-2' : 'md:grid-cols-2'}`}>
            {/* Source Account (only for transfers) */}
            {!isCapitalInvestment && (
              <div className="space-y-2">
                <Label>Cuenta de Origen</Label>
                <Select
                  value={sourceAccountId}
                  onValueChange={(value) => {
                    setSourceAccountId(value)
                    if (value === destinationAccountId) {
                      setDestinationAccountId('')
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({formatCurrency(parseFloat(account.amount))})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Destination Account */}
            <div className="space-y-2">
              <Label>Cuenta de Destino</Label>
              <Select
                value={destinationAccountId}
                onValueChange={setDestinationAccountId}
                disabled={(!sourceAccountId && !isCapitalInvestment) || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta destino" />
                </SelectTrigger>
                <SelectContent>
                  {destinationOptions.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(parseFloat(account.amount))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Amount */}
            <div className="space-y-2">
              <Label>
                {isCapitalInvestment ? 'Monto de Inversión' : 'Monto a Transferir'}
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={(!sourceAccountId && !isCapitalInvestment) || !destinationAccountId || isSubmitting}
                className={!isAmountValid ? 'border-destructive' : ''}
              />
              {!isCapitalInvestment && sourceAccount && (
                <p className="text-sm text-muted-foreground">
                  Saldo disponible: {formatCurrency(availableBalance)}
                </p>
              )}
              {!isAmountValid && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Monto excede el saldo disponible
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Descripción (Opcional)</Label>
              <Input
                placeholder={isCapitalInvestment ? 'Descripción de la inversión' : 'Descripción de la transferencia'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isCapitalInvestment ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isSubmitting
                ? 'Procesando...'
                : isCapitalInvestment
                ? 'Realizar Inversión'
                : 'Realizar Transferencia'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transfers List */}
      <Card>
        <CardHeader>
          <CardTitle>Transferencias del Día</CardTitle>
          <CardDescription>
            {transfers.length} transferencias • {format(selectedDate, "d 'de' MMMM", { locale: es })}
            {transfers.length > 0 && ` • Total: ${formatCurrency(totalTransfers)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transfersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ArrowRight className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay transferencias registradas para esta fecha</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origen</TableHead>
                  <TableHead></TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => {
                  const SourceIcon = transfer.sourceAccount
                    ? accountTypeIcon[transfer.sourceAccount.type] || Wallet
                    : TrendingUp
                  const DestIcon = transfer.destinationAccount
                    ? accountTypeIcon[transfer.destinationAccount.type] || Wallet
                    : Wallet

                  return (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <SourceIcon className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {transfer.sourceAccount?.name || 'Inversión Externa'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DestIcon className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {transfer.destinationAccount?.name || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(parseFloat(transfer.amount))}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-success" />
              {isCapitalInvestment ? 'Inversión Completada' : 'Transferencia Completada'}
            </DialogTitle>
            <DialogDescription>
              {isCapitalInvestment
                ? 'La inversión de capital se ha registrado correctamente.'
                : 'La transferencia se ha realizado correctamente.'}
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
