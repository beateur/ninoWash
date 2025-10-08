import { type NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth/api-guards"
import { z } from "zod"

// Validation schema for PATCH
const updatePaymentMethodSchema = z.object({
  isDefault: z.boolean().optional(),
})

/**
 * PATCH /api/payments/methods/[id]
 * Met à jour un moyen de paiement (ex: définir comme par défaut)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updatePaymentMethodSchema.parse(body)

    // Vérifier que le moyen de paiement appartient à l'utilisateur
    const { data: existingMethod, error: fetchError } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existingMethod) {
      return NextResponse.json(
        { error: "Moyen de paiement introuvable" },
        { status: 404 }
      )
    }

    // Si on définit cette carte comme par défaut, désactiver les autres
    if (validatedData.isDefault) {
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .neq("id", id)
    }

    // Mettre à jour le moyen de paiement
    const { data: updatedMethod, error: updateError } = await supabase
      .from("payment_methods")
      .update({
        is_default: validatedData.isDefault ?? existingMethod.is_default,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating payment method:", updateError)
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du moyen de paiement" },
        { status: 500 }
      )
    }

    return NextResponse.json({ paymentMethod: updatedMethod })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", issues: error.issues },
        { status: 400 }
      )
    }

    console.error("[v0] Payment method update error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

/**
 * DELETE /api/payments/methods/[id]
 * Supprime un moyen de paiement (soft delete: is_active = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, supabase, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  try {
    const { id } = await params

    // Vérifier que le moyen de paiement appartient à l'utilisateur
    const { data: existingMethod, error: fetchError } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !existingMethod) {
      return NextResponse.json(
        { error: "Moyen de paiement introuvable" },
        { status: 404 }
      )
    }

    // Soft delete (is_active = false)
    const { error: deleteError } = await supabase
      .from("payment_methods")
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("[v0] Error deleting payment method:", deleteError)
      return NextResponse.json(
        { error: "Erreur lors de la suppression du moyen de paiement" },
        { status: 500 }
      )
    }

    // TODO: Optionnel - Detach payment method depuis Stripe
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    // await stripe.paymentMethods.detach(existingMethod.provider_payment_method_id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Payment method deletion error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
