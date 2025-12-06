/**
 * Script de migración de datos desde schema "public" a "solufacil_mono"
 *
 * Uso: npx tsx scripts/migrate-data.ts
 *
 * Este script:
 * 1. Conecta a ambos schemas en la misma base de datos
 * 2. Copia datos mapeando nombres de columnas diferentes
 * 3. Reporta diferencias y errores encontrados
 */

import 'dotenv/config'
import { Pool } from 'pg'

const SOURCE_SCHEMA = 'public'
const TARGET_SCHEMA = 'solufacil_mono'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

interface MigrationResult {
  table: string
  sourceCount: number
  targetCount: number
  success: boolean
  error?: string
}

// Orden de migración (respetando foreign keys)
const MIGRATION_ORDER = [
  // Sin dependencias
  'State',
  'Route',
  'Account',
  'LeadPaymentType',
  // Dependencias nivel 1
  'User',
  'Municipality',
  // Dependencias nivel 2
  'PersonalData',
  'Location',
  'ReportConfig',
  'TelegramUser',
  // Dependencias nivel 3
  'Phone',
  'Address',
  'Employee',
  'Borrower',
  'Loantype',
  // Dependencias nivel 4
  'PortfolioCleanup',
  'LeadPaymentReceived',
  // Dependencias nivel 5
  'Loan',
  // Dependencias nivel 6
  'LoanPayment',
  'DocumentPhoto',
  'CommissionPayment',
  'Transaction',
  // Dependencias nivel 7
  'FalcoCompensatoryPayment',
  // Logs y auditoría
  'AuditLog',
  'ReportExecutionLog',
  'DocumentNotificationLog',
]

async function migrateTable(tableName: string): Promise<MigrationResult> {
  try {
    // Verificar que la tabla existe en origen
    const checkSource = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = $2
      )
    `, [SOURCE_SCHEMA, tableName])

    if (!checkSource.rows[0].exists) {
      return {
        table: tableName,
        sourceCount: 0,
        targetCount: 0,
        success: true,
        error: `Table does not exist in source (skipped)`,
      }
    }

    // Contar registros en origen
    const countResult = await pool.query(`SELECT COUNT(*) as count FROM "${SOURCE_SCHEMA}"."${tableName}"`)
    const sourceCount = parseInt(countResult.rows[0].count, 10)

    if (sourceCount === 0) {
      return {
        table: tableName,
        sourceCount: 0,
        targetCount: 0,
        success: true,
      }
    }

    // Generar query específico por tabla con casts de enums
    let insertQuery = ''

    switch (tableName) {
      case 'State':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."State" (id, name, "createdAt", "updatedAt")
          SELECT id, name, NOW(), NOW()
          FROM "${SOURCE_SCHEMA}"."State"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'Route':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."Route" (id, name)
          SELECT id, name
          FROM "${SOURCE_SCHEMA}"."Route"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'Account':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."Account" (id, name, type, amount, "createdAt", "updatedAt")
          SELECT id, name, type::text::"${TARGET_SCHEMA}"."AccountType", amount, "createdAt", COALESCE("updatedAt", "createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."Account"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'LeadPaymentType':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."LeadPaymentType" (id, type)
          SELECT id, type
          FROM "${SOURCE_SCHEMA}"."LeadPaymentType"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'User':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."User" (id, name, email, password, role, "createdAt")
          SELECT id, COALESCE(name, ''), email, password, role::text::"${TARGET_SCHEMA}"."UserRole", "createdAt"
          FROM "${SOURCE_SCHEMA}"."User"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'Municipality':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."Municipality" (id, name, state, "createdAt", "updatedAt")
          SELECT id, name, state, NOW(), NOW()
          FROM "${SOURCE_SCHEMA}"."Municipality"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'PersonalData':
        // clientCode is unique, so we use the id as fallback for NULL values
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."PersonalData" (id, "fullName", "clientCode", "birthDate", "createdAt", "updatedAt")
          SELECT id, "fullName", COALESCE(NULLIF("clientCode", ''), 'AUTO-' || id), "birthDate", "createdAt", COALESCE("updatedAt", "createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."PersonalData"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'Location':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."Location" (id, name, municipality, route, "createdAt", "updatedAt")
          SELECT id, name, municipality, route, NOW(), NOW()
          FROM "${SOURCE_SCHEMA}"."Location"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'ReportConfig':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."ReportConfig" (id, name, "reportType", schedule, "isActive", "createdAt", "updatedAt")
          SELECT id, name, "reportType"::text, schedule, "isActive", "createdAt", COALESCE("updatedAt", "createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."ReportConfig"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'TelegramUser':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."TelegramUser" (id, "chatId", name, username, "isActive", "registeredAt", "lastActivity", "reportsReceived", "isInRecipientsList", notes, "platformUser", "createdAt", "updatedAt")
          SELECT id, "chatId", COALESCE(name, ''), COALESCE(username, ''), "isActive", "registeredAt", COALESCE("lastActivity", NOW()), "reportsReceived", "isInRecipientsList", COALESCE(notes, ''), "platformUser", NOW(), NOW()
          FROM "${SOURCE_SCHEMA}"."TelegramUser"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'Phone':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."Phone" (id, number, "personalData", "createdAt", "updatedAt")
          SELECT id, COALESCE(number, ''), "personalData", "createdAt", COALESCE("updatedAt", "createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."Phone"
          WHERE "personalData" IS NOT NULL
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'Address':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."Address" (id, street, "exteriorNumber", "interiorNumber", "postalCode", "references", location, "personalData", "createdAt", "updatedAt")
          SELECT id, COALESCE(street, ''), COALESCE("exteriorNumber", ''), COALESCE("interiorNumber", ''), COALESCE("postalCode", ''), COALESCE("references", ''), location, "personalData", NOW(), NOW()
          FROM "${SOURCE_SCHEMA}"."Address"
          WHERE location IS NOT NULL AND "personalData" IS NOT NULL
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'Employee':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."Employee" (id, "oldId", type, "personalData", "user", "createdAt", "updatedAt")
          SELECT id, "oldId", type::text::"${TARGET_SCHEMA}"."EmployeeType", "personalData", "user", NOW(), NOW()
          FROM "${SOURCE_SCHEMA}"."Employee"
          WHERE "personalData" IS NOT NULL
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'Borrower':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."Borrower" (id, "loanFinishedCount", "personalData", "createdAt", "updatedAt")
          SELECT id, "loanFinishedCount", "personalData", "createdAt", COALESCE("updatedAt", "createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."Borrower"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'Loantype':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."Loantype" (id, name, "weekDuration", rate, "loanPaymentComission", "loanGrantedComission", "createdAt", "updatedAt")
          SELECT id, name, "weekDuration", rate, "loanPaymentComission", "loanGrantedComission", "createdAt", COALESCE("updatedAt", "createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."Loantype"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'PortfolioCleanup':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."PortfolioCleanup" (id, name, description, "cleanupDate", "fromDate", "toDate", "excludedLoansCount", "excludedAmount", route, "executedBy", "createdAt", "updatedAt")
          SELECT id, name, COALESCE(description, ''), "cleanupDate", "fromDate", "toDate", COALESCE("excludedLoansCount", 0), COALESCE("excludedAmount", 0), route, "executedBy", "createdAt", COALESCE("updatedAt", "createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."PortfolioCleanup"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'LeadPaymentReceived':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."LeadPaymentReceived" (id, "expectedAmount", "paidAmount", "cashPaidAmount", "bankPaidAmount", "falcoAmount", "paymentStatus", lead, agent, "createdAt", "updatedAt")
          SELECT id, COALESCE("expectedAmount", 0), COALESCE("paidAmount", 0), COALESCE("cashPaidAmount", 0), COALESCE("bankPaidAmount", 0), COALESCE("falcoAmount", 0), "paymentStatus", lead, agent, "createdAt", COALESCE("updatedAt", "createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."LeadPaymentReceived"
          WHERE lead IS NOT NULL
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'Loan':
        // grantor and lead are optional - borrower and loantype are required
        // First insert loans without previousLoan to avoid constraint issues
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."Loan" (id, "oldId", "requestedAmount", "amountGived", "signDate", "finishedDate", "renewedDate", "badDebtDate", "isDeceased", "profitAmount", "totalDebtAcquired", "expectedWeeklyPayment", "totalPaid", "pendingAmountStored", "comissionAmount", status, borrower, loantype, grantor, lead, "snapshotLeadId", "snapshotLeadAssignedAt", "snapshotRouteId", "snapshotRouteName", "previousLoan", "excludedByCleanup", "createdAt", "updatedAt")
          SELECT id, "oldId", COALESCE("requestedAmount", 0), COALESCE("amountGived", 0), "signDate", "finishedDate", "renewedDate", "badDebtDate", COALESCE("isDeceased", false), COALESCE("profitAmount", 0), COALESCE("totalDebtAcquired", 0), COALESCE("expectedWeeklyPayment", 0), COALESCE("totalPaid", 0), COALESCE("pendingAmountStored", 0), COALESCE("comissionAmount", 0), status::text::"${TARGET_SCHEMA}"."LoanStatus", borrower, loantype, grantor, lead, COALESCE("snapshotLeadId", ''), "snapshotLeadAssignedAt", COALESCE("snapshotRouteId", ''), COALESCE("snapshotRouteName", ''), NULL, "excludedByCleanup", "createdAt", COALESCE("updatedAt", "createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."Loan"
          WHERE borrower IS NOT NULL AND loantype IS NOT NULL
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'LoanPayment':
        // Only insert if loan exists in target and leadPaymentReceived exists (if not null)
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."LoanPayment" (id, amount, comission, "receivedAt", "paymentMethod", type, "oldLoanId", loan, "leadPaymentReceived", "createdAt", "updatedAt")
          SELECT lp.id, COALESCE(lp.amount, 0), COALESCE(lp.comission, 0), lp."receivedAt", lp."paymentMethod"::text::"${TARGET_SCHEMA}"."PaymentMethod", COALESCE(lp.type, ''), lp."oldLoanId", lp.loan,
            CASE WHEN EXISTS (SELECT 1 FROM "${TARGET_SCHEMA}"."LeadPaymentReceived" WHERE id = lp."leadPaymentReceived") THEN lp."leadPaymentReceived" ELSE NULL END,
            lp."createdAt", COALESCE(lp."updatedAt", lp."createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."LoanPayment" lp
          WHERE lp."paymentMethod" IS NOT NULL AND lp.loan IS NOT NULL
            AND EXISTS (SELECT 1 FROM "${TARGET_SCHEMA}"."Loan" WHERE id = lp.loan)
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'DocumentPhoto':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."DocumentPhoto" (id, title, description, "photoUrl", "publicId", "documentType", "isError", "errorDescription", "isMissing", "personalData", loan, "uploadedBy", "createdAt", "updatedAt")
          SELECT id, COALESCE(title, ''), COALESCE(description, ''), "photoUrl", "publicId", "documentType"::text::"${TARGET_SCHEMA}"."DocumentType", COALESCE("isError", false), COALESCE("errorDescription", ''), COALESCE("isMissing", false), "personalData", loan, "uploadedBy", "createdAt", COALESCE("updatedAt", "createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."DocumentPhoto"
          WHERE "uploadedBy" IS NOT NULL
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'CommissionPayment':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."CommissionPayment" (id, amount, loan, employee, "createdAt", "updatedAt")
          SELECT id, amount, loan, employee, "createdAt", COALESCE("updatedAt", "createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."CommissionPayment"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'Transaction':
        // Filter invalid FKs for loanPayment, loan, lead, leadPaymentReceived
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."Transaction" (id, amount, date, type, description, "incomeSource", "expenseSource", "snapshotLeadId", "snapshotRouteId", "expenseGroupId", "profitAmount", "returnToCapital", loan, "loanPayment", "sourceAccount", "destinationAccount", route, lead, "leadPaymentReceived", "createdAt", "updatedAt")
          SELECT t.id, COALESCE(t.amount, 0), t.date, t.type::text::"${TARGET_SCHEMA}"."TransactionType", COALESCE(t.description, ''), t."incomeSource", t."expenseSource", COALESCE(t."snapshotLeadId", ''), COALESCE(t."snapshotRouteId", ''), t."expenseGroupId", COALESCE(t."profitAmount", 0), COALESCE(t."returnToCapital", 0),
            CASE WHEN EXISTS (SELECT 1 FROM "${TARGET_SCHEMA}"."Loan" WHERE id = t.loan) THEN t.loan ELSE NULL END,
            CASE WHEN EXISTS (SELECT 1 FROM "${TARGET_SCHEMA}"."LoanPayment" WHERE id = t."loanPayment") THEN t."loanPayment" ELSE NULL END,
            t."sourceAccount", t."destinationAccount", t.route,
            CASE WHEN EXISTS (SELECT 1 FROM "${TARGET_SCHEMA}"."Employee" WHERE id = t.lead) THEN t.lead ELSE NULL END,
            CASE WHEN EXISTS (SELECT 1 FROM "${TARGET_SCHEMA}"."LeadPaymentReceived" WHERE id = t."leadPaymentReceived") THEN t."leadPaymentReceived" ELSE NULL END,
            t."createdAt", COALESCE(t."updatedAt", t."createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."Transaction" t
          WHERE t."sourceAccount" IS NOT NULL AND t.date IS NOT NULL
            AND EXISTS (SELECT 1 FROM "${TARGET_SCHEMA}"."Account" WHERE id = t."sourceAccount")
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'FalcoCompensatoryPayment':
        // Only insert if leadPaymentReceived exists in target
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."FalcoCompensatoryPayment" (id, amount, "leadPaymentReceived", "createdAt", "updatedAt")
          SELECT f.id, f.amount, f."leadPaymentReceived", f."createdAt", COALESCE(f."updatedAt", f."createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."FalcoCompensatoryPayment" f
          WHERE EXISTS (SELECT 1 FROM "${TARGET_SCHEMA}"."LeadPaymentReceived" WHERE id = f."leadPaymentReceived")
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'AuditLog':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."AuditLog" (id, operation, "modelName", "recordId", "userName", "userEmail", "userRole", "sessionId", "ipAddress", "userAgent", "previousValues", "newValues", "changedFields", description, metadata, "user", "createdAt")
          SELECT id, operation, COALESCE("modelName", ''), COALESCE("recordId", ''), COALESCE("userName", ''), COALESCE("userEmail", ''), COALESCE("userRole", ''), COALESCE("sessionId", ''), COALESCE("ipAddress", ''), COALESCE("userAgent", ''), "previousValues", "newValues", "changedFields", COALESCE(description, ''), metadata, "user", "createdAt"
          FROM "${SOURCE_SCHEMA}"."AuditLog"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'ReportExecutionLog':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."ReportExecutionLog" (id, status, "executionType", message, "errorDetails", "recipientsCount", "successfulDeliveries", "failedDeliveries", "startTime", "endTime", duration, "cronExpression", timezone, "reportConfig", "createdAt", "updatedAt")
          SELECT id, status, "executionType", COALESCE(message, ''), COALESCE("errorDetails", ''), "recipientsCount", "successfulDeliveries", "failedDeliveries", "startTime", "endTime", duration, COALESCE("cronExpression", ''), COALESCE(timezone, ''), "reportConfig", "createdAt", COALESCE("updatedAt", "createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."ReportExecutionLog"
          ON CONFLICT (id) DO NOTHING
        `
        break

      case 'DocumentNotificationLog':
        insertQuery = `
          INSERT INTO "${TARGET_SCHEMA}"."DocumentNotificationLog" (id, "documentId", "documentType", "personalDataId", "personName", "loanId", "routeId", "routeName", "localityName", "routeLeadId", "routeLeadName", "routeLeadUserId", "telegramUserId", "telegramChatId", "telegramUsername", "issueType", description, "messageContent", status, "telegramResponse", "telegramErrorCode", "telegramErrorMessage", "sentAt", "responseTimeMs", "retryCount", "lastRetryAt", notes, "createdAt", "updatedAt")
          SELECT id, COALESCE("documentId", ''), COALESCE("documentType", ''), COALESCE("personalDataId", ''), COALESCE("personName", ''), COALESCE("loanId", ''), COALESCE("routeId", ''), COALESCE("routeName", ''), COALESCE("localityName", ''), COALESCE("routeLeadId", ''), COALESCE("routeLeadName", ''), COALESCE("routeLeadUserId", ''), COALESCE("telegramUserId", ''), COALESCE("telegramChatId", ''), COALESCE("telegramUsername", ''), "issueType", COALESCE(description, ''), COALESCE("messageContent", ''), status, COALESCE("telegramResponse", ''), "telegramErrorCode", COALESCE("telegramErrorMessage", ''), "sentAt", "responseTimeMs", "retryCount", "lastRetryAt", COALESCE(notes, ''), "createdAt", COALESCE("updatedAt", "createdAt", NOW())
          FROM "${SOURCE_SCHEMA}"."DocumentNotificationLog"
          ON CONFLICT (id) DO NOTHING
        `
        break

      default:
        return {
          table: tableName,
          sourceCount,
          targetCount: 0,
          success: false,
          error: `No migration query defined for table ${tableName}`,
        }
    }

    await pool.query(insertQuery)

    // Contar registros en destino
    const targetCountResult = await pool.query(`SELECT COUNT(*) as count FROM "${TARGET_SCHEMA}"."${tableName}"`)
    const targetCount = parseInt(targetCountResult.rows[0].count, 10)

    return {
      table: tableName,
      sourceCount,
      targetCount,
      success: true,
    }
  } catch (error) {
    return {
      table: tableName,
      sourceCount: 0,
      targetCount: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function migrateEmployeeRoutes(): Promise<MigrationResult> {
  // En origen, Employee tiene una FK directa a Route
  // En destino, es una relación M:M via _RouteEmployees
  // Only insert for employees that exist in target
  try {
    const checkSource = await pool.query(`
      SELECT e.id as employee_id, e.routes as route_id
      FROM "${SOURCE_SCHEMA}"."Employee" e
      WHERE e.routes IS NOT NULL
        AND EXISTS (SELECT 1 FROM "${TARGET_SCHEMA}"."Employee" WHERE id = e.id)
        AND EXISTS (SELECT 1 FROM "${TARGET_SCHEMA}"."Route" WHERE id = e.routes)
    `)

    const sourceCount = checkSource.rows.length

    if (sourceCount === 0) {
      return {
        table: 'Employee Routes (M:M)',
        sourceCount: 0,
        targetCount: 0,
        success: true,
      }
    }

    for (const row of checkSource.rows) {
      await pool.query(`
        INSERT INTO "${TARGET_SCHEMA}"."_RouteEmployees" ("A", "B")
        VALUES ($1, $2)
        ON CONFLICT ("A", "B") DO NOTHING
      `, [row.employee_id, row.route_id])
    }

    const targetCountResult = await pool.query(`SELECT COUNT(*) as count FROM "${TARGET_SCHEMA}"."_RouteEmployees"`)
    const targetCount = parseInt(targetCountResult.rows[0].count, 10)

    return {
      table: 'Employee Routes (M:M)',
      sourceCount,
      targetCount,
      success: true,
    }
  } catch (error) {
    return {
      table: 'Employee Routes (M:M)',
      sourceCount: 0,
      targetCount: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function migrateJunctionTable(sourceName: string, targetName: string): Promise<MigrationResult> {
  try {
    // Verificar que la tabla existe en origen
    const checkSource = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = $2
      )
    `, [SOURCE_SCHEMA, sourceName])

    if (!checkSource.rows[0].exists) {
      return {
        table: `${sourceName} → ${targetName}`,
        sourceCount: 0,
        targetCount: 0,
        success: true,
        error: `Junction table does not exist in source (skipped)`,
      }
    }

    // Contar registros en origen
    const countResult = await pool.query(`SELECT COUNT(*) as count FROM "${SOURCE_SCHEMA}"."${sourceName}"`)
    const sourceCount = parseInt(countResult.rows[0].count, 10)

    if (sourceCount === 0) {
      return {
        table: `${sourceName} → ${targetName}`,
        sourceCount: 0,
        targetCount: 0,
        success: true,
      }
    }

    // Copiar datos (junction tables tienen columnas A y B)
    const insertQuery = `
      INSERT INTO "${TARGET_SCHEMA}"."${targetName}" ("A", "B")
      SELECT "A", "B"
      FROM "${SOURCE_SCHEMA}"."${sourceName}"
      ON CONFLICT ("A", "B") DO NOTHING
    `

    await pool.query(insertQuery)

    // Contar registros en destino
    const targetCountResult = await pool.query(`SELECT COUNT(*) as count FROM "${TARGET_SCHEMA}"."${targetName}"`)
    const targetCount = parseInt(targetCountResult.rows[0].count, 10)

    return {
      table: `${sourceName} → ${targetName}`,
      sourceCount,
      targetCount,
      success: true,
    }
  } catch (error) {
    return {
      table: `${sourceName} → ${targetName}`,
      sourceCount: 0,
      targetCount: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Tablas de junction (M:M)
const JUNCTION_TABLES: Record<string, { sourceTable: string; targetTable: string }> = {
  '_Loan_collaterals': { sourceTable: '_Loan_collaterals', targetTable: '_LoanCollaterals' },
  '_Account_routes': { sourceTable: '_Account_routes', targetTable: '_RouteAccounts' },
  '_ReportConfig_routes': { sourceTable: '_ReportConfig_routes', targetTable: '_ReportConfigRoutes' },
  '_ReportConfig_telegramUsers': { sourceTable: '_ReportConfig_telegramUsers', targetTable: '_ReportConfigRecipients' },
}

async function main() {
  console.log('🚀 Iniciando migración de datos...\n')
  console.log(`   Origen: ${SOURCE_SCHEMA}`)
  console.log(`   Destino: ${TARGET_SCHEMA}\n`)

  const results: MigrationResult[] = []

  // Migrar tablas principales
  console.log('📋 Migrando tablas principales...\n')
  for (const tableName of MIGRATION_ORDER) {
    process.stdout.write(`   ${tableName}... `)
    const result = await migrateTable(tableName)
    results.push(result)

    if (result.success) {
      if (result.error) {
        console.log(`⚠️  ${result.error}`)
      } else {
        console.log(`✅ ${result.sourceCount} → ${result.targetCount} registros`)
      }
    } else {
      console.log(`❌ Error: ${result.error}`)
    }
  }

  // Migrar relación Employee-Routes
  console.log('\n📋 Migrando relación Employee-Routes...\n')
  const employeeRoutesResult = await migrateEmployeeRoutes()
  results.push(employeeRoutesResult)
  if (employeeRoutesResult.success) {
    console.log(`   ✅ ${employeeRoutesResult.sourceCount} → ${employeeRoutesResult.targetCount} registros`)
  } else {
    console.log(`   ❌ Error: ${employeeRoutesResult.error}`)
  }

  // Migrar junction tables
  console.log('\n📋 Migrando tablas de relación (M:M)...\n')
  for (const [sourceName, { targetTable }] of Object.entries(JUNCTION_TABLES)) {
    process.stdout.write(`   ${sourceName}... `)
    const result = await migrateJunctionTable(sourceName, targetTable)
    results.push(result)

    if (result.success) {
      if (result.error) {
        console.log(`⚠️  ${result.error}`)
      } else {
        console.log(`✅ ${result.sourceCount} → ${result.targetCount} registros`)
      }
    } else {
      console.log(`❌ Error: ${result.error}`)
    }
  }

  // Resumen
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN DE MIGRACIÓN')
  console.log('='.repeat(60))

  const successful = results.filter(r => r.success && !r.error)
  const warnings = results.filter(r => r.success && r.error)
  const failed = results.filter(r => !r.success)

  console.log(`\n   ✅ Exitosas: ${successful.length}`)
  console.log(`   ⚠️  Advertencias: ${warnings.length}`)
  console.log(`   ❌ Fallidas: ${failed.length}`)

  if (failed.length > 0) {
    console.log('\n   Tablas con errores:')
    for (const f of failed) {
      console.log(`      - ${f.table}: ${f.error}`)
    }
  }

  const totalSource = results.reduce((sum, r) => sum + r.sourceCount, 0)
  const totalTarget = results.reduce((sum, r) => sum + r.targetCount, 0)
  console.log(`\n   Total registros: ${totalSource} → ${totalTarget}`)

  await pool.end()
  console.log('\n✅ Migración completada!\n')
}

main().catch(console.error)
