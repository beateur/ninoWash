-- ============================================================================
-- Add Missing Foreign Key Constraints
-- ============================================================================
-- This script adds foreign key constraints to ensure referential integrity
-- Run this script after reviewing the schema documentation
-- ============================================================================

-- User Relationships
-- ============================================================================

ALTER TABLE user_profiles 
  ADD CONSTRAINT fk_user_profiles_user 
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_sessions 
  ADD CONSTRAINT fk_user_sessions_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_addresses 
  ADD CONSTRAINT fk_user_addresses_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_preferences 
  ADD CONSTRAINT fk_user_preferences_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- RBAC Relationships
-- ============================================================================

ALTER TABLE user_roles 
  ADD CONSTRAINT fk_user_roles_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_roles 
  ADD CONSTRAINT fk_user_roles_role 
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

ALTER TABLE role_permissions 
  ADD CONSTRAINT fk_role_permissions_role 
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

ALTER TABLE role_permissions 
  ADD CONSTRAINT fk_role_permissions_permission 
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;

-- Organization Relationships
-- ============================================================================

ALTER TABLE organization_members 
  ADD CONSTRAINT fk_org_members_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_members 
  ADD CONSTRAINT fk_org_members_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE organization_members 
  ADD CONSTRAINT fk_org_members_invited_by 
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE organization_metrics_daily 
  ADD CONSTRAINT fk_org_metrics_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Team Relationships
-- ============================================================================

ALTER TABLE teams 
  ADD CONSTRAINT fk_teams_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE teams 
  ADD CONSTRAINT fk_teams_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE team_members 
  ADD CONSTRAINT fk_team_members_team 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE team_members 
  ADD CONSTRAINT fk_team_members_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE team_members 
  ADD CONSTRAINT fk_team_members_added_by 
  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL;

-- Workspace Relationships
-- ============================================================================

ALTER TABLE workspaces 
  ADD CONSTRAINT fk_workspaces_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE workspaces 
  ADD CONSTRAINT fk_workspaces_team 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE workspaces 
  ADD CONSTRAINT fk_workspaces_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE workspace_members 
  ADD CONSTRAINT fk_workspace_members_workspace 
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE workspace_members 
  ADD CONSTRAINT fk_workspace_members_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE workspace_members 
  ADD CONSTRAINT fk_workspace_members_added_by 
  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL;

-- Subscription & Billing Relationships
-- ============================================================================

ALTER TABLE subscriptions 
  ADD CONSTRAINT fk_subscriptions_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE subscriptions 
  ADD CONSTRAINT fk_subscriptions_plan 
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT;

ALTER TABLE subscriptions 
  ADD CONSTRAINT fk_subscriptions_payment_method 
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;

ALTER TABLE invoices 
  ADD CONSTRAINT fk_invoices_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE invoices 
  ADD CONSTRAINT fk_invoices_subscription 
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

ALTER TABLE invoice_line_items 
  ADD CONSTRAINT fk_invoice_line_items_invoice 
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

ALTER TABLE invoice_line_items 
  ADD CONSTRAINT fk_invoice_line_items_subscription 
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

ALTER TABLE invoice_line_items 
  ADD CONSTRAINT fk_invoice_line_items_plan 
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;

ALTER TABLE payment_methods 
  ADD CONSTRAINT fk_payment_methods_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE payment_transactions 
  ADD CONSTRAINT fk_payment_transactions_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE payment_transactions 
  ADD CONSTRAINT fk_payment_transactions_subscription 
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

ALTER TABLE payment_transactions 
  ADD CONSTRAINT fk_payment_transactions_invoice 
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

ALTER TABLE payment_transactions 
  ADD CONSTRAINT fk_payment_transactions_payment_method 
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;

ALTER TABLE coupon_redemptions 
  ADD CONSTRAINT fk_coupon_redemptions_coupon 
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE;

ALTER TABLE coupon_redemptions 
  ADD CONSTRAINT fk_coupon_redemptions_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE coupon_redemptions 
  ADD CONSTRAINT fk_coupon_redemptions_subscription 
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

ALTER TABLE usage_records 
  ADD CONSTRAINT fk_usage_records_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE usage_records 
  ADD CONSTRAINT fk_usage_records_subscription 
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;

-- Analytics & Monitoring Relationships
-- ============================================================================

ALTER TABLE events 
  ADD CONSTRAINT fk_events_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE events 
  ADD CONSTRAINT fk_events_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE page_views 
  ADD CONSTRAINT fk_page_views_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE page_views 
  ADD CONSTRAINT fk_page_views_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE user_engagement_daily 
  ADD CONSTRAINT fk_user_engagement_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_engagement_daily 
  ADD CONSTRAINT fk_user_engagement_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE feature_usage 
  ADD CONSTRAINT fk_feature_usage_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE feature_usage 
  ADD CONSTRAINT fk_feature_usage_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE performance_metrics 
  ADD CONSTRAINT fk_performance_metrics_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE performance_metrics 
  ADD CONSTRAINT fk_performance_metrics_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE error_logs 
  ADD CONSTRAINT fk_error_logs_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE error_logs 
  ADD CONSTRAINT fk_error_logs_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE error_logs 
  ADD CONSTRAINT fk_error_logs_resolved_by 
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE activities 
  ADD CONSTRAINT fk_activities_actor 
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE activities 
  ADD CONSTRAINT fk_activities_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE activities 
  ADD CONSTRAINT fk_activities_team 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE activities 
  ADD CONSTRAINT fk_activities_workspace 
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

-- Business Logic Relationships
-- ============================================================================

ALTER TABLE bookings 
  ADD CONSTRAINT fk_bookings_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE bookings 
  ADD CONSTRAINT fk_bookings_service 
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT;

ALTER TABLE bookings 
  ADD CONSTRAINT fk_bookings_pickup_address 
  FOREIGN KEY (pickup_address_id) REFERENCES user_addresses(id) ON DELETE SET NULL;

ALTER TABLE bookings 
  ADD CONSTRAINT fk_bookings_delivery_address 
  FOREIGN KEY (delivery_address_id) REFERENCES user_addresses(id) ON DELETE SET NULL;

ALTER TABLE booking_items 
  ADD CONSTRAINT fk_booking_items_booking 
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE booking_items 
  ADD CONSTRAINT fk_booking_items_service 
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT;

ALTER TABLE service_service_options 
  ADD CONSTRAINT fk_service_options_service 
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;

ALTER TABLE service_service_options 
  ADD CONSTRAINT fk_service_options_option 
  FOREIGN KEY (service_option_id) REFERENCES service_options(id) ON DELETE CASCADE;

ALTER TABLE delivery_drivers 
  ADD CONSTRAINT fk_delivery_drivers_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE delivery_assignments 
  ADD CONSTRAINT fk_delivery_assignments_booking 
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;

ALTER TABLE delivery_assignments 
  ADD CONSTRAINT fk_delivery_assignments_driver 
  FOREIGN KEY (driver_id) REFERENCES delivery_drivers(id) ON DELETE CASCADE;

ALTER TABLE loyalty_rewards 
  ADD CONSTRAINT fk_loyalty_rewards_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE loyalty_rewards 
  ADD CONSTRAINT fk_loyalty_rewards_booking 
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

-- System Features Relationships
-- ============================================================================

ALTER TABLE invitations 
  ADD CONSTRAINT fk_invitations_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE invitations 
  ADD CONSTRAINT fk_invitations_team 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE invitations 
  ADD CONSTRAINT fk_invitations_workspace 
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE invitations 
  ADD CONSTRAINT fk_invitations_inviter 
  FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE invitations 
  ADD CONSTRAINT fk_invitations_invitee_user 
  FOREIGN KEY (invitee_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE notifications 
  ADD CONSTRAINT fk_notifications_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications 
  ADD CONSTRAINT fk_notifications_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE notification_preferences 
  ADD CONSTRAINT fk_notification_preferences_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE email_queue 
  ADD CONSTRAINT fk_email_queue_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE api_keys 
  ADD CONSTRAINT fk_api_keys_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE api_keys 
  ADD CONSTRAINT fk_api_keys_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE api_keys 
  ADD CONSTRAINT fk_api_keys_revoked_by 
  FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE api_key_usage 
  ADD CONSTRAINT fk_api_key_usage_api_key 
  FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE;

ALTER TABLE webhooks 
  ADD CONSTRAINT fk_webhooks_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE webhooks 
  ADD CONSTRAINT fk_webhooks_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE webhook_deliveries 
  ADD CONSTRAINT fk_webhook_deliveries_webhook 
  FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE;

ALTER TABLE experiments 
  ADD CONSTRAINT fk_experiments_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE experiment_assignments 
  ADD CONSTRAINT fk_experiment_assignments_experiment 
  FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE;

ALTER TABLE experiment_assignments 
  ADD CONSTRAINT fk_experiment_assignments_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE conversion_funnels 
  ADD CONSTRAINT fk_conversion_funnels_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE conversion_funnel_events 
  ADD CONSTRAINT fk_conversion_funnel_events_funnel 
  FOREIGN KEY (funnel_id) REFERENCES conversion_funnels(id) ON DELETE CASCADE;

ALTER TABLE conversion_funnel_events 
  ADD CONSTRAINT fk_conversion_funnel_events_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE conversion_funnel_events 
  ADD CONSTRAINT fk_conversion_funnel_events_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

ALTER TABLE system_settings 
  ADD CONSTRAINT fk_system_settings_updated_by 
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- Constraints Added Successfully
-- ============================================================================
