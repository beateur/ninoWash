"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, CreditCard, BarChart3, Shield, Settings, Package, Truck } from "lucide-react"

const schemaCategories = [
  {
    name: "Multi-Tenancy",
    icon: Database,
    color: "bg-blue-500",
    tables: [
      { name: "organizations", description: "Top-level tenant entities with billing and settings" },
      { name: "workspaces", description: "Isolated work environments within organizations" },
      { name: "teams", description: "Collaborative groups within organizations" },
      { name: "organization_members", description: "User membership and roles in organizations" },
      { name: "workspace_members", description: "User access to specific workspaces" },
      { name: "team_members", description: "Team membership and permissions" },
    ],
  },
  {
    name: "Authentication & Authorization",
    icon: Shield,
    color: "bg-green-500",
    tables: [
      { name: "users", description: "Core user accounts with authentication data" },
      { name: "user_profiles", description: "Extended user information and preferences" },
      { name: "user_sessions", description: "Active user sessions with device tracking" },
      { name: "roles", description: "System and custom role definitions" },
      { name: "user_roles", description: "Role assignments to users" },
      { name: "invitations", description: "Pending invitations to organizations/teams" },
      { name: "user_preferences", description: "User-specific settings and preferences" },
    ],
  },
  {
    name: "Subscription & Billing",
    icon: CreditCard,
    color: "bg-purple-500",
    tables: [
      { name: "subscription_plans", description: "Available subscription tiers and pricing" },
      { name: "subscriptions", description: "Active user/org subscriptions with Stripe integration" },
      { name: "invoices", description: "Billing invoices and payment records" },
      { name: "invoice_line_items", description: "Detailed line items for each invoice" },
      { name: "payment_methods", description: "Stored payment methods for users" },
      { name: "payment_transactions", description: "Payment transaction history" },
      { name: "coupons", description: "Discount codes and promotions" },
      { name: "coupon_redemptions", description: "Coupon usage tracking" },
      { name: "usage_records", description: "Usage-based billing metrics" },
    ],
  },
  {
    name: "Analytics & Tracking",
    icon: BarChart3,
    color: "bg-orange-500",
    tables: [
      { name: "events", description: "User interaction events with UTM tracking" },
      { name: "page_views", description: "Page view analytics with performance metrics" },
      { name: "user_sessions", description: "Session tracking with device and location data" },
      { name: "feature_usage", description: "Feature adoption and usage metrics" },
      { name: "user_engagement_daily", description: "Daily user engagement aggregates" },
      { name: "organization_metrics_daily", description: "Daily organization-level metrics" },
      { name: "performance_metrics", description: "Application performance tracking" },
      { name: "conversion_funnels", description: "Conversion funnel definitions" },
      { name: "conversion_funnel_events", description: "Funnel step completion tracking" },
      { name: "experiments", description: "A/B test configurations" },
      { name: "experiment_assignments", description: "User variant assignments" },
    ],
  },
  {
    name: "Audit & Monitoring",
    icon: Settings,
    color: "bg-red-500",
    tables: [
      { name: "activities", description: "Comprehensive audit log of all actions" },
      { name: "error_logs", description: "Application error tracking and resolution" },
    ],
  },
  {
    name: "Business Operations",
    icon: Package,
    color: "bg-teal-500",
    tables: [
      { name: "services", description: "Service offerings and pricing" },
      { name: "service_categories", description: "Service categorization" },
      { name: "service_options", description: "Additional service options" },
      { name: "service_service_options", description: "Service-option relationships" },
      { name: "bookings", description: "Customer service bookings" },
      { name: "booking_items", description: "Individual items in bookings" },
      { name: "user_addresses", description: "Customer delivery/pickup addresses" },
      { name: "loyalty_rewards", description: "Customer loyalty program tracking" },
    ],
  },
  {
    name: "Logistics",
    icon: Truck,
    color: "bg-indigo-500",
    tables: [
      { name: "delivery_drivers", description: "Driver profiles and availability" },
      { name: "delivery_assignments", description: "Delivery task assignments" },
    ],
  },
  {
    name: "System",
    icon: Database,
    color: "bg-gray-500",
    tables: [
      { name: "system_settings", description: "Application-wide configuration" },
      { name: "spatial_ref_sys", description: "PostGIS spatial reference systems" },
      { name: "geography_columns", description: "PostGIS geography metadata" },
      { name: "geometry_columns", description: "PostGIS geometry metadata" },
    ],
  },
]

const keyFeatures = [
  {
    title: "Multi-Tenancy",
    description: "Three-level hierarchy: Organizations → Workspaces → Teams",
    features: [
      "Isolated data per organization",
      "Flexible workspace organization",
      "Team-based collaboration",
      "Role-based access control at each level",
    ],
  },
  {
    title: "Soft Deletes",
    description: "Data retention with deleted_at timestamps",
    features: [
      "Organizations: deleted_at column",
      "Workspaces: deleted_at column",
      "Users: deleted_at column",
      "Recoverable data for compliance",
    ],
  },
  {
    title: "Audit Trail",
    description: "Comprehensive activity logging",
    features: [
      "All user actions tracked in activities table",
      "IP address and user agent capture",
      "Entity-level change tracking",
      "Error logging with resolution tracking",
    ],
  },
  {
    title: "Usage Tracking",
    description: "Detailed analytics and metrics",
    features: [
      "Event tracking with UTM parameters",
      "Feature usage monitoring",
      "Daily engagement aggregates",
      "Conversion funnel analysis",
      "A/B testing support",
    ],
  },
  {
    title: "Subscription Management",
    description: "Full billing lifecycle with Stripe",
    features: [
      "Multiple subscription plans",
      "Usage-based billing support",
      "Invoice generation",
      "Payment method management",
      "Coupon and discount system",
    ],
  },
  {
    title: "Geospatial Support",
    description: "PostGIS integration for location features",
    features: ["Address geocoding", "Driver location tracking", "Delivery route optimization", "Geographic analytics"],
  },
]

export function DatabaseSchemaVisualization() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Schema Overview</CardTitle>
          <CardDescription>48 tables organized into 8 functional categories</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categories">By Category</TabsTrigger>
              <TabsTrigger value="features">Key Features</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-4 mt-4">
              {schemaCategories.map((category) => {
                const Icon = category.icon
                return (
                  <Card key={category.name}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`${category.color} p-2 rounded-lg`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <CardDescription>{category.tables.length} tables</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2">
                        {category.tables.map((table) => (
                          <div key={table.name} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <code className="text-sm font-mono font-semibold">{table.name}</code>
                            </div>
                            <p className="text-xs text-muted-foreground">{table.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="features" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {keyFeatures.map((feature) => (
                  <Card key={feature.title}>
                    <CardHeader>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.features.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
