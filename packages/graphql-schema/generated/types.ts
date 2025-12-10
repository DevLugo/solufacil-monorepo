import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { GraphQLContext } from '../src/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: Date; output: Date; }
  Decimal: { input: string; output: string; }
  JSON: { input: Record<string, any>; output: Record<string, any>; }
  Upload: { input: Promise<{ createReadStream: () => NodeJS.ReadableStream; filename: string; mimetype: string; encoding: string }>; output: Promise<{ createReadStream: () => NodeJS.ReadableStream; filename: string; mimetype: string; encoding: string }>; }
};

export type Account = {
  __typename?: 'Account';
  accountBalance: Scalars['Decimal']['output'];
  amount: Scalars['Decimal']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  routes: Array<Route>;
  transactionsDestination: Array<Transaction>;
  transactionsSource: Array<Transaction>;
  type: AccountType;
  updatedAt: Scalars['DateTime']['output'];
};

export enum AccountType {
  Bank = 'BANK',
  EmployeeCashFund = 'EMPLOYEE_CASH_FUND',
  OfficeCashFund = 'OFFICE_CASH_FUND',
  PrepaidGas = 'PREPAID_GAS',
  TravelExpenses = 'TRAVEL_EXPENSES'
}

export type ActiveLoansBreakdown = {
  __typename?: 'ActiveLoansBreakdown';
  alCorriente: Scalars['Int']['output'];
  carteraVencida: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type Address = {
  __typename?: 'Address';
  id: Scalars['ID']['output'];
  location: Location;
  numberExterior?: Maybe<Scalars['String']['output']>;
  numberInterior?: Maybe<Scalars['String']['output']>;
  personalData: PersonalData;
  street: Scalars['String']['output'];
  zipCode?: Maybe<Scalars['String']['output']>;
};

export type AnnualFinancialReport = {
  __typename?: 'AnnualFinancialReport';
  annualWeeklyAverageExpenses: Scalars['Decimal']['output'];
  annualWeeklyAverageIncome: Scalars['Decimal']['output'];
  annualWeeklyAverageProfit: Scalars['Decimal']['output'];
  data: Array<MonthlyFinancialData>;
  months: Array<Scalars['String']['output']>;
  routes: Array<RouteInfo>;
  totalActiveWeeks: Scalars['Int']['output'];
  year: Scalars['Int']['output'];
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  accessToken: Scalars['String']['output'];
  refreshToken: Scalars['String']['output'];
  user: User;
};

export type BadDebtData = {
  __typename?: 'BadDebtData';
  loanCount: Scalars['Int']['output'];
  routeId: Scalars['ID']['output'];
  routeName: Scalars['String']['output'];
  totalAmount: Scalars['Decimal']['output'];
};

export type BadDebtSummary = {
  __typename?: 'BadDebtSummary';
  byRoute: Array<BadDebtData>;
  totalAmount: Scalars['Decimal']['output'];
  totalLoans: Scalars['Int']['output'];
};

export type Borrower = {
  __typename?: 'Borrower';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  loanFinishedCount: Scalars['Int']['output'];
  loans: Array<Loan>;
  personalData: PersonalData;
  updatedAt: Scalars['DateTime']['output'];
};

export type BorrowerSearchResult = {
  __typename?: 'BorrowerSearchResult';
  hasActiveLoans: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isFromCurrentLocation: Scalars['Boolean']['output'];
  loanFinishedCount: Scalars['Int']['output'];
  locationId?: Maybe<Scalars['ID']['output']>;
  locationName?: Maybe<Scalars['String']['output']>;
  pendingDebtAmount?: Maybe<Scalars['String']['output']>;
  personalData: PersonalData;
};

export type CommissionPayment = {
  __typename?: 'CommissionPayment';
  amount: Scalars['Decimal']['output'];
  createdAt: Scalars['DateTime']['output'];
  employee: Employee;
  id: Scalars['ID']['output'];
  loan: Loan;
  updatedAt: Scalars['DateTime']['output'];
};

export type ComparisonData = {
  __typename?: 'ComparisonData';
  growth: Scalars['Decimal']['output'];
  previousMonth: FinancialSummary;
  trend: Scalars['String']['output'];
};

export type CreateAccountInput = {
  amount: Scalars['Decimal']['input'];
  name: Scalars['String']['input'];
  routeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  type: AccountType;
};

export type CreateAddressInput = {
  locationId: Scalars['ID']['input'];
  numberExterior?: InputMaybe<Scalars['String']['input']>;
  numberInterior?: InputMaybe<Scalars['String']['input']>;
  street: Scalars['String']['input'];
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export type CreateBorrowerInput = {
  personalData: CreatePersonalDataInput;
};

export type CreateEmployeeInput = {
  personalData: CreatePersonalDataInput;
  routeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  type: EmployeeType;
};

export type CreateLeadPaymentReceivedInput = {
  agentId: Scalars['ID']['input'];
  bankPaidAmount: Scalars['Decimal']['input'];
  cashPaidAmount: Scalars['Decimal']['input'];
  expectedAmount: Scalars['Decimal']['input'];
  falcoAmount?: InputMaybe<Scalars['Decimal']['input']>;
  leadId: Scalars['ID']['input'];
  paidAmount: Scalars['Decimal']['input'];
  paymentDate: Scalars['DateTime']['input'];
  payments: Array<PaymentForLeadInput>;
};

export type CreateLoanInput = {
  amountGived: Scalars['Decimal']['input'];
  borrowerId: Scalars['ID']['input'];
  collateralIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  grantorId: Scalars['ID']['input'];
  leadId: Scalars['ID']['input'];
  loantypeId: Scalars['ID']['input'];
  previousLoanId?: InputMaybe<Scalars['ID']['input']>;
  requestedAmount: Scalars['Decimal']['input'];
  signDate: Scalars['DateTime']['input'];
};

export type CreateLoanPaymentInput = {
  amount: Scalars['Decimal']['input'];
  comission?: InputMaybe<Scalars['Decimal']['input']>;
  loanId: Scalars['ID']['input'];
  paymentMethod: PaymentMethod;
  receivedAt: Scalars['DateTime']['input'];
};

export type CreateLoansInBatchInput = {
  grantorId: Scalars['ID']['input'];
  leadId: Scalars['ID']['input'];
  loans: Array<CreateSingleLoanInput>;
  signDate: Scalars['DateTime']['input'];
  sourceAccountId: Scalars['ID']['input'];
};

export type CreateLoantypeInput = {
  interestRate: Scalars['Decimal']['input'];
  loanGrantedComission: Scalars['Decimal']['input'];
  loanPaymentComission: Scalars['Decimal']['input'];
  maxAmount?: InputMaybe<Scalars['Decimal']['input']>;
  maxTerm?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  rate: Scalars['Decimal']['input'];
  weekDuration: Scalars['Int']['input'];
};

export type CreatePersonalDataInput = {
  addresses?: InputMaybe<Array<CreateAddressInput>>;
  birthDate?: InputMaybe<Scalars['DateTime']['input']>;
  clientCode?: InputMaybe<Scalars['String']['input']>;
  fullName: Scalars['String']['input'];
  phones?: InputMaybe<Array<CreatePhoneInput>>;
};

export type CreatePhoneInput = {
  number: Scalars['String']['input'];
};

export type CreateRouteInput = {
  name: Scalars['String']['input'];
};

export type CreateSingleLoanInput = {
  amountGived: Scalars['Decimal']['input'];
  borrowerId?: InputMaybe<Scalars['ID']['input']>;
  collateralIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  comissionAmount?: InputMaybe<Scalars['Decimal']['input']>;
  firstPayment?: InputMaybe<FirstPaymentInput>;
  isFromDifferentLocation?: InputMaybe<Scalars['Boolean']['input']>;
  loantypeId: Scalars['ID']['input'];
  newBorrower?: InputMaybe<CreateBorrowerInput>;
  newCollateral?: InputMaybe<CreatePersonalDataInput>;
  previousLoanId?: InputMaybe<Scalars['ID']['input']>;
  requestedAmount: Scalars['Decimal']['input'];
  tempId: Scalars['String']['input'];
};

export type CreateTransactionInput = {
  amount: Scalars['Decimal']['input'];
  date: Scalars['DateTime']['input'];
  destinationAccountId?: InputMaybe<Scalars['ID']['input']>;
  expenseSource?: InputMaybe<Scalars['String']['input']>;
  incomeSource?: InputMaybe<Scalars['String']['input']>;
  leadId?: InputMaybe<Scalars['ID']['input']>;
  loanId?: InputMaybe<Scalars['ID']['input']>;
  loanPaymentId?: InputMaybe<Scalars['ID']['input']>;
  routeId?: InputMaybe<Scalars['ID']['input']>;
  sourceAccountId?: InputMaybe<Scalars['ID']['input']>;
  type: TransactionType;
};

export type CreateUserInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  role: UserRole;
};

export type DocumentPhoto = {
  __typename?: 'DocumentPhoto';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  documentType: DocumentType;
  errorDescription?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isError: Scalars['Boolean']['output'];
  isMissing: Scalars['Boolean']['output'];
  loan?: Maybe<Loan>;
  personalData?: Maybe<PersonalData>;
  photoUrl: Scalars['String']['output'];
  publicId: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  uploadedBy: User;
};

export enum DocumentType {
  Domicilio = 'DOMICILIO',
  Ine = 'INE',
  Otro = 'OTRO',
  Pagare = 'PAGARE'
}

export type Employee = {
  __typename?: 'Employee';
  commissionPayments: Array<CommissionPayment>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  loansGranted: Array<Loan>;
  loansManagedAsLead: Array<Loan>;
  location?: Maybe<Location>;
  personalData: PersonalData;
  routes: Array<Route>;
  transactions: Array<Transaction>;
  type: EmployeeType;
  updatedAt: Scalars['DateTime']['output'];
};

export enum EmployeeType {
  Lead = 'LEAD',
  RouteAssistent = 'ROUTE_ASSISTENT',
  RouteLead = 'ROUTE_LEAD'
}

export type FinancialReport = {
  __typename?: 'FinancialReport';
  comparisonData?: Maybe<ComparisonData>;
  performanceMetrics: PerformanceMetrics;
  summary: FinancialSummary;
  weeklyData: Array<WeeklyData>;
};

export type FinancialSummary = {
  __typename?: 'FinancialSummary';
  activeLoans: Scalars['Int']['output'];
  activeLoansBreakdown: ActiveLoansBreakdown;
  averagePayment: Scalars['Decimal']['output'];
  pendingAmount: Scalars['Decimal']['output'];
  totalPaid: Scalars['Decimal']['output'];
  totalPortfolio: Scalars['Decimal']['output'];
};

export type FirstPaymentInput = {
  amount: Scalars['Decimal']['input'];
  comission?: InputMaybe<Scalars['Decimal']['input']>;
  paymentMethod: PaymentMethod;
};

export type LeadPaymentReceived = {
  __typename?: 'LeadPaymentReceived';
  agent: Employee;
  bankPaidAmount: Scalars['Decimal']['output'];
  cashPaidAmount: Scalars['Decimal']['output'];
  createdAt: Scalars['DateTime']['output'];
  expectedAmount: Scalars['Decimal']['output'];
  falcoAmount: Scalars['Decimal']['output'];
  id: Scalars['ID']['output'];
  lead: Employee;
  paidAmount: Scalars['Decimal']['output'];
  paymentStatus: Scalars['String']['output'];
  payments: Array<LoanPayment>;
  updatedAt: Scalars['DateTime']['output'];
};

export type Loan = {
  __typename?: 'Loan';
  amountGived: Scalars['Decimal']['output'];
  badDebtDate?: Maybe<Scalars['DateTime']['output']>;
  borrower: Borrower;
  collaterals: Array<PersonalData>;
  comissionAmount: Scalars['Decimal']['output'];
  createdAt: Scalars['DateTime']['output'];
  documentPhotos: Array<DocumentPhoto>;
  expectedWeeklyPayment: Scalars['Decimal']['output'];
  finishedDate?: Maybe<Scalars['DateTime']['output']>;
  grantor: Employee;
  id: Scalars['ID']['output'];
  isDeceased: Scalars['Boolean']['output'];
  lead: Employee;
  loantype: Loantype;
  payments: Array<LoanPayment>;
  pendingAmountStored: Scalars['Decimal']['output'];
  previousLoan?: Maybe<Loan>;
  profitAmount: Scalars['Decimal']['output'];
  renewedBy?: Maybe<Loan>;
  requestedAmount: Scalars['Decimal']['output'];
  signDate: Scalars['DateTime']['output'];
  snapshotLeadAssignedAt?: Maybe<Scalars['DateTime']['output']>;
  snapshotLeadId?: Maybe<Scalars['String']['output']>;
  snapshotLeadName?: Maybe<Scalars['String']['output']>;
  snapshotRouteId?: Maybe<Scalars['String']['output']>;
  snapshotRouteName?: Maybe<Scalars['String']['output']>;
  status: LoanStatus;
  totalDebtAcquired: Scalars['Decimal']['output'];
  totalPaid: Scalars['Decimal']['output'];
  transactions: Array<Transaction>;
  updatedAt: Scalars['DateTime']['output'];
};

export type LoanConnection = {
  __typename?: 'LoanConnection';
  edges: Array<LoanEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type LoanEdge = {
  __typename?: 'LoanEdge';
  cursor: Scalars['String']['output'];
  node: Loan;
};

export type LoanPayment = {
  __typename?: 'LoanPayment';
  amount: Scalars['Decimal']['output'];
  comission: Scalars['Decimal']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  leadPaymentReceived?: Maybe<LeadPaymentReceived>;
  loan: Loan;
  paymentMethod: PaymentMethod;
  receivedAt: Scalars['DateTime']['output'];
  transactions: Array<Transaction>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export enum LoanStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Finished = 'FINISHED',
  Renovated = 'RENOVATED'
}

export type Loantype = {
  __typename?: 'Loantype';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  loanGrantedComission: Scalars['Decimal']['output'];
  loanPaymentComission: Scalars['Decimal']['output'];
  name: Scalars['String']['output'];
  rate: Scalars['Decimal']['output'];
  updatedAt: Scalars['DateTime']['output'];
  weekDuration: Scalars['Int']['output'];
};

export type Location = {
  __typename?: 'Location';
  addresses: Array<Address>;
  id: Scalars['ID']['output'];
  municipality: Municipality;
  name: Scalars['String']['output'];
  route?: Maybe<Route>;
};

export type MonthlyFinancialData = {
  __typename?: 'MonthlyFinancialData';
  activeWeeks: Scalars['Int']['output'];
  availableCash: Scalars['Decimal']['output'];
  badDebtAmount: Scalars['Decimal']['output'];
  capitalReturn: Scalars['Decimal']['output'];
  carteraActiva: Scalars['Int']['output'];
  carteraMuerta: Scalars['Decimal']['output'];
  carteraVencida: Scalars['Int']['output'];
  cashGasolina: Scalars['Decimal']['output'];
  comissions: Scalars['Decimal']['output'];
  gainPerPayment: Scalars['Decimal']['output'];
  generalExpenses: Scalars['Decimal']['output'];
  incomes: Scalars['Decimal']['output'];
  loanDisbursements: Scalars['Decimal']['output'];
  month: Scalars['String']['output'];
  nomina: Scalars['Decimal']['output'];
  nominaInterna: Scalars['Decimal']['output'];
  operationalCashUsed: Scalars['Decimal']['output'];
  operationalProfit: Scalars['Decimal']['output'];
  paymentsCount: Scalars['Int']['output'];
  profitPercentage: Scalars['Decimal']['output'];
  profitReturn: Scalars['Decimal']['output'];
  renovados: Scalars['Int']['output'];
  salarioExterno: Scalars['Decimal']['output'];
  tokaGasolina: Scalars['Decimal']['output'];
  totalExpenses: Scalars['Decimal']['output'];
  totalGasolina: Scalars['Decimal']['output'];
  totalIncomingCash: Scalars['Decimal']['output'];
  totalInvestment: Scalars['Decimal']['output'];
  travelExpenses: Scalars['Decimal']['output'];
  viaticos: Scalars['Decimal']['output'];
  weeklyAverageExpenses: Scalars['Decimal']['output'];
  weeklyAverageIncome: Scalars['Decimal']['output'];
  weeklyAverageProfit: Scalars['Decimal']['output'];
};

export type Municipality = {
  __typename?: 'Municipality';
  id: Scalars['ID']['output'];
  locations: Array<Location>;
  name: Scalars['String']['output'];
  state: State;
};

export type Mutation = {
  __typename?: 'Mutation';
  cancelLoan: Loan;
  cancelLoanWithAccountRestore: Loan;
  changePassword: Scalars['Boolean']['output'];
  createAccount: Account;
  createBorrower: Borrower;
  createEmployee: Employee;
  createLeadPaymentReceived: LeadPaymentReceived;
  createLoan: Loan;
  createLoanPayment: LoanPayment;
  createLoansInBatch: Array<Loan>;
  createLoantype: Loantype;
  createRoute: Route;
  createTransaction: Transaction;
  createUser: User;
  deleteDocumentPhoto: Scalars['Boolean']['output'];
  deleteLoanPayment: LoanPayment;
  deleteTransaction: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  finishLoan: Loan;
  login: AuthPayload;
  logout: Scalars['Boolean']['output'];
  markLoanAsBadDebt: Loan;
  promoteToLead: Employee;
  refreshToken: AuthPayload;
  renewLoan: Loan;
  transferBetweenAccounts: Transaction;
  updateAccount: Account;
  updateBorrower: Borrower;
  updateDocumentPhoto: DocumentPhoto;
  updateEmployee: Employee;
  updateLeadPaymentReceived: LeadPaymentReceived;
  updateLoan: Loan;
  updateLoanExtended: Loan;
  updateLoanPayment: LoanPayment;
  updateLoantype: Loantype;
  updatePersonalData: PersonalData;
  updatePhone: Phone;
  updateRoute: Route;
  updateTransaction: Transaction;
  updateUser: User;
  uploadDocumentPhoto: DocumentPhoto;
};


export type MutationCancelLoanArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCancelLoanWithAccountRestoreArgs = {
  accountId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
};


export type MutationChangePasswordArgs = {
  newPassword: Scalars['String']['input'];
  oldPassword: Scalars['String']['input'];
};


export type MutationCreateAccountArgs = {
  input: CreateAccountInput;
};


export type MutationCreateBorrowerArgs = {
  input: CreateBorrowerInput;
};


export type MutationCreateEmployeeArgs = {
  input: CreateEmployeeInput;
};


export type MutationCreateLeadPaymentReceivedArgs = {
  input: CreateLeadPaymentReceivedInput;
};


export type MutationCreateLoanArgs = {
  input: CreateLoanInput;
};


export type MutationCreateLoanPaymentArgs = {
  input: CreateLoanPaymentInput;
};


export type MutationCreateLoansInBatchArgs = {
  input: CreateLoansInBatchInput;
};


export type MutationCreateLoantypeArgs = {
  input: CreateLoantypeInput;
};


export type MutationCreateRouteArgs = {
  input: CreateRouteInput;
};


export type MutationCreateTransactionArgs = {
  input: CreateTransactionInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationDeleteDocumentPhotoArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLoanPaymentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationFinishLoanArgs = {
  loanId: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationMarkLoanAsBadDebtArgs = {
  badDebtDate: Scalars['DateTime']['input'];
  loanId: Scalars['ID']['input'];
};


export type MutationPromoteToLeadArgs = {
  employeeId: Scalars['ID']['input'];
};


export type MutationRefreshTokenArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationRenewLoanArgs = {
  input: RenewLoanInput;
  loanId: Scalars['ID']['input'];
};


export type MutationTransferBetweenAccountsArgs = {
  input: TransferInput;
};


export type MutationUpdateAccountArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAccountInput;
};


export type MutationUpdateBorrowerArgs = {
  id: Scalars['ID']['input'];
  input: UpdateBorrowerInput;
};


export type MutationUpdateDocumentPhotoArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDocumentInput;
};


export type MutationUpdateEmployeeArgs = {
  id: Scalars['ID']['input'];
  input: UpdateEmployeeInput;
};


export type MutationUpdateLeadPaymentReceivedArgs = {
  id: Scalars['ID']['input'];
  input: UpdateLeadPaymentReceivedInput;
};


export type MutationUpdateLoanArgs = {
  id: Scalars['ID']['input'];
  input: UpdateLoanInput;
};


export type MutationUpdateLoanExtendedArgs = {
  id: Scalars['ID']['input'];
  input: UpdateLoanExtendedInput;
};


export type MutationUpdateLoanPaymentArgs = {
  id: Scalars['ID']['input'];
  input: UpdateLoanPaymentInput;
};


export type MutationUpdateLoantypeArgs = {
  id: Scalars['ID']['input'];
  input: UpdateLoantypeInput;
};


export type MutationUpdatePersonalDataArgs = {
  fullName: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationUpdatePhoneArgs = {
  input: UpdatePhoneInput;
};


export type MutationUpdateRouteArgs = {
  id: Scalars['ID']['input'];
  input: UpdateRouteInput;
};


export type MutationUpdateTransactionArgs = {
  id: Scalars['ID']['input'];
  input: UpdateTransactionInput;
};


export type MutationUpdateUserArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUserInput;
};


export type MutationUploadDocumentPhotoArgs = {
  input: UploadDocumentInput;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type PaymentForLeadInput = {
  amount: Scalars['Decimal']['input'];
  comission?: InputMaybe<Scalars['Decimal']['input']>;
  loanId: Scalars['ID']['input'];
  paymentMethod: PaymentMethod;
};

export enum PaymentMethod {
  Cash = 'CASH',
  MoneyTransfer = 'MONEY_TRANSFER'
}

export type PerformanceMetrics = {
  __typename?: 'PerformanceMetrics';
  activeLoansCount: Scalars['Int']['output'];
  averageTicket: Scalars['Decimal']['output'];
  finishedLoansCount: Scalars['Int']['output'];
  recoveryRate: Scalars['Decimal']['output'];
};

export type PersonalData = {
  __typename?: 'PersonalData';
  addresses: Array<Address>;
  birthDate?: Maybe<Scalars['DateTime']['output']>;
  borrower?: Maybe<Borrower>;
  clientCode: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  employee?: Maybe<Employee>;
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  phones: Array<Phone>;
  updatedAt: Scalars['DateTime']['output'];
};

export type Phone = {
  __typename?: 'Phone';
  id: Scalars['ID']['output'];
  number: Scalars['String']['output'];
  personalData: PersonalData;
};

export type Query = {
  __typename?: 'Query';
  account?: Maybe<Account>;
  accounts: Array<Account>;
  badDebtByMonth: Array<BadDebtData>;
  badDebtSummary: BadDebtSummary;
  documentPhoto?: Maybe<DocumentPhoto>;
  documentPhotos: Array<DocumentPhoto>;
  documentsWithErrors: Array<DocumentPhoto>;
  employee?: Maybe<Employee>;
  employees: Array<Employee>;
  financialReport: FinancialReport;
  getFinancialReportAnnual: AnnualFinancialReport;
  leadPaymentReceivedByLeadAndDate?: Maybe<LeadPaymentReceived>;
  loan?: Maybe<Loan>;
  loanPayments: Array<LoanPayment>;
  loanPaymentsByLeadAndDate: Array<LoanPayment>;
  loans: LoanConnection;
  loansForBadDebt: Array<Loan>;
  loantype?: Maybe<Loantype>;
  loantypes: Array<Loantype>;
  locations: Array<Location>;
  me?: Maybe<User>;
  route?: Maybe<Route>;
  routes: Array<Route>;
  searchBorrowers: Array<BorrowerSearchResult>;
  searchPersonalData: Array<PersonalData>;
  transactions: TransactionConnection;
  user?: Maybe<User>;
  users: Array<User>;
};


export type QueryAccountArgs = {
  id: Scalars['ID']['input'];
};


export type QueryAccountsArgs = {
  routeId?: InputMaybe<Scalars['ID']['input']>;
  type?: InputMaybe<AccountType>;
};


export type QueryBadDebtByMonthArgs = {
  month: Scalars['Int']['input'];
  year: Scalars['Int']['input'];
};


export type QueryDocumentPhotoArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDocumentPhotosArgs = {
  documentType?: InputMaybe<DocumentType>;
  hasErrors?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  loanId?: InputMaybe<Scalars['ID']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  personalDataId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryDocumentsWithErrorsArgs = {
  routeId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryEmployeeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEmployeesArgs = {
  routeId?: InputMaybe<Scalars['ID']['input']>;
  type?: InputMaybe<EmployeeType>;
};


export type QueryFinancialReportArgs = {
  month: Scalars['Int']['input'];
  routeIds: Array<Scalars['ID']['input']>;
  year: Scalars['Int']['input'];
};


export type QueryGetFinancialReportAnnualArgs = {
  routeIds: Array<Scalars['ID']['input']>;
  year: Scalars['Int']['input'];
};


export type QueryLeadPaymentReceivedByLeadAndDateArgs = {
  endDate: Scalars['DateTime']['input'];
  leadId: Scalars['ID']['input'];
  startDate: Scalars['DateTime']['input'];
};


export type QueryLoanArgs = {
  id: Scalars['ID']['input'];
};


export type QueryLoanPaymentsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  loanId: Scalars['ID']['input'];
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryLoanPaymentsByLeadAndDateArgs = {
  endDate: Scalars['DateTime']['input'];
  leadId: Scalars['ID']['input'];
  startDate: Scalars['DateTime']['input'];
};


export type QueryLoansArgs = {
  borrowerId?: InputMaybe<Scalars['ID']['input']>;
  fromDate?: InputMaybe<Scalars['DateTime']['input']>;
  leadId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  locationId?: InputMaybe<Scalars['ID']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  routeId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<LoanStatus>;
  toDate?: InputMaybe<Scalars['DateTime']['input']>;
};


export type QueryLoansForBadDebtArgs = {
  routeId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryLoantypeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryLoantypesArgs = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryLocationsArgs = {
  routeId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryRouteArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySearchBorrowersArgs = {
  leadId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  locationId?: InputMaybe<Scalars['ID']['input']>;
  searchTerm: Scalars['String']['input'];
};


export type QuerySearchPersonalDataArgs = {
  excludeBorrowerId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  locationId?: InputMaybe<Scalars['ID']['input']>;
  searchTerm: Scalars['String']['input'];
};


export type QueryTransactionsArgs = {
  accountId?: InputMaybe<Scalars['ID']['input']>;
  fromDate?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  routeId?: InputMaybe<Scalars['ID']['input']>;
  toDate?: InputMaybe<Scalars['DateTime']['input']>;
  type?: InputMaybe<TransactionType>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  role?: InputMaybe<UserRole>;
};

export type RenewLoanInput = {
  amountGived: Scalars['Decimal']['input'];
  loantypeId: Scalars['ID']['input'];
  requestedAmount: Scalars['Decimal']['input'];
  signDate: Scalars['DateTime']['input'];
};

export type Route = {
  __typename?: 'Route';
  accounts: Array<Account>;
  createdAt: Scalars['DateTime']['output'];
  employees: Array<Employee>;
  id: Scalars['ID']['output'];
  locations: Array<Location>;
  name: Scalars['String']['output'];
  transactions: Array<Transaction>;
  updatedAt: Scalars['DateTime']['output'];
};

export type RouteInfo = {
  __typename?: 'RouteInfo';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type State = {
  __typename?: 'State';
  id: Scalars['ID']['output'];
  municipalities: Array<Municipality>;
  name: Scalars['String']['output'];
};

export type Transaction = {
  __typename?: 'Transaction';
  amount: Scalars['Decimal']['output'];
  createdAt: Scalars['DateTime']['output'];
  date: Scalars['DateTime']['output'];
  destinationAccount?: Maybe<Account>;
  expenseSource?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  incomeSource?: Maybe<Scalars['String']['output']>;
  lead?: Maybe<Employee>;
  loan?: Maybe<Loan>;
  loanPayment?: Maybe<LoanPayment>;
  profitAmount?: Maybe<Scalars['Decimal']['output']>;
  returnToCapital?: Maybe<Scalars['Decimal']['output']>;
  route?: Maybe<Route>;
  sourceAccount: Account;
  type: TransactionType;
  updatedAt: Scalars['DateTime']['output'];
};

export type TransactionConnection = {
  __typename?: 'TransactionConnection';
  edges: Array<TransactionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type TransactionEdge = {
  __typename?: 'TransactionEdge';
  cursor: Scalars['String']['output'];
  node: Transaction;
};

export enum TransactionType {
  Expense = 'EXPENSE',
  Income = 'INCOME',
  Investment = 'INVESTMENT',
  Transfer = 'TRANSFER'
}

export type TransferInput = {
  amount: Scalars['Decimal']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  destinationAccountId: Scalars['ID']['input'];
  sourceAccountId: Scalars['ID']['input'];
};

export type UpdateAccountInput = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateBorrowerInput = {
  personalData?: InputMaybe<UpdatePersonalDataInput>;
};

export type UpdateDocumentInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  errorDescription?: InputMaybe<Scalars['String']['input']>;
  isError?: InputMaybe<Scalars['Boolean']['input']>;
  isMissing?: InputMaybe<Scalars['Boolean']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEmployeeInput = {
  routeIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  type?: InputMaybe<EmployeeType>;
};

export type UpdateLeadPaymentReceivedInput = {
  bankPaidAmount?: InputMaybe<Scalars['Decimal']['input']>;
  cashPaidAmount?: InputMaybe<Scalars['Decimal']['input']>;
  expectedAmount?: InputMaybe<Scalars['Decimal']['input']>;
  falcoAmount?: InputMaybe<Scalars['Decimal']['input']>;
  paidAmount?: InputMaybe<Scalars['Decimal']['input']>;
  payments?: InputMaybe<Array<UpdatePaymentForLeadInput>>;
};

export type UpdateLoanExtendedInput = {
  borrowerName?: InputMaybe<Scalars['String']['input']>;
  borrowerPhone?: InputMaybe<Scalars['String']['input']>;
  collateralIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  collateralPhone?: InputMaybe<Scalars['String']['input']>;
  comissionAmount?: InputMaybe<Scalars['Decimal']['input']>;
  loantypeId?: InputMaybe<Scalars['ID']['input']>;
  newCollateral?: InputMaybe<CreatePersonalDataInput>;
  requestedAmount?: InputMaybe<Scalars['Decimal']['input']>;
};

export type UpdateLoanInput = {
  amountGived?: InputMaybe<Scalars['Decimal']['input']>;
  badDebtDate?: InputMaybe<Scalars['DateTime']['input']>;
  isDeceased?: InputMaybe<Scalars['Boolean']['input']>;
  leadId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<LoanStatus>;
};

export type UpdateLoanPaymentInput = {
  amount?: InputMaybe<Scalars['Decimal']['input']>;
  comission?: InputMaybe<Scalars['Decimal']['input']>;
  paymentMethod?: InputMaybe<PaymentMethod>;
};

export type UpdateLoantypeInput = {
  interestRate?: InputMaybe<Scalars['Decimal']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  loanGrantedComission?: InputMaybe<Scalars['Decimal']['input']>;
  loanPaymentComission?: InputMaybe<Scalars['Decimal']['input']>;
  maxAmount?: InputMaybe<Scalars['Decimal']['input']>;
  maxTerm?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  rate?: InputMaybe<Scalars['Decimal']['input']>;
  weekDuration?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdatePaymentForLeadInput = {
  amount: Scalars['Decimal']['input'];
  comission?: InputMaybe<Scalars['Decimal']['input']>;
  isDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  loanId: Scalars['ID']['input'];
  paymentId?: InputMaybe<Scalars['ID']['input']>;
  paymentMethod: PaymentMethod;
};

export type UpdatePersonalDataInput = {
  birthDate?: InputMaybe<Scalars['DateTime']['input']>;
  fullName?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePhoneInput = {
  number: Scalars['String']['input'];
  personalDataId: Scalars['ID']['input'];
  phoneId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateRouteInput = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTransactionInput = {
  amount?: InputMaybe<Scalars['Decimal']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  expenseSource?: InputMaybe<Scalars['String']['input']>;
  incomeSource?: InputMaybe<Scalars['String']['input']>;
  sourceAccountId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateUserInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<UserRole>;
};

export type UploadDocumentInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  documentType: DocumentType;
  errorDescription?: InputMaybe<Scalars['String']['input']>;
  file: Scalars['Upload']['input'];
  isError?: InputMaybe<Scalars['Boolean']['input']>;
  isMissing?: InputMaybe<Scalars['Boolean']['input']>;
  loanId?: InputMaybe<Scalars['ID']['input']>;
  personalDataId?: InputMaybe<Scalars['ID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  employee?: Maybe<Employee>;
  id: Scalars['ID']['output'];
  role: UserRole;
  updatedAt: Scalars['DateTime']['output'];
};

export enum UserRole {
  Admin = 'ADMIN',
  Captura = 'CAPTURA',
  Normal = 'NORMAL'
}

export type WeeklyData = {
  __typename?: 'WeeklyData';
  date: Scalars['DateTime']['output'];
  expectedPayments: Scalars['Decimal']['output'];
  loansGranted: Scalars['Int']['output'];
  paymentsReceived: Scalars['Decimal']['output'];
  recoveryRate: Scalars['Decimal']['output'];
  week: Scalars['Int']['output'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Account: ResolverTypeWrapper<Account>;
  AccountType: AccountType;
  ActiveLoansBreakdown: ResolverTypeWrapper<ActiveLoansBreakdown>;
  Address: ResolverTypeWrapper<Address>;
  AnnualFinancialReport: ResolverTypeWrapper<AnnualFinancialReport>;
  AuthPayload: ResolverTypeWrapper<AuthPayload>;
  BadDebtData: ResolverTypeWrapper<BadDebtData>;
  BadDebtSummary: ResolverTypeWrapper<BadDebtSummary>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Borrower: ResolverTypeWrapper<Borrower>;
  BorrowerSearchResult: ResolverTypeWrapper<BorrowerSearchResult>;
  CommissionPayment: ResolverTypeWrapper<CommissionPayment>;
  ComparisonData: ResolverTypeWrapper<ComparisonData>;
  CreateAccountInput: CreateAccountInput;
  CreateAddressInput: CreateAddressInput;
  CreateBorrowerInput: CreateBorrowerInput;
  CreateEmployeeInput: CreateEmployeeInput;
  CreateLeadPaymentReceivedInput: CreateLeadPaymentReceivedInput;
  CreateLoanInput: CreateLoanInput;
  CreateLoanPaymentInput: CreateLoanPaymentInput;
  CreateLoansInBatchInput: CreateLoansInBatchInput;
  CreateLoantypeInput: CreateLoantypeInput;
  CreatePersonalDataInput: CreatePersonalDataInput;
  CreatePhoneInput: CreatePhoneInput;
  CreateRouteInput: CreateRouteInput;
  CreateSingleLoanInput: CreateSingleLoanInput;
  CreateTransactionInput: CreateTransactionInput;
  CreateUserInput: CreateUserInput;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Decimal: ResolverTypeWrapper<Scalars['Decimal']['output']>;
  DocumentPhoto: ResolverTypeWrapper<DocumentPhoto>;
  DocumentType: DocumentType;
  Employee: ResolverTypeWrapper<Employee>;
  EmployeeType: EmployeeType;
  FinancialReport: ResolverTypeWrapper<FinancialReport>;
  FinancialSummary: ResolverTypeWrapper<FinancialSummary>;
  FirstPaymentInput: FirstPaymentInput;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  LeadPaymentReceived: ResolverTypeWrapper<LeadPaymentReceived>;
  Loan: ResolverTypeWrapper<Loan>;
  LoanConnection: ResolverTypeWrapper<LoanConnection>;
  LoanEdge: ResolverTypeWrapper<LoanEdge>;
  LoanPayment: ResolverTypeWrapper<LoanPayment>;
  LoanStatus: LoanStatus;
  Loantype: ResolverTypeWrapper<Loantype>;
  Location: ResolverTypeWrapper<Location>;
  MonthlyFinancialData: ResolverTypeWrapper<MonthlyFinancialData>;
  Municipality: ResolverTypeWrapper<Municipality>;
  Mutation: ResolverTypeWrapper<{}>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PaymentForLeadInput: PaymentForLeadInput;
  PaymentMethod: PaymentMethod;
  PerformanceMetrics: ResolverTypeWrapper<PerformanceMetrics>;
  PersonalData: ResolverTypeWrapper<PersonalData>;
  Phone: ResolverTypeWrapper<Phone>;
  Query: ResolverTypeWrapper<{}>;
  RenewLoanInput: RenewLoanInput;
  Route: ResolverTypeWrapper<Route>;
  RouteInfo: ResolverTypeWrapper<RouteInfo>;
  State: ResolverTypeWrapper<State>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Transaction: ResolverTypeWrapper<Transaction>;
  TransactionConnection: ResolverTypeWrapper<TransactionConnection>;
  TransactionEdge: ResolverTypeWrapper<TransactionEdge>;
  TransactionType: TransactionType;
  TransferInput: TransferInput;
  UpdateAccountInput: UpdateAccountInput;
  UpdateBorrowerInput: UpdateBorrowerInput;
  UpdateDocumentInput: UpdateDocumentInput;
  UpdateEmployeeInput: UpdateEmployeeInput;
  UpdateLeadPaymentReceivedInput: UpdateLeadPaymentReceivedInput;
  UpdateLoanExtendedInput: UpdateLoanExtendedInput;
  UpdateLoanInput: UpdateLoanInput;
  UpdateLoanPaymentInput: UpdateLoanPaymentInput;
  UpdateLoantypeInput: UpdateLoantypeInput;
  UpdatePaymentForLeadInput: UpdatePaymentForLeadInput;
  UpdatePersonalDataInput: UpdatePersonalDataInput;
  UpdatePhoneInput: UpdatePhoneInput;
  UpdateRouteInput: UpdateRouteInput;
  UpdateTransactionInput: UpdateTransactionInput;
  UpdateUserInput: UpdateUserInput;
  Upload: ResolverTypeWrapper<Scalars['Upload']['output']>;
  UploadDocumentInput: UploadDocumentInput;
  User: ResolverTypeWrapper<User>;
  UserRole: UserRole;
  WeeklyData: ResolverTypeWrapper<WeeklyData>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Account: Account;
  ActiveLoansBreakdown: ActiveLoansBreakdown;
  Address: Address;
  AnnualFinancialReport: AnnualFinancialReport;
  AuthPayload: AuthPayload;
  BadDebtData: BadDebtData;
  BadDebtSummary: BadDebtSummary;
  Boolean: Scalars['Boolean']['output'];
  Borrower: Borrower;
  BorrowerSearchResult: BorrowerSearchResult;
  CommissionPayment: CommissionPayment;
  ComparisonData: ComparisonData;
  CreateAccountInput: CreateAccountInput;
  CreateAddressInput: CreateAddressInput;
  CreateBorrowerInput: CreateBorrowerInput;
  CreateEmployeeInput: CreateEmployeeInput;
  CreateLeadPaymentReceivedInput: CreateLeadPaymentReceivedInput;
  CreateLoanInput: CreateLoanInput;
  CreateLoanPaymentInput: CreateLoanPaymentInput;
  CreateLoansInBatchInput: CreateLoansInBatchInput;
  CreateLoantypeInput: CreateLoantypeInput;
  CreatePersonalDataInput: CreatePersonalDataInput;
  CreatePhoneInput: CreatePhoneInput;
  CreateRouteInput: CreateRouteInput;
  CreateSingleLoanInput: CreateSingleLoanInput;
  CreateTransactionInput: CreateTransactionInput;
  CreateUserInput: CreateUserInput;
  DateTime: Scalars['DateTime']['output'];
  Decimal: Scalars['Decimal']['output'];
  DocumentPhoto: DocumentPhoto;
  Employee: Employee;
  FinancialReport: FinancialReport;
  FinancialSummary: FinancialSummary;
  FirstPaymentInput: FirstPaymentInput;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  LeadPaymentReceived: LeadPaymentReceived;
  Loan: Loan;
  LoanConnection: LoanConnection;
  LoanEdge: LoanEdge;
  LoanPayment: LoanPayment;
  Loantype: Loantype;
  Location: Location;
  MonthlyFinancialData: MonthlyFinancialData;
  Municipality: Municipality;
  Mutation: {};
  PageInfo: PageInfo;
  PaymentForLeadInput: PaymentForLeadInput;
  PerformanceMetrics: PerformanceMetrics;
  PersonalData: PersonalData;
  Phone: Phone;
  Query: {};
  RenewLoanInput: RenewLoanInput;
  Route: Route;
  RouteInfo: RouteInfo;
  State: State;
  String: Scalars['String']['output'];
  Transaction: Transaction;
  TransactionConnection: TransactionConnection;
  TransactionEdge: TransactionEdge;
  TransferInput: TransferInput;
  UpdateAccountInput: UpdateAccountInput;
  UpdateBorrowerInput: UpdateBorrowerInput;
  UpdateDocumentInput: UpdateDocumentInput;
  UpdateEmployeeInput: UpdateEmployeeInput;
  UpdateLeadPaymentReceivedInput: UpdateLeadPaymentReceivedInput;
  UpdateLoanExtendedInput: UpdateLoanExtendedInput;
  UpdateLoanInput: UpdateLoanInput;
  UpdateLoanPaymentInput: UpdateLoanPaymentInput;
  UpdateLoantypeInput: UpdateLoantypeInput;
  UpdatePaymentForLeadInput: UpdatePaymentForLeadInput;
  UpdatePersonalDataInput: UpdatePersonalDataInput;
  UpdatePhoneInput: UpdatePhoneInput;
  UpdateRouteInput: UpdateRouteInput;
  UpdateTransactionInput: UpdateTransactionInput;
  UpdateUserInput: UpdateUserInput;
  Upload: Scalars['Upload']['output'];
  UploadDocumentInput: UploadDocumentInput;
  User: User;
  WeeklyData: WeeklyData;
}>;

export type AuthDirectiveArgs = { };

export type AuthDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = AuthDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type RequireRoleDirectiveArgs = {
  roles: Array<UserRole>;
};

export type RequireRoleDirectiveResolver<Result, Parent, ContextType = GraphQLContext, Args = RequireRoleDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type AccountResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Account'] = ResolversParentTypes['Account']> = ResolversObject<{
  accountBalance?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  amount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  routes?: Resolver<Array<ResolversTypes['Route']>, ParentType, ContextType>;
  transactionsDestination?: Resolver<Array<ResolversTypes['Transaction']>, ParentType, ContextType>;
  transactionsSource?: Resolver<Array<ResolversTypes['Transaction']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['AccountType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ActiveLoansBreakdownResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ActiveLoansBreakdown'] = ResolversParentTypes['ActiveLoansBreakdown']> = ResolversObject<{
  alCorriente?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  carteraVencida?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AddressResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Address'] = ResolversParentTypes['Address']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  location?: Resolver<ResolversTypes['Location'], ParentType, ContextType>;
  numberExterior?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  numberInterior?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  personalData?: Resolver<ResolversTypes['PersonalData'], ParentType, ContextType>;
  street?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  zipCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AnnualFinancialReportResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AnnualFinancialReport'] = ResolversParentTypes['AnnualFinancialReport']> = ResolversObject<{
  annualWeeklyAverageExpenses?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  annualWeeklyAverageIncome?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  annualWeeklyAverageProfit?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  data?: Resolver<Array<ResolversTypes['MonthlyFinancialData']>, ParentType, ContextType>;
  months?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  routes?: Resolver<Array<ResolversTypes['RouteInfo']>, ParentType, ContextType>;
  totalActiveWeeks?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AuthPayloadResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['AuthPayload'] = ResolversParentTypes['AuthPayload']> = ResolversObject<{
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BadDebtDataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BadDebtData'] = ResolversParentTypes['BadDebtData']> = ResolversObject<{
  loanCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  routeId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  routeName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  totalAmount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BadDebtSummaryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BadDebtSummary'] = ResolversParentTypes['BadDebtSummary']> = ResolversObject<{
  byRoute?: Resolver<Array<ResolversTypes['BadDebtData']>, ParentType, ContextType>;
  totalAmount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  totalLoans?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BorrowerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Borrower'] = ResolversParentTypes['Borrower']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  loanFinishedCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  loans?: Resolver<Array<ResolversTypes['Loan']>, ParentType, ContextType>;
  personalData?: Resolver<ResolversTypes['PersonalData'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BorrowerSearchResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BorrowerSearchResult'] = ResolversParentTypes['BorrowerSearchResult']> = ResolversObject<{
  hasActiveLoans?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isFromCurrentLocation?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  loanFinishedCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  locationId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  locationName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  pendingDebtAmount?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  personalData?: Resolver<ResolversTypes['PersonalData'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CommissionPaymentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['CommissionPayment'] = ResolversParentTypes['CommissionPayment']> = ResolversObject<{
  amount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  employee?: Resolver<ResolversTypes['Employee'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  loan?: Resolver<ResolversTypes['Loan'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ComparisonDataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ComparisonData'] = ResolversParentTypes['ComparisonData']> = ResolversObject<{
  growth?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  previousMonth?: Resolver<ResolversTypes['FinancialSummary'], ParentType, ContextType>;
  trend?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export interface DecimalScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Decimal'], any> {
  name: 'Decimal';
}

export type DocumentPhotoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DocumentPhoto'] = ResolversParentTypes['DocumentPhoto']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  documentType?: Resolver<ResolversTypes['DocumentType'], ParentType, ContextType>;
  errorDescription?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isError?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isMissing?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  loan?: Resolver<Maybe<ResolversTypes['Loan']>, ParentType, ContextType>;
  personalData?: Resolver<Maybe<ResolversTypes['PersonalData']>, ParentType, ContextType>;
  photoUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  publicId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  uploadedBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type EmployeeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Employee'] = ResolversParentTypes['Employee']> = ResolversObject<{
  commissionPayments?: Resolver<Array<ResolversTypes['CommissionPayment']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  loansGranted?: Resolver<Array<ResolversTypes['Loan']>, ParentType, ContextType>;
  loansManagedAsLead?: Resolver<Array<ResolversTypes['Loan']>, ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['Location']>, ParentType, ContextType>;
  personalData?: Resolver<ResolversTypes['PersonalData'], ParentType, ContextType>;
  routes?: Resolver<Array<ResolversTypes['Route']>, ParentType, ContextType>;
  transactions?: Resolver<Array<ResolversTypes['Transaction']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['EmployeeType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FinancialReportResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['FinancialReport'] = ResolversParentTypes['FinancialReport']> = ResolversObject<{
  comparisonData?: Resolver<Maybe<ResolversTypes['ComparisonData']>, ParentType, ContextType>;
  performanceMetrics?: Resolver<ResolversTypes['PerformanceMetrics'], ParentType, ContextType>;
  summary?: Resolver<ResolversTypes['FinancialSummary'], ParentType, ContextType>;
  weeklyData?: Resolver<Array<ResolversTypes['WeeklyData']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FinancialSummaryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['FinancialSummary'] = ResolversParentTypes['FinancialSummary']> = ResolversObject<{
  activeLoans?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  activeLoansBreakdown?: Resolver<ResolversTypes['ActiveLoansBreakdown'], ParentType, ContextType>;
  averagePayment?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  pendingAmount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  totalPaid?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  totalPortfolio?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type LeadPaymentReceivedResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LeadPaymentReceived'] = ResolversParentTypes['LeadPaymentReceived']> = ResolversObject<{
  agent?: Resolver<ResolversTypes['Employee'], ParentType, ContextType>;
  bankPaidAmount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  cashPaidAmount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  expectedAmount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  falcoAmount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lead?: Resolver<ResolversTypes['Employee'], ParentType, ContextType>;
  paidAmount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  paymentStatus?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  payments?: Resolver<Array<ResolversTypes['LoanPayment']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LoanResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Loan'] = ResolversParentTypes['Loan']> = ResolversObject<{
  amountGived?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  badDebtDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  borrower?: Resolver<ResolversTypes['Borrower'], ParentType, ContextType>;
  collaterals?: Resolver<Array<ResolversTypes['PersonalData']>, ParentType, ContextType>;
  comissionAmount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  documentPhotos?: Resolver<Array<ResolversTypes['DocumentPhoto']>, ParentType, ContextType>;
  expectedWeeklyPayment?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  finishedDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  grantor?: Resolver<ResolversTypes['Employee'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isDeceased?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lead?: Resolver<ResolversTypes['Employee'], ParentType, ContextType>;
  loantype?: Resolver<ResolversTypes['Loantype'], ParentType, ContextType>;
  payments?: Resolver<Array<ResolversTypes['LoanPayment']>, ParentType, ContextType>;
  pendingAmountStored?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  previousLoan?: Resolver<Maybe<ResolversTypes['Loan']>, ParentType, ContextType>;
  profitAmount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  renewedBy?: Resolver<Maybe<ResolversTypes['Loan']>, ParentType, ContextType>;
  requestedAmount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  signDate?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  snapshotLeadAssignedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  snapshotLeadId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  snapshotLeadName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  snapshotRouteId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  snapshotRouteName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['LoanStatus'], ParentType, ContextType>;
  totalDebtAcquired?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  totalPaid?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  transactions?: Resolver<Array<ResolversTypes['Transaction']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LoanConnectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LoanConnection'] = ResolversParentTypes['LoanConnection']> = ResolversObject<{
  edges?: Resolver<Array<ResolversTypes['LoanEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LoanEdgeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LoanEdge'] = ResolversParentTypes['LoanEdge']> = ResolversObject<{
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Loan'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LoanPaymentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LoanPayment'] = ResolversParentTypes['LoanPayment']> = ResolversObject<{
  amount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  comission?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  leadPaymentReceived?: Resolver<Maybe<ResolversTypes['LeadPaymentReceived']>, ParentType, ContextType>;
  loan?: Resolver<ResolversTypes['Loan'], ParentType, ContextType>;
  paymentMethod?: Resolver<ResolversTypes['PaymentMethod'], ParentType, ContextType>;
  receivedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  transactions?: Resolver<Array<ResolversTypes['Transaction']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LoantypeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Loantype'] = ResolversParentTypes['Loantype']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  loanGrantedComission?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  loanPaymentComission?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  rate?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  weekDuration?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LocationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Location'] = ResolversParentTypes['Location']> = ResolversObject<{
  addresses?: Resolver<Array<ResolversTypes['Address']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  municipality?: Resolver<ResolversTypes['Municipality'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  route?: Resolver<Maybe<ResolversTypes['Route']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MonthlyFinancialDataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MonthlyFinancialData'] = ResolversParentTypes['MonthlyFinancialData']> = ResolversObject<{
  activeWeeks?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  availableCash?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  badDebtAmount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  capitalReturn?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  carteraActiva?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  carteraMuerta?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  carteraVencida?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  cashGasolina?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  comissions?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  gainPerPayment?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  generalExpenses?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  incomes?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  loanDisbursements?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  month?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nomina?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  nominaInterna?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  operationalCashUsed?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  operationalProfit?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  paymentsCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  profitPercentage?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  profitReturn?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  renovados?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  salarioExterno?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  tokaGasolina?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  totalExpenses?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  totalGasolina?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  totalIncomingCash?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  totalInvestment?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  travelExpenses?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  viaticos?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  weeklyAverageExpenses?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  weeklyAverageIncome?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  weeklyAverageProfit?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MunicipalityResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Municipality'] = ResolversParentTypes['Municipality']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  locations?: Resolver<Array<ResolversTypes['Location']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['State'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  cancelLoan?: Resolver<ResolversTypes['Loan'], ParentType, ContextType, RequireFields<MutationCancelLoanArgs, 'id'>>;
  cancelLoanWithAccountRestore?: Resolver<ResolversTypes['Loan'], ParentType, ContextType, RequireFields<MutationCancelLoanWithAccountRestoreArgs, 'accountId' | 'id'>>;
  changePassword?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationChangePasswordArgs, 'newPassword' | 'oldPassword'>>;
  createAccount?: Resolver<ResolversTypes['Account'], ParentType, ContextType, RequireFields<MutationCreateAccountArgs, 'input'>>;
  createBorrower?: Resolver<ResolversTypes['Borrower'], ParentType, ContextType, RequireFields<MutationCreateBorrowerArgs, 'input'>>;
  createEmployee?: Resolver<ResolversTypes['Employee'], ParentType, ContextType, RequireFields<MutationCreateEmployeeArgs, 'input'>>;
  createLeadPaymentReceived?: Resolver<ResolversTypes['LeadPaymentReceived'], ParentType, ContextType, RequireFields<MutationCreateLeadPaymentReceivedArgs, 'input'>>;
  createLoan?: Resolver<ResolversTypes['Loan'], ParentType, ContextType, RequireFields<MutationCreateLoanArgs, 'input'>>;
  createLoanPayment?: Resolver<ResolversTypes['LoanPayment'], ParentType, ContextType, RequireFields<MutationCreateLoanPaymentArgs, 'input'>>;
  createLoansInBatch?: Resolver<Array<ResolversTypes['Loan']>, ParentType, ContextType, RequireFields<MutationCreateLoansInBatchArgs, 'input'>>;
  createLoantype?: Resolver<ResolversTypes['Loantype'], ParentType, ContextType, RequireFields<MutationCreateLoantypeArgs, 'input'>>;
  createRoute?: Resolver<ResolversTypes['Route'], ParentType, ContextType, RequireFields<MutationCreateRouteArgs, 'input'>>;
  createTransaction?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType, RequireFields<MutationCreateTransactionArgs, 'input'>>;
  createUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  deleteDocumentPhoto?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteDocumentPhotoArgs, 'id'>>;
  deleteLoanPayment?: Resolver<ResolversTypes['LoanPayment'], ParentType, ContextType, RequireFields<MutationDeleteLoanPaymentArgs, 'id'>>;
  deleteTransaction?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteTransactionArgs, 'id'>>;
  deleteUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'id'>>;
  finishLoan?: Resolver<ResolversTypes['Loan'], ParentType, ContextType, RequireFields<MutationFinishLoanArgs, 'loanId'>>;
  login?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'email' | 'password'>>;
  logout?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  markLoanAsBadDebt?: Resolver<ResolversTypes['Loan'], ParentType, ContextType, RequireFields<MutationMarkLoanAsBadDebtArgs, 'badDebtDate' | 'loanId'>>;
  promoteToLead?: Resolver<ResolversTypes['Employee'], ParentType, ContextType, RequireFields<MutationPromoteToLeadArgs, 'employeeId'>>;
  refreshToken?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationRefreshTokenArgs, 'refreshToken'>>;
  renewLoan?: Resolver<ResolversTypes['Loan'], ParentType, ContextType, RequireFields<MutationRenewLoanArgs, 'input' | 'loanId'>>;
  transferBetweenAccounts?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType, RequireFields<MutationTransferBetweenAccountsArgs, 'input'>>;
  updateAccount?: Resolver<ResolversTypes['Account'], ParentType, ContextType, RequireFields<MutationUpdateAccountArgs, 'id' | 'input'>>;
  updateBorrower?: Resolver<ResolversTypes['Borrower'], ParentType, ContextType, RequireFields<MutationUpdateBorrowerArgs, 'id' | 'input'>>;
  updateDocumentPhoto?: Resolver<ResolversTypes['DocumentPhoto'], ParentType, ContextType, RequireFields<MutationUpdateDocumentPhotoArgs, 'id' | 'input'>>;
  updateEmployee?: Resolver<ResolversTypes['Employee'], ParentType, ContextType, RequireFields<MutationUpdateEmployeeArgs, 'id' | 'input'>>;
  updateLeadPaymentReceived?: Resolver<ResolversTypes['LeadPaymentReceived'], ParentType, ContextType, RequireFields<MutationUpdateLeadPaymentReceivedArgs, 'id' | 'input'>>;
  updateLoan?: Resolver<ResolversTypes['Loan'], ParentType, ContextType, RequireFields<MutationUpdateLoanArgs, 'id' | 'input'>>;
  updateLoanExtended?: Resolver<ResolversTypes['Loan'], ParentType, ContextType, RequireFields<MutationUpdateLoanExtendedArgs, 'id' | 'input'>>;
  updateLoanPayment?: Resolver<ResolversTypes['LoanPayment'], ParentType, ContextType, RequireFields<MutationUpdateLoanPaymentArgs, 'id' | 'input'>>;
  updateLoantype?: Resolver<ResolversTypes['Loantype'], ParentType, ContextType, RequireFields<MutationUpdateLoantypeArgs, 'id' | 'input'>>;
  updatePersonalData?: Resolver<ResolversTypes['PersonalData'], ParentType, ContextType, RequireFields<MutationUpdatePersonalDataArgs, 'fullName' | 'id'>>;
  updatePhone?: Resolver<ResolversTypes['Phone'], ParentType, ContextType, RequireFields<MutationUpdatePhoneArgs, 'input'>>;
  updateRoute?: Resolver<ResolversTypes['Route'], ParentType, ContextType, RequireFields<MutationUpdateRouteArgs, 'id' | 'input'>>;
  updateTransaction?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType, RequireFields<MutationUpdateTransactionArgs, 'id' | 'input'>>;
  updateUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'id' | 'input'>>;
  uploadDocumentPhoto?: Resolver<ResolversTypes['DocumentPhoto'], ParentType, ContextType, RequireFields<MutationUploadDocumentPhotoArgs, 'input'>>;
}>;

export type PageInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = ResolversObject<{
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PerformanceMetricsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PerformanceMetrics'] = ResolversParentTypes['PerformanceMetrics']> = ResolversObject<{
  activeLoansCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  averageTicket?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  finishedLoansCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  recoveryRate?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PersonalDataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PersonalData'] = ResolversParentTypes['PersonalData']> = ResolversObject<{
  addresses?: Resolver<Array<ResolversTypes['Address']>, ParentType, ContextType>;
  birthDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  borrower?: Resolver<Maybe<ResolversTypes['Borrower']>, ParentType, ContextType>;
  clientCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  employee?: Resolver<Maybe<ResolversTypes['Employee']>, ParentType, ContextType>;
  fullName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  phones?: Resolver<Array<ResolversTypes['Phone']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PhoneResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Phone'] = ResolversParentTypes['Phone']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  number?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  personalData?: Resolver<ResolversTypes['PersonalData'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  account?: Resolver<Maybe<ResolversTypes['Account']>, ParentType, ContextType, RequireFields<QueryAccountArgs, 'id'>>;
  accounts?: Resolver<Array<ResolversTypes['Account']>, ParentType, ContextType, Partial<QueryAccountsArgs>>;
  badDebtByMonth?: Resolver<Array<ResolversTypes['BadDebtData']>, ParentType, ContextType, RequireFields<QueryBadDebtByMonthArgs, 'month' | 'year'>>;
  badDebtSummary?: Resolver<ResolversTypes['BadDebtSummary'], ParentType, ContextType>;
  documentPhoto?: Resolver<Maybe<ResolversTypes['DocumentPhoto']>, ParentType, ContextType, RequireFields<QueryDocumentPhotoArgs, 'id'>>;
  documentPhotos?: Resolver<Array<ResolversTypes['DocumentPhoto']>, ParentType, ContextType, Partial<QueryDocumentPhotosArgs>>;
  documentsWithErrors?: Resolver<Array<ResolversTypes['DocumentPhoto']>, ParentType, ContextType, Partial<QueryDocumentsWithErrorsArgs>>;
  employee?: Resolver<Maybe<ResolversTypes['Employee']>, ParentType, ContextType, RequireFields<QueryEmployeeArgs, 'id'>>;
  employees?: Resolver<Array<ResolversTypes['Employee']>, ParentType, ContextType, Partial<QueryEmployeesArgs>>;
  financialReport?: Resolver<ResolversTypes['FinancialReport'], ParentType, ContextType, RequireFields<QueryFinancialReportArgs, 'month' | 'routeIds' | 'year'>>;
  getFinancialReportAnnual?: Resolver<ResolversTypes['AnnualFinancialReport'], ParentType, ContextType, RequireFields<QueryGetFinancialReportAnnualArgs, 'routeIds' | 'year'>>;
  leadPaymentReceivedByLeadAndDate?: Resolver<Maybe<ResolversTypes['LeadPaymentReceived']>, ParentType, ContextType, RequireFields<QueryLeadPaymentReceivedByLeadAndDateArgs, 'endDate' | 'leadId' | 'startDate'>>;
  loan?: Resolver<Maybe<ResolversTypes['Loan']>, ParentType, ContextType, RequireFields<QueryLoanArgs, 'id'>>;
  loanPayments?: Resolver<Array<ResolversTypes['LoanPayment']>, ParentType, ContextType, RequireFields<QueryLoanPaymentsArgs, 'loanId'>>;
  loanPaymentsByLeadAndDate?: Resolver<Array<ResolversTypes['LoanPayment']>, ParentType, ContextType, RequireFields<QueryLoanPaymentsByLeadAndDateArgs, 'endDate' | 'leadId' | 'startDate'>>;
  loans?: Resolver<ResolversTypes['LoanConnection'], ParentType, ContextType, Partial<QueryLoansArgs>>;
  loansForBadDebt?: Resolver<Array<ResolversTypes['Loan']>, ParentType, ContextType, Partial<QueryLoansForBadDebtArgs>>;
  loantype?: Resolver<Maybe<ResolversTypes['Loantype']>, ParentType, ContextType, RequireFields<QueryLoantypeArgs, 'id'>>;
  loantypes?: Resolver<Array<ResolversTypes['Loantype']>, ParentType, ContextType, Partial<QueryLoantypesArgs>>;
  locations?: Resolver<Array<ResolversTypes['Location']>, ParentType, ContextType, Partial<QueryLocationsArgs>>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  route?: Resolver<Maybe<ResolversTypes['Route']>, ParentType, ContextType, RequireFields<QueryRouteArgs, 'id'>>;
  routes?: Resolver<Array<ResolversTypes['Route']>, ParentType, ContextType>;
  searchBorrowers?: Resolver<Array<ResolversTypes['BorrowerSearchResult']>, ParentType, ContextType, RequireFields<QuerySearchBorrowersArgs, 'searchTerm'>>;
  searchPersonalData?: Resolver<Array<ResolversTypes['PersonalData']>, ParentType, ContextType, RequireFields<QuerySearchPersonalDataArgs, 'searchTerm'>>;
  transactions?: Resolver<ResolversTypes['TransactionConnection'], ParentType, ContextType, Partial<QueryTransactionsArgs>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, Partial<QueryUsersArgs>>;
}>;

export type RouteResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Route'] = ResolversParentTypes['Route']> = ResolversObject<{
  accounts?: Resolver<Array<ResolversTypes['Account']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  employees?: Resolver<Array<ResolversTypes['Employee']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  locations?: Resolver<Array<ResolversTypes['Location']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  transactions?: Resolver<Array<ResolversTypes['Transaction']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type RouteInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RouteInfo'] = ResolversParentTypes['RouteInfo']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type StateResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['State'] = ResolversParentTypes['State']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  municipalities?: Resolver<Array<ResolversTypes['Municipality']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TransactionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Transaction'] = ResolversParentTypes['Transaction']> = ResolversObject<{
  amount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  date?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  destinationAccount?: Resolver<Maybe<ResolversTypes['Account']>, ParentType, ContextType>;
  expenseSource?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  incomeSource?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lead?: Resolver<Maybe<ResolversTypes['Employee']>, ParentType, ContextType>;
  loan?: Resolver<Maybe<ResolversTypes['Loan']>, ParentType, ContextType>;
  loanPayment?: Resolver<Maybe<ResolversTypes['LoanPayment']>, ParentType, ContextType>;
  profitAmount?: Resolver<Maybe<ResolversTypes['Decimal']>, ParentType, ContextType>;
  returnToCapital?: Resolver<Maybe<ResolversTypes['Decimal']>, ParentType, ContextType>;
  route?: Resolver<Maybe<ResolversTypes['Route']>, ParentType, ContextType>;
  sourceAccount?: Resolver<ResolversTypes['Account'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['TransactionType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TransactionConnectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TransactionConnection'] = ResolversParentTypes['TransactionConnection']> = ResolversObject<{
  edges?: Resolver<Array<ResolversTypes['TransactionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TransactionEdgeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TransactionEdge'] = ResolversParentTypes['TransactionEdge']> = ResolversObject<{
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface UploadScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Upload'], any> {
  name: 'Upload';
}

export type UserResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  employee?: Resolver<Maybe<ResolversTypes['Employee']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['UserRole'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WeeklyDataResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['WeeklyData'] = ResolversParentTypes['WeeklyData']> = ResolversObject<{
  date?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  expectedPayments?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  loansGranted?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  paymentsReceived?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  recoveryRate?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  week?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  Account?: AccountResolvers<ContextType>;
  ActiveLoansBreakdown?: ActiveLoansBreakdownResolvers<ContextType>;
  Address?: AddressResolvers<ContextType>;
  AnnualFinancialReport?: AnnualFinancialReportResolvers<ContextType>;
  AuthPayload?: AuthPayloadResolvers<ContextType>;
  BadDebtData?: BadDebtDataResolvers<ContextType>;
  BadDebtSummary?: BadDebtSummaryResolvers<ContextType>;
  Borrower?: BorrowerResolvers<ContextType>;
  BorrowerSearchResult?: BorrowerSearchResultResolvers<ContextType>;
  CommissionPayment?: CommissionPaymentResolvers<ContextType>;
  ComparisonData?: ComparisonDataResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Decimal?: GraphQLScalarType;
  DocumentPhoto?: DocumentPhotoResolvers<ContextType>;
  Employee?: EmployeeResolvers<ContextType>;
  FinancialReport?: FinancialReportResolvers<ContextType>;
  FinancialSummary?: FinancialSummaryResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  LeadPaymentReceived?: LeadPaymentReceivedResolvers<ContextType>;
  Loan?: LoanResolvers<ContextType>;
  LoanConnection?: LoanConnectionResolvers<ContextType>;
  LoanEdge?: LoanEdgeResolvers<ContextType>;
  LoanPayment?: LoanPaymentResolvers<ContextType>;
  Loantype?: LoantypeResolvers<ContextType>;
  Location?: LocationResolvers<ContextType>;
  MonthlyFinancialData?: MonthlyFinancialDataResolvers<ContextType>;
  Municipality?: MunicipalityResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  PerformanceMetrics?: PerformanceMetricsResolvers<ContextType>;
  PersonalData?: PersonalDataResolvers<ContextType>;
  Phone?: PhoneResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Route?: RouteResolvers<ContextType>;
  RouteInfo?: RouteInfoResolvers<ContextType>;
  State?: StateResolvers<ContextType>;
  Transaction?: TransactionResolvers<ContextType>;
  TransactionConnection?: TransactionConnectionResolvers<ContextType>;
  TransactionEdge?: TransactionEdgeResolvers<ContextType>;
  Upload?: GraphQLScalarType;
  User?: UserResolvers<ContextType>;
  WeeklyData?: WeeklyDataResolvers<ContextType>;
}>;

export type DirectiveResolvers<ContextType = GraphQLContext> = ResolversObject<{
  auth?: AuthDirectiveResolver<any, any, ContextType>;
  requireRole?: RequireRoleDirectiveResolver<any, any, ContextType>;
}>;
