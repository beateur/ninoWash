import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileForm } from "@/components/forms/profile-form"
import { AddressesSection } from "@/components/profile/addresses-section"
import { requireAuth } from "@/lib/auth/route-guards"

export default async function ProfilePage() {
  const { user, supabase } = await requireAuth()

  // Get user profile data
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-balance">Mon profil</h1>
            <p className="text-muted-foreground mt-2">Gérez vos informations personnelles et préférences</p>
          </div>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Mettez à jour vos informations de contact et préférences</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={user} profile={profile} />
            </CardContent>
          </Card>

          {/* Addresses Section */}
          <div className="pt-4">
            <AddressesSection />
          </div>
        </div>
      </div>
    </div>
  )
}
