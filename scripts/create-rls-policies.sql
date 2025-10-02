-- Row Level Security (RLS) Policies for Multi-Tenant Data Isolation
-- These policies ensure users can only access data within their organizations

-- Enable RLS on all multi-tenant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see organizations they're members of
CREATE POLICY org_member_access ON organizations
  FOR ALL
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Organization Members: Users can see members of their organizations
CREATE POLICY org_members_access ON organization_members
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Workspaces: Users can only see workspaces in their organizations
CREATE POLICY workspace_access ON workspaces
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    AND deleted_at IS NULL
  );

-- Workspace Members: Users can see members of accessible workspaces
CREATE POLICY workspace_members_access ON workspace_members
  FOR ALL
  USING (
    workspace_id IN (
      SELECT id 
      FROM workspaces 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() 
          AND is_active = true
      )
      AND deleted_at IS NULL
    )
  );

-- Teams: Users can only see teams in their organizations
CREATE POLICY team_access ON teams
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    AND archived_at IS NULL
  );

-- Team Members: Users can see members of accessible teams
CREATE POLICY team_members_access ON team_members
  FOR ALL
  USING (
    team_id IN (
      SELECT id 
      FROM teams 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() 
          AND is_active = true
      )
    )
  );

-- Activities: Users can only see activities in their organizations
CREATE POLICY activities_access ON activities
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Activities: Users can insert activities for their organizations
CREATE POLICY activities_insert ON activities
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Events: Users can only see events in their organizations
CREATE POLICY events_access ON events
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Events: Users can insert events for their organizations
CREATE POLICY events_insert ON events
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Page Views: Users can only see page views in their organizations
CREATE POLICY page_views_access ON page_views
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Feature Usage: Users can only see feature usage in their organizations
CREATE POLICY feature_usage_access ON feature_usage
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

COMMENT ON POLICY org_member_access ON organizations IS 'Users can only access organizations they are members of';
COMMENT ON POLICY activities_access ON activities IS 'Users can only view activities within their organizations';
