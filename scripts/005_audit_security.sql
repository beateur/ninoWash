-- Audit and Security Schema for SaaS Application
-- Handles audit trails, security events, compliance, and data protection

-- Audit log for all data changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB, -- previous values for UPDATE/DELETE
  new_values JSONB, -- new values for INSERT/UPDATE
  changed_fields TEXT[], -- array of field names that changed
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  api_key_id UUID, -- if action was performed via API
  reason TEXT, -- optional reason for the change
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events and incidents
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'login_attempt', 'password_change', 'permission_change', etc.
  event_category TEXT NOT NULL CHECK (event_category IN ('authentication', 'authorization', 'data_access', 'configuration', 'suspicious_activity')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- user being acted upon
  resource_type TEXT, -- 'user', 'organization', 'workspace', etc.
  resource_id UUID,
  action_attempted TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  location JSONB, -- geographic location if available
  device_fingerprint TEXT,
  session_id UUID,
  additional_context JSONB DEFAULT '{}',
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys and tokens management
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- human-readable name for the key
  key_hash TEXT NOT NULL UNIQUE, -- hashed version of the actual key
  key_prefix TEXT NOT NULL, -- first few characters for identification
  permissions JSONB NOT NULL DEFAULT '[]', -- array of permissions
  scopes TEXT[] DEFAULT '{}', -- API scopes this key can access
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  allowed_ips INET[], -- IP whitelist
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_used_ip INET,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id),
  revoked_reason TEXT
);

-- API key usage tracking
CREATE TABLE IF NOT EXISTS public.api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Login attempts and authentication logs
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('password', 'oauth', 'magic_link', 'api_key')),
  success BOOLEAN NOT NULL,
  failure_reason TEXT, -- 'invalid_password', 'account_locked', 'email_not_verified', etc.
  ip_address INET NOT NULL,
  user_agent TEXT,
  device_fingerprint TEXT,
  location JSONB, -- geographic location
  session_id UUID,
  mfa_used BOOLEAN DEFAULT false,
  mfa_method TEXT, -- 'totp', 'sms', 'email', etc.
  blocked_by_rate_limit BOOLEAN DEFAULT false,
  blocked_by_geo_restriction BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password history (for password reuse prevention)
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data retention and deletion requests (GDPR compliance)
CREATE TABLE IF NOT EXISTS public.data_retention_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'deletion', 'anonymization')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  data_types TEXT[] NOT NULL, -- types of data to process
  reason TEXT,
  legal_basis TEXT, -- GDPR legal basis
  retention_period_days INTEGER,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  export_url TEXT, -- for data export requests
  verification_token TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance and regulatory tracking
CREATE TABLE IF NOT EXISTS public.compliance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  compliance_type TEXT NOT NULL, -- 'gdpr', 'ccpa', 'hipaa', 'sox', etc.
  event_type TEXT NOT NULL, -- 'data_processed', 'consent_given', 'consent_withdrawn', etc.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_subject_id UUID, -- the person whose data is involved
  legal_basis TEXT,
  purpose TEXT NOT NULL, -- purpose of data processing
  data_categories TEXT[] NOT NULL, -- categories of personal data
  recipients TEXT[], -- who the data was shared with
  retention_period TEXT,
  consent_id UUID, -- reference to consent record
  automated_decision_making BOOLEAN DEFAULT false,
  cross_border_transfer BOOLEAN DEFAULT false,
  transfer_safeguards TEXT,
  evidence JSONB DEFAULT '{}', -- supporting evidence/documentation
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User consent management
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'marketing', 'analytics', 'cookies', 'data_processing', etc.
  purpose TEXT NOT NULL, -- specific purpose of the consent
  legal_basis TEXT NOT NULL, -- GDPR legal basis
  status TEXT NOT NULL CHECK (status IN ('given', 'withdrawn', 'expired')),
  consent_method TEXT NOT NULL, -- 'explicit', 'implicit', 'opt_in', 'opt_out'
  consent_text TEXT NOT NULL, -- the actual consent text shown to user
  version TEXT NOT NULL, -- version of consent text
  ip_address INET,
  user_agent TEXT,
  given_at TIMESTAMP WITH TIME ZONE,
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security configuration and policies
CREATE TABLE IF NOT EXISTS public.security_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  policy_type TEXT NOT NULL, -- 'password', 'session', 'api', 'data_access', etc.
  policy_name TEXT NOT NULL,
  policy_config JSONB NOT NULL, -- policy configuration
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, policy_type, policy_name)
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs (admins and affected users can see)
CREATE POLICY "audit_logs_select_admin_or_own" ON public.audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = audit_logs.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.is_active = true
    ))
  );

-- RLS Policies for security_events
CREATE POLICY "security_events_select_admin_or_affected" ON public.security_events
  FOR SELECT USING (
    user_id = auth.uid() OR 
    target_user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = security_events.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.is_active = true
    ))
  );

-- RLS Policies for api_keys
CREATE POLICY "api_keys_select_own" ON public.api_keys
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "api_keys_insert_own" ON public.api_keys
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "api_keys_update_own" ON public.api_keys
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "api_keys_delete_own" ON public.api_keys
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for login_attempts (users can see their own)
CREATE POLICY "login_attempts_select_own" ON public.login_attempts
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE users.id = auth.uid() 
      AND users.email = login_attempts.email
    )
  );

-- RLS Policies for password_history
CREATE POLICY "password_history_select_own" ON public.password_history
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for data_retention_requests
CREATE POLICY "data_retention_requests_select_own_or_admin" ON public.data_retention_requests
  FOR SELECT USING (
    user_id = auth.uid() OR 
    requested_by = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = data_retention_requests.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.is_active = true
    ))
  );

-- RLS Policies for user_consents
CREATE POLICY "user_consents_select_own" ON public.user_consents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_consents_insert_own" ON public.user_consents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_consents_update_own" ON public.user_consents
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for security_policies
CREATE POLICY "security_policies_select_org_admin" ON public.security_policies
  FOR SELECT USING (
    organization_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = security_policies.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.is_active = true
    )
  );

-- Indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON public.audit_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_timestamp ON public.audit_logs(organization_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_severity_status ON public.security_events(severity, status);
CREATE INDEX IF NOT EXISTS idx_security_events_user_timestamp ON public.security_events(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_active ON public.api_keys(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_key_timestamp ON public.api_key_usage(api_key_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_timestamp ON public.login_attempts(email, timestamp);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_timestamp ON public.login_attempts(ip_address, timestamp);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON public.login_attempts(success, timestamp);
CREATE INDEX IF NOT EXISTS idx_password_history_user ON public.password_history(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_data_retention_requests_status ON public.data_retention_requests(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_compliance_events_org_timestamp ON public.compliance_events(organization_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_user_consents_user_type ON public.user_consents(user_id, consent_type, status);

-- Update triggers
CREATE TRIGGER update_security_events_updated_at BEFORE UPDATE ON public.security_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_requests_updated_at BEFORE UPDATE ON public.data_retention_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_consents_updated_at BEFORE UPDATE ON public.user_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_policies_updated_at BEFORE UPDATE ON public.security_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  changed_fields TEXT[];
BEGIN
  -- Skip audit for audit_logs table itself to prevent recursion
  IF TG_TABLE_NAME = 'audit_logs' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Convert OLD and NEW to JSONB
  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSE -- UPDATE
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Find changed fields
    SELECT array_agg(key) INTO changed_fields
    FROM jsonb_each(new_data) n
    JOIN jsonb_each(old_data) o ON n.key = o.key
    WHERE n.value IS DISTINCT FROM o.value;
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    table_name, record_id, operation, old_values, new_values, 
    changed_fields, user_id, organization_id
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE((NEW ->> 'id')::UUID, (OLD ->> 'id')::UUID),
    TG_OP,
    old_data,
    new_data,
    changed_fields,
    auth.uid(),
    COALESCE((NEW ->> 'organization_id')::UUID, (OLD ->> 'organization_id')::UUID)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_event_category TEXT,
  p_severity TEXT,
  p_action_attempted TEXT,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL,
  p_target_user_id UUID DEFAULT NULL,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_additional_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    event_type, event_category, severity, action_attempted, success,
    failure_reason, user_id, target_user_id, resource_type, resource_id,
    additional_context
  ) VALUES (
    p_event_type, p_event_category, p_severity, p_action_attempted, p_success,
    p_failure_reason, auth.uid(), p_target_user_id, p_resource_type, p_resource_id,
    p_additional_context
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
BEGIN
  RETURN 'sk_' || encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to hash API key
CREATE OR REPLACE FUNCTION hash_api_key(api_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(api_key, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Insert default security policies
INSERT INTO public.security_policies (organization_id, policy_type, policy_name, policy_config, created_by) 
SELECT 
  NULL, -- global policies
  'password',
  'default_password_policy',
  '{
    "min_length": 8,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_symbols": false,
    "prevent_reuse_count": 5,
    "max_age_days": 90
  }'::JSONB,
  (SELECT id FROM auth.users LIMIT 1)
WHERE EXISTS (SELECT 1 FROM auth.users)
ON CONFLICT DO NOTHING;

INSERT INTO public.security_policies (organization_id, policy_type, policy_name, policy_config, created_by)
SELECT 
  NULL, -- global policies
  'session',
  'default_session_policy',
  '{
    "max_duration_hours": 24,
    "idle_timeout_minutes": 30,
    "require_mfa_for_sensitive_actions": false,
    "max_concurrent_sessions": 5
  }'::JSONB,
  (SELECT id FROM auth.users LIMIT 1)
WHERE EXISTS (SELECT 1 FROM auth.users)
ON CONFLICT DO NOTHING;
