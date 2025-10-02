-- Row Level Security (RLS) Policies for Supabase
-- These policies ensure users can only access data they're authorized to see

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Users: Can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- User Profiles: Can only see their own profile
CREATE POLICY "Users can view own profile details" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile details" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Organizations: Can only see organizations they're a member of
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
    )
  );

-- Organization Members: Can view members of their organizations
CREATE POLICY "Users can view organization members" ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.is_active = true
    )
  );

-- Teams: Can view teams in their organizations
CREATE POLICY "Users can view organization teams" ON teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = teams.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
    )
  );

-- Workspaces: Can view workspaces they're members of or in their organization
CREATE POLICY "Users can view accessible workspaces" ON workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = workspaces.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
    )
  );

-- Subscriptions: Can view own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Invoices: Can view own invoices
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

-- Activities: Can view activities in their organizations
CREATE POLICY "Users can view organization activities" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = activities.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
    )
  );

-- Events: Can view events in their organizations
CREATE POLICY "Users can view organization events" ON events
  FOR SELECT USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = events.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
    )
  );

-- Service account policies (for admin operations)
CREATE POLICY "Service role has full access" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON POLICY "Users can view own profile" ON users IS 'RLS: Users can only access their own user record';
COMMENT ON POLICY "Users can view their organizations" ON organizations IS 'RLS: Users can only see organizations they belong to';
