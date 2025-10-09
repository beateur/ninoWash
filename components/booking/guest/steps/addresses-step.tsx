/**
 * Step 1: Addresses (Pickup & Delivery)
 * Collects pickup and delivery addresses for guest booking
 * Option to use same address for both
 */

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { guestAddressSchema, type GuestAddress } from "@/lib/validations/guest-booking"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { MapPin, Package, Home } from "lucide-react"
import { toast } from "sonner"

interface AddressesStepProps {
  initialPickupAddress: GuestAddress | null
  initialDeliveryAddress: GuestAddress | null
  onComplete: (pickup: GuestAddress, delivery: GuestAddress) => void
}

export function AddressesStep({
  initialPickupAddress,
  initialDeliveryAddress,
  onComplete,
}: AddressesStepProps) {
  const [sameAddress, setSameAddress] = useState(
    initialPickupAddress && initialDeliveryAddress
      ? JSON.stringify(initialPickupAddress) === JSON.stringify(initialDeliveryAddress)
      : false
  )

  const pickupForm = useForm<GuestAddress>({
    resolver: zodResolver(guestAddressSchema),
    defaultValues: initialPickupAddress || {
      street_address: "",
      city: "",
      postal_code: "",
      building_info: "",
      access_instructions: "",
      label: "Domicile",
    },
  })

  const deliveryForm = useForm<GuestAddress>({
    resolver: zodResolver(guestAddressSchema),
    defaultValues: initialDeliveryAddress || {
      street_address: "",
      city: "",
      postal_code: "",
      building_info: "",
      access_instructions: "",
      label: "Domicile",
    },
  })

  const validatePostalCode = (postalCode: string): boolean => {
    // Paris postal codes: 75001 - 75020
    const parisRegex = /^75[0-9]{3}$/
    return parisRegex.test(postalCode)
  }

  const handleSubmit = () => {
    const pickupData = pickupForm.getValues()
    const deliveryData = sameAddress ? pickupData : deliveryForm.getValues()

    // Validate pickup address
    const pickupValid = pickupForm.trigger()
    pickupValid.then((isValid) => {
      if (!isValid) {
        toast.error("Veuillez corriger les erreurs dans l'adresse de collecte")
        return
      }

      // Validate postal code
      if (!validatePostalCode(pickupData.postal_code)) {
        pickupForm.setError("postal_code", {
          message: "Nous ne livrons actuellement qu'à Paris (75001-75020)",
        })
        toast.error("Code postal non couvert")
        return
      }

      // Validate delivery address if different
      if (!sameAddress) {
        const deliveryValid = deliveryForm.trigger()
        deliveryValid.then((isDeliveryValid) => {
          if (!isDeliveryValid) {
            toast.error("Veuillez corriger les erreurs dans l'adresse de livraison")
            return
          }

          if (!validatePostalCode(deliveryData.postal_code)) {
            deliveryForm.setError("postal_code", {
              message: "Nous ne livrons actuellement qu'à Paris (75001-75020)",
            })
            toast.error("Code postal de livraison non couvert")
            return
          }

          toast.success("Adresses enregistrées !")
          onComplete(pickupData, deliveryData)
        })
      } else {
        toast.success("Adresses enregistrées !")
        onComplete(pickupData, pickupData)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Adresses de collecte et livraison</h2>
        <p className="text-muted-foreground">
          Où devons-nous récupérer et livrer votre linge ?
        </p>
      </div>

      {/* Pickup Address */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Adresse de collecte</h3>
        </div>

        <Form {...pickupForm}>
          <form className="space-y-4">
            {/* Street Address */}
            <FormField
              control={pickupForm.control}
              name="street_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="123 Rue de Rivoli" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City & Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={pickupForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ville *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Paris" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={pickupForm.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code postal *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="75001" maxLength={5} />
                    </FormControl>
                    <FormDescription>Paris uniquement (75001-75020)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Building Info */}
            <FormField
              control={pickupForm.control}
              name="building_info"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bâtiment, étage, porte (optionnel)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Bât. A, 3ème étage, porte 12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Access Instructions */}
            <FormField
              control={pickupForm.control}
              name="access_instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions d&apos;accès (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Code d'accès, interphone, instructions spéciales..."
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Aidez notre livreur à accéder facilement à votre domicile
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </Card>

      {/* Same Address Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="sameAddress"
          checked={sameAddress}
          onCheckedChange={(checked) => setSameAddress(checked as boolean)}
        />
        <label
          htmlFor="sameAddress"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Utiliser la même adresse pour la livraison
        </label>
      </div>

      {/* Delivery Address (if different) */}
      {!sameAddress && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Home className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Adresse de livraison</h3>
          </div>

          <Form {...deliveryForm}>
            <form className="space-y-4">
              {/* Street Address */}
              <FormField
                control={deliveryForm.control}
                name="street_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="456 Avenue des Champs-Élysées" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City & Postal Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={deliveryForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Paris" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={deliveryForm.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code postal *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="75008" maxLength={5} />
                      </FormControl>
                      <FormDescription>Paris uniquement (75001-75020)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Building Info */}
              <FormField
                control={deliveryForm.control}
                name="building_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bâtiment, étage, porte (optionnel)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Bât. B, 2ème étage, porte 8" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Access Instructions */}
              <FormField
                control={deliveryForm.control}
                name="access_instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions d&apos;accès (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Code d'accès, interphone, instructions spéciales..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </Card>
      )}

      {/* Submit Button */}
      <Button onClick={handleSubmit} className="w-full" size="lg">
        Continuer →
      </Button>
    </div>
  )
}
