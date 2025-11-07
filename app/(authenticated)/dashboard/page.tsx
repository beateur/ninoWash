import { requireAuth } from "@/lib/auth/route-guards"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export default async function DashboardPage() {
  const { user, supabase } = await requireAuth()

  // Fetch bookings with addresses
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  let addressMap: Record<string, any> = {}
  if (bookings && bookings.length > 0) {
    const addressIds = [
      ...new Set([
        ...bookings.map((b) => b.pickup_address_id).filter(Boolean),
        ...bookings.map((b) => b.delivery_address_id).filter(Boolean),
      ]),
    ]

    if (addressIds.length > 0) {
      const { data: addresses } = await supabase
        .from("user_addresses")
        .select("id, street_address, city")
        .in("id", addressIds)

      if (addresses) {
        addressMap = addresses.reduce(
          (acc, addr) => {
            acc[addr.id] = addr
            return acc
          },
          {} as Record<string, any>,
        )
      }
    }
  }

  const enrichedBookings = bookings?.map((booking) => ({
    ...booking,
    pickup_address: booking.pickup_address_id ? addressMap[booking.pickup_address_id] : null,
    delivery_address: booking.delivery_address_id ? addressMap[booking.delivery_address_id] : null,
  })) || []

  // Get user's addresses count
  const { count: addressCount } = await supabase
    .from("user_addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Check for active subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .maybeSingle()

  return (
    <DashboardClient
      user={user}
      bookings={enrichedBookings}
      addressCount={addressCount || 0}
      hasActiveSubscription={!!subscription}
    />
  )
}
