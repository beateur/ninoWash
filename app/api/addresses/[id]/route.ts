import { type NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth/api-guards"
import { addressSchema } from "@/lib/validations/booking"
import { z } from "zod"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  try {
    const addressId = params.id
    const body = await request.json()
    const validatedData = addressSchema.parse(body)

    // Verify ownership
    const { data: existingAddress, error: fetchError } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("id", addressId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existingAddress) {
      return NextResponse.json({ error: "Adresse non trouvée" }, { status: 404 })
    }

    // If this is set as default, unset other default addresses
    if (validatedData.isDefault) {
      await supabase
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .neq("id", addressId)
    }

    const { data: address, error: updateError } = await supabase
      .from("user_addresses")
      .update({
        label: validatedData.label,
        type: validatedData.type,
        street_address: validatedData.streetAddress,
        apartment: validatedData.apartment,
        city: validatedData.city,
        postal_code: validatedData.postalCode,
        delivery_instructions: validatedData.deliveryInstructions,
        access_code: validatedData.accessCode,
        is_default: validatedData.isDefault,
        updated_at: new Date().toISOString(),
      })
      .eq("id", addressId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("[API] Address update error:", updateError)
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour de l'adresse" },
        { status: 500 }
      )
    }

    return NextResponse.json({ address, message: "Adresse mise à jour avec succès" })
  } catch (error) {
    console.error("[API] Address update error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  try {
    const addressId = params.id
    const body = await request.json()

    // Verify ownership
    const { data: existingAddress, error: fetchError } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("id", addressId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existingAddress) {
      return NextResponse.json({ error: "Adresse non trouvée" }, { status: 404 })
    }

    // If setting as default, unset other default addresses
    if (body.is_default === true) {
      await supabase
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .neq("id", addressId)
    }

    const { data: address, error: updateError } = await supabase
      .from("user_addresses")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", addressId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("[API] Address patch error:", updateError)
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour de l'adresse" },
        { status: 500 }
      )
    }

    return NextResponse.json({ address, message: "Adresse mise à jour avec succès" })
  } catch (error) {
    console.error("[API] Address patch error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, supabase, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  try {
    const addressId = params.id

    // Verify ownership and check if default
    const { data: existingAddress, error: fetchError } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("id", addressId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existingAddress) {
      return NextResponse.json({ error: "Adresse non trouvée" }, { status: 404 })
    }

    if (existingAddress.is_default) {
      return NextResponse.json(
        {
          error:
            "Cette adresse est votre adresse par défaut. Veuillez d'abord en définir une autre.",
        },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from("user_addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("[API] Address deletion error:", deleteError)
      return NextResponse.json(
        { error: "Erreur lors de la suppression de l'adresse" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Adresse supprimée avec succès" })
  } catch (error) {
    console.error("[API] Address deletion error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
