# API Integration Guide

## Overview

This guide provides examples and best practices for integrating with the SaaS database schema using Supabase client libraries.

## Setup

### Client Configuration

\`\`\`typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
\`\`\`

\`\`\`typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - can be ignored with middleware
          }
        },
      },
    }
  )
}
\`\`\`

## User Management

### User Profile Operations

\`\`\`typescript
// Get current user profile
export async function getUserProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()
    
  return profile
}

// Update user profile
export async function updateUserProfile(updates: Partial<UserProfile>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()
    
  if (error) throw error
  return data
}

// Get user preferences
export async function getUserPreferences(category?: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  let query = supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    
  if (category) {
    query = query.eq('category', category)
  }
  
  const { data } = await query
  return data || []
}

// Set user preference
export async function setUserPreference(
  category: string, 
  key: string, 
  value: any
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      category,
      key,
      value
    })
    .select()
    .single()
    
  if (error) throw error
  return data
}
\`\`\`

## Organization Management

### Organization Operations

\`\`\`typescript
// Create new organization
export async function createOrganization(data: {
  name: string
  slug: string
  description?: string
}) {
  const supabase = createClient()
  
  const { data: org, error } = await supabase
    .from('organizations')
    .insert(data)
    .select()
    .single()
    
  if (error) throw error
  return org
}

// Get user's organizations
export async function getUserOrganizations() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const { data } = await supabase
    .from('organization_members')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    
  return data?.map(member => ({
    ...member.organization,
    role: member.role,
    joined_at: member.joined_at
  })) || []
}

// Invite user to organization
export async function inviteToOrganization(
  organizationId: string,
  email: string,
  role: string,
  message?: string
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days
  
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      organization_id: organizationId,
      inviter_id: user.id,
      invitee_email: email,
      invitation_type: 'organization',
      role,
      token,
      message,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()
    
  if (error) throw error
  
  // Send invitation email (implement your email service)
  // await sendInvitationEmail(email, token, message)
  
  return data
}
\`\`\`

## Subscription Management

### Subscription Operations

\`\`\`typescript
// Get user's active subscription
export async function getActiveSubscription() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()
    
  return data
}

// Get available subscription plans
export async function getSubscriptionPlans() {
  const supabase = createClient()
  
  const { data } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .eq('is_public', true)
    .order('sort_order')
    
  return data || []
}

// Create subscription
export async function createSubscription(planId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  // Get plan details
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single()
    
  if (!plan) throw new Error('Plan not found')
  
  const currentPeriodStart = new Date()
  const currentPeriodEnd = new Date()
  
  if (plan.billing_interval === 'monthly') {
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
  } else if (plan.billing_interval === 'yearly') {
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
  }
  
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan_id: planId,
      status: plan.trial_days > 0 ? 'trialing' : 'active',
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      trial_start: plan.trial_days > 0 ? currentPeriodStart.toISOString() : null,
      trial_end: plan.trial_days > 0 ? 
        new Date(currentPeriodStart.getTime() + plan.trial_days * 24 * 60 * 60 * 1000).toISOString() : 
        null,
      total_amount: plan.price_amount
    })
    .select()
    .single()
    
  if (error) throw error
  return data
}
\`\`\`

## Analytics and Tracking

### Event Tracking

\`\`\`typescript
// Track custom event
export async function trackEvent(
  eventName: string,
  properties?: Record<string, any>,
  organizationId?: string
) {
  const supabase = createClient()
  
  const { error } = await supabase.rpc('track_event', {
    p_event_name: eventName,
    p_properties: properties || {},
    p_organization_id: organizationId,
    p_page_url: window.location.href
  })
  
  if (error) console.error('Failed to track event:', error)
}

// Track feature usage
export async function trackFeatureUsage(
  featureName: string,
  category?: string,
  organizationId?: string,
  durationSeconds?: number
) {
  const supabase = createClient()
  
  const { error } = await supabase.rpc('track_feature_usage', {
    p_feature_name: featureName,
    p_feature_category: category,
    p_organization_id: organizationId,
    p_duration_seconds: durationSeconds
  })
  
  if (error) console.error('Failed to track feature usage:', error)
}

// Get user engagement metrics
export async function getUserEngagementMetrics(days = 30) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data } = await supabase
    .from('user_engagement_daily')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date')
    
  return data || []
}
\`\`\`

## Security and Audit

### Security Operations

\`\`\`typescript
// Get user's login history
export async function getLoginHistory(limit = 50) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const { data } = await supabase
    .from('login_attempts')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(limit)
    
  return data || []
}

// Create API key
export async function createApiKey(name: string, permissions: string[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  // Generate API key (implement secure generation)
  const apiKey = `sk_${crypto.randomUUID().replace(/-/g, '')}`
  const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey))
  const keyHashHex = Array.from(new Uint8Array(keyHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      name,
      key_hash: keyHashHex,
      key_prefix: apiKey.substring(0, 8),
      permissions
    })
    .select()
    .single()
    
  if (error) throw error
  
  // Return the actual key only once
  return { ...data, key: apiKey }
}

// Get audit logs for user
export async function getUserAuditLogs(limit = 100) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []
  
  const { data } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(limit)
    
  return data || []
}
\`\`\`

## Error Handling and Logging

### Error Management

\`\`\`typescript
// Log application error
export async function logError(
  errorType: string,
  errorLevel: 'info' | 'warning' | 'error' | 'critical',
  errorMessage: string,
  context?: Record<string, any>
) {
  const supabase = createClient()
  
  const { error } = await supabase.rpc('log_error', {
    p_error_type: errorType,
    p_error_level: errorLevel,
    p_error_message: errorMessage,
    p_context: context || {}
  })
  
  if (error) console.error('Failed to log error:', error)
}

// Global error handler
export function setupErrorHandling() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError('javascript', 'error', event.reason?.message || 'Unhandled promise rejection', {
      stack: event.reason?.stack,
      url: window.location.href
    })
  })
  
  // Handle JavaScript errors
  window.addEventListener('error', (event) => {
    logError('javascript', 'error', event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      url: window.location.href
    })
  })
}
\`\`\`

## React Hooks

### Custom Hooks for Common Operations

\`\`\`typescript
// hooks/use-user-profile.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUserProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    async function fetchProfile() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setProfile(null)
          return
        }
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          
        if (error) throw error
        setProfile(data)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfile()
  }, [])
  
  return { profile, loading, error }
}

// hooks/use-organizations.ts
export function useOrganizations() {
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const data = await getUserOrganizations()
        setOrganizations(data)
      } catch (error) {
        console.error('Failed to fetch organizations:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrganizations()
  }, [])
  
  return { organizations, loading }
}
\`\`\`

This integration guide provides practical examples for working with the comprehensive SaaS database schema using modern React and Next.js patterns.
