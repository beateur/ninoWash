import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { addressSchema } from "@/lib/validations/booking"
import { z } from "zod"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: addresses, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Addresses fetch error:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des adresses" }, { status: 500 })
    }

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error("[v0] Addresses API error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = addressSchema.parse(body)

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // If this is set as default, unset other default addresses
    if (validatedData.isDefault) {
      await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id)
    }

    const { data: address, error } = await supabase
      .from("user_addresses")
      .insert({
        user_id: user.id,
        label: validatedData.label,
        street_address: validatedData.streetAddress,
        building_info: validatedData.apartment,
        city: validatedData.city,
        postal_code: validatedData.postalCode,
        access_instructions: validatedData.deliveryInstructions,
        is_default: validatedData.isDefault,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Address creation error:", error)
      return NextResponse.json({ error: "Erreur lors de la création de l'adresse" }, { status: 500 })
    }

    return NextResponse.json({ address, message: "Adresse créée avec succès" })
  } catch (error) {
    console.error("[v0] Address creation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
