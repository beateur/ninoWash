import { neon } from "@neondatabase/serverless"

// Create a singleton SQL client
const sql = neon(process.env.NEON_NEON_DATABASE_URL!)

export { sql }

// Type-safe query helpers
export async function queryOne<T>(query: string, params: any[] = []): Promise<T | null> {
  const results = await sql(query, params)
  return results[0] as T | null
}

export async function queryMany<T>(query: string, params: any[] = []): Promise<T[]> {
  const results = await sql(query, params)
  return results as T[]
}

// Common query patterns
export const queries = {
  // Get user with organization
  async getUserWithOrg(userId: string) {
    return queryOne<{
      id: string
      email: string
      first_name: string
      last_name: string
      org_id: string
      org_name: string
      role: string
    }>(
      `SELECT 
        u.id, u.email, u.first_name, u.last_name,
        o.id as org_id, o.name as org_name, om.role
      FROM users u
      JOIN organization_members om ON u.id = om.user_id
      JOIN organizations o ON om.organization_id = o.id
      WHERE u.id = $1 
        AND u.deleted_at IS NULL 
        AND o.deleted_at IS NULL
        AND om.is_active = true
      LIMIT 1`,
      [userId],
    )
  },

  // Get active subscription
  async getActiveSubscription(userId: string) {
    return queryOne<{
      id: string
      status: string
      plan_name: string
      features: any
      current_period_end: Date
    }>(
      `SELECT 
        s.id, s.status, s.current_period_end,
        sp.name as plan_name, sp.features
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.user_id = $1 
        AND s.status = 'active'
        AND s.current_period_end > NOW()
      LIMIT 1`,
      [userId],
    )
  },

  // Log activity
  async logActivity(data: {
    organizationId: string
    userId: string
    entityType: string
    entityId: string
    action: string
    description: string
    metadata?: any
    ipAddress?: string
    userAgent?: string
  }) {
    return queryOne(
      `INSERT INTO activities (
        organization_id, actor_id, entity_type, entity_id,
        action, description, metadata, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        data.organizationId,
        data.userId,
        data.entityType,
        data.entityId,
        data.action,
        data.description,
        data.metadata || {},
        data.ipAddress,
        data.userAgent,
      ],
    )
  },

  // Get organization metrics
  async getOrgMetrics(organizationId: string, startDate: Date, endDate: Date) {
    return queryMany<{
      date: Date
      active_users: number
      new_users: number
      total_sessions: number
      total_events: number
      revenue_generated: number
    }>(
      `SELECT 
        date, active_users, new_users, total_sessions,
        total_events, revenue_generated
      FROM organization_metrics_daily
      WHERE organization_id = $1
        AND date >= $2
        AND date <= $3
      ORDER BY date DESC`,
      [organizationId, startDate, endDate],
    )
  },
}
