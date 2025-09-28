import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: services, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("type", { ascending: true })
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Services fetch error:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des services" }, { status: 500 })
    }

    const groupedServices = services.reduce(
      (acc, service) => {
        if (!acc[service.type]) {
          acc[service.type] = []
        }
        acc[service.type].push(service)
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
