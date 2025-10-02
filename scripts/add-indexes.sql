-- ============================================================================
-- Add Performance Indexes
-- ============================================================================
-- This script adds indexes to improve query performance
-- Run this script during off-peak hours for production databases
-- ============================================================================

-- User Authentication Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider, auth_provider_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id) WHERE is_active = true;

-- Multi-Tenancy Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_org_members_org_user ON organization_members(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_org_members_org_active ON organization_members(organization_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);

CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON team_members(team_id, user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_workspaces_org ON workspaces(organization_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_workspaces_team ON workspaces(team_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(organization_id, slug);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_user ON workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id) WHERE is_active = true;

-- Subscription & Billing Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active, is_public) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE status IN ('open', 'draft');

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_subscription ON invoice_line_items(subscription_id);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_valid ON coupons(valid_from, valid_until) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON coupon_redemptions(user_id);

CREATE INDEX IF NOT EXISTS idx_usage_records_subscription ON usage_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_user ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_period ON usage_records(billing_period_start, billing_period_end);

-- Analytics & Monitoring Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_events_user_timestamp ON events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_org_timestamp ON events(organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_name_timestamp ON events(event_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_user_timestamp ON page_views(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_org_timestamp ON page_views(organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_engagement_user_date ON user_engagement_daily(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_engagement_org_date ON user_engagement_daily(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_engagement_date ON user_engagement_daily(date DESC);

CREATE INDEX IF NOT EXISTS idx_org_metrics_org_date ON organization_metrics_daily(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_org_metrics_date ON organization_metrics_daily(date DESC);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user_timestamp ON feature_usage(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_org_timestamp ON feature_usage(organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_date ON feature_usage(feature_name, date DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_timestamp ON performance_metrics(metric_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_user_timestamp ON error_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_org_timestamp ON error_logs(organization_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level_timestamp ON error_logs(error_level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved) WHERE resolved = false;

CREATE INDEX IF NOT EXISTS idx_activities_actor_created ON activities(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_org_created ON activities(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);

-- Business Logic Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_date ON bookings(pickup_date);
CREATE INDEX IF NOT EXISTS idx_bookings_delivery_date ON bookings(delivery_date);
CREATE INDEX IF NOT EXISTS idx_bookings_number ON bookings(booking_number);

CREATE INDEX IF NOT EXISTS idx_booking_items_booking ON booking_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_items_service ON booking_items(service_id);

CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_services_code ON services(code);

CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(is_active, sort_order) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_service_options_active ON service_options(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON user_addresses(user_id, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_delivery_drivers_available ON delivery_drivers(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_user ON delivery_drivers(user_id);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_booking ON delivery_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_driver ON delivery_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON delivery_assignments(status);

CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_user ON loyalty_rewards(user_id);

-- System Features Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_team ON invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace ON invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority DESC, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_key_timestamp ON api_key_usage(api_key_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_timestamp ON api_key_usage(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_dates ON experiments(start_date, end_date) WHERE status = 'running';

CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment ON experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_user ON experiment_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_conversion_funnels_active ON conversion_funnels(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_conversion_funnel_events_funnel ON conversion_funnel_events(funnel_id);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_events_user ON conversion_funnel_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_events_timestamp ON conversion_funnel_events(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_system_settings_category_key ON system_settings(category, key);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_category ON user_preferences(user_id, category);

-- JSONB Indexes (GIN indexes for JSONB columns)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_preferences_gin ON users USING GIN (preferences);
CREATE INDEX IF NOT EXISTS idx_organizations_settings_gin ON organizations USING GIN (settings);
CREATE INDEX IF NOT EXISTS idx_events_properties_gin ON events USING GIN (properties);
CREATE INDEX IF NOT EXISTS idx_bookings_metadata_gin ON bookings USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_subscriptions_metadata_gin ON subscriptions USING GIN (metadata);

-- ============================================================================
-- Indexes Added Successfully
-- ============================================================================
