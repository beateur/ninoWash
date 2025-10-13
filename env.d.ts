/// <reference types="node" />

/**
 * Type definitions for environment variables
 */
declare namespace NodeJS {
  interface ProcessEnv {
    // Public (client-side accessible)
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string
    NEXT_PUBLIC_APP_URL: string
    NEXT_PUBLIC_ADMIN_URL?: string
    NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED?: "true" | "false"

    // Server-only secrets
    SUPABASE_SERVICE_ROLE_KEY: string
    STRIPE_SECRET_KEY: string
    STRIPE_WEBHOOK_SECRET: string

    // Node.js
    NODE_ENV: "development" | "production" | "test"
  }
}
