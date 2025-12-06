# Plan de Migración: Solufacil Keystone → Custom API (Spec-Driven Development)

## Objetivo
Migrar el sistema de gestión de microcréditos de Keystone 6 a una arquitectura custom con Apollo Server + GraphQL + Prisma, usando Spec-Driven Development.

**Prioridad**: API primero, luego Web (Next.js 15), Mobile (Flutter) al final.

---

## Repositorio Original (Referencia)

```
/Users/edu/Documents/development/node/solufacil-keystone
```

**IMPORTANTE**: Este repositorio contiene el código fuente original en Keystone 6 y debe usarse como **referencia obligatoria** durante toda la migración:

- **Resolvers/Mutations**: Replicar la lógica exacta de cada resolver de Keystone
- **Hooks de Keystone**: Migrar la lógica de `beforeOperation`, `afterOperation`, etc.
- **Cálculos de negocio**: Usar las fórmulas y algoritmos existentes (profit, pagos, comisiones)
- **Validaciones**: Mantener las mismas reglas de validación
- **Queries GraphQL**: Asegurar paridad funcional con las queries existentes
- **Frontend (Next.js)**: Replicar componentes, páginas y lógica de UI

**Flujo de trabajo recomendado**:
1. Antes de implementar cualquier función, **revisar primero** cómo está implementada en el repo original
2. Copiar/adaptar la lógica existente en lugar de reinventar
3. Validar que el comportamiento sea idéntico al original

---

## Decisiones Arquitectónicas

### Stack Tecnológico
- **Monorepo**: Turborepo (compartir código, caching inteligente)
- **API**: Apollo Server 4 + GraphQL + TypeScript
- **ORM**: Prisma 6 + PostgreSQL
- **Auth**: JWT stateless (access + refresh tokens)
- **Testing**: Vitest (unit tests para lógica crítica)
- **Node**: 20+ LTS
- **Package Manager**: pnpm (eficiente para monorepos)

### Estructura del Monorepo

```
solufacil/
├── apps/
│   ├── api/                       # Apollo Server
│   │   ├── src/
│   │   │   ├── server.ts         # Entry point
│   │   │   ├── schema/           # GraphQL schema definitions
│   │   │   ├── resolvers/        # GraphQL resolvers
│   │   │   ├── middleware/       # Auth, logging, error handling
│   │   │   ├── services/         # Business logic
│   │   │   └── repositories/     # Data access layer
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                       # Next.js 15 (Fase posterior)
├── packages/
│   ├── database/                  # Prisma schema + client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── client.ts         # Prisma client singleton
│   │   │   └── seed.ts           # Seed data
│   │   └── package.json
│   ├── graphql-schema/            # GraphQL schema + codegen
│   │   ├── src/
│   │   │   ├── schema.graphql    # Schema SDL
│   │   │   └── scalars.ts        # Custom scalars
│   │   ├── codegen.ts            # GraphQL Code Generator config
│   │   └── package.json
│   ├── business-logic/            # Core business logic
│   │   ├── src/
│   │   │   ├── calculations/     # Profit, payment calculations
│   │   │   ├── validators/       # Business rules validation
│   │   │   ├── transactions/     # Transaction management
│   │   │   └── snapshots/        # Historical snapshots
│   │   ├── tests/
│   │   └── package.json
│   └── shared/                    # Shared utilities
│       ├── src/
│       │   ├── types/            # Common types
│       │   ├── constants/        # Constants
│       │   └── utils/            # Helpers
│       └── package.json
├── turbo.json                     # Turborepo config
├── package.json                   # Root package
└── pnpm-workspace.yaml
```

---

## FASE 1: ESPECIFICACIONES

### 1.1 Especificación GraphQL Schema

#### Custom Scalars

```graphql
scalar DateTime
scalar Decimal
scalar JSON
```

#### Enums Core

```graphql
enum UserRole {
  ADMIN
  NORMAL
  CAPTURA
}

enum EmployeeType {
  ROUTE_LEAD      # Líder de ruta
  LEAD            # Vendedor
  ROUTE_ASSISTENT # Asistente
}

enum LoanStatus {
  ACTIVE
  FINISHED
  RENOVATED
  CANCELLED
}

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
  INVESTMENT
}

enum PaymentMethod {
  CASH
  MONEY_TRANSFER
}

enum DocumentType {
  INE
  DOMICILIO
  PAGARE
  OTRO
}

enum AccountType {
  BANK
  OFFICE_CASH_FUND
  EMPLOYEE_CASH_FUND
  PREPAID_GAS
  TRAVEL_EXPENSES
}
```

#### Types Principales

```graphql
type User {
  id: ID!
  email: String!
  role: UserRole!
  employee: Employee
  createdAt: DateTime!
  updatedAt: DateTime!
}

type PersonalData {
  id: ID!
  fullName: String!
  clientCode: String!        # 6 caracteres alfanuméricos únicos
  birthDate: DateTime
  phones: [Phone!]!
  addresses: [Address!]!
  employee: Employee
  borrower: Borrower
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Phone {
  id: ID!
  number: String!
  personalData: PersonalData!
}

type Address {
  id: ID!
  street: String!
  numberInterior: String
  numberExterior: String
  zipCode: String
  location: Location!
  personalData: PersonalData!
}

type Employee {
  id: ID!
  type: EmployeeType!
  personalData: PersonalData!
  routes: [Route!]!
  loansGranted: [Loan!]!      # Como otorgante
  loansManagedAsLead: [Loan!]! # Como líder
  transactions: [Transaction!]!
  commissionPayments: [CommissionPayment!]!
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Borrower {
  id: ID!
  personalData: PersonalData!
  loans: [Loan!]!
  loanFinishedCount: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Loantype {
  id: ID!
  name: String!
  weekDuration: Int!           # Duración en semanas
  rate: Decimal!               # Tasa de ganancia (ej: 0.20 = 20%)
  interestRate: Decimal!
  loanPaymentComission: Decimal!
  loanGrantedComission: Decimal!
  maxAmount: Decimal
  maxTerm: Int
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Loan {
  id: ID!
  requestedAmount: Decimal!
  amountGived: Decimal!
  signDate: DateTime!          # Fecha de desembolso
  finishedDate: DateTime
  badDebtDate: DateTime        # Si es crédito malo
  isDeceased: Boolean!

  # Calculados
  profitAmount: Decimal!
  totalDebtAcquired: Decimal!  # requestedAmount + profitAmount
  expectedWeeklyPayment: Decimal!
  totalPaid: Decimal!
  pendingAmountStored: Decimal!
  comissionAmount: Decimal!

  status: LoanStatus!

  # Relaciones
  borrower: Borrower!
  loantype: Loantype!
  grantor: Employee!           # Quien otorgó
  lead: Employee!              # Líder responsable
  collaterals: [PersonalData!]! # Avalistas
  payments: [LoanPayment!]!
  transactions: [Transaction!]!
  documentPhotos: [DocumentPhoto!]!

  # Snapshot histórico
  snapshotLeadId: String
  snapshotLeadName: String
  snapshotLeadAssignedAt: DateTime
  snapshotRouteId: String
  snapshotRouteName: String

  # Renovación
  previousLoan: Loan
  renewedBy: Loan

  createdAt: DateTime!
  updatedAt: DateTime!
}

type LoanPayment {
  id: ID!
  amount: Decimal!
  comission: Decimal!
  receivedAt: DateTime!
  paymentMethod: PaymentMethod!
  type: String!                # PAYMENT | EXTRA_COLLECTION

  loan: Loan!
  leadPaymentReceived: LeadPaymentReceived
  transactions: [Transaction!]!

  createdAt: DateTime!
  updatedAt: DateTime!
}

type Transaction {
  id: ID!
  amount: Decimal!
  date: DateTime!
  type: TransactionType!

  # Específicos por tipo
  incomeSource: String
  expenseSource: String

  profitAmount: Decimal        # Ganancia del pago (si es INCOME)
  returnToCapital: Decimal     # Retorno a capital (si es INCOME)

  # Relaciones
  loan: Loan
  loanPayment: LoanPayment
  sourceAccount: Account!      # Cuenta origen
  destinationAccount: Account  # Cuenta destino (si es TRANSFER)
  route: Route
  lead: Employee

  createdAt: DateTime!
  updatedAt: DateTime!
}

type Account {
  id: ID!
  name: String!
  type: AccountType!
  amount: Decimal!             # Saldo almacenado
  accountBalance: Decimal!     # Calculado dinámicamente

  routes: [Route!]!
  transactionsSource: [Transaction!]!
  transactionsDestination: [Transaction!]!

  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Route {
  id: ID!
  name: String!

  employees: [Employee!]!
  accounts: [Account!]!
  transactions: [Transaction!]!
  locations: [Location!]!

  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Location {
  id: ID!
  name: String!
  route: Route!
  municipality: Municipality!
  addresses: [Address!]!
}

type Municipality {
  id: ID!
  name: String!
  state: State!
  locations: [Location!]!
}

type State {
  id: ID!
  name: String!
  municipalities: [Municipality!]!
}

type DocumentPhoto {
  id: ID!
  title: String
  description: String
  photoUrl: String!            # URL Cloudinary
  publicId: String!            # Cloudinary public ID
  documentType: DocumentType!
  isError: Boolean!
  errorDescription: String
  isMissing: Boolean!

  personalData: PersonalData
  loan: Loan
  uploadedBy: User!

  createdAt: DateTime!
  updatedAt: DateTime!
}

type CommissionPayment {
  id: ID!
  amount: Decimal!
  employee: Employee!
  loan: Loan!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type LeadPaymentReceived {
  id: ID!
  expectedAmount: Decimal!
  paidAmount: Decimal!
  cashPaidAmount: Decimal!
  bankPaidAmount: Decimal!
  falcoAmount: Decimal!
  paymentStatus: String!       # COMPLETE | PARTIAL

  lead: Employee!
  agent: Employee!
  payments: [LoanPayment!]!

  createdAt: DateTime!
  updatedAt: DateTime!
}
```

#### Queries Principales

```graphql
type Query {
  # Auth
  me: User

  # Users & Employees
  user(id: ID!): User
  users(role: UserRole, limit: Int, offset: Int): [User!]!
  employee(id: ID!): Employee
  employees(type: EmployeeType, routeId: ID, isActive: Boolean): [Employee!]!

  # Loans
  loan(id: ID!): Loan
  loans(
    status: LoanStatus
    routeId: ID
    leadId: ID
    borrowerId: ID
    fromDate: DateTime
    toDate: DateTime
    limit: Int
    offset: Int
  ): LoanConnection!

  # Payments
  loanPayments(loanId: ID!, limit: Int, offset: Int): [LoanPayment!]!

  # Transactions
  transactions(
    type: TransactionType
    routeId: ID
    accountId: ID
    fromDate: DateTime
    toDate: DateTime
    limit: Int
    offset: Int
  ): TransactionConnection!

  # Accounts
  account(id: ID!): Account
  accounts(routeId: ID, type: AccountType): [Account!]!

  # Routes & Geography
  route(id: ID!): Route
  routes(isActive: Boolean): [Route!]!
  locations(routeId: ID): [Location!]!

  # Loan types
  loantype(id: ID!): Loantype
  loantypes(isActive: Boolean): [Loantype!]!

  # Reports (Custom resolvers)
  financialReport(routeIds: [ID!]!, year: Int!, month: Int!): FinancialReport!
  badDebtByMonth(year: Int!, month: Int!): [BadDebtData!]!
  badDebtSummary: BadDebtSummary!
  loansForBadDebt(routeId: ID): [Loan!]!

  # Documents
  documentPhotos(loanId: ID, hasErrors: Boolean): [DocumentPhoto!]!
}

type LoanConnection {
  edges: [LoanEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type LoanEdge {
  node: Loan!
  cursor: String!
}

type TransactionConnection {
  edges: [TransactionEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type TransactionEdge {
  node: Transaction!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# Tipos de reportes
type FinancialReport {
  summary: FinancialSummary!
  weeklyData: [WeeklyData!]!
  comparisonData: ComparisonData
  performanceMetrics: PerformanceMetrics!
}

type FinancialSummary {
  activeLoans: Int!
  totalPortfolio: Decimal!
  totalPaid: Decimal!
  pendingAmount: Decimal!
  averagePayment: Decimal!
}

type WeeklyData {
  week: Int!
  date: DateTime!
  loansGranted: Int!
  paymentsReceived: Decimal!
  expectedPayments: Decimal!
  recoveryRate: Decimal!
}

type ComparisonData {
  previousMonth: FinancialSummary!
  growth: Decimal!
  trend: String!
}

type PerformanceMetrics {
  recoveryRate: Decimal!
  averageTicket: Decimal!
  activeLoansCount: Int!
  finishedLoansCount: Int!
}

type BadDebtData {
  routeId: ID!
  routeName: String!
  loanCount: Int!
  totalAmount: Decimal!
}

type BadDebtSummary {
  totalLoans: Int!
  totalAmount: Decimal!
  byRoute: [BadDebtData!]!
}
```

#### Mutations Principales

```graphql
type Mutation {
  # Auth
  login(email: String!, password: String!): AuthPayload!
  refreshToken(refreshToken: String!): AuthPayload!
  logout: Boolean!

  # Users
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
  changePassword(oldPassword: String!, newPassword: String!): Boolean!

  # Employees
  createEmployee(input: CreateEmployeeInput!): Employee!
  updateEmployee(id: ID!, input: UpdateEmployeeInput!): Employee!
  promoteToLead(employeeId: ID!): Employee!

  # Borrowers
  createBorrower(input: CreateBorrowerInput!): Borrower!
  updateBorrower(id: ID!, input: UpdateBorrowerInput!): Borrower!

  # Loans
  createLoan(input: CreateLoanInput!): Loan!
  updateLoan(id: ID!, input: UpdateLoanInput!): Loan!
  renewLoan(loanId: ID!, input: RenewLoanInput!): Loan!
  markLoanAsBadDebt(loanId: ID!, badDebtDate: DateTime!): Loan!
  finishLoan(loanId: ID!): Loan!
  cancelLoan(id: ID!): Loan!

  # Payments
  createLoanPayment(input: CreateLoanPaymentInput!): LoanPayment!
  createLeadPaymentReceived(input: CreateLeadPaymentReceivedInput!): LeadPaymentReceived!

  # Accounts
  createAccount(input: CreateAccountInput!): Account!
  updateAccount(id: ID!, input: UpdateAccountInput!): Account!

  # Transactions
  createTransaction(input: CreateTransactionInput!): Transaction!
  transferBetweenAccounts(input: TransferInput!): Transaction!

  # Routes
  createRoute(input: CreateRouteInput!): Route!
  updateRoute(id: ID!, input: UpdateRouteInput!): Route!

  # Loan types
  createLoantype(input: CreateLoantypeInput!): Loantype!
  updateLoantype(id: ID!, input: UpdateLoantypeInput!): Loantype!

  # Documents
  uploadDocumentPhoto(input: UploadDocumentInput!): DocumentPhoto!
  updateDocumentPhoto(id: ID!, input: UpdateDocumentInput!): DocumentPhoto!
  deleteDocumentPhoto(id: ID!): Boolean!
}

# Auth
type AuthPayload {
  accessToken: String!
  refreshToken: String!
  user: User!
}

# Input Types (ejemplos principales)
input CreateUserInput {
  email: String!
  password: String!
  role: UserRole!
}

input UpdateUserInput {
  email: String
  role: UserRole
}

input CreateEmployeeInput {
  type: EmployeeType!
  personalData: CreatePersonalDataInput!
  routeIds: [ID!]
}

input UpdateEmployeeInput {
  type: EmployeeType
  isActive: Boolean
  routeIds: [ID!]
}

input CreatePersonalDataInput {
  fullName: String!
  clientCode: String
  birthDate: DateTime
  phones: [CreatePhoneInput!]
  addresses: [CreateAddressInput!]
}

input CreatePhoneInput {
  number: String!
}

input CreateAddressInput {
  street: String!
  numberInterior: String
  numberExterior: String
  zipCode: String
  locationId: ID!
}

input CreateBorrowerInput {
  personalData: CreatePersonalDataInput!
}

input UpdateBorrowerInput {
  personalData: UpdatePersonalDataInput
}

input UpdatePersonalDataInput {
  fullName: String
  birthDate: DateTime
}

input CreateLoanInput {
  requestedAmount: Decimal!
  amountGived: Decimal!
  signDate: DateTime!
  borrowerId: ID!
  loantypeId: ID!
  grantorId: ID!
  leadId: ID!
  collateralIds: [ID!]
  previousLoanId: ID
}

input UpdateLoanInput {
  amountGived: Decimal
  badDebtDate: DateTime
  isDeceased: Boolean
  leadId: ID
  status: LoanStatus
}

input RenewLoanInput {
  requestedAmount: Decimal!
  amountGived: Decimal!
  signDate: DateTime!
  loantypeId: ID!
}

input CreateLoanPaymentInput {
  loanId: ID!
  amount: Decimal!
  comission: Decimal
  receivedAt: DateTime!
  paymentMethod: PaymentMethod!
}

input CreateLeadPaymentReceivedInput {
  leadId: ID!
  agentId: ID!
  expectedAmount: Decimal!
  paidAmount: Decimal!
  cashPaidAmount: Decimal!
  bankPaidAmount: Decimal!
  falcoAmount: Decimal
  payments: [PaymentForLeadInput!]!
}

input PaymentForLeadInput {
  loanId: ID!
  amount: Decimal!
  comission: Decimal
  paymentMethod: PaymentMethod!
}

input CreateAccountInput {
  name: String!
  type: AccountType!
  amount: Decimal!
  routeIds: [ID!]
}

input UpdateAccountInput {
  name: String
  isActive: Boolean
}

input CreateTransactionInput {
  amount: Decimal!
  date: DateTime!
  type: TransactionType!
  incomeSource: String
  expenseSource: String
  sourceAccountId: ID!
  destinationAccountId: ID
  loanId: ID
  loanPaymentId: ID
  routeId: ID
  leadId: ID
}

input TransferInput {
  amount: Decimal!
  sourceAccountId: ID!
  destinationAccountId: ID!
  description: String
}

input CreateRouteInput {
  name: String!
}

input UpdateRouteInput {
  name: String
  isActive: Boolean
}

input CreateLoantypeInput {
  name: String!
  weekDuration: Int!
  rate: Decimal!
  interestRate: Decimal!
  loanPaymentComission: Decimal!
  loanGrantedComission: Decimal!
  maxAmount: Decimal
  maxTerm: Int
}

input UpdateLoantypeInput {
  name: String
  weekDuration: Int
  rate: Decimal
  interestRate: Decimal
  loanPaymentComission: Decimal
  loanGrantedComission: Decimal
  maxAmount: Decimal
  maxTerm: Int
  isActive: Boolean
}

input UploadDocumentInput {
  title: String
  description: String
  documentType: DocumentType!
  file: Upload!
  personalDataId: ID
  loanId: ID
  isError: Boolean
  errorDescription: String
  isMissing: Boolean
}

input UpdateDocumentInput {
  title: String
  description: String
  isError: Boolean
  errorDescription: String
  isMissing: Boolean
}
```

#### Directivas de Auth

```graphql
directive @auth on FIELD_DEFINITION | OBJECT
directive @requireRole(roles: [UserRole!]!) on FIELD_DEFINITION | OBJECT

# Ejemplo de uso:
extend type Query {
  financialReport(...): FinancialReport! @requireRole(roles: [ADMIN])
}

extend type Mutation {
  deleteUser(id: ID!): Boolean! @requireRole(roles: [ADMIN])
}
```

---

### 1.2 Especificación Prisma Schema

```prisma
// This is your Prisma schema file

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ========================================
// AUTH & USERS
// ========================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  role      UserRole @default(NORMAL)

  employee  Employee?

  documentPhotosUploaded DocumentPhoto[]
  auditLogs              AuditLog[]
  telegramUsers          TelegramUser[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}

enum UserRole {
  ADMIN
  NORMAL
  CAPTURA
}

// ========================================
// PERSONAL DATA & EMPLOYEES
// ========================================

model PersonalData {
  id         String    @id @default(cuid())
  fullName   String
  clientCode String    @unique // 6 caracteres alfanuméricos
  birthDate  DateTime?

  phones    Phone[]
  addresses Address[]
  employee  Employee?
  borrower  Borrower?

  // Como avalista en préstamos
  loansAsCollateral Loan[] @relation("LoanCollaterals")
  documentPhotos    DocumentPhoto[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([clientCode])
  @@map("personal_data")
}

model Phone {
  id             String       @id @default(cuid())
  number         String
  personalDataId String
  personalData   PersonalData @relation(fields: [personalDataId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("phones")
}

model Address {
  id             String       @id @default(cuid())
  street         String
  numberInterior String?
  numberExterior String?
  zipCode        String?

  locationId     String
  location       Location     @relation(fields: [locationId], references: [id])

  personalDataId String
  personalData   PersonalData @relation(fields: [personalDataId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("addresses")
}

model Employee {
  id             String       @id @default(cuid())
  type           EmployeeType
  isActive       Boolean      @default(true)

  personalDataId String       @unique
  personalData   PersonalData @relation(fields: [personalDataId], references: [id], onDelete: Cascade)

  userId         String?      @unique
  user           User?        @relation(fields: [userId], references: [id])

  routes         Route[]      @relation("RouteEmployees")

  // Préstamos donde es otorgante
  loansGranted         Loan[] @relation("LoanGrantor")
  // Préstamos donde es líder responsable
  loansManagedAsLead   Loan[] @relation("LoanLead")

  transactions         Transaction[]
  commissionPayments   CommissionPayment[]

  leadPaymentsReceivedAsLead  LeadPaymentReceived[] @relation("LeadPaymentReceivedLead")
  leadPaymentsReceivedAsAgent LeadPaymentReceived[] @relation("LeadPaymentReceivedAgent")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([type])
  @@index([isActive])
  @@map("employees")
}

enum EmployeeType {
  ROUTE_LEAD      // Líder de ruta
  LEAD            // Vendedor
  ROUTE_ASSISTENT // Asistente
}

model Borrower {
  id                String       @id @default(cuid())
  loanFinishedCount Int          @default(0)

  personalDataId    String       @unique
  personalData      PersonalData @relation(fields: [personalDataId], references: [id], onDelete: Cascade)

  loans Loan[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("borrowers")
}

// ========================================
// LOANS & PAYMENTS
// ========================================

model Loantype {
  id                     String  @id @default(cuid())
  name                   String
  weekDuration           Int
  rate                   Decimal @db.Decimal(10, 4)
  interestRate           Decimal @db.Decimal(10, 4)
  loanPaymentComission   Decimal @db.Decimal(10, 2)
  loanGrantedComission   Decimal @db.Decimal(10, 2)
  maxAmount              Decimal? @db.Decimal(10, 2)
  maxTerm                Int?
  isActive               Boolean @default(true)

  loans Loan[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("loantypes")
}

model Loan {
  id             String     @id @default(cuid())
  requestedAmount Decimal   @db.Decimal(10, 2)
  amountGived    Decimal    @db.Decimal(10, 2)
  signDate       DateTime   // Fecha de desembolso
  finishedDate   DateTime?
  badDebtDate    DateTime?
  isDeceased     Boolean    @default(false)

  // Calculados
  profitAmount           Decimal @db.Decimal(10, 2)
  totalDebtAcquired      Decimal @db.Decimal(10, 2)
  expectedWeeklyPayment  Decimal @db.Decimal(10, 2)
  totalPaid              Decimal @db.Decimal(10, 2) @default(0)
  pendingAmountStored    Decimal @db.Decimal(10, 2)
  comissionAmount        Decimal @db.Decimal(10, 2) @default(0)

  status LoanStatus @default(ACTIVE)

  // Relaciones
  borrowerId String
  borrower   Borrower @relation(fields: [borrowerId], references: [id])

  loantypeId String
  loantype   Loantype @relation(fields: [loantypeId], references: [id])

  grantorId String
  grantor   Employee @relation("LoanGrantor", fields: [grantorId], references: [id])

  leadId String
  lead   Employee @relation("LoanLead", fields: [leadId], references: [id])

  collaterals PersonalData[] @relation("LoanCollaterals")

  payments       LoanPayment[]
  transactions   Transaction[]
  documentPhotos DocumentPhoto[]
  commissionPayments CommissionPayment[]

  // Snapshot histórico
  snapshotLeadId         String?
  snapshotLeadName       String?
  snapshotLeadAssignedAt DateTime?
  snapshotRouteId        String?
  snapshotRouteName      String?

  // Renovación
  previousLoanId String? @unique
  previousLoan   Loan?   @relation("LoanRenewal", fields: [previousLoanId], references: [id])
  renewedBy      Loan?   @relation("LoanRenewal")

  excludedByCleanup   PortfolioCleanup? @relation("CleanupExcludedLoans")
  cleanupExcludedById String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([borrowerId])
  @@index([leadId])
  @@index([signDate])
  @@index([badDebtDate])
  @@map("loans")
}

enum LoanStatus {
  ACTIVE
  FINISHED
  RENOVATED
  CANCELLED
}

model LoanPayment {
  id            String        @id @default(cuid())
  amount        Decimal       @db.Decimal(10, 2)
  comission     Decimal       @db.Decimal(10, 2) @default(0)
  receivedAt    DateTime
  paymentMethod PaymentMethod
  type          String        // PAYMENT | EXTRA_COLLECTION

  loanId String
  loan   Loan   @relation(fields: [loanId], references: [id], onDelete: Cascade)

  leadPaymentReceivedId String?
  leadPaymentReceived   LeadPaymentReceived? @relation(fields: [leadPaymentReceivedId], references: [id])

  transactions Transaction[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([loanId])
  @@index([receivedAt])
  @@map("loan_payments")
}

enum PaymentMethod {
  CASH
  MONEY_TRANSFER
}

model LeadPaymentReceived {
  id              String  @id @default(cuid())
  expectedAmount  Decimal @db.Decimal(10, 2)
  paidAmount      Decimal @db.Decimal(10, 2)
  cashPaidAmount  Decimal @db.Decimal(10, 2)
  bankPaidAmount  Decimal @db.Decimal(10, 2)
  falcoAmount     Decimal @db.Decimal(10, 2) @default(0)
  paymentStatus   String  // COMPLETE | PARTIAL

  leadId  String
  lead    Employee @relation("LeadPaymentReceivedLead", fields: [leadId], references: [id])

  agentId String
  agent   Employee @relation("LeadPaymentReceivedAgent", fields: [agentId], references: [id])

  payments LoanPayment[]
  falcoCompensatoryPayments FalcoCompensatoryPayment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([leadId])
  @@map("lead_payments_received")
}

model FalcoCompensatoryPayment {
  id     String  @id @default(cuid())
  amount Decimal @db.Decimal(10, 2)

  leadPaymentReceivedId String
  leadPaymentReceived   LeadPaymentReceived @relation(fields: [leadPaymentReceivedId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("falco_compensatory_payments")
}

model CommissionPayment {
  id     String  @id @default(cuid())
  amount Decimal @db.Decimal(10, 2)

  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id])

  loanId String
  loan   Loan   @relation(fields: [loanId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("commission_payments")
}

// ========================================
// TRANSACTIONS & ACCOUNTS
// ========================================

model Transaction {
  id     String          @id @default(cuid())
  amount Decimal         @db.Decimal(10, 2)
  date   DateTime
  type   TransactionType

  // Específicos por tipo
  incomeSource  String?
  expenseSource String?

  profitAmount     Decimal? @db.Decimal(10, 2)
  returnToCapital  Decimal? @db.Decimal(10, 2)

  // Relaciones
  loanId String?
  loan   Loan?   @relation(fields: [loanId], references: [id])

  loanPaymentId String?
  loanPayment   LoanPayment? @relation(fields: [loanPaymentId], references: [id])

  sourceAccountId String
  sourceAccount   Account @relation("TransactionsSource", fields: [sourceAccountId], references: [id])

  destinationAccountId String?
  destinationAccount   Account? @relation("TransactionsDestination", fields: [destinationAccountId], references: [id])

  routeId String?
  route   Route?  @relation(fields: [routeId], references: [id])

  leadId String?
  lead   Employee? @relation(fields: [leadId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([type])
  @@index([date])
  @@index([loanId])
  @@map("transactions")
}

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
  INVESTMENT
}

model Account {
  id     String      @id @default(cuid())
  name   String
  type   AccountType
  amount Decimal     @db.Decimal(10, 2) // Saldo almacenado
  isActive Boolean   @default(true)

  routes Route[] @relation("RouteAccounts")

  transactionsSource      Transaction[] @relation("TransactionsSource")
  transactionsDestination Transaction[] @relation("TransactionsDestination")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([type])
  @@map("accounts")
}

enum AccountType {
  BANK
  OFFICE_CASH_FUND
  EMPLOYEE_CASH_FUND
  PREPAID_GAS
  TRAVEL_EXPENSES
}

// ========================================
// ROUTES & GEOGRAPHY
// ========================================

model Route {
  id       String  @id @default(cuid())
  name     String
  isActive Boolean @default(true)

  employees   Employee[]   @relation("RouteEmployees")
  accounts    Account[]    @relation("RouteAccounts")
  transactions Transaction[]
  locations   Location[]

  portfolioCleanups PortfolioCleanup[]
  reportConfigs     ReportConfig[]     @relation("ReportConfigRoutes")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("routes")
}

model Location {
  id   String @id @default(cuid())
  name String @unique

  municipalityId String
  municipality   Municipality @relation(fields: [municipalityId], references: [id])

  routeId String?
  route   Route?  @relation(fields: [routeId], references: [id])

  addresses Address[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("locations")
}

model Municipality {
  id   String @id @default(cuid())
  name String

  stateId String
  state   State  @relation(fields: [stateId], references: [id])

  locations Location[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("municipalities")
}

model State {
  id   String @id @default(cuid())
  name String @unique

  municipalities Municipality[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("states")
}

// ========================================
// DOCUMENTS & PHOTOS
// ========================================

model DocumentPhoto {
  id               String       @id @default(cuid())
  title            String?
  description      String?
  photoUrl         String
  publicId         String       // Cloudinary public ID
  documentType     DocumentType
  isError          Boolean      @default(false)
  errorDescription String?
  isMissing        Boolean      @default(false)

  personalDataId String?
  personalData   PersonalData? @relation(fields: [personalDataId], references: [id])

  loanId String?
  loan   Loan?   @relation(fields: [loanId], references: [id])

  uploadedById String
  uploadedBy   User   @relation(fields: [uploadedById], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([documentType])
  @@index([isError])
  @@index([isMissing])
  @@map("document_photos")
}

enum DocumentType {
  INE
  DOMICILIO
  PAGARE
  OTRO
}

// ========================================
// REPORTS & NOTIFICATIONS
// ========================================

model TelegramUser {
  id               String   @id @default(cuid())
  chatId           String   @unique
  name             String?
  username         String?
  isActive         Boolean  @default(true)
  registeredAt     DateTime @default(now())
  lastActivity     DateTime?
  reportsReceived  Int      @default(0)
  isInRecipientsList Boolean @default(false)

  platformUserId String? @unique
  platformUser   User?   @relation(fields: [platformUserId], references: [id])

  reportConfigs ReportConfig[] @relation("ReportConfigRecipients")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("telegram_users")
}

model ReportConfig {
  id         String  @id @default(cuid())
  name       String
  reportType String  // notificacion_tiempo_real | creditos_con_errores | resumen_semanal
  schedule   Json?   // Cron schedule
  isActive   Boolean @default(true)

  routes              Route[]         @relation("ReportConfigRoutes")
  telegramRecipients  TelegramUser[]  @relation("ReportConfigRecipients")
  executionLogs       ReportExecutionLog[]

  createdById String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("report_configs")
}

model ReportExecutionLog {
  id          String   @id @default(cuid())
  status      String   // SUCCESS | ERROR | RUNNING | CANCELLED
  executionType String // AUTOMATIC | MANUAL | TEST
  message     String?
  recipientsCount       Int?
  successfulDeliveries  Int?
  failedDeliveries      Int?
  startTime   DateTime
  endTime     DateTime?

  reportConfigId String
  reportConfig   ReportConfig @relation(fields: [reportConfigId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("report_execution_logs")
}

model NotificationConfig {
  id                         String  @id @default(cuid())
  sendErrorNotifications     Boolean @default(true)
  sendMissingNotifications   Boolean @default(true)
  errorNotificationMessage   String?
  missingNotificationMessage String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("notification_configs")
}

model DocumentNotificationLog {
  id             String   @id @default(cuid())
  documentId     String
  documentType   String
  personName     String
  loanId         String?
  routeId        String?
  routeName      String?
  routeLeadId    String?
  routeLeadName  String?
  telegramUserId String?
  telegramChatId String?
  issueType      String   // ERROR | MISSING | REPORT
  status         String   // SENT | ERROR | FAILED | NO_TELEGRAM | NO_LEADER | NO_ROUTE
  telegramResponse String?
  sentAt         DateTime
  responseTimeMs Int?
  retryCount     Int      @default(0)
  lastRetryAt    DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("document_notification_logs")
}

// ========================================
// AUDIT & CLEANUP
// ========================================

model AuditLog {
  id            String   @id @default(cuid())
  operation     String   // CREATE | UPDATE | DELETE
  modelName     String
  recordId      String
  userName      String?
  userEmail     String?
  userRole      String?
  sessionId     String?
  ipAddress     String?
  userAgent     String?
  previousValues Json?
  newValues      Json?
  changedFields  Json?
  description    String?
  metadata       Json?

  userId String?
  user   User?   @relation(fields: [userId], references: [id])

  createdAt DateTime @default(now())

  @@index([operation])
  @@index([modelName])
  @@index([recordId])
  @@index([createdAt])
  @@map("audit_logs")
}

model PortfolioCleanup {
  id                  String   @id @default(cuid())
  name                String
  description         String?
  cleanupDate         DateTime
  fromDate            DateTime?
  toDate              DateTime?
  excludedLoansCount  Int
  excludedAmount      Decimal  @db.Decimal(10, 2)

  routeId String
  route   Route  @relation(fields: [routeId], references: [id])

  executedById String

  loansExcluded Loan[] @relation("CleanupExcludedLoans")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("portfolio_cleanups")
}
```

---

### 1.3 Arquitectura de Capas (Responsabilidades)

```
┌─────────────────────────────────────────┐
│  GraphQL Resolvers (apps/api/resolvers) │  ← Orquestación
│  - Validar entrada                      │
│  - Llamar servicios                     │
│  - Retornar respuesta                   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Services (apps/api/services)           │  ← Lógica de negocio
│  - LoanService                          │
│  - PaymentService                       │
│  - TransactionService                   │
│  - EmployeeService                      │
│  - ReportService                        │
│  - TelegramService                      │
│  - CloudinaryService                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Repositories (apps/api/repositories)   │  ← Acceso a datos
│  - LoanRepository                       │
│  - PaymentRepository                    │
│  - TransactionRepository                │
│  - UserRepository                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Prisma Client (@solufacil/database)    │  ← ORM
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  PostgreSQL Database                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Business Logic Utils                   │  ← Cálculos puros
│  (@solufacil/business-logic)            │
│  - calculations/profit.ts               │
│  - calculations/payment.ts              │
│  - validators/loan.ts                   │
│  - snapshots/loan-snapshot.ts           │
└─────────────────────────────────────────┘
```

**Principios:**
1. **Resolvers**: Solo orquestación, NO lógica de negocio
2. **Services**: Toda la lógica de negocio, transacciones, validaciones
3. **Repositories**: Queries Prisma, abstraen acceso a datos
4. **Utils**: Funciones puras (calculadoras, validadores)
5. **Middleware**: Cross-cutting concerns (auth, logging, errors)

---

### 1.4 Lógica de Negocio Crítica (Migración)

#### 1.4.1 Cálculo de Profit

**Ubicación**: `packages/business-logic/src/calculations/profit.ts`

```typescript
// Función pura para calcular profit
export function calculateProfit(
  requestedAmount: Decimal,
  rate: Decimal
): Decimal {
  return requestedAmount.times(rate)
}

// Función para calcular profit proporcional en un pago
export function calculatePaymentProfit(
  paymentAmount: Decimal,
  totalProfit: Decimal,
  totalDebtAcquired: Decimal,
  isBadDebt: boolean = false
): { profitAmount: Decimal; returnToCapital: Decimal } {
  if (isBadDebt) {
    // Si es bad debt, todo el pago es ganancia
    return {
      profitAmount: paymentAmount,
      returnToCapital: new Decimal(0)
    }
  }

  // Profit proporcional
  const profitAmount = paymentAmount
    .times(totalProfit)
    .dividedBy(totalDebtAcquired)
    .toDecimalPlaces(2)

  const returnToCapital = paymentAmount.minus(profitAmount)

  return { profitAmount, returnToCapital }
}

// Calcular métricas persistentes del préstamo
export function calculateLoanMetrics(
  requestedAmount: Decimal,
  rate: Decimal,
  weekDuration: number
): {
  profitAmount: Decimal
  totalDebtAcquired: Decimal
  expectedWeeklyPayment: Decimal
} {
  const profitAmount = calculateProfit(requestedAmount, rate)
  const totalDebtAcquired = requestedAmount.plus(profitAmount)
  const expectedWeeklyPayment = totalDebtAcquired.dividedBy(weekDuration).toDecimalPlaces(2)

  return {
    profitAmount,
    totalDebtAcquired,
    expectedWeeklyPayment
  }
}
```

#### 1.4.2 Servicio de Préstamos (LoanService)

**Ubicación**: `apps/api/src/services/LoanService.ts`

```typescript
export class LoanService {
  constructor(
    private loanRepo: LoanRepository,
    private transactionService: TransactionService,
    private snapshotService: SnapshotService
  ) {}

  async createLoan(input: CreateLoanInput, userId: string): Promise<Loan> {
    // 1. Validar datos
    await this.validateLoanCreation(input)

    // 2. Obtener loantype para calcular métricas
    const loantype = await this.loanRepo.findLoantypeById(input.loantypeId)

    // 3. Calcular métricas
    const metrics = calculateLoanMetrics(
      new Decimal(input.requestedAmount),
      loantype.rate,
      loantype.weekDuration
    )

    // 4. Crear snapshot histórico
    const snapshot = await this.snapshotService.createLoanSnapshot(
      input.leadId,
      input.routeId
    )

    // 5. Manejar profit pendiente si es renovación
    let pendingProfit = new Decimal(0)
    if (input.previousLoanId) {
      const previousLoan = await this.loanRepo.findById(input.previousLoanId)
      pendingProfit = previousLoan.pendingAmountStored

      // Marcar como RENOVATED
      await this.loanRepo.update(input.previousLoanId, {
        status: LoanStatus.RENOVATED
      })
    }

    // 6. Crear préstamo en transacción
    const loan = await this.loanRepo.createWithTransaction(async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          ...input,
          profitAmount: metrics.profitAmount.plus(pendingProfit),
          totalDebtAcquired: metrics.totalDebtAcquired.plus(pendingProfit),
          expectedWeeklyPayment: metrics.expectedWeeklyPayment,
          pendingAmountStored: metrics.totalDebtAcquired.plus(pendingProfit),
          ...snapshot
        }
      })

      // 7. Crear transacciones automáticas
      await this.transactionService.createLoanGrantedTransactions(
        newLoan,
        loantype,
        tx
      )

      return newLoan
    })

    // 8. Auditoría
    await this.auditService.log('CREATE', 'Loan', loan.id, userId)

    return loan
  }

  async markAsBadDebt(loanId: string, badDebtDate: Date): Promise<Loan> {
    return this.loanRepo.update(loanId, { badDebtDate })
  }
}
```

#### 1.4.3 Servicio de Pagos (PaymentService)

**Ubicación**: `apps/api/src/services/PaymentService.ts`

```typescript
export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private loanRepo: LoanRepository,
    private transactionService: TransactionService
  ) {}

  async createLoanPayment(
    input: CreateLoanPaymentInput,
    userId: string
  ): Promise<LoanPayment> {
    // 1. Obtener préstamo
    const loan = await this.loanRepo.findById(input.loanId)

    // 2. Calcular profit del pago
    const { profitAmount, returnToCapital } = calculatePaymentProfit(
      new Decimal(input.amount),
      loan.profitAmount,
      loan.totalDebtAcquired,
      !!loan.badDebtDate
    )

    // 3. Crear pago y transacciones en una transacción atómica
    const payment = await this.paymentRepo.createWithTransaction(async (tx) => {
      const newPayment = await tx.loanPayment.create({
        data: input
      })

      // Crear transacciones de INCOME y COMISSION
      await this.transactionService.createPaymentTransactions(
        newPayment,
        loan,
        profitAmount,
        returnToCapital,
        tx
      )

      // Actualizar métricas del préstamo
      const updatedTotalPaid = loan.totalPaid.plus(input.amount)
      const updatedPending = loan.pendingAmountStored.minus(input.amount)

      await tx.loan.update({
        where: { id: loan.id },
        data: {
          totalPaid: updatedTotalPaid,
          pendingAmountStored: updatedPending.isNegative() ? 0 : updatedPending,
          finishedDate: updatedPending.lessThanOrEqualTo(0) ? new Date() : null,
          status: updatedPending.lessThanOrEqualTo(0) ? LoanStatus.FINISHED : loan.status
        }
      })

      return newPayment
    })

    return payment
  }
}
```

#### 1.4.4 Servicio de Transacciones (TransactionService)

**Ubicación**: `apps/api/src/services/TransactionService.ts`

```typescript
export class TransactionService {
  async createLoanGrantedTransactions(
    loan: Loan,
    loantype: Loantype,
    tx: PrismaTransaction
  ): Promise<void> {
    // Obtener cuenta del lead
    const leadAccount = await this.getLeadAccount(loan.leadId, tx)

    // 1. Transacción de desembolso (EXPENSE)
    await tx.transaction.create({
      data: {
        amount: loan.amountGived,
        date: loan.signDate,
        type: TransactionType.EXPENSE,
        expenseSource: 'LOAN_GRANTED',
        sourceAccountId: leadAccount.id,
        loanId: loan.id,
        leadId: loan.leadId,
        routeId: loan.snapshotRouteId
      }
    })

    // 2. Transacción de comisión (si aplica)
    if (loantype.loanGrantedComission.greaterThan(0)) {
      await tx.transaction.create({
        data: {
          amount: loantype.loanGrantedComission,
          date: loan.signDate,
          type: TransactionType.EXPENSE,
          expenseSource: 'LOAN_GRANTED_COMISSION',
          sourceAccountId: leadAccount.id,
          loanId: loan.id,
          leadId: loan.leadId
        }
      })
    }

    // Actualizar balance de cuenta
    await this.updateAccountBalance(leadAccount.id, tx)
  }

  async createPaymentTransactions(
    payment: LoanPayment,
    loan: Loan,
    profitAmount: Decimal,
    returnToCapital: Decimal,
    tx: PrismaTransaction
  ): Promise<void> {
    const leadAccount = await this.getLeadAccount(loan.leadId, tx)

    // 1. Transacción de ingreso (INCOME)
    await tx.transaction.create({
      data: {
        amount: payment.amount,
        date: payment.receivedAt,
        type: TransactionType.INCOME,
        incomeSource: payment.paymentMethod === 'CASH' ? 'CASH_LOAN_PAYMENT' : 'BANK_LOAN_PAYMENT',
        sourceAccountId: leadAccount.id,
        loanId: loan.id,
        loanPaymentId: payment.id,
        profitAmount,
        returnToCapital,
        leadId: loan.leadId
      }
    })

    // 2. Comisión de pago (si aplica)
    if (payment.comission && payment.comission.greaterThan(0)) {
      await tx.transaction.create({
        data: {
          amount: payment.comission,
          date: payment.receivedAt,
          type: TransactionType.EXPENSE,
          expenseSource: 'LOAN_PAYMENT_COMISSION',
          sourceAccountId: leadAccount.id,
          loanPaymentId: payment.id,
          leadId: loan.leadId
        }
      })
    }

    await this.updateAccountBalance(leadAccount.id, tx)
  }
}
```

---

### 1.5 Autenticación JWT

**Ubicación**: `apps/api/src/middleware/auth.ts`

#### Estructura del JWT

```typescript
interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

interface RefreshTokenPayload {
  userId: string
  tokenVersion: number  // Para invalidar tokens
  iat: number
  exp: number
}
```

#### Configuración

```typescript
// Access Token: 15 minutos
const ACCESS_TOKEN_EXPIRY = '15m'
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!

// Refresh Token: 7 días
const REFRESH_TOKEN_EXPIRY = '7d'
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!
```

#### Auth Middleware

```typescript
export const authMiddleware = async (
  resolve: any,
  parent: any,
  args: any,
  context: GraphQLContext,
  info: any
) => {
  const token = context.req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    throw new AuthenticationError('No token provided')
  }

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as JWTPayload
    context.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role
    }
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token')
  }

  return resolve(parent, args, context, info)
}
```

#### Directivas de Auth

```typescript
// @requireRole directive
export class RequireRoleDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field
    const { roles } = this.args

    field.resolve = async function (...args) {
      const context = args[2]

      if (!context.user) {
        throw new AuthenticationError('Not authenticated')
      }

      if (!roles.includes(context.user.role)) {
        throw new ForbiddenError('Insufficient permissions')
      }

      return resolve.apply(this, args)
    }
  }
}
```

---

### 1.6 Estructura de Packages

#### `@solufacil/database`

```
packages/database/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── client.ts          # Singleton Prisma client
│   ├── types.ts           # Re-export Prisma types
│   └── index.ts
├── package.json
└── tsconfig.json
```

**Exports:**
- `prisma`: Client singleton
- Prisma types (User, Loan, etc.)

#### `@solufacil/graphql-schema`

```
packages/graphql-schema/
├── src/
│   ├── schema.graphql     # SDL schema completo
│   ├── scalars.ts         # Custom scalars (Decimal, DateTime)
│   └── index.ts
├── codegen.ts             # GraphQL Code Generator
├── package.json
└── tsconfig.json
```

**Exports:**
- Type definitions generados
- Scalars
- Schema SDL

**Generación automática:**
```bash
pnpm codegen  # Genera types TypeScript desde schema.graphql
```

#### `@solufacil/business-logic`

```
packages/business-logic/
├── src/
│   ├── calculations/
│   │   ├── profit.ts
│   │   ├── payment.ts
│   │   └── metrics.ts
│   ├── validators/
│   │   ├── loan-validator.ts
│   │   ├── payment-validator.ts
│   │   └── employee-validator.ts
│   ├── transactions/
│   │   └── transaction-factory.ts
│   ├── snapshots/
│   │   └── loan-snapshot.ts
│   └── index.ts
├── tests/
│   └── calculations/
│       └── profit.test.ts
├── package.json
└── tsconfig.json
```

**Exports:**
- Funciones puras de cálculo
- Validadores
- Factories

#### `@solufacil/shared`

```
packages/shared/
├── src/
│   ├── types/
│   │   └── common.ts
│   ├── constants/
│   │   ├── roles.ts
│   │   ├── statuses.ts
│   │   └── transaction-sources.ts
│   ├── utils/
│   │   ├── date.ts
│   │   ├── string.ts
│   │   └── number.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

### 1.7 Testing Strategy

#### Unit Tests (Lógica Crítica)

**Herramienta**: Vitest

**Qué testear:**
1. **Cálculos de profit** (`packages/business-logic/tests/calculations/profit.test.ts`)
   - Cálculo básico
   - Profit proporcional en pagos
   - Bad debt (todo es ganancia)
   - Renovaciones con profit pendiente

2. **Validadores** (`packages/business-logic/tests/validators/`)
   - Validación de montos
   - Validación de fechas
   - Reglas de negocio

3. **Servicios críticos** (`apps/api/tests/services/`)
   - LoanService.createLoan
   - PaymentService.createLoanPayment
   - TransactionService

**Ejemplo de test:**

```typescript
// packages/business-logic/tests/calculations/profit.test.ts
import { describe, it, expect } from 'vitest'
import { calculateProfit, calculatePaymentProfit } from '../src/calculations/profit'
import Decimal from 'decimal.js'

describe('Profit calculations', () => {
  it('calculates basic profit correctly', () => {
    const result = calculateProfit(new Decimal(1000), new Decimal(0.20))
    expect(result.toNumber()).toBe(200)
  })

  it('calculates proportional payment profit', () => {
    const { profitAmount, returnToCapital } = calculatePaymentProfit(
      new Decimal(100),    // payment
      new Decimal(200),    // total profit
      new Decimal(1200),   // total debt
      false
    )

    expect(profitAmount.toNumber()).toBe(16.67)
    expect(returnToCapital.toNumber()).toBe(83.33)
  })

  it('treats all payment as profit when bad debt', () => {
    const { profitAmount, returnToCapital } = calculatePaymentProfit(
      new Decimal(100),
      new Decimal(200),
      new Decimal(1200),
      true  // isBadDebt
    )

    expect(profitAmount.toNumber()).toBe(100)
    expect(returnToCapital.toNumber()).toBe(0)
  })
})
```

**Coverage mínima**: 80% en `packages/business-logic`

---

### 1.8 Migración de Datos

#### Script de Migración

**Ubicación**: `apps/api/scripts/migrate-from-keystone.ts`

**Estrategia:**
1. **Exportar desde Keystone**: Dump SQL o script de exportación
2. **Transformar datos**: Mapear campos antiguos → nuevos
3. **Importar con validación**: Usar Prisma para insertar
4. **Verificar integridad**: Comparar counts, sumas

**Pasos:**

```typescript
// 1. Conectar a ambas DBs
const keystoneDB = new PrismaClient({ datasourceUrl: OLD_DB_URL })
const newDB = new PrismaClient({ datasourceUrl: NEW_DB_URL })

// 2. Migrar en orden (respetar relaciones)
await migrateUsers()
await migratePersonalData()
await migrateEmployees()
await migrateBorrowers()
await migrateLoantypes()
await migrateLoans()
await migrateLoanPayments()
await migrateTransactions()
// ...

// 3. Validar totales
const validation = await validateMigration()
console.log(validation)
```

**Validaciones:**
- Count de registros por tabla
- Suma de montos (totalPaid, pendingAmount)
- Relaciones intactas (foreign keys)

**Rollback Plan:**
- Backup de DB nueva antes de migración
- Script de rollback que restaura desde backup
- Logs detallados de cada paso

---

### 1.9 Integraciones Externas

#### Telegram Service

**Ubicación**: `apps/api/src/services/TelegramService.ts`

```typescript
export class TelegramService {
  private botToken: string
  private baseUrl: string

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN!
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`
  }

  async sendMessage(
    chatId: string,
    message: string,
    options?: { parseMode?: 'HTML' | 'Markdown' }
  ): Promise<void> {
    await axios.post(`${this.baseUrl}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: options?.parseMode || 'HTML'
    })
  }

  async sendDocument(chatId: string, document: Buffer, filename: string): Promise<void> {
    const formData = new FormData()
    formData.append('chat_id', chatId)
    formData.append('document', document, filename)

    await axios.post(`${this.baseUrl}/sendDocument`, formData)
  }
}
```

#### Cloudinary Service

**Ubicación**: `apps/api/src/services/CloudinaryService.ts`

```typescript
import { v2 as cloudinary } from 'cloudinary'

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    })
  }

  async uploadImage(file: File, folder: string): Promise<{ url: string; publicId: string }> {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: 'image'
    })

    return {
      url: result.secure_url,
      publicId: result.public_id
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId)
  }
}
```

---

## FASE 2: PLAN DE IMPLEMENTACIÓN

### Fase 2.1: Setup Base (Monorepo + API Skeleton)

**Tareas:**
1. Inicializar monorepo con Turborepo
2. Configurar pnpm workspaces
3. Crear packages base:
   - `@solufacil/database` (Prisma)
   - `@solufacil/graphql-schema`
   - `@solufacil/business-logic`
   - `@solufacil/shared`
4. Crear `apps/api` con Apollo Server
5. Configurar TypeScript, ESLint, Prettier
6. Setup CI/CD básico

**Archivos clave:**
- `turbo.json`
- `pnpm-workspace.yaml`
- `package.json` (root)

### Fase 2.2: Auth + Base Models

**Tareas:**
1. Implementar Prisma schema (User, PersonalData, Employee)
2. Implementar GraphQL schema (User, Employee types)
3. Implementar JWT auth
4. Crear resolvers de auth (login, refreshToken)
5. Crear middleware de auth
6. Tests de auth

**Entregables:**
- Login funcional
- Protected routes
- Role-based access

### Fase 2.3: Core Models (Loans, Borrowers, Loantypes)

**Tareas:**
1. Prisma schema: Loan, Borrower, Loantype, PersonalData completo
2. GraphQL schema: Queries y Mutations de loans
3. Implementar cálculos de profit en `business-logic`
4. LoanService + LoanRepository
5. Tests de cálculos de profit
6. Resolvers de loans

**Entregables:**
- CRUD de préstamos
- Cálculos de profit correctos
- Snapshot histórico funcional

### Fase 2.4: Payments & Transactions

**Tareas:**
1. Prisma schema: LoanPayment, Transaction, Account
2. GraphQL schema: Mutations de pagos
3. PaymentService + TransactionService
4. Lógica de transacciones automáticas
5. Actualización de métricas de loans
6. Tests de pagos y transacciones

**Entregables:**
- Registro de pagos funcional
- Transacciones automáticas
- Balance de cuentas correcto

### Fase 2.5: Routes, Geography & Employees

**Tareas:**
1. Prisma schema: Route, Location, Municipality, State
2. GraphQL schema: Queries de routes y geography
3. EmployeeService con promoción a lead
4. Relaciones route-employee-account

**Entregables:**
- Gestión de rutas
- Asignación de empleados a rutas
- Geografía completa

### Fase 2.6: Reports & Custom Resolvers

**Tareas:**
1. ReportService con lógica de reportes financieros
2. Custom resolvers:
   - `financialReport`
   - `badDebtByMonth`
   - `badDebtSummary`
3. Generación de PDFs

**Entregables:**
- Reportes financieros funcionales
- Reporte de deuda morosa
- Export a PDF

### Fase 2.7: Documents & Integrations

**Tareas:**
1. Prisma schema: DocumentPhoto
2. CloudinaryService implementado
3. Upload de documentos
4. TelegramService implementado
5. Notificaciones automáticas

**Entregables:**
- Upload de fotos funcional
- Notificaciones Telegram
- Tracking de documentos con error

### Fase 2.8: Audit & Advanced Features

**Tareas:**
1. AuditLog implementation
2. PortfolioCleanup
3. LeadPaymentReceived (pagos de cobradores)
4. CommissionPayment

**Entregables:**
- Auditoría completa
- Limpieza de cartera
- Gestión de pagos de cobradores

### Fase 2.9: Migration & Testing

**Tareas:**
1. Script de migración de datos
2. Validación de migración
3. Tests de integración
4. Load testing

**Entregables:**
- Datos migrados correctamente
- Tests pasando
- API lista para producción

---

## FASE 3: CRITERIOS DE ÉXITO

✅ **API funcionando** con todas las operaciones CRUD
✅ **Cálculos de profit** 100% correctos (validados con tests)
✅ **Transacciones atómicas** funcionando (pagos + transacciones)
✅ **Auth JWT** implementado y seguro
✅ **Integraciones** (Telegram, Cloudinary) funcionando
✅ **Migración de datos** exitosa y validada
✅ **Tests pasando** (coverage >80% en business-logic)
✅ **Documentación** actualizada

---

## TRADE-OFFS CONSIDERADOS

### ✅ Monorepo vs Multi-repo
**Decisión**: Monorepo con Turborepo
**Razón**: Compartir código fácilmente, mejor DX, caching

### ✅ JWT vs Sessions
**Decisión**: JWT stateless
**Razón**: Escalable, no requiere estado en servidor, ideal para API

### ✅ Services vs Resolvers con lógica
**Decisión**: Services separados
**Razón**: Reutilización, testing más fácil, separación de responsabilidades

### ✅ Prisma vs TypeORM
**Decisión**: Prisma
**Razón**: Type-safety superior, migrations automáticas, mejor DX

### ✅ Apollo Server vs tRPC
**Decisión**: Apollo Server
**Razón**: GraphQL es mejor para app móvil, frontend web, más flexible

---

## PRÓXIMOS PASOS

1. **Aprobar este plan de especificaciones**
2. **Comenzar con Fase 2.1**: Setup del monorepo
3. **Implementar fase por fase** siguiendo el orden
4. **Validar cada fase** antes de continuar
5. **Al final**: Web (Next.js 15) y Mobile (Flutter)

---

**Este plan sigue Spec-Driven Development**: Las especificaciones (GraphQL schema, Prisma schema, arquitectura) son el contrato antes de implementar código.
