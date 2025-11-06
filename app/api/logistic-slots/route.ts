/**
 * API Route: GET /api/logistic-slots
 * Récupère les créneaux de collecte ou livraison disponibles
 *
 * Query params:
 * - role: 'pickup' | 'delivery' (REQUIRED)
 * - startDate: ISO date (YYYY-MM-DD) - optional
 * - endDate: ISO date (YYYY-MM-DD) - optional
 *
 * @see docs/IMPLEMENTATION_PLAN_SLOTS.md
 */

import { NextRequest, NextResponse } from "next/server"
import { getLogisticSlotsSchema } from "@/lib/validations/logistic-slots"
import { getAvailableSlots } from "@/lib/services/logistic-slots"

// Force dynamic rendering (uses request.url)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined

    console.log("[v0] GET /api/logistic-slots params:", {
      role,
      startDate,
      endDate,
    })

    // Validation des paramètres
    const result = getLogisticSlotsSchema.safeParse({
      role,
      startDate,
      endDate,
    })

    if (!result.success) {
      console.error(
        "[v0] GET /api/logistic-slots validation error:",
        result.error.issues
      )
      return NextResponse.json(
        {
          error: "Paramètres invalides",
          issues: result.error.issues,
        },
        { status: 400 }
      )
    }

    // Récupération des slots via service
    const slots = await getAvailableSlots(
      result.data.role,
      result.data.startDate,
      result.data.endDate
    )

    console.log(
      `[v0] GET /api/logistic-slots success: ${slots.length} slots found`
    )

    return NextResponse.json({ slots })
  } catch (error) {
    console.error("[v0] GET /api/logistic-slots error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des créneaux",
      },
      { status: 500 }
    )
  }
}
