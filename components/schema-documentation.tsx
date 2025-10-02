import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, Users, Building2, CreditCard, Key, Activity, Flag, BarChart3 } from "lucide-react"

const schemaCategories = [
  {
    icon: Users,
    title: "User Management",
    description: "Authentication, profiles, and user-related data",
    tables: [
      { name: "users", description: "Core user accounts with authentication details" },
      { name: "user_profiles", description: "Extended user profile information" },
      { name: "user_preferences", description: "User-specific settings and preferences" },
      { name: "user_sessions", description: "Active user sessions and device tracking" },
      { name: "user_addresses", description: "User delivery and billing addresses" },
      { name: "user_roles", description: "Role assignments for users" },
    ],
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  {
    icon: Building2,
    title: "Multi-Tenancy",
    description: "Organizations, teams, and workspace management",
    tables: [
      { name: "organizations", description: "Top-level tenant entities" },
      { name: "organization_members", description: "User membership in organizations" },
      { name: "teams", description: "Sub-groups within organizations" },
      { name: "team_members", description: "User membership in teams" },
      { name: "workspaces", description: "Project or environment containers" },
      { name: "workspace_members", description: "User access to workspaces" },
      { name: "invitations", description: "Pending invitations to join entities" },
    ],
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  {
    icon: CreditCard,
    title: "Billing & Subscriptions",
    description: "Stripe integration, plans, and payment processing",
    tables: [
      { name: "subscription_plans", description: "Available subscription tiers" },
      { name: "subscriptions", description: "Active user subscriptions" },
      { name: "invoices", description: "Billing invoices" },
      { name: "invoice_line_items", description: "Itemized invoice details" },
      { name: "payment_methods", description: "Stored payment methods" },
      { name: "payment_transactions", description: "Payment history and status" },
      { name: "coupons", description: "Discount codes and promotions" },
      { name: "coupon_redemptions", description: "Applied coupon usage" },
      { name: "usage_records", description: "Metered billing data" },
    ],
    color: "bg-green-500/10 text-green-700 dark:text-green-400",
  },
  {
    icon: Activity,
    title: "Analytics & Tracking",
    description: "Events, metrics, and user behavior",
    tables: [
      { name: "events", description: "General event tracking" },
      { name: "page_views", description: "Page view analytics" },
      { name: "user_sessions", description: "Session tracking and duration" },
      { name: "feature_usage", description: "Feature adoption metrics" },
      { name: "user_engagement_daily", description: "Daily user engagement aggregates" },
      { name: "organization_metrics_daily", description: "Daily organization metrics" },
      { name: "performance_metrics", description: "System performance data" },
    ],
    color: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
  {
    icon: Flag,
    title: "Experiments & Features",
    description: "A/B testing and feature flags",
    tables: [
      { name: "experiments", description: "A/B test configurations" },
      { name: "experiment_assignments", description: "User variant assignments" },
      { name: "conversion_funnels", description: "Funnel definitions" },
      { name: "conversion_funnel_events", description: "Funnel step tracking" },
    ],
    color: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  },
  {
    icon: Key,
    title: "Security & Audit",
    description: "Logging, roles, and permissions",
    tables: [
      { name: "activities", description: "Audit log of all actions" },
      { name: "error_logs", description: "Application error tracking" },
      { name: "roles", description: "Role definitions and permissions" },
    ],
    color: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  {
    icon: BarChart3,
    title: "Business Domain",
    description: "Application-specific business logic",
    tables: [
      { name: "bookings", description: "Service bookings" },
      { name: "booking_items", description: "Items within bookings" },
      { name: "services", description: "Available services" },
      { name: "service_categories", description: "Service categorization" },
      { name: "service_options", description: "Service add-ons" },
      { name: "delivery_drivers", description: "Driver management" },
      { name: "delivery_assignments", description: "Driver assignments" },
      { name: "loyalty_rewards", description: "Customer loyalty program" },
    ],
    color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  },
]

export function SchemaDocumentation() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Schema Overview
          </CardTitle>
          <CardDescription>Your database contains 48 tables organized into 7 functional categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="text-3xl font-bold">48</div>
              <div className="text-sm text-muted-foreground">Total Tables</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-3xl font-bold">7</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-3xl font-bold">✓</div>
              <div className="text-sm text-muted-foreground">Production Ready</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {schemaCategories.map((category) => {
          const Icon = category.icon
          return (
            <Card key={category.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {category.title}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.tables.map((table) => (
                    <div key={table.name} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="font-mono text-xs">
                        {table.name}
                      </Badge>
                      <span className="text-muted-foreground text-xs leading-relaxed">{table.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Key Design Patterns</CardTitle>
          <CardDescription>Important architectural decisions in your schema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge>Multi-Tenancy</Badge>
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Three-level hierarchy: Organizations → Teams → Workspaces. Each level has its own members table with
              role-based access control and permissions stored as JSONB.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge>Audit Trail</Badge>
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The activities table tracks all actions with actor_id, entity_type, entity_id, action, and metadata.
              Includes IP address and user agent for security.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge>Soft Deletes</Badge>
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Many tables include deleted_at timestamps for soft deletion, allowing data recovery and maintaining
              referential integrity.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge>Flexible Metadata</Badge>
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              JSONB metadata columns throughout allow for extensibility without schema migrations. Used for custom
              fields, integration data, and feature-specific attributes.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Badge>Time-Series Data</Badge>
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Daily aggregation tables (user_engagement_daily, organization_metrics_daily) for efficient analytics
              queries without scanning raw event data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
