/**
 * Step 3: Date & Time Selection
 * Adapted from authenticated flow for guest booking
 * Allows selection of pickup date and time slot
 */

"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { fr } from "date-fns/locale"

interface DateTimeStepProps {
  initialPickupDate: string | null
  initialPickupTimeSlot: string | null
  onComplete: (pickupDate: string, pickupTimeSlot: string) => void
}

const TIME_SLOTS = [
  { value: "09:00-12:00", label: "9h00 - 12h00", description: "Matinée" },
  { value: "14:00-17:00", label: "14h00 - 17h00", description: "Après-midi" },
  { value: "18:00-21:00", label: "18h00 - 21h00", description: "Soirée" },
]

export function DateTimeStep({
  initialPickupDate,
  initialPickupTimeSlot,
  onComplete,
}: DateTimeStepProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialPickupDate ? new Date(initialPickupDate) : undefined
  )
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(
    initialPickupTimeSlot
  )

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot)
  }

  const isDateDisabled = (date: Date) => {
    // Disable past dates and Sundays
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    
    return checkDate < tomorrow || checkDate.getDay() === 0 // Sunday = 0
  }

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateDeliveryDate = (pickupDate: Date): string => {
    const delivery = new Date(pickupDate)
    delivery.setDate(delivery.getDate() + 3) // 72h = 3 days
    return delivery.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

  const handleSubmit = () => {
    if (!selectedDate) {
      toast.error("Veuillez sélectionner une date de collecte")
      return
    }

    if (!selectedTimeSlot) {
      toast.error("Veuillez sélectionner un créneau horaire")
      return
    }

    const pickupDateISO = selectedDate.toISOString()
    toast.success("Date et heure enregistrées !")
    onComplete(pickupDateISO, selectedTimeSlot)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Planifiez votre collecte</h2>
        <p className="text-muted-foreground">
          Choisissez la date et l&apos;heure de collecte de votre linge
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Date de collecte
            </CardTitle>
            <CardDescription>
              Sélectionnez la date souhaitée pour la collecte de vos vêtements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              className="rounded-md border"
              locale={fr}
            />
            <div className="mt-4 text-sm text-muted-foreground space-y-1">
              <p>• Service disponible du lundi au samedi</p>
              <p>• Réservation minimum pour le lendemain</p>
              <p>• Livraison sous 72h après la collecte</p>
            </div>
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Créneau horaire
            </CardTitle>
            <CardDescription>
              Choisissez l&apos;heure de collecte qui vous convient le mieux
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {TIME_SLOTS.map((slot) => (
              <Card
                key={slot.value}
                className={`cursor-pointer transition-all ${
                  selectedTimeSlot === slot.value
                    ? "ring-2 ring-primary border-primary bg-primary/5"
                    : "hover:shadow-md hover:border-primary/50"
                }`}
                onClick={() => handleTimeSlotSelect(slot.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{slot.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {slot.description}
                      </div>
                    </div>
                    {selectedTimeSlot === slot.value && (
                      <Badge variant="default">Sélectionné</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Selected Summary */}
      {selectedDate && selectedTimeSlot && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3">📅 Récapitulatif de la collecte</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Collecte prévue</p>
                  <p className="text-sm text-muted-foreground">
                    {formatSelectedDate(selectedDate)}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {TIME_SLOTS.find((slot) => slot.value === selectedTimeSlot)?.label}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Livraison estimée</p>
                  <p className="text-sm text-muted-foreground">
                    {calculateDeliveryDate(selectedDate)} (72h après collecte)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        className="w-full"
        size="lg"
        disabled={!selectedDate || !selectedTimeSlot}
      >
        Continuer →
      </Button>
    </div>
  )
}
