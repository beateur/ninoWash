-- Team and Organization Schema for SaaS Application
-- Handles organizations, teams, workspaces, and collaborative features

-- Organizations (top-level entity for multi-tenant architecture)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE, -- URL-friendly identifier
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  billing_email TEXT,
  support_email TEXT,
  phone TEXT,
  address JSONB, -- structured address information
  tax_id TEXT, -- for billing purposes
  settings JSONB DEFAULT '{}', -- organization-wide settings
  subscription_id UUID REFERENCES public.subscriptions(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Organization members (users belonging to organizations)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  permissions JSONB DEFAULT '[]', -- additional permissions beyond role
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Teams within organizations
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1', -- hex color for team identification
  avatar_url TEXT,
  team_type TEXT DEFAULT 'general' CHECK (team_type IN ('general', 'project', 'department', 'temporary')),
  privacy_level TEXT DEFAULT 'private' CHECK (privacy_level IN ('public', 'private', 'secret')),
  settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member', 'contributor')),
  permissions JSONB DEFAULT '[]',
  added_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Workspaces (project containers within teams)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL, -- unique within organization
  workspace_type TEXT DEFAULT 'project' CHECK (workspace_type IN ('project', 'folder', 'archive')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  visibility TEXT DEFAULT 'team' CHECK (visibility IN ('public', 'team', 'private')),
  color TEXT DEFAULT '#6366f1',
  icon TEXT, -- icon identifier
  cover_image_url TEXT,
  settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  archived_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Workspace members (for granular access control)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  permissions JSONB DEFAULT '[]',
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  removed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Invitations for organizations, teams, and workspaces
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id),
  invitee_email TEXT NOT NULL,
  invitee_user_id UUID REFERENCES auth.users(id), -- if user already exists
  invitation_type TEXT NOT NULL CHECK (invitation_type IN ('organization', 'team', 'workspace')),
  role TEXT NOT NULL,
  permissions JSONB DEFAULT '[]',
  token TEXT NOT NULL UNIQUE, -- secure invitation token
  message TEXT, -- optional personal message
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity feed for organizations and teams
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'joined', 'left', etc.
  entity_type TEXT NOT NULL, -- 'user', 'team', 'workspace', 'project', etc.
  entity_id UUID,
  entity_name TEXT,
  description TEXT NOT NULL, -- human-readable description
  metadata JSONB DEFAULT '{}', -- additional context data
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "organizations_select_member" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = organizations.id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
    )
  );

CREATE POLICY "organizations_insert_own" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "organizations_update_admin" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = organizations.id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.is_active = true
    )
  );

-- RLS Policies for organization_members
CREATE POLICY "organization_members_select_member" ON public.organization_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members om 
      WHERE om.organization_id = organization_members.organization_id 
      AND om.user_id = auth.uid()
      AND om.is_active = true
    )
  );

CREATE POLICY "organization_members_insert_admin" ON public.organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

-- RLS Policies for teams
CREATE POLICY "teams_select_member" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = teams.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
    )
  );

CREATE POLICY "teams_insert_member" ON public.teams
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = teams.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
    )
  );

-- RLS Policies for team_members
CREATE POLICY "team_members_select_org_member" ON public.team_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.organization_members om ON t.organization_id = om.organization_id
      WHERE t.id = team_members.team_id 
      AND om.user_id = auth.uid()
      AND om.is_active = true
    )
  );

-- RLS Policies for workspaces
CREATE POLICY "workspaces_select_member" ON public.workspaces
  FOR SELECT USING (
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = workspaces.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_members.workspace_id = workspaces.id 
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.is_active = true
    )
  );

-- RLS Policies for workspace_members
CREATE POLICY "workspace_members_select_member" ON public.workspace_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workspace_members wm 
      WHERE wm.workspace_id = workspace_members.workspace_id 
      AND wm.user_id = auth.uid()
      AND wm.is_active = true
    )
  );

-- RLS Policies for invitations
CREATE POLICY "invitations_select_own" ON public.invitations
  FOR SELECT USING (
    inviter_id = auth.uid() OR 
    invitee_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE users.id = auth.uid() 
      AND users.email = invitations.invitee_email
    )
  );

-- RLS Policies for activities
CREATE POLICY "activities_select_member" ON public.activities
  FOR SELECT USING (
    actor_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = activities.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.is_active = true
    )) OR
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_members.team_id = activities.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.is_active = true
    ))
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_user ON public.organization_members(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_active ON public.organization_members(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_teams_organization ON public.teams(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON public.team_members(team_id, user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_org_slug ON public.workspaces(organization_id, slug);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_user ON public.workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email_status ON public.invitations(invitee_email, status);
CREATE INDEX IF NOT EXISTS idx_activities_org_created ON public.activities(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activities_team_created ON public.activities(team_id, created_at);

-- Update triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON public.organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON public.invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically add organization creator as owner
CREATE OR REPLACE FUNCTION add_organization_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role, joined_at)
  VALUES (NEW.id, auth.uid(), 'owner', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION add_organization_owner();

-- Function to automatically add team creator as lead
CREATE OR REPLACE FUNCTION add_team_lead()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_members (team_id, user_id, role, joined_at)
  VALUES (NEW.id, NEW.created_by, 'lead', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION add_team_lead();

-- Function to generate invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to log activities
CREATE OR REPLACE FUNCTION log_activity(
  p_organization_id UUID DEFAULT NULL,
  p_team_id UUID DEFAULT NULL,
  p_workspace_id UUID DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_entity_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activities (
    organization_id, team_id, workspace_id, actor_id, action, 
    entity_type, entity_id, entity_name, description, metadata
  ) VALUES (
    p_organization_id, p_team_id, p_workspace_id, auth.uid(), p_action,
    p_entity_type, p_entity_id, p_entity_name, p_description, p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
