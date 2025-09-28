-- Fix pricing data and table inconsistencies
-- Sprint: Fixed database schema issues

-- Update existing services with new pricing
UPDATE services SET 
  base_price = 24.99,
  description = 'Service ponctuel - 24,99€ pour 8 kg (+1€/kg supplémentaire)'
WHERE code = 'classic';

UPDATE services SET 
  base_price = 99.99,
  description = 'Abonnement mensuel - 2 collectes par semaine avec tarifs préférentiels'
WHERE code = 'monthly_sub';

UPDATE services SET 
  base_price = 249.99,
  description = 'Abonnement trimestriel - 3 collectes par semaine avec tarifs préférentiels maximaux'
WHERE code = 'quarterly_sub';

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category VARCHAR(50),
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert system settings with new pricing structure
INSERT INTO system_settings (key, value, category, description, is_public) VALUES
('classic_service_pricing', '{"base_price": 24.99, "base_weight_kg": 8, "additional_price_per_kg": 1.00, "description": "24,99€ pour 8 kg, puis 1€ par kg supplémentaire"}', 'pricing', 'Classic service pricing structure', true),
('monthly_subscription_pricing', '{"price": 99.99, "collections_per_week": 2, "benefits": ["Tarifs préférentiels", "Priorité horaire", "1 collecte gratuite après 10 commandes"]}', 'pricing', 'Monthly subscription pricing and benefits', true),
('quarterly_subscription_pricing', '{"price": 249.99, "collections_per_week": 3, "benefits": ["Tarifs préférentiels maximaux", "Priorité horaire", "1 collecte gratuite après 10 commandes"]}', 'pricing', 'Quarterly subscription pricing and benefits', true)

ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = CURRENT_TIMESTAMP;

-- Create loyalty program tracking
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id),
    completed_orders INTEGER DEFAULT 0,
    free_collections_earned INTEGER DEFAULT 0,
    free_collections_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create indexes for loyalty rewards
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_user_id ON loyalty_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_booking_id ON loyalty_rewards(booking_id);

-- Function to update loyalty rewards for subscription users
CREATE OR REPLACE FUNCTION update_loyalty_rewards()
RETURNS TRIGGER AS $$
DECLARE
    user_service_type VARCHAR(20);
BEGIN
    -- When a booking is completed, update loyalty rewards for subscription users
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Check if this is a subscription service
        SELECT type INTO user_service_type FROM services WHERE id = NEW.service_id;
        
        IF user_service_type = 'subscription' THEN
            INSERT INTO loyalty_rewards (user_id, booking_id, completed_orders)
            VALUES (NEW.user_id, NEW.id, 1)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                completed_orders = loyalty_rewards.completed_orders + 1,
                free_collections_earned = CASE 
                    WHEN (loyalty_rewards.completed_orders + 1) % 10 = 0 
                    THEN loyalty_rewards.free_collections_earned + 1 
                    ELSE loyalty_rewards.free_collections_earned 
                END,
                updated_at = CURRENT_TIMESTAMP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loyalty rewards
DROP TRIGGER IF EXISTS update_loyalty_rewards_trigger ON bookings;
CREATE TRIGGER update_loyalty_rewards_trigger 
    AFTER UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_loyalty_rewards();

-- Add metadata to track subscription benefits in bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS subscription_benefits JSONB DEFAULT '{}';

-- Create trigger to update updated_at for system_settings
CREATE OR REPLACE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
