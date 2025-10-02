-- Sprint P5: Enhanced System Settings
-- This script adds missing constraints and indexes to the system_settings table

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_is_public ON system_settings(is_public);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by ON system_settings(updated_by);

-- Add constraints using DO blocks
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_system_settings_key') THEN
    ALTER TABLE system_settings
      ADD CONSTRAINT uq_system_settings_key UNIQUE (key);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_system_settings_category') THEN
    ALTER TABLE system_settings
      ADD CONSTRAINT chk_system_settings_category
      CHECK (category IN ('general', 'security', 'billing', 'notifications', 'integrations', 'features', 'limits'));
  END IF;
END $$;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (key, value, category, description, is_public) VALUES
  ('app.name', '"Nino Wash"'::jsonb, 'general', 'Application name', true),
  ('app.version', '"1.0.0"'::jsonb, 'general', 'Application version', true),
  ('app.maintenance_mode', 'false'::jsonb, 'general', 'Maintenance mode enabled', false),
  ('security.password_min_length', '8'::jsonb, 'security', 'Minimum password length', false),
  ('security.session_timeout_minutes', '60'::jsonb, 'security', 'Session timeout in minutes', false),
  ('security.max_login_attempts', '5'::jsonb, 'security', 'Maximum login attempts before lockout', false),
  ('billing.currency', '"EUR"'::jsonb, 'billing', 'Default currency', false),
  ('billing.tax_rate', '0.20'::jsonb, 'billing', 'Default tax rate', false),
  ('notifications.email_enabled', 'true'::jsonb, 'notifications', 'Email notifications enabled', false),
  ('notifications.push_enabled', 'true'::jsonb, 'notifications', 'Push notifications enabled', false),
  ('limits.max_organizations_per_user', '5'::jsonb, 'limits', 'Maximum organizations per user', false),
  ('limits.max_workspaces_per_organization', '10'::jsonb, 'limits', 'Maximum workspaces per organization', false),
  ('limits.max_teams_per_organization', '20'::jsonb, 'limits', 'Maximum teams per organization', false),
  ('limits.max_members_per_organization', '100'::jsonb, 'limits', 'Maximum members per organization', false),
  ('features.api_keys_enabled', 'true'::jsonb, 'features', 'API keys feature enabled', false),
  ('features.webhooks_enabled', 'true'::jsonb, 'features', 'Webhooks feature enabled', false),
  ('features.analytics_enabled', 'true'::jsonb, 'features', 'Analytics feature enabled', false)
ON CONFLICT (key) DO NOTHING;
