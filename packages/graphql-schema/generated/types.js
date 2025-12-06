export var AccountType;
(function (AccountType) {
    AccountType["Bank"] = "BANK";
    AccountType["EmployeeCashFund"] = "EMPLOYEE_CASH_FUND";
    AccountType["OfficeCashFund"] = "OFFICE_CASH_FUND";
    AccountType["PrepaidGas"] = "PREPAID_GAS";
    AccountType["TravelExpenses"] = "TRAVEL_EXPENSES";
})(AccountType || (AccountType = {}));
export var DocumentType;
(function (DocumentType) {
    DocumentType["Domicilio"] = "DOMICILIO";
    DocumentType["Ine"] = "INE";
    DocumentType["Otro"] = "OTRO";
    DocumentType["Pagare"] = "PAGARE";
})(DocumentType || (DocumentType = {}));
export var EmployeeType;
(function (EmployeeType) {
    EmployeeType["Lead"] = "LEAD";
    EmployeeType["RouteAssistent"] = "ROUTE_ASSISTENT";
    EmployeeType["RouteLead"] = "ROUTE_LEAD";
})(EmployeeType || (EmployeeType = {}));
export var LoanStatus;
(function (LoanStatus) {
    LoanStatus["Active"] = "ACTIVE";
    LoanStatus["Cancelled"] = "CANCELLED";
    LoanStatus["Finished"] = "FINISHED";
    LoanStatus["Renovated"] = "RENOVATED";
})(LoanStatus || (LoanStatus = {}));
export var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["Cash"] = "CASH";
    PaymentMethod["MoneyTransfer"] = "MONEY_TRANSFER";
})(PaymentMethod || (PaymentMethod = {}));
export var TransactionType;
(function (TransactionType) {
    TransactionType["Expense"] = "EXPENSE";
    TransactionType["Income"] = "INCOME";
    TransactionType["Investment"] = "INVESTMENT";
    TransactionType["Transfer"] = "TRANSFER";
})(TransactionType || (TransactionType = {}));
export var UserRole;
(function (UserRole) {
    UserRole["Admin"] = "ADMIN";
    UserRole["Captura"] = "CAPTURA";
    UserRole["Normal"] = "NORMAL";
})(UserRole || (UserRole = {}));
