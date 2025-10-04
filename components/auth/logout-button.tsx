"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (!error) {
        router.push("/auth/signin")
        router.refresh()
      } else {
        console.error("Logout failed:", error)
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoading} className="bg-transparent">
      <LogOut className="h-4 w-4 mr-2" />
      {isLoading ? "Déconnexion..." : "Se déconnecter"}
    </Button>
  )
}
