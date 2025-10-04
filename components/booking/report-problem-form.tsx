"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { reportProblemSchema } from "@/lib/validations/booking"

type ReportProblemFormData = z.infer<typeof reportProblemSchema>

interface ReportProblemFormProps {
  bookingId: string
  onSuccess: () => void
  onCancel: () => void
}

const problemTypes = [
  { value: "damaged_items", label: "Articles endommagés" },
  { value: "missing_items", label: "Articles manquants" },
  { value: "late_delivery", label: "Livraison en retard" },
  { value: "quality_issue", label: "Problème de qualité" },
  { value: "other", label: "Autre" },
]

export function ReportProblemForm({ bookingId, onSuccess, onCancel }: ReportProblemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>("")

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReportProblemFormData>({
    resolver: zodResolver(reportProblemSchema),
  })

  const onSubmit = async (data: ReportProblemFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}/report`, {
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
      console.error("Report problem error:", err)
      setError("Erreur réseau. Veuillez réessayer.")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="type">Type de problème *</Label>
        <Select
          value={selectedType}
          onValueChange={(value) => {
            setSelectedType(value)
            setValue("type", value as any)
          }}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Sélectionnez le type de problème" />
          </SelectTrigger>
          <SelectContent>
            {problemTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description détaillée *</Label>
        <Textarea
          id="description"
          placeholder="Décrivez le problème en détail (minimum 20 caractères)..."
          rows={5}
          {...register("description")}
          className="mt-1.5"
        />
        {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Notre équipe vous contactera sous 24h</strong> pour résoudre votre problème. Vous recevrez une
          notification par email avec un numéro de suivi.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi...
            </>
          ) : (
            "Signaler le problème"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
