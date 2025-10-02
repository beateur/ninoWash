-- Database Triggers for automatic timestamp management and data integrity

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log activities automatically
CREATE OR REPLACE FUNCTION log_organization_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activities (
      actor_id,
      action,
      entity_type,
      entity_id,
      entity_name,
      organization_id,
      description
    ) VALUES (
      NEW.id,
      'organization.created',
      'organization',
      NEW.id,
      NEW.name,
      NEW.id,
      'Organization created'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO activities (
      actor_id,
      action,
      entity_type,
      entity_id,
      entity_name,
      organization_id,
      description
    ) VALUES (
      NEW.id,
      'organization.updated',
      'organization',
      NEW.id,
      NEW.name,
      NEW.id,
      'Organization updated'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_organization_activity
  AFTER INSERT OR UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION log_organization_changes();

-- Function to validate subscription status changes
CREATE OR REPLACE FUNCTION validate_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure valid status transitions
  IF OLD.status = 'active' AND NEW.status = 'trialing' THEN
    RAISE EXCEPTION 'Cannot change from active to trialing status';
  END IF;
  
  -- Update organization subscription_id when subscription becomes active
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    UPDATE organizations
    SET subscription_id = NEW.id
    WHERE id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = NEW.user_id AND is_active = true
      LIMIT 1
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_subscription_changes
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION validate_subscription_status();

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp on row modification';
COMMENT ON FUNCTION log_organization_changes() IS 'Automatically logs organization changes to activities table';
COMMENT ON FUNCTION validate_subscription_status() IS 'Validates subscription status transitions and updates organization';
