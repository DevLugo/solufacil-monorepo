# Solufacil Monorepo

Sistema de gestión de microcréditos con arquitectura custom basada en Apollo Server + GraphQL + Prisma.

## 🏗️ Arquitectura

```
solufacil_monorepo/
├── apps/
│   ├── api/           # Apollo Server 4 + GraphQL
│   └── web/           # Next.js 15 (próximamente)
├── packages/
│   ├── database/      # Prisma ORM + PostgreSQL
│   ├── graphql-schema/ # GraphQL Schema + Codegen
│   ├── business-logic/ # Lógica de negocio + Tests
│   └── shared/         # Utilidades compartidas
```

## 🚀 Quick Start

### Requisitos

- Node.js >= 20
- pnpm >= 8
- PostgreSQL >= 14

### Instalación

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env

# Editar .env con tus credenciales de PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/solufacil"
```

### Base de Datos

```bash
# Generar cliente de Prisma
pnpm --filter @solufacil/database db:generate

# Ejecutar migraciones
pnpm --filter @solufacil/database db:push

# Poblar base de datos con datos de ejemplo
pnpm --filter @solufacil/database db:seed
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
pnpm dev

# El servidor estará disponible en http://localhost:4000
# GraphQL Playground: http://localhost:4000
```

### Testing

```bash
# Ejecutar tests (business-logic)
pnpm test

# Tests con coverage
pnpm --filter @solufacil/business-logic test:coverage
```

### Build

```bash
# Build de todos los packages
pnpm build
```

## 📦 Packages

### @solufacil/database

Prisma ORM + esquema de base de datos completo (30+ modelos).

```bash
# Comandos útiles
pnpm --filter @solufacil/database db:generate  # Generar cliente
pnpm --filter @solufacil/database db:push      # Push schema
pnpm --filter @solufacil/database db:migrate   # Crear migración
pnpm --filter @solufacil/database db:studio    # Abrir Prisma Studio
pnpm --filter @solufacil/database db:seed      # Seed de datos
```

### @solufacil/graphql-schema

GraphQL Schema SDL + Code Generation.

```bash
# Generar types TypeScript desde schema.graphql
pnpm --filter @solufacil/graphql-schema codegen
```

### @solufacil/business-logic

Lógica de negocio pura (cálculos, validadores, etc.).

```bash
# Ejecutar tests
pnpm --filter @solufacil/business-logic test

# Coverage
pnpm --filter @solufacil/business-logic test:coverage
```

### @solufacil/shared

Utilidades compartidas (formateo, constantes, types).

## 🔑 Autenticación

La API usa JWT stateless. Para autenticarte:

### 1. Login

```graphql
mutation Login {
  login(email: "admin@solufacil.com", password: "admin123") {
    accessToken
    refreshToken
    user {
      id
      email
      role
    }
  }
}
```

### 2. Usar el token

Incluye el `accessToken` en el header `Authorization`:

```
Authorization: Bearer <tu-access-token>
```

### 3. Query protegida

```graphql
query Me {
  me {
    id
    email
    role
    employee {
      personalData {
        fullName
      }
    }
  }
}
```

## 📚 Stack Tecnológico

- **API**: Apollo Server 4 + GraphQL
- **ORM**: Prisma 6
- **Database**: PostgreSQL
- **Auth**: JWT stateless
- **Testing**: Vitest
- **Monorepo**: Turborepo + pnpm workspaces
- **Language**: TypeScript 5

## 🗺️ Roadmap

### Fase 2.1: Setup Base ✅ (Completado)

- [x] Configurar monorepo con Turborepo
- [x] Crear packages base (database, graphql-schema, business-logic, shared)
- [x] Crear app API con Apollo Server
- [x] Configurar TypeScript, ESLint, Prettier
- [x] Sistema de autenticación JWT básico

### Fase 2.2: Auth + Base Models (Próximo)

- [ ] Implementar resolvers de User y Employee
- [ ] Crear servicios y repositories
- [ ] Role-based access control completo
- [ ] Tests de autenticación

### Fase 2.3-2.9

Ver plan completo en `.claude/plans/`

## 📖 Documentación

### Especificaciones

- **GraphQL Schema**: `packages/graphql-schema/src/schema.graphql`
- **Prisma Schema**: `packages/database/prisma/schema.prisma`
- **Plan Completo**: `MIGRATION_PLAN.md`

### Lógica de Negocio Crítica

Los cálculos de profit están en `packages/business-logic/src/calculations/`:

```typescript
import { calculateProfit, calculatePaymentProfit } from '@solufacil/business-logic'

// Calcular ganancia de préstamo
const profit = calculateProfit(new Decimal(1000), new Decimal(0.2)) // $200

// Calcular distribución de pago
const { profitAmount, returnToCapital } = calculatePaymentProfit(
  new Decimal(100),
  totalProfit,
  totalDebt
)
```

## 🤝 Contribuir

Este es un proyecto privado. Para contribuir:

1. Crear una rama desde `main`
2. Hacer cambios siguiendo las especificaciones
3. Ejecutar tests: `pnpm test`
4. Crear Pull Request

## 📝 Licencia

Propietario: Solufacil
