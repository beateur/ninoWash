"use client"

import { CollectionDeliveryStep } from "@/components/booking/collection-delivery-step"
import type { LogisticSlot } from "@/lib/types/logistic-slots"
import { useState } from "react"

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

  const handleComplete = () => {
    updateDateTime(pickupDate, pickupTimeSlot, pickupSlot, deliverySlot)
    onNext()
  }

  return (
    <div className="space-y-6">
      <CollectionDeliveryStep
        selectedPickup={pickupSlot}
        selectedDelivery={deliverySlot}
        onPickupSelect={setPickupSlot}
        onDeliverySelect={setDeliverySlot}
        onNext={handleComplete}
      />
    </div>
  )
}
