"use client"

import { useState, useEffect } from "react"
import { ServiceCard } from "@/components/ui/service-card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Package, Info } from "lucide-react"

interface Service {
  id: string
  name: string
  description: string
  category: string
  base_price: number
  unit: string
  processing_time_hours: number
}

interface BookingItem {
  serviceId: string
  quantity: number
  specialInstructions?: string
}

interface ServicesStepProps {
  items: BookingItem[]
  onUpdate: (data: { items: BookingItem[] }) => void
  serviceType?: string
}

export function ServicesStep({ items, onUpdate, serviceType = "classic" }: ServicesStepProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services")
      const data = await response.json()
      if (response.ok) {
        const allServices = Object.values(data.services || {}).flat() as Service[]
        setServices(allServices)
      }
    } catch (error) {
      console.error("Error fetching services:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    const updatedItems = [...items]
    const existingIndex = updatedItems.findIndex((item) => item.serviceId === serviceId)

    if (quantity === 0) {
      if (existingIndex !== -1) {
        updatedItems.splice(existingIndex, 1)
      }
    } else {
      if (existingIndex !== -1) {
        updatedItems[existingIndex].quantity = quantity
      } else {
        updatedItems.push({ serviceId, quantity })
      }
    }

    onUpdate({ items: updatedItems })
  }

  const getItemQuantity = (serviceId: string) => {
    const item = items.find((item) => item.serviceId === serviceId)
    return item?.quantity || 0
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const service = services.find((s) => s.id === item.serviceId)
      return total + (service?.base_price || 0) * item.quantity
    }, 0)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {serviceType !== "classic" && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {serviceType === "monthly"
              ? "Avec votre abonnement mensuel, vous bénéficiez de 2 collectes par semaine incluses."
              : "Avec votre abonnement trimestriel, vous bénéficiez de 3 collectes par semaine incluses."}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <div className="flex items-center justify-end space-x-4">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Package className="h-3 w-3" />
            <span>{getTotalItems()} articles</span>
          </Badge>
          {serviceType === "classic" && (
            <div className="text-lg font-semibold text-primary">{getTotalPrice().toFixed(2)}€</div>
          )}
          {serviceType !== "classic" && <div className="text-sm text-muted-foreground">Inclus dans l'abonnement</div>}
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Tous les services disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              quantity={getItemQuantity(service.id)}
              onQuantityChange={handleQuantityChange}
              serviceType={serviceType}
            />
          ))}
        </div>
      </div>

      {services.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun service disponible</h3>
          <p className="text-muted-foreground">Veuillez contacter le support</p>
        </div>
      )}

      {/* Selected Items Summary */}
      {items.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Articles sélectionnés</h3>
          <div className="space-y-2">
            {items.map((item) => {
              const service = services.find((s) => s.id === item.serviceId)
              if (!service) return null

              return (
                <div key={item.serviceId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="font-medium">{service.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">x{item.quantity}</span>
                  </div>
                  <div className="font-semibold">
                    {serviceType === "classic" ? `${(service.base_price * item.quantity).toFixed(2)}€` : "Inclus"}
                  </div>
                </div>
              )
            })}
          </div>

          {serviceType === "classic" && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total estimé</span>
                <span className="text-lg font-bold text-primary">{getTotalPrice().toFixed(2)}€</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Prix pour 7kg de linge. Le prix final sera ajusté selon le poids réel.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
