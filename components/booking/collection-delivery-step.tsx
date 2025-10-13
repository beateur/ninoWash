/**
 * Composant de sélection de créneaux Collecte & Livraison
 * Remplace l'ancien datetime-step pour un système de slots dynamiques
 *
 * @see docs/PRD/PRD_BOOKING_COLLECTION_DELIVERY.md
 * @see docs/IMPLEMENTATION_PLAN_SLOTS.md
 */

"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar, Clock, AlertCircle, Loader2 } from "lucide-react"
import { useLogisticSlots } from "@/hooks/use-logistic-slots"
import type { LogisticSlot, ServiceType } from "@/lib/types/logistic-slots"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface CollectionDeliveryStepProps {
  onPickupSelect: (slot: LogisticSlot) => void
  onDeliverySelect: (slot: LogisticSlot) => void
  selectedPickup: LogisticSlot | null
  selectedDelivery: LogisticSlot | null
  serviceType?: ServiceType
  onNext?: () => void
  onBack?: () => void
}

export function CollectionDeliveryStep({
  onPickupSelect,
  onDeliverySelect,
  selectedPickup,
  selectedDelivery,
  serviceType = "classic",
  onNext,
  onBack,
}: CollectionDeliveryStepProps) {
  console.log("[v0] CollectionDeliveryStep selectedPickup:", selectedPickup)
  const [activeSection, setActiveSection] = useState<"pickup" | "delivery">(
    "pickup"
  )

  // Fetch pickup slots (7 jours à partir d'aujourd'hui)
  const today = new Date().toISOString().split("T")[0]
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 7)
  const endDateStr = endDate.toISOString().split("T")[0]

  const {
    slots: pickupSlots,
    loading: pickupLoading,
    error: pickupError,
  } = useLogisticSlots({
    role: "pickup",
    startDate: today,
    endDate: endDateStr,
  })

  // Fetch delivery slots (filtrés selon pickup + délai)
  const deliveryStartDate = useMemo(() => {
    if (!selectedPickup) return today

    try {
      // Construire la date de fin du créneau de collecte
      const dateStr = selectedPickup.slot_date
      let timeStr = selectedPickup.end_time
      
      // PostgreSQL retourne TIME avec secondes (HH:MM:SS)
      // On extrait uniquement HH:MM pour l'ISO format
      if (timeStr.length > 5) {
        timeStr = timeStr.substring(0, 5) // "12:00:00" -> "12:00"
      }
      
      // Format: YYYY-MM-DD et HH:MM
      const pickupEnd = new Date(`${dateStr}T${timeStr}:00`)
      
      // Vérifier que la date est valide
      if (isNaN(pickupEnd.getTime())) {
        console.error("[v0] Invalid pickup date:", { dateStr, timeStr })
        return today
      }
      
      const minHours = serviceType === "express" ? 24 : 72
      pickupEnd.setHours(pickupEnd.getHours() + minHours)

      return pickupEnd.toISOString().split("T")[0]
    } catch (error) {
      console.error("[v0] Error calculating delivery start date:", error)
      return today
    }
  }, [selectedPickup, serviceType, today])

  const {
    slots: deliverySlots,
    loading: deliveryLoading,
    error: deliveryError,
  } = useLogisticSlots({
    role: "delivery",
    startDate: deliveryStartDate,
    endDate: endDateStr,
    enabled: !!selectedPickup, // Ne charge que si pickup sélectionné
  })

  // Format slot pour affichage
  const formatSlotDisplay = (slot: LogisticSlot) => {
    try {
      const date = new Date(slot.slot_date)
      const dayStr = format(date, "EEEE d MMM", { locale: fr })
      const timeStr = `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`

      return {
        day: dayStr.charAt(0).toUpperCase() + dayStr.slice(1),
        time: timeStr,
        label: slot.label,
      }
    } catch {
      // Fallback: extraire HH:MM même en cas d'erreur de formatage de date
      return {
        day: slot.slot_date,
        time: `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`,
        label: slot.label,
      }
    }
  }

  // Rendu d'un slot cliquable
  const SlotCard = ({
    slot,
    isSelected,
    onClick,
  }: {
    slot: LogisticSlot
    isSelected: boolean
    onClick: () => void
  }) => {
    const display = formatSlotDisplay(slot)

    return (
      <Card
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClick()
          }
        }}
        className={cn(
          "relative cursor-pointer p-4 transition-all hover:border-primary hover:shadow-md",
          isSelected && "border-primary bg-primary/5 shadow-md ring-2 ring-primary ring-offset-2"
        )}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{display.day}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{display.time}</span>
          </div>
          {display.label && (
            <div className="text-xs text-muted-foreground">
              {display.label}
            </div>
          )}
        </div>
        {isSelected && (
          <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-primary" />
        )}
      </Card>
    )
  }

  // Section pickup
  const renderPickupSection = () => {
    if (pickupLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )
    }

    if (pickupError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{pickupError}</AlertDescription>
        </Alert>
      )
    }

    if (pickupSlots.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aucun créneau de collecte disponible pour le moment. Veuillez nous
            contacter pour planifier votre collecte.
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {pickupSlots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            isSelected={selectedPickup?.id === slot.id}
            onClick={() => {
              onPickupSelect(slot)
              // Auto-switch à delivery après sélection pickup
              setTimeout(() => setActiveSection("delivery"), 300)
            }}
          />
        ))}
      </div>
    )
  }

  // Section delivery
  const renderDeliverySection = () => {
    if (!selectedPickup) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Veuillez d'abord sélectionner un créneau de collecte.
          </AlertDescription>
        </Alert>
      )
    }

    if (deliveryLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )
    }

    if (deliveryError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{deliveryError}</AlertDescription>
        </Alert>
      )
    }

    if (deliverySlots.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aucun créneau de livraison disponible respectant le délai minimum
            de {serviceType === "express" ? "24h" : "72h"}. Veuillez
            sélectionner une collecte plus tôt ou nous contacter.
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {deliverySlots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            isSelected={selectedDelivery?.id === slot.id}
            onClick={() => onDeliverySelect(slot)}
          />
        ))}
      </div>
    )
  }

  const canProceed = selectedPickup && selectedDelivery

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveSection("pickup")}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-colors",
            activeSection === "pickup"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Collecte
          {selectedPickup && (
            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />
          )}
          {activeSection === "pickup" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveSection("delivery")}
          disabled={!selectedPickup}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-colors",
            activeSection === "delivery"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
            !selectedPickup && "cursor-not-allowed opacity-50"
          )}
        >
          Livraison
          {selectedDelivery && (
            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />
          )}
          {activeSection === "delivery" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Section Content */}
      <div className="min-h-[300px]">
        {activeSection === "pickup" ? renderPickupSection() : renderDeliverySection()}
      </div>

      {/* Résumé sélection */}
      {(selectedPickup || selectedDelivery) && (
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <h3 className="text-sm font-medium">Créneaux sélectionnés</h3>
          {selectedPickup && (
            <div className="text-sm">
              <span className="text-muted-foreground">Collecte : </span>
              <span className="font-medium">
                {formatSlotDisplay(selectedPickup).day} •{" "}
                {formatSlotDisplay(selectedPickup).time}
              </span>
            </div>
          )}
          {selectedDelivery && (
            <div className="text-sm">
              <span className="text-muted-foreground">Livraison : </span>
              <span className="font-medium">
                {formatSlotDisplay(selectedDelivery).day} •{" "}
                {formatSlotDisplay(selectedDelivery).time}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      {(onNext || onBack) && (
        <div className="flex justify-between gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Retour
            </Button>
          )}
          {onNext && (
            <Button
              onClick={onNext}
              disabled={!canProceed}
              className="ml-auto"
            >
              {pickupLoading || deliveryLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                "Continuer"
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
