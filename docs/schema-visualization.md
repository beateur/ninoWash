# Database Schema Visualization

## Multi-Tenancy Hierarchy

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                          ORGANIZATION                                │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ • Company-level tenant isolation                               │ │
│  │ • Billing entity                                               │ │
│  │ • Settings & configuration                                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌──────────────────────┐         ┌──────────────────────┐          │
│  │       TEAMS          │         │     WORKSPACES       │          │
│  │ ┌──────────────────┐ │         │ ┌──────────────────┐ │          │
│  │ │ • Project groups │ │         │ │ • Isolated envs  │ │          │
│  │ │ • Departments    │ │         │ │ • Projects       │ │          │
│  │ │ • Collaborators  │ │         │ │ • Resources      │ │          │
│  │ └──────────────────┘ │         │ └──────────────────┘ │          │
│  └──────────────────────┘         └──────────────────────┘          │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    ORGANIZATION MEMBERS                         │ │
│  │  • Roles: owner, admin, member, viewer                         │ │
│  │  • Custom permissions per member                               │ │
│  │  • Invitation system                                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
\`\`\`

## Authentication Flow

\`\`\`
┌──────────────┐
│    USERS     │
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│USER_PROFILES │  │USER_SESSIONS │
│              │  │              │
│• Display name│  │• Session token│
│• Avatar      │  │• IP tracking │
│• Preferences │  │• Device info │
│• Timezone    │  │• Expiration  │
└──────────────┘  └──────────────┘
       │
       ▼
┌──────────────┐
│  USER_ROLES  │
│              │
│• Role assign │
│• Expiration  │
│• Audit trail │
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│    ROLES     │◄─────┤ PERMISSIONS  │
│              │      │              │
│• Admin       │      │• Resource    │
│• Editor      │      │• Action      │
│• Viewer      │      │• Description │
└──────────────┘      └──────────────┘
\`\`\`

## Subscription & Billing Flow

\`\`\`
┌──────────────────┐
│SUBSCRIPTION_PLANS│
│                  │
│• Starter         │
│• Pro             │
│• Enterprise      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      ┌──────────────┐
│  SUBSCRIPTIONS   │◄─────┤    USERS     │
│                  │      └──────────────┘
│• Status          │
│• Stripe IDs      │
│• Billing cycle   │
│• Trial period    │
└────────┬─────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   INVOICES   │  │USAGE_RECORDS │  │   COUPONS    │
│              │  │              │  │              │
│• Line items  │  │• Metered     │  │• Discounts   │
│• Payments    │  │• Billing     │  │• Redemptions │
│• PDF/URL     │  │• Costs       │  │• Validity    │
└──────┬───────┘  └──────────────┘  └──────────────┘
       │
       ▼
┌──────────────────┐
│PAYMENT_TRANSACTIONS│
│                  │
│• Stripe charges  │
│• Refunds         │
│• Receipt URLs    │
└──────────────────┘
\`\`\`

## Analytics & Monitoring Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                      USER ACTIVITY                           │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│    EVENTS    │      │  PAGE_VIEWS  │     │  ACTIVITIES  │
│              │      │              │     │              │
│• User actions│      │• Navigation  │     │• Audit trail │
│• Properties  │      │• Time on page│     │• Entity logs │
│• UTM params  │      │• Bounce rate │     │• IP tracking │
└──────┬───────┘      └──────┬───────┘     └──────────────┘
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    AGGREGATED METRICS                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │USER_ENGAGEMENT_DAILY │    │ORG_METRICS_DAILY     │      │
│  │                      │    │                      │      │
│  │• Sessions            │    │• Active users        │      │
│  │• Page views          │    │• Revenue             │      │
│  │• Features used       │    │• API calls           │      │
│  │• Actions performed   │    │• Storage/bandwidth   │      │
│  └──────────────────────┘    └──────────────────────┘      │
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │   FEATURE_USAGE      │    │PERFORMANCE_METRICS   │      │
│  │                      │    │                      │      │
│  │• Feature tracking    │    │• Response times      │      │
│  │• Success rates       │    │• Resource usage      │      │
│  │• Duration            │    │• Custom metrics      │      │
│  └──────────────────────┘    └──────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## Business Logic Flow (Booking System)

\`\`\`
┌──────────────┐
│    USERS     │
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│USER_ADDRESSES│      │   SERVICES   │
│              │      │              │
│• Home        │      │• Dry cleaning│
│• Work        │      │• Laundry     │
│• Coordinates │      │• Ironing     │
└──────┬───────┘      └──────┬───────┘
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                        BOOKINGS                              │
│                                                              │
│• Booking number                                             │
│• Pickup/delivery addresses & dates                          │
│• Service selection                                          │
│• Status tracking                                            │
│• Payment status                                             │
│• Pricing calculation                                        │
└────────┬────────────────────────────────────────────────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│BOOKING_ITEMS │  │   DELIVERY   │  │   LOYALTY    │
│              │  │  ASSIGNMENTS │  │   REWARDS    │
│• Item details│  │              │  │              │
│• Quantities  │  │• Driver      │  │• Points      │
│• Pricing     │  │• Status      │  │• Free items  │
│• Conditions  │  │• Timeline    │  │• Benefits    │
└──────────────┘  └──────┬───────┘  └──────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   DELIVERY   │
                  │    DRIVERS   │
                  │              │
                  │• Availability│
                  │• Location    │
                  │• Rating      │
                  │• Capacity    │
                  └──────────────┘
\`\`\`

## System Features Integration

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM FEATURES                           │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│ INVITATIONS  │      │NOTIFICATIONS │     │  EMAIL_QUEUE │
│              │      │              │     │              │
│• Org/Team    │      │• In-app      │     │• Templates   │
│• Workspace   │      │• Priority    │     │• Scheduling  │
│• Token-based │      │• Read status │     │• Retry logic │
└──────────────┘      └──────────────┘     └──────────────┘

┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│   API_KEYS   │      │   WEBHOOKS   │     │ EXPERIMENTS  │
│              │      │              │     │              │
│• Scopes      │      │• Events      │     │• A/B testing │
│• Rate limits │      │• Deliveries  │     │• Variants    │
│• Usage track │      │• Retry policy│     │• Metrics     │
└──────────────┘      └──────────────┘     └──────────────┘
\`\`\`

## Data Flow Summary

### 1. User Registration & Authentication
\`\`\`
User Sign Up → users table
           → user_profiles created
           → user_session created
           → user_roles assigned
           → organization_members added (if invited)
\`\`\`

### 2. Subscription Flow
\`\`\`
User selects plan → subscription_plans
                 → subscriptions created
                 → Stripe customer created
                 → payment_methods added
                 → invoices generated
                 → payment_transactions recorded
\`\`\`

### 3. Booking Flow
\`\`\`
User creates booking → bookings table
                    → booking_items added
                    → delivery_assignments created
                    → delivery_drivers assigned
                    → loyalty_rewards updated
                    → notifications sent
                    → activities logged
\`\`\`

### 4. Analytics Flow
\`\`\`
User activity → events captured
             → page_views recorded
             → feature_usage tracked
             → Daily aggregation:
                 - user_engagement_daily
                 - organization_metrics_daily
             → performance_metrics collected
             → error_logs captured
\`\`\`

## Security Layers

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Authentication                                    │
│  ├─ Password hashing (bcrypt/argon2)                       │
│  ├─ Session management                                     │
│  ├─ OAuth providers                                        │
│  └─ MFA support (future)                                   │
│                                                              │
│  Layer 2: Authorization (RBAC)                             │
│  ├─ Role-based permissions                                 │
│  ├─ Resource-level access control                          │
│  ├─ Organization/team/workspace isolation                  │
│  └─ Custom permissions per user                            │
│                                                              │
│  Layer 3: Data Isolation (Multi-tenancy)                   │
│  ├─ Row Level Security (RLS) policies                      │
│  ├─ Organization-level data separation                     │
│  ├─ Workspace-level isolation                              │
│  └─ API key scoping                                        │
│                                                              │
│  Layer 4: Audit & Monitoring                               │
│  ├─ Activity logging                                       │
│  ├─ Error tracking                                         │
│  ├─ Session tracking                                       │
│  └─ API usage monitoring                                   │
│                                                              │
│  Layer 5: Data Protection                                  │
│  ├─ Encrypted sensitive fields                             │
│  ├─ Hashed API keys                                        │
│  ├─ Soft deletes                                           │
│  └─ Backup & recovery                                      │
└─────────────────────────────────────────────────────────────┘
\`\`\`

This visualization provides a comprehensive overview of your database schema architecture, showing how different components interact and flow together.
