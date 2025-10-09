/**
 * Step 2: Services Selection
 * Allows guest to select services with quantities
 * Real-time price calculation
 */

"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShoppingCart, Info } from "lucide-react"
import { toast } from "sonner"
import type { GuestBookingItem } from "@/lib/validations/guest-booking"
import { ServicesSkeleton } from "./service-card-skeleton"
import { handleSupabaseError } from "../error-boundary"

interface Service {
  id: string
  name: string
  description: string
  base_price: number
  unit: string
  category: string
  processing_time_hours: number
}

interface ServicesStepProps {
  initialItems: GuestBookingItem[]
  onComplete: (items: GuestBookingItem[], totalAmount: number) => void
}

export function ServicesStep({ initialItems, onComplete }: ServicesStepProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Map<string, GuestBookingItem>>(
    new Map(initialItems.map((item) => [item.serviceId, item]))
  )
  const [specialInstructions, setSpecialInstructions] = useState(
    initialItems[0]?.specialInstructions || ""
  )

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })

      if (error) throw error

      // Filter out subscriptions (guest can only book classic services)
      const classicServices = data?.filter(
        (service) => !service.category?.toLowerCase().includes("abonnement")
      ) || []

      setServices(classicServices)
    } catch (error) {
      console.error("[v0] Failed to fetch services:", error)
      const errorMessage = handleSupabaseError(error)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (service: Service, quantity: number) => {
    if (quantity <= 0) {
      // Remove item
      const newItems = new Map(selectedItems)
      newItems.delete(service.id)
      setSelectedItems(newItems)
    } else {
      // Add or update item
      const newItems = new Map(selectedItems)
      newItems.set(service.id, {
        serviceId: service.id,
        quantity,
        specialInstructions,
      })
      setSelectedItems(newItems)
    }
  }

  const calculateTotal = (): number => {
    let total = 0
    selectedItems.forEach((item) => {
      const service = services.find((s) => s.id === item.serviceId)
      if (service) {
        total += service.base_price * item.quantity
      }
    })
    return total
  }

  const handleSubmit = () => {
    if (selectedItems.size === 0) {
      toast.error("Veuillez sélectionner au moins un service")
      return
    }

    const items = Array.from(selectedItems.values()).map((item) => ({
      ...item,
      specialInstructions,
    }))

    const total = calculateTotal()

    toast.success(`${items.length} service(s) sélectionné(s)`)
    onComplete(items, total)
  }

  if (loading) {
    return <ServicesSkeleton />
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Aucun service disponible pour le moment</p>
      </div>
    )
  }

  const totalAmount = calculateTotal()
  const totalItems = Array.from(selectedItems.values()).reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sélectionnez vos services</h2>
        <p className="text-muted-foreground">
          Choisissez les articles que vous souhaitez faire nettoyer
        </p>
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const item = selectedItems.get(service.id)
          const quantity = item?.quantity || 0

          return (
            <Card key={service.id} className="p-4">
              <div className="space-y-3">
                {/* Service Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.description}
                    </p>
                  </div>
                  {service.category && (
                    <Badge variant="secondary" className="ml-2">
                      {service.category}
                    </Badge>
                  )}
                </div>

                {/* Price & Processing Time */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-lg">
                    {service.base_price.toFixed(2)} €
                    <span className="text-sm text-muted-foreground font-normal">
                      {" "}
                      / {service.unit}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    {service.processing_time_hours}h
                  </span>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(service, quantity - 1)}
                    disabled={quantity === 0}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      handleQuantityChange(service, val)
                    }}
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(service, quantity + 1)}
                  >
                    +
                  </Button>
                  <span className="ml-auto font-semibold">
                    {(service.base_price * quantity).toFixed(2)} €
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Special Instructions */}
      <Card className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Instructions spéciales (optionnel)</h3>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Exemple: Attention aux taches sur la chemise blanche, traitement délicat souhaité..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {specialInstructions.length} / 500 caractères
            </p>
          </div>
        </div>
      </Card>

      {/* Summary Bar */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {totalItems} article{totalItems > 1 ? "s" : ""} sélectionné{totalItems > 1 ? "s" : ""}
            </p>
            <p className="text-2xl font-bold">{totalAmount.toFixed(2)} €</p>
          </div>
          <Button onClick={handleSubmit} size="lg" disabled={selectedItems.size === 0}>
            Continuer →
          </Button>
        </div>
      </Card>
    </div>
  )
}
