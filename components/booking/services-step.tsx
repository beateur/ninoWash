"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Package, Info } from "lucide-react"

// Align service shape with guest step expectations
interface Service {
  id: string
  name: string
  description: string
  base_price: number
  type?: string // "one_time" | "subscription"
  processing_days?: number
  metadata?: {
    category?: string // "classic" | "express"
    weight_kg?: number
    delivery_time?: string
    includes?: string[]
  }
}

interface BookingItem {
  serviceId: string
  quantity: number
  specialInstructions?: string
}

interface ServicesStepProps {
  items: BookingItem[]
  onUpdate: (data: { items: BookingItem[]; totalAmount: number }) => void
  serviceType?: string
  readOnly?: boolean
}

export function ServicesStep({ items, onUpdate, serviceType = "classic", readOnly = false }: ServicesStepProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  // Single selected service + extra Kg (guest-like logic)
  const initialSelectedServiceId = items[0]?.serviceId ?? null
  const initialExtraKg = (() => {
    try {
      const raw = items[0]?.specialInstructions
      if (!raw) return 0
      const parsed = JSON.parse(raw)
      return typeof parsed?.extraKg === "number" ? parsed.extraKg : 0
    } catch {
      return 0
    }
  })()
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(initialSelectedServiceId)
  const [extraKg, setExtraKg] = useState<number>(initialExtraKg) // 0..13

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

  // Pricing tiers (match guest step)
  const extraKgPricing = [
    { kg: 2, price: 10 },  // 9kg total
    { kg: 5, price: 19 },  // 12kg total (guest currently uses 19)
    { kg: 8, price: 27 },  // 15kg total (guest currently uses 27)
    { kg: 11, price: 34 }, // 18kg (guest uses 11 here)
    { kg: 14, price: 40 }, // 21kg (guest uses 14 here)
  ]

  const getExtraKgPrice = (kg: number): number => {
    for (const tier of extraKgPricing) {
      if (kg <= tier.kg) return tier.price
    }
    return extraKgPricing[extraKgPricing.length - 1].price
  }

  const syncOnUpdate = (serviceId: string | null, nextExtraKg: number) => {
    if (!serviceId) {
      onUpdate({ items: [], totalAmount: 0 })
      return
    }
    
    // Calculer le prix total (base + extra kg)
    const service = services.find((s) => s.id === serviceId)
    const basePrice = service?.base_price || 0
    const extraPrice = nextExtraKg > 0 ? getExtraKgPrice(nextExtraKg) : 0
    const totalAmount = basePrice + extraPrice
    
    const specialInstructions = JSON.stringify({ extraKg: nextExtraKg })
    onUpdate({ 
      items: [{ serviceId, quantity: 1, specialInstructions }],
      totalAmount 
    })
  }

  const handleServiceSelect = (serviceId: string) => {
    if (readOnly) return
    setSelectedServiceId(serviceId)
    // When changing service, keep current extraKg selection
    syncOnUpdate(serviceId, extraKg)
  }

  const handleExtraKgChange = (kg: number) => {
    if (readOnly) return
    let next = kg
    if (next < 0) next = 0
    if (next > 14) next = 14 // Max +14kg => total 21kg (7kg base + 14kg)
    setExtraKg(next)
    syncOnUpdate(selectedServiceId, next)
  }

  const calculateTotal = (): number => {
    if (!selectedServiceId) return 0
    const service = services.find((s) => s.id === selectedServiceId)
    if (!service) return 0
    const base = service.base_price
    const extra = extraKg > 0 ? getExtraKgPrice(extraKg) : 0
    return base + extra
  }

  const getTotalWeight = (): number => {
    if (!selectedServiceId) return 0
    const service = services.find((s) => s.id === selectedServiceId)
    const baseWeight = service?.metadata?.weight_kg || 7
    return baseWeight + extraKg
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

  const totalAmount = calculateTotal()
  const totalWeight = getTotalWeight()

  return (
    <div className="space-y-8">
      {readOnly && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Mode modification :</strong> Les services ne peuvent pas être modifiés. Seules les adresses et la date peuvent être changées.
          </AlertDescription>
        </Alert>
      )}

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

      {/* Top Summary */}
      <div className="flex items-center justify-end space-x-4">
        {selectedServiceId ? (
          <>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Package className="h-3 w-3" />
              <span>{totalWeight}kg</span>
            </Badge>
            {serviceType === "classic" ? (
              <div className="text-lg font-semibold text-primary">{totalAmount.toFixed(2)}€</div>
            ) : (
              <div className="text-sm text-muted-foreground">Inclus dans l'abonnement</div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">Sélectionnez un service</div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">
          {readOnly ? "Services sélectionnés (lecture seule)" : "Tous les services disponibles"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(readOnly ? services.filter((s) => items.some((it) => it.serviceId === s.id)) : services).map((service) => {
            const isSelected = selectedServiceId === service.id
            const baseWeight = service.metadata?.weight_kg || 7
            return (
              <Card
                key={service.id}
                className={`p-4 ${readOnly ? "" : "cursor-pointer"} transition-all ${
                  isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"
                }`}
                onClick={() => !readOnly && handleServiceSelect(service.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{service.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {service.metadata?.category && (
                        <Badge variant="secondary">
                          {service.metadata.category === "classic" ? "Classique" : "Express"}
                        </Badge>
                      )}
                      {isSelected && <Badge variant="default">Sélectionné</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-lg">
                      {service.base_price.toFixed(2)} €
                      <span className="text-sm text-muted-foreground font-normal"> / {baseWeight}kg inclus</span>
                    </span>
                    <span className="text-muted-foreground">
                      {service.metadata?.delivery_time || `${service.processing_days ?? 3}j`}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {services.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun service disponible</h3>
          <p className="text-muted-foreground">Veuillez contacter le support</p>
        </div>
      )}

      {/* Extra Kg Selector */}
      {!readOnly && selectedServiceId && (
        <Card className="p-4 bg-muted/30">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Kilos supplémentaires (optionnel)</h3>
              <p className="text-sm text-muted-foreground">Ajoutez jusqu'à 14kg supplémentaires à votre commande</p>
            </div>
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

      {/* Selected Summary */}
      {selectedServiceId && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Récapitulatif</h3>
          <div className="space-y-2">
            {(() => {
              const service = services.find((s) => s.id === selectedServiceId)
              if (!service) return null
              return (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="font-medium">{service.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {extraKg > 0 ? `7kg + ${extraKg}kg` : `7kg`}
                    </span>
                  </div>
                  <div className="font-semibold">
                    {serviceType === "classic" ? `${totalAmount.toFixed(2)}€` : "Inclus"}
                  </div>
                </div>
              )
            })()}
          </div>
          {serviceType === "classic" && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total estimé</span>
                <span className="text-lg font-bold text-primary">{totalAmount.toFixed(2)}€</span>
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
