"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CalendarIcon } from "lucide-react"

interface DateTimeStepProps {
  pickupDate: string
  pickupTimeSlot: string
  onUpdate: (data: { pickupDate?: string; pickupTimeSlot?: string }) => void
}

const TIME_SLOTS = [
  { value: "09:00-12:00", label: "9h00 - 12h00", description: "Matinée" },
  { value: "14:00-17:00", label: "14h00 - 17h00", description: "Après-midi" },
  { value: "18:00-21:00", label: "18h00 - 21h00", description: "Soirée" },
]

export function DateTimeStep({ pickupDate, pickupTimeSlot, onUpdate }: DateTimeStepProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(pickupDate ? new Date(pickupDate) : undefined)

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      onUpdate({ pickupDate: date.toISOString().split("T")[0] })
    }
  }

  const handleTimeSlotSelect = (timeSlot: string) => {
    onUpdate({ pickupTimeSlot: timeSlot })
  }

  // Disable past dates and Sundays
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today || date.getDay() === 0 // Sunday = 0
  }

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              Date de collecte
            </CardTitle>
            <CardDescription>Sélectionnez la date souhaitée pour la collecte de vos vêtements</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              className="rounded-md border"
              locale="fr"
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p>• Service disponible du lundi au samedi</p>
              <p>• Collecte minimum 24h à l'avance</p>
            </div>
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Créneau horaire
            </CardTitle>
            <CardDescription>Choisissez l'heure de collecte qui vous convient le mieux</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {TIME_SLOTS.map((slot) => (
              <Card
                key={slot.value}
                className={`cursor-pointer transition-all ${
                  pickupTimeSlot === slot.value ? "ring-2 ring-primary border-primary" : "hover:shadow-md"
                }`}
                onClick={() => handleTimeSlotSelect(slot.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{slot.label}</div>
                      <div className="text-sm text-muted-foreground">{slot.description}</div>
                    </div>
                    {pickupTimeSlot === slot.value && <Badge>Sélectionné</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Selected Summary */}
      {selectedDate && pickupTimeSlot && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-2">Collecte programmée</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">{formatSelectedDate(selectedDate)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">{TIME_SLOTS.find((slot) => slot.value === pickupTimeSlot)?.label}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Notre équipe viendra collecter vos vêtements à l'adresse indiquée dans ce créneau.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
