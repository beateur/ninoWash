-- Migration: Add webhook endpoint for scheduled downgrades
-- Description: Creates a database function that can be called by Supabase Edge Function
-- to create new subscriptions after a scheduled downgrade period ends

-- Create function to notify user about expired downgrade
CREATE OR REPLACE FUNCTION notify_scheduled_downgrade_ready(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  result JSONB;
BEGIN
  -- Get user details
  SELECT 
    email,
    COALESCE(
      raw_user_meta_data->>'first_name' || ' ' || raw_user_meta_data->>'last_name',
      email
    )
  INTO user_email, user_name
  FROM auth.users
  WHERE id = p_user_id;
  
  IF user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Return user info for notification
  -- The Edge Function will use this to send an email via Resend/SendGrid
  result := jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', p_user_id,
      'email', user_email,
      'name', user_name
    ),
    'message', 'User should be notified to resubscribe'
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION notify_scheduled_downgrade_ready TO postgres, service_role;

COMMENT ON FUNCTION notify_scheduled_downgrade_ready IS 
  'Returns user information for notification after a scheduled downgrade period ends. Called by Edge Function to send email reminder to resubscribe.';
