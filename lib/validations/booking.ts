import { z } from "zod"

export const addressSchema = z.object({
  type: z.enum(["home", "work", "other"]).default("home"),
  label: z.string().min(1, "Libellé requis"),
  streetAddress: z.string().min(5, "Adresse complète requise"),
  apartment: z.string().optional(),
  city: z.string().min(2, "Ville requise"),
  postalCode: z.string().regex(/^\d{5}$/, "Code postal invalide"),
  deliveryInstructions: z.string().optional(),
  accessCode: z.string().optional(),
  isDefault: z.boolean().default(false),
})

export const bookingItemSchema = z.object({
  serviceId: z.string().uuid("Service invalide"),
  quantity: z.number().min(1, "Quantité minimum 1"),
  specialInstructions: z.string().optional(),
})

export const createBookingSchema = z.object({
  pickupAddressId: z.string().uuid("Adresse de collecte requise"),
  deliveryAddressId: z.string().uuid("Adresse de livraison requise"),
  pickupDate: z.string().refine((date) => {
    const selectedDate = new Date(date)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return selectedDate >= tomorrow
  }, "La date de collecte doit être au minimum demain"),
  pickupTimeSlot: z.enum(["09:00-12:00", "14:00-17:00", "18:00-21:00"]),
  items: z.array(bookingItemSchema).min(1, "Au moins un article requis"),
  specialInstructions: z.string().optional(),
  subscriptionId: z.string().uuid().optional(),
})

export type AddressInput = z.infer<typeof addressSchema>
export type BookingItemInput = z.infer<typeof bookingItemSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
