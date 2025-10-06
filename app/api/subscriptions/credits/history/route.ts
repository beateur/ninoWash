import { type NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth/api-guards"
import { getCreditUsageHistory, getTotalAmountSaved } from "@/lib/services/subscription-credits"

/**
 * GET /api/subscriptions/credits/history
 * Récupère l'historique d'utilisation des crédits
 */
export async function GET(request: NextRequest) {
  const { user, error } = await apiRequireAuth(request)

  if (error) {
    return error
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "20", 10)

    const [history, totalSaved] = await Promise.all([
      getCreditUsageHistory(user.id, limit),
      getTotalAmountSaved(user.id),
    ])

    return NextResponse.json({
      history,
      totalSaved,
      count: history.length,
    })
  } catch (error) {
    console.error("[API] Get credit history error:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération de l'historique" }, { status: 500 })
  }
}
