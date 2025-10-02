-- Performance Optimization: Add recommended indexes for frequently queried columns
-- Run this script to improve query performance across your database

-- Authentication & Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider, auth_provider_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active);

-- Multi-Tenancy
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON organization_members(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_active ON organization_members(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_team_members_team_active ON team_members(team_id, is_active);
CREATE INDEX IF NOT EXISTS idx_workspaces_org ON workspaces(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workspaces_team ON workspaces(team_id) WHERE deleted_at IS NULL;

-- Subscriptions & Billing
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Analytics & Events
CREATE INDEX IF NOT EXISTS idx_events_user_timestamp ON events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_org_timestamp ON events(organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_name_timestamp ON events(event_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user_timestamp ON page_views(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_date ON feature_usage(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_org_date ON feature_usage(organization_id, date DESC);

-- Audit & Activities
CREATE INDEX IF NOT EXISTS idx_activities_actor ON activities(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_org ON activities(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_org ON error_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved) WHERE resolved = false;

-- Business Logic (Bookings)
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(pickup_date, delivery_date);
CREATE INDEX IF NOT EXISTS idx_booking_items_booking ON booking_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_driver ON delivery_assignments(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_booking ON delivery_assignments(booking_id);

-- JSONB Indexes for frequently queried JSON fields
CREATE INDEX IF NOT EXISTS idx_events_properties_gin ON events USING gin(properties);
CREATE INDEX IF NOT EXISTS idx_organizations_settings_gin ON organizations USING gin(settings);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_features_gin ON subscription_plans USING gin(features);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_org_members_composite ON organization_members(organization_id, user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_events_composite ON events(organization_id, user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_composite ON activities(organization_id, actor_id, created_at DESC);

COMMENT ON INDEX idx_users_email IS 'Fast lookup for authentication';
COMMENT ON INDEX idx_events_properties_gin IS 'Enable fast queries on event properties JSONB field';
COMMENT ON INDEX idx_org_members_composite IS 'Optimize organization member queries with role filtering';
