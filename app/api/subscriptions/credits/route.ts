import { type NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth/api-guards"
import { getCurrentCredits, getCreditStats } from "@/lib/services/subscription-credits"

/**
 * GET /api/subscriptions/credits
 * Récupère les crédits actuels de l'utilisateur authentifié
 */
export async function GET(request: NextRequest) {
  const { user, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const includeStats = searchParams.get("stats") === "true"

    if (includeStats) {
      // Avec statistiques complètes
      const stats = await getCreditStats(user.id)

      return NextResponse.json({
        credits: stats.currentCredits,
        stats: {
          totalUsed: stats.totalUsed,
          totalSaved: stats.totalSaved,
          usageRate: stats.usageRate,
        },
      })
    }

    // Sans statistiques (plus rapide)
    const credits = await getCurrentCredits(user.id)

    if (!credits) {
      return NextResponse.json(
        {
          credits: null,
          message: "Aucun crédit disponible",
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      credits,
    })
  } catch (error) {
    console.error("[API] Get credits error:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des crédits" }, { status: 500 })
  }
}
