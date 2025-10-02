-- Sprint P3: Enhanced Role-Based Access Control (RBAC)
-- This script adds missing constraints and indexes to existing RBAC tables

-- Roles indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_system_role ON roles(is_system_role);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON user_roles(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role_id);

-- Add constraints
ALTER TABLE roles
  ADD CONSTRAINT IF NOT EXISTS uq_roles_name UNIQUE (name);

ALTER TABLE user_roles
  ADD CONSTRAINT IF NOT EXISTS uq_user_roles_user_role UNIQUE (user_id, role_id);

-- Create permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  is_system_permission BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_permissions_action CHECK (action IN ('create', 'read', 'update', 'delete', 'manage', 'execute'))
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  granted_by UUID REFERENCES users(id),
  CONSTRAINT uq_role_permissions_role_permission UNIQUE (role_id, permission_id)
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_is_system ON permissions(is_system_permission);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Insert default system permissions
INSERT INTO permissions (name, resource, action, description, is_system_permission) VALUES
  ('users.create', 'users', 'create', 'Create new users', true),
  ('users.read', 'users', 'read', 'View user information', true),
  ('users.update', 'users', 'update', 'Update user information', true),
  ('users.delete', 'users', 'delete', 'Delete users', true),
  ('users.manage', 'users', 'manage', 'Full user management', true),
  
  ('organizations.create', 'organizations', 'create', 'Create organizations', true),
  ('organizations.read', 'organizations', 'read', 'View organizations', true),
  ('organizations.update', 'organizations', 'update', 'Update organizations', true),
  ('organizations.delete', 'organizations', 'delete', 'Delete organizations', true),
  ('organizations.manage', 'organizations', 'manage', 'Full organization management', true),
  
  ('workspaces.create', 'workspaces', 'create', 'Create workspaces', true),
  ('workspaces.read', 'workspaces', 'read', 'View workspaces', true),
  ('workspaces.update', 'workspaces', 'update', 'Update workspaces', true),
  ('workspaces.delete', 'workspaces', 'delete', 'Delete workspaces', true),
  ('workspaces.manage', 'workspaces', 'manage', 'Full workspace management', true),
  
  ('teams.create', 'teams', 'create', 'Create teams', true),
  ('teams.read', 'teams', 'read', 'View teams', true),
  ('teams.update', 'teams', 'update', 'Update teams', true),
  ('teams.delete', 'teams', 'delete', 'Delete teams', true),
  ('teams.manage', 'teams', 'manage', 'Full team management', true),
  
  ('subscriptions.read', 'subscriptions', 'read', 'View subscriptions', true),
  ('subscriptions.manage', 'subscriptions', 'manage', 'Manage subscriptions', true),
  
  ('billing.read', 'billing', 'read', 'View billing information', true),
  ('billing.manage', 'billing', 'manage', 'Manage billing', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default system roles if they don't exist
INSERT INTO roles (name, description, is_system_role, permissions) VALUES
  ('super_admin', 'Full system access', true, '{"*": ["*"]}'::jsonb),
  ('admin', 'Administrative access', true, '{"users": ["read", "update"], "organizations": ["read", "update", "manage"], "workspaces": ["read", "update", "manage"], "teams": ["read", "update", "manage"]}'::jsonb),
  ('member', 'Standard member access', true, '{"users": ["read"], "workspaces": ["read"], "teams": ["read"]}'::jsonb),
  ('guest', 'Limited guest access', true, '{"users": ["read"], "workspaces": ["read"]}'::jsonb)
ON CONFLICT (name) DO NOTHING;
