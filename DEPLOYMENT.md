# Guía de Deployment - SoluFácil

## Arquitectura de Producción

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Vercel        │────▶│  DigitalOcean    │────▶│   Neon      │
│   (Frontend)    │     │  (API GraphQL)   │     │ (PostgreSQL)│
│   Next.js 15    │     │  Express/Apollo  │     │   Free Tier │
│   GRATIS        │     │  ~$5/mes         │     │   GRATIS    │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

**Costo Total: ~$5/mes**

---

## Paso 1: Configurar Neon (Base de Datos)

1. Ve a [neon.tech](https://neon.tech) y accede a tu cuenta
2. Crea un nuevo proyecto: `solufacil-production`
3. Copia el **Connection String** (formato pooled):
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Guárdalo, lo necesitarás para el API

### Migrar la Base de Datos

Desde tu máquina local, con el DATABASE_URL de Neon:

```bash
# Exportar la URL de Neon
export DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"

# Generar cliente Prisma
pnpm --filter @solufacil/database db:generate

# Aplicar migraciones (o push para desarrollo)
pnpm --filter @solufacil/database db:push
```

---

## Paso 2: Deploy API en DigitalOcean

### 2.1 Crear App Platform

1. Ve a [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Click **Create App**
3. Conecta tu repositorio de GitHub
4. Selecciona el repo `solufacil_monorepo`
5. En la configuración:
   - **Source Directory**: `/apps/api`
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - O usa **Auto-detect** y selecciona Dockerfile

### 2.2 Configurar Variables de Entorno

En DigitalOcean App Platform, agrega estas variables:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DATABASE_URL` | `postgresql://...@neon.tech/...?sslmode=require` |
| `JWT_SECRET` | (genera uno nuevo) |
| `JWT_REFRESH_SECRET` | (genera uno nuevo) |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://tu-app.vercel.app` (actualizar después) |
| `CLOUDINARY_CLOUD_NAME` | tu cloud name |
| `CLOUDINARY_API_KEY` | tu api key |
| `CLOUDINARY_API_SECRET` | tu api secret |

### 2.3 Generar JWT Secrets

```bash
# En tu terminal, genera secrets seguros:
openssl rand -base64 32  # Para JWT_SECRET
openssl rand -base64 32  # Para JWT_REFRESH_SECRET
```

### 2.4 Deploy

1. Click **Create Resources**
2. Espera que termine el build (~5-10 min)
3. Copia la URL generada: `https://solufacil-api-xxxxx.ondigitalocean.app`

---

## Paso 3: Deploy Frontend en Vercel

### 3.1 Crear Cuenta Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Regístrate con GitHub
3. Click **Add New Project**

### 3.2 Importar Proyecto

1. Selecciona el repo `solufacil_monorepo`
2. Vercel detectará el monorepo
3. Configura:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js (auto-detectado)
   - **Build Command**: `cd ../.. && pnpm turbo run build --filter=@solufacil/web`
   - **Install Command**: `cd ../.. && pnpm install`

### 3.3 Variables de Entorno

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_GRAPHQL_URL` | `https://solufacil-api-xxxxx.ondigitalocean.app/graphql` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | tu cloud name |

### 3.4 Deploy

1. Click **Deploy**
2. Espera el build (~3-5 min)
3. Tu app estará en: `https://solufacil.vercel.app`

---

## Paso 4: Actualizar CORS

Después de obtener la URL de Vercel, actualiza en DigitalOcean:

1. Ve a tu App en DigitalOcean
2. Settings → App-Level Environment Variables
3. Actualiza `FRONTEND_URL` con la URL de Vercel
4. Redeploy

---

## Verificación Final

### Checklist

- [ ] Neon: Base de datos creada y migrada
- [ ] DigitalOcean: API corriendo en `/graphql`
- [ ] Vercel: Frontend cargando correctamente
- [ ] CORS: Frontend puede llamar al API
- [ ] Auth: Login/logout funcionando
- [ ] Cloudinary: Subida de imágenes funcionando

### Probar Conexión

1. Abre tu app en Vercel
2. Intenta hacer login
3. Verifica en la consola del navegador que no hay errores CORS
4. Si hay errores, verifica `FRONTEND_URL` en DigitalOcean

---

## Troubleshooting

### Error: CORS blocked

```
FRONTEND_URL debe ser exactamente igual a la URL de Vercel
Ejemplo: https://solufacil.vercel.app (sin slash final)
```

### Error: Database connection failed

```
1. Verifica que DATABASE_URL tenga ?sslmode=require
2. Verifica que las credenciales sean correctas
3. En Neon, verifica que el proyecto esté activo
```

### Error: Build failed en Vercel

```
1. Verifica que pnpm-lock.yaml esté en el repo
2. Verifica que turbo.json tenga la config correcta
3. Revisa los logs de build en Vercel
```

---

## Dominio Personalizado (Opcional)

### En Vercel:
1. Settings → Domains
2. Agrega tu dominio: `app.solufacil.com`
3. Configura DNS según instrucciones

### En DigitalOcean:
1. Settings → Domains
2. Agrega: `api.solufacil.com`
3. Configura DNS

Después actualiza `FRONTEND_URL` y `NEXT_PUBLIC_GRAPHQL_URL` con los nuevos dominios.

---

---

## Migración de Datos (Keystone → Monorepo)

Si estás migrando desde la versión anterior (Keystone), sigue estos pasos:

### Arquitectura: Misma DB, Schemas Diferentes

```
┌─────────────────────────────────────────┐
│         Base de Datos (Neon)            │
│                                         │
│  ┌─────────────┐    ┌────────────────┐  │
│  │   public    │ →  │ solufacil_mono │  │
│  │ (Keystone)  │    │  (Monorepo)    │  │
│  └─────────────┘    └────────────────┘  │
└─────────────────────────────────────────┘
```

### Paso 1: Crear Schema en DB de Producción

```bash
# Conectar a la DB de producción
psql "tu-connection-string-de-neon"

# Crear el nuevo schema
CREATE SCHEMA IF NOT EXISTS solufacil_mono;
```

### Paso 2: Aplicar Estructura de Prisma

```bash
# Configurar la URL apuntando al nuevo schema
export DATABASE_URL="postgresql://user:pass@host/db?schema=solufacil_mono"

# Generar cliente Prisma
pnpm --filter @solufacil/database db:generate

# Crear tablas (sin datos)
pnpm --filter @solufacil/database db:push
```

### Paso 3: Verificar Datos (Dry-Run)

```bash
# Configurar URL SIN schema específico (para acceder a ambos)
export DATABASE_URL="postgresql://user:pass@host/db"

cd packages/database

# Primero, contar registros que se migrarán
npx tsx scripts/migrate-data.ts --count

# Verificar qué se migraría (sin ejecutar)
npx tsx scripts/migrate-data.ts --dry-run
```

### Paso 4: Ejecutar Migración

```bash
# ⚠️ IMPORTANTE: Hacer backup primero
pg_dump "tu-connection-string" > backup_$(date +%Y%m%d).sql

# Ejecutar migración real
npx tsx scripts/migrate-data.ts

# Verificar resultados
npx tsx scripts/migrate-data.ts --count
```

### Paso 5: Verificar en la Aplicación

1. Acceder a la nueva aplicación
2. Verificar que los datos se muestran correctamente
3. Probar login con usuarios existentes
4. Verificar préstamos, pagos, clientes

### Rollback (Si Algo Sale Mal)

```bash
# El script NO modifica el schema public (Keystone)
# Solo limpia y llena solufacil_mono

# Para limpiar solufacil_mono y empezar de nuevo:
psql "tu-connection-string"
DROP SCHEMA solufacil_mono CASCADE;
CREATE SCHEMA solufacil_mono;

# Luego repetir desde Paso 2
```

---

## Costos Estimados

| Servicio | Plan | Costo/mes |
|----------|------|-----------|
| Vercel | Hobby (Free) | $0 |
| DigitalOcean | Basic ($5) | $5 |
| Neon | Free Tier | $0 |
| Cloudinary | Free Tier | $0 |
| **Total** | | **~$5/mes** |

### Escalar después:
- Vercel Pro: $20/mes (más builds, analytics)
- DO Professional: $12/mes (más recursos)
- Neon Pro: $19/mes (más storage, compute)
