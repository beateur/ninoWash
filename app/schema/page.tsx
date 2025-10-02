"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Database, Users, Building2, CreditCard, Shield, Activity, Settings, Package } from "lucide-react"

export default function SchemaDocumentationPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")

  const schemaCategories = [
    {
      id: "authentication",
      name: "Authentication & Users",
      icon: Users,
      color: "bg-blue-500",
      tables: [
        {
          name: "users",
          description: "Core user accounts with authentication details",
          columns: ["id", "email", "password_hash", "auth_provider", "email_verified", "phone_verified"],
          relationships: ["→ user_profiles", "→ user_sessions", "→ user_roles"],
        },
        {
          name: "user_profiles",
          description: "Extended user profile information and preferences",
          columns: ["id", "first_name", "last_name", "display_name", "avatar_url", "bio", "timezone"],
          relationships: ["← users"],
        },
        {
          name: "user_sessions",
          description: "Active user sessions with device and location tracking",
          columns: ["id", "user_id", "session_token", "expires_at", "ip_address", "device_info"],
          relationships: ["← users"],
        },
        {
          name: "user_preferences",
          description: "User-specific settings and preferences",
          columns: ["id", "user_id", "category", "key", "value"],
          relationships: ["← users"],
        },
      ],
    },
    {
      id: "multi-tenancy",
      name: "Multi-Tenancy",
      icon: Building2,
      color: "bg-purple-500",
      tables: [
        {
          name: "organizations",
          description: "Top-level tenant organizations",
          columns: ["id", "name", "slug", "logo_url", "subscription_id", "billing_email", "settings"],
          relationships: ["→ organization_members", "→ teams", "→ workspaces", "← subscriptions"],
        },
        {
          name: "organization_members",
          description: "User membership in organizations with roles",
          columns: ["id", "organization_id", "user_id", "role", "permissions", "is_active"],
          relationships: ["← organizations", "← users"],
        },
        {
          name: "teams",
          description: "Sub-groups within organizations",
          columns: ["id", "organization_id", "name", "description", "privacy_level", "settings"],
          relationships: ["← organizations", "→ team_members"],
        },
        {
          name: "team_members",
          description: "User membership in teams",
          columns: ["id", "team_id", "user_id", "role", "permissions"],
          relationships: ["← teams", "← users"],
        },
        {
          name: "workspaces",
          description: "Isolated work environments within organizations",
          columns: ["id", "organization_id", "name", "slug", "visibility", "settings"],
          relationships: ["← organizations", "→ workspace_members"],
        },
        {
          name: "workspace_members",
          description: "User access to workspaces",
          columns: ["id", "workspace_id", "user_id", "role", "permissions"],
          relationships: ["← workspaces", "← users"],
        },
      ],
    },
    {
      id: "rbac",
      name: "RBAC & Permissions",
      icon: Shield,
      color: "bg-green-500",
      tables: [
        {
          name: "roles",
          description: "System and custom role definitions",
          columns: ["id", "name", "description", "permissions", "is_system_role"],
          relationships: ["→ user_roles"],
        },
        {
          name: "user_roles",
          description: "Role assignments to users",
          columns: ["id", "user_id", "role_id", "assigned_by", "expires_at"],
          relationships: ["← users", "← roles"],
        },
        {
          name: "invitations",
          description: "Pending invitations to organizations/teams/workspaces",
          columns: ["id", "invitee_email", "role", "status", "token", "expires_at"],
          relationships: ["← organizations", "← teams", "← workspaces"],
        },
      ],
    },
    {
      id: "billing",
      name: "Billing & Subscriptions",
      icon: CreditCard,
      color: "bg-yellow-500",
      tables: [
        {
          name: "subscription_plans",
          description: "Available subscription tiers and pricing",
          columns: ["id", "name", "price_amount", "billing_interval", "features", "is_active"],
          relationships: ["→ subscriptions"],
        },
        {
          name: "subscriptions",
          description: "Active user/organization subscriptions",
          columns: [
            "id",
            "user_id",
            "plan_id",
            "status",
            "stripe_subscription_id",
            "current_period_end",
            "cancel_at_period_end",
          ],
          relationships: ["← users", "← subscription_plans", "→ invoices"],
        },
        {
          name: "invoices",
          description: "Billing invoices and payment records",
          columns: ["id", "subscription_id", "amount_due", "status", "stripe_invoice_id", "paid_at"],
          relationships: ["← subscriptions", "→ invoice_line_items"],
        },
        {
          name: "invoice_line_items",
          description: "Individual line items on invoices",
          columns: ["id", "invoice_id", "description", "amount", "quantity"],
          relationships: ["← invoices"],
        },
        {
          name: "payment_methods",
          description: "Stored payment methods for users",
          columns: ["id", "user_id", "type", "provider_payment_method_id", "is_default"],
          relationships: ["← users"],
        },
        {
          name: "payment_transactions",
          description: "Payment transaction history",
          columns: ["id", "user_id", "amount", "status", "stripe_payment_intent_id"],
          relationships: ["← users", "← invoices"],
        },
        {
          name: "coupons",
          description: "Discount coupons and promotional codes",
          columns: ["id", "code", "discount_type", "discount_value", "valid_from", "valid_until"],
          relationships: ["→ coupon_redemptions"],
        },
        {
          name: "coupon_redemptions",
          description: "Coupon usage tracking",
          columns: ["id", "coupon_id", "user_id", "subscription_id", "redeemed_at"],
          relationships: ["← coupons", "← users"],
        },
        {
          name: "usage_records",
          description: "Usage-based billing metrics",
          columns: ["id", "subscription_id", "metric_name", "quantity", "billing_period_start"],
          relationships: ["← subscriptions"],
        },
      ],
    },
    {
      id: "analytics",
      name: "Analytics & Tracking",
      icon: Activity,
      color: "bg-red-500",
      tables: [
        {
          name: "events",
          description: "User interaction events and analytics",
          columns: ["id", "user_id", "event_name", "properties", "timestamp", "utm_source"],
          relationships: ["← users", "← organizations"],
        },
        {
          name: "page_views",
          description: "Page view tracking with performance metrics",
          columns: ["id", "session_id", "page_url", "load_time_ms", "time_on_page_seconds"],
          relationships: ["← user_sessions"],
        },
        {
          name: "feature_usage",
          description: "Feature adoption and usage tracking",
          columns: ["id", "user_id", "feature_name", "usage_count", "success"],
          relationships: ["← users"],
        },
        {
          name: "user_engagement_daily",
          description: "Daily aggregated user engagement metrics",
          columns: ["id", "user_id", "date", "session_count", "page_views", "features_used"],
          relationships: ["← users"],
        },
        {
          name: "organization_metrics_daily",
          description: "Daily aggregated organization metrics",
          columns: ["id", "organization_id", "date", "active_users", "revenue_generated"],
          relationships: ["← organizations"],
        },
        {
          name: "conversion_funnels",
          description: "Defined conversion funnel configurations",
          columns: ["id", "name", "steps", "is_active"],
          relationships: ["→ conversion_funnel_events"],
        },
        {
          name: "conversion_funnel_events",
          description: "User progress through conversion funnels",
          columns: ["id", "funnel_id", "user_id", "step_name", "completed"],
          relationships: ["← conversion_funnels", "← users"],
        },
        {
          name: "experiments",
          description: "A/B test and experiment configurations",
          columns: ["id", "name", "variants", "status", "start_date", "end_date"],
          relationships: ["→ experiment_assignments"],
        },
        {
          name: "experiment_assignments",
          description: "User assignments to experiment variants",
          columns: ["id", "experiment_id", "user_id", "variant_name", "assigned_at"],
          relationships: ["← experiments", "← users"],
        },
      ],
    },
    {
      id: "audit",
      name: "Audit & Monitoring",
      icon: Activity,
      color: "bg-indigo-500",
      tables: [
        {
          name: "activities",
          description: "Audit log of user actions and system events",
          columns: ["id", "actor_id", "action", "entity_type", "entity_id", "metadata", "ip_address"],
          relationships: ["← users", "← organizations"],
        },
        {
          name: "error_logs",
          description: "Application error tracking and monitoring",
          columns: ["id", "user_id", "error_type", "error_message", "error_stack", "resolved"],
          relationships: ["← users"],
        },
        {
          name: "performance_metrics",
          description: "System performance monitoring",
          columns: ["id", "metric_name", "value", "timestamp", "tags"],
          relationships: [],
        },
      ],
    },
    {
      id: "business",
      name: "Business Domain",
      icon: Package,
      color: "bg-orange-500",
      tables: [
        {
          name: "services",
          description: "Service offerings catalog",
          columns: ["id", "name", "code", "type", "base_price", "processing_days"],
          relationships: ["→ bookings", "→ service_service_options"],
        },
        {
          name: "service_categories",
          description: "Service categorization",
          columns: ["id", "name", "description", "icon", "sort_order"],
          relationships: [],
        },
        {
          name: "service_options",
          description: "Additional service options and add-ons",
          columns: ["id", "name", "code", "price", "category"],
          relationships: ["→ service_service_options"],
        },
        {
          name: "bookings",
          description: "Customer service bookings",
          columns: ["id", "user_id", "service_id", "status", "total_amount", "booking_number"],
          relationships: ["← users", "← services", "→ booking_items"],
        },
        {
          name: "booking_items",
          description: "Individual items in a booking",
          columns: ["id", "booking_id", "service_id", "quantity", "unit_price"],
          relationships: ["← bookings"],
        },
        {
          name: "user_addresses",
          description: "Customer delivery addresses",
          columns: ["id", "user_id", "street_address", "city", "postal_code", "is_default"],
          relationships: ["← users"],
        },
        {
          name: "delivery_drivers",
          description: "Delivery driver profiles",
          columns: ["id", "user_id", "vehicle_type", "is_available", "rating"],
          relationships: ["← users"],
        },
        {
          name: "delivery_assignments",
          description: "Driver assignments to bookings",
          columns: ["id", "booking_id", "driver_id", "status", "assigned_at"],
          relationships: ["← bookings", "← delivery_drivers"],
        },
        {
          name: "loyalty_rewards",
          description: "Customer loyalty program tracking",
          columns: ["id", "user_id", "completed_orders", "free_collections_earned"],
          relationships: ["← users"],
        },
      ],
    },
    {
      id: "system",
      name: "System Configuration",
      icon: Settings,
      color: "bg-gray-500",
      tables: [
        {
          name: "system_settings",
          description: "Application-wide configuration settings",
          columns: ["id", "key", "value", "category", "is_public"],
          relationships: [],
        },
      ],
    },
  ]

  const bestPractices = [
    {
      title: "UUID Primary Keys",
      description: "All tables use UUID for primary keys, providing better distribution and security",
      icon: "🔑",
    },
    {
      title: "Soft Deletes",
      description: "Tables include deleted_at timestamps for data retention and recovery",
      icon: "🗑️",
    },
    {
      title: "Audit Timestamps",
      description: "created_at and updated_at columns track record lifecycle",
      icon: "⏰",
    },
    {
      title: "JSONB Metadata",
      description: "Flexible metadata columns allow extensibility without schema changes",
      icon: "📦",
    },
    {
      title: "Multi-Tenancy",
      description: "Organization-based isolation with proper foreign key relationships",
      icon: "🏢",
    },
    {
      title: "RBAC Implementation",
      description: "Comprehensive role-based access control with permissions JSONB",
      icon: "🛡️",
    },
    {
      title: "Stripe Integration",
      description: "Full billing integration with Stripe IDs for synchronization",
      icon: "💳",
    },
    {
      title: "Analytics Ready",
      description: "Comprehensive event tracking and daily aggregation tables",
      icon: "📊",
    },
  ]

  const relationships = [
    {
      from: "users",
      to: "organizations",
      via: "organization_members",
      type: "Many-to-Many",
      description: "Users can belong to multiple organizations with different roles",
    },
    {
      from: "organizations",
      to: "subscriptions",
      via: "Direct FK",
      type: "One-to-One",
      description: "Each organization has one active subscription",
    },
    {
      from: "users",
      to: "subscriptions",
      via: "Direct FK",
      type: "One-to-Many",
      description: "Users can have multiple subscriptions (personal + org)",
    },
    {
      from: "subscriptions",
      to: "invoices",
      via: "Direct FK",
      type: "One-to-Many",
      description: "Subscriptions generate multiple invoices over time",
    },
    {
      from: "users",
      to: "roles",
      via: "user_roles",
      type: "Many-to-Many",
      description: "Users can have multiple roles with expiration dates",
    },
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Database Schema Documentation</h1>
              <p className="text-muted-foreground text-lg">
                Comprehensive SaaS database design with 48 tables across 8 domains
              </p>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">48</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Schema Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Database Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">PostgreSQL</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Supabase + Neon</div>
            </CardContent>
          </Card>
        </div>

        {/* Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle>Schema Best Practices</CardTitle>
            <CardDescription>Design patterns and conventions used throughout the schema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {bestPractices.map((practice) => (
                <div key={practice.title} className="flex gap-3 p-4 border rounded-lg">
                  <div className="text-2xl">{practice.icon}</div>
                  <div>
                    <div className="font-semibold text-sm">{practice.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{practice.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schema Categories */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-2">
            <TabsTrigger value="all">All Tables</TabsTrigger>
            {schemaCategories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                <category.icon className="h-4 w-4 mr-2" />
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {schemaCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color} text-white`}>
                      <category.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      <CardDescription>{category.tables.length} tables</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.tables.map((table) => (
                      <div key={table.name} className="border rounded-lg p-4 space-y-3">
                        <div>
                          <div className="font-mono font-semibold text-sm">{table.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{table.description}</div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground">Key Columns:</div>
                          <div className="flex flex-wrap gap-1">
                            {table.columns.slice(0, 6).map((col) => (
                              <Badge key={col} variant="secondary" className="text-xs font-mono">
                                {col}
                              </Badge>
                            ))}
                            {table.columns.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{table.columns.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        {table.relationships.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-muted-foreground">Relationships:</div>
                            <div className="flex flex-wrap gap-1">
                              {table.relationships.map((rel) => (
                                <Badge key={rel} variant="outline" className="text-xs font-mono">
                                  {rel}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {schemaCategories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color} text-white`}>
                      <category.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      <CardDescription>{category.tables.length} tables in this category</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.tables.map((table) => (
                      <div key={table.name} className="border rounded-lg p-4 space-y-3">
                        <div>
                          <div className="font-mono font-semibold">{table.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">{table.description}</div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-muted-foreground">Columns:</div>
                          <div className="flex flex-wrap gap-1">
                            {table.columns.map((col) => (
                              <Badge key={col} variant="secondary" className="font-mono">
                                {col}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {table.relationships.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-muted-foreground">Relationships:</div>
                            <div className="flex flex-wrap gap-1">
                              {table.relationships.map((rel) => (
                                <Badge key={rel} variant="outline" className="font-mono">
                                  {rel}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Key Relationships */}
        <Card>
          <CardHeader>
            <CardTitle>Key Relationships</CardTitle>
            <CardDescription>Important foreign key relationships and data flow patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relationships.map((rel, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <Badge variant="outline">{rel.from}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="outline">{rel.to}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">{rel.description}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge>{rel.type}</Badge>
                    <span className="text-xs text-muted-foreground">via {rel.via}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schema Diagram Note */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Visual Schema Diagram</CardTitle>
            <CardDescription>For a complete visual representation of the database schema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">To generate a visual ER diagram of this schema, you can use tools like:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Supabase Dashboard:</strong> Built-in schema visualizer in the Table Editor
              </li>
              <li>
                <strong>dbdiagram.io:</strong> Create diagrams from SQL or DBML syntax
              </li>
              <li>
                <strong>DBeaver:</strong> Desktop tool with ER diagram generation
              </li>
              <li>
                <strong>pgAdmin:</strong> PostgreSQL administration tool with schema visualization
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
