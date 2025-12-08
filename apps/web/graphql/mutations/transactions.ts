import { gql } from '@apollo/client'

// ============================================================
// LOAN MUTATIONS - Para Tab de Créditos
// ============================================================

export const CREATE_LOAN = gql`
  mutation CreateLoan($input: CreateLoanInput!) {
    createLoan(input: $input) {
      id
      requestedAmount
      amountGived
      signDate
      comissionAmount
      status
      borrower {
        id
        personalData {
          fullName
        }
      }
    }
  }
`

export const UPDATE_LOAN = gql`
  mutation UpdateLoan($id: ID!, $input: UpdateLoanInput!) {
    updateLoan(id: $id, input: $input) {
      id
      amountGived
      status
      leadId
    }
  }
`

export const RENEW_LOAN = gql`
  mutation RenewLoan($loanId: ID!, $input: RenewLoanInput!) {
    renewLoan(loanId: $loanId, input: $input) {
      id
      requestedAmount
      amountGived
      signDate
      previousLoan {
        id
        status
      }
    }
  }
`

export const CANCEL_LOAN = gql`
  mutation CancelLoan($id: ID!) {
    cancelLoan(id: $id) {
      id
      status
    }
  }
`

// ============================================================
// PAYMENT MUTATIONS - Para Tab de Abonos
// ============================================================

export const CREATE_LOAN_PAYMENT = gql`
  mutation CreateLoanPayment($input: CreateLoanPaymentInput!) {
    createLoanPayment(input: $input) {
      id
      amount
      comission
      receivedAt
      paymentMethod
      loan {
        id
        totalPaid
        pendingAmountStored
        status
      }
    }
  }
`

export const UPDATE_LOAN_PAYMENT = gql`
  mutation UpdateLoanPayment($id: ID!, $input: UpdateLoanPaymentInput!) {
    updateLoanPayment(id: $id, input: $input) {
      id
      amount
      comission
      receivedAt
      paymentMethod
      loan {
        id
        totalPaid
        pendingAmountStored
        status
      }
    }
  }
`

export const DELETE_LOAN_PAYMENT = gql`
  mutation DeleteLoanPayment($id: ID!) {
    deleteLoanPayment(id: $id) {
      id
      loan {
        id
        totalPaid
        pendingAmountStored
        status
      }
    }
  }
`

export const CREATE_LEAD_PAYMENT_RECEIVED = gql`
  mutation CreateLeadPaymentReceived($input: CreateLeadPaymentReceivedInput!) {
    createLeadPaymentReceived(input: $input) {
      id
      expectedAmount
      paidAmount
      cashPaidAmount
      bankPaidAmount
      paymentStatus
      payments {
        id
        amount
        loan {
          id
        }
      }
    }
  }
`

export const UPDATE_LEAD_PAYMENT_RECEIVED = gql`
  mutation UpdateLeadPaymentReceived($id: ID!, $input: UpdateLeadPaymentReceivedInput!) {
    updateLeadPaymentReceived(id: $id, input: $input) {
      id
      expectedAmount
      paidAmount
      cashPaidAmount
      bankPaidAmount
      paymentStatus
      payments {
        id
        amount
        comission
        paymentMethod
        loan {
          id
          totalPaid
          pendingAmountStored
          status
        }
      }
    }
  }
`

// ============================================================
// TRANSACTION MUTATIONS - Para Tab de Gastos y Transferencias
// ============================================================

export const CREATE_TRANSACTION = gql`
  mutation CreateTransaction($input: CreateTransactionInput!) {
    createTransaction(input: $input) {
      id
      amount
      date
      type
      incomeSource
      expenseSource
      sourceAccount {
        id
        name
        amount
      }
      destinationAccount {
        id
        name
        amount
      }
      route {
        id
        name
      }
    }
  }
`

export const TRANSFER_BETWEEN_ACCOUNTS = gql`
  mutation TransferBetweenAccounts($input: TransferInput!) {
    transferBetweenAccounts(input: $input) {
      id
      amount
      type
      sourceAccount {
        id
        name
        amount
      }
      destinationAccount {
        id
        name
        amount
      }
    }
  }
`

// ============================================================
// ACCOUNT MUTATIONS
// ============================================================

export const UPDATE_ACCOUNT = gql`
  mutation UpdateAccount($id: ID!, $input: UpdateAccountInput!) {
    updateAccount(id: $id, input: $input) {
      id
      name
      amount
    }
  }
`
