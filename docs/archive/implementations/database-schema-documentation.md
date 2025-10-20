# Nino Wash Database Schema Documentation

## Overview

This database schema is designed for Nino Wash, a premium laundry and pressing service. The schema is built on PostgreSQL with Supabase and implements Row Level Security (RLS) throughout.

## Architecture Principles

- **Security-first**: Row Level Security (RLS) on all tables with granular permissions
- **Audit-ready**: Comprehensive audit trails and compliance tracking
- **Scalable**: Optimized indexes and designed for horizontal scaling
- **GDPR-compliant**: Built-in data retention, consent management, and privacy controls

## Core Tables

### Services Management

#### `service_categories`
Defines the two main service categories offered by Nino Wash.

**Columns**:
- `id`: UUID primary key
- `name`: Category name
- `description`: Category description
- `icon`: Icon identifier
- `sort_order`: Display order

**Categories**:
1. **Service Classique** - 72h processing time
2. **Service Express** - 24h processing time

#### `services`
Contains the four main services offered to non-subscribed customers.

**Columns**:
- `id`: UUID primary key
- `code`: Unique service code (e.g., `CLASSIC_WASH_FOLD`)
- `name`: Service name
- `description`: Detailed description
- `type`: Service type (`one_time` for pay-per-use services)
- `base_price`: Base price in euros
- `vat_rate`: VAT rate (20%)
- `processing_days`: Number of processing days
- `category`: Service category (links to service_categories)
- `is_active`: Active/inactive status
- `metadata`: JSON metadata (weight, inclusions, delivery time)

**Available Services**:

1. **CLASSIC_WASH_FOLD** - Nettoyage et pliage (24,99€, 72h)
2. **CLASSIC_WASH_IRON_FOLD** - Nettoyage, repassage et pliage (29,99€, 72h)
3. **EXPRESS_WASH_FOLD** - Nettoyage et pliage (34,99€, 24h)
4. **EXPRESS_WASH_IRON_FOLD** - Nettoyage, repassage et pliage (39,99€, 24h)

### User Management

#### `users`
Core user authentication and profile information (extends Supabase auth.users).

#### `user_addresses`
Stores pickup and delivery addresses for users.

**Columns**:
- `id`: UUID primary key
- `user_id`: Foreign key to users
- `label`: Address label (e.g., "Domicile", "Bureau")
- `street_address`: Street address
- `postal_code`: Postal code
- `city`: City
- `coordinates`: Geographic coordinates (POINT type)
- `is_default`: Default address flag

### Booking Management

#### `bookings`
Main table for service reservations.

**Columns**:
- `id`: UUID primary key
- `booking_number`: Unique booking reference (e.g., NW20250129001)
- `user_id`: Foreign key to users
- `service_id`: Foreign key to services
- `pickup_address_id`: Foreign key to user_addresses
- `delivery_address_id`: Foreign key to user_addresses
- `pickup_date`: Scheduled pickup date
- `delivery_date`: Scheduled delivery date
- `status`: Booking status (pending, confirmed, in_progress, completed, cancelled)
- `subtotal`: Subtotal before VAT
- `total_amount`: Total amount including VAT
- `payment_status`: Payment status (pending, paid, refunded)

#### `booking_items`
Line items for each booking (allows multiple services per booking).

**Columns**:
- `id`: UUID primary key
- `booking_id`: Foreign key to bookings
- `service_id`: Foreign key to services
- `quantity`: Quantity of service
- `unit_price`: Price per unit
- `subtotal`: Line item subtotal

### Subscription Management

#### `subscription_plans`
Defines available subscription tiers.

**Plans**:
- **Monthly** - 2 pickups per week
- **Quarterly** - 3 pickups per week

#### `subscriptions`
User subscription state and billing cycles.

## Row Level Security (RLS)

### Security Model
- **User Isolation**: Users can only access their own data
- **Admin Access**: Admins can access all data for management purposes
- **Audit Transparency**: Users can see audit logs of their own actions

### Key Policies
- `select_own`: Users can read their own records
- `insert_own`: Users can create records they own
- `update_own`: Users can modify their own records

## API Endpoints

### `/api/services`
Returns active services grouped by category.

**Response**:
\`\`\`json
{
  "services": {
    "Service Classique": [...],
    "Service Express": [...]
  }
}
\`\`\`

## Migration Scripts

### Execution Order
1. `01-core-schema.sql` - Core tables and RLS policies
2. `02-seed-initial-data.sql` - Initial data seeding
3. `07-update-services-real-offer.sql` - Real service offer (replaces old data)

### Latest Migration: Real Service Offer
The script `07-update-services-real-offer.sql` updates the database to reflect the actual Nino Wash service offering:
- Removes old/test services
- Creates 2 service categories (Classique, Express)
- Inserts 4 real services
- Cleans up obsolete service options

## Maintenance

### Regular Tasks
- **Booking Cleanup**: Archive completed bookings
- **Session Cleanup**: Remove expired sessions
- **Analytics Aggregation**: Daily/monthly rollup processing

### Performance Monitoring
- Query performance on time-series tables
- Index usage monitoring
- Storage growth tracking

## Security Considerations

### Data Protection
- All sensitive data encrypted at rest
- Payment information tokenized through providers
- Personal data clearly identified for GDPR compliance

### Access Control
- Role-based access with granular permissions
- API rate limiting
- Session management with timeout controls

For detailed service information, see `docs/services-documentation.md`.
