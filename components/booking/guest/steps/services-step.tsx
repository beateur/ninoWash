/**
 * Step 2: Services Selection
 * Allows guest to select services with quantities
 * Real-time price calculation
 */

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShoppingCart, Info } from "lucide-react"
import { toast } from "sonner"
import type { GuestBookingItem } from "@/lib/validations/guest-booking"
import { ServicesSkeleton } from "./service-card-skeleton"

interface Service {
  id: string
  name: string
  description: string
  base_price: number
  type: string // "one_time" | "subscription"
  processing_days: number
  metadata?: {
    category?: string // "classic" | "express"
    weight_kg?: number
    delivery_time?: string
    includes?: string[]
  }
}

interface ServicesStepProps {
  initialItems: GuestBookingItem[]
  onComplete: (items: GuestBookingItem[], totalAmount: number) => void
}

export function ServicesStep({ initialItems, onComplete }: ServicesStepProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    initialItems[0]?.serviceId || null
  )
  const [extraKg, setExtraKg] = useState(0) // Kilos supplémentaires (0 à 14)
  const [specialInstructions, setSpecialInstructions] = useState(
    initialItems[0]?.specialInstructions || ""
  )

  // Grille tarifaire pour kg supplémentaires
  const extraKgPricing = [
    { kg: 2, price: 10 },   // +2kg = 10€ (total 9kg)
    { kg: 5, price: 19 },   // +5kg = 20€ (total 12kg)
    { kg: 8, price: 27 },   // +8kg = 28€ (total 15kg)
    { kg: 11, price: 34 },  // +10kg = 35€ (total 17kg)
    { kg: 14, price: 40 },  // +13kg = 40€ (total 20kg)
  ]

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      // Use API route instead of direct Supabase call (consistent with authenticated flow)
      const response = await fetch("/api/services")
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Extract all services from grouped response
      const allServices = Object.values(data.services || {}).flat() as Service[]
      
      // All services are available for guest booking
      setServices(allServices)
    } catch (error) {
      console.error("[v0] Failed to fetch services:", error)
      toast.error("Impossible de charger les services. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const getExtraKgPrice = (kg: number): number => {
    for (const tier of extraKgPricing) {
      if (kg <= tier.kg) {
        return tier.price
      }
    }
    return extraKgPricing[extraKgPricing.length - 1].price
  }

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    setExtraKg(0) // Reset extra kg when changing service
  }

  const handleExtraKgChange = (kg: number) => {
    if (kg < 0) kg = 0
    if (kg > 14) kg = 14 // Max +14kg (total 21kg)
    setExtraKg(kg)
  }

  const calculateTotal = (): number => {
    if (!selectedServiceId) return 0
    
    const service = services.find((s) => s.id === selectedServiceId)
    if (!service) return 0

    const basePrice = service.base_price
    const extraPrice = extraKg > 0 ? getExtraKgPrice(extraKg) : 0
    
    return basePrice + extraPrice
  }

  const getTotalWeight = (): number => {
    if (!selectedServiceId) return 0
    const service = services.find((s) => s.id === selectedServiceId)
    const baseWeight = service?.metadata?.weight_kg || 7
    return baseWeight + extraKg
  }

  const handleSubmit = () => {
    if (!selectedServiceId) {
      toast.error("Veuillez sélectionner un service")
      return
    }

    const items: GuestBookingItem[] = [{
      serviceId: selectedServiceId,
      quantity: 1,
      specialInstructions,
    }]

    const total = calculateTotal()

    toast.success("Service sélectionné")
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
  const totalWeight = getTotalWeight()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sélectionnez votre service</h2>
        <p className="text-muted-foreground">
          Choisissez le service de pressing adapté à vos besoins
        </p>
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id
          const baseWeight = service.metadata?.weight_kg || 7

          return (
            <Card 
              key={service.id} 
              className={`p-4 cursor-pointer transition-all ${
                isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
              }`}
              onClick={() => handleServiceSelect(service.id)}
            >
              <div className="space-y-3">
                {/* Service Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {service.metadata?.category && (
                      <Badge variant="secondary">
                        {service.metadata.category === "classic" ? "Classique" : "Express"}
                      </Badge>
                    )}
                    {isSelected && (
                      <Badge variant="default">Sélectionné</Badge>
                    )}
                  </div>
                </div>

                {/* Price & Processing Time */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-lg">
                    {service.base_price.toFixed(2)} €
                    <span className="text-sm text-muted-foreground font-normal">
                      {" "}
                      / {baseWeight}kg inclus
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    {service.metadata?.delivery_time || `${service.processing_days}j`}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Extra Kg Selector (only if service selected) */}
      {selectedServiceId && (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Kilos supplémentaires (optionnel)</h3>
              <p className="text-sm text-muted-foreground">
                Ajoutez jusqu'à 14kg supplémentaires à votre commande
              </p>
            </div>

            {/* Kg Options */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Button
                variant={extraKg === 0 ? "default" : "outline"}
                className="w-full"
                onClick={() => handleExtraKgChange(0)}
              >
                <div className="text-center">
                  <div className="font-semibold">Base</div>
                  <div className="text-xs">7kg</div>
                </div>
              </Button>
              {extraKgPricing.map((tier) => {
                const totalKg = 7 + tier.kg
                return (
                  <Button
                    key={tier.kg}
                    variant={extraKg === tier.kg ? "default" : "outline"}
                    className="w-full"
                    onClick={() => handleExtraKgChange(tier.kg)}
                  >
                    <div className="text-center">
                      <div className="font-semibold">+{tier.price}€</div>
                      <div className="text-xs">{totalKg}kg</div>
                    </div>
                  </Button>
                )
              })}
            </div>

            {/* Custom Kg Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Poids total :</span>
                <span className="font-semibold">{totalWeight}kg</span>
              </div>
              <Input
                type="range"
                min="0"
                max="14"
                step="1"
                value={extraKg}
                onChange={(e) => handleExtraKgChange(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>7kg (base)</span>
                <span>21kg (max)</span>
              </div>
            </div>

            {extraKg > 0 && (
              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Supplément +{extraKg}kg :</span>
                  <span className="font-semibold">+{getExtraKgPrice(extraKg)}€</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

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
            {selectedServiceId ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {totalWeight}kg sélectionné{extraKg > 0 ? ` (7kg + ${extraKg}kg)` : ""}
                </p>
                <p className="text-2xl font-bold">{totalAmount.toFixed(2)} €</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sélectionnez un service pour continuer
              </p>
            )}
          </div>
          <Button onClick={handleSubmit} size="lg" disabled={!selectedServiceId}>
            Continuer →
          </Button>
        </div>
      </Card>
    </div>
  )
}
