"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Home, Building2, MapPin, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { addressSchema, type AddressInput } from "@/lib/validations/booking"

interface Address {
  id: string
  type: "home" | "work" | "other"
  label: string
  street_address: string
  apartment?: string
  city: string
  postal_code: string
  delivery_instructions?: string
  access_code?: string
  is_default: boolean
}

interface AddressFormDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  address?: Address | null
}

export function AddressFormDialog({
  open,
  onClose,
  onSuccess,
  address,
}: AddressFormDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const isEdit = !!address

  // Convert snake_case to camelCase for form
  const defaultValues: AddressInput = address
    ? {
        type: address.type,
        label: address.label,
        streetAddress: address.street_address,
        apartment: address.apartment || "",
        city: address.city,
        postalCode: address.postal_code,
        deliveryInstructions: address.delivery_instructions || "",
        accessCode: address.access_code || "",
        isDefault: address.is_default,
      }
    : {
        type: "home",
        label: "",
        streetAddress: "",
        apartment: "",
        city: "",
        postalCode: "",
        deliveryInstructions: "",
        accessCode: "",
        isDefault: false,
      }

  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues,
  })

  const selectedType = form.watch("type")

  const onSubmit = async (data: AddressInput) => {
    setLoading(true)
    try {
      const url = isEdit ? `/api/addresses/${address.id}` : "/api/addresses"
      const method = isEdit ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to save address")
      }

      toast({
        title: "Succès",
        description: isEdit
          ? "Adresse modifiée avec succès"
          : "Adresse ajoutée avec succès",
      })

      onSuccess()
      onClose()
      form.reset()
    } catch (error) {
      toast({
        title: "Erreur",
        description: isEdit
          ? "La modification n'a pu être enregistrée. Réessayez."
          : "L'ajout de l'adresse a échoué. Réessayez dans un instant.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-light">
              {isEdit ? "Modifier l'adresse" : "Nouvelle adresse"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Les informations renseignées faciliteront la collecte et la
              livraison.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              {/* Label */}
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Libellé</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Domicile, Bureau, Chez mes parents..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'adresse</FormLabel>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "home" as const, icon: Home, label: "Domicile" },
                        { value: "work" as const, icon: Building2, label: "Bureau" },
                        { value: "other" as const, icon: MapPin, label: "Autre" },
                      ].map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => field.onChange(value)}
                          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:shadow-sm ${
                            selectedType === value
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <Icon
                            className={`h-6 w-6 mb-2 ${
                              selectedType === value
                                ? "text-primary"
                                : "text-gray-600"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              selectedType === value
                                ? "text-primary"
                                : "text-gray-700"
                            }`}
                          >
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Street Address */}
              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="15 Avenue des Champs-Élysées"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Apartment */}
              <FormField
                control={form.control}
                name="apartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complément (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Appartement, bâtiment, étage..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Postal Code + City */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code postal</FormLabel>
                      <FormControl>
                        <Input placeholder="75008" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input placeholder="Paris" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Delivery Instructions */}
              <FormField
                control={form.control}
                name="deliveryInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions de livraison (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Sonner 2 fois, laisser devant la porte..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Access Code */}
              <FormField
                control={form.control}
                name="accessCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code d'accès (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digicode, badge, code portail..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Default */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div>
                  <Label htmlFor="isDefault" className="font-medium">
                    Définir par défaut
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Utiliser cette adresse pour les futures réservations
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <input
                          id="isDefault"
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : isEdit ? (
                "Enregistrer"
              ) : (
                "Ajouter"
              )}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
