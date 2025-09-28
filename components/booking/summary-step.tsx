"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Clock, Package, Euro, Loader2, CheckCircle } from "lucide-react"

interface BookingData {
  pickupAddressId: string
  deliveryAddressId: string
  items: Array<{ serviceId: string; quantity: number; specialInstructions?: string }>
  pickupDate: string
  pickupTimeSlot: string
  specialInstructions: string
}

interface SummaryStepProps {
  bookingData: BookingData
}

export function SummaryStep({ bookingData }: SummaryStepProps) {
  const [addresses, setAddresses] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [specialInstructions, setSpecialInstructions] = useState(bookingData.specialInstructions || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch addresses
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
    let total = 0
    bookingData.items.forEach((item) => {
      const service = getServiceDetails(item.serviceId)
      if (service) {
        total += service.base_price * item.quantity
      }
    })
    return total
  }

  const getTotalItems = () => {
    return bookingData.items.reduce((total, item) => total + item.quantity, 0)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getTimeSlotLabel = (timeSlot: string) => {
    const slots = {
      "09:00-12:00": "9h00 - 12h00",
      "14:00-17:00": "14h00 - 17h00",
      "18:00-21:00": "18h00 - 21h00",
    }
    return slots[timeSlot as keyof typeof slots] || timeSlot
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingData,
          specialInstructions,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Une erreur est survenue")
      }

      // Redirect to success page or booking details
      router.push(`/bookings/${result.booking.id}?success=true`)
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
                  <p className="font-medium">{pickupAddress.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {pickupAddress.street_address}
                    {pickupAddress.apartment && `, ${pickupAddress.apartment}`}
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
                  <p className="font-medium">{deliveryAddress.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {deliveryAddress.street_address}
                    {deliveryAddress.apartment && `, ${deliveryAddress.apartment}`}
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
              <p className="font-medium">{formatDate(bookingData.pickupDate)}</p>
            </div>

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">CRÉNEAU HORAIRE</h4>
              <p className="font-medium">{getTimeSlotLabel(bookingData.pickupTimeSlot)}</p>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <CheckCircle className="inline h-4 w-4 mr-1 text-green-600" />
                Livraison estimée : 48h après collecte
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
                    <div className="font-semibold">{(service.base_price * item.quantity).toFixed(2)}€</div>
                    <div className="text-xs text-muted-foreground">{service.base_price}€ / pièce</div>
                  </div>
                </div>
              )
            })}
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <div className="flex items-center">
              <Euro className="h-5 w-5 mr-1" />
              {getTotalPrice().toFixed(2)}
            </div>
          </div>
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
          Confirmer la réservation
        </Button>
      </div>
    </div>
  )
}
