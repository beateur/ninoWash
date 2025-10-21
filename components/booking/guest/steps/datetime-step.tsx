"use client"

import { CollectionDeliveryStep } from "@/components/booking/collection-delivery-step"
import type { LogisticSlot } from "@/lib/types/logistic-slots"
import { useState, useEffect } from "react"

interface DateTimeStepProps {
  pickupDate: Date | null
  pickupTimeSlot: string | null
  deliveryDate: Date | null
  updateDateTime: (
    pickupDate: Date | null,
    pickupTimeSlot: string | null,
    pickupSlot?: LogisticSlot | null,
    deliverySlot?: LogisticSlot | null
  ) => void
  onNext: () => void
}

export function DateTimeStep({
  pickupDate,
  pickupTimeSlot,
  deliveryDate,
  updateDateTime,
  onNext,
}: DateTimeStepProps) {
  const [pickupSlot, setPickupSlot] = useState<LogisticSlot | null>(null)
  const [deliverySlot, setDeliverySlot] = useState<LogisticSlot | null>(null)

  // Auto-update parent quand les deux slots sont sélectionnés
  // Pas de dépendances pour éviter les re-renders (appelé uniquement quand slots changent)
  useEffect(() => {
    if (pickupSlot && deliverySlot) {
      // Convertir la date string en Date object
      const pickupDateObj = new Date(pickupSlot.slot_date)
      const timeSlotStr = `${pickupSlot.start_time.substring(0, 5)}-${pickupSlot.end_time.substring(0, 5)}`
      
      updateDateTime(pickupDateObj, timeSlotStr, pickupSlot, deliverySlot)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupSlot, deliverySlot]) // Seulement quand les slots changent

  const handleComplete = () => {
    if (pickupSlot && deliverySlot) {
      onNext()
    }
  }

  return (
    <div className="space-y-6">
      <CollectionDeliveryStep
        selectedPickup={pickupSlot}
        selectedDelivery={deliverySlot}
        onPickupSelect={setPickupSlot}
        onDeliverySelect={setDeliverySlot}
      />
    </div>
  )
}
