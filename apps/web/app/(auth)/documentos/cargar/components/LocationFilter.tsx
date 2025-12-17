import { useQuery } from '@apollo/client'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GET_ROUTES } from '@/graphql/queries/leader'
import { Loader2 } from 'lucide-react'

interface LocationFilterProps {
  selectedRouteId: string
  selectedLocationId: string
  locations: Array<{ id: string; name: string }>
  onRouteChange: (routeId: string) => void
  onLocationChange: (locationId: string) => void
  locationsLoading?: boolean
  disabled?: boolean
}

/**
 * Component for filtering loans by route and location
 * Route selection triggers location fetch
 */
export function LocationFilter({
  selectedRouteId,
  selectedLocationId,
  locations,
  onRouteChange,
  onLocationChange,
  locationsLoading,
  disabled,
}: LocationFilterProps) {
  const { data: routesData, loading: routesLoading } = useQuery(GET_ROUTES)
  const routes = routesData?.routes || []

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="route-select">
          Ruta <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedRouteId}
          onValueChange={onRouteChange}
          disabled={disabled || routesLoading}
        >
          <SelectTrigger id="route-select">
            {routesLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando rutas...</span>
              </div>
            ) : (
              <SelectValue placeholder="Selecciona una ruta..." />
            )}
          </SelectTrigger>
          <SelectContent>
            {routes.map((route: { id: string; name: string }) => (
              <SelectItem key={route.id} value={route.id}>
                {route.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location-select">
          Localidad <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedLocationId}
          onValueChange={onLocationChange}
          disabled={disabled || !selectedRouteId || locationsLoading}
        >
          <SelectTrigger id="location-select">
            {locationsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando localidades...</span>
              </div>
            ) : (
              <SelectValue placeholder={selectedRouteId ? 'Selecciona una localidad...' : 'Primero selecciona una ruta'} />
            )}
          </SelectTrigger>
          <SelectContent>
            {locations.length === 0 && selectedRouteId && !locationsLoading ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No hay localidades disponibles
              </div>
            ) : (
              locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {!selectedRouteId && (
        <p className="text-sm text-muted-foreground">
          Selecciona una ruta para ver las localidades disponibles
        </p>
      )}

      {selectedRouteId && !selectedLocationId && locations.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Selecciona una localidad para ver los préstamos de la semana
        </p>
      )}
    </div>
  )
}
