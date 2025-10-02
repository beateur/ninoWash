-- Multi-Tenancy Performance Indexes (Fixed Version)
-- These indexes optimize queries filtering by organization, workspace, and team

CREATE INDEX IF NOT EXISTS idx_org_members_org_user 
  ON organization_members(organization_id, user_id) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_org_members_user 
  ON organization_members(user_id) 
  WHERE is_active = true;

-- Removed deleted_at filter - workspaces table has archived_at instead
CREATE INDEX IF NOT EXISTS idx_workspaces_org 
  ON workspaces(organization_id) 
  WHERE archived_at IS NULL;

-- Removed deleted_at filter - teams table has archived_at instead
CREATE INDEX IF NOT EXISTS idx_teams_org 
  ON teams(organization_id) 
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace 
  ON workspace_members(workspace_id) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_team_members_team 
  ON team_members(team_id) 
  WHERE is_active = true;

-- User & Authentication Indexes
-- Removed deleted_at filter - users table has deleted_at but it's timestamp without time zone
CREATE INDEX IF NOT EXISTS idx_users_email 
  ON users(email) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_sessions_user 
  ON user_sessions(user_id, last_activity_at DESC) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_sessions_token 
  ON user_sessions(session_token) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_roles_user 
  ON user_roles(user_id) 
  WHERE is_active = true;

-- Subscription & Billing Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
  ON subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe 
  ON subscriptions(stripe_subscription_id) 
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end 
  ON subscriptions(current_period_end) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_invoices_user 
  ON invoices(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_subscription 
  ON invoices(subscription_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user 
  ON payment_transactions(user_id, created_at DESC);

-- Analytics & Events Indexes
CREATE INDEX IF NOT EXISTS idx_events_org_timestamp 
  ON events(organization_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_events_user_timestamp 
  ON events(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_events_session 
  ON events(session_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_events_name_timestamp 
  ON events(event_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_session 
  ON page_views(session_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_page_views_org 
  ON page_views(organization_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_feature_usage_org_date 
  ON feature_usage(organization_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user_date 
  ON feature_usage(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_user_engagement_user_date 
  ON user_engagement_daily(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_org_metrics_org_date 
  ON organization_metrics_daily(organization_id, date DESC);

-- Audit & Activity Indexes
CREATE INDEX IF NOT EXISTS idx_activities_org_timestamp 
  ON activities(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activities_user_timestamp 
  ON activities(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activities_entity 
  ON activities(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_org_timestamp 
  ON error_logs(organization_id, timestamp DESC) 
  WHERE resolved = false;

-- Business Operations Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user 
  ON bookings(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_status 
  ON bookings(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_items_booking 
  ON booking_items(booking_id);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_driver 
  ON delivery_assignments(driver_id, assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_booking 
  ON delivery_assignments(booking_id);

-- Invitation Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_token 
  ON invitations(token) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_invitations_email 
  ON invitations(invitee_email) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_invitations_org 
  ON invitations(organization_id, created_at DESC);

COMMENT ON INDEX idx_org_members_org_user IS 'Optimizes organization member lookups';
COMMENT ON INDEX idx_events_org_timestamp IS 'Optimizes analytics queries by organization';
COMMENT ON INDEX idx_subscriptions_period_end IS 'Optimizes subscription renewal queries';
