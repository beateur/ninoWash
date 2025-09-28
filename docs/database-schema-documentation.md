# SaaS Database Schema Documentation

## Overview

This comprehensive database schema is designed for a modern SaaS application with multi-tenant architecture, subscription billing, team collaboration, analytics tracking, and enterprise-grade security features. The schema is built on PostgreSQL with Supabase and implements Row Level Security (RLS) throughout.

## Architecture Principles

- **Multi-tenant**: Organizations as top-level entities with proper data isolation
- **Security-first**: Row Level Security (RLS) on all tables with granular permissions
- **Audit-ready**: Comprehensive audit trails and compliance tracking
- **Scalable**: Optimized indexes and designed for horizontal scaling
- **GDPR-compliant**: Built-in data retention, consent management, and privacy controls

## Schema Components

### 1. Core User Management (`001_core_user_management.sql`)

#### Tables

**`user_profiles`**
- Extends Supabase auth.users with additional profile information
- Stores display preferences, timezone, locale settings
- Tracks onboarding progress and verification status
- **Key Features**: Auto-created on user signup, timezone-aware, customizable preferences

**`user_preferences`**
- Flexible key-value store for user settings
- Categorized preferences (notifications, privacy, appearance)
- **Usage**: `category='notifications', key='email_marketing', value='{"enabled": true}'`

**`user_sessions`**
- Tracks active user sessions across devices
- Device fingerprinting and location tracking
- **Security**: Enables session management and suspicious activity detection

**`roles` & `user_roles`**
- Hierarchical role-based access control (RBAC)
- System roles (super_admin, admin, user, viewer) with custom permissions
- **Flexibility**: JSON-based permissions for granular control

#### Key Functions
- `handle_new_user()`: Auto-creates user profile on signup
- `update_updated_at_column()`: Maintains updated_at timestamps

### 2. Subscription & Billing (`002_subscription_billing.sql`)

#### Tables

**`subscription_plans`**
- Defines available subscription tiers
- Feature limits stored as JSON for flexibility
- **Plan Types**: free, basic, premium, enterprise, custom

**`subscriptions`**
- User subscription state and billing cycles
- Stripe integration ready with webhook support
- **Features**: Trial periods, proration, quantity-based pricing

**`payment_methods`**
- Secure payment method storage
- Multi-provider support (Stripe, PayPal, etc.)
- **Security**: Only stores tokenized references, never raw card data

**`invoices` & `invoice_line_items`**
- Complete invoicing system with line-item detail
- PDF generation and hosted invoice URLs
- **Compliance**: Audit-ready with proper numbering

**`payment_transactions`**
- Transaction history with detailed status tracking
- Refund and chargeback handling
- **Integration**: Links to Stripe payment intents and charges

**`usage_records`**
- Usage-based billing support
- Tracks API calls, storage, bandwidth, etc.
- **Aggregation**: Daily/monthly rollups for billing

**`coupons` & `coupon_redemptions`**
- Discount and promotion management
- Usage limits and expiration handling
- **Flexibility**: Percentage or fixed-amount discounts

#### Key Functions
- `generate_invoice_number()`: Sequential invoice numbering
- Comprehensive RLS policies for financial data protection

### 3. Team & Organization Structure (`003_team_organization.sql`)

#### Tables

**`organizations`**
- Top-level tenant entities
- Billing and subscription management
- **Features**: Custom domains, branding, settings

**`organization_members`**
- User membership in organizations
- Role-based permissions (owner, admin, member, guest)
- **Tracking**: Invitation history and activity monitoring

**`teams`**
- Project-based team organization
- **Types**: general, project, department, temporary
- **Privacy**: public, private, secret visibility levels

**`team_members`**
- Team membership with role assignments
- **Roles**: lead, member, contributor

**`workspaces`**
- Project containers within teams
- **Organization**: Hierarchical structure with folders
- **Access Control**: Granular permissions per workspace

**`workspace_members`**
- Fine-grained workspace access control
- **Roles**: owner, admin, editor, viewer

**`invitations`**
- Unified invitation system for orgs, teams, workspaces
- **Security**: Token-based with expiration
- **UX**: Personal messages and role pre-assignment

**`activities`**
- Activity feed for collaboration
- **Scope**: Organization, team, and workspace level
- **Rich Context**: Detailed action descriptions with metadata

#### Key Functions
- `add_organization_owner()`: Auto-assigns creator as owner
- `add_team_lead()`: Auto-assigns creator as team lead
- `generate_invitation_token()`: Secure invitation tokens
- `log_activity()`: Centralized activity logging

### 4. Analytics & Tracking (`004_analytics_tracking.sql`)

#### Tables

**`events`**
- Core event tracking for user behavior
- **Categories**: navigation, engagement, conversion
- **Context**: UTM parameters, device info, geolocation

**`feature_usage`**
- Feature adoption and usage metrics
- **Aggregation**: Daily rollups per user/organization
- **Success Tracking**: Error rates and completion metrics

**`page_views`**
- Detailed page navigation tracking
- **Performance**: Load times and engagement metrics
- **Behavior**: Bounce rates and exit pages

**`user_engagement_daily`**
- Daily user engagement aggregates
- **Metrics**: Session duration, page views, feature usage
- **Retention**: Activity patterns and user lifecycle

**`organization_metrics_daily`**
- Organization-level daily metrics
- **Business Intelligence**: Revenue, usage, growth metrics
- **Resource Tracking**: API calls, storage, bandwidth

**`conversion_funnels` & `conversion_funnel_events`**
- Conversion tracking and optimization
- **Flexibility**: Multi-step funnel definitions
- **Analysis**: Step completion rates and drop-off points

**`experiments` & `experiment_assignments`**
- A/B testing framework
- **Features**: Traffic allocation, variant assignment
- **Metrics**: Success criteria and statistical significance

**`performance_metrics`**
- Application performance monitoring
- **Types**: API response times, database queries, page loads
- **Alerting**: Performance degradation detection

**`error_logs`**
- Comprehensive error tracking
- **Categorization**: JavaScript, API, database, validation errors
- **Resolution**: Assignment and tracking workflow

#### Key Functions
- `track_event()`: Simplified event logging
- `track_feature_usage()`: Feature usage with aggregation
- `log_error()`: Structured error logging

### 5. Audit & Security (`005_audit_security.sql`)

#### Tables

**`audit_logs`**
- Complete audit trail for all data changes
- **Compliance**: GDPR, SOX, HIPAA ready
- **Detail**: Before/after values and change tracking

**`security_events`**
- Security incident tracking and monitoring
- **Categories**: authentication, authorization, data access
- **Severity**: Automated threat detection and alerting

**`api_keys` & `api_key_usage`**
- API access management and monitoring
- **Security**: Hashed storage, IP restrictions, rate limiting
- **Analytics**: Usage patterns and performance metrics

**`login_attempts`**
- Authentication attempt logging
- **Security**: Brute force detection, geo-blocking
- **Analysis**: Success rates and attack patterns

**`password_history`**
- Password reuse prevention
- **Compliance**: Configurable history depth
- **Security**: Hashed storage only

**`data_retention_requests`**
- GDPR compliance for data subject requests
- **Types**: export, deletion, anonymization
- **Workflow**: Request processing and verification

**`compliance_events`**
- Regulatory compliance tracking
- **Standards**: GDPR, CCPA, HIPAA support
- **Documentation**: Legal basis and evidence storage

**`user_consents`**
- Consent management for privacy compliance
- **Granular**: Purpose-specific consent tracking
- **Lifecycle**: Given, withdrawn, expired states

**`security_policies`**
- Configurable security policy management
- **Types**: password, session, API, data access policies
- **Enforcement**: Organization-level customization

#### Key Functions
- `create_audit_log()`: Automatic audit trail generation
- `log_security_event()`: Security event logging
- `generate_api_key()`: Secure API key generation
- `hash_api_key()`: API key hashing for storage

## Row Level Security (RLS) Implementation

### Security Model
- **User Isolation**: Users can only access their own data
- **Organization Boundaries**: Members can access organization data based on roles
- **Hierarchical Access**: Organization admins can access team and workspace data
- **Audit Transparency**: Users can see audit logs of their own actions

### Key Policies
- `select_own`: Users can read their own records
- `select_org_member`: Organization members can read shared data
- `select_admin`: Admins can read organization-wide data
- `insert_own`: Users can create records they own
- `update_own`: Users can modify their own records

## Indexes and Performance

### Time-Series Optimization
- Partitioning strategy for large tables (events, audit_logs)
- Composite indexes on user_id + timestamp
- Specialized indexes for analytics queries

### Query Patterns
- User dashboard queries: Optimized for single-user data access
- Organization analytics: Efficient aggregation across members
- Audit queries: Fast lookups by table, user, and time range

## Integration Points

### Supabase Integration
- Built on Supabase auth.users foundation
- RLS policies integrate with auth.uid()
- Trigger-based profile creation
- Middleware-ready session management

### External Services
- **Stripe**: Complete webhook integration for billing
- **Analytics**: Event tracking for business intelligence
- **Monitoring**: Performance and error tracking
- **Compliance**: GDPR and privacy regulation support

## Migration Strategy

### Deployment Order
1. **Core User Management**: Foundation tables and auth integration
2. **Subscription & Billing**: Payment and subscription infrastructure
3. **Team & Organization**: Multi-tenant collaboration features
4. **Analytics & Tracking**: Business intelligence and monitoring
5. **Audit & Security**: Compliance and security hardening

### Data Migration
- Existing user data can be migrated to user_profiles
- Subscription data can be imported from existing billing systems
- Analytics data can be backfilled from existing tracking

## Maintenance and Monitoring

### Regular Tasks
- **Audit Log Cleanup**: Archive old audit records based on retention policies
- **Session Cleanup**: Remove expired sessions and tokens
- **Analytics Aggregation**: Daily/monthly rollup processing
- **Security Monitoring**: Review failed login attempts and security events

### Performance Monitoring
- Query performance analysis on time-series tables
- Index usage monitoring and optimization
- RLS policy performance evaluation
- Storage growth tracking and archival planning

## Security Considerations

### Data Protection
- All sensitive data encrypted at rest
- API keys stored as hashes only
- Payment information tokenized through providers
- Personal data clearly identified for GDPR compliance

### Access Control
- Principle of least privilege throughout
- Role-based access with granular permissions
- API rate limiting and IP restrictions
- Session management with timeout controls

### Compliance Features
- Complete audit trails for all data changes
- Consent management for privacy regulations
- Data retention and deletion workflows
- Security incident tracking and response

## Usage Examples

### Creating a New Organization
\`\`\`sql
-- Organization is created with auto-assigned owner
INSERT INTO organizations (name, slug) VALUES ('Acme Corp', 'acme-corp');
-- Creator automatically becomes owner via trigger
\`\`\`

### Tracking Feature Usage
\`\`\`sql
-- Track feature usage with automatic aggregation
SELECT track_feature_usage('dashboard', 'core', 'view', org_id, 120);
\`\`\`

### Logging Security Events
\`\`\`sql
-- Log failed login attempt
SELECT log_security_event(
  'login_attempt', 'authentication', 'medium',
  'password_login', false, 'invalid_password'
);
\`\`\`

### Querying Analytics
\`\`\`sql
-- Get organization daily metrics
SELECT * FROM organization_metrics_daily 
WHERE organization_id = $1 
AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date;
\`\`\`

This schema provides a solid foundation for a modern SaaS application with enterprise-grade features, security, and compliance capabilities.
