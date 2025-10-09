/**
 * Validation schema for guest booking contact information (Step 0)
 * Used for non-authenticated users booking flow
 */

import { z } from "zod"

export const guestContactSchema = z.object({
  email: z
    .string()
    .email("Format d'email invalide")
    .min(5, "Email trop court")
    .max(100, "Email trop long (max 100 caractères)")
    .toLowerCase()
    .trim(),

  firstName: z
    .string()
    .min(2, "Prénom trop court (minimum 2 caractères)")
    .max(50, "Prénom trop long (maximum 50 caractères)")
    .regex(
      /^[a-zA-ZÀ-ÿ\s\-']+$/,
      "Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes"
    )
    .trim(),

  lastName: z
    .string()
    .min(2, "Nom trop court (minimum 2 caractères)")
    .max(50, "Nom trop long (maximum 50 caractères)")
    .regex(
      /^[a-zA-ZÀ-ÿ\s\-']+$/,
      "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes"
    )
    .trim(),

  phone: z
    .string()
    .regex(
      /^0[1-9](?:\s?\d{2}){4}$/,
      "Format de téléphone invalide (ex: 06 12 34 56 78)"
    )
    .optional()
    .or(z.literal("")),

  rgpdConsent: z
    .boolean()
    .refine(
      (val) => val === true,
      "Vous devez accepter la politique de confidentialité pour continuer"
    ),
})

export type GuestContact = z.infer<typeof guestContactSchema>

/**
 * Validation schema for email check API endpoint
 */
export const emailCheckSchema = z.object({
  email: z.string().email("Format d'email invalide").toLowerCase().trim(),
})

export type EmailCheck = z.infer<typeof emailCheckSchema>
