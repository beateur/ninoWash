"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RotateCw, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ResetResult {
  userId: string
  planId: string
  credits: number
  success: boolean
  error?: string
}

interface ResetResponse {
  success: boolean
  message: string
  totalProcessed: number
  successCount: number
  errorCount: number
  results: ResetResult[]
}

export function DevCreditReset({ userId }: { userId?: string }) {
  const [isResetting, setIsResetting] = useState(false)
  const [lastResult, setLastResult] = useState<ResetResponse | null>(null)

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null
  }

  const handleReset = async () => {
    setIsResetting(true)
    setLastResult(null)

    try {
      const response = await fetch("/api/dev/reset-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data: ResetResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset credits")
      }

      setLastResult(data)

      toast({
        title: "✅ Credits Reset!",
        description: `${data.successCount} subscription(s) reset successfully`,
        variant: "default",
      })

      // Refresh the page to show new credits
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Error resetting credits:", error)
      toast({
        title: "❌ Reset Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-yellow-600" />
              Dev: Reset Credits
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-400">
              Manually reset weekly credits for testing
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-yellow-600 text-yellow-700">
            DEV ONLY
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleReset}
            disabled={isResetting}
            variant="outline"
            className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-950"
          >
            {isResetting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCw className="mr-2 h-4 w-4" />
                Reset Credits Now
              </>
            )}
          </Button>

          {userId && (
            <Badge variant="secondary">
              Target: {userId.substring(0, 8)}...
            </Badge>
          )}
        </div>

        {lastResult && (
          <div className="space-y-2 rounded-lg border border-yellow-200 bg-white p-3 dark:border-yellow-800 dark:bg-yellow-950/30">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Last Reset:</span>
              <Badge
                variant={lastResult.errorCount === 0 ? "default" : "destructive"}
              >
                {lastResult.successCount}/{lastResult.totalProcessed} successful
              </Badge>
            </div>

            <div className="space-y-1">
              {lastResult.results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">
                    {result.userId.substring(0, 8)}... ({result.planId})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.credits} credits</span>
                    {result.success ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-yellow-700 dark:text-yellow-400">
          <p className="font-medium mb-1">ℹ️ This will:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Reset credits for all active subscriptions</li>
            <li>Monthly plans: 2 credits</li>
            <li>Quarterly plans: 3 credits</li>
            <li>Update reset_at timestamp</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
