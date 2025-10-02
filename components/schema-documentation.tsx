"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const relationships = [
  {
    title: "Organization Hierarchy",
    description: "Multi-level tenant structure",
    relationships: [
      "organizations → organization_members (1:N)",
      "organizations → workspaces (1:N)",
      "organizations → teams (1:N)",
      "organizations → subscriptions (1:1)",
      "workspaces → workspace_members (1:N)",
      "teams → team_members (1:N)",
    ],
  },
  {
    title: "User Management",
    description: "User identity and access",
    relationships: [
      "users → user_profiles (1:1)",
      "users → user_sessions (1:N)",
      "users → user_roles (1:N)",
      "users → user_preferences (1:N)",
      "users → user_addresses (1:N)",
      "roles → user_roles (1:N)",
    ],
  },
  {
    title: "Subscription & Billing",
    description: "Payment and subscription flow",
    relationships: [
      "users → subscriptions (1:N)",
      "subscription_plans → subscriptions (1:N)",
      "subscriptions → invoices (1:N)",
      "invoices → invoice_line_items (1:N)",
      "users → payment_methods (1:N)",
      "payment_methods → payment_transactions (1:N)",
      "subscriptions → usage_records (1:N)",
    ],
  },
  {
    title: "Analytics & Events",
    description: "Tracking and metrics",
    relationships: [
      "users → events (1:N)",
      "organizations → events (1:N)",
      "users → page_views (1:N)",
      "users → feature_usage (1:N)",
      "users → user_engagement_daily (1:N)",
      "organizations → organization_metrics_daily (1:N)",
    ],
  },
  {
    title: "Business Operations",
    description: "Service delivery workflow",
    relationships: [
      "services → bookings (1:N)",
      "users → bookings (1:N)",
      "bookings → booking_items (1:N)",
      "bookings → delivery_assignments (1:N)",
      "delivery_drivers → delivery_assignments (1:N)",
      "users → loyalty_rewards (1:N)",
    ],
  },
]

const bestPractices = [
  {
    category: "Data Isolation",
    practices: [
      "Always filter by organization_id in multi-tenant queries",
      "Use Row Level Security (RLS) policies in Supabase",
      "Implement workspace_id and team_id filters where applicable",
      "Never expose data across organization boundaries",
    ],
  },
  {
    category: "Soft Deletes",
    practices: [
      "Check deleted_at IS NULL in all queries",
      "Use deleted_at = NOW() instead of DELETE",
      "Implement cascade soft deletes for related entities",
      "Schedule cleanup jobs for permanently removing old soft-deleted records",
    ],
  },
  {
    category: "Audit Logging",
    practices: [
      "Log all CREATE, UPDATE, DELETE operations to activities table",
      "Capture IP address and user agent for security",
      "Store before/after state in metadata JSONB column",
      "Implement automatic triggers for critical tables",
    ],
  },
  {
    category: "Performance",
    practices: [
      "Index foreign keys (organization_id, user_id, etc.)",
      "Use partial indexes for soft deletes: WHERE deleted_at IS NULL",
      "Partition large tables (events, page_views) by date",
      "Use materialized views for daily aggregates",
    ],
  },
  {
    category: "Security",
    practices: [
      "Implement RLS policies for all user-facing tables",
      "Use prepared statements to prevent SQL injection",
      "Encrypt sensitive data (payment info, PII)",
      "Regularly rotate API keys and tokens",
    ],
  },
]

const commonQueries = [
  {
    title: "Get User with Organization",
    sql: `SELECT u.*, o.name as org_name, om.role
FROM users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
WHERE u.id = $1 
  AND u.deleted_at IS NULL 
  AND o.deleted_at IS NULL
  AND om.is_active = true;`,
  },
  {
    title: "Get Active Subscription",
    sql: `SELECT s.*, sp.name as plan_name, sp.features
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.user_id = $1 
  AND s.status = 'active'
  AND s.current_period_end > NOW();`,
  },
  {
    title: "Log Activity",
    sql: `INSERT INTO activities (
  organization_id, user_id, entity_type, entity_id,
  action, description, metadata, ip_address, user_agent
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9
);`,
  },
  {
    title: "Get Organization Metrics",
    sql: `SELECT 
  date,
  active_users,
  new_users,
  total_sessions,
  total_events,
  revenue_generated
FROM organization_metrics_daily
WHERE organization_id = $1
  AND date >= $2
  AND date <= $3
ORDER BY date DESC;`,
  },
]

export function SchemaDocumentation() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relationships & Best Practices</CardTitle>
          <CardDescription>Understanding table relationships and implementation guidelines</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="relationships">
              <AccordionTrigger>Table Relationships</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {relationships.map((group) => (
                    <div key={group.title} className="border-l-2 border-primary pl-4">
                      <h4 className="font-semibold mb-1">{group.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                      <ul className="space-y-1">
                        {group.relationships.map((rel, idx) => (
                          <li key={idx} className="text-sm font-mono">
                            {rel}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="best-practices">
              <AccordionTrigger>Best Practices</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {bestPractices.map((category) => (
                    <div key={category.category} className="border-l-2 border-green-500 pl-4">
                      <h4 className="font-semibold mb-2">{category.category}</h4>
                      <ul className="space-y-2">
                        {category.practices.map((practice, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>{practice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="common-queries">
              <AccordionTrigger>Common SQL Queries</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {commonQueries.map((query) => (
                    <div key={query.title} className="space-y-2">
                      <h4 className="font-semibold text-sm">{query.title}</h4>
                      <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
                        <code>{query.sql}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="indexes">
              <AccordionTrigger>Recommended Indexes</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Multi-Tenancy Indexes</h4>
                    <pre className="bg-muted p-3 rounded-lg text-xs">
                      {`CREATE INDEX idx_org_members_org_user ON organization_members(organization_id, user_id);
CREATE INDEX idx_workspaces_org ON workspaces(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_teams_org ON teams(organization_id) WHERE deleted_at IS NULL;`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2">Analytics Indexes</h4>
                    <pre className="bg-muted p-3 rounded-lg text-xs">
                      {`CREATE INDEX idx_events_org_timestamp ON events(organization_id, timestamp DESC);
CREATE INDEX idx_events_user_timestamp ON events(user_id, timestamp DESC);
CREATE INDEX idx_page_views_session ON page_views(session_id, timestamp);`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2">Subscription Indexes</h4>
                    <pre className="bg-muted p-3 rounded-lg text-xs">
                      {`CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end) 
  WHERE status = 'active';`}
                    </pre>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schema Statistics</CardTitle>
          <CardDescription>Current database metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold">48</div>
              <div className="text-sm text-muted-foreground">Total Tables</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold">8</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-muted-foreground">Tenant Levels</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold">11</div>
              <div className="text-sm text-muted-foreground">Analytics Tables</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
