-- Sprint P2: Enhanced Subscription and Billing Management
-- This script adds missing constraints and indexes to existing subscription tables

-- Subscription plans indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_public ON subscription_plans(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_subscription_plans_billing_interval ON subscription_plans(billing_interval);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_type ON subscription_plans(plan_type);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Invoice line items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_subscription_id ON invoice_line_items(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_plan_id ON invoice_line_items(plan_id);

-- Payment methods indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_payment_methods_provider ON payment_methods(provider);

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_payment_intent_id ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);

-- Usage records indexes
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_subscription_id ON usage_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_metric_name ON usage_records(metric_name);
CREATE INDEX IF NOT EXISTS idx_usage_records_billing_period ON usage_records(billing_period_start, billing_period_end);

-- Coupons indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);

-- Coupon redemptions indexes
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id ON coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_subscription_id ON coupon_redemptions(subscription_id);

-- Add constraints using DO blocks
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_subscription_plans_billing_interval') THEN
    ALTER TABLE subscription_plans
      ADD CONSTRAINT chk_subscription_plans_billing_interval
      CHECK (billing_interval IN ('monthly', 'yearly', 'quarterly', 'weekly'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_subscription_plans_price_positive') THEN
    ALTER TABLE subscription_plans
      ADD CONSTRAINT chk_subscription_plans_price_positive
      CHECK (price_amount >= 0);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_subscriptions_status') THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT chk_subscriptions_status
      CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_invoices_status') THEN
    ALTER TABLE invoices
      ADD CONSTRAINT chk_invoices_status
      CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payment_transactions_status') THEN
    ALTER TABLE payment_transactions
      ADD CONSTRAINT chk_payment_transactions_status
      CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payment_transactions_amount_positive') THEN
    ALTER TABLE payment_transactions
      ADD CONSTRAINT chk_payment_transactions_amount_positive
      CHECK (amount >= 0);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_coupons_discount_type') THEN
    ALTER TABLE coupons
      ADD CONSTRAINT chk_coupons_discount_type
      CHECK (discount_type IN ('percentage', 'fixed_amount'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_coupons_discount_value_positive') THEN
    ALTER TABLE coupons
      ADD CONSTRAINT chk_coupons_discount_value_positive
      CHECK (discount_value > 0);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_coupons_code') THEN
    ALTER TABLE coupons
      ADD CONSTRAINT uq_coupons_code UNIQUE (code);
  END IF;
END $$;
