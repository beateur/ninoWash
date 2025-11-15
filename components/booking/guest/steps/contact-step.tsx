/**
 * Step 0: Contact Information
 * Collects email, first name, last name, phone, RGPD consent
 * Validates email uniqueness via API
 */

"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { guestContactSchema, type GuestContact } from "@/lib/validations/guest-contact"
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
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, User, Phone, AlertCircle, Info } from "lucide-react"
import { toast } from "sonner"

interface ContactStepProps {
  initialData: GuestContact | null
  onComplete: (data: GuestContact) => void
}

export function ContactStep({ initialData, onComplete }: ContactStepProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [emailExists, setEmailExists] = useState(false)

  const form = useForm<GuestContact>({
    resolver: zodResolver(guestContactSchema),
    mode: "onBlur", // ← Validation seulement quand on quitte le champ (pas de saccades)
    defaultValues: initialData || {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      rgpdConsent: false,
    },
  })

  // Check if email already exists
  const checkEmail = async (email: string) => {
    if (!email || !email.includes("@")) return

    setIsChecking(true)
    try {
      const response = await fetch("/api/bookings/guest/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.exists) {
        setEmailExists(true)
      } else {
        setEmailExists(false)
      }
    } catch (error) {
      console.error("[v0] Email check failed:", error)
      // Non-blocking error, continue
    } finally {
      setIsChecking(false)
    }
  }

  // Debounce optimisé pour email check (équivalent onCommit SwiftUI)
  const debouncedCheckEmail = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (email: string) => {
      clearTimeout(timeoutId)
      if (email && email.includes("@")) {
        timeoutId = setTimeout(() => {
          checkEmail(email)
        }, 800) // 800ms après la dernière frappe
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Surveiller UNIQUEMENT le champ email (pas tous les champs)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Ne surveiller que le champ email, pas firstName, lastName, etc.
      if (name === "email" && value.email) {
        debouncedCheckEmail(value.email)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, debouncedCheckEmail])

  // Valider et mettre à jour le parent quand l'utilisateur termine
  const handleValidation = async () => {
    // Vérifier si les données sont déjà valides
    if (canProceed()) {
      const data = form.getValues()
      onComplete(data)
    } else {
      // Forcer la validation pour afficher les erreurs en rouge
      await form.trigger()
    }
  }

  // Exposer la validation au parent
  const canProceed = () => {
    const data = form.getValues()
    return (
      form.formState.isValid &&
      !!data.email &&
      !!data.firstName &&
      !!data.lastName &&
      !!data.rgpdConsent
    )
  }

  // Synchroniser l'état initial
  useEffect(() => {
    if (canProceed()) {
      handleValidation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = (data: GuestContact) => {
    if (emailExists) {
      // Show modal: Login or continue anyway
      const shouldLogin = window.confirm(
        "Un compte existe avec cet email. Voulez-vous vous connecter pour accéder à vos informations enregistrées ?"
      )

      if (shouldLogin) {
        window.location.href = "/auth/signin?redirect=/reservation"
        return
      }
    }

    toast.success("Informations enregistrées !")
    onComplete(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Vos informations</h2>
        <p className="text-muted-foreground">
          Nous aurons besoin de ces informations pour créer votre compte après le paiement.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="votre@email.com"
                      className="pl-10"
                      onBlur={(e) => {
                        field.onBlur()
                        checkEmail(e.target.value)
                      }}
                    />
                  </div>
                </FormControl>
                {isChecking && (
                  <p className="text-xs text-muted-foreground">Vérification de l&apos;email...</p>
                )}
                {emailExists && (
                  <Alert variant="default" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Un compte existe avec cet email.{" "}
                      <a href="/auth/signin?redirect=/reservation" className="underline font-medium">
                        Se connecter
                      </a>{" "}
                      ou continuez pour réserver sans compte.
                    </AlertDescription>
                  </Alert>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* First Name */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input {...field} placeholder="Jean" className="pl-10" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input {...field} placeholder="Dupont" className="pl-10" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone (optional) */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone (optionnel)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type="tel"
                      placeholder="06 12 34 56 78"
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Pour vous contacter en cas de besoin concernant votre réservation
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* RGPD Consent */}
          <FormField
            control={form.control}
            name="rgpdConsent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    J&apos;accepte la{" "}
                    <a
                      href="/politique-de-confidentialite"
                      target="_blank"
                      className="underline hover:text-primary"
                    >
                      politique de confidentialité
                    </a>{" "}
                    *
                  </FormLabel>
                  <FormDescription>
                    Vos données sont protégées et utilisées uniquement pour votre réservation
                  </FormDescription>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Info: Account creation */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Un compte sera créé automatiquement après votre paiement. Vous recevrez un email
              pour définir votre mot de passe.
            </AlertDescription>
          </Alert>
        </form>
      </Form>

      {/* Bouton de validation visible */}
      <div className="flex justify-end mt-6">
        <Button
          onClick={handleValidation}
          size="lg"
          className="min-w-[200px]"
        >
          Valider les informations
        </Button>
      </div>
    </div>
  )
}
