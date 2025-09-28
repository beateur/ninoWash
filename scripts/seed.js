const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedDatabase() {
  console.log("🌱 Starting database seeding...\n")

  try {
    // Seed services
    console.log("📦 Seeding services...")
    const { error: servicesError } = await supabase.from("services").upsert(
      [
        {
          id: 1,
          name: "Nettoyage Standard",
          description: "Service de nettoyage complet pour vos vêtements du quotidien",
          price: 15.0,
          category: "cleaning",
          duration: 60,
          image: "/images/services/standard-cleaning.jpg",
          is_active: true,
        },
        {
          id: 2,
          name: "Repassage Express",
          description: "Repassage professionnel de vos chemises et pantalons",
          price: 8.0,
          category: "ironing",
          duration: 30,
          image: "/images/services/express-ironing.jpg",
          is_active: true,
        },
        {
          id: 3,
          name: "Nettoyage Premium",
          description: "Traitement délicat pour vos vêtements de luxe",
          price: 25.0,
          category: "premium",
          duration: 120,
          image: "/images/services/premium-cleaning.jpg",
          is_active: true,
        },
      ],
      { onConflict: "id" },
    )

    if (servicesError) throw servicesError
    console.log("   ✅ Services seeded successfully")

    // Seed subscription plans
    console.log("💳 Seeding subscription plans...")
    const { error: plansError } = await supabase.from("subscription_plans").upsert(
      [
        {
          id: 1,
          name: "Essentiel",
          description: "Parfait pour un usage occasionnel",
          price: 29.99,
          billing_period: "monthly",
          max_bookings_per_month: 5,
          discount_percentage: 10,
          is_active: true,
        },
        {
          id: 2,
          name: "Confort",
          description: "Idéal pour les familles",
          price: 49.99,
          billing_period: "monthly",
          max_bookings_per_month: 12,
          discount_percentage: 15,
          is_active: true,
        },
        {
          id: 3,
          name: "Premium",
          description: "Service illimité avec avantages exclusifs",
          price: 79.99,
          billing_period: "monthly",
          max_bookings_per_month: -1, // Unlimited
          discount_percentage: 20,
          is_active: true,
        },
      ],
      { onConflict: "id" },
    )

    if (plansError) throw plansError
    console.log("   ✅ Subscription plans seeded successfully")

    // Create admin user if in development
    if (process.env.NODE_ENV === "development") {
      console.log("👤 Creating admin user...")

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: "admin@ninowash.com",
        password: "admin123",
        email_confirm: true,
        user_metadata: {
          full_name: "Admin User",
          role: "admin",
        },
      })

      if (authError && !authError.message.includes("already registered")) {
        throw authError
      }

      if (authData.user) {
        // Update user profile
        const { error: profileError } = await supabase.from("users").upsert(
          {
            id: authData.user.id,
            email: "admin@ninowash.com",
            full_name: "Admin User",
            role: "admin",
            created_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )

        if (profileError) {
          console.warn("   ⚠️  Warning updating admin profile:", profileError.message)
        } else {
          console.log("   ✅ Admin user created successfully")
        }
      }
    }

    console.log("\n🎉 Database seeding completed successfully!")
  } catch (error) {
    console.error("💥 Seeding failed:", error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  seedDatabase()
}

module.exports = { seedDatabase }
