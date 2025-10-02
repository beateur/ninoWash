"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Building2, CreditCard, Shield, Activity, Database, BarChart3, Settings, Package } from "lucide-react"

export default function SchemaDocs() {
  const [selectedCategory, setSelectedCategory] = useState("overview")

  const categories = [
    {
      id: "overview",
      name: "Overview",
      icon: Database,
      description: "Complete database architecture overview",
    },
    {
      id: "auth",
      name: "Authentication",
      icon: Shield,
      description: "User authentication and authorization",
      tables: ["users", "user_profiles", "user_sessions", "user_roles", "roles"],
    },
    {
      id: "multi-tenancy",
      name: "Multi-Tenancy",
      icon: Building2,
      description: "Organizations, teams, and workspaces",
      tables: [
        "organizations",
        "organization_members",
        "teams",
        "team_members",
        "workspaces",
        "workspace_members",
        "invitations",
      ],
    },
    {
      id: "billing",
      name: "Billing & Subscriptions",
      icon: CreditCard,
      description: "Subscription management and payments",
      tables: [
        "subscription_plans",
        "subscriptions",
        "invoices",
        "invoice_line_items",
        "payment_methods",
        "payment_transactions",
        "coupons",
        "coupon_redemptions",
        "usage_records",
      ],
    },
    {
      id: "analytics",
      name: "Analytics & Tracking",
      icon: BarChart3,
      description: "User behavior and performance tracking",
      tables: [
        "events",
        "page_views",
        "user_sessions",
        "feature_usage",
        "user_engagement_daily",
        "organization_metrics_daily",
        "performance_metrics",
        "conversion_funnels",
        "conversion_funnel_events",
        "experiments",
        "experiment_assignments",
      ],
    },
    {
      id: "audit",
      name: "Audit & Logging",
      icon: Activity,
      description: "Activity tracking and error logging",
      tables: ["activities", "error_logs"],
    },
    {
      id: "business",
      name: "Business Logic",
      icon: Package,
      description: "Service-specific tables",
      tables: [
        "services",
        "service_categories",
        "service_options",
        "service_service_options",
        "bookings",
        "booking_items",
        "user_addresses",
        "delivery_drivers",
        "delivery_assignments",
        "loyalty_rewards",
      ],
    },
    {
      id: "system",
      name: "System",
      icon: Settings,
      description: "System configuration and preferences",
      tables: ["system_settings", "user_preferences"],
    },
  ]

  const schemaDetails = {
    users: {
      purpose: "Core user authentication and basic profile information",
      keyFields: ["id", "email", "password_hash", "auth_provider", "status"],
      relationships: [
        "Has one user_profiles",
        "Has many user_sessions",
        "Has many user_roles",
        "Belongs to many organizations through organization_members",
      ],
      indexes: ["email (unique)", "auth_provider_id"],
    },
    user_profiles: {
      purpose: "Extended user profile information and preferences",
      keyFields: ["id", "first_name", "last_name", "avatar_url", "timezone", "locale"],
      relationships: ["Belongs to users (id = user_profiles.id)"],
      indexes: ["id (primary key, references users)"],
    },
    user_sessions: {
      purpose: "Track active user sessions for security and analytics",
      keyFields: ["id", "user_id", "session_token", "expires_at", "ip_address"],
      relationships: ["Belongs to users"],
      indexes: ["user_id", "session_token (unique)", "expires_at"],
    },
    organizations: {
      purpose: "Top-level tenant entity for multi-tenancy",
      keyFields: ["id", "name", "slug", "subscription_id", "is_active"],
      relationships: ["Has many organization_members", "Has many teams", "Has many workspaces", "Has one subscription"],
      indexes: ["slug (unique)", "subscription_id"],
    },
    organization_members: {
      purpose: "User membership in organizations with roles and permissions",
      keyFields: ["id", "user_id", "organization_id", "role", "permissions"],
      relationships: ["Belongs to users", "Belongs to organizations"],
      indexes: ["user_id", "organization_id", "unique(user_id, organization_id)"],
    },
    teams: {
      purpose: "Sub-groups within organizations for collaboration",
      keyFields: ["id", "name", "organization_id", "privacy_level", "is_active"],
      relationships: ["Belongs to organizations", "Has many team_members", "Has many workspaces"],
      indexes: ["organization_id", "created_by"],
    },
    workspaces: {
      purpose: "Project or context-specific work areas",
      keyFields: ["id", "name", "organization_id", "team_id", "visibility"],
      relationships: ["Belongs to organizations", "Belongs to teams (optional)", "Has many workspace_members"],
      indexes: ["organization_id", "team_id", "slug"],
    },
    subscription_plans: {
      purpose: "Available subscription tiers and pricing",
      keyFields: ["id", "name", "price_amount", "billing_interval", "features"],
      relationships: ["Has many subscriptions"],
      indexes: ["is_active", "is_public"],
    },
    subscriptions: {
      purpose: "Active user or organization subscriptions",
      keyFields: ["id", "user_id", "plan_id", "status", "stripe_subscription_id"],
      relationships: ["Belongs to users", "Belongs to subscription_plans", "Has many invoices"],
      indexes: ["user_id", "plan_id", "stripe_subscription_id", "status"],
    },
    invoices: {
      purpose: "Billing invoices for subscriptions",
      keyFields: ["id", "user_id", "subscription_id", "total_amount", "status"],
      relationships: ["Belongs to users", "Belongs to subscriptions", "Has many invoice_line_items"],
      indexes: ["user_id", "subscription_id", "stripe_invoice_id", "status"],
    },
    roles: {
      purpose: "Define permission sets for RBAC",
      keyFields: ["id", "name", "permissions", "is_system_role"],
      relationships: ["Has many user_roles"],
      indexes: ["name (unique)", "is_system_role"],
    },
    activities: {
      purpose: "Audit log of user actions across the system",
      keyFields: ["id", "actor_id", "action", "entity_type", "entity_id", "organization_id"],
      relationships: ["Belongs to users (actor_id)", "Belongs to organizations"],
      indexes: ["actor_id", "organization_id", "entity_type", "created_at"],
    },
    events: {
      purpose: "Track user interactions and analytics events",
      keyFields: ["id", "user_id", "organization_id", "event_name", "properties"],
      relationships: ["Belongs to users", "Belongs to organizations", "Belongs to user_sessions"],
      indexes: ["user_id", "organization_id", "session_id", "timestamp", "event_name"],
    },
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Database Schema Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive overview of your SaaS application database architecture
          </p>
          <div className="flex gap-2 mt-4">
            <Badge variant="outline">48 Tables</Badge>
            <Badge variant="outline">PostgreSQL</Badge>
            <Badge variant="outline">Multi-Tenant</Badge>
            <Badge variant="outline">RBAC Enabled</Badge>
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 h-auto p-2">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex flex-col items-center gap-2 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{category.name}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Architecture Overview</CardTitle>
                <CardDescription>
                  Your database follows SaaS best practices with clear separation of concerns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {categories.slice(1).map((category) => {
                    const Icon = category.icon
                    return (
                      <Card key={category.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{category.name}</CardTitle>
                              <CardDescription className="text-sm">{category.description}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Tables ({category.tables?.length || 0}):</p>
                            <div className="flex flex-wrap gap-1">
                              {category.tables?.map((table) => (
                                <Badge key={table} variant="secondary" className="text-xs">
                                  {table}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle>Key Design Patterns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Multi-Tenancy Hierarchy
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Organizations → Teams → Workspaces with proper data isolation and member management
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Role-Based Access Control (RBAC)
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Flexible permission system with roles, user_roles, and permission JSONB fields for granular
                        control
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Stripe Integration
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Complete billing system with subscriptions, invoices, payment methods, and Stripe ID tracking
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Comprehensive Audit Trail
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Activities table tracks all user actions with actor, entity, and organization context
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Analytics & Metrics
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Events, page views, feature usage, and daily aggregations for user and organization metrics
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {categories.slice(1).map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      {category.tables?.map((tableName) => {
                        const details = schemaDetails[tableName as keyof typeof schemaDetails]
                        return (
                          <Card key={tableName} className="border-2">
                            <CardHeader>
                              <CardTitle className="text-lg font-mono">{tableName}</CardTitle>
                              {details && <CardDescription>{details.purpose}</CardDescription>}
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {details && (
                                <>
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2">Key Fields</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {details.keyFields.map((field) => (
                                        <Badge key={field} variant="outline" className="font-mono text-xs">
                                          {field}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2">Relationships</h4>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                      {details.relationships.map((rel, idx) => (
                                        <li key={idx}>• {rel}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2">Recommended Indexes</h4>
                                    <div className="flex flex-wrap gap-1">
                                      {details.indexes.map((index, idx) => (
                                        <Badge key={idx} variant="secondary" className="font-mono text-xs">
                                          {index}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Schema Recommendations</CardTitle>
            <CardDescription>Best practices for maintaining and scaling your database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">✅ Strengths</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Proper UUID usage for primary keys (better for distributed systems)</li>
                <li>• JSONB fields for flexible metadata and settings</li>
                <li>• Comprehensive timestamp tracking (created_at, updated_at, deleted_at)</li>
                <li>• Soft deletes implemented (deleted_at, archived_at)</li>
                <li>• Multi-level tenancy with proper isolation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">💡 Recommendations</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Add Row Level Security (RLS) policies for data isolation in Supabase</li>
                <li>• Create composite indexes on frequently queried combinations (user_id + organization_id)</li>
                <li>• Consider partitioning large tables (events, activities) by date</li>
                <li>• Add database triggers for automatic updated_at timestamps</li>
                <li>• Implement cascading deletes or restrict policies on foreign keys</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
