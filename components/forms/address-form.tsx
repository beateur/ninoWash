"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save } from "lucide-react"
import { addressSchema, type AddressInput } from "@/lib/validations/booking"

interface AddressFormProps {
  onSuccess: (address: any) => void
  isGuest?: boolean // Added prop to indicate guest user
}

export function AddressForm({ onSuccess, isGuest = false }: AddressFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: "home",
      label: "",
      streetAddress: "",
      buildingInfo: "",
      city: "",
      postalCode: "",
      accessInstructions: "",
      isDefault: false,
    },
  })

  const onSubmit = async (data: AddressInput) => {
    setIsLoading(true)
    setError(null)

    try {
      if (isGuest) {
        const guestAddress = {
          id: `guest-${Date.now()}`,
          type: data.type,
          label: data.label,
          street_address: data.streetAddress,
          building_info: data.buildingInfo,
          city: data.city,
          postal_code: data.postalCode,
          access_instructions: data.accessInstructions,
          is_default: data.isDefault,
        }

        onSuccess(guestAddress)
        form.reset()
      } else {
        // For authenticated users, use the API
        const response = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Une erreur est survenue")
        }

        onSuccess(result.address)
        form.reset()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isGuest && (
        <Alert>
          <AlertDescription>
            Cette adresse sera utilisée uniquement pour cette réservation. Pour sauvegarder vos adresses,
            connectez-vous.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type d'adresse</Label>
            <Select onValueChange={(value) => form.setValue("type", value as "home" | "work" | "other")}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Domicile</SelectItem>
                <SelectItem value="work">Bureau</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && <p className="text-sm text-red-600">{form.formState.errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Libellé</Label>
            <Input id="label" placeholder="Mon domicile" {...form.register("label")} />
            {form.formState.errors.label && (
              <p className="text-sm text-red-600">{form.formState.errors.label.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="streetAddress">Adresse</Label>
          <Input id="streetAddress" placeholder="123 rue de la Paix" {...form.register("streetAddress")} />
          {form.formState.errors.streetAddress && (
            <p className="text-sm text-red-600">{form.formState.errors.streetAddress.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="buildingInfo">Appartement / Étage (optionnel)</Label>
          <Input id="buildingInfo" placeholder="Apt 4B, 3ème étage" {...form.register("buildingInfo")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postalCode">Code postal</Label>
            <Input id="postalCode" placeholder="75001" {...form.register("postalCode")} />
            {form.formState.errors.postalCode && (
              <p className="text-sm text-red-600">{form.formState.errors.postalCode.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input id="city" placeholder="Paris" {...form.register("city")} />
            {form.formState.errors.city && <p className="text-sm text-red-600">{form.formState.errors.city.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accessInstructions">Instructions de livraison (optionnel)</Label>
          <Textarea
            id="accessInstructions"
            placeholder="Sonner à l'interphone, laisser devant la porte..."
            {...form.register("accessInstructions")}
          />
        </div>

        {!isGuest && (
          <div className="flex items-center space-x-2">
            <Checkbox id="isDefault" {...form.register("isDefault")} />
            <Label htmlFor="isDefault">Définir comme adresse par défaut</Label>
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {isGuest ? "Ajouter l'adresse" : "Enregistrer l'adresse"}
        </Button>
      </form>
    </div>
  )
}
