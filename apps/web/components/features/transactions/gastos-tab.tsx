'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { format, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus,
  Loader2,
  Trash2,
  MapPin,
  Fuel,
  Banknote,
  Car,
  Coffee,
  Home,
  MoreHorizontal,
  Save,
  Receipt,
  Briefcase,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useTransactionContext } from './transaction-context'
import { EXPENSES_BY_DATE_QUERY, ACCOUNTS_QUERY } from '@/graphql/queries/transactions'
import { CREATE_TRANSACTION } from '@/graphql/mutations/transactions'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// Tipos de gasto disponibles
const EXPENSE_TYPES = [
  { value: 'VIATIC', label: 'Viáticos', icon: Coffee },
  { value: 'GASOLINE', label: 'Gasolina', icon: Fuel },
  { value: 'ACCOMMODATION', label: 'Hospedaje', icon: Home },
  { value: 'NOMINA_SALARY', label: 'Nómina', icon: Banknote },
  { value: 'EXTERNAL_SALARY', label: 'Salario Externo', icon: Banknote },
  { value: 'VEHICULE_MAINTENANCE', label: 'Mantenimiento Vehículo', icon: Car },
  { value: 'LEAD_EXPENSE', label: 'Gasto de Líder', icon: Briefcase },
  { value: 'LAVADO_DE_AUTO', label: 'Lavado de Auto', icon: Car },
  { value: 'CASETA', label: 'Caseta', icon: CreditCard },
  { value: 'PAPELERIA', label: 'Papelería', icon: Receipt },
  { value: 'HOUSE_RENT', label: 'Renta', icon: Home },
  { value: 'CAR_PAYMENT', label: 'Pago de Auto', icon: Car },
  { value: 'OTRO', label: 'Otro', icon: Banknote },
]

interface Expense {
  id: string
  amount: string
  date: string
  type: string
  expenseSource: string | null
  sourceAccount: {
    id: string
    name: string
    type: string
  } | null
  route: {
    id: string
    name: string
  } | null
  lead: {
    id: string
    personalData: {
      fullName: string
    }
  } | null
}

interface Account {
  id: string
  name: string
  type: string
  amount: string
  accountBalance: string
}

interface NewExpense {
  amount: string
  expenseSource: string
  description: string
  sourceAccountId: string
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Selecciona una ruta</h3>
      <p className="text-muted-foreground max-w-sm">
        Selecciona una ruta para ver y registrar los gastos del día
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

export function GastosTab() {
  const { selectedRouteId, selectedDate, selectedLeadId } = useTransactionContext()
  const { toast } = useToast()

  const [newExpenses, setNewExpenses] = useState<NewExpense[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)

  // Query para obtener los gastos del día
  const { data: expensesData, loading: expensesLoading, refetch } = useQuery(
    EXPENSES_BY_DATE_QUERY,
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
  const { data: accountsData } = useQuery(ACCOUNTS_QUERY, {
    variables: { routeId: selectedRouteId },
    skip: !selectedRouteId,
  })

  // Mutation para crear transacciones
  const [createTransaction] = useMutation(CREATE_TRANSACTION)

  const expenses: Expense[] = expensesData?.transactions?.edges?.map(
    (edge: { node: Expense }) => edge.node
  ) || []

  const accounts: Account[] = accountsData?.accounts || []

  // Filtrar gastos por líder si está seleccionado
  const filteredExpenses = selectedLeadId
    ? expenses.filter((e) => e.lead?.id === selectedLeadId)
    : expenses

  // Calcular totales
  const totals = useMemo(() => {
    const existingTotal = filteredExpenses.reduce(
      (sum, e) => sum + parseFloat(e.amount || '0'),
      0
    )
    const newTotal = newExpenses.reduce(
      (sum, e) => sum + parseFloat(e.amount || '0'),
      0
    )
    return {
      existing: existingTotal,
      new: newTotal,
      total: existingTotal + newTotal,
    }
  }, [filteredExpenses, newExpenses])

  // Agregar nuevo gasto al formulario
  const handleAddExpense = () => {
    const defaultAccount = accounts.find((acc) => acc.type === 'EMPLOYEE_CASH_FUND')
    setNewExpenses([
      ...newExpenses,
      {
        amount: '',
        expenseSource: '',
        description: '',
        sourceAccountId: defaultAccount?.id || '',
      },
    ])
  }

  // Actualizar gasto pendiente
  const handleUpdateNewExpense = (
    index: number,
    field: keyof NewExpense,
    value: string
  ) => {
    const updated = [...newExpenses]
    updated[index] = { ...updated[index], [field]: value }

    // Si selecciona gasolina, auto-seleccionar cuenta TOKA/PREPAID_GAS
    if (field === 'expenseSource' && value === 'GASOLINE') {
      const tokaAccount = accounts.find(
        (acc) => acc.type === 'PREPAID_GAS' || acc.name.toLowerCase().includes('toka')
      )
      if (tokaAccount) {
        updated[index].sourceAccountId = tokaAccount.id
      }
    }

    setNewExpenses(updated)
  }

  // Eliminar gasto pendiente
  const handleRemoveNewExpense = (index: number) => {
    setNewExpenses(newExpenses.filter((_, i) => i !== index))
  }

  // Guardar todos los gastos nuevos
  const handleSaveAll = async () => {
    const validExpenses = newExpenses.filter(
      (e) => e.amount && parseFloat(e.amount) > 0 && e.expenseSource && e.sourceAccountId
    )

    if (validExpenses.length === 0) {
      toast({
        title: 'Sin gastos válidos',
        description: 'Agrega al menos un gasto con monto, tipo y cuenta.',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)

    try {
      for (const expense of validExpenses) {
        await createTransaction({
          variables: {
            input: {
              amount: expense.amount,
              date: selectedDate.toISOString(),
              type: 'EXPENSE',
              expenseSource: expense.expenseSource,
              sourceAccountId: expense.sourceAccountId,
              routeId: selectedRouteId,
              leadId: selectedLeadId || undefined,
            },
          },
        })
      }

      toast({
        title: 'Gastos guardados',
        description: `Se guardaron ${validExpenses.length} gasto(s) correctamente.`,
      })

      setNewExpenses([])
      refetch()
    } catch (error) {
      console.error('Error al guardar gastos:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los gastos. Intenta de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Obtener label del tipo de gasto
  const getExpenseTypeLabel = (value: string | null) => {
    const type = EXPENSE_TYPES.find((t) => t.value === value)
    return type?.label || value || 'Sin tipo'
  }

  // Obtener icono del tipo de gasto
  const getExpenseTypeIcon = (value: string | null) => {
    const type = EXPENSE_TYPES.find((t) => t.value === value)
    return type?.icon || Banknote
  }

  if (!selectedRouteId) {
    return <EmptyState />
  }

  if (expensesLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      {/* KPI Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg border">
        <Badge variant="outline" className="text-sm py-1 px-3">
          Gastos: {filteredExpenses.length + newExpenses.length}
        </Badge>
        <Badge variant="outline" className="text-sm py-1 px-3 bg-amber-50 text-amber-700 border-amber-200">
          Nuevos: {newExpenses.length}
        </Badge>
        <Badge variant="outline" className="text-sm py-1 px-3 bg-red-50 text-red-700 border-red-200">
          Total: {formatCurrency(totals.total)}
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddExpense}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar Gasto
          </Button>

          {newExpenses.length > 0 && (
            <Button
              size="sm"
              onClick={handleSaveAll}
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar cambios
            </Button>
          )}
        </div>
      </div>

      {/* Gastos existentes */}
      <Card>
        <CardHeader>
          <CardTitle>Gastos Registrados</CardTitle>
          <CardDescription>
            {filteredExpenses.length} gastos • {format(selectedDate, "d 'de' MMMM", { locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 && newExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Banknote className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay gastos registrados para esta fecha</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleAddExpense}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar primer gasto
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Líder</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Gastos existentes */}
                {filteredExpenses.map((expense) => {
                  const Icon = getExpenseTypeIcon(expense.expenseSource)
                  return (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{getExpenseTypeLabel(expense.expenseSource)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        -{formatCurrency(parseFloat(expense.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {expense.sourceAccount?.name || 'Sin cuenta'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {expense.lead?.personalData?.fullName || 'Sin líder'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {/* Gastos nuevos (pendientes de guardar) */}
                {newExpenses.map((expense, index) => (
                  <TableRow key={`new-${index}`} className="bg-amber-50/50 dark:bg-amber-950/20">
                    <TableCell>
                      <Select
                        value={expense.expenseSource}
                        onValueChange={(value) =>
                          handleUpdateNewExpense(index, 'expenseSource', value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Tipo de gasto" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0"
                        value={expense.amount}
                        onChange={(e) =>
                          handleUpdateNewExpense(index, 'amount', e.target.value)
                        }
                        className="w-[120px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={expense.sourceAccountId}
                        onValueChange={(value) =>
                          handleUpdateNewExpense(index, 'sourceAccountId', value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                        Pendiente
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveNewExpense(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Balance de cuentas */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saldos de Cuentas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <span className="text-sm text-muted-foreground truncate">
                    {account.name}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(parseFloat(account.amount))}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar gasto?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El saldo de la cuenta será restaurado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
