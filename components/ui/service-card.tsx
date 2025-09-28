"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Euro } from "lucide-react"

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
}

export function ServiceCard({
  service,
  onSelect,
  isSelected = false,
  quantity = 0,
  onQuantityChange,
}: ServiceCardProps) {
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "cleaning":
        return "Nettoyage"
      case "ironing":
        return "Repassage"
      case "special":
        return "Spécialisé"
      default:
        return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "cleaning":
        return "bg-blue-100 text-blue-800"
      case "ironing":
        return "bg-green-100 text-green-800"
      case "special":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${
        isSelected ? "ring-2 ring-primary border-primary" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <Badge className={getCategoryColor(service.category)}>{getCategoryLabel(service.category)}</Badge>
          </div>
          <div className="text-right">
            <div className="flex items-center text-lg font-semibold text-primary">
              <Euro className="h-4 w-4 mr-1" />
              {service.base_price.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">par {service.unit === "piece" ? "pièce" : service.unit}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="text-sm">{service.description}</CardDescription>

        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-2" />
          Délai: {service.processing_time_hours}h
        </div>

        <div className="flex items-center justify-between">
          {onSelect && (
            <Button
              variant={isSelected ? "default" : "outline"}
              onClick={() => onSelect(service)}
              className="flex-1 mr-2"
            >
              {isSelected ? "Sélectionné" : "Sélectionner"}
            </Button>
          )}

          {onQuantityChange && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuantityChange(service.id, Math.max(0, quantity - 1))}
                disabled={quantity <= 0}
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
      </CardContent>
    </Card>
  )
}
