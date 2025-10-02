"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Phone, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const profileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().regex(/^(\+33|0)[1-9](\d{8})$/, "Numéro de téléphone invalide"),
  marketingConsent: z.boolean(),
  smsNotifications: z.boolean(),
  emailNotifications: z.boolean(),
})

type ProfileInput = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user: SupabaseUser
  profile: any
}

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = createClient()

  const preferences = profile?.preferences || {}

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.first_name || user.user_metadata?.first_name || "",
      lastName: profile?.last_name || user.user_metadata?.last_name || "",
      phone: profile?.phone || user.user_metadata?.phone || "",
      marketingConsent: preferences.marketingConsent || false,
      smsNotifications: preferences.smsNotifications !== false,
      emailNotifications: preferences.emailNotifications !== false,
    },
  })

  const onSubmit = async (data: ProfileInput) => {
    setIsLoading(true)
    setMessage(null)

    try {
      // Update user metadata in auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
        },
      })

      if (authError) throw authError

      const { error: dbError } = await supabase
        .from("users")
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          preferences: {
            ...preferences,
            marketingConsent: data.marketingConsent,
            smsNotifications: data.smsNotifications,
            emailNotifications: data.emailNotifications,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (dbError) {
        console.error("[v0] Profile update error:", dbError)
        throw dbError
      }

      setMessage({ type: "success", text: "Profil mis à jour avec succès" })
    } catch (error) {
      console.error("[v0] Profile update error:", error)
      setMessage({ type: "error", text: "Erreur lors de la mise à jour du profil" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informations personnelles</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="firstName" placeholder="Jean" className="pl-10" {...form.register("firstName")} />
              </div>
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="lastName" placeholder="Dupont" className="pl-10" {...form.register("lastName")} />
              </div>
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" value={user.email} disabled className="pl-10 bg-muted" />
            </div>
            <p className="text-sm text-muted-foreground">
              L'email ne peut pas être modifié. Contactez le support si nécessaire.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="phone" type="tel" placeholder="06 12 34 56 78" className="pl-10" {...form.register("phone")} />
            </div>
            {form.formState.errors.phone && (
              <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Préférences</h3>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="emailNotifications" {...form.register("emailNotifications")} />
              <Label htmlFor="emailNotifications">Recevoir les notifications par email</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="smsNotifications" {...form.register("smsNotifications")} />
              <Label htmlFor="smsNotifications">Recevoir les notifications par SMS</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="marketingConsent" {...form.register("marketingConsent")} />
              <Label htmlFor="marketingConsent">Recevoir les offres promotionnelles</Label>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Sauvegarder les modifications
        </Button>
      </form>
    </div>
  )
}
