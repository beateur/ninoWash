/**
 * Full guest booking validation schema
 * Combines all steps: Contact, Addresses, Services, DateTime, Payment
 */

import { z } from "zod"
import { guestContactSchema } from "./guest-contact"

/**
 * Address schema for guest booking (simplified from existing address validation)
 * Used for both pickup and delivery addresses
 */
export const guestAddressSchema = z.object({
  street_address: z
    .string()
    .min(5, "Adresse trop courte (minimum 5 caractères)")
    .max(200, "Adresse trop longue (maximum 200 caractères)")
    .trim(),

  city: z
    .string()
    .min(2, "Ville trop courte")
    .max(100, "Ville trop longue")
    .trim(),

  postal_code: z
    .string()
    .regex(/^[0-9]{5}$/, "Code postal invalide (5 chiffres requis)")
    .trim(),

  building_info: z
    .string()
    .max(100, "Information bâtiment trop longue")
    .optional()
    .or(z.literal("")),

  access_instructions: z
    .string()
    .max(500, "Instructions d'accès trop longues (max 500 caractères)")
    .optional()
    .or(z.literal("")),

  label: z
    .string()
    .max(50, "Label trop long")
    .optional()
    .or(z.literal("")),
})

export type GuestAddress = z.infer<typeof guestAddressSchema>

/**
 * Booking item schema (service + quantity)
 */
export const guestBookingItemSchema = z.object({
  serviceId: z.string().uuid("ID de service invalide"),
  quantity: z.number().int().min(1, "Quantité minimum: 1").max(50, "Quantité maximum: 50"),
  specialInstructions: z
    .string()
    .max(500, "Instructions trop longues (max 500 caractères)")
    .optional()
    .or(z.literal("")),
})

export type GuestBookingItem = z.infer<typeof guestBookingItemSchema>

/**
 * Time slot enum (from existing booking system)
 */
export const timeSlotEnum = z.enum(["09:00-12:00", "14:00-17:00", "18:00-21:00"])

/**
 * Complete guest booking schema (all 5 steps)
 */
export const guestBookingSchema = z.object({
  // Step 0: Contact
  guestContact: guestContactSchema,

  // Step 1: Addresses
  guestPickupAddress: guestAddressSchema,
  guestDeliveryAddress: guestAddressSchema,

  // Step 2: Services
  items: z
    .array(guestBookingItemSchema)
    .min(1, "Sélectionnez au moins un service")
    .max(20, "Maximum 20 services différents"),

  // Step 3: Date & Time
  pickupDate: z.string().datetime("Date de collecte invalide (format ISO 8601)"),
  pickupTimeSlot: timeSlotEnum,

  // Step 4: Payment
  paymentIntentId: z
    .string()
    .min(1, "Payment Intent ID manquant")
    .startsWith("pi_", "Payment Intent ID invalide (doit commencer par 'pi_')"),
})

export type GuestBooking = z.infer<typeof guestBookingSchema>

/**
 * Payment Intent creation request schema
 */
export const createPaymentIntentSchema = z.object({
  items: z.array(guestBookingItemSchema).min(1, "Sélectionnez au moins un service"),
  metadata: z.object({
    email: z.string().email("Email invalide"),
    flow: z.literal("guest"),
  }),
})

export type CreatePaymentIntent = z.infer<typeof createPaymentIntentSchema>
