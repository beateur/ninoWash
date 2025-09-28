import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: services, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Services fetch error:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des services" }, { status: 500 })
    }

    // Group services by category
    const groupedServices = services.reduce(
      (acc, service) => {
        if (!acc[service.category]) {
          acc[service.category] = []
        }
        acc[service.category].push(service)
        return acc
      },
      {} as Record<string, typeof services>,
    )

    return NextResponse.json({
      services: groupedServices,
      total: services.length,
    })
  } catch (error) {
    console.error("[v0] Services API error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
