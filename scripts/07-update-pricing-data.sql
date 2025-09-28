-- Update pricing data to match new specifications
-- Sprint: Updated pricing structure

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

-- Insert detailed service items for the catalog
INSERT INTO services (code, name, description, type, base_price, vat_rate, min_items, max_items, processing_days, metadata) VALUES
-- Cleaning services
('shirt_cleaning', 'Chemise', 'Nettoyage professionnel de chemise', 'one_time', 3.50, 20.00, 1, NULL, 2, '{"category": "cleaning", "unit": "piece"}'),
('suit_cleaning', 'Costume', 'Nettoyage complet de costume (veste + pantalon)', 'one_time', 12.00, 20.00, 1, NULL, 2, '{"category": "cleaning", "unit": "piece"}'),
('dress_cleaning', 'Robe', 'Nettoyage professionnel de robe', 'one_time', 8.00, 20.00, 1, NULL, 2, '{"category": "cleaning", "unit": "piece"}'),
('coat_cleaning', 'Manteau', 'Nettoyage de manteau ou veste longue', 'one_time', 15.00, 20.00, 1, NULL, 3, '{"category": "cleaning", "unit": "piece"}'),
('pants_cleaning', 'Pantalon', 'Nettoyage de pantalon', 'one_time', 6.00, 20.00, 1, NULL, 2, '{"category": "cleaning", "unit": "piece"}'),

-- Ironing services
('shirt_ironing', 'Repassage Chemise', 'Repassage professionnel de chemise', 'one_time', 2.50, 20.00, 1, NULL, 1, '{"category": "ironing", "unit": "piece"}'),
('pants_ironing', 'Repassage Pantalon', 'Repassage de pantalon', 'one_time', 3.00, 20.00, 1, NULL, 1, '{"category": "ironing", "unit": "piece"}'),
('dress_ironing', 'Repassage Robe', 'Repassage de robe', 'one_time', 4.00, 20.00, 1, NULL, 1, '{"category": "ironing", "unit": "piece"}'),

-- Special services
('leather_cleaning', 'Cuir', 'Nettoyage spécialisé cuir', 'one_time', 25.00, 20.00, 1, NULL, 5, '{"category": "special", "unit": "piece"}'),
('wedding_dress', 'Robe de Mariée', 'Nettoyage spécialisé robe de mariée', 'one_time', 80.00, 20.00, 1, NULL, 7, '{"category": "special", "unit": "piece"}'),
('curtains_cleaning', 'Rideaux', 'Nettoyage de rideaux', 'one_time', 12.00, 20.00, 1, NULL, 3, '{"category": "special", "unit": "piece"}'),
('blanket_cleaning', 'Couverture', 'Nettoyage de couverture ou édredon', 'one_time', 18.00, 20.00, 1, NULL, 3, '{"category": "special", "unit": "piece"}')

ON CONFLICT (code) DO UPDATE SET
  base_price = EXCLUDED.base_price,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = CURRENT_TIMESTAMP;

-- Update system settings with new pricing structure
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
    subscription_id UUID REFERENCES user_subscriptions(id),
    completed_orders INTEGER DEFAULT 0,
    free_collections_earned INTEGER DEFAULT 0,
    free_collections_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for loyalty rewards
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_user_id ON loyalty_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_subscription_id ON loyalty_rewards(subscription_id);

-- Function to update loyalty rewards
CREATE OR REPLACE FUNCTION update_loyalty_rewards()
RETURNS TRIGGER AS $$
BEGIN
    -- When a booking is completed, update loyalty rewards
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.subscription_id IS NOT NULL THEN
        INSERT INTO loyalty_rewards (user_id, subscription_id, completed_orders)
        VALUES (NEW.user_id, NEW.subscription_id, 1)
        ON CONFLICT (user_id, subscription_id) 
        DO UPDATE SET 
            completed_orders = loyalty_rewards.completed_orders + 1,
            free_collections_earned = CASE 
                WHEN (loyalty_rewards.completed_orders + 1) % 10 = 0 
                THEN loyalty_rewards.free_collections_earned + 1 
                ELSE loyalty_rewards.free_collections_earned 
            END,
            updated_at = CURRENT_TIMESTAMP;
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
