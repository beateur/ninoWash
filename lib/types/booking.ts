/**
 * Booking types - synchronized with database schema
 * See: supabase/migrations/20251017_add_payment_fields_to_bookings.sql
 */

export type PaymentStatus = "pending" | "succeeded" | "failed"
export type BookingStatus = "pending_payment" | "confirmed" | "cancelled" | "completed"

export interface Booking {
  id: string
  user_id: string | null // null for guest bookings
  booking_number: string
  status: BookingStatus
  payment_status: PaymentStatus
  
  // Addresses
  pickup_address_id: string | null
  delivery_address_id: string | null
  
  // Dates & Times (legacy fields, kept for backward compatibility)
  pickup_date: string | null
  pickup_time_slot: string | null
  delivery_date: string | null
  delivery_time_slot: string | null
  
  // Slot-based scheduling (new fields)
  pickup_slot_id: string | null
  delivery_slot_id: string | null
  
  // Pricing & Payment
  total_amount_cents: number // Amount in cents for Stripe compatibility
  used_credit: boolean
  credit_discount_amount: number | null
  subscription_id: string | null
  
  // Payment tracking
  payment_intent_id: string | null // Stripe Payment Intent ID
  stripe_session_id: string | null // Stripe Checkout Session ID
  paid_at: string | null // ISO 8601 timestamp when payment confirmed
  
  // Guest booking data (stored as JSONB in database)
  metadata: {
    is_guest_booking?: boolean
    guest_contact?: {
      first_name: string
      last_name: string
      email: string
      phone: string
    }
    guest_pickup_address?: {
      street_address: string
      city: string
      postal_code: string
      building_info?: string
      access_instructions?: string
      label: string
    }
    guest_delivery_address?: {
      street_address: string
      city: string
      postal_code: string
      building_info?: string
      access_instructions?: string
      label: string
    }
  } | null
  
  // Audit fields
  created_at: string // ISO 8601 timestamp
  updated_at: string // ISO 8601 timestamp
}

export interface BookingItem {
  id: string
  booking_id: string
  service_id: string
  quantity: number
  unit_price: number
  special_instructions: string | null
  created_at: string
}

export interface BookingWithItems extends Booking {
  booking_items?: BookingItem[]
}
