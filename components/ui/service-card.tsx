"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Sparkles } from "lucide-react"

interface Service {
  id: string
  name: string
  description: string
  category: string
  base_price: number
  unit: string
  processing_time_hours: number
}

interface ServiceCardProps {
  service: Service
  onSelect?: (service: Service) => void
  isSelected?: boolean
  quantity?: number
  onQuantityChange?: (serviceId: string, quantity: number) => void
  serviceType?: string
}

export function ServiceCard({
  service,
  onSelect,
  isSelected = false,
  quantity = 0,
  onQuantityChange,
  serviceType = "classic",
}: ServiceCardProps) {
  const isExpress = service.category === "Service Express"

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${
        quantity > 0 ? "ring-2 ring-primary border-primary" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg">{service.name}</CardTitle>
            {isExpress && (
              <Badge className="bg-amber-100 text-amber-800">
                <Sparkles className="h-3 w-3 mr-1" />
                Express 24h
              </Badge>
            )}
          </div>
          <div className="text-right ml-4">
            <div className="flex items-center text-xl font-bold text-primary">{service.base_price.toFixed(2)}€</div>
            <div className="text-xs text-muted-foreground">pour 7kg</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="text-sm">{service.description}</CardDescription>

        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-2" />
          Délai: {service.processing_time_hours}h
        </div>

        {onQuantityChange && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant={quantity > 0 ? "default" : "outline"}
              size="sm"
              onClick={() => onQuantityChange(service.id, quantity > 0 ? 0 : 1)}
              className="flex-1 mr-2"
            >
              {quantity > 0 ? "Sélectionné" : "Sélectionner"}
            </Button>

            {quantity > 0 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuantityChange(service.id, Math.max(0, quantity - 1))}
                >
                  -
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button variant="outline" size="sm" onClick={() => onQuantityChange(service.id, quantity + 1)}>
                  +
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
