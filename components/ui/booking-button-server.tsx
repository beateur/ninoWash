"use client"

import { BookingButton } from "./booking-button"
import { Plus } from "lucide-react"

/**
 * Server-friendly wrapper for BookingButton
 * Use this in Server Components that need booking functionality with feature flag support
 */
export function NewBookingButton({ 
  href = "/reservation",
  label = "Nouvelle réservation" 
}: { 
  href?: string
  label?: string 
}) {
  return (
    <BookingButton href={href}>
      <Plus className="mr-2 h-4 w-4" />
      {label}
    </BookingButton>
  )
}
