-- Sprint P5: Enhanced Invitations System
-- This script adds missing constraints and indexes to the invitations table

-- Invitations indexes
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace_id ON invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invitations_team_id ON invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_user_id ON invitations(invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_created_at ON invitations(created_at);

-- Add constraints
ALTER TABLE invitations
  ADD CONSTRAINT IF NOT EXISTS chk_invitations_status
  CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'expired'));

ALTER TABLE invitations
  ADD CONSTRAINT IF NOT EXISTS chk_invitations_invitation_type
  CHECK (invitation_type IN ('organization', 'workspace', 'team'));

ALTER TABLE invitations
  ADD CONSTRAINT IF NOT EXISTS chk_invitations_role
  CHECK (role IN ('owner', 'admin', 'member', 'editor', 'viewer', 'guest', 'lead', 'contributor'));

-- Ensure unique token
ALTER TABLE invitations
  ADD CONSTRAINT IF NOT EXISTS uq_invitations_token UNIQUE (token);

-- Add trigger for updated_at
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
