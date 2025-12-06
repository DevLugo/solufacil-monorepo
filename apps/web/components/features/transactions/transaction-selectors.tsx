'use client'

import { useEffect } from 'react'
import { useQuery, useLazyQuery } from '@apollo/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, MapPin, User, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTransactionContext } from './transaction-context'
import { ROUTES_QUERY } from '@/graphql/queries/transactions'
import { cn } from '@/lib/utils'
import { gql } from '@apollo/client'

// Query para obtener líderes por ruta - incluye direcciones para mostrar localidad
const LEADS_BY_ROUTE_QUERY = gql`
  query LeadsByRoute($routeId: ID!) {
    employees(routeId: $routeId, type: LEAD) {
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
`

interface Route {
  id: string
  name: string
  isActive: boolean
}

interface Lead {
  id: string
  personalData?: {
    fullName: string
    addresses?: Array<{
      id: string
      location?: {
        id: string
        name: string
      } | null
    }>
  }
}

// Función para generar el label del líder como en el código original
function getLeadLabel(lead: Lead): string {
  const locality = lead.personalData?.addresses?.[0]?.location?.name || ''
  const fullName = lead.personalData?.fullName || 'Sin nombre'

  if (locality) {
    return `${locality} · (${fullName})`
  }
  return fullName
}

export function TransactionSelectors() {
  const {
    selectedRouteId,
    selectedLeadId,
    selectedDate,
    setSelectedRouteId,
    setSelectedLeadId,
    setSelectedDate,
  } = useTransactionContext()

  const { data: routesData, loading: routesLoading } = useQuery<{ routes: Route[] }>(ROUTES_QUERY)

  // Usar useLazyQuery para cargar líderes
  const [getLeads, { data: leadsData, loading: leadsLoading }] = useLazyQuery<{ employees: Lead[] }>(
    LEADS_BY_ROUTE_QUERY,
    {
      fetchPolicy: 'network-only',
    }
  )

  // Cargar líderes cuando cambia la ruta seleccionada
  useEffect(() => {
    if (selectedRouteId) {
      getLeads({ variables: { routeId: selectedRouteId } })
    }
  }, [selectedRouteId, getLeads])

  const routes = routesData?.routes?.filter(r => r.isActive) || []
  const leads = leadsData?.employees || []

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg border">
      {/* Route Selector */}
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectedRouteId || ''}
          onValueChange={(value) => {
            setSelectedRouteId(value || null)
            setSelectedLeadId(null) // Reset lead when route changes
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Seleccionar ruta" />
          </SelectTrigger>
          <SelectContent>
            {routesLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              routes.map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  {route.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Date Picker */}
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[200px] justify-start text-left font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              {selectedDate ? (
                format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })
              ) : (
                <span>Seleccionar fecha</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Localidad/Líder Selector (only shown when route is selected) */}
      {selectedRouteId && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedLeadId || 'all'}
            onValueChange={(value) => setSelectedLeadId(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Seleccionar localidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las localidades</SelectItem>
              {leadsLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : leads.length === 0 ? (
                <div className="py-2 px-3 text-sm text-muted-foreground">
                  No hay localidades en esta ruta
                </div>
              ) : (
                leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {getLeadLabel(lead)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {/* Botón para limpiar selección */}
          {selectedLeadId && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedLeadId(null)}
              title="Limpiar localidad seleccionada"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Current Selection Summary */}
      {selectedRouteId && (
        <div className="ml-auto text-sm text-muted-foreground">
          {routes.find(r => r.id === selectedRouteId)?.name} •{' '}
          {format(selectedDate, "d MMM yyyy", { locale: es })}
        </div>
      )}
    </div>
  )
}
