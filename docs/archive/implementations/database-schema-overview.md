# Database Schema Overview

This document provides a comprehensive overview of the database schema for the SaaS application, organized by sprint and feature area.

## Schema Organization

The database schema is organized into the following sprints:

### Sprint P0: Core Authentication and User Management
- **users**: Core user accounts with authentication details
- **user_profiles**: Extended user profile information
- **user_sessions**: Active user sessions for security tracking
- **user_preferences**: User-specific preferences and settings
- **user_addresses**: User delivery and billing addresses

### Sprint P1: Multi-Tenancy (Organizations, Workspaces, Teams)
- **organizations**: Top-level tenant entities
- **organization_members**: User membership in organizations with roles
- **workspaces**: Project/workspace containers within organizations
- **workspace_members**: User membership in workspaces with roles
- **teams**: Collaborative groups within organizations
- **team_members**: User membership in teams with roles

### Sprint P2: Subscription and Billing Management
- **subscription_plans**: Available subscription tiers and pricing
- **subscriptions**: Active user/organization subscriptions
- **invoices**: Billing invoices for subscriptions
- **invoice_line_items**: Detailed line items for invoices
- **payment_methods**: Stored payment methods for users
- **payment_transactions**: Payment transaction history
- **usage_records**: Usage-based billing records
- **coupons**: Discount coupons and promotional codes
- **coupon_redemptions**: Coupon usage tracking

### Sprint P3: Role-Based Access Control (RBAC)
- **roles**: System and custom roles
- **permissions**: Granular permissions for resources
- **role_permissions**: Junction table linking roles to permissions
- **user_roles**: User role assignments

### Sprint P4: Audit Logging and Activity Tracking
- **activities**: Comprehensive audit log of user actions
- **error_logs**: Application error tracking
- **events**: Custom event tracking
- **page_views**: Page view analytics
- **feature_usage**: Feature usage tracking
- **user_engagement_daily**: Daily user engagement metrics
- **organization_metrics_daily**: Daily organization-level metrics
- **performance_metrics**: Application performance metrics

### Sprint P5: Advanced Features
- **api_keys**: API key management for programmatic access
- **api_key_usage**: API key usage logs
- **webhooks**: Webhook endpoint configurations
- **webhook_deliveries**: Webhook delivery attempts and status
- **notifications**: In-app notifications
- **notification_preferences**: User notification preferences
- **email_queue**: Email delivery queue
- **invitations**: User invitation system
- **system_settings**: Global system configuration

## Application-Specific Tables

The following tables are specific to the Nino Wash application:

- **services**: Laundry and pressing services offered
- **service_categories**: Service categorization
- **service_options**: Additional service options (express, eco-friendly, etc.)
- **service_service_options**: Junction table for services and options
- **bookings**: Customer service bookings
- **booking_items**: Individual items in a booking
- **delivery_drivers**: Driver management
- **delivery_assignments**: Driver assignment to bookings
- **loyalty_rewards**: Customer loyalty program
- **conversion_funnels**: Marketing funnel tracking
- **conversion_funnel_events**: Funnel event tracking
- **experiments**: A/B testing experiments
- **experiment_assignments**: User experiment assignments

## Key Design Patterns

### 1. Multi-Tenancy
The schema supports multi-level tenancy:
- Organizations (top level)
- Workspaces (project level)
- Teams (collaboration level)

### 2. Soft Deletes
Many tables include `deleted_at` and `archived_at` columns for soft deletion.

### 3. Audit Trail
Comprehensive tracking with:
- `created_at`, `updated_at` timestamps
- `created_by`, `updated_by` user references
- Full activity logging in the `activities` table

### 4. Flexible Metadata
JSONB columns (`metadata`, `settings`, `properties`) allow for flexible schema evolution.

### 5. Performance Optimization
- Strategic indexes on foreign keys and frequently queried columns
- Composite indexes for common query patterns
- Partial indexes for filtered queries

### 6. Data Integrity
- Foreign key constraints with appropriate CASCADE/SET NULL actions
- Check constraints for enum-like values
- Unique constraints for business logic enforcement

## Security Considerations

1. **Row Level Security (RLS)**: Should be implemented for Supabase tables
2. **API Keys**: Stored as hashed values, never plain text
3. **Webhook Secrets**: Encrypted webhook secrets for secure delivery
4. **Session Management**: Secure session tracking with expiration
5. **Audit Logging**: Comprehensive activity tracking for compliance

## Indexing Strategy

Indexes are created for:
- All foreign keys
- Frequently filtered columns (status, is_active, etc.)
- Timestamp columns used in range queries
- Composite indexes for common join patterns
- Partial indexes for filtered queries (e.g., WHERE is_active = true)

## Migration Strategy

Migrations are organized by sprint and feature:
1. Run migrations in order (P0 → P5)
2. Each migration is idempotent (safe to run multiple times)
3. Migrations include both schema changes and data seeding
4. Use version numbers for tracking (e.g., p0-01, p0-02)

## Next Steps

1. Implement Row Level Security (RLS) policies for Supabase
2. Create database views for common queries
3. Set up database backup and recovery procedures
4. Implement database monitoring and alerting
5. Create stored procedures for complex operations
6. Set up database replication for high availability
