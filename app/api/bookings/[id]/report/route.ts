import { type NextRequest, NextResponse } from "next/server"
import { apiRequireAuth } from "@/lib/auth/api-guards"
import { reportProblemSchema } from "@/lib/validations/booking"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, error: authError } = await apiRequireAuth(request)

  if (authError) {
    return authError
  }

  try {
    const bookingId = params.id
    const body = await request.json()

    // Validate request body
    const result = reportProblemSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation échouée", issues: result.error.issues },
        { status: 400 },
      )
    }

    const { type, description, photos } = result.data

    // 1. Verify that booking exists and user owns it
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, user_id")
      .eq("id", bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 })
    }

    // 2. Check ownership
    if (booking.user_id !== user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à signaler un problème pour cette réservation" },
        { status: 403 },
      )
    }

    // 3. Create problem report
    const { data: report, error: insertError } = await supabase
      .from("booking_reports")
      .insert({
        booking_id: bookingId,
        user_id: user.id,
        type,
        description,
        photos: photos || [],
        status: "pending",
      })
      .select()
      .single()

    if (insertError) {
      console.error("[API] Problem report creation error:", insertError)
      return NextResponse.json({ error: "Erreur lors de la création du rapport" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: "Problème signalé avec succès. Notre équipe vous contactera sous 24h.",
    })
  } catch (error) {
    console.error("[API] Problem report error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

// GET endpoint to fetch reports for a booking
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase, error: authError } = await apiRequireAuth(request)

  if (authError) {
    return authError
  }

  try {
    const bookingId = params.id

    // Verify booking ownership
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, user_id")
      .eq("id", bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 })
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Fetch all reports for this booking
    const { data: reports, error: reportsError } = await supabase
      .from("booking_reports")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false })

    if (reportsError) {
      console.error("[API] Fetch reports error:", reportsError)
      return NextResponse.json({ error: "Erreur lors de la récupération des rapports" }, { status: 500 })
    }

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("[API] GET reports error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
