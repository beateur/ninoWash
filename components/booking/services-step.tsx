"use client"

import { useState, useEffect } from "react"
import { ServiceCard } from "@/components/ui/service-card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Package } from "lucide-react"

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
}

export function ServicesStep({ items, onUpdate }: ServicesStepProps) {
  const [services, setServices] = useState<Record<string, Service[]>>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services")
      const data = await response.json()
      if (response.ok) {
        setServices(data.services || {})
      }
    } catch (error) {
      console.error("[v0] Error fetching services:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    const updatedItems = [...items]
    const existingIndex = updatedItems.findIndex((item) => item.serviceId === serviceId)

    if (quantity === 0) {
      // Remove item if quantity is 0
      if (existingIndex !== -1) {
        updatedItems.splice(existingIndex, 1)
      }
    } else {
      // Update or add item
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
    let total = 0
    items.forEach((item) => {
      const service = Object.values(services)
        .flat()
        .find((s) => s.id === item.serviceId)
      if (service) {
        total += service.base_price * item.quantity
      }
    })
    return total
  }

  const filteredServices = Object.entries(services).reduce(
    (acc, [category, categoryServices]) => {
      const filtered = categoryServices.filter((service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      if (filtered.length > 0) {
        acc[category] = filtered
      }
      return acc
    },
    {} as Record<string, Service[]>,
  )

  const categories = Object.keys(services)
  const allServices = Object.values(filteredServices).flat()

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
    <div className="space-y-6">
      {/* Search and Summary */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {items.length > 0 && (
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Package className="h-3 w-3" />
              <span>{getTotalItems()} articles</span>
            </Badge>
            <div className="text-lg font-semibold text-primary">{getTotalPrice().toFixed(2)}€</div>
          </div>
        )}
      </div>

      {/* Services */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="cleaning">Nettoyage</TabsTrigger>
          <TabsTrigger value="ironing">Repassage</TabsTrigger>
          <TabsTrigger value="special">Spécialisé</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {allServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  quantity={getItemQuantity(service.id)}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun service trouvé</h3>
              <p className="text-muted-foreground">Essayez de modifier votre recherche</p>
            </div>
          )}
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4 mt-6">
            {filteredServices[category] && filteredServices[category].length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredServices[category].map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    quantity={getItemQuantity(service.id)}
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun service dans cette catégorie</h3>
                <p className="text-muted-foreground">Essayez une autre catégorie</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Selected Items Summary */}
      {items.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Articles sélectionnés</h3>
          <div className="space-y-2">
            {items.map((item) => {
              const service = Object.values(services)
                .flat()
                .find((s) => s.id === item.serviceId)
              if (!service) return null

              return (
                <div key={item.serviceId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="font-medium">{service.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">x{item.quantity}</span>
                  </div>
                  <div className="font-semibold">{(service.base_price * item.quantity).toFixed(2)}€</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
