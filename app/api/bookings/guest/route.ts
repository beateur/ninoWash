/**
 * Guest Booking Orchestration API
 * Complete flow: Verify payment → Create account → Create booking → Save addresses → Send email
 * 
 * POST /api/bookings/guest
 * 
 * This endpoint is called after successful Stripe payment confirmation.
 * It orchestrates the complete guest booking flow with retry logic and error handling.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { withRetry } from "@/lib/utils/retry"

// =====================================================
// Validation Schema
// =====================================================

const createGuestBookingSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment Intent ID requis"),
})

// =====================================================
// Types
// =====================================================

interface BookingMetadata {
  guestEmail: string
  guestName: string
  guestPhone: string
  services: string // JSON stringified array
  pickupAddress: string // JSON stringified object
  deliveryAddress: string // JSON stringified object
  pickupDate: string
  pickupTimeSlot: string
}

// =====================================================
// Main Handler
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json()
    const result = createGuestBookingSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation échouée", issues: result.error.issues },
        { status: 400 }
      )
    }

    const { paymentIntentId } = result.data

    console.log("[v0] Guest booking orchestration started:", paymentIntentId)

    // 2. Verify Stripe payment succeeded
    console.log("[v0] Step 1: Verifying Stripe payment...")
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== "succeeded") {
      console.error("[v0] Payment not succeeded:", paymentIntent.status)
      return NextResponse.json(
        { error: "Le paiement n'a pas été finalisé" },
        { status: 400 }
      )
    }

    // 3. Extract metadata from Payment Intent
    const metadata = paymentIntent.metadata as unknown as BookingMetadata
    const {
      guestEmail,
      guestName,
      guestPhone,
      services: servicesJson,
      pickupAddress: pickupAddressJson,
      deliveryAddress: deliveryAddressJson,
      pickupDate,
      pickupTimeSlot,
    } = metadata

    // Parse JSON strings
    const services = JSON.parse(servicesJson)
    const pickupAddress = JSON.parse(pickupAddressJson)
    const deliveryAddress = JSON.parse(deliveryAddressJson)

    console.log("[v0] Payment verified:", {
      email: guestEmail,
      amount: paymentIntent.amount,
      servicesCount: services.length,
    })

    // 4. Create user account (check for existing email first)
    console.log("[v0] Step 2: Creating user account...")
    const supabase = createAdminClient()

    let userId: string
    let userEmail: string
    let tempPassword: string // Store for session creation
    
    try {
      // Generate a secure random password for the user
      tempPassword = generateSecurePassword()
      
      // First attempt without retry - to catch email_exists immediately
      const initialResult = await supabase.auth.admin.createUser({
        email: guestEmail,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email for guest bookings
        user_metadata: {
          full_name: guestName,
          phone: guestPhone,
          source: "guest_booking",
          needs_password_setup: true, // Flag for password reset email
        },
      })

      // Check for email exists error IMMEDIATELY (before any retry)
      if (initialResult.error && 
          (initialResult.error.status === 422 || (initialResult.error as any).code === 'email_exists')) {
        console.log("[v0] Email already exists, fetching existing user and creating session...")
        
        // Fetch existing user by email
        const { data: existingUsers, error: fetchError } = await supabase.auth.admin.listUsers()
        
        if (fetchError || !existingUsers?.users) {
          console.error("[v0] Failed to fetch existing user:", fetchError)
          return NextResponse.json(
            {
              success: false,
              error: "USER_FETCH_FAILED",
              message: "Impossible de récupérer les informations utilisateur.",
            },
            { status: 500 }
          )
        }

        const existingUser = existingUsers.users.find(u => u.email === guestEmail)
        
        if (!existingUser) {
          console.error("[v0] Email exists but user not found in list")
          return NextResponse.json(
            {
              success: false,
              error: "USER_NOT_FOUND",
              message: "Utilisateur introuvable.",
            },
            { status: 500 }
          )
        }

        // Use existing user ID
        userId = existingUser.id
        userEmail = existingUser.email || guestEmail
        console.log("[v0] Using existing user:", userId)
        
        // For existing users, we'll create a session using admin API
        // We cannot use signInWithPassword without the password
        // So we'll use admin.generateLink to get access tokens
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: userEmail,
        })

        if (linkError) {
          console.error("[v0] Failed to generate auth link for existing user:", linkError)
          // Continue without session - user will need to login manually
          tempPassword = '' // Clear password (not used for existing user)
        } else if (linkData.properties?.action_link) {
          console.log("[v0] Auth link generated for existing user")
          // Extract access_token and refresh_token from the magic link
          try {
            const url = new URL(linkData.properties.action_link)
            const accessToken = url.searchParams.get('access_token')
            const refreshToken = url.searchParams.get('refresh_token')
            
            if (accessToken && refreshToken) {
              // Store tokens temporarily to return them in response
              // This will allow frontend to set the session
              ;(tempPassword as any) = { accessToken, refreshToken } // Reuse variable for tokens
              console.log("[v0] Tokens extracted from magic link for auto-login")
            }
          } catch (urlError) {
            console.error("[v0] Failed to parse magic link URL:", urlError)
          }
        }
        
        // Continue to booking creation with existing user...
        // Skip user creation, go directly to booking creation
      } else if (initialResult.error) {
        // If other error (not email_exists), retry with backoff
        console.warn("[v0] Initial user creation failed, retrying:", initialResult.error.message)
        
        const userData = await withRetry(
          async () => {
            const result = await supabase.auth.admin.createUser({
              email: guestEmail,
              password: tempPassword,
              email_confirm: true,
              user_metadata: {
                full_name: guestName,
                phone: guestPhone,
                source: "guest_booking",
                needs_password_setup: true,
              },
            })

            if (result.error) throw result.error
            if (!result.data?.user) throw new Error("No user data returned")
            return result.data
          },
          {
            retries: 3,
            delay: 2000,
            onRetry: (attempt, error) => {
              console.warn(`[v0] User creation retry ${attempt}/3:`, error.message)
            },
          }
        )

        if (!userData?.user) {
          throw new Error("Failed to create user after retries")
        }

        userId = userData.user.id
        userEmail = userData.user.email || guestEmail
      } else {
        // Success on first attempt
        if (!initialResult.data?.user) {
          throw new Error("No user data returned")
        }
        userId = initialResult.data.user.id
        userEmail = initialResult.data.user.email || guestEmail
      }

      console.log("[v0] User created successfully:", userId)
    } catch (error: any) {
      // Log failed account creation for manual recovery
      console.error("[v0] User creation failed after retries:", error)

      await logFailedAccountCreation(supabase, {
        paymentIntentId,
        guestEmail,
        guestName,
        guestPhone,
        error: error as Error,
        bookingData: {
          services,
          pickupAddress,
          deliveryAddress,
          pickupDate,
          pickupTimeSlot,
        },
      })

      return NextResponse.json(
        {
          error: "Erreur lors de la création du compte",
          message:
            "Le paiement a réussi mais nous n'avons pas pu créer votre compte. Notre équipe vous contactera sous 24h.",
        },
        { status: 500 }
      )
    }
    // 5. Create booking with retry logic (3 attempts)
    console.log("[v0] Step 3: Creating booking...")
    let bookingId: string
    try {
      // Generate unique booking_number before INSERT
      const bookingNumber = `BK-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      console.log("[v0] Generated booking_number:", bookingNumber)
      
      // Extract primary service ID from services array (first service)
      // Note: Stripe metadata transforms "serviceId" to "id" during storage
      console.log("[v0] Services data structure:", JSON.stringify(services[0]))
      const primaryServiceId = services[0]?.id || services[0]?.serviceId || null
      console.log("[v0] Primary service_id:", primaryServiceId)
      
      if (!primaryServiceId) {
        throw new Error("No valid service_id found in services array")
      }
      
      // Prepare guest metadata for storage
      const guestMetadata = {
        is_guest_booking: true,
        guest_contact: {
          email: guestEmail,
          name: guestName,
          phone: guestPhone,
        },
        guest_pickup_address: pickupAddress,
        guest_delivery_address: deliveryAddress,
        services: services, // Store all services in metadata for reference
      }
      
      const bookingData = await withRetry(
        async () => {
          const result = await supabase
            .from("bookings")
            .insert({
              // ✅ HARMONIZED WITH /api/bookings (auth version)
              booking_number: bookingNumber,
              user_id: userId,
              service_id: primaryServiceId, // First service from array
              subscription_id: null, // Guest bookings don't have subscriptions
              pickup_address_id: null, // Guest bookings use metadata instead
              delivery_address_id: null, // Guest bookings use metadata instead
              pickup_date: pickupDate,
              pickup_time_slot: pickupTimeSlot,
              special_instructions: null, // TODO: Add if needed in future
              total_amount: paymentIntent.amount / 100, // Convert cents to euros
              booking_weight_kg: null, // TODO: Calculate from services if needed
              used_subscription_credit: false, // Guest bookings don't use credits
              credit_discount_amount: 0, // No credit discount for guest bookings
              status: "pending",
              payment_status: "paid", // Payment already completed via Stripe
              metadata: guestMetadata, // Store guest-specific data
            })
            .select()
            .single()

          if (result.error) throw result.error
          if (!result.data) throw new Error("No booking data returned")
          return result.data
        },
        {
          retries: 3,
          delay: 2000,
          onRetry: (attempt, error) => {
            console.warn(`[v0] Booking creation retry ${attempt}/3:`, error.message)
          },
        }
      )

      if (!bookingData) {
        throw new Error("Failed to create booking after retries")
      }

      bookingId = bookingData.id
      console.log("[v0] Booking created successfully:", bookingId)
    } catch (error) {
      // Log failed booking creation for manual recovery
      console.error("[v0] Booking creation failed after retries:", error)

      await logFailedBooking(supabase, {
        paymentIntentId,
        userId,
        error: error as Error,
        bookingData: {
          services,
          pickupAddress,
          deliveryAddress,
          pickupDate,
          pickupTimeSlot,
        },
      })

      return NextResponse.json(
        {
          error: "Erreur lors de la création de la réservation",
          message:
            "Votre compte a été créé mais nous n'avons pas pu finaliser la réservation. Notre équipe vous contactera sous 24h.",
          userId, // Return userId for debugging
        },
        { status: 500 }
      )
    }

    // 6. Create booking items (services)
    console.log("[v0] Step 4: Creating booking items...")
    const bookingItemsData = services.map((service: any) => ({
      booking_id: bookingId,
      service_id: service.id, // From Stripe metadata (serviceId was transformed to "id")
      quantity: service.quantity,
      unit_price: service.price, // Already in euros (from Stripe metadata)
      special_instructions: null, // TODO: Add if needed
    }))

    const { error: itemsError } = await supabase
      .from("booking_items")
      .insert(bookingItemsData)

    if (itemsError) {
      console.error("[v0] Failed to create booking items:", itemsError)
      // Non-critical error: booking exists, items can be added manually
    } else {
      console.log(
        "[v0] Booking items created:",
        bookingItemsData.length,
        "items"
      )
    }

    // 7. Save addresses
    console.log("[v0] Step 5: Saving addresses...")
    
    // Pickup address - using user_addresses table (harmonized with POST AUTH)
    const { data: pickupAddressData, error: pickupAddressError } =
      await supabase
        .from("user_addresses")
        .insert({
          user_id: userId,
          label: "Adresse de collecte", // Required field
          street_address: pickupAddress.street || pickupAddress.street_address,
          city: pickupAddress.city,
          postal_code: pickupAddress.postalCode || pickupAddress.postal_code,
          building_info: pickupAddress.building_info || null,
          access_instructions: pickupAddress.access_instructions || null,
          is_default: true, // First address is default
        })
        .select()
        .single()

    if (pickupAddressError) {
      console.error("[v0] Failed to create pickup address:", pickupAddressError)
    } else {
      console.log("[v0] Pickup address created:", pickupAddressData?.id)

      // Update booking with pickup address
      await supabase
        .from("bookings")
        .update({ pickup_address_id: pickupAddressData.id })
        .eq("id", bookingId)
    }

    // Delivery address (if different)
    const isSameAddress =
      (pickupAddress.street || pickupAddress.street_address) === (deliveryAddress.street || deliveryAddress.street_address) &&
      pickupAddress.city === deliveryAddress.city &&
      (pickupAddress.postalCode || pickupAddress.postal_code) === (deliveryAddress.postalCode || deliveryAddress.postal_code)

    let deliveryAddressId = pickupAddressData?.id

    if (!isSameAddress) {
      const { data: deliveryAddressData, error: deliveryAddressError } =
        await supabase
          .from("user_addresses")
          .insert({
            user_id: userId,
            label: "Adresse de livraison", // Required field
            street_address: deliveryAddress.street || deliveryAddress.street_address,
            city: deliveryAddress.city,
            postal_code: deliveryAddress.postalCode || deliveryAddress.postal_code,
            building_info: deliveryAddress.building_info || null,
            access_instructions: deliveryAddress.access_instructions || null,
            is_default: false, // Only first address is default
          })
          .select()
          .single()

      if (deliveryAddressError) {
        console.error(
          "[v0] Failed to create delivery address:",
          deliveryAddressError
        )
      } else {
        console.log("[v0] Delivery address created:", deliveryAddressData?.id)
        deliveryAddressId = deliveryAddressData.id
      }
    } else {
      console.log("[v0] Using same address for delivery")
    }

    // Update booking with delivery address
    if (deliveryAddressId) {
      await supabase
        .from("bookings")
        .update({ delivery_address_id: deliveryAddressId })
        .eq("id", bookingId)
    }

    // 8. Send welcome email (Phase 2 Day 5 - Placeholder for now)
    console.log("[v0] Step 6: Sending welcome email...")
    // TODO: Implement email sending with Resend/SendGrid
    console.log("[v0] Email sending not implemented yet (Phase 2 Day 5)")

    // 9. Create session for automatic login
    console.log("[v0] Step 7: Creating user session for automatic login...")
    let accessToken = null
    let refreshToken = null
    
    try {
      // Check if we have tokens from magic link (existing user case)
      if (typeof tempPassword === 'object' && (tempPassword as any).accessToken) {
        console.log("[v0] Using tokens from magic link (existing user)")
        accessToken = (tempPassword as any).accessToken
        refreshToken = (tempPassword as any).refreshToken
        console.log("[v0] Session tokens ready for existing user auto-login")
      } 
      // Otherwise, sign in with password (new user case)
      else if (typeof tempPassword === 'string' && tempPassword.length > 0) {
        console.log("[v0] Creating session with password (new user)")
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: tempPassword,
        })

        if (signInError) {
          console.error("[v0] Failed to create session:", signInError)
        } else if (signInData.session) {
          accessToken = signInData.session.access_token
          refreshToken = signInData.session.refresh_token
          console.log("[v0] Session created successfully for new user auto-login")
        }
      } else {
        console.warn("[v0] No password or tokens available, user will need to login manually")
      }
    } catch (sessionErr) {
      console.error("[v0] Error creating session:", sessionErr)
      // Non-critical: user can still login manually
    }

    // 10. Success response with session tokens for automatic login
    console.log("[v0] Guest booking orchestration completed successfully!")
    
    return NextResponse.json(
      {
        success: true,
        bookingId,
        userId,
        email: userEmail,
        message: "Réservation créée avec succès",
        // Include session tokens for automatic login
        session: accessToken && refreshToken ? {
          access_token: accessToken,
          refresh_token: refreshToken,
        } : null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Guest booking orchestration error:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la création de la réservation",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    )
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Generate a secure random password (user will reset it later)
 */
function generateSecurePassword(): string {
  const length = 32
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length]
  }
  
  return password
}

/**
 * Calculate delivery date (pickup date + 3 days)
 */
function calculateDeliveryDate(pickupDate: string): string {
  const pickup = new Date(pickupDate)
  const delivery = new Date(pickup)
  delivery.setDate(delivery.getDate() + 3) // Add 3 days
  return delivery.toISOString().split("T")[0] // YYYY-MM-DD format
}

/**
 * Log failed account creation to database
 * Table: failed_account_creations
 */
async function logFailedAccountCreation(
  supabase: any,
  data: {
    paymentIntentId: string
    guestEmail: string
    guestName: string
    guestPhone: string
    error: Error
    bookingData: any
  }
) {
  try {
    const { error } = await supabase.from("failed_account_creations").insert({
      payment_intent_id: data.paymentIntentId,
      guest_email: data.guestEmail,
      guest_name: data.guestName,
      guest_phone: data.guestPhone,
      error_message: data.error.message,
      error_code: (data.error as any).code || null,
      booking_data: data.bookingData,
    })

    if (error) {
      console.error("[v0] Failed to log failed account creation:", error)
    } else {
      console.log("[v0] Failed account creation logged successfully")
    }
  } catch (err) {
    console.error("[v0] Error logging failed account creation:", err)
  }
}

/**
 * Log failed booking creation to database
 * Table: failed_bookings
 */
async function logFailedBooking(
  supabase: any,
  data: {
    paymentIntentId: string
    userId: string
    error: Error
    bookingData: any
  }
) {
  try {
    const { error } = await supabase.from("failed_bookings").insert({
      payment_intent_id: data.paymentIntentId,
      user_id: data.userId,
      booking_data: data.bookingData,
      error_message: data.error.message,
      error_code: (data.error as any).code || null,
    })

    if (error) {
      console.error("[v0] Failed to log failed booking:", error)
    } else {
      console.log("[v0] Failed booking logged successfully")
    }
  } catch (err) {
    console.error("[v0] Error logging failed booking:", err)
  }
}
