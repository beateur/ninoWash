import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { withAdminGuard } from "@/lib/middleware/admin-guard"

export const GET = withAdminGuard(async (request: NextRequest) => {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    // Get dashboard statistics
    const [
      { count: totalBookings },
      { count: activeSubscriptions },
      { count: pendingBookings },
      { count: completedBookings },
      { count: newUsers },
    ] = await Promise.all([
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "completed"),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    // Calculate monthly revenue (simplified - in real app would be more complex)
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("status", "succeeded")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const monthlyRevenue = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0

    const stats = {
      totalBookings: totalBookings || 0,
      activeSubscriptions: activeSubscriptions || 0,
      monthlyRevenue,
      pendingBookings: pendingBookings || 0,
      completedBookings: completedBookings || 0,
      newUsers: newUsers || 0,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("[v0] Admin stats API error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
})
