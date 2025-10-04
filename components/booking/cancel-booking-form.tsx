"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { cancelBookingSchema } from "@/lib/validations/booking"

type CancelBookingFormData = z.infer<typeof cancelBookingSchema>

interface CancelBookingFormProps {
  bookingId: string
  onSuccess: () => void
  onCancel: () => void
}

export function CancelBookingForm({ bookingId, onSuccess, onCancel }: CancelBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelBookingFormData>({
    resolver: zodResolver(cancelBookingSchema),
  })

  const onSubmit = async (data: CancelBookingFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Une erreur est survenue")
        setIsSubmitting(false)
        return
      }

      onSuccess()
    } catch (err) {
      console.error("Cancel booking error:", err)
      setError("Erreur réseau. Veuillez réessayer.")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="reason">Raison de l'annulation *</Label>
        <Textarea
          id="reason"
          placeholder="Veuillez expliquer pourquoi vous souhaitez annuler cette réservation (minimum 10 caractères)..."
          rows={4}
          {...register("reason")}
          className="mt-1.5"
        />
        {errors.reason && <p className="text-sm text-red-600 mt-1">{errors.reason.message}</p>}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" variant="destructive" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Annulation...
            </>
          ) : (
            "Confirmer l'annulation"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Conserver
        </Button>
      </div>
    </form>
  )
}
