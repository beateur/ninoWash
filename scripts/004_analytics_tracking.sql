-- Analytics and Tracking Schema for SaaS Application
-- Handles user behavior, feature usage, performance metrics, and business intelligence

-- Events tracking (core analytics table)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  session_id UUID, -- links to user_sessions
  event_name TEXT NOT NULL, -- 'page_view', 'button_click', 'feature_used', etc.
  event_category TEXT, -- 'navigation', 'engagement', 'conversion', etc.
  event_action TEXT, -- 'click', 'view', 'submit', 'download', etc.
  event_label TEXT, -- additional context
  event_value DECIMAL(10,2), -- numeric value for the event
  properties JSONB DEFAULT '{}', -- custom event properties
  page_url TEXT,
  page_title TEXT,
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature usage tracking
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL, -- 'dashboard', 'reports', 'api', etc.
  feature_category TEXT, -- 'core', 'premium', 'enterprise'
  usage_type TEXT NOT NULL CHECK (usage_type IN ('view', 'interaction', 'creation', 'modification', 'deletion')),
  usage_count INTEGER DEFAULT 1,
  duration_seconds INTEGER, -- time spent using the feature
  success BOOLEAN DEFAULT true, -- whether the usage was successful
  error_message TEXT, -- if success = false
  metadata JSONB DEFAULT '{}',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id, feature_name, date, usage_type)
);

-- Page views and navigation tracking
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  session_id UUID,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer_url TEXT,
  load_time_ms INTEGER, -- page load time in milliseconds
  time_on_page_seconds INTEGER, -- time spent on page
  bounce BOOLEAN DEFAULT false, -- single page session
  exit_page BOOLEAN DEFAULT false, -- last page in session
  device_info JSONB,
  geo_info JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User engagement metrics (daily aggregates)
CREATE TABLE IF NOT EXISTS public.user_engagement_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  session_count INTEGER DEFAULT 0,
  total_session_duration_seconds INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  unique_pages_viewed INTEGER DEFAULT 0,
  events_triggered INTEGER DEFAULT 0,
  features_used INTEGER DEFAULT 0,
  actions_performed INTEGER DEFAULT 0,
  errors_encountered INTEGER DEFAULT 0,
  first_seen_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id, date)
);

-- Organization metrics (daily aggregates)
CREATE TABLE IF NOT EXISTS public.organization_metrics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  total_feature_usage INTEGER DEFAULT 0,
  avg_session_duration_seconds DECIMAL(10,2) DEFAULT 0,
  bounce_rate DECIMAL(5,4) DEFAULT 0, -- percentage as decimal
  conversion_events INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  bandwidth_used_gb DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, date)
);

-- Conversion funnels tracking
CREATE TABLE IF NOT EXISTS public.conversion_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL, -- array of step definitions
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversion funnel events
CREATE TABLE IF NOT EXISTS public.conversion_funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID NOT NULL REFERENCES public.conversion_funnels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  session_id UUID,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  completed BOOLEAN DEFAULT true,
  completion_time_seconds INTEGER, -- time to complete this step
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B testing experiments
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  hypothesis TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived')),
  traffic_allocation DECIMAL(3,2) DEFAULT 1.0, -- percentage of users to include
  variants JSONB NOT NULL, -- experiment variants configuration
  success_metrics JSONB NOT NULL, -- metrics to track for success
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B test assignments
CREATE TABLE IF NOT EXISTS public.experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(experiment_id, user_id)
);

-- Performance monitoring
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'api_response_time', 'page_load_time', 'database_query_time'
  metric_name TEXT NOT NULL,
  value DECIMAL(10,4) NOT NULL,
  unit TEXT NOT NULL, -- 'ms', 'seconds', 'bytes', etc.
  tags JSONB DEFAULT '{}', -- additional context tags
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error tracking and monitoring
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  session_id UUID,
  error_type TEXT NOT NULL, -- 'javascript', 'api', 'database', 'validation'
  error_level TEXT NOT NULL CHECK (error_level IN ('info', 'warning', 'error', 'critical')),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_code TEXT,
  context JSONB DEFAULT '{}', -- additional error context
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_engagement_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events (users can see their own, org admins can see org data)
CREATE POLICY "events_select_own_or_org_admin" ON public.events
  FOR SELECT USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = events.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.is_active = true
    ))
  );

-- RLS Policies for feature_usage
CREATE POLICY "feature_usage_select_own_or_org_admin" ON public.feature_usage
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = feature_usage.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.is_active = true
    )
  );

-- RLS Policies for user_engagement_daily
CREATE POLICY "user_engagement_daily_select_own_or_org_admin" ON public.user_engagement_daily
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = user_engagement_daily.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.is_active = true
    )
  );

-- RLS Policies for organization_metrics_daily
CREATE POLICY "organization_metrics_daily_select_org_admin" ON public.organization_metrics_daily
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = organization_metrics_daily.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.is_active = true
    )
  );

-- RLS Policies for experiments
CREATE POLICY "experiments_select_org_admin" ON public.experiments
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.user_profiles up ON om.user_id = up.id
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
      AND om.is_active = true
    )
  );

-- RLS Policies for error_logs
CREATE POLICY "error_logs_select_own_or_org_admin" ON public.error_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_members.organization_id = error_logs.organization_id 
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.is_active = true
    ))
  );

-- Indexes for performance (time-series data needs special attention)
CREATE INDEX IF NOT EXISTS idx_events_user_timestamp ON public.events(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_events_org_timestamp ON public.events(organization_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_events_name_timestamp ON public.events(event_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_date ON public.feature_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_feature_usage_org_date ON public.feature_usage(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_page_views_user_timestamp ON public.page_views(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_user_engagement_daily_user_date ON public.user_engagement_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_organization_metrics_daily_org_date ON public.organization_metrics_daily(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_events_funnel_timestamp ON public.conversion_funnel_events(funnel_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_timestamp ON public.performance_metrics(metric_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_level_timestamp ON public.error_logs(error_level, timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved, timestamp) WHERE resolved = false;

-- Partitioning for large tables (events table by month)
-- Note: This would typically be done at table creation time in production
-- CREATE TABLE public.events_y2024m01 PARTITION OF public.events
--   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Update triggers
CREATE TRIGGER update_user_engagement_daily_updated_at BEFORE UPDATE ON public.user_engagement_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_metrics_daily_updated_at BEFORE UPDATE ON public.organization_metrics_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversion_funnels_updated_at BEFORE UPDATE ON public.conversion_funnels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON public.experiments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to track events
CREATE OR REPLACE FUNCTION track_event(
  p_event_name TEXT,
  p_event_category TEXT DEFAULT NULL,
  p_event_action TEXT DEFAULT NULL,
  p_event_label TEXT DEFAULT NULL,
  p_event_value DECIMAL DEFAULT NULL,
  p_properties JSONB DEFAULT '{}',
  p_page_url TEXT DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.events (
    user_id, organization_id, event_name, event_category, event_action,
    event_label, event_value, properties, page_url
  ) VALUES (
    auth.uid(), p_organization_id, p_event_name, p_event_category, p_event_action,
    p_event_label, p_event_value, p_properties, p_page_url
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage(
  p_feature_name TEXT,
  p_feature_category TEXT DEFAULT NULL,
  p_usage_type TEXT DEFAULT 'interaction',
  p_organization_id UUID DEFAULT NULL,
  p_duration_seconds INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  usage_id UUID;
BEGIN
  INSERT INTO public.feature_usage (
    user_id, organization_id, feature_name, feature_category, usage_type,
    duration_seconds, metadata
  ) VALUES (
    auth.uid(), p_organization_id, p_feature_name, p_feature_category, p_usage_type,
    p_duration_seconds, p_metadata
  ) 
  ON CONFLICT (user_id, organization_id, feature_name, date, usage_type)
  DO UPDATE SET 
    usage_count = feature_usage.usage_count + 1,
    duration_seconds = COALESCE(feature_usage.duration_seconds, 0) + COALESCE(p_duration_seconds, 0),
    metadata = p_metadata
  RETURNING id INTO usage_id;
  
  RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log errors
CREATE OR REPLACE FUNCTION log_error(
  p_error_type TEXT,
  p_error_level TEXT,
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_context JSONB DEFAULT '{}',
  p_organization_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  error_id UUID;
BEGIN
  INSERT INTO public.error_logs (
    user_id, organization_id, error_type, error_level, error_message,
    error_stack, error_code, context
  ) VALUES (
    auth.uid(), p_organization_id, p_error_type, p_error_level, p_error_message,
    p_error_stack, p_error_code, p_context
  ) RETURNING id INTO error_id;
  
  RETURN error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
