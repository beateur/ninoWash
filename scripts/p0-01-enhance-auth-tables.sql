-- Sprint P0: Enhanced Authentication and User Management
-- This script adds missing constraints and indexes to existing auth tables

-- Add indexes for better query performance on users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider, auth_provider_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Add indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified ON user_profiles(email_verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_seen_at ON user_profiles(last_seen_at);

-- Add indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active) WHERE is_active = true;

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_email_status ON users(email, status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active) WHERE is_active = true;

-- Add check constraints for data integrity
ALTER TABLE users 
  ADD CONSTRAINT IF NOT EXISTS chk_users_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users
  ADD CONSTRAINT IF NOT EXISTS chk_users_status_valid
  CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));

-- Ensure timestamps are properly set
ALTER TABLE users 
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE user_profiles
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE user_sessions
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN last_activity_at SET DEFAULT CURRENT_TIMESTAMP;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
