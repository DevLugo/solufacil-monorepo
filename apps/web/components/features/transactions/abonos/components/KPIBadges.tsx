import {
  Users,
  Check,
  Ban,
  Trash2,
  DollarSign,
  Wallet,
  Building2,
  AlertTriangle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { CombinedTotals, PaymentTotals } from '../types'

interface KPIBadgesProps {
  filteredLoansCount: number
  registeredCount: number
  totals: PaymentTotals
  combinedTotals: CombinedTotals
  incompleteCount: number
  showOnlyIncomplete: boolean
  onToggleIncomplete: () => void
}

export function KPIBadges({
  filteredLoansCount,
  registeredCount,
  totals,
  combinedTotals,
  incompleteCount,
  showOnlyIncomplete,
  onToggleIncomplete,
}: KPIBadgesProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-wrap items-center gap-1.5 justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs py-0.5 px-2 cursor-default">
              <Users className="h-3 w-3 mr-1" />
              {filteredLoansCount}
            </Badge>
          </TooltipTrigger>
          <TooltipContent><p>Clientes activos</p></TooltipContent>
        </Tooltip>

        {registeredCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs py-0.5 px-2 bg-slate-100 text-slate-700 border-slate-300 cursor-default">
                <Check className="h-3 w-3 mr-1" />
                {registeredCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent><p>Ya registrados hoy</p></TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs py-0.5 px-2 bg-green-50 text-green-700 border-green-200 cursor-default">
              <Check className="h-3 w-3 mr-1" />
              {totals.count}
            </Badge>
          </TooltipTrigger>
          <TooltipContent><p>Abonos nuevos por guardar</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs py-0.5 px-2 bg-red-50 text-red-700 border-red-200 cursor-default">
              <Ban className="h-3 w-3 mr-1" />
              {combinedTotals.noPayment}
            </Badge>
          </TooltipTrigger>
          <TooltipContent><p>Marcados sin pago</p></TooltipContent>
        </Tooltip>

        {combinedTotals.deleted > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs py-0.5 px-2 bg-red-100 text-red-700 border-red-300 cursor-default">
                <Trash2 className="h-3 w-3 mr-1" />
                {combinedTotals.deleted}
              </Badge>
            </TooltipTrigger>
            <TooltipContent><p>Pagos a eliminar</p></TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs py-0.5 px-2 bg-purple-50 text-purple-700 border-purple-200 cursor-default">
              <DollarSign className="h-3 w-3 mr-1" />
              {formatCurrency(combinedTotals.commission)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent><p>Comisión del líder</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs py-0.5 px-2 bg-green-50 text-green-700 border-green-200 cursor-default">
              <Wallet className="h-3 w-3 mr-1" />
              {formatCurrency(combinedTotals.cash)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent><p>Cobrado en efectivo</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs py-0.5 px-2 bg-blue-50 text-blue-700 border-blue-200 cursor-default">
              <Building2 className="h-3 w-3 mr-1" />
              {formatCurrency(combinedTotals.bank)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent><p>Cobrado por transferencia</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs py-0.5 px-2 font-bold bg-slate-100 cursor-default">
              {formatCurrency(combinedTotals.total)}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <p className="font-semibold">Distribución Total</p>
              <p>💵 Efectivo: {formatCurrency(combinedTotals.cash)}</p>
              <p>🏦 Transferencia: {formatCurrency(combinedTotals.bank)}</p>
              <p>📊 Comisión: {formatCurrency(combinedTotals.commission)}</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {incompleteCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs py-0.5 px-2 cursor-pointer transition-colors",
                  showOnlyIncomplete
                    ? "bg-orange-100 text-orange-700 border-orange-300"
                    : "bg-orange-50 text-orange-600 border-orange-200"
                )}
                onClick={onToggleIncomplete}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {incompleteCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click para {showOnlyIncomplete ? 'mostrar todos' : 'filtrar solo incompletos'}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
