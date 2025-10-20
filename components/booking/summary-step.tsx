"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth" // Fixed import path for useAuth hook
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Clock, Package, Euro, Loader2, CheckCircle, Info } from "lucide-react"
import type { LogisticSlot } from "@/lib/types/logistic-slots"

interface BookingData {
  pickupAddressId: string
  deliveryAddressId: string
  pickupAddress?: any
  deliveryAddress?: any
  items: Array<{ serviceId: string; quantity: number; specialInstructions?: string }>
  pickupDate: string
  pickupTimeSlot: string
  pickupSlot?: LogisticSlot | null
  deliverySlot?: LogisticSlot | null
  specialInstructions: string
}

interface SummaryStepProps {
  bookingData: BookingData
  serviceType?: string
  isModification?: boolean
  bookingId?: string
}

export function SummaryStep({
  bookingData,
  serviceType = "classic",
  isModification = false,
  bookingId,
}: SummaryStepProps) {
  const [addresses, setAddresses] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [specialInstructions, setSpecialInstructions] = useState(bookingData.specialInstructions || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth() // Added useAuth hook

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch addresses for authenticated users
      const addressResponse = await fetch("/api/addresses")
      const addressData = await addressResponse.json()
      if (addressResponse.ok) {
        setAddresses(addressData.addresses || [])
      }

      // Fetch services
      const servicesResponse = await fetch("/api/services")
      const servicesData = await servicesResponse.json()
      if (servicesResponse.ok) {
        const allServices = Object.values(servicesData.services || {}).flat()
        setServices(allServices as any[])
      }
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
    }
  }

  const pickupAddress = addresses.find((addr) => addr.id === bookingData.pickupAddressId)

  const deliveryAddress = addresses.find((addr) => addr.id === bookingData.deliveryAddressId)

  const getServiceDetails = (serviceId: string) => {
    return services.find((service) => service.id === serviceId)
  }

  const getTotalPrice = () => {
    return bookingData.items.reduce((total, item) => {
      const service = getServiceDetails(item.serviceId)
      return total + (service?.base_price || 0) * item.quantity
    }, 0)
  }

  const getTotalItems = () => {
    return bookingData.items.reduce((total, item) => total + item.quantity, 0)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date non sélectionnée"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Date invalide"
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      return "Date invalide"
    }
  }

  const getDisplayDate = () => {
    // Utilise toujours le slot de collecte
    if (bookingData.pickupSlot?.slot_date) {
      return formatDate(bookingData.pickupSlot.slot_date)
    }
    return "Date non sélectionnée"
  }

  const getDisplayTimeSlot = () => {
    // Utilise toujours le slot de collecte
    if (bookingData.pickupSlot) {
      const start = bookingData.pickupSlot.start_time?.substring(0, 5) || ""
      const end = bookingData.pickupSlot.end_time?.substring(0, 5) || ""
      return `${start} - ${end}`
    }
    return "Créneau non sélectionné"
  }

  const getServiceTypeInfo = () => {
    // Check if any selected service is express (has metadata with delivery_type: "express")
    const hasExpressService = bookingData.items.some((item) => {
      const service = getServiceDetails(item.serviceId)
      return service?.metadata?.delivery_type === "express"
    })

    if (hasExpressService) {
      return { name: "Service Express", price: "Livraison en 24h", included: false }
    }

    // Check for classic service
    const hasClassicService = bookingData.items.some((item) => {
      const service = getServiceDetails(item.serviceId)
      return service?.metadata?.delivery_type === "classic"
    })

    if (hasClassicService) {
      return { name: "Service Classique", price: "Livraison en 72h", included: false }
    }

    // Default for subscriptions
    switch (serviceType) {
      case "monthly":
        return { name: "Abonnement Mensuel", price: "99,99€/mois", included: true }
      case "quarterly":
        return { name: "Abonnement Trimestriel", price: "249,99€/trimestre", included: true }
      default:
        return { name: "Service Classique", price: "Livraison en 72h", included: false }
    }
  }

  const serviceInfo = getServiceTypeInfo()

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Mode modification: PATCH request
      if (isModification && bookingId) {
        const modificationPayload = {
          pickupDate: bookingData.pickupDate,
          pickupTimeSlot: bookingData.pickupTimeSlot,
          pickupAddressId: bookingData.pickupAddressId,
          deliveryAddressId: bookingData.deliveryAddressId,
          specialInstructions,
        }

        console.log("[v0] Sending PATCH to /api/bookings - Payload:", modificationPayload)

        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(modificationPayload),
        })

        const result = await response.json()

        console.log("[v0] PATCH response:", { ok: response.ok, status: response.status, result })

        if (!response.ok) {
          throw new Error(result.error || "Erreur lors de la modification")
        }

        router.push(`/dashboard?success=modification`)
        return
      }

      // Mode nouvelle réservation: POST request
      const bookingPayload: any = {
        pickupAddressId: bookingData.pickupAddressId,
        deliveryAddressId: bookingData.deliveryAddressId,
        items: bookingData.items,
        specialInstructions,
        serviceType,
      }

      // Slot-based scheduling (prioritaire)
      if (bookingData.pickupSlot?.id && bookingData.deliverySlot?.id) {
        bookingPayload.pickupSlotId = bookingData.pickupSlot.id
        bookingPayload.deliverySlotId = bookingData.deliverySlot.id
        // Ne PAS inclure pickupDate/pickupTimeSlot si on utilise les slots
      } else if (bookingData.pickupDate?.trim() && bookingData.pickupTimeSlot?.trim()) {
        // Fallback: Legacy date/time fields (seulement si non-vides)
        bookingPayload.pickupDate = bookingData.pickupDate
        bookingPayload.pickupTimeSlot = bookingData.pickupTimeSlot
      }

      console.log("[v0] Booking payload:", bookingPayload)

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      })

      const result = await response.json()

      if (!response.ok) {
        console.log("[v0] Booking creation error:", result.details || result.error)
        throw new Error(result.error || "Une erreur est survenue")
      }

      // New booking created with status='pending' (awaiting admin confirmation)
      // Redirect to success/confirmation page
      const newBookingId = result.id
      const bookingNumber = result.booking?.booking_number

      if (newBookingId) {
        // Redirect to confirmation page with booking number
        const successUrl = `/reservation/success?number=${encodeURIComponent(bookingNumber || newBookingId)}`
        console.log("[v0] Redirecting to confirmation page:", successUrl)
        router.push(successUrl)
      } else {
        throw new Error("ID de réservation manquant dans la réponse")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>{serviceInfo.name}</strong> - {serviceInfo.price}
          {serviceInfo.included && " (Services inclus dans l'abonnement)"}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Addresses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Adresses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">COLLECTE</h4>
              {pickupAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {pickupAddress.street_address}
                    {(pickupAddress.buildingInfo || pickupAddress.building_info) && `, ${pickupAddress.buildingInfo || pickupAddress.building_info}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pickupAddress.postal_code} {pickupAddress.city}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">LIVRAISON</h4>
              {deliveryAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {deliveryAddress.street_address}
                    {(deliveryAddress.buildingInfo || deliveryAddress.building_info) && `, ${deliveryAddress.buildingInfo || deliveryAddress.building_info}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {deliveryAddress.postal_code} {deliveryAddress.city}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Planification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">DATE DE COLLECTE</h4>
              <p className="font-medium">{getDisplayDate()}</p>
            </div>

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">CRÉNEAU HORAIRE</h4>
              <p className="font-medium">{getDisplayTimeSlot()}</p>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <CheckCircle className="inline h-4 w-4 mr-1 text-green-600" />
                Livraison estimée : 72h après collecte
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Services sélectionnés
          </CardTitle>
          <CardDescription>{getTotalItems()} articles au total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookingData.items.map((item, index) => {
              const service = getServiceDetails(item.serviceId)
              if (!service) return null

              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{service.name}</span>
                      <Badge variant="outline" className="text-xs">
                        x{item.quantity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {serviceType === "classic" ? `${(service.base_price * item.quantity).toFixed(2)}€` : "Inclus"}
                    </div>
                    {serviceType === "classic" && (
                      <div className="text-xs text-muted-foreground">{service.base_price}€ / pièce</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <div className="flex items-center">
              {serviceType === "classic" ? (
                <>
                  <Euro className="h-5 w-5 mr-1" />
                  {getTotalPrice().toFixed(2)}
                </>
              ) : (
                <span className="text-green-600">Inclus dans l'abonnement</span>
              )}
            </div>
          </div>

          {serviceType === "classic" && (
            <p className="text-xs text-muted-foreground mt-2">Prix pour 7kg de linge par service sélectionné</p>
          )}
        </CardContent>
      </Card>

      {/* Special Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions spéciales</CardTitle>
          <CardDescription>Ajoutez des informations supplémentaires pour notre équipe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Instructions (optionnel)</Label>
            <Textarea
              id="specialInstructions"
              placeholder="Taches particulières, précautions spéciales, préférences de traitement..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-center pt-4">
        <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="min-w-48">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isModification ? "Enregistrer les modifications" : "Confirmer la réservation"}
        </Button>
      </div>
    </div>
  )
}
