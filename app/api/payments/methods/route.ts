import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { paymentMethodSchema } from "@/lib/validations/payment"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Get user's payment methods
    const { data: paymentMethods, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching payment methods:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des méthodes de paiement" }, { status: 500 })
    }

    return NextResponse.json({ paymentMethods })
  } catch (error) {
    console.error("[v0] Payment methods API error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = paymentMethodSchema.parse(body)

    // If this is set as default, unset other default methods
    if (validatedData.isDefault) {
      await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user.id)
    }

    // Create payment method
    const { data: paymentMethod, error } = await supabase
      .from("payment_methods")
      .insert({
        user_id: user.id,
        type: validatedData.type,
        provider: validatedData.provider,
        provider_payment_method_id: validatedData.providerPaymentMethodId,
        last_four: validatedData.lastFour,
        brand: validatedData.brand,
        exp_month: validatedData.expMonth,
        exp_year: validatedData.expYear,
        is_default: validatedData.isDefault,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating payment method:", error)
      return NextResponse.json({ error: "Erreur lors de la création de la méthode de paiement" }, { status: 500 })
    }

    return NextResponse.json({ paymentMethod }, { status: 201 })
  } catch (error) {
    console.error("[v0] Payment method creation error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
