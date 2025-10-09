/**
 * Loading Skeleton for Service Card
 * Displayed while fetching services from Supabase
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ServiceCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Service name */}
            <Skeleton className="h-5 w-3/4" />
            {/* Service description */}
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          {/* Price badge */}
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {/* Unit info */}
          <Skeleton className="h-4 w-24" />
          {/* Quantity selector */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-12 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ServicesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Services grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </div>

      {/* Special instructions skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>

      {/* Bottom bar skeleton */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  )
}
