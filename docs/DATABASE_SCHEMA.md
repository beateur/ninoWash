# Database Schema Documentation

## Overview

This document provides comprehensive documentation for the SaaS application database schema. The schema is designed to support a multi-tenant SaaS platform with authentication, subscriptions, RBAC, analytics, and business-specific features.

**Database Type:** PostgreSQL  
**Total Tables:** 48  
**Schema Categories:** 8  
**Integrations:** Supabase + Neon

## Schema Categories

### 1. Authentication & Users

Core user management and authentication system.

#### Tables

**users**
- Primary user accounts table
- Columns: `id`, `email`, `password_hash`, `auth_provider`, `email_verified`, `phone_verified`, `status`, `role`
- Supports multiple auth providers (email/password, OAuth)
- Soft delete with `deleted_at`

**user_profiles**
- Extended user profile information
- Columns: `id`, `first_name`, `last_name`, `display_name`, `avatar_url`, `bio`, `timezone`, `locale`
- One-to-one relationship with users
- Stores preferences like date/time format

**user_sessions**
- Active session tracking
- Columns: `id`, `user_id`, `session_token`, `expires_at`, `ip_address`, `device_info`, `location`
- Enables multi-device session management
- Tracks device fingerprints and geolocation

**user_preferences**
- Flexible key-value preference storage
- Columns: `id`, `user_id`, `category`, `key`, `value` (JSONB)
- Allows extensible user settings without schema changes

### 2. Multi-Tenancy

Organization-based multi-tenancy with teams and workspaces.

#### Tables

**organizations**
- Top-level tenant entities
- Columns: `id`, `name`, `slug`, `logo_url`, `subscription_id`, `billing_email`, `settings` (JSONB)
- Each organization has one subscription
- Supports soft delete and archival

**organization_members**
- User membership in organizations
- Columns: `id`, `organization_id`, `user_id`, `role`, `permissions` (JSONB), `is_active`
- Many-to-many relationship between users and organizations
- Tracks invitation and join dates

**teams**
- Sub-groups within organizations
- Columns: `id`, `organization_id`, `name`, `description`, `privacy_level`, `settings` (JSONB)
- Supports public, private, and secret teams
- Can be archived without deletion

**team_members**
- User membership in teams
- Columns: `id`, `team_id`, `user_id`, `role`, `permissions` (JSONB)
- Tracks who added the member and when they left

**workspaces**
- Isolated work environments
- Columns: `id`, `organization_id`, `name`, `slug`, `visibility`, `settings` (JSONB)
- Can belong to a specific team
- Supports different visibility levels

**workspace_members**
- User access to workspaces
- Columns: `id`, `workspace_id`, `user_id`, `role`, `permissions` (JSONB)
- Fine-grained access control per workspace

### 3. RBAC & Permissions

Role-based access control system.

#### Tables

**roles**
- Role definitions
- Columns: `id`, `name`, `description`, `permissions` (JSONB), `is_system_role`
- System roles cannot be deleted
- Permissions stored as flexible JSONB

**user_roles**
- Role assignments to users
- Columns: `id`, `user_id`, `role_id`, `assigned_by`, `assigned_at`, `expires_at`
- Supports temporary role assignments
- Tracks who assigned the role

**invitations**
- Pending invitations
- Columns: `id`, `invitee_email`, `role`, `status`, `token`, `expires_at`, `organization_id`, `team_id`, `workspace_id`
- Supports invitations to organizations, teams, or workspaces
- Tracks acceptance, decline, and revocation

### 4. Billing & Subscriptions

Complete billing system with Stripe integration.

#### Tables

**subscription_plans**
- Available subscription tiers
- Columns: `id`, `name`, `price_amount`, `billing_interval`, `features` (JSONB), `is_active`, `is_public`
- Supports monthly/yearly billing
- Features stored as JSONB for flexibility

**subscriptions**
- Active subscriptions
- Columns: `id`, `user_id`, `plan_id`, `status`, `stripe_subscription_id`, `current_period_start`, `current_period_end`, `cancel_at_period_end`
- Syncs with Stripe via `stripe_subscription_id`
- Supports trials and cancellations

**invoices**
- Billing invoices
- Columns: `id`, `subscription_id`, `user_id`, `total_amount`, `status`, `stripe_invoice_id`, `paid_at`
- Links to Stripe invoices
- Tracks payment status and amounts

**invoice_line_items**
- Invoice line items
- Columns: `id`, `invoice_id`, `description`, `amount`, `quantity`, `proration`
- Supports prorated charges
- Links to subscription and plan

**payment_methods**
- Stored payment methods
- Columns: `id`, `user_id`, `type`, `provider_payment_method_id`, `card_brand`, `card_last4`, `is_default`
- Stores tokenized payment methods
- Supports multiple payment methods per user

**payment_transactions**
- Payment transaction history
- Columns: `id`, `user_id`, `amount`, `status`, `stripe_payment_intent_id`, `receipt_url`
- Complete audit trail of payments
- Links to invoices and subscriptions

**coupons**
- Discount coupons
- Columns: `id`, `code`, `discount_type`, `discount_value`, `valid_from`, `valid_until`, `max_redemptions`
- Supports percentage and fixed discounts
- Can be limited to specific plans

**coupon_redemptions**
- Coupon usage tracking
- Columns: `id`, `coupon_id`, `user_id`, `subscription_id`, `discount_amount`, `redeemed_at`
- Tracks who used which coupons
- Prevents duplicate redemptions

**usage_records**
- Usage-based billing
- Columns: `id`, `subscription_id`, `metric_name`, `quantity`, `unit_price`, `billing_period_start`
- Supports metered billing
- Aggregates usage per billing period

### 5. Analytics & Tracking

Comprehensive analytics and event tracking.

#### Tables

**events**
- User interaction events
- Columns: `id`, `user_id`, `event_name`, `event_category`, `event_action`, `properties` (JSONB), `timestamp`, `utm_source`
- Tracks all user interactions
- Includes UTM parameters for attribution

**page_views**
- Page view tracking
- Columns: `id`, `session_id`, `page_url`, `page_title`, `load_time_ms`, `time_on_page_seconds`, `bounce`
- Performance monitoring
- Tracks user navigation patterns

**feature_usage**
- Feature adoption tracking
- Columns: `id`, `user_id`, `feature_name`, `feature_category`, `usage_count`, `success`, `duration_seconds`
- Identifies popular features
- Tracks feature success rates

**user_engagement_daily**
- Daily user engagement aggregates
- Columns: `id`, `user_id`, `date`, `session_count`, `page_views`, `features_used`, `actions_performed`
- Pre-aggregated for performance
- Enables quick engagement reports

**organization_metrics_daily**
- Daily organization metrics
- Columns: `id`, `organization_id`, `date`, `active_users`, `new_users`, `revenue_generated`, `api_calls`
- Organization-level analytics
- Tracks growth and usage

**conversion_funnels**
- Funnel definitions
- Columns: `id`, `name`, `description`, `steps` (JSONB), `is_active`
- Define conversion paths
- Flexible step configuration

**conversion_funnel_events**
- Funnel progress tracking
- Columns: `id`, `funnel_id`, `user_id`, `step_name`, `step_order`, `completed`, `completion_time_seconds`
- Tracks user progress through funnels
- Measures conversion rates

**experiments**
- A/B test configurations
- Columns: `id`, `name`, `description`, `variants` (JSONB), `status`, `start_date`, `end_date`
- Supports multiple variants
- Tracks experiment lifecycle

**experiment_assignments**
- User variant assignments
- Columns: `id`, `experiment_id`, `user_id`, `variant_name`, `assigned_at`
- Ensures consistent variant assignment
- Enables experiment analysis

### 6. Audit & Monitoring

System audit logs and error tracking.

#### Tables

**activities**
- Audit log
- Columns: `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `entity_name`, `description`, `metadata` (JSONB), `ip_address`
- Complete audit trail
- Tracks all important actions

**error_logs**
- Application error tracking
- Columns: `id`, `user_id`, `error_type`, `error_message`, `error_stack`, `error_code`, `resolved`, `resolved_by`
- Centralized error logging
- Tracks error resolution

**performance_metrics**
- System performance monitoring
- Columns: `id`, `metric_name`, `metric_type`, `value`, `unit`, `timestamp`, `tags` (JSONB)
- Custom performance metrics
- Flexible tagging system

### 7. Business Domain

Application-specific business logic (Laundry/Pressing Service).

#### Tables

**services**
- Service catalog
- Columns: `id`, `name`, `code`, `type`, `base_price`, `processing_days`, `min_items`, `max_items`
- Defines available services
- Pricing and capacity management

**service_categories**
- Service categorization
- Columns: `id`, `name`, `description`, `icon`, `sort_order`, `is_active`
- Organizes services
- Controls display order

**service_options**
- Service add-ons
- Columns: `id`, `name`, `code`, `price`, `category`, `description`
- Additional service options
- Can be required or optional

**service_service_options**
- Service-option relationships
- Columns: `id`, `service_id`, `service_option_id`, `is_required`
- Links services to available options
- Defines required vs optional

**bookings**
- Customer bookings
- Columns: `id`, `user_id`, `service_id`, `booking_number`, `status`, `total_amount`, `pickup_date`, `delivery_date`
- Core booking entity
- Tracks entire booking lifecycle

**booking_items**
- Individual booking items
- Columns: `id`, `booking_id`, `service_id`, `quantity`, `unit_price`, `total_price`, `item_description`
- Line items for bookings
- Supports multiple items per booking

**user_addresses**
- Customer addresses
- Columns: `id`, `user_id`, `label`, `street_address`, `city`, `postal_code`, `coordinates`, `is_default`
- Supports multiple addresses
- Geolocation for routing

**delivery_drivers**
- Driver profiles
- Columns: `id`, `user_id`, `vehicle_type`, `license_plate`, `is_available`, `rating`, `total_deliveries`
- Driver management
- Tracks availability and performance

**delivery_assignments**
- Driver-booking assignments
- Columns: `id`, `booking_id`, `driver_id`, `assignment_type`, `status`, `assigned_at`, `completed_at`
- Manages delivery logistics
- Tracks assignment lifecycle

**loyalty_rewards**
- Customer loyalty program
- Columns: `id`, `user_id`, `completed_orders`, `free_collections_earned`, `free_collections_used`
- Rewards tracking
- Incentivizes repeat business

### 8. System Configuration

Application-wide settings.

#### Tables

**system_settings**
- Global configuration
- Columns: `id`, `key`, `value` (JSONB), `category`, `description`, `is_public`
- Flexible configuration storage
- Can be public or admin-only

## Key Design Patterns

### 1. UUID Primary Keys
All tables use UUID (`uuid`) for primary keys instead of auto-incrementing integers. Benefits:
- Better distribution in distributed systems
- No sequential ID enumeration attacks
- Easier data migration and replication

### 2. Soft Deletes
Many tables include `deleted_at` timestamp columns:
- Enables data recovery
- Maintains referential integrity
- Supports audit requirements

### 3. Audit Timestamps
Standard `created_at` and `updated_at` columns:
- Tracks record lifecycle
- Enables temporal queries
- Supports compliance requirements

### 4. JSONB Metadata
Flexible `metadata`, `settings`, and `properties` columns:
- Extensibility without schema changes
- Stores variable attributes
- Enables feature flags and configuration

### 5. Multi-Tenancy Isolation
Organization-based data isolation:
- Every tenant-specific table links to `organization_id`
- Row-level security (RLS) policies enforce isolation
- Shared infrastructure with logical separation

### 6. Stripe Integration
Billing tables store Stripe IDs:
- `stripe_customer_id`, `stripe_subscription_id`, `stripe_invoice_id`
- Enables webhook synchronization
- Maintains local cache of Stripe data

### 7. Permissions as JSONB
Role and member tables use JSONB for permissions:
- Flexible permission structure
- No schema changes for new permissions
- Supports complex permission hierarchies

## Key Relationships

### User → Organization (Many-to-Many)
\`\`\`
users ←→ organization_members ←→ organizations
\`\`\`
Users can belong to multiple organizations with different roles.

### Organization → Subscription (One-to-One)
\`\`\`
organizations → subscriptions → subscription_plans
\`\`\`
Each organization has one active subscription.

### User → Subscription (One-to-Many)
\`\`\`
users → subscriptions → subscription_plans
\`\`\`
Users can have personal subscriptions separate from organization subscriptions.

### Subscription → Invoices (One-to-Many)
\`\`\`
subscriptions → invoices → invoice_line_items
\`\`\`
Subscriptions generate invoices over time with detailed line items.

### User → Roles (Many-to-Many)
\`\`\`
users ←→ user_roles ←→ roles
\`\`\`
Users can have multiple roles with optional expiration dates.

### Organization → Teams → Workspaces
\`\`\`
organizations → teams → workspaces
\`\`\`
Hierarchical structure for organizing work.

## Indexes and Performance

### Recommended Indexes

**users table:**
- `email` (unique)
- `auth_provider_id` (for OAuth lookups)
- `status` (for filtering active users)

**organization_members table:**
- `(organization_id, user_id)` (composite unique)
- `user_id` (for user's organizations lookup)
- `is_active` (for filtering active members)

**subscriptions table:**
- `user_id` (for user's subscriptions)
- `stripe_subscription_id` (unique, for webhook lookups)
- `status` (for filtering active subscriptions)
- `current_period_end` (for renewal processing)

**events table:**
- `user_id` (for user event history)
- `organization_id` (for org analytics)
- `timestamp` (for time-based queries)
- `event_name` (for event type filtering)

**activities table:**
- `actor_id` (for user activity history)
- `organization_id` (for org audit logs)
- `created_at` (for time-based queries)
- `entity_type, entity_id` (composite, for entity audit trail)

## Security Considerations

### Row-Level Security (RLS)
Implement RLS policies on all tenant-specific tables:
- Users can only access their own data
- Organization members can only access their organization's data
- Admins have elevated access within their organization

### Password Security
- Passwords stored as bcrypt hashes in `password_hash`
- Never store plain text passwords
- Implement password complexity requirements

### Session Management
- Sessions expire after inactivity
- Track device fingerprints for anomaly detection
- Support session revocation

### API Keys and Tokens
- Store hashed tokens, not plain text
- Implement token rotation
- Track token usage in audit logs

## Migration Strategy

### Adding New Tables
1. Create migration script in `scripts/` folder
2. Include foreign key constraints
3. Add appropriate indexes
4. Update RLS policies if needed

### Modifying Existing Tables
1. Never drop columns (use soft deprecation)
2. Add new columns as nullable initially
3. Backfill data if needed
4. Make non-nullable after backfill

### Data Migrations
1. Test on staging environment first
2. Use transactions for atomicity
3. Create rollback scripts
4. Monitor performance impact

## Backup and Recovery

### Backup Strategy
- Daily automated backups
- Point-in-time recovery enabled
- Test restore procedures regularly
- Store backups in separate region

### Disaster Recovery
- Maintain up-to-date schema documentation
- Keep migration scripts in version control
- Document restore procedures
- Test failover scenarios

## Monitoring and Maintenance

### Performance Monitoring
- Track slow queries
- Monitor table sizes and growth
- Analyze index usage
- Review query plans regularly

### Maintenance Tasks
- Vacuum and analyze tables regularly
- Update statistics for query planner
- Archive old data (events, logs)
- Rotate audit logs

## Future Enhancements

### Potential Additions
1. **Notifications System**: Add tables for in-app notifications and email queues
2. **File Storage**: Add tables for file metadata and storage references
3. **API Keys**: Add tables for API key management and rate limiting
4. **Webhooks**: Add tables for webhook subscriptions and delivery logs
5. **Integrations**: Add tables for third-party integrations and OAuth tokens

### Scalability Considerations
1. **Partitioning**: Consider partitioning large tables (events, activities) by date
2. **Read Replicas**: Use read replicas for analytics queries
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Archival**: Move old data to cold storage (S3, Glacier)

## Conclusion

This database schema provides a solid foundation for a multi-tenant SaaS application with comprehensive features including authentication, billing, analytics, and business-specific functionality. The design follows PostgreSQL best practices and is optimized for both performance and maintainability.
