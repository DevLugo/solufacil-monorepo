# Especificación del PDF de Listado de Cobranza

## Visión General

El PDF de Listado de Cobranza es un documento generado semanalmente por localidad que contiene información detallada de todos los préstamos activos para facilitar la cobranza en campo.

---

## Información del Header

### Elementos Visuales del Header

```
┌─────────────────────────────────────────────────────────────────┐
│ [Nombre de Ruta]      Listado de Cobranza      [Logo Solufacil] │
│                                                                   │
│          Semanal del [fecha inicio] al [fecha fin]                │
│                                                                   │
│ Localidad: [nombre]          Lider: [nombre del líder]           │
│                                                                   │
│ Total de clientes: XX                                            │
│ Comisión a pagar al líder: $X,XXX                                │
│ Total de cobranza esperada: $XX,XXX                              │
└─────────────────────────────────────────────────────────────────┘
```

### Campos del Header

| Campo | Descripción | Fuente de Datos | Formato |
|-------|-------------|-----------------|---------|
| **Nombre de Ruta** | Nombre de la ruta seleccionada | `Route.name` | Texto |
| **Logo** | Logo de Solufacil | `./public/solufacil.png` | Imagen 100px ancho |
| **Rango de Semana** | Fechas de inicio y fin de la semana objetivo | Calculado según `weekMode` (current/next) | "Semanal del [día mes] al [día mes]" |
| **Localidad** | Nombre de la localidad | `Location.name` | Texto |
| **Líder** | Nombre del líder responsable | `Employee.personalData.fullName` | Texto |
| **Total de clientes** | Cantidad de préstamos activos en la localidad | Count de préstamos activos | Número entero |
| **Comisión a pagar al líder** | Suma de todas las comisiones esperadas | Suma de `Loantype.loanPaymentComission` | Formato moneda MXN |
| **Total de cobranza esperada** | Suma de todos los abonos semanales esperados | Suma de `Loan.expectedWeeklyPayment` | Formato moneda MXN |

---

## Tabla de Préstamos

### Estructura de Columnas

La tabla contiene 11 columnas con la siguiente información:

| # | Columna | Ancho (px) | Descripción | Fuente de Datos | Cálculo/Formato |
|---|---------|------------|-------------|-----------------|-----------------|
| 1 | **ID** | 30 | Código único del cliente | `PersonalData.clientCode` o últimos 6 caracteres del ID | Alfanumérico 6 chars |
| 2 | **NOMBRE** | 100 | Nombre completo del prestatario | `Borrower.personalData.fullName` | Texto con auto-wrap |
| 3 | **TELEFONO** | 40 | Teléfono del prestatario | `PersonalData.phones[0].number` | Número telefónico |
| 4 | **ABONO** | 70 | Pago semanal esperado | `Loan.expectedWeeklyPayment` | Moneda MXN sin decimales |
| 5 | **ADEUDO** | 35 | Monto total pendiente | Calculado dinámicamente | Moneda MXN sin decimales |
| 6 | **PLAZOS** | 35 | Duración del préstamo en semanas | `Loantype.weekDuration` | Número entero |
| 7 | **PAGO VDO** | 25 | Valor de Deuda Observada | Calculado con `calculateVDOForLoan()` | Moneda MXN sin decimales |
| 8 | **ABONO PARCIAL** | 35 | Sobrepago disponible de semanas anteriores | Calculado con `calculateVDOForLoan()` | Moneda MXN sin decimales |
| 9 | **FECHA INICIO** | 35 | Fecha de desembolso del préstamo | `Loan.signDate` | dd/mm/yyyy |
| 10 | **NUMERO SEMANA** | 40 | Número de semana desde el inicio del préstamo | Calculado | Número entero |
| 11 | **AVAL** | 85 | Nombre y teléfono del aval | `Loan.collaterals[0]` | "Nombre, Teléfono" |

---

## Cálculos Detallados

### 1. ABONO (Pago Semanal Esperado)

**Fuente Primaria**: `Loan.expectedWeeklyPayment`

**Cálculo Fallback** (si no existe el campo):
```typescript
const rate = Loantype.rate; // Ej: 0.20 (20%)
const requestedAmount = Loan.requestedAmount;
const weekDuration = Loantype.weekDuration;

const totalDebt = requestedAmount * (1 + rate);
const expectedWeeklyPayment = totalDebt / weekDuration;
```

**Ejemplo**:
- Monto solicitado: $1,000
- Tasa: 20% (0.20)
- Duración: 10 semanas
- Total a pagar: $1,000 × 1.20 = $1,200
- Pago semanal: $1,200 / 10 = $120

---

### 2. ADEUDO (Monto Pendiente)

**Cálculo Dinámico**:
```typescript
const rate = parseFloat(Loantype.rate.toString());
const requestedAmount = parseFloat(Loan.requestedAmount.toString());
const totalDebtAcquired = requestedAmount * (1 + rate);

const totalPaid = Loan.payments.reduce((sum, payment) => {
  return sum + parseFloat(payment.amount.toString());
}, 0);

const pendingAmount = totalDebtAcquired - totalPaid;
```

**Notas**:
- Solo se incluyen préstamos con `pendingAmount > 0`
- Es un cálculo en tiempo real, no usa `Loan.pendingAmountStored`

---

### 3. PAGO VDO (Valor de Deuda Observada)

**Función**: `calculateVDOForLoan(loan, now, weekMode)`

**Propósito**: Calcular cuánto debe el cliente por semanas no pagadas hasta la fecha de evaluación.

**Parámetros**:
- `loan`: Objeto con información del préstamo
- `now`: Fecha actual
- `weekMode`: 'current' o 'next'

**Lógica**:

1. **Determinar fecha de evaluación**:
   ```typescript
   const weekStart = getIsoMonday(now); // Lunes de la semana actual
   const weekEnd = new Date(weekStart);
   weekEnd.setDate(weekStart.getDate() + 6); // Domingo de la semana actual

   const previousWeekEnd = new Date(weekStart);
   previousWeekEnd.setDate(weekStart.getDate() - 1); // Domingo anterior

   const evaluationEndDate = weekMode === 'current'
     ? previousWeekEnd  // Para semana en curso: evaluar hasta semana anterior
     : weekEnd;         // Para semana siguiente: evaluar hasta semana actual
   ```

2. **Generar semanas desde la firma**:
   ```typescript
   const weeks = [];
   let currentMonday = getIsoMonday(signDate);

   while (currentMonday <= evaluationEndDate) {
     const end = new Date(currentMonday);
     end.setDate(end.getDate() + 6);
     end.setHours(23, 59, 59, 999);

     if (end <= evaluationEndDate) {
       weeks.push({ monday: currentMonday, sunday: end });
     }

     currentMonday.setDate(currentMonday.getDate() + 7);
   }
   ```

3. **Calcular semanas sin pago**:
   ```typescript
   let surplusAccumulated = 0;
   let weeksWithoutPayment = 0;

   for (let i = 0; i < weeks.length; i++) {
     const week = weeks[i];

     // Calcular pagos en esta semana
     let weeklyPaid = 0;
     for (const payment of loan.payments) {
       const paymentDate = new Date(payment.receivedAt || payment.createdAt);
       if (paymentDate >= week.monday && paymentDate <= week.sunday) {
         weeklyPaid += parseFloat(payment.amount);
       }
     }

     // Semana 0 (firma) no cuenta para VDO
     if (i === 0) {
       if (weeklyPaid > 0) {
         surplusAccumulated = weeklyPaid; // Todo es sobrepago
       }
       continue;
     }

     // Verificar si la semana está cubierta
     const totalAvailableForWeek = surplusAccumulated + weeklyPaid;
     const isWeekCovered = totalAvailableForWeek >= expectedWeeklyPayment;

     if (!isWeekCovered) {
       weeksWithoutPayment++;
     }

     // Actualizar sobrepago acumulado
     if (totalAvailableForWeek > expectedWeeklyPayment) {
       surplusAccumulated = totalAvailableForWeek - expectedWeeklyPayment;
     } else {
       surplusAccumulated = 0; // No arrastrar déficit
     }
   }
   ```

4. **Calcular monto VDO**:
   ```typescript
   // Calcular deuda total pendiente
   const totalDebt = requestedAmount * (1 + loantype.rate);
   let totalPaid = 0;
   for (const payment of loan.payments) {
     totalPaid += parseFloat(payment.amount);
   }
   const pendingAmount = Math.max(0, totalDebt - totalPaid);

   // PAGO VDO no puede ser mayor a la deuda pendiente
   const arrearsAmount = Math.min(
     weeksWithoutPayment * expectedWeeklyPayment,
     pendingAmount
   );
   ```

**Resultado**:
```typescript
{
  expectedWeeklyPayment: number,
  weeksWithoutPayment: number,
  arrearsAmount: number,        // ← Este es PAGO VDO
  partialPayment: number        // ← Este es ABONO PARCIAL
}
```

---

### 4. ABONO PARCIAL (Sobrepago Disponible)

**Fuente**: `calculateVDOForLoan().partialPayment`

**Descripción**: Es el sobrepago acumulado que el cliente tiene disponible de semanas anteriores.

**Lógica**:
- Se calcula automáticamente en `calculateVDOForLoan()`
- Representa el valor de `surplusAccumulated` al final del cálculo VDO
- Solo muestra valores positivos (sobrepago), nunca negativos

**Ejemplo**:
- Semana 1: Cliente paga $150, esperado $100 → Sobrepago: $50
- Semana 2: Cliente paga $80, esperado $100 → Usa $20 del sobrepago → Sobrepago restante: $30
- **ABONO PARCIAL = $30**

---

### 5. NUMERO SEMANA

**Cálculo**:
```typescript
// Lunes siguiente a la semana de firma
const signWeekStart = getIsoMonday(signDate);
const signWeekEnd = new Date(signWeekStart);
signWeekEnd.setDate(signWeekEnd.getDate() + 6);

const boundary = new Date(signWeekEnd);
boundary.setDate(boundary.getDate() + 1); // Lunes siguiente
boundary.setHours(0, 0, 0, 0);

// Calcular semanas transcurridas desde el boundary
const msPerWeek = 7 * 24 * 60 * 60 * 1000;
const weeksElapsed = Math.max(
  0,
  Math.floor(
    (getMonday(weekEnd).getTime() - getMonday(boundary).getTime()) / msPerWeek
  )
);

const nSemana = weeksElapsed + 1;
```

**Ejemplo**:
- Fecha de firma: Miércoles 1 de Enero, 2025
- Semana de firma: Lunes 30 Dic 2024 - Domingo 5 Ene 2025
- Boundary: Lunes 6 Enero, 2025 (inicio de Semana 1)
- Semana actual: Lunes 13 Enero - Domingo 19 Enero
- **NUMERO SEMANA = 2**

---

### 6. AVAL

**Formato**: "Nombre Completo, Teléfono"

**Fuente**:
```typescript
const primaryCollateral = Loan.collaterals[0];
const avalName = primaryCollateral?.fullName || '';
const avalPhone = primaryCollateral?.phones[0]?.number || '';
const avalDisplay = [avalName, avalPhone].filter(Boolean).join(', ');
```

**Ejemplos**:
- "JUAN PEREZ LOPEZ, 9981234567"
- "MARIA GARCIA" (sin teléfono)
- "" (sin aval)

---

## Filtrado de Préstamos

**Criterios de Inclusión**:

```typescript
const activeLoans = await prisma.loan.findMany({
  where: {
    AND: [
      { finishedDate: null },           // ✅ Solo préstamos NO finalizados
      { excludedByCleanup: null },      // ✅ NO excluidos por limpieza
      leaderId ? { leadId: leaderId } : {}  // ✅ Filtro opcional por líder
    ]
  }
});

// Luego filtrar por monto pendiente > 0
const filteredLoans = activeLoans.filter(loan => {
  const pendingAmount = calculatePendingAmount(loan);
  return pendingAmount > 0;
});
```

---

## Diseño del PDF

### Especificaciones Técnicas

| Elemento | Valor |
|----------|-------|
| **Librería** | `pdfkit` |
| **Márgenes** | 30px todos los lados |
| **Fuente predeterminada** | Helvetica |
| **Tamaño de página** | Letter (8.5" × 11") |

### Espaciado y Tamaños de Fuente

| Sección | Tamaño Fuente | Espaciado |
|---------|---------------|-----------|
| Título principal | 14pt | - |
| Subtítulo (rango semanal) | 10pt | 20px abajo del título |
| Detalles (localidad, líder) | 8pt | 30px abajo del subtítulo |
| Estadísticas | 8pt | 15px entre líneas |
| Headers de tabla | 6pt | Header height: 20px |
| Contenido de tabla | 5pt | Row height: 8-14px (dinámico) |

### Altura de Filas

```typescript
const rowHeight = Math.max(
  maxTextHeight + paddingBottom + 3,
  14 // Altura mínima
);
```

**Factores que afectan la altura**:
1. Longitud del nombre del cliente (auto-wrap)
2. Longitud de la información del aval (auto-wrap)
3. Se usa la mayor altura entre nombre y aval

### Saltos de Página

**Criterio**:
```typescript
const pageHeight = doc.page.height - doc.page.margins.bottom;

if (currentY + rowHeight > pageHeight) {
  addPageNumber(pageNumber);
  doc.addPage();
  pageNumber++;
  currentY = drawTableHeaders(30);
}
```

**Elementos en cada página**:
1. Primera página: Header completo + tabla
2. Páginas subsecuentes: Solo headers de tabla + datos
3. Número de página en esquina inferior derecha

---

## Nombre del Archivo

**Formato**:
```
listado_[localidad]_semana_[número]_[mes]_[fecha].pdf
```

**Ejemplo**:
```
listado_nuevo_progreso_semana_2_diciembre_16_12_24.pdf
```

**Componentes**:
- `localidad`: Nombre de la localidad en minúsculas con guiones bajos
- `número`: Número de semana del mes (1-5)
- `mes`: Nombre del mes actual
- `fecha`: Fecha actual en formato dd_mm_yy

---

## Casos Especiales y Validaciones

### Préstamos sin Teléfono
- Campo TELEFONO queda vacío
- No afecta la generación del PDF

### Préstamos sin Aval
- Campo AVAL queda vacío
- No afecta la generación del PDF

### PAGO VDO = 0
- Muestra "$0"
- Indica que el cliente está al corriente

### ABONO PARCIAL > 0
- Indica que el cliente tiene crédito a favor
- Se puede aplicar a futuros pagos

### Nombres o Avales Largos
- Se usa auto-wrap con el ancho de columna
- La altura de la fila se ajusta automáticamente
- Puede causar saltos de página más frecuentes

---

## Modo de Semana (weekMode)

### Opciones

| Modo | Descripción | Fecha de Evaluación |
|------|-------------|---------------------|
| **current** | Semana en curso | Hasta el domingo anterior (semana pasada completa) |
| **next** | Semana siguiente | Hasta el domingo actual (semana actual completa) |

### Impacto en Cálculos

**Ejemplo con fecha actual = Miércoles 15 Enero 2025**:

**Modo "current" (semana en curso)**:
- Rango semanal: Lunes 13 Ene - Domingo 19 Ene
- Evaluación VDO: Hasta Domingo 12 Ene (semana anterior completa)
- **Uso**: Generar listado para cobrar esta semana

**Modo "next" (semana siguiente)**:
- Rango semanal: Lunes 20 Ene - Domingo 26 Ene
- Evaluación VDO: Hasta Domingo 19 Ene (semana actual completa)
- **Uso**: Generar listado anticipado para la siguiente semana

---

## Queries GraphQL Necesarias

### 1. Obtener Rutas para el Selector
```graphql
query GetRoutesForPDF {
  routes(isActive: true) {
    id
    name
    employees(type: [LEAD, ROUTE_LEAD]) {
      id
      personalData {
        id
        fullName
        addresses {
          id
          location {
            id
            name
          }
        }
      }
    }
  }
}
```

### 2. Obtener Localidades de una Ruta
```graphql
query GetRouteLocalities($routeId: ID!) {
  route(id: $routeId) {
    id
    name
    employees(type: [LEAD, ROUTE_LEAD]) {
      id
      personalData {
        id
        fullName
        addresses {
          id
          location {
            id
            name
          }
        }
      }
    }
  }
}
```

### 3. Obtener Datos para el PDF (Backend)
```typescript
// Esta query se ejecuta en el backend (no GraphQL)
const activeLoans = await prisma.loan.findMany({
  where: {
    AND: [
      { finishedDate: null },
      { excludedByCleanup: null },
      leaderId ? { leadId: leaderId } : {}
    ]
  },
  include: {
    borrower: {
      include: {
        personalData: {
          include: {
            phones: true,
            addresses: { include: { location: true } }
          }
        }
      }
    },
    collaterals: {
      include: { phones: true }
    },
    loantype: true,
    payments: true,
    lead: {
      include: { personalData: true }
    }
  },
  orderBy: [
    { signDate: 'asc' },
    { id: 'asc' }
  ]
});
```

---

## Resumen de Dependencias

### Paquetes NPM
- `pdfkit` - Generación de PDFs
- `@prisma/client` - Acceso a base de datos

### Utilidades Internas
- `listadoCalc.ts`:
  - `calculateVDOForLoan()` - Cálculo de VDO y abono parcial
  - `computeExpectedWeeklyPayment()` - Cálculo de pago semanal

### Assets
- `./public/solufacil.png` - Logo para el header

---

## Ejemplo Completo de Fila

**Datos de Entrada**:
```typescript
{
  loan: {
    borrower: {
      personalData: {
        clientCode: "ABC123",
        fullName: "JUAN PEREZ LOPEZ",
        phones: [{ number: "9981234567" }]
      }
    },
    requestedAmount: 1000,
    signDate: "2025-01-06T00:00:00Z",
    loantype: {
      weekDuration: 10,
      rate: 0.20,
      loanPaymentComission: 15
    },
    payments: [
      { amount: 120, receivedAt: "2025-01-13T00:00:00Z" },
      { amount: 150, receivedAt: "2025-01-20T00:00:00Z" }
    ],
    collaterals: [
      {
        fullName: "MARIA GARCIA SANCHEZ",
        phones: [{ number: "9987654321" }]
      }
    ]
  }
}
```

**Salida en PDF** (fila de la tabla):
```
| ABC123 | JUAN PEREZ | 9981234567 | $120 | $930 | 10 | $0 | $30 | 06/01/2025 | 2 | MARIA GARCIA SANCHEZ, 9987654321 |
|        | LOPEZ      |            |      |      |    |    |     |            |   |                                   |
```

**Explicación de valores**:
- **ID**: "ABC123" (clientCode)
- **NOMBRE**: "JUAN PEREZ LOPEZ" (con wrap)
- **TELEFONO**: "9981234567"
- **ABONO**: "$120" (1200 / 10)
- **ADEUDO**: "$930" (1200 total - 270 pagado)
- **PLAZOS**: "10" semanas
- **PAGO VDO**: "$0" (está al corriente)
- **ABONO PARCIAL**: "$30" (150 - 120 de sobrepago en semana 2)
- **FECHA INICIO**: "06/01/2025"
- **NUMERO SEMANA**: "2"
- **AVAL**: "MARIA GARCIA SANCHEZ, 9987654321"

---

## Notas de Implementación

1. **Performance**: El cálculo de VDO es intensivo, considerar caching si hay muchos préstamos
2. **Precisión**: Usar `Decimal.js` para cálculos monetarios precisos
3. **Fechas**: Siempre usar UTC para cálculos, convertir a local solo para display
4. **Testing**: Probar con casos edge: préstamos muy nuevos, muy viejos, con muchos pagos, sin pagos
5. **Manejo de Errores**: Validar que todos los datos existan antes de generar PDF
6. **Streaming**: El PDF se genera como stream y se envía directamente al cliente
