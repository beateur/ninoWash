"use client"

import { Button } from "@/components/ui/button"
import { BOOKINGS_ENABLED } from "@/lib/flags"
import { useToast } from "@/hooks/use-toast"
import { Instagram } from "lucide-react"
import { useRouter } from "next/navigation"

interface BookingButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link"
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  children?: React.ReactNode
  onClick?: () => void
  /** Target route for booking - defaults to guest flow */
  href?: string
}

export function BookingButton({ 
  variant = "default", 
  className = "", 
  size = "default",
  children = "Réserver maintenant",
  onClick: externalOnClick,
  href = "/reservation/guest"
}: BookingButtonProps) {
  const { toast } = useToast()
  const router = useRouter()

  const handleClick = () => {
    if (!BOOKINGS_ENABLED) {
      toast({
        title: "⏸️ Réservations temporairement suspendues",
        description: (
          <div className="mt-2 space-y-2">
            <p>Nous rencontrons trop de demandes récentes.</p>
            <p className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Veuillez nous contacter sur Instagram{" "}
              <a 
                href="https://www.instagram.com/nino.wash" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                @nino.wash
              </a>
            </p>
          </div>
        ),
        duration: 6000,
      })
      return
    }

    // Call external onClick first if provided
    if (externalOnClick) {
      externalOnClick()
    }

    router.push(href)
  }

  return (
    <Button 
      variant={variant} 
      className={className} 
      size={size}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}
