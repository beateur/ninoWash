"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function SyncSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/subscriptions/sync", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Sync successful:", data)
        // Refresh the page to show updated subscription
        router.refresh()
      } else {
        console.error("[v0] Sync failed:", data.error)
        alert("Erreur lors de la synchronisation: " + data.error)
      }
    } catch (error) {
      console.error("[v0] Sync error:", error)
      alert("Erreur lors de la synchronisation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={isLoading} variant="outline" size="sm" className="bg-transparent">
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Synchronisation..." : "Synchroniser"}
    </Button>
  )
}
