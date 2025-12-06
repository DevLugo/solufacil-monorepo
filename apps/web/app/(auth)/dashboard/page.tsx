import { Metadata } from 'next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Panel principal de Solufacil',
}

// Placeholder data - will be replaced with real data from GraphQL
const stats = [
  {
    title: 'Cartera Total',
    value: '$2,450,000',
    change: '+12.5%',
    trend: 'up',
    icon: Wallet,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Cobranza del Día',
    value: '$85,230',
    change: '+8.2%',
    trend: 'up',
    icon: TrendingUp,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    title: 'Préstamos Activos',
    value: '1,234',
    change: '+24',
    trend: 'up',
    icon: Receipt,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    title: 'Deuda Vencida',
    value: '$125,400',
    change: '-3.1%',
    trend: 'down',
    icon: TrendingDown,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
]

const accounts = [
  {
    name: 'Banco Principal',
    type: 'BANK',
    balance: '$1,234,567.89',
    lastUpdate: 'Hace 5 min',
  },
  {
    name: 'Fondo de Oficina',
    type: 'OFFICE',
    balance: '$45,678.00',
    lastUpdate: 'Hace 10 min',
  },
  {
    name: 'Empleado - Juan Pérez',
    type: 'EMPLOYEE',
    balance: '$12,345.00',
    lastUpdate: 'Hace 1 hora',
  },
  {
    name: 'Gasolina Prepagada',
    type: 'GAS',
    balance: '$8,500.00',
    lastUpdate: 'Hace 2 horas',
  },
]

const recentActivity = [
  {
    type: 'payment',
    description: 'Abono recibido - María García',
    amount: '+$1,200',
    time: 'Hace 5 min',
  },
  {
    type: 'loan',
    description: 'Nuevo préstamo - José López',
    amount: '-$5,000',
    time: 'Hace 15 min',
  },
  {
    type: 'expense',
    description: 'Gasto de gasolina',
    amount: '-$850',
    time: 'Hace 30 min',
  },
  {
    type: 'transfer',
    description: 'Transferencia a empleado',
    amount: '-$10,000',
    time: 'Hace 1 hora',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido de vuelta. Aquí está el resumen de hoy.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="fintech-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
                )}
                <span
                  className={
                    stat.trend === 'up' ? 'text-success' : 'text-destructive'
                  }
                >
                  {stat.change}
                </span>
                <span className="ml-1">vs. ayer</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Accounts */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Cuentas
            </CardTitle>
            <CardDescription>
              Balance de todas las cuentas del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.name}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.lastUpdate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{account.balance}</p>
                    <Badge variant="outline" className="text-xs">
                      {account.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimas transacciones del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        activity.type === 'payment'
                          ? 'bg-success/10'
                          : activity.type === 'loan'
                          ? 'bg-info/10'
                          : activity.type === 'expense'
                          ? 'bg-warning/10'
                          : 'bg-muted'
                      }`}
                    >
                      {activity.type === 'payment' ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-medium ${
                      activity.amount.startsWith('+')
                        ? 'text-success'
                        : 'text-foreground'
                    }`}
                  >
                    {activity.amount}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="stats-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes Activos</p>
                <p className="text-2xl font-bold">1,847</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-secondary">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Recuperación</p>
                <p className="text-2xl font-bold">94.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-unicorn">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ganancia del Mes</p>
                <p className="text-2xl font-bold">$156,780</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
