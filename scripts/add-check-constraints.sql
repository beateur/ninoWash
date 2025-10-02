-- ============================================================================
-- Add Check Constraints
-- ============================================================================
-- This script adds check constraints for data validation
-- ============================================================================

-- User Constraints
-- ============================================================================

ALTER TABLE users 
  ADD CONSTRAINT chk_users_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users 
  ADD CONSTRAINT chk_users_status 
  CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'));

ALTER TABLE users 
  ADD CONSTRAINT chk_users_role 
  CHECK (role IN ('admin', 'user', 'driver', 'staff'));

-- Subscription Constraints
-- ============================================================================

ALTER TABLE subscription_plans 
  ADD CONSTRAINT chk_plans_price_positive 
  CHECK (price_amount >= 0);

ALTER TABLE subscription_plans 
  ADD CONSTRAINT chk_plans_trial_days_positive 
  CHECK (trial_days >= 0);

ALTER TABLE subscription_plans 
  ADD CONSTRAINT chk_plans_billing_interval 
  CHECK (billing_interval IN ('monthly', 'yearly', 'lifetime'));

ALTER TABLE subscriptions 
  ADD CONSTRAINT chk_subscriptions_status 
  CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'));

ALTER TABLE subscriptions 
  ADD CONSTRAINT chk_subscriptions_period 
  CHECK (current_period_end > current_period_start);

ALTER TABLE subscriptions 
  ADD CONSTRAINT chk_subscriptions_trial_period 
  CHECK (trial_end IS NULL OR trial_end > trial_start);

ALTER TABLE subscriptions 
  ADD CONSTRAINT chk_subscriptions_quantity_positive 
  CHECK (quantity > 0);

ALTER TABLE subscriptions 
  ADD CONSTRAINT chk_subscriptions_amounts_positive 
  CHECK (total_amount >= 0 AND discount_amount >= 0 AND tax_amount >= 0);

-- Invoice Constraints
-- ============================================================================

ALTER TABLE invoices 
  ADD CONSTRAINT chk_invoices_status 
  CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible'));

ALTER TABLE invoices 
  ADD CONSTRAINT chk_invoices_amounts_positive 
  CHECK (
    subtotal >= 0 AND 
    tax_amount >= 0 AND 
    discount_amount >= 0 AND 
    total_amount >= 0 AND 
    amount_paid >= 0 AND 
    amount_due >= 0
  );

ALTER TABLE invoices 
  ADD CONSTRAINT chk_invoices_total_calculation 
  CHECK (total_amount = subtotal + tax_amount - discount_amount);

ALTER TABLE invoice_line_items 
  ADD CONSTRAINT chk_invoice_line_items_quantity_positive 
  CHECK (quantity > 0);

ALTER TABLE invoice_line_items 
  ADD CONSTRAINT chk_invoice_line_items_amounts_positive 
  CHECK (unit_amount >= 0 AND amount >= 0);

-- Payment Constraints
-- ============================================================================

ALTER TABLE payment_methods 
  ADD CONSTRAINT chk_payment_methods_type 
  CHECK (type IN ('card', 'bank_account', 'paypal', 'sepa_debit'));

ALTER TABLE payment_methods 
  ADD CONSTRAINT chk_payment_methods_card_exp_month 
  CHECK (card_exp_month IS NULL OR (card_exp_month >= 1 AND card_exp_month <= 12));

ALTER TABLE payment_methods 
  ADD CONSTRAINT chk_payment_methods_card_exp_year 
  CHECK (card_exp_year IS NULL OR card_exp_year >= 2020);

ALTER TABLE payment_transactions 
  ADD CONSTRAINT chk_payment_transactions_type 
  CHECK (transaction_type IN ('charge', 'refund', 'payout', 'adjustment'));

ALTER TABLE payment_transactions 
  ADD CONSTRAINT chk_payment_transactions_status 
  CHECK (status IN ('succeeded', 'failed', 'pending', 'canceled'));

ALTER TABLE payment_transactions 
  ADD CONSTRAINT chk_payment_transactions_amount_positive 
  CHECK (amount >= 0);

-- Coupon Constraints
-- ============================================================================

ALTER TABLE coupons 
  ADD CONSTRAINT chk_coupons_discount_type 
  CHECK (discount_type IN ('percentage', 'fixed_amount'));

ALTER TABLE coupons 
  ADD CONSTRAINT chk_coupons_discount_value_positive 
  CHECK (discount_value > 0);

ALTER TABLE coupons 
  ADD CONSTRAINT chk_coupons_percentage_range 
  CHECK (discount_type != 'percentage' OR (discount_value > 0 AND discount_value <= 100));

ALTER TABLE coupons 
  ADD CONSTRAINT chk_coupons_valid_period 
  CHECK (valid_until IS NULL OR valid_until > valid_from);

ALTER TABLE coupons 
  ADD CONSTRAINT chk_coupons_redemptions 
  CHECK (max_redemptions IS NULL OR max_redemptions > 0);

ALTER TABLE coupons 
  ADD CONSTRAINT chk_coupons_times_redeemed 
  CHECK (times_redeemed >= 0);

-- Booking Constraints
-- ============================================================================

ALTER TABLE bookings 
  ADD CONSTRAINT chk_bookings_status 
  CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'canceled'));

ALTER TABLE bookings 
  ADD CONSTRAINT chk_bookings_payment_status 
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

ALTER TABLE bookings 
  ADD CONSTRAINT chk_bookings_urgency_level 
  CHECK (urgency_level IN ('standard', 'express', 'urgent'));

ALTER TABLE bookings 
  ADD CONSTRAINT chk_bookings_delivery_after_pickup 
  CHECK (delivery_date >= pickup_date);

ALTER TABLE bookings 
  ADD CONSTRAINT chk_bookings_items_positive 
  CHECK (estimated_items IS NULL OR estimated_items > 0);

ALTER TABLE bookings 
  ADD CONSTRAINT chk_bookings_amounts_positive 
  CHECK (
    subtotal >= 0 AND 
    options_total >= 0 AND 
    discount_amount >= 0 AND 
    vat_amount >= 0 AND 
    total_amount >= 0
  );

ALTER TABLE booking_items 
  ADD CONSTRAINT chk_booking_items_quantity_positive 
  CHECK (quantity > 0);

ALTER TABLE booking_items 
  ADD CONSTRAINT chk_booking_items_prices_positive 
  CHECK (unit_price >= 0 AND total_price >= 0);

-- Service Constraints
-- ============================================================================

ALTER TABLE services 
  ADD CONSTRAINT chk_services_base_price_positive 
  CHECK (base_price >= 0);

ALTER TABLE services 
  ADD CONSTRAINT chk_services_vat_rate_valid 
  CHECK (vat_rate >= 0 AND vat_rate <= 100);

ALTER TABLE services 
  ADD CONSTRAINT chk_services_items_range 
  CHECK (
    (min_items IS NULL AND max_items IS NULL) OR 
    (min_items IS NOT NULL AND max_items IS NOT NULL AND max_items >= min_items)
  );

ALTER TABLE services 
  ADD CONSTRAINT chk_services_processing_days_positive 
  CHECK (processing_days IS NULL OR processing_days > 0);

ALTER TABLE service_options 
  ADD CONSTRAINT chk_service_options_price_positive 
  CHECK (price >= 0);

-- Delivery Constraints
-- ============================================================================

ALTER TABLE delivery_drivers 
  ADD CONSTRAINT chk_delivery_drivers_rating_range 
  CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

ALTER TABLE delivery_drivers 
  ADD CONSTRAINT chk_delivery_drivers_capacity_positive 
  CHECK (max_capacity IS NULL OR max_capacity > 0);

ALTER TABLE delivery_drivers 
  ADD CONSTRAINT chk_delivery_drivers_deliveries_positive 
  CHECK (total_deliveries >= 0);

ALTER TABLE delivery_assignments 
  ADD CONSTRAINT chk_delivery_assignments_type 
  CHECK (assignment_type IN ('pickup', 'delivery'));

ALTER TABLE delivery_assignments 
  ADD CONSTRAINT chk_delivery_assignments_status 
  CHECK (status IN ('assigned', 'in_progress', 'completed', 'failed'));

ALTER TABLE delivery_assignments 
  ADD CONSTRAINT chk_delivery_assignments_timeline 
  CHECK (
    (started_at IS NULL OR started_at >= assigned_at) AND
    (completed_at IS NULL OR completed_at >= assigned_at)
  );

-- Loyalty Rewards Constraints
-- ============================================================================

ALTER TABLE loyalty_rewards 
  ADD CONSTRAINT chk_loyalty_rewards_positive 
  CHECK (
    completed_orders >= 0 AND 
    free_collections_earned >= 0 AND 
    free_collections_used >= 0
  );

ALTER TABLE loyalty_rewards 
  ADD CONSTRAINT chk_loyalty_rewards_used_not_exceed_earned 
  CHECK (free_collections_used <= free_collections_earned);

-- Notification Constraints
-- ============================================================================

ALTER TABLE notifications 
  ADD CONSTRAINT chk_notifications_priority 
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

ALTER TABLE email_queue 
  ADD CONSTRAINT chk_email_queue_status 
  CHECK (status IN ('pending', 'sent', 'failed', 'canceled'));

ALTER TABLE email_queue 
  ADD CONSTRAINT chk_email_queue_priority_range 
  CHECK (priority >= 0 AND priority <= 10);

ALTER TABLE email_queue 
  ADD CONSTRAINT chk_email_queue_attempts 
  CHECK (attempt_count >= 0 AND attempt_count <= max_attempts);

-- API & Webhook Constraints
-- ============================================================================

ALTER TABLE api_key_usage 
  ADD CONSTRAINT chk_api_key_usage_status_code 
  CHECK (status_code >= 100 AND status_code < 600);

ALTER TABLE api_key_usage 
  ADD CONSTRAINT chk_api_key_usage_response_time_positive 
  CHECK (response_time_ms >= 0);

ALTER TABLE webhook_deliveries 
  ADD CONSTRAINT chk_webhook_deliveries_status 
  CHECK (status IN ('pending', 'delivered', 'failed', 'canceled'));

ALTER TABLE webhook_deliveries 
  ADD CONSTRAINT chk_webhook_deliveries_http_status 
  CHECK (http_status_code IS NULL OR (http_status_code >= 100 AND http_status_code < 600));

ALTER TABLE webhook_deliveries 
  ADD CONSTRAINT chk_webhook_deliveries_attempt_positive 
  CHECK (attempt_number > 0);

-- Experiment Constraints
-- ============================================================================

ALTER TABLE experiments 
  ADD CONSTRAINT chk_experiments_status 
  CHECK (status IN ('draft', 'running', 'completed', 'archived'));

ALTER TABLE experiments 
  ADD CONSTRAINT chk_experiments_traffic_allocation 
  CHECK (traffic_allocation >= 0 AND traffic_allocation <= 100);

ALTER TABLE experiments 
  ADD CONSTRAINT chk_experiments_dates 
  CHECK (end_date IS NULL OR end_date > start_date);

-- Error Log Constraints
-- ============================================================================

ALTER TABLE error_logs 
  ADD CONSTRAINT chk_error_logs_level 
  CHECK (error_level IN ('debug', 'info', 'warning', 'error', 'critical'));

-- ============================================================================
-- Check Constraints Added Successfully
-- ============================================================================
