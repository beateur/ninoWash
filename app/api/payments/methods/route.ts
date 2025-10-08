import { type NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth/api-guards"
import { paymentMethodSchema } from "@/lib/validations/payment"
import { stripe } from "@/lib/stripe"

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  try {
    // Get user's payment methods
    const { data: paymentMethods, error: fetchError } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("[v0] Error fetching payment methods:", fetchError)
      return NextResponse.json({ error: "Erreur lors de la récupération des méthodes de paiement" }, { status: 500 })
    }

    return NextResponse.json({ paymentMethods })
  } catch (error) {
    console.error("[v0] Payment methods API error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  try {
    const body = await request.json()
    
    // If payment method details are not provided, fetch them from Stripe
    let paymentMethodData = body
    
    if (body.providerPaymentMethodId && body.provider === "stripe" && (!body.lastFour || !body.brand)) {
      try {
        const stripePaymentMethod = await stripe.paymentMethods.retrieve(body.providerPaymentMethodId)
        
        if (stripePaymentMethod.card) {
          paymentMethodData = {
            ...body,
            type: "card",
            lastFour: stripePaymentMethod.card.last4,
            brand: stripePaymentMethod.card.brand,
            expMonth: stripePaymentMethod.card.exp_month,
            expYear: stripePaymentMethod.card.exp_year,
          }
        }
      } catch (stripeError) {
        console.error("[v0] Error fetching payment method from Stripe:", stripeError)
        // Continue with provided data if Stripe fetch fails
      }
    }
    
    const validatedData = paymentMethodSchema.parse(paymentMethodData)

    // If this is set as default, unset other default methods
    if (validatedData.isDefault) {
      await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user.id)
    }

    // Create payment method
    const { data: paymentMethod, error: createError } = await supabase
      .from("payment_methods")
      .insert({
        user_id: user.id,
        type: validatedData.type,
        provider: validatedData.provider,
        provider_payment_method_id: validatedData.providerPaymentMethodId,
        card_last4: validatedData.lastFour,
        card_brand: validatedData.brand,
        card_exp_month: validatedData.expMonth,
        card_exp_year: validatedData.expYear,
        is_default: validatedData.isDefault,
      })
      .select()
      .single()

    if (createError) {
      console.error("[v0] Error creating payment method:", createError)
      return NextResponse.json({ error: "Erreur lors de la création de la méthode de paiement" }, { status: 500 })
    }

    return NextResponse.json({ paymentMethod }, { status: 201 })
  } catch (error) {
    console.error("[v0] Payment method creation error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
