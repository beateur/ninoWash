import { NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth/api-guards"
import { canUseCredit } from "@/lib/services/subscription-credits"
import { z } from "zod"

const checkCreditSchema = z.object({
  bookingWeightKg: z.number().min(1).max(100),
})

/**
 * POST /api/subscriptions/credits/check
 * Vérifie si un crédit peut être utilisé pour une réservation
 */
export async function POST(request: NextRequest) {
  const { user, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  try {
    const body = await request.json()
    const validatedData = checkCreditSchema.parse(body)

    const result = await canUseCredit(user.id, validatedData.bookingWeightKg)

    return NextResponse.json(result)
  } catch (err) {
    console.error("[API] Credit check error:", err)

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", issues: err.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
