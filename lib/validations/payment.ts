import { z } from "zod"

export const paymentMethodSchema = z.object({
  type: z.enum(["card", "paypal", "bank_transfer", "apple_pay", "google_pay"]),
  provider: z.string().min(1, "Fournisseur requis"),
  providerPaymentMethodId: z.string().min(1, "ID méthode de paiement requis"),
  lastFour: z.string().optional(),
  brand: z.string().optional(),
  expMonth: z.number().min(1).max(12).optional(),
  expYear: z.number().min(new Date().getFullYear()).optional(),
  isDefault: z.boolean().default(false),
})

export const createPaymentSchema = z.object({
  bookingId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  paymentMethodId: z.string().uuid("Méthode de paiement requise"),
  amount: z.number().positive("Montant invalide"),
  currency: z.string().length(3).default("EUR"),
  description: z.string().optional(),
})

export const subscriptionPlanSchema = z.object({
  code: z.string().min(1, "Code requis"),
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  type: z.enum(["monthly", "quarterly", "annual"]),
  price: z.number().positive("Prix invalide"),
  discountPercentage: z.number().min(0).max(100).default(0),
  includedServices: z.number().min(0).default(0),
  extraServicePrice: z.number().positive().optional(),
  features: z.array(z.string()).default([]),
})

export const createSubscriptionSchema = z.object({
  planId: z.string().uuid("Plan requis"),
  paymentMethodId: z.string().uuid("Méthode de paiement requise"),
  autoRenew: z.boolean().default(true),
})

export const couponSchema = z.object({
  code: z.string().min(1, "Code requis").max(50),
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed_amount"]),
  value: z.number().positive("Valeur invalide"),
  minimumAmount: z.number().positive().optional(),
  maximumDiscount: z.number().positive().optional(),
  usageLimit: z.number().positive().optional(),
  userLimit: z.number().positive().default(1),
  validFrom: z.string().refine((date) => new Date(date) >= new Date(), "Date de début invalide"),
  validUntil: z.string().refine((date) => new Date(date) > new Date(), "Date de fin invalide"),
  applicableTo: z.enum(["all", "bookings", "subscriptions"]).default("all"),
})

export const applyCouponSchema = z.object({
  code: z.string().min(1, "Code coupon requis"),
  bookingId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
})

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>
export type CouponInput = z.infer<typeof couponSchema>
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>
