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

-- Add constraints using DO blocks
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_invitations_status') THEN
    ALTER TABLE invitations
      ADD CONSTRAINT chk_invitations_status
      CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'expired'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_invitations_invitation_type') THEN
    ALTER TABLE invitations
      ADD CONSTRAINT chk_invitations_invitation_type
      CHECK (invitation_type IN ('organization', 'workspace', 'team'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_invitations_role') THEN
    ALTER TABLE invitations
      ADD CONSTRAINT chk_invitations_role
      CHECK (role IN ('owner', 'admin', 'member', 'editor', 'viewer', 'guest', 'lead', 'contributor'));
  END IF;
END $$;

-- Ensure unique token
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_invitations_token') THEN
    ALTER TABLE invitations
      ADD CONSTRAINT uq_invitations_token UNIQUE (token);
  END IF;
END $$;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_invitations_updated_at ON invitations;
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
