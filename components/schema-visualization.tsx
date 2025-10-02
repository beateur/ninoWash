"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, Database } from "lucide-react"

const relationships = [
  {
    category: "User Relationships",
    connections: [
      { from: "users", to: "user_profiles", type: "one-to-one", key: "id" },
      { from: "users", to: "user_preferences", type: "one-to-many", key: "user_id" },
      { from: "users", to: "user_sessions", type: "one-to-many", key: "user_id" },
      { from: "users", to: "user_addresses", type: "one-to-many", key: "user_id" },
      { from: "users", to: "user_roles", type: "many-to-many", key: "user_id" },
    ],
  },
  {
    category: "Organization Hierarchy",
    connections: [
      { from: "organizations", to: "organization_members", type: "one-to-many", key: "organization_id" },
      { from: "organizations", to: "teams", type: "one-to-many", key: "organization_id" },
      { from: "organizations", to: "workspaces", type: "one-to-many", key: "organization_id" },
      { from: "teams", to: "team_members", type: "one-to-many", key: "team_id" },
      { from: "teams", to: "workspaces", type: "one-to-many", key: "team_id" },
      { from: "workspaces", to: "workspace_members", type: "one-to-many", key: "workspace_id" },
    ],
  },
  {
    category: "Subscription & Billing",
    connections: [
      { from: "users", to: "subscriptions", type: "one-to-many", key: "user_id" },
      { from: "subscription_plans", to: "subscriptions", type: "one-to-many", key: "plan_id" },
      { from: "subscriptions", to: "invoices", type: "one-to-many", key: "subscription_id" },
      { from: "invoices", to: "invoice_line_items", type: "one-to-many", key: "invoice_id" },
      { from: "subscriptions", to: "usage_records", type: "one-to-many", key: "subscription_id" },
      { from: "users", to: "payment_methods", type: "one-to-many", key: "user_id" },
      { from: "payment_methods", to: "payment_transactions", type: "one-to-many", key: "payment_method_id" },
    ],
  },
  {
    category: "Analytics & Events",
    connections: [
      { from: "users", to: "events", type: "one-to-many", key: "user_id" },
      { from: "organizations", to: "events", type: "one-to-many", key: "organization_id" },
      { from: "user_sessions", to: "events", type: "one-to-many", key: "session_id" },
      { from: "user_sessions", to: "page_views", type: "one-to-many", key: "session_id" },
      { from: "users", to: "user_engagement_daily", type: "one-to-many", key: "user_id" },
      { from: "organizations", to: "organization_metrics_daily", type: "one-to-many", key: "organization_id" },
    ],
  },
  {
    category: "Business Domain",
    connections: [
      { from: "users", to: "bookings", type: "one-to-many", key: "user_id" },
      { from: "services", to: "bookings", type: "one-to-many", key: "service_id" },
      { from: "bookings", to: "booking_items", type: "one-to-many", key: "booking_id" },
      { from: "bookings", to: "delivery_assignments", type: "one-to-many", key: "booking_id" },
      { from: "delivery_drivers", to: "delivery_assignments", type: "one-to-many", key: "driver_id" },
      { from: "services", to: "service_service_options", type: "one-to-many", key: "service_id" },
      { from: "service_options", to: "service_service_options", type: "one-to-many", key: "service_option_id" },
    ],
  },
]

const relationshipTypeColors = {
  "one-to-one": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  "one-to-many": "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  "many-to-many": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
}

export function SchemaVisualization() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Entity Relationships
          </CardTitle>
          <CardDescription>Visual representation of table relationships and foreign keys</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Badge className={relationshipTypeColors["one-to-one"]}>One-to-One</Badge>
            <Badge className={relationshipTypeColors["one-to-many"]}>One-to-Many</Badge>
            <Badge className={relationshipTypeColors["many-to-many"]}>Many-to-Many</Badge>
          </div>

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-8">
              {relationships.map((group) => (
                <div key={group.category} className="space-y-4">
                  <h3 className="text-lg font-semibold">{group.category}</h3>
                  <div className="space-y-2">
                    {group.connections.map((conn, idx) => (
                      <div
                        key={`${conn.from}-${conn.to}-${idx}`}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Badge variant="outline" className="font-mono text-xs">
                          {conn.from}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="font-mono text-xs">
                          {conn.to}
                        </Badge>
                        <Badge className={`ml-auto text-xs ${relationshipTypeColors[conn.type]}`}>{conn.type}</Badge>
                        <span className="text-xs text-muted-foreground font-mono">via {conn.key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Query Patterns</CardTitle>
          <CardDescription>Frequently used queries for your schema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Get user with full profile</h4>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
              <code>{`SELECT u.*, up.*
FROM users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.id = $1;`}</code>
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Get organization members with roles</h4>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
              <code>{`SELECT u.email, u.first_name, u.last_name, om.role, om.permissions
FROM organization_members om
JOIN users u ON om.user_id = u.id
WHERE om.organization_id = $1 AND om.is_active = true;`}</code>
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Get active subscription with plan details</h4>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
              <code>{`SELECT s.*, sp.name, sp.features, sp.price_amount
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.user_id = $1 AND s.status = 'active';`}</code>
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Get user engagement metrics</h4>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
              <code>{`SELECT date, session_count, page_views, features_used
FROM user_engagement_daily
WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
