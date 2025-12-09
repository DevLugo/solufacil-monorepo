# Tab de Créditos - Documentación Técnica

## Descripción General

El tab de créditos permite a los usuarios registrar, editar y cancelar préstamos otorgados en una fecha y localidad específica. Soporta tanto préstamos nuevos como renovaciones de préstamos existentes.

## Arquitectura de Componentes

```
creditos/
├── index.tsx                 # Componente principal CreditosTab (orquestador)
├── types.ts                  # Interfaces TypeScript
├── hooks/
│   ├── index.ts              # Re-exports
│   ├── useCreditosQueries.ts # Queries de Apollo GraphQL
│   └── usePendingLoans.ts    # Estado de préstamos pendientes
└── components/
    ├── index.ts              # Re-exports
    ├── SummaryCards.tsx      # Tarjetas resumen (créditos, totales, ganancia, comisión)
    ├── AccountBalanceCard.tsx # Card con saldo de cuenta
    ├── LoansTable.tsx        # Tabla de préstamos con búsqueda
    ├── LoanTableRow.tsx      # Fila individual de préstamo
    ├── CancelLoanDialog.tsx  # Diálogo de confirmación de cancelación
    ├── EditLoanModal.tsx     # Modal para editar préstamos
    ├── LocationWarning.tsx   # Alerta de localidad diferente
    ├── CreateLoansModal/     # Modal para crear préstamos (carpeta)
    │   ├── index.tsx         # Componente principal orquestador
    │   ├── types.ts          # Tipos del modal
    │   ├── AccountBalanceInfo.tsx      # Info de saldo de cuenta
    │   ├── FirstPaymentControl.tsx     # Control de primer pago
    │   ├── GlobalCommissionControl.tsx # Control de comisión global
    │   ├── LoanCalculationSummary.tsx  # Resumen de cálculos
    │   ├── LoanTypeAmountFields.tsx    # Campos de tipo y monto
    │   ├── PendingLoanCard.tsx         # Card de préstamo pendiente
    │   └── RenewalSummaryInline.tsx    # Resumen de renovación
    └── UnifiedClientAutocomplete/      # Autocomplete de clientes (carpeta)
        ├── index.tsx         # Componente principal orquestador
        ├── types.ts          # Props e interfaces
        ├── ClientLoanBadges.tsx       # Badges de estado de préstamo
        ├── ClientSearchItem.tsx       # Item de búsqueda
        ├── EditClientForm.tsx         # Formulario de edición
        ├── NewClientForm.tsx          # Formulario de nuevo cliente
        ├── SelectedClientDisplay.tsx  # Visualización de cliente seleccionado
        └── hooks/
            └── useClientMutations.ts  # Mutations para clientes
```

## Flujos de Trabajo

### 1. Flujo Principal - Visualización de Créditos

```mermaid
flowchart TD
    A[Usuario selecciona Ruta y Localidad] --> B{Datos seleccionados?}
    B -- No --> C[Mostrar EmptyState]
    B -- Sí --> D[useCreditosQueries]
    D --> E[Cargar préstamos del día]
    D --> F[Cargar tipos de préstamo]
    D --> G[Cargar préstamos para renovación]
    D --> H[Cargar cuentas de la ruta]
    E & F & G & H --> I{Cargando?}
    I -- Sí --> J[Mostrar LoadingState]
    I -- No --> K[Mostrar tabla de créditos]
    K --> L[Filtrar por búsqueda]
    K --> M[Calcular totales]
```

### 2. Flujo de Creación de Créditos en Lote

```mermaid
flowchart TD
    A[Usuario abre CreateLoansModal] --> B[Buscar cliente]
    B --> C{Cliente existente?}
    C -- Sí --> D[Seleccionar cliente]
    C -- No --> E[Crear nuevo cliente]
    D --> F{Tiene préstamo activo?}
    F -- Sí --> G[Pre-llenar datos de renovación]
    F -- No --> H[Formulario vacío]
    E --> H
    G --> I[Seleccionar tipo de préstamo]
    H --> I
    I --> J[Ingresar monto solicitado]
    J --> K[Calcular monto a entregar]
    K --> L[Opcional: Agregar aval]
    L --> M[Opcional: Primer pago]
    M --> N[Agregar a lista pendiente]
    N --> O{Más préstamos?}
    O -- Sí --> B
    O -- No --> P[Guardar todos]
    P --> Q[createLoansInBatch mutation]
    Q --> R[Actualizar vista]
```

### 3. Flujo de Renovación de Préstamo

```mermaid
flowchart TD
    A[Cliente con préstamo activo] --> B[Mostrar en autocomplete]
    B --> C[Usuario selecciona cliente]
    C --> D[Cargar datos del préstamo activo]
    D --> E[Pre-llenar formulario]
    E --> F[Mostrar deuda pendiente]
    F --> G[Calcular monto a entregar]
    G --> H["amountGived = requestedAmount - pendingDebt"]
    H --> I[Usuario confirma]
    I --> J[Agregar a pendientes]
    J --> K[Al guardar: marcar préstamo anterior como RENOVATED]
```

### 4. Flujo de Edición de Préstamo

```mermaid
flowchart TD
    A[Usuario hace clic en editar] --> B[Abrir EditLoanModal]
    B --> C[Cargar datos actuales]
    C --> D[Usuario modifica campos]
    D --> E{Cambio de tipo?}
    E -- Sí --> F[Recalcular métricas]
    D --> G{Cambio de monto?}
    G -- Sí --> F
    D --> H{Cambio de aval?}
    H -- Sí --> I[Conectar/crear aval]
    F --> J[Guardar cambios]
    I --> J
    J --> K[updateLoanExtended mutation]
    K --> L[Actualizar vista]
```

### 5. Flujo de Cancelación de Préstamo

```mermaid
flowchart TD
    A[Usuario hace clic en cancelar] --> B[Mostrar AlertDialog]
    B --> C{Confirmar?}
    C -- No --> D[Cerrar diálogo]
    C -- Sí --> E[cancelLoanWithAccountRestore mutation]
    E --> F[Restaurar saldo a cuenta]
    E --> G[Eliminar pagos asociados]
    E --> H[Eliminar transacciones]
    E --> I[Marcar como CANCELLED]
    F & G & H & I --> J[Actualizar vista]
```

## Cálculos Financieros

### Métricas del Préstamo

```typescript
// Fórmula para calcular métricas
profitAmount = requestedAmount × rate
totalDebtAcquired = requestedAmount + profitAmount
expectedWeeklyPayment = totalDebtAcquired / weekDuration
```

### Renovación

```typescript
// En renovaciones, la deuda pendiente se descuenta del monto entregado
amountGived = requestedAmount - previousLoan.pendingAmountStored

// totalDebtAcquired NO incluye la deuda anterior
// Se calcula únicamente sobre el nuevo préstamo
totalDebtAcquired = requestedAmount + (requestedAmount × rate)
```

## API - LoanService

### createLoansInBatch

Crea múltiples préstamos en una transacción atómica.

**Pasos:**
1. Validar fondos suficientes en cuenta origen
2. Para cada préstamo:
   - Crear/conectar borrower
   - Crear/conectar aval (opcional)
   - Calcular métricas financieras
   - Si es renovación: marcar préstamo anterior como RENOVATED
   - Crear préstamo
   - Crear transacción EXPENSE
   - Si tiene primer pago: crear pago y transacción INCOME
3. Deducir total de cuenta origen

### updateLoanExtended

Actualiza un préstamo existente con recálculo de métricas.

**Campos actualizables:**
- Tipo de préstamo (recalcula métricas)
- Monto solicitado (recalcula métricas)
- Nombre/teléfono del cliente
- Aval (conectar existente o crear nuevo)
- Comisión

### cancelLoanWithAccountRestore

Cancela un préstamo y restaura el saldo a la cuenta.

**Pasos:**
1. Restaurar monto a la cuenta
2. Crear transacción de restauración
3. Eliminar pagos y sus transacciones
4. Eliminar transacciones del préstamo
5. Marcar préstamo como CANCELLED

## Estados del Préstamo

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: Crear préstamo
    ACTIVE --> FINISHED: Completar pagos
    ACTIVE --> RENOVATED: Renovar
    ACTIVE --> CANCELLED: Cancelar
    FINISHED --> [*]
    RENOVATED --> [*]
    CANCELLED --> [*]
```

## Componente UnifiedClientAutocomplete

### Modos de Operación

| Modo | Descripción | Query utilizada |
|------|-------------|-----------------|
| `borrower` | Buscar/crear clientes | `SEARCH_BORROWERS_QUERY` |
| `aval` | Buscar/crear avales | `SEARCH_PERSONAL_DATA_QUERY` |

### Estados del Cliente

```typescript
type ClientState = 'existing' | 'new' | 'edited' | 'renewed' | 'newClient'
type ClientAction = 'connect' | 'create' | 'update' | 'clear'
```

### Funcionalidades

- Búsqueda con debounce (300ms)
- Priorización por localidad actual
- Indicador visual de clientes con deuda
- Edición inline de nombre/teléfono
- Creación de nuevos clientes
- Warning para clientes de otras localidades

## Control de Acceso

Las columnas de **Capital** y **Ganancia** en la tabla de créditos solo son visibles para usuarios con rol `ADMIN`.

```typescript
const { user } = useAuth()
const isAdmin = user?.role === 'ADMIN'

// En la tabla:
{isAdmin && (
  <>
    <TableHead>Capital</TableHead>
    <TableHead>Ganancia</TableHead>
  </>
)}
```

## Queries GraphQL

### LOANS_BY_DATE_LEAD_QUERY
Obtiene préstamos otorgados en una fecha específica para un lead.

### ACTIVE_LOANS_FOR_RENEWAL_QUERY
Obtiene préstamos activos disponibles para renovación.

### LOAN_TYPES_QUERY
Obtiene los tipos de préstamo disponibles.

### ACCOUNTS_QUERY
Obtiene las cuentas de efectivo de la ruta.

## Dependencias

- `@apollo/client` - GraphQL client
- `date-fns` - Manipulación de fechas
- `lucide-react` - Iconos
- `@/components/ui/*` - Componentes de UI (shadcn)
- `@/hooks/use-auth` - Autenticación
- `@/hooks/use-toast` - Notificaciones
