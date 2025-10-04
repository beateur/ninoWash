-- Sprint P4: Enhanced Audit Logging and Activity Tracking
-- This script adds missing constraints and indexes to existing audit tables

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_actor_id ON activities(actor_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity_type ON activities(entity_type);
CREATE INDEX IF NOT EXISTS idx_activities_entity_id ON activities(entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_organization_id ON activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_workspace_id ON activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activities_team_id ON activities(team_id);
CREATE INDEX IF NOT EXISTS idx_activities_action ON activities(action);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_actor_created ON activities(actor_id, created_at);

-- Error logs indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_organization_id ON error_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_session_id ON error_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_level ON error_logs(error_level);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_event_category ON events(event_category);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- Page views indexes
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_organization_id ON page_views(organization_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_url ON page_views(page_url);
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);

-- Feature usage indexes
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_organization_id ON feature_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_name ON feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_category ON feature_usage(feature_category);
CREATE INDEX IF NOT EXISTS idx_feature_usage_date ON feature_usage(date);
CREATE INDEX IF NOT EXISTS idx_feature_usage_timestamp ON feature_usage(timestamp);

-- User engagement daily indexes
CREATE INDEX IF NOT EXISTS idx_user_engagement_daily_user_id ON user_engagement_daily(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_daily_organization_id ON user_engagement_daily(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_daily_date ON user_engagement_daily(date);
CREATE INDEX IF NOT EXISTS idx_user_engagement_daily_user_date ON user_engagement_daily(user_id, date);

-- Organization metrics daily indexes
CREATE INDEX IF NOT EXISTS idx_organization_metrics_daily_organization_id ON organization_metrics_daily(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_metrics_daily_date ON organization_metrics_daily(date);
CREATE INDEX IF NOT EXISTS idx_organization_metrics_daily_org_date ON organization_metrics_daily(organization_id, date);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_organization_id ON performance_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- Add constraints using DO blocks
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_activities_action') THEN
    ALTER TABLE activities
      ADD CONSTRAINT chk_activities_action
      CHECK (action IN ('create', 'read', 'update', 'delete', 'login', 'logout', 'invite', 'accept', 'reject', 'archive', 'restore', 'export', 'import'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_error_logs_error_level') THEN
    ALTER TABLE error_logs
      ADD CONSTRAINT chk_error_logs_error_level
      CHECK (error_level IN ('debug', 'info', 'warning', 'error', 'critical'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_feature_usage_usage_type') THEN
    ALTER TABLE feature_usage
      ADD CONSTRAINT chk_feature_usage_usage_type
      CHECK (usage_type IN ('view', 'click', 'submit', 'download', 'upload', 'share', 'export', 'import'));
  END IF;
END $$;

-- Ensure unique constraints for daily aggregations
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_engagement_daily_user_date') THEN
    ALTER TABLE user_engagement_daily
      ADD CONSTRAINT uq_user_engagement_daily_user_date UNIQUE (user_id, date);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_organization_metrics_daily_org_date') THEN
    ALTER TABLE organization_metrics_daily
      ADD CONSTRAINT uq_organization_metrics_daily_org_date UNIQUE (organization_id, date);
  END IF;
END $$;
