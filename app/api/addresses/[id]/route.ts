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

    const { data: address, error: updateError } = await supabase
      .from("user_addresses")
      .update({
        label: validatedData.label,
        type: validatedData.type,
        street_address: validatedData.streetAddress,
        building_info: validatedData.buildingInfo || null,
        city: validatedData.city,
        postal_code: validatedData.postalCode,
        access_instructions: validatedData.accessInstructions || null,
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

    // Check if address is used in any bookings
    const { data: bookingsWithAddress, error: bookingCheckError } = await supabase
      .from("bookings")
      .select("id, status")
      .or(`pickup_address_id.eq.${addressId},delivery_address_id.eq.${addressId}`)
      .limit(1)

    if (bookingCheckError) {
      console.error("[API] Error checking bookings:", bookingCheckError)
    }

    console.log("[API] Bookings check for address", addressId, ":", bookingsWithAddress)

    if (bookingsWithAddress && bookingsWithAddress.length > 0) {
      // Compter les réservations actives (pending, confirmed, in_progress)
      const activeStatuses = ['pending', 'confirmed', 'in_progress']
      const activeBookings = bookingsWithAddress.filter((b: { id: string; status: string }) => 
        activeStatuses.includes(b.status)
      )
      
      if (activeBookings.length > 0) {
        return NextResponse.json(
          {
            error: "Cette adresse ne peut pas être supprimée car elle est utilisée dans une ou plusieurs réservations en cours. Vous devez d'abord annuler ou terminer ces réservations.",
          },
          { status: 400 }
        )
      } else {
        // Réservations passées (completed, cancelled)
        return NextResponse.json(
          {
            error: "Cette adresse ne peut pas être supprimée car elle est liée à votre historique de réservations. Vous pouvez la modifier si vous le souhaitez.",
          },
          { status: 400 }
        )
      }
    }

    const { error: deleteError } = await supabase
      .from("user_addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("[API] Address deletion error:", deleteError)
      
      // Check if it's a foreign key constraint error
      if (deleteError.code === "23503") {
        return NextResponse.json(
          {
            error:
              "Cette adresse ne peut pas être supprimée car elle est liée à des réservations existantes. Pour protéger votre historique, veuillez plutôt modifier l'adresse si nécessaire.",
          },
          { status: 400 }
        )
      }
      
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
