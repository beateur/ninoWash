"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { clientAuth } from "@/lib/services/auth.service"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const result = await clientAuth.signOut()

      if (result.success) {
        router.push("/auth/signin")
        router.refresh()
      } else {
        console.error("Logout failed:", result.error)
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
