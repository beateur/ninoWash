-- Sprint P1: Enhanced Multi-Tenancy (Organizations, Workspaces, Teams)
-- This script adds missing constraints and indexes to existing multi-tenancy tables

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_id ON organizations(subscription_id);

-- Organization members indexes
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_organization_members_is_active ON organization_members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_organization_members_org_user ON organization_members(organization_id, user_id);

-- Workspaces indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_organization_id ON workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_by ON workspaces(created_by);
CREATE INDEX IF NOT EXISTS idx_workspaces_team_id ON workspaces(team_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_visibility ON workspaces(visibility);

-- Workspace members indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_is_active ON workspace_members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_user ON workspace_members(workspace_id, user_id);

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_organization_id ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_teams_is_active ON teams(is_active) WHERE is_active = true;

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON team_members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON team_members(team_id, user_id);

-- Add constraints for data integrity
ALTER TABLE organizations
  ADD CONSTRAINT IF NOT EXISTS chk_organizations_slug_format
  CHECK (slug ~* '^[a-z0-9-]+$');

ALTER TABLE workspaces
  ADD CONSTRAINT IF NOT EXISTS chk_workspaces_slug_format
  CHECK (slug ~* '^[a-z0-9-]+$');

ALTER TABLE workspaces
  ADD CONSTRAINT IF NOT EXISTS chk_workspaces_visibility
  CHECK (visibility IN ('private', 'organization', 'public'));

ALTER TABLE organization_members
  ADD CONSTRAINT IF NOT EXISTS chk_organization_members_role
  CHECK (role IN ('owner', 'admin', 'member', 'guest'));

ALTER TABLE workspace_members
  ADD CONSTRAINT IF NOT EXISTS chk_workspace_members_role
  CHECK (role IN ('owner', 'admin', 'editor', 'viewer'));

ALTER TABLE team_members
  ADD CONSTRAINT IF NOT EXISTS chk_team_members_role
  CHECK (role IN ('lead', 'member', 'contributor'));

-- Ensure unique constraints
ALTER TABLE organizations
  ADD CONSTRAINT IF NOT EXISTS uq_organizations_slug UNIQUE (slug);

ALTER TABLE workspaces
  ADD CONSTRAINT IF NOT EXISTS uq_workspaces_org_slug UNIQUE (organization_id, slug);

ALTER TABLE organization_members
  ADD CONSTRAINT IF NOT EXISTS uq_organization_members_org_user UNIQUE (organization_id, user_id);

ALTER TABLE workspace_members
  ADD CONSTRAINT IF NOT EXISTS uq_workspace_members_workspace_user UNIQUE (workspace_id, user_id);

ALTER TABLE team_members
  ADD CONSTRAINT IF NOT EXISTS uq_team_members_team_user UNIQUE (team_id, user_id);
