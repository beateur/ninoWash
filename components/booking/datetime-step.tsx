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

  // Mettre à jour les données parent à chaque changement de slot
  useEffect(() => {
    if (pickupSlot && deliverySlot) {
      updateDateTime(pickupDate, pickupTimeSlot, pickupSlot, deliverySlot)
    }
  }, [pickupSlot, deliverySlot])

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
